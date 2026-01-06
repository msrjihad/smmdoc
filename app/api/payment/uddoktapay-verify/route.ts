import { db } from '@/lib/db';
import { emailTemplates, transactionEmailTemplates } from '@/lib/email-templates';
import { sendMail } from '@/lib/nodemailer';
import { logSMS, sendSMS, smsTemplates } from '@/lib/sms';
import { sendTransactionSuccessNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice_id, transaction_id, phone, response_type } = body;
    
    console.log("UddoktaPay verify request:", { invoice_id, transaction_id, phone, response_type });
    
    if (!invoice_id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }
    
    const payment = await db.addFunds.findUnique({
      where: { invoiceId: invoice_id },
      include: { user: true }
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }
    
    if (payment.status === "Success") {
      return NextResponse.json({
        status: "COMPLETED",
        message: "Payment already verified and completed",
        payment: {
          invoice_id: payment.invoiceId,
          amount: payment.amount,
          status: payment.status,
          transaction_id: payment.transactionId
        }
      });
    }
    
    try {
      let verificationStatus = "PENDING";
      let isSuccessful = false;
      
      if (response_type) {
        const responseTypeLower = response_type.toLowerCase();
        
        if (responseTypeLower === "completed") {
          isSuccessful = true;
          verificationStatus = "COMPLETED";
        } else if (responseTypeLower === "pending") {
          verificationStatus = "PENDING";
        } else {
          verificationStatus = "CANCELLED";
        }
      } else {
        if (transaction_id) {
          const lowerTransactionId = transaction_id.toLowerCase();
          
          if (lowerTransactionId.includes("completed") || lowerTransactionId.includes("success")) {
            isSuccessful = true;
            verificationStatus = "COMPLETED";
          } else if (lowerTransactionId.includes("pending")) {
            verificationStatus = "PENDING";
          } else {
            verificationStatus = "CANCELLED";
          }
        }
      }
      
      console.log("UddoktaPay verification result:", { isSuccessful, verificationStatus, response_type });
      
      if (isSuccessful && verificationStatus === "COMPLETED" && payment.user) {
        try {
          await db.$transaction(async (prisma) => {
            await prisma.addFunds.update({
              where: { invoiceId: invoice_id },
              data: {
                status: "Success",
                transactionId: transaction_id,
              }
            });
            
            const originalAmount = Number(payment.amount) || 0;

            const userSettings = await prisma.userSettings.findFirst();
            let bonusAmount = 0;

            if (userSettings && userSettings.bonusPercentage > 0) {
              bonusAmount = (originalAmount * userSettings.bonusPercentage) / 100;
            }

            const totalAmountToAdd = originalAmount + bonusAmount;

            const user = await prisma.users.update({
              where: { id: payment.userId },
              data: {
                balance: { increment: totalAmountToAdd },
                balanceUSD: { increment: originalAmount },
                total_deposit: { increment: originalAmount }
              }
            });
            
            console.log(`User ${payment.userId} balance updated. New balance: ${user.balance}`);

            const updatedPayment = await prisma.addFunds.findUnique({
              where: { invoiceId: invoice_id },
            });

            if (updatedPayment) {
              try {
                await sendTransactionSuccessNotification(
                  payment.userId,
                  updatedPayment.id,
                  Number(payment.amount)
                );
              } catch (notifError) {
                console.error('Error sending transaction success notification:', notifError);
              }
            }
          });

          if (payment.user.email) {
            const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
            const supportEmail = await getSupportEmail();
            const whatsappNumber = await getWhatsAppNumber();
            
            const emailData = emailTemplates.paymentSuccess({
              userName: payment.user.name || 'Customer',
              userEmail: payment.user.email,
              transactionId: transaction_id,
              amount: (payment.amount || 0).toString(),
              currency: payment.currency || 'USD',
              date: new Date().toLocaleDateString(),
              userId: payment.userId.toString(),
              supportEmail: supportEmail,
              whatsappNumber: whatsappNumber,
            });
            
            await sendMail({
              sendTo: payment.user.email,
              subject: emailData.subject,
              html: emailData.html
            });
          }

          const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
          const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
          const supportEmail = await getSupportEmail();
          const whatsappNumber = await getWhatsAppNumber();
          
          const adminEmailData = transactionEmailTemplates.adminAutoApproved({
            userName: payment.user.name || 'Unknown User',
            userEmail: payment.user.email || '',
            transactionId: transaction_id,
            amount: payment.amount.toString(),
            currency: 'USD',
            date: new Date().toLocaleDateString(),
            userId: payment.userId.toString(),
            supportEmail: supportEmail,
            whatsappNumber: whatsappNumber,
          });
          
          await sendMail({
            sendTo: adminEmail,
            subject: adminEmailData.subject,
            html: adminEmailData.html
          });

          if (phone && payment.user) {
            const smsMessage = smsTemplates.paymentSuccess(
              payment.user.name || 'Customer',
              Number(payment.amount),
              transaction_id
            );

            const smsResult = await sendSMS({
              to: phone,
              message: smsMessage
            });

            await logSMS({
              userId: payment.userId.toString(),
              phone: phone,
              message: smsMessage,
              status: smsResult.success ? 'sent' : 'failed',
              messageId: smsResult.messageId,
              error: smsResult.error
            });
          }

          return NextResponse.json({
            status: "COMPLETED",
            message: "Payment successful! Funds have been added to your account.",
            payment: {
              invoice_id: payment.invoiceId,
              amount: payment.amount,
              status: "Success",
              transaction_id: transaction_id
            }
          });
        } catch (transactionError) {
          console.error("Error updating payment and user balance:", transactionError);
          return NextResponse.json(
            { error: "Failed to update payment status" },
            { status: 500 }
          );
        }
      } 
      
      else if (verificationStatus === "PENDING") {
        await db.addFunds.update({
          where: { invoiceId: invoice_id },
          data: {
            transactionId: transaction_id,
            status: "Processing"
          }
        });

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
        const supportEmail = await getSupportEmail();
        const whatsappNumber = await getWhatsAppNumber();
        
        const adminEmailData = emailTemplates.adminPendingReview({
          userName: payment.user?.name || 'Unknown User',
          userEmail: payment.user?.email || '',
          transactionId: transaction_id,
          amount: payment.amount.toString(),
          currency: 'BDT',
          date: new Date().toLocaleDateString(),
          userId: payment.userId.toString(),
          phone: phone,
          supportEmail: supportEmail,
          whatsappNumber: whatsappNumber,
        });
        
        await sendMail({
          sendTo: adminEmail,
          subject: adminEmailData.subject,
          html: adminEmailData.html
        });
        
        return NextResponse.json({
          status: "PENDING",
          message: "Payment is being processed and requires manual verification. You will be notified once approved.",
          payment: {
            invoice_id: payment.invoiceId,
            amount: payment.amount,
            status: "Processing",
            transaction_id: transaction_id
          }
        });
      } 
      
      else {
        await db.addFunds.update({
          where: { invoiceId: invoice_id },
          data: {
            status: "Cancelled",
            transactionId: transaction_id,
          }
        });
        
        return NextResponse.json({
          status: "CANCELLED",
          message: "Payment verification failed or was cancelled",
          payment: {
            invoice_id: payment.invoiceId,
            amount: payment.amount,
            status: "Cancelled",
            transaction_id: transaction_id
          }
        });
      }
    } catch (verificationError) {
      console.error("Payment verification error:", verificationError);
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying UddoktaPay payment:", error);
    return NextResponse.json(
      { error: "Payment verification failed", details: String(error) },
      { status: 500 }
    );
  }
}
