import { db } from '@/lib/db';
import { sendTransactionSuccessNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const invoice_id = searchParams.get("invoice_id");
    const from_redirect = searchParams.get("from_redirect") === "true";
    
    console.log("Verifying payment for invoice_id:", invoice_id, "from_redirect:", from_redirect);
    console.log("Note: invoice_id is the URL parameter that contains all payment data. All payment data (transaction_id, payment_method, etc.) will be fetched from Verify Payment API using invoice_id only");

    if (!invoice_id) {
      return NextResponse.json(
        { error: "Invoice ID is required", status: "FAILED" },
        { status: 400 }
      );
    }

    let payment = await db.addFunds.findUnique({
      where: {
        invoiceId: invoice_id,
      },
      include: {
        user: true,
      },
    });

    console.log("Payment record found by gateway invoice_id:", payment);
    
    if (!payment) {
      console.log("Payment not found by gateway invoice_id. Trying alternative lookups...");
      
      payment = await db.addFunds.findFirst({
        where: {
          OR: [
            { referenceId: invoice_id },
            { transactionId: invoice_id },
          ],
        },
        include: {
          user: true,
        },
      });
      
      if (payment) {
        console.log("Found payment by referenceId/transactionId. Updating invoiceId to gateway invoice_id...");
        try {
          await db.addFunds.update({
            where: { id: payment.id },
            data: { invoiceId: invoice_id }
          });
          payment = await db.addFunds.findUnique({
            where: { invoiceId: invoice_id },
            include: { user: true },
          });
        } catch (updateError) {
          console.error("Error updating payment invoice_id:", updateError);
        }
      }
    }
    
    if (payment && payment.transactionId && payment.transactionId === invoice_id) {
      console.log('CRITICAL: Found corrupted data - transaction_id equals invoice_id! Fixing...');
      await db.addFunds.update({
        where: { invoiceId: invoice_id },
        data: { transactionId: null }
      });
      const fixedPayment = await db.addFunds.findUnique({
        where: { invoiceId: invoice_id },
        include: { user: true },
      });
      if (fixedPayment) {
        payment.transactionId = null;
      }
    }

    if (!payment) {
      console.error("Payment record not found for invoice_id:", invoice_id);
      return NextResponse.json({ 
        error: "Payment record not found", 
        status: "FAILED",
        message: `No payment record found with invoice ID: ${invoice_id}`,
        invoice_id: invoice_id
      }, { status: 404 });
    }

    if (payment.status === "Success") {
      return NextResponse.json({ 
        message: "Payment already verified",
        status: "COMPLETED",
        payment: {
          id: payment.id,
          invoice_id: payment.invoiceId,
          amount: payment.amount,
          usdAmount: payment.usdAmount,
          status: payment.status,
          transaction_id: payment.transactionId,
          payment_method: payment.paymentMethod,
          phone_number: payment.senderNumber,
          sender_number: payment.senderNumber,
          gatewayFee: payment.gatewayFee,
          name: payment.name,
          email: payment.email,
          transactionDate: payment.transactionDate,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          userId: payment.userId,
        }
      });
    }
    
      const { getPaymentGatewayApiKey, getPaymentGatewayVerifyUrl } = await import('@/lib/payment-gateway-config');
      const apiKey = await getPaymentGatewayApiKey();
      const baseUrl = await getPaymentGatewayVerifyUrl();
      
      if (!apiKey) {
        return NextResponse.json(
          { error: "Payment gateway API key not configured. Please configure it in admin settings.", status: "FAILED" },
          { status: 500 }
        );
      }
      
      console.log(`Making API request to payment gateway: ${baseUrl} with invoice_id: ${invoice_id}`);
      
    let verificationData: any = null;
    let isSuccessful = false;
    let paymentStatus = "Processing";
    let apiTransactionId: string | null = null;
    let apiPaymentMethod: string | null = null;
    
    try {
      let verificationResponse;
      let attempts = from_redirect ? 3 : 1;
      let delay = 1000;
      
      for (let attempt = 1; attempt <= attempts; attempt++) {
        if (attempt > 1) {
          console.log(`Retry attempt ${attempt} for transaction_id (waiting ${delay}ms)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
        
        verificationResponse = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'RT-UDDOKTAPAY-API-KEY': apiKey,
          },
          body: JSON.stringify({ invoice_id }),
        });

        if (verificationResponse.ok) {
          const responseData: any = await verificationResponse.json();
          console.log(`=== UddoktaPay Verify Payment API response (attempt ${attempt}) ===`);
          console.log('Full response:', JSON.stringify(responseData, null, 2));
          console.log('Response keys:', Object.keys(responseData));
          console.log('Response status:', responseData.status);
          
          const responseInvoiceId = responseData.invoice_id;
          const responseTransactionId = responseData.transaction_id;
          const responsePaymentMethod = responseData.payment_method;
          const responseSenderNumber = responseData.sender_number;
          const responseFee = responseData.fee;
          const responseChargedAmount = responseData.charged_amount;
          const responseDate = responseData.date;
          const responseFullName = responseData.full_name;
          const responseEmail = responseData.email;
          const responseAmount = responseData.amount;
          
          console.log('=== UddoktaPay Verify Payment API Response Fields ===');
          console.log('According to API docs (https://uddoktapay.readme.io/reference/verify-payment-api-guideline):');
          console.log('  - invoice_id:', responseInvoiceId);
          console.log('  - transaction_id:', responseTransactionId);
          console.log('  - payment_method:', responsePaymentMethod);
          console.log('  - sender_number:', responseSenderNumber);
          console.log('  - fee:', responseFee);
          console.log('  - charged_amount:', responseChargedAmount);
          console.log('  - amount:', responseAmount);
          console.log('  - full_name:', responseFullName);
          console.log('  - email:', responseEmail);
          console.log('  - date:', responseDate);
          console.log('  - status:', responseData.status);
          console.log('  - metadata:', responseData.metadata);
          console.log('====================================================');
          
          if (responseTransactionId && responseTransactionId !== invoice_id) {
            apiTransactionId = responseTransactionId;
            console.log(`✓ Transaction ID extracted from API response.transaction_id: ${apiTransactionId}`);
          } else if (responseTransactionId === invoice_id) {
            console.log('⚠ WARNING: API returned transaction_id matching invoice_id - ignoring');
          } else if (!responseTransactionId) {
            console.log('⚠ Transaction ID not found in API response (payment may be PENDING)');
          }
          
          if (responsePaymentMethod) {
            apiPaymentMethod = responsePaymentMethod;
            console.log(`✓ Payment Method extracted from API response.payment_method: ${apiPaymentMethod}`);
          } else {
            console.log('⚠ Payment Method not found in API response (payment may be PENDING)');
          }
          
          console.log('Expected fields from Verify Payment API (same structure as webhook):');
          console.log('  - invoice_id:', responseData.invoice_id);
          console.log('  - transaction_id:', responseData.transaction_id);
          console.log('  - payment_method:', responseData.payment_method);
          console.log('  - sender_number:', responseData.sender_number);
          console.log('  - status:', responseData.status);
          console.log('  - amount:', responseData.amount);
          console.log('  - charged_amount:', responseData.charged_amount);
          console.log('  - fee:', responseData.fee);
          console.log('  - full_name:', responseData.full_name);
          console.log('  - email:', responseData.email);
          console.log('  - date:', responseData.date);
          console.log('========================================================');

          if (responseData.status === 'ERROR') {
            console.log('API returned ERROR status:', responseData.message || 'Unknown error');
            verificationData = responseData;
            break;
          }

          if (!verificationData) {
            verificationData = { ...responseData };
          } else {
            verificationData = { ...verificationData, ...responseData };
          }
          
          verificationData.transaction_id = apiTransactionId || verificationData.transaction_id || responseData.transaction_id || null;
          verificationData.payment_method = apiPaymentMethod || verificationData.payment_method || responseData.payment_method || null;
          
          console.log('Stored values (apiTransactionId/apiPaymentMethod):', {
            apiTransactionId,
            apiPaymentMethod,
            verificationData_transaction_id: verificationData.transaction_id,
            verificationData_payment_method: verificationData.payment_method,
            responseData_transaction_id: responseData.transaction_id,
            responseData_payment_method: responseData.payment_method,
          });
          
          if (apiTransactionId) {
            console.log(`✓ Got valid transaction_id from API, breaking retry loop`);
            break;
          } else if (attempt >= attempts) {
            console.log(`Final attempt completed. Using verificationData as is.`);
            console.log('Final verificationData:', {
              invoice_id: verificationData.invoice_id,
              transaction_id: verificationData.transaction_id,
              payment_method: verificationData.payment_method,
              status: verificationData.status
            });
            break;
          } else if (attempt < attempts) {
            console.log(`Attempt ${attempt}: transaction_id not found or invalid. Retrying...`);
            console.log('Available fields in response:', Object.keys(responseData));
            console.log('Response data sample:', JSON.stringify(responseData, null, 2));
          }
        } else {
          try {
            const errorData = await verificationResponse.json();
            console.log('API returned HTTP error:', verificationResponse.status, errorData);
            
            if (errorData.transaction_id && errorData.transaction_id !== invoice_id) {
              apiTransactionId = errorData.transaction_id;
              console.log(`✓ Transaction ID extracted from error response: ${apiTransactionId}`);
            }
            if (errorData.payment_method) {
              apiPaymentMethod = errorData.payment_method;
              console.log(`✓ Payment Method extracted from error response: ${apiPaymentMethod}`);
            }
            
            if (errorData.status === 'ERROR') {
              verificationData = errorData;
              break;
            }
          } catch (e) {
            console.log('Could not parse error response as JSON');
          }
        }
      }

      if (verificationData) {
        if (!verificationData.payment_method) {
          verificationData.payment_method = verificationData.paymentMethod || 
                                           verificationData.payment_method_name ||
                                           verificationData.method ||
                                           null;
        }
        
        console.log('Final verificationData before saving (webhook structure):', {
          invoice_id: verificationData.invoice_id,
          transaction_id: verificationData.transaction_id,
          payment_method: verificationData.payment_method,
          sender_number: verificationData.sender_number,
          status: verificationData.status,
          amount: verificationData.amount,
          charged_amount: verificationData.charged_amount,
          fee: verificationData.fee,
          full_name: verificationData.full_name,
          email: verificationData.email,
          date: verificationData.date
        });
      }

      if (verificationData && !verificationData.sender_number) {
        verificationData.sender_number = verificationData.senderNumber || 
                                        verificationData.phone ||
                                        verificationData.sender_phone ||
                                        null;
      }

      if (verificationResponse && verificationResponse.ok && verificationData) {
        if (verificationData.status === 'ERROR') {
          console.log('Payment verification returned ERROR status:', verificationData.message || 'Unknown error');
          paymentStatus = "Cancelled";
          isSuccessful = false;
        } else if (verificationData.status === 'COMPLETED' || verificationData.status === 'SUCCESS') {
          isSuccessful = true;
          paymentStatus = "Success";
        } else if (verificationData.status === 'PENDING') {
          paymentStatus = "Processing";
          console.log('Payment status is PENDING - keeping as Processing');
        } else if (verificationData.status === 'CANCELLED') {
          paymentStatus = "Cancelled";
        } else {
          paymentStatus = "Processing";
          console.log('Unknown payment status from API:', verificationData.status);
        }
      } else if (verificationResponse && !verificationResponse.ok) {
        if (from_redirect) {
          console.log('Payment redirected but API verification failed - checking current payment status');
          if (payment.status === "Processing") {
            paymentStatus = "Processing";
            console.log('Payment is currently Processing - keeping as Processing (likely sandbox pending payment)');
          } else if (payment.status === "Success") {
            paymentStatus = "Success";
          isSuccessful = true;
            console.log('Payment is already Success - keeping as Success');
          } else {
            paymentStatus = "Processing";
            console.log('Setting payment status to Processing (sandbox pending payment)');
          }
          
          verificationData = verificationData || {};
          verificationData.transaction_id = apiTransactionId || verificationData.transaction_id || null;
          verificationData.payment_method = apiPaymentMethod || verificationData.payment_method || null;
          verificationData.sender_number = verificationData.sender_number || null;
        } else {
          const errorText = await verificationResponse.text();
          console.error('UddoktaPay verification API error:', errorText);
          if (payment.status === "Processing") {
            console.log('Payment is currently Processing - returning as PENDING instead of FAILED');
            paymentStatus = "Processing";
          } else {
          return NextResponse.json(
            { 
              error: "Payment verification failed", 
              status: "FAILED",
              message: "Failed to verify payment with UddoktaPay",
              details: errorText 
            },
            { status: 500 }
          );
          }
        }
      }
    } catch (apiError) {
      console.error('Error calling UddoktaPay API:', apiError);
      if (from_redirect) {
        console.log('Payment redirected but API call failed - checking current payment status');
        if (payment.status === "Processing") {
          paymentStatus = "Processing";
          console.log('Payment is currently Processing - keeping as Processing (likely sandbox pending payment)');
        } else if (payment.status === "Success") {
          paymentStatus = "Success";
        isSuccessful = true;
          console.log('Payment is already Success - keeping as Success');
        } else {
          paymentStatus = "Processing";
          console.log('Setting payment status to Processing (sandbox pending payment)');
        }
        
        verificationData = { 
          transaction_id: apiTransactionId || null,
          payment_method: apiPaymentMethod || null,
          phone_number: null,
        };
      } else {
        if (payment.status === "Processing") {
          console.log('Payment is currently Processing - returning as PENDING instead of FAILED');
          paymentStatus = "Processing";
      } else {
        return NextResponse.json(
          { 
            error: "Failed to verify payment with payment gateway", 
            status: "FAILED",
            message: "An error occurred while verifying payment",
            details: String(apiError) 
          },
          { status: 500 }
        );
        }
      }
    }
    
    if (from_redirect && payment.user) {
      console.log('Payment redirected - updating with fetched transaction details from Verify Payment API');
      console.log('Verification data available:', {
        hasVerificationData: !!verificationData,
        transaction_id_from_api: verificationData?.transaction_id,
        transaction_id_from_db: payment.transactionId,
        paymentStatus: paymentStatus,
        note: 'All data fetched from Verify Payment API using invoice_id only'
      });
      
      let transactionIdToSave = apiTransactionId || 
                                 verificationData?.transaction_id || 
                                 payment.transactionId || 
                                 null;
      
      if (transactionIdToSave && transactionIdToSave === invoice_id) {
        console.log('WARNING: transaction_id matches invoice_id - this is wrong! Setting to null instead.');
        transactionIdToSave = null;
      }
      
      console.log('Transaction ID extraction from Verify Payment API (using invoice_id only):', {
        from_api_direct: apiTransactionId,
        from_api_verificationData: verificationData?.transaction_id,
        from_db: payment.transactionId,
        final_transactionId: transactionIdToSave,
        invoice_id_used: invoice_id,
        extraction_pattern: 'Fetched from Verify Payment API response.transaction_id using invoice_id'
      });
      
      const paymentMethodToSave = apiPaymentMethod || 
                                   verificationData?.payment_method || 
                                   payment.paymentMethod || 
                                   null;
      
      console.log('Payment method mapping (API payment_method → DB paymentMethod):', {
        from_api_payment_method: verificationData?.payment_method,
        from_db: payment.paymentMethod,
        final_paymentMethod: paymentMethodToSave,
        verificationData_keys: verificationData ? Object.keys(verificationData) : []
      });
      
      const phoneNumberToSave = verificationData?.sender_number || payment.senderNumber || null;
      const gatewayFeeToSave = verificationData?.fee !== undefined ? verificationData.fee : payment.gatewayFee;
      const bdtAmountToSave = verificationData?.charged_amount !== undefined ? verificationData.charged_amount : payment.amount;
      const nameToSave = verificationData?.full_name || payment.name || null;
      const emailToSave = verificationData?.email || payment.email || null;
      const transactionDateToSave = verificationData?.date ? new Date(verificationData.date) : payment.transactionDate;
      
      console.log('Values to save (direct API → DB mapping):', {
        status: paymentStatus,
        transactionId: transactionIdToSave,
        paymentMethod: paymentMethodToSave,
        senderNumber: phoneNumberToSave,
        gatewayFee: gatewayFeeToSave,
        amount: bdtAmountToSave,
        name: nameToSave,
        email: emailToSave,
        transactionDate: transactionDateToSave,
        source_breakdown: {
          apiTransactionId: apiTransactionId || 'null',
          apiPaymentMethod: apiPaymentMethod || 'null',
          verificationData_transaction_id: verificationData?.transaction_id || 'null',
          verificationData_payment_method: verificationData?.payment_method || 'null',
          note: 'All data fetched from Verify Payment API using invoice_id only'
        }
      });
      
      if (!transactionIdToSave) {
        console.log('⚠ WARNING: transactionIdToSave is NULL - checking sources:', {
          apiTransactionId: apiTransactionId || 'null',
          verificationData_transaction_id: verificationData?.transaction_id || 'null',
          payment_transactionId: payment.transactionId || 'null',
          note: 'All data should come from Verify Payment API response using invoice_id'
        });
      }
      if (!paymentMethodToSave) {
        console.log('⚠ WARNING: paymentMethodToSave is NULL - checking sources:', {
          apiPaymentMethod: apiPaymentMethod || 'null',
          verificationData_payment_method: verificationData?.payment_method || 'null',
          payment_paymentMethod: payment.paymentMethod || 'null',
        });
      }
      
      try {
        if (paymentStatus === "Success") {
        await db.$transaction(async (prisma) => {
          await prisma.addFunds.update({
              where: { invoiceId: invoice_id },
            data: {
                status: paymentStatus,
                transactionId: transactionIdToSave,
                paymentMethod: paymentMethodToSave,
                senderNumber: phoneNumberToSave,
                gatewayFee: gatewayFeeToSave,
                amount: bdtAmountToSave,
                name: nameToSave,
                email: emailToSave,
                transactionDate: transactionDateToSave,
            }
          });
          
            const originalAmount = payment.amount || Number(payment.usdAmount) || 0;
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
                balanceUSD: { increment: Number(payment.usdAmount) },
              total_deposit: { increment: originalAmount }
            }
          });
          
          console.log(`User ${payment.userId} balance updated. New balance: ${user.balance}`);
        });
        } else {
          await db.addFunds.update({
            where: { invoiceId: invoice_id },
            data: {
              status: paymentStatus,
              transactionId: transactionIdToSave,
              paymentMethod: paymentMethodToSave,
              senderNumber: phoneNumberToSave,
              gatewayFee: gatewayFeeToSave,
              amount: bdtAmountToSave,
              name: nameToSave,
              email: emailToSave,
              transactionDate: transactionDateToSave,
            }
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedPayment = await db.addFunds.findUnique({
          where: { invoiceId: invoice_id }
        });
        
        if (!updatedPayment) {
          console.error('Could not find updated payment after database update');
          return NextResponse.json({
            error: "Payment record not found after update",
            status: "FAILED"
          }, { status: 500 });
        }
        
        let finalTransactionIdToReturn = updatedPayment.transactionId || null;
        if (finalTransactionIdToReturn && finalTransactionIdToReturn === invoice_id) {
          console.log('ERROR: Database has invoice_id stored as transaction_id! Clearing it.');
          await db.addFunds.update({
            where: { invoiceId: invoice_id },
            data: { transactionId: null }
          });
          finalTransactionIdToReturn = null;
        }
        
        if (!finalTransactionIdToReturn && verificationData?.transaction_id && verificationData.transaction_id !== invoice_id) {
          console.log('Found transaction_id in API response, updating database...');
          finalTransactionIdToReturn = verificationData.transaction_id;
          await db.addFunds.update({
            where: { invoiceId: invoice_id },
            data: { transactionId: finalTransactionIdToReturn }
          });
          const reUpdatedPayment = await db.addFunds.findUnique({
            where: { invoiceId: invoice_id }
          });
          if (reUpdatedPayment) {
            Object.assign(updatedPayment, reUpdatedPayment);
          }
        }
        
        const finalStatus = updatedPayment.status;
        
        console.log('Returning payment with status:', {
          paymentStatus,
          finalStatus,
          updatedPaymentStatus: updatedPayment.status,
          transaction_id: finalTransactionIdToReturn
        });
        
        const completePayment = await db.addFunds.findUnique({
          where: { invoiceId: invoice_id },
          include: { user: true }
        });

        return NextResponse.json({
          status: finalStatus === "Success" ? "COMPLETED" : finalStatus === "Processing" ? "PENDING" : "FAILED",
          message: finalStatus === "Success" 
            ? "Payment verified successfully (from redirect)"
            : finalStatus === "Processing"
            ? "Payment is pending verification"
            : "Payment verification failed",
          payment: completePayment ? {
            id: completePayment.id,
            invoice_id: completePayment.invoiceId,
            amount: completePayment.amount,
            usdAmount: completePayment.usdAmount,
            status: completePayment.status,
            transaction_id: completePayment.transactionId,
            payment_method: completePayment.paymentMethod,
            phone_number: completePayment.senderNumber,
            sender_number: completePayment.senderNumber,
            gatewayFee: completePayment.gatewayFee,
            name: completePayment.name,
            email: completePayment.email,
            transactionDate: completePayment.transactionDate,
            createdAt: completePayment.createdAt,
            updatedAt: completePayment.updatedAt,
            userId: completePayment.userId,
          } : {
            id: updatedPayment.id,
            invoice_id: updatedPayment.invoiceId,
            amount: updatedPayment.usdAmount,
            status: finalStatus,
            transaction_id: finalTransactionIdToReturn,
            payment_method: updatedPayment.paymentMethod,
            phone_number: updatedPayment.senderNumber || null,
          },
        });
      } catch (redirectError) {
        console.error('Error processing redirected payment:', redirectError);
      }
    }
    
    try {
      console.log(`Payment verification result: ${isSuccessful ? 'Success' : paymentStatus}`);
      
      let existingPayment = await db.addFunds.findUnique({ where: { invoiceId: invoice_id } });
      
      let transactionIdToSave = apiTransactionId || 
                                 verificationData?.transaction_id || 
                                 existingPayment?.transactionId || 
                                 payment.transactionId || 
                                 null;
      
      if (transactionIdToSave && transactionIdToSave === invoice_id) {
        console.log('ERROR: transaction_id matches invoice_id - NOT saving! Setting to null or existing valid transaction_id.');
        if (existingPayment?.transactionId && existingPayment.transactionId !== invoice_id) {
          transactionIdToSave = existingPayment.transactionId;
        } else {
          transactionIdToSave = null;
        }
      }
      
      const paymentMethodToSave = apiPaymentMethod || 
                                   verificationData?.payment_method || 
                                   payment.paymentMethod || 
                                   null;
      
      console.log('Saving payment data from Verify Payment API (using invoice_id only):', {
        invoice_id,
        transactionId: transactionIdToSave,
        paymentMethod: paymentMethodToSave,
        from_api_direct_transactionId: apiTransactionId,
        from_api_direct_paymentMethod: apiPaymentMethod,
        extraction_pattern: 'Fetched from Verify Payment API using invoice_id only - response.transaction_id and response.payment_method'
      });
      
      const updatedPayment = await db.addFunds.update({
        where: { invoiceId: invoice_id },
        data: {
          status: paymentStatus,
          transactionId: transactionIdToSave,
          paymentMethod: paymentMethodToSave,
          senderNumber: verificationData?.sender_number || payment.senderNumber || null,
          gatewayFee: verificationData?.fee !== undefined ? verificationData.fee : payment.gatewayFee,
          amount: verificationData?.charged_amount !== undefined ? verificationData.charged_amount : payment.amount,
          name: verificationData?.full_name || payment.name || null,
          email: verificationData?.email || payment.email || null,
          transactionDate: verificationData?.date ? new Date(verificationData.date) : payment.transactionDate,
        }
      });
      
      const finalCheck = await db.addFunds.findUnique({ where: { invoiceId: invoice_id } });
      if (finalCheck?.transactionId && finalCheck.transactionId === invoice_id) {
        console.error('CRITICAL ERROR: invoice_id was saved as transaction_id! Fixing...');
        await db.addFunds.update({
          where: { invoiceId: invoice_id },
          data: { transactionId: null }
        });
      }

      console.log(`Payment ${invoice_id} status updated to ${paymentStatus} with transaction_id: ${updatedPayment.transactionId}`);
      
      if (isSuccessful && payment.user) {
        try {
          await db.$transaction(async (prisma) => {
            await prisma.addFunds.update({
              where: { invoiceId: invoice_id },
              data: {
                status: "Success",
              }
            });
            
            const originalAmount = payment.amount || Number(payment.usdAmount) || 0;

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
                balanceUSD: { increment: Number(payment.usdAmount) },
                total_deposit: { increment: originalAmount }
              }
            });
            
            console.log(`User ${payment.userId} balance updated. New balance: ${user.balance}. Original amount: ${originalAmount}, Bonus: ${bonusAmount}, Total added: ${totalAmountToAdd}`);

            const updatedPayment = await prisma.addFunds.findUnique({
              where: { invoiceId: invoice_id },
            });

            if (updatedPayment) {
              try {
                await sendTransactionSuccessNotification(
                  payment.userId,
                  updatedPayment.id,
                  Number(payment.usdAmount)
                );
              } catch (notifError) {
                console.error('Error sending transaction success notification:', notifError);
              }
            }
          });
          
          console.log("Transaction completed successfully");
        } catch (transactionError) {
          console.error(`Transaction error updating payment and balance: ${transactionError}`);
          return NextResponse.json(
            { error: "Failed to update payment and balance", details: String(transactionError) },
            { status: 500 }
          );
        }
      }

      const finalPaymentData = await db.addFunds.findUnique({
        where: { invoiceId: invoice_id },
        include: { user: true }
      });

      if (isSuccessful) {
        return NextResponse.json({
          status: "COMPLETED",
          message: "Payment verified successfully",
          payment: finalPaymentData ? {
            id: finalPaymentData.id,
            invoice_id: finalPaymentData.invoiceId,
            amount: finalPaymentData.amount,
            usdAmount: finalPaymentData.usdAmount,
            status: finalPaymentData.status,
            transaction_id: finalPaymentData.transactionId,
            payment_method: finalPaymentData.paymentMethod,
            phone_number: finalPaymentData.senderNumber,
            sender_number: finalPaymentData.senderNumber,
            gatewayFee: finalPaymentData.gatewayFee,
            name: finalPaymentData.name,
            email: finalPaymentData.email,
            transactionDate: finalPaymentData.transactionDate,
            createdAt: finalPaymentData.createdAt,
            updatedAt: finalPaymentData.updatedAt,
            userId: finalPaymentData.userId,
          } : {
            id: updatedPayment.id,
            invoice_id: updatedPayment.invoiceId,
            amount: updatedPayment.usdAmount,
            status: updatedPayment.status,
            transaction_id: updatedPayment.transactionId,
            payment_method: updatedPayment.paymentMethod,
            phone_number: updatedPayment.senderNumber || null,
          },
        });
      } else {
        const responseStatus = paymentStatus === "Processing" ? "PENDING" : 
                              paymentStatus === "Cancelled" ? "CANCELLED" : 
                              "FAILED";
        const responseMessage = paymentStatus === "Processing" 
          ? "Payment is pending verification" 
          : paymentStatus === "Cancelled"
          ? "Payment was cancelled"
          : "Payment verification failed";
        
        return NextResponse.json({
          status: responseStatus,
          message: responseMessage,
          payment: finalPaymentData ? {
            id: finalPaymentData.id,
            invoice_id: finalPaymentData.invoiceId,
            amount: finalPaymentData.amount,
            usdAmount: finalPaymentData.usdAmount,
            status: finalPaymentData.status,
            transaction_id: finalPaymentData.transactionId,
            payment_method: finalPaymentData.paymentMethod,
            phone_number: finalPaymentData.senderNumber,
            sender_number: finalPaymentData.senderNumber,
            gatewayFee: finalPaymentData.gatewayFee,
            name: finalPaymentData.name,
            email: finalPaymentData.email,
            transactionDate: finalPaymentData.transactionDate,
            createdAt: finalPaymentData.createdAt,
            updatedAt: finalPaymentData.updatedAt,
            userId: finalPaymentData.userId,
          } : {
            id: updatedPayment.id,
            invoice_id: updatedPayment.invoiceId,
            amount: updatedPayment.usdAmount,
            status: updatedPayment.status,
            transaction_id: updatedPayment.transactionId,
          }
        });
      }
    } catch (updateError) {
      console.error("Error updating payment:", updateError);
      return NextResponse.json(
        { 
          error: "Failed to update payment status", 
          status: "FAILED",
          message: "An error occurred while updating payment status"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify payment", 
        status: "FAILED",
        message: "An unexpected error occurred during verification",
        details: String(error) 
      },
      { status: 500 }
    );
  }
}
