
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
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
      
      if (!appUrl) {
        return NextResponse.json(
          { error: 'NEXT_PUBLIC_APP_URL or NEXTAUTH_URL environment variable is required' },
          { status: 500, headers: corsHeaders }
        );
      }
      
      console.log('App URL determined:', appUrl);

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
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        const recentPayment = await db.addFunds.findFirst({
          where: {
            userId: session.user.id,
            amount: amountUSD.toString(),
            createdAt: {
              gte: thirtySecondsAgo,
            },
            status: 'Processing',
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (recentPayment) {
          console.log('Duplicate payment attempt detected (BEFORE gateway call):', {
            userId: session.user.id,
            amount: amountUSD,
            existingInvoiceId: recentPayment.invoiceId,
            timeDiff: Date.now() - recentPayment.createdAt.getTime(),
            requestId: body.requestId,
          });
          return NextResponse.json(
            { 
              error: 'Duplicate payment request detected. Please wait a moment and try again.',
              existingInvoiceId: recentPayment.invoiceId,
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
        allKeys: Object.keys(data),
        note: 'invoice_id will be in payment_url path and added to redirect URL by gateway when user returns'
      });

        if (data.status || data.payment_url) {
          let gatewayInvoiceId: string | null = null;
          
          if (data.payment_url) {
            console.log('=== Extracting invoice_id from payment_url (for payment record creation) ===');
            console.log('Payment URL from gateway:', data.payment_url);
            console.log('Note: invoice_id is embedded in payment_url path. Gateway will add it to redirect URL when user returns.');
            
            try {
              const url = new URL(data.payment_url);
              const pathParts = url.pathname.split('/').filter(part => part.length > 0);
              const paymentIndex = pathParts.findIndex(part => part === 'payment');
              
              if (paymentIndex >= 0 && paymentIndex < pathParts.length - 1) {
                gatewayInvoiceId = pathParts[paymentIndex + 1];
                console.log(`✓ Extracted invoice_id from payment_url path: ${gatewayInvoiceId}`);
              } else if (pathParts.length > 0) {
                gatewayInvoiceId = pathParts[pathParts.length - 1];
                console.log(`✓ Extracted invoice_id from payment_url (last segment): ${gatewayInvoiceId}`);
              }
              
              if (!gatewayInvoiceId) {
                gatewayInvoiceId = url.searchParams.get('invoice_id') || 
                                   url.searchParams.get('invoiceId') ||
                                   url.searchParams.get('invoice');
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
            const thirtySecondsAgo = new Date(Date.now() - 30000);
            const recentPayment = await db.addFunds.findFirst({
              where: {
                userId: session.user.id,
                amount: amountUSD.toString(),
                createdAt: {
                  gte: thirtySecondsAgo,
                },
                status: 'Processing',
              },
              orderBy: {
                createdAt: 'desc',
              },
            });

            if (recentPayment && recentPayment.invoiceId !== gatewayInvoiceId) {
              console.log('Duplicate payment attempt detected (AFTER gateway call - race condition):', {
                userId: session.user.id,
                amount: amountUSD,
                existingInvoiceId: recentPayment.invoiceId,
                newInvoiceId: gatewayInvoiceId,
                timeDiff: Date.now() - recentPayment.createdAt.getTime(),
                requestId: body.requestId,
              });
              return NextResponse.json(
                { 
                  error: 'Duplicate payment request detected. Please wait a moment and try again.',
                  existingInvoiceId: recentPayment.invoiceId,
                },
                { status: 429, headers: corsHeaders }
              );
            }

            const existingPayment = await db.addFunds.findUnique({
              where: {
                invoiceId: gatewayInvoiceId,
              },
            });

            if (existingPayment) {
              console.log('Invoice ID already exists in database (race condition):', {
                invoiceId: gatewayInvoiceId,
                existingPaymentId: existingPayment.id,
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

            const payment = await db.addFunds.create({
              data: {
                invoiceId: gatewayInvoiceId,
                amount: amountUSD.toString(),
                gatewayAmount: gatewayAmount,
                email: session.user.email || '',
                name: session.user.name || '',
                status: 'Processing',
                paymentGateway: gatewayName,
                userId: session.user.id,
                currency: 'USD',
              },
            });

            console.log(`✓ Payment record created with gateway invoice_id: ${gatewayInvoiceId}`);

            try {
              await sendTransactionPendingNotification(session.user.id, payment.id);
            } catch (notifError) {
              console.error('Error sending transaction pending notification:', notifError);
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
            
            if (createError.code === 'P2002') {
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
