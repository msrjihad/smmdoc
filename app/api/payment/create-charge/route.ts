
import { auth } from '@/auth';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  convertToUSD,
  fetchCurrencyData,
} from '@/lib/currency-utils';
import { db } from '@/lib/db';
import { getPaymentGatewayName, getPaymentGatewayExchangeRate } from '@/lib/payment-gateway-config';
import { sendTransactionPendingNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(req: NextRequest) {
  const requestOrigin =
    req.headers.get('origin') ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    '*';

  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': requestOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);

    if (!body.amount) {
      return NextResponse.json(
        { error: 'Amount is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { currencies } = await fetchCurrencyData();

    const amount = parseFloat(body.amount);
    const currency = body.currency || 'USD';

    console.log(
      'Parsed amount:',
      amount,
      'Currency:',
      currency,
      'Type:',
      typeof amount
    );

    if (isNaN(amount) || amount <= 0) {
      console.error('Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400, headers: corsHeaders }
      );
    }

    const amountUSD = convertToUSD(amount, currency, currencies);

    if (isNaN(amountUSD) || amountUSD <= 0) {
      console.error('Invalid converted USD amount:', amountUSD);
      return NextResponse.json(
        { error: 'Invalid amount conversion' },
        { status: 400, headers: corsHeaders }
      );
    }

    const exchangeRate = await getPaymentGatewayExchangeRate();
    const gatewayAmount = amountUSD * exchangeRate;

    console.log('Currency conversion:', {
      original: amount,
      currency: currency,
      amountUSD: amountUSD,
      gatewayAmount: gatewayAmount,
    });

    const gatewayName = await getPaymentGatewayName();

    try {
      const username =
        session.user.username ||
        session.user.email?.split('@')[0] ||
        `user${session.user.id}`;
      try {
        await ActivityLogger.fundAdded(
          session.user.id,
          username,
          amountUSD,
          'USD',
          gatewayName
        );
      } catch (error) {
        console.error('Failed to log payment creation activity:', error);
      }

      const { getPaymentGatewayApiKey, getPaymentGatewayCheckoutUrl } = await import('@/lib/payment-gateway-config');
      const apiKey = await getPaymentGatewayApiKey();
      const checkoutUrl = await getPaymentGatewayCheckoutUrl();

      const { getAppUrlWithPort } = await import('@/lib/utils/redirect-url');
      const appUrl = getAppUrlWithPort();

      console.log('App URL determined (with port fix):', appUrl);

      const paymentAmount = amountUSD * exchangeRate;

      const paymentData = {
        full_name: session.user.name || 'User',
        email: session.user.email || 'user@example.com',
        amount: Math.round(paymentAmount).toString(),
        phone: body.phone || '0000000000',
        metadata: {
          user_id: session.user.id,
          original_currency: currency,
          charged_amount: gatewayAmount,
          usd_amount: amountUSD,
        },
        redirect_url: `${appUrl}/transactions?payment=success`,
        cancel_url: `${appUrl}/transactions?payment=cancelled`,
        webhook_url: `${appUrl}/api/payment/webhook`,
      };

      console.log(
        'Payment data being sent:',
        JSON.stringify(paymentData, null, 2)
      );

      if (!apiKey) {
        return NextResponse.json(
          { error: 'Payment gateway API key not configured. Please configure it in admin settings.' },
          { status: 500, headers: corsHeaders }
        );
      }

      try {
        const requestId = body.requestId;
        const oneMinuteAgo = new Date(Date.now() - 60000);

        const amountStr = amountUSD.toFixed(2);

        const existingByInvoice = await db.addFunds.findFirst({
          where: {
            invoiceId: { contains: requestId || '' },
          },
        });


        const recentPayment = await db.addFunds.findFirst({
          where: {
            userId: session.user.id,
            amount: amountStr,
            createdAt: {
              gte: oneMinuteAgo,
            },
            status: {
              in: ['Processing', 'Success'],
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (existingByInvoice || recentPayment) {
          const existing = existingByInvoice || recentPayment;
          console.log('Duplicate payment attempt detected (BEFORE gateway call):', {
            userId: session.user.id,
            amount: amountUSD,
            existingInvoiceId: existing?.invoiceId,
            existingId: existing?.id,
            timeDiff: existing ? Date.now() - existing.createdAt.getTime() : 0,
            requestId: requestId,
          });
          return NextResponse.json(
            {
              error: 'Duplicate payment request detected. Please wait a moment and try again.',
              existingInvoiceId: existing?.invoiceId,
            },
            { status: 429, headers: corsHeaders }
          );
        }
      } catch (duplicateCheckError) {
        console.error('Error checking for duplicate payment:', duplicateCheckError);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(checkoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'RT-UDDOKTAPAY-API-KEY': apiKey,
          },
          signal: controller.signal,
          body: JSON.stringify({
            full_name: paymentData.full_name,
            email: paymentData.email,
            amount: paymentData.amount,
            phone: paymentData.phone,
            metadata: paymentData.metadata,
            redirect_url: paymentData.redirect_url,
            return_type: 'GET',
            cancel_url: paymentData.cancel_url,
            webhook_url: paymentData.webhook_url,
          }),
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          return NextResponse.json(
            { error: 'Invalid response from payment gateway' },
            { status: 500, headers: corsHeaders }
          );
        }

        console.log('Parsed response data:', data);
      console.log('Gateway response check:', {
        hasStatus: !!data.status,
        statusValue: data.status,
        hasPaymentUrl: !!data.payment_url,
        hasInvoiceId: !!data.invoice_id,
        invoiceIdFromResponse: data.invoice_id,
        allKeys: Object.keys(data),
        note: 'invoice_id will be in payment_url path and added to redirect URL by gateway when user returns'
      });

        if (data.status || data.payment_url) {
          let gatewayInvoiceId: string | null = null;


          if (data.invoice_id) {
            gatewayInvoiceId = data.invoice_id;
            console.log(`✓ Got invoice_id directly from gateway response: ${gatewayInvoiceId}`);
          }


          if (!gatewayInvoiceId && data.payment_url) {
            console.log('=== Extracting invoice_id from payment_url (for payment record creation) ===');
            console.log('Payment URL from gateway:', data.payment_url);
            console.log('Note: invoice_id is embedded in payment_url path. Gateway will add it to redirect URL when user returns.');

            try {
              const url = new URL(data.payment_url);
              const pathParts = url.pathname.split('/').filter(part => part.length > 0);



              const checkoutIndex = pathParts.findIndex(part => part === 'checkout');
              if (checkoutIndex >= 0 && checkoutIndex < pathParts.length - 1) {
                const nextPart = pathParts[checkoutIndex + 1];
                if (nextPart === 'payment' && checkoutIndex + 2 < pathParts.length) {
                  gatewayInvoiceId = pathParts[checkoutIndex + 2];
                  console.log(`✓ Extracted invoice_id from /checkout/payment/ path: ${gatewayInvoiceId}`);
                }
              }


              if (!gatewayInvoiceId) {
                const paymentIndex = pathParts.findIndex(part => part === 'payment');
                if (paymentIndex >= 0 && paymentIndex < pathParts.length - 1) {
                  gatewayInvoiceId = pathParts[paymentIndex + 1];
                  console.log(`✓ Extracted invoice_id from /payment/ path: ${gatewayInvoiceId}`);
                }
              }


              if (!gatewayInvoiceId && pathParts.length > 0) {
                const lastSegment = pathParts[pathParts.length - 1];

                if (lastSegment && lastSegment.length > 10 && /^[a-zA-Z0-9]+$/.test(lastSegment)) {
                  gatewayInvoiceId = lastSegment;
                  console.log(`✓ Extracted invoice_id from last path segment: ${gatewayInvoiceId}`);
                }
              }


              if (!gatewayInvoiceId) {
                gatewayInvoiceId = url.searchParams.get('invoice_id') ||
                                   url.searchParams.get('invoiceId') ||
                                   url.searchParams.get('invoice');
                if (gatewayInvoiceId) {
                  console.log(`✓ Extracted invoice_id from query params: ${gatewayInvoiceId}`);
                }
              }
            } catch (urlError) {
              console.error('Error parsing payment_url:', urlError);
            }
          }

          if (!gatewayInvoiceId) {
            console.error('Could not extract invoice_id from payment_url:', {
              paymentUrl: data.payment_url,
              response: data,
            });
            return NextResponse.json(
              {
                error: 'Gateway did not return invoice_id in payment_url',
                details: 'Unable to extract invoice_id from payment gateway response. The gateway will add invoice_id to the redirect URL when user returns from payment.',
                gatewayResponse: data
              },
              { status: 500, headers: corsHeaders }
            );
          }


          try {

            const existingPaymentCheck = await db.addFunds.findUnique({
              where: {
                invoiceId: gatewayInvoiceId,
              },
            });

            if (existingPaymentCheck) {
              console.log('Invoice ID already exists in database:', {
                invoiceId: gatewayInvoiceId,
                existingPaymentId: existingPaymentCheck.id,
                requestId: body.requestId,
              });
              return NextResponse.json(
                {
                  payment_url: data.payment_url,
                  invoice_id: gatewayInvoiceId,
                  note: 'Payment record already exists',
                },
                { status: 200, headers: corsHeaders }
              );
            }


            const payment = await db.$transaction(async (prisma) => {

              const existingInTransaction = await prisma.addFunds.findUnique({
                where: {
                  invoiceId: gatewayInvoiceId,
                },
              });

              if (existingInTransaction) {

                throw new Error('PAYMENT_EXISTS');
              }


              const thirtySecondsAgo = new Date(Date.now() - 30000);
              const amountStr = amountUSD.toFixed(2);
              const recentPayment = await prisma.addFunds.findFirst({
                where: {
                  userId: session.user.id,
                  amount: amountStr,
                  createdAt: {
                    gte: thirtySecondsAgo,
                  },
                  status: {
                    in: ['Processing', 'Success'],
                  },
                  invoiceId: {
                    not: gatewayInvoiceId,
                  },
                },
                orderBy: {
                  createdAt: 'desc',
                },
              });

              if (recentPayment) {
                console.log('Duplicate payment attempt detected (AFTER gateway call - race condition):', {
                  userId: session.user.id,
                  amount: amountUSD,
                  existingInvoiceId: recentPayment.invoiceId,
                  newInvoiceId: gatewayInvoiceId,
                  timeDiff: Date.now() - recentPayment.createdAt.getTime(),
                  requestId: body.requestId,
                });
                throw new Error('DUPLICATE_PAYMENT');
              }


              if (amountUSD <= 0 || isNaN(amountUSD)) {
                console.error('Attempted to create payment with invalid amount:', {
                  amountUSD,
                  originalAmount: amount,
                  currency,
                  gatewayInvoiceId
                });
                throw new Error('INVALID_AMOUNT');
              }

              const finalAmount = amountUSD.toFixed(2);



              console.log('Creating payment record with status: Processing', {
                invoiceId: gatewayInvoiceId,
                amount: finalAmount,
                userId: session.user.id,
              });


              const paymentRecord = await prisma.addFunds.create({
                data: {
                  invoiceId: gatewayInvoiceId,
                  amount: finalAmount,
                  gatewayAmount: gatewayAmount,
                  email: session.user.email || '',
                  name: session.user.name || '',
                  status: 'Processing',
                  paymentGateway: gatewayName,
                  userId: session.user.id,
                  currency: 'USD',
                },
              });

              console.log('Payment record created (inside transaction):', {
                id: paymentRecord.id,
                invoiceId: paymentRecord.invoiceId,
                status: paymentRecord.status,
                expectedStatus: 'Processing',
              });


              return paymentRecord;
            }, {
              timeout: 10000,
            });

            console.log(`✓ Payment record created with gateway invoice_id: ${gatewayInvoiceId}`);




            let finalPayment = payment;
            try {
              console.log('Forcing status to Processing after transaction commit:', {
                id: payment.id,
                invoiceId: payment.invoiceId,
                currentStatus: payment.status,
              });


              await db.$executeRaw`
                UPDATE add_funds
                SET status = 'Processing'
                WHERE id = ${payment.id}
              `;


              const updatedPayment = await db.addFunds.findUnique({
                where: { id: payment.id },
              });

              if (updatedPayment) {
                console.log('Status update result:', {
                  id: updatedPayment.id,
                  invoiceId: updatedPayment.invoiceId,
                  status: updatedPayment.status,
                  expectedStatus: 'Processing',
                });


                if (updatedPayment.status !== 'Processing') {
                  console.error('CRITICAL: Status still not Processing after update!', {
                    id: updatedPayment.id,
                    actualStatus: updatedPayment.status,
                  });


                  await db.$executeRawUnsafe(
                    `UPDATE add_funds SET status = 'Processing' WHERE id = ${updatedPayment.id}`
                  );

                  const retryPayment = await db.addFunds.findUnique({
                    where: { id: updatedPayment.id },
                  });

                  if (retryPayment && retryPayment.status === 'Processing') {
                    console.log('Status fixed on retry');
                    finalPayment = retryPayment;
                  } else {
                    console.error('FATAL: Unable to set status to Processing after multiple attempts');
                    finalPayment = updatedPayment;
                  }
                } else {
                  finalPayment = updatedPayment;
                }
              }
            } catch (statusUpdateError) {
              console.error('Error forcing status to Processing:', statusUpdateError);

            }


            const paymentToUse = finalPayment || payment;

            try {
              await sendTransactionPendingNotification(session.user.id, paymentToUse.id);
            } catch (notifError) {
              console.error('Error sending transaction pending notification:', notifError);
            }

            try {
              const { sendAdminPendingTransactionNotification } = await import('@/lib/notifications/admin-notifications');
              await sendAdminPendingTransactionNotification(
                paymentToUse.id,
                amountUSD,
                session.user.name || session.user.email || 'User'
              );
            } catch (adminNotifError) {
              console.error('Error sending admin pending transaction notification:', adminNotifError);
            }

            try {
              const username =
                session.user.username ||
                session.user.email?.split('@')[0] ||
                `user${session.user.id}`;
              await ActivityLogger.fundAdded(
                session.user.id,
                username,
                amountUSD,
                'USD',
                gatewayName
              );
            } catch (error) {
              console.error('Failed to log payment creation activity:', error);
            }
          } catch (createError: any) {
            console.error('Error creating payment record:', createError);


            if (createError.message === 'PAYMENT_EXISTS') {
              const existingPayment = await db.addFunds.findUnique({
                where: {
                  invoiceId: gatewayInvoiceId,
                },
              });

              if (existingPayment) {
                return NextResponse.json(
                  {
                    payment_url: data.payment_url,
                    invoice_id: gatewayInvoiceId,
                    note: 'Payment record already exists',
                  },
                  { status: 200, headers: corsHeaders }
                );
              }
            }


            if (createError.message === 'INVALID_AMOUNT') {
              return NextResponse.json(
                {
                  error: 'Invalid payment amount. Amount must be greater than 0.',
                },
                { status: 400, headers: corsHeaders }
              );
            }


            if (createError.message === 'DUPLICATE_PAYMENT') {
              return NextResponse.json(
                {
                  error: 'Duplicate payment request detected. Please wait a moment and try again.',
                },
                { status: 429, headers: corsHeaders }
              );
            }


            if (createError.code === 'P2002') {

              const existingPayment = await db.addFunds.findUnique({
                where: {
                  invoiceId: gatewayInvoiceId,
                },
              });

              if (existingPayment) {
                return NextResponse.json(
                  {
                    payment_url: data.payment_url,
                    invoice_id: gatewayInvoiceId,
                    note: 'Payment record already exists',
                  },
                  { status: 200, headers: corsHeaders }
                );
              }

              return NextResponse.json(
                { error: 'Invoice ID already exists. Please try again.' },
                { status: 409, headers: corsHeaders }
              );
            }

            return NextResponse.json(
              { error: 'Failed to create payment record', details: String(createError) },
              { status: 500, headers: corsHeaders }
            );
          }

          return NextResponse.json(
            {
              payment_url: data.payment_url,
              invoice_id: gatewayInvoiceId,
            },
            { status: 200, headers: corsHeaders }
          );
        } else {
          console.error('Gateway returned error or missing status:', {
            status: data.status,
            message: data.message,
            error: data.error,
            fullResponse: data,
          });
          return NextResponse.json(
            {
              error: data.message || data.error || 'Payment initialization failed',
              details: 'The payment gateway rejected the request. Please check your payment details and try again.',
              gatewayResponse: data
            },
            { status: 400, headers: corsHeaders }
          );
        }
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);

        let timeoutId: NodeJS.Timeout | null = null;
        if (timeoutId) clearTimeout(timeoutId);

        if ((fetchError as any)?.name === 'AbortError') {
          return NextResponse.json(
            { error: 'Payment gateway timeout. Please try again.' },
            { status: 408, headers: corsHeaders }
          );
        }

        return NextResponse.json(
          { error: 'Network error when connecting to payment gateway' },
          { status: 500, headers: corsHeaders }
        );
      }
    } catch (paymentError) {
      console.error('Payment gateway error:', paymentError);
      return NextResponse.json(
        { error: 'Payment gateway operation failed', details: String(paymentError) },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('Error creating payment:', error);

    if (error?.message === 'DUPLICATE_PAYMENT') {
      return NextResponse.json(
        {
          error: 'Duplicate payment request detected. Please wait a moment and try again.',
        },
        { status: 429, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create payment', details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}
