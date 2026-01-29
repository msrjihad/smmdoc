import { db } from '@/lib/db';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { sendMail } from '@/lib/nodemailer';
import { sendTransactionSuccessNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice_id, transaction_id, phone } = body;

    console.log('Verify transaction request:', {
      invoice_id,
      transaction_id,
      phone,
    });

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const payment = await db.addFunds.findUnique({
      where: { invoiceId: invoice_id },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    if (payment.status === 'Success') {
      return NextResponse.json({
        status: 'COMPLETED',
        message: 'Payment already verified and completed',
        payment: {
          invoice_id: payment.invoiceId,
          amount: payment.amount,
          status: payment.status,
          transaction_id: payment.transactionId,
        },
      });
    }

    const { getPaymentGatewayApiKey, getPaymentGatewayVerifyUrl } = await import('@/lib/payment-gateway-config');
    const apiKey = await getPaymentGatewayApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Payment gateway API key not configured. Please configure it in admin settings.' },
        { status: 500 }
      );
    }

    try {
      const baseUrl = await getPaymentGatewayVerifyUrl();
      
      const verificationResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'RT-UDDOKTAPAY-API-KEY': apiKey,
        },
        body: JSON.stringify({ invoice_id }),
      });

      let isSuccessful = false;
      let verificationStatus = 'PENDING';
      let verificationData: any = null;
      let finalTransactionId = transaction_id;

      if (verificationResponse.ok) {
        verificationData = await verificationResponse.json();
        console.log('UddoktaPay verification response:', verificationData);

        if (verificationData.transaction_id) {
          finalTransactionId = verificationData.transaction_id;
        }

        if (
          verificationData.status === 'COMPLETED' ||
          verificationData.status === 'SUCCESS'
        ) {
          isSuccessful = true;
          verificationStatus = 'COMPLETED';
        } else if (verificationData.status === 'PENDING') {
          verificationStatus = 'PENDING';
        } else if (
          verificationData.status === 'CANCELLED' ||
          verificationData.status === 'FAILED' ||
          verificationData.status === 'ERROR'
        ) {
          verificationStatus = 'CANCELLED';
        } else {
          verificationStatus = 'PENDING';
        }
      } else {
        const errorText = await verificationResponse.text();
        console.error('UddoktaPay verification API error:', errorText);
        verificationStatus = 'PENDING';
      }

      console.log('Verification result:', { isSuccessful, verificationStatus });

      if (isSuccessful && payment.user) {
        try {
          await db.$transaction(async (prisma) => {
            await prisma.addFunds.update({
              where: { invoiceId: invoice_id },
              data: {
                status: 'Success',
                transactionId: finalTransactionId || payment.transactionId,
                paymentMethod: verificationData?.payment_method || payment.paymentMethod || 'UddoktaPay',
              },
            });

            const originalAmount = Number(payment.amount) || 0;

            const userSettings = await prisma.userSettings.findFirst();
            let bonusAmount = 0;

            if (userSettings && userSettings.bonusPercentage > 0) {
              bonusAmount =
                (originalAmount * userSettings.bonusPercentage) / 100;
            }

            const totalAmountToAdd = originalAmount + bonusAmount;

            const user = await prisma.users.update({
              where: { id: payment.userId },
              data: {
                balance: { increment: totalAmountToAdd },
                balanceUSD: { increment: originalAmount },
                total_deposit: { increment: originalAmount },
              },
            });

            console.log(
              `User ${payment.userId} balance updated. New balance: ${user.balance}. Original amount: ${originalAmount}, Bonus: ${bonusAmount}, Total added: ${totalAmountToAdd}`
            );

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
            const emailData = await resolveEmailContent(
              'transaction_payment_success',
              templateContextFromUser(payment.user)
            );
            if (emailData) {
              await sendMail({
                sendTo: payment.user.email,
                subject: emailData.subject,
                html: emailData.html,
                fromName: emailData.fromName ?? undefined,
              });
            }
          }

          const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
          const adminEmailData = await resolveEmailContent('transaction_admin_auto_approved');
          if (adminEmailData) {
            await sendMail({
              sendTo: adminEmail,
              subject: adminEmailData.subject,
              html: adminEmailData.html,
              fromName: adminEmailData.fromName ?? undefined,
            });
          }

          return NextResponse.json({
            status: 'COMPLETED',
            message: 'Payment verified and completed successfully',
            payment: {
              invoice_id: payment.invoiceId,
              amount: payment.amount,
              status: 'Success',
              transaction_id: finalTransactionId,
            },
          });
        } catch (transactionError) {
          console.error(
            'Error updating payment and user balance:',
            transactionError
          );
          return NextResponse.json(
            { error: 'Failed to update payment status' },
            { status: 500 }
          );
        }
      } else if (verificationStatus === 'PENDING') {
        await db.addFunds.update({
          where: { invoiceId: invoice_id },
          data: {
            transactionId: finalTransactionId,
          },
        });

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminEmailData = await resolveEmailContent('transaction_admin_pending_review');
        if (adminEmailData) {
          await sendMail({
            sendTo: adminEmail,
            subject: adminEmailData.subject,
            html: adminEmailData.html,
            fromName: adminEmailData.fromName ?? undefined,
          });
        }

        return NextResponse.json({
          status: 'PENDING',
          message: 'Payment is being processed. Please wait for verification.',
          payment: {
            invoice_id: payment.invoiceId,
            amount: payment.amount,
            status: 'Processing',
            transaction_id: finalTransactionId,
          },
        });
      } else {
        await db.addFunds.update({
          where: { invoiceId: invoice_id },
          data: {
            status: 'Cancelled',
            transactionId: finalTransactionId,
          },
        });

        return NextResponse.json({
          status: 'CANCELLED',
          message: 'Payment verification failed or was cancelled',
          payment: {
            invoice_id: payment.invoiceId,
            amount: payment.amount,
            status: 'Cancelled',
            transaction_id: finalTransactionId,
          },
        });
      }
    } catch (verificationError) {
      console.error('Payment verification error:', verificationError);
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', details: String(error) },
      { status: 500 }
    );
  }
}
