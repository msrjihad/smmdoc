import { db } from '@/lib/db';
import { emailTemplates, transactionEmailTemplates } from '@/lib/email-templates';
import { sendMail } from '@/lib/nodemailer';
import { logSMS, sendSMS, smsTemplates } from '@/lib/sms';
import { sendTransactionSuccessNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice_id, phone, response_type } = body;
    let transaction_id = body.transaction_id;
    
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
      // Call the gateway API to verify payment status
      const { getPaymentGatewayApiKey, getPaymentGatewayVerifyUrl } = await import('@/lib/payment-gateway-config');
      const apiKey = await getPaymentGatewayApiKey();
      const verifyUrl = await getPaymentGatewayVerifyUrl();
      
      let verificationStatus = "PENDING";
      let isSuccessful = false;
      let gatewayVerificationData: any = null;
      
      // First, try to verify with the gateway API
      if (apiKey && verifyUrl) {
        try {
          console.log(`Calling gateway verify API: ${verifyUrl} with invoice_id: ${invoice_id}`);
          const verificationResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'RT-UDDOKTAPAY-API-KEY': apiKey,
            },
            body: JSON.stringify({ invoice_id }),
          });

          if (verificationResponse.ok) {
            // Check if response is JSON before parsing
            const contentType = verificationResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              const responseText = await verificationResponse.text();
              console.error('Gateway verify API returned non-JSON:', {
                contentType,
                responsePreview: responseText.substring(0, 500),
                url: verifyUrl,
                invoice_id
              });
              throw new Error('NON_JSON_RESPONSE');
            }

            gatewayVerificationData = await verificationResponse.json();
            console.log('Gateway verification response:', gatewayVerificationData);
            
            // Use gateway API response status
            if (gatewayVerificationData.status === 'COMPLETED' || gatewayVerificationData.status === 'SUCCESS') {
              isSuccessful = true;
              verificationStatus = "COMPLETED";
            } else if (gatewayVerificationData.status === 'PENDING') {
              verificationStatus = "PENDING";
            } else if (gatewayVerificationData.status === 'CANCELLED' || gatewayVerificationData.status === 'FAILED' || gatewayVerificationData.status === 'ERROR') {
              verificationStatus = "CANCELLED";
            } else {
              verificationStatus = "PENDING";
            }
            
            // Update transaction_id from gateway response if available
            if (gatewayVerificationData.transaction_id && gatewayVerificationData.transaction_id !== invoice_id) {
              transaction_id = gatewayVerificationData.transaction_id;
            }
          } else {
            console.log('Gateway verification API returned error, falling back to request parameters');
            const errorText = await verificationResponse.text();
            console.log('Gateway error response:', errorText);
          }
        } catch (apiError) {
          console.error('Error calling gateway verify API:', apiError);
          // Fall through to use request parameters
        }
      }
      
      // Fallback to request parameters if gateway API didn't provide status
      if (!gatewayVerificationData && response_type) {
        const responseTypeLower = response_type.toLowerCase();
        
        if (responseTypeLower === "completed" || responseTypeLower === "success") {
          isSuccessful = true;
          verificationStatus = "COMPLETED";
        } else if (responseTypeLower === "pending") {
          verificationStatus = "PENDING";
        } else {
          verificationStatus = "CANCELLED";
        }
      } else if (!gatewayVerificationData && transaction_id) {
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
      
      console.log("UddoktaPay verification result:", { 
        isSuccessful, 
        verificationStatus, 
        response_type,
        gatewayStatus: gatewayVerificationData?.status,
        transaction_id 
      });
      
      if (isSuccessful && verificationStatus === "COMPLETED" && payment.user) {
        try {
          await db.$transaction(async (prisma) => {
            await prisma.addFunds.update({
              where: { invoiceId: invoice_id },
              data: {
                status: "Success",
                transactionId: transaction_id || gatewayVerificationData?.transaction_id || null,
                paymentMethod: gatewayVerificationData?.payment_method || payment.paymentMethod || null,
                gatewayFee: gatewayVerificationData?.fee !== undefined ? gatewayVerificationData.fee : payment.gatewayFee,
                // Don't update amount from gateway - gateway returns BDT, we store USD
                // Keep the original USD amount from payment record
                amount: payment.amount,
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
            transactionId: transaction_id || gatewayVerificationData?.transaction_id || null,
            paymentMethod: gatewayVerificationData?.payment_method || payment.paymentMethod || null,
            gatewayFee: gatewayVerificationData?.fee !== undefined ? gatewayVerificationData.fee : payment.gatewayFee,
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
            transactionId: transaction_id || gatewayVerificationData?.transaction_id || null,
            paymentMethod: gatewayVerificationData?.payment_method || payment.paymentMethod || null,
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
