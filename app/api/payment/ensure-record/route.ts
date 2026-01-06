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

    // Check by transactionId (in case invoice_id was stored differently)
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
      // Fetch data from gateway and update the record
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
              
              // Map transaction_id
              if (verificationData.transaction_id && verificationData.transaction_id !== invoice_id) {
                updateData.transactionId = verificationData.transaction_id;
              }
              
              
              // Map payment_method
              if (verificationData.payment_method) {
                updateData.paymentMethod = verificationData.payment_method;
              }
              
              // Map payment_gateway (if not already set)
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
          // Another record with this invoice_id exists, find it
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

    // Check for recent payments by this user (within last 5 minutes) to avoid duplicates
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
      
      // If recent payment already has this invoice_id, return it
      if (recentPayment.invoiceId === invoice_id) {
        return NextResponse.json({
          success: true,
          message: 'Payment record already exists',
          payment: recentPayment,
        });
      }
      
      // Only update if recent payment has no invoice_id or has a placeholder/invalid one
      // Don't overwrite a valid invoice_id from another payment
      if (!recentPayment.invoiceId || 
          recentPayment.invoiceId.startsWith('ADMIN-') || 
          recentPayment.invoiceId === '0' || 
          recentPayment.invoiceId === '') {
        try {
          // Fetch data from gateway and update the record
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
                
                // Map transaction_id
                if (verificationData.transaction_id && verificationData.transaction_id !== invoice_id) {
                  updateData.transactionId = verificationData.transaction_id;
                }
                
                
                // Map payment_method
                if (verificationData.payment_method) {
                  updateData.paymentMethod = verificationData.payment_method;
                }
                
                // Map payment_gateway (if not already set)
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
            // Another record with this invoice_id exists
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
          // If update fails, continue to create new record
          console.warn('Failed to update recent payment, will create new record:', updateError);
        }
      } else {
        // Recent payment has a different valid invoice_id, don't update it
        console.log(`Recent payment has different invoice_id (${recentPayment.invoiceId}), not updating. Will create new record if needed.`);
      }
    }

    // Get user details
    const user = await db.users.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get gateway name and API credentials
    const gatewayName = await getPaymentGatewayName();
    const apiKey = await getPaymentGatewayApiKey();
    const verifyUrl = await getPaymentGatewayVerifyUrl();

    // Fetch payment data from gateway using invoice_id
    let transactionId: string | null = null;
    let paymentMethod: string | null = null;
    let paymentAmount: string = '0.00';
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

          // Extract transaction_id
          if (verificationData.transaction_id && verificationData.transaction_id !== invoice_id) {
            transactionId = verificationData.transaction_id;
            console.log(`✓ Transaction ID extracted: ${transactionId}`);
          }


          // Extract payment_method
          if (verificationData.payment_method) {
            paymentMethod = verificationData.payment_method;
            console.log(`✓ Payment method extracted: ${paymentMethod}`);
          }

          // Extract amount
          if (verificationData.charged_amount) {
            paymentAmount = verificationData.charged_amount.toString();
          } else if (verificationData.amount) {
            paymentAmount = verificationData.amount.toString();
          }

          // Extract status
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
        // Continue to create record with minimal data
      }
    } else {
      console.warn('Gateway API key or verify URL not configured, creating record without gateway data');
    }

    // Create payment record with mapped data from gateway
    const payment = await db.addFunds.create({
      data: {
        invoiceId: invoice_id,
        amount: paymentAmount,
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
    });

    return NextResponse.json({
      success: true,
      message: 'Payment record created with data from gateway',
      payment: payment,
    });

  } catch (error: any) {
    console.error('Error ensuring payment record:', error);
    
    if (error.code === 'P2002' && invoice_id) {
      // Unique constraint violation - record was created by another request
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

