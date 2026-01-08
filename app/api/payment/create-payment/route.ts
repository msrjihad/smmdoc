import { auth } from '@/auth';
import { db } from '@/lib/db';
import { convertToUSD } from '@/lib/currency-utils';
import { getPaymentGatewayName, getPaymentGatewayExchangeRate } from '@/lib/payment-gateway-config';
import { sendTransactionPendingNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    if (!body.amount || !body.phone) {
      return NextResponse.json(
        { error: 'Amount and phone number are required' },
        { status: 400 }
      );
    }

    const amountUSD = parseFloat(body.amount);
    const currency = body.currency || 'USD';

    if (isNaN(amountUSD) || amountUSD <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const { fetchCurrencyData } = await import('@/lib/currency-utils');
    const { currencies } = await fetchCurrencyData();
    const amountUSDConverted = convertToUSD(amountUSD, currency, currencies);
    
    const exchangeRate = await getPaymentGatewayExchangeRate();
    const gatewayAmount = amountUSDConverted * exchangeRate;

    const gatewayName = await getPaymentGatewayName();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    
    if (!appUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL or NEXTAUTH_URL environment variable is required' },
        { status: 500 }
      );
    }
    
    console.log('App URL determined:', appUrl);

    const { getPaymentGatewayApiKey, getPaymentGatewayCheckoutUrl } = await import('@/lib/payment-gateway-config');
    const apiKey = await getPaymentGatewayApiKey();
    const checkoutUrl = await getPaymentGatewayCheckoutUrl();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Payment gateway API key not configured. Please configure it in admin settings.' },
        { status: 500 }
      );
    }

    const paymentAmount = amountUSDConverted * exchangeRate;
    
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
          full_name: session.user.name || 'User',
          email: session.user.email || 'user@example.com',
          amount: Math.round(paymentAmount).toString(),
          phone: body.phone,
          metadata: {
            user_id: session.user.id,
            original_currency: currency,
            charged_amount: gatewayAmount,
            usd_amount: amountUSDConverted,
          },
          redirect_url: `${appUrl}/transactions?payment=success`,
          return_type: 'GET',
          cancel_url: `${appUrl}/transactions?payment=cancelled`,
          webhook_url: `${appUrl}/api/payment/webhook`,
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
          { status: 500 }
        );
      }

      console.log('Parsed response data:', data);

      if (data.status || data.payment_url) {
        let gatewayInvoiceId: string | null = null;
        
        if (data.payment_url) {
          try {
            const url = new URL(data.payment_url);
            const pathParts = url.pathname.split('/').filter(part => part.length > 0);
            const paymentIndex = pathParts.findIndex(part => part === 'payment');
            
            if (paymentIndex >= 0 && paymentIndex < pathParts.length - 1) {
              gatewayInvoiceId = pathParts[paymentIndex + 1];
            } else if (pathParts.length > 0) {
              gatewayInvoiceId = pathParts[pathParts.length - 1];
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
          gatewayInvoiceId = data.invoice_id || data.invoiceId || data.invoice || 
                            data.id || data.payment_id || data.order_id || null;
        }
        
        if (!gatewayInvoiceId) {
          return NextResponse.json(
            { 
              error: 'Gateway did not return invoice_id in payment_url',
              details: 'Unable to extract invoice_id from payment gateway response.',
              gatewayResponse: data
            },
            { status: 500 }
          );
        }

        try {
          const tenSecondsAgo = new Date(Date.now() - 10000);
          const recentPayment = await db.addFunds.findFirst({
            where: {
              userId: session.user.id,
              amount: amountUSDConverted.toString(),
              createdAt: {
                gte: tenSecondsAgo,
              },
              status: 'Processing',
            },
            orderBy: {
              createdAt: 'desc',
            },
          });

          if (recentPayment) {
            return NextResponse.json(
              { 
                error: 'Duplicate payment request detected. Please wait a moment and try again.',
              },
              { status: 429 }
            );
          }

          const payment = await db.addFunds.create({
            data: {
              invoiceId: gatewayInvoiceId,
              amount: amountUSDConverted.toString(),
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
            const { sendAdminPendingTransactionNotification } = await import('@/lib/notifications/admin-notifications');
            await sendAdminPendingTransactionNotification(
              payment.id,
              parseFloat(amountUSDConverted),
              session.user.name || session.user.email || 'User'
            );
          } catch (adminNotifError) {
            console.error('Error sending admin pending transaction notification:', adminNotifError);
          }
        } catch (createError: any) {
          console.error('Error creating payment record:', createError);
          
          if (createError.code === 'P2002') {
            return NextResponse.json(
              { error: 'Invoice ID already exists. Please try again.' },
              { status: 409 }
            );
          }
          
          return NextResponse.json(
            { error: 'Failed to create payment record', details: String(createError) },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          invoice_id: gatewayInvoiceId,
          payment_url: data.payment_url,
          success_url: `${appUrl}/transactions?payment=success`,
          cancel_url: `${appUrl}/transactions?payment=cancelled`,
        });
      } else {
        return NextResponse.json(
          { error: data.message || 'Payment initialization failed' },
          { status: 400 }
        );
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);

      if ((fetchError as any)?.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Payment gateway timeout. Please try again.' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { error: 'Network error when connecting to payment gateway' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: String(error) },
      { status: 500 }
    );
  }
}
