import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getPaymentGatewayName, getPaymentGatewayApiKey, getPaymentGatewayVerifyUrl } from '@/lib/payment-gateway-config';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let invoice_id: string | undefined;

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    invoice_id = body.invoice_id;

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    let existingPayment = await db.addFunds.findUnique({
      where: {
        invoiceId: invoice_id,
      },
    });

    if (existingPayment) {
      console.log(`Payment record already exists with invoice_id: ${invoice_id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment record already exists',
        payment: existingPayment,
      });
    }

    existingPayment = await db.addFunds.findFirst({
      where: {
        transactionId: invoice_id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingPayment) {
      console.log(`Found existing payment by transactionId: ${invoice_id}, updating with gateway data`);
      try {
        const apiKey = await getPaymentGatewayApiKey();
        const verifyUrl = await getPaymentGatewayVerifyUrl();

        let updateData: any = { invoiceId: invoice_id };

        if (apiKey && verifyUrl) {
          try {
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
              const verificationData: any = await verificationResponse.json();

              if (verificationData.transaction_id && verificationData.transaction_id !== invoice_id) {
                updateData.transactionId = verificationData.transaction_id;
              }

              if (verificationData.payment_method) {
                updateData.paymentMethod = verificationData.payment_method;
              }

              if (!existingPayment.paymentGateway) {
                const gatewayName = await getPaymentGatewayName();
                updateData.paymentGateway = gatewayName || 'unknown';
              }

              console.log('Updating existing payment with gateway data:', updateData);
            }
          } catch (gatewayError) {
            console.error('Error fetching gateway data for existing payment:', gatewayError);
          }
        }

        existingPayment = await db.addFunds.update({
          where: { id: existingPayment.id },
          data: updateData,
        });
        return NextResponse.json({
          success: true,
          message: 'Payment record found and updated with gateway data',
          payment: existingPayment,
        });
      } catch (updateError: any) {
        if (updateError.code === 'P2002') {
          const duplicatePayment = await db.addFunds.findUnique({
            where: { invoiceId: invoice_id },
          });
          if (duplicatePayment) {
            return NextResponse.json({
              success: true,
              message: 'Payment record already exists',
              payment: duplicatePayment,
            });
          }
        }
        throw updateError;
      }
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPayment = await db.addFunds.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: fiveMinutesAgo,
        },
        status: {
          in: ['Processing', 'PENDING', 'Pending'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentPayment) {
      console.log(`Found recent payment for user ${session.user.id}, might be duplicate. Recent payment invoice_id: ${recentPayment.invoiceId}`);

      if (recentPayment.invoiceId === invoice_id) {
        return NextResponse.json({
          success: true,
          message: 'Payment record already exists',
          payment: recentPayment,
        });
      }

      if (!recentPayment.invoiceId ||
          recentPayment.invoiceId.startsWith('ADMIN-') ||
          recentPayment.invoiceId === '0' ||
          recentPayment.invoiceId === '') {
        try {
          const apiKey = await getPaymentGatewayApiKey();
          const verifyUrl = await getPaymentGatewayVerifyUrl();

          let updateData: any = { invoiceId: invoice_id };

          if (apiKey && verifyUrl) {
            try {
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
                const verificationData: any = await verificationResponse.json();

                if (verificationData.transaction_id && verificationData.transaction_id !== invoice_id) {
                  updateData.transactionId = verificationData.transaction_id;
                }

                if (verificationData.payment_method) {
                  updateData.paymentMethod = verificationData.payment_method;
                }

                if (!recentPayment.paymentGateway) {
                  const gatewayName = await getPaymentGatewayName();
                  updateData.paymentGateway = gatewayName || 'unknown';
                }

                console.log('Updating recent payment with gateway data:', updateData);
              }
            } catch (gatewayError) {
              console.error('Error fetching gateway data for recent payment:', gatewayError);
            }
          }

          const updatedPayment = await db.addFunds.update({
            where: { id: recentPayment.id },
            data: updateData,
          });
          console.log(`Updated recent payment with invoice_id and gateway data: ${invoice_id}`);
          return NextResponse.json({
            success: true,
            message: 'Recent payment record updated with invoice_id and gateway data',
            payment: updatedPayment,
          });
        } catch (updateError: any) {
          if (updateError.code === 'P2002') {
            const duplicatePayment = await db.addFunds.findUnique({
              where: { invoiceId: invoice_id },
            });
            if (duplicatePayment) {
              return NextResponse.json({
                success: true,
                message: 'Payment record already exists',
                payment: duplicatePayment,
              });
            }
          }
          console.warn('Failed to update recent payment, will create new record:', updateError);
        }
      } else {
        console.log(`Recent payment has different invoice_id (${recentPayment.invoiceId}), not updating. Will create new record if needed.`);
      }
    }

    const user = await db.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const gatewayName = await getPaymentGatewayName();
    const apiKey = await getPaymentGatewayApiKey();
    const verifyUrl = await getPaymentGatewayVerifyUrl();

    let transactionId: string | null = null;
    let paymentMethod: string | null = null;
    let paymentAmount: string | null = null;
    let paymentStatus: string = 'Processing';

    if (apiKey && verifyUrl) {
      try {
        console.log(`Fetching payment data from gateway for invoice_id: ${invoice_id}`);
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
          const verificationData: any = await verificationResponse.json();
          console.log('Gateway verification response:', verificationData);

          if (verificationData.transaction_id && verificationData.transaction_id !== invoice_id) {
            transactionId = verificationData.transaction_id;
            console.log(`✓ Transaction ID extracted: ${transactionId}`);
          }

          if (verificationData.payment_method) {
            paymentMethod = verificationData.payment_method;
            console.log(`✓ Payment method extracted: ${paymentMethod}`);
          }

          if (verificationData.charged_amount) {
            paymentAmount = verificationData.charged_amount.toString();
          } else if (verificationData.amount) {
            paymentAmount = verificationData.amount.toString();
          }

          if (verificationData.status) {
            if (verificationData.status === 'COMPLETED' || verificationData.status === 'SUCCESS') {
              paymentStatus = 'Success';
            } else if (verificationData.status === 'PENDING') {
              paymentStatus = 'Processing';
            } else if (verificationData.status === 'CANCELLED' || verificationData.status === 'FAILED' || verificationData.status === 'ERROR') {
              paymentStatus = 'Cancelled';
            }
          }

          console.log('Mapped data from gateway:', {
            transaction_id: transactionId,
            payment_method: paymentMethod,
            amount: paymentAmount,
            status: paymentStatus,
          });
        } else {
          console.warn(`Gateway verification returned status ${verificationResponse.status}`);
        }
      } catch (gatewayError) {
        console.error('Error fetching data from gateway:', gatewayError);
      }
    } else {
      console.warn('Gateway API key or verify URL not configured, creating record without gateway data');
    }

    let finalCheck = await db.addFunds.findUnique({
      where: { invoiceId: invoice_id },
    });

    if (finalCheck) {
      console.log(`Payment record already exists (final check by invoiceId) with invoice_id: ${invoice_id}`);
      return NextResponse.json({
        success: true,
        message: 'Payment record already exists',
        payment: finalCheck,
      });
    }

    if (!paymentAmount || paymentAmount === '0' || paymentAmount === '0.00' || parseFloat(paymentAmount) <= 0) {
      console.error('Cannot create payment record with invalid amount:', {
        paymentAmount,
        invoice_id,
        userId: session.user.id
      });
      return NextResponse.json({
        success: false,
        error: 'Invalid payment amount. Cannot create payment record with 0 amount.',
        invoice_id
      }, { status: 400 });
    }

    let amountUSD: string = paymentAmount as string;
    if (paymentAmount && parseFloat(paymentAmount) > 100) {

      const { getPaymentGatewayExchangeRate } = await import('@/lib/payment-gateway-config');
      const exchangeRate = await getPaymentGatewayExchangeRate();
      const gatewayAmount = parseFloat(paymentAmount);
      const convertedUSD = gatewayAmount / exchangeRate;

      if (convertedUSD >= 1 && convertedUSD <= 10000) {
        amountUSD = convertedUSD.toFixed(2);
        console.log(`Converted gateway amount ${gatewayAmount} BDT to ${amountUSD} USD`);
      }
    }

    if (amountUSD && session.user.id) {
      const tenMinutesAgo = new Date(Date.now() - 600000);
      const amountToCheck = amountUSD;

      const duplicateCheck = await db.addFunds.findFirst({
        where: {
          userId: session.user.id,
          amount: amountToCheck,
          createdAt: { gte: tenMinutesAgo },

          invoiceId: { not: invoice_id },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (duplicateCheck) {
        console.log(`Duplicate payment detected by amount/user (ensure-record), updating existing record:`, {
          existingId: duplicateCheck.id,
          existingInvoiceId: duplicateCheck.invoiceId,
          existingStatus: duplicateCheck.status,
          newInvoiceId: invoice_id,
          newStatus: paymentStatus
        });

        let finalStatus = paymentStatus;
        if (duplicateCheck.status === 'Success' && paymentStatus !== 'Success') {
          finalStatus = 'Success';
          console.log("Keeping Success status, not downgrading to", paymentStatus);
        } else if (duplicateCheck.status === 'Processing' && paymentStatus === 'Success') {
          finalStatus = 'Success';
        }

        try {
          const updatedPayment = await db.addFunds.update({
            where: { id: duplicateCheck.id },
            data: {
              invoiceId: invoice_id,
              status: finalStatus,
              transactionId: transactionId || duplicateCheck.transactionId,
              paymentMethod: paymentMethod || duplicateCheck.paymentMethod,
              adminStatus: finalStatus === 'Success' ? 'Success' : finalStatus === 'Cancelled' ? 'Cancelled' : duplicateCheck.adminStatus || 'Pending',
            },
          });

          console.log(`Updated existing payment record instead of creating duplicate:`, updatedPayment.id);
          return NextResponse.json({
            success: true,
            message: 'Payment record updated (duplicate prevented)',
            payment: updatedPayment,
          });
        } catch (updateError) {
          console.error('Error updating duplicate payment record:', updateError);

        }
      }
    }

    if (paymentStatus === 'Success' && !transactionId) {
      console.error('Cannot create successful payment without transaction ID:', {
        invoice_id,
        paymentStatus,
        transactionId,
        userId: session.user.id
      });
      return NextResponse.json({
        success: false,
        error: 'Successful payments require a transaction ID. Payment record not created.',
        invoice_id
      }, { status: 400 });
    }

    if (paymentStatus === 'Cancelled' && !transactionId) {
      console.warn('Skipping creation of Cancelled payment without transaction ID:', invoice_id);
      return NextResponse.json({
        success: false,
        error: 'Cancelled payments without transaction ID are not created.',
        invoice_id
      }, { status: 400 });
    }

    try {
      const payment = await db.addFunds.create({
        data: {
          invoiceId: invoice_id,
          amount: amountUSD,
          gatewayAmount: paymentAmount && parseFloat(paymentAmount) > 100 ? parseFloat(paymentAmount) : null,
          email: user.email || '',
          name: user.name || '',
          status: paymentStatus,
          paymentGateway: gatewayName || 'unknown',
          paymentMethod: paymentMethod,
          transactionId: transactionId,
          userId: session.user.id,
          currency: 'USD',
        },
      });

      console.log(`✓ Payment record created with invoice_id: ${invoice_id} for user ${session.user.id}`, {
        transaction_id: transactionId,
        payment_method: paymentMethod,
        payment_gateway: gatewayName,
        amountUSD: amountUSD,
        gatewayAmount: paymentAmount
      });

      return NextResponse.json({
        success: true,
        message: 'Payment record created with data from gateway',
        payment: payment,
      });
    } catch (createError: any) {

      if (createError.code === 'P2002') {
        console.log(`Payment record already exists (caught in create) with invoice_id: ${invoice_id}`);
        const existingPayment = await db.addFunds.findUnique({
          where: { invoiceId: invoice_id },
        });
        if (existingPayment) {
          return NextResponse.json({
            success: true,
            message: 'Payment record already exists',
            payment: existingPayment,
          });
        }
      }
      throw createError;
    }

  } catch (error: any) {
    console.error('Error ensuring payment record:', error);

    if (error.code === 'P2002' && invoice_id) {
      try {
        const existingPayment = await db.addFunds.findUnique({
          where: {
            invoiceId: invoice_id,
          },
        });

        if (existingPayment) {
          return NextResponse.json({
            success: true,
            message: 'Payment record already exists',
            payment: existingPayment,
          });
        }
      } catch (lookupError) {
        console.error('Error looking up existing payment:', lookupError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to ensure payment record', details: String(error) },
      { status: 500 }
    );
  }
}

