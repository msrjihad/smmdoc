import { db } from '@/lib/db';
import { sendTransactionSuccessNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const webhookData = await req.json();
    console.log("Webhook data received:", webhookData);
    
    const apiKey = req.headers.get('rt-uddoktapay-api-key');
    
    const { getPaymentGatewayApiKey } = await import('@/lib/payment-gateway-config');
    const expectedApiKey = await getPaymentGatewayApiKey();
    
    if (!expectedApiKey) {
      console.error("Payment gateway API key not configured");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }
    
    if (apiKey !== expectedApiKey) {
      console.error("Invalid API key in webhook request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { 
      invoice_id,
      transaction_id,
      amount, 
      status,
      metadata,
      payment_method,
      sender_number,
      fee,
      date,
      full_name,
      charged_amount
    } = webhookData;
    
    console.log('Webhook payload extracted (same pattern for all fields):', {
      invoice_id,
      transaction_id,
      payment_method,
      sender_number,
      status,
      amount,
      charged_amount
    });
    
    if (!invoice_id) {
      console.error("Missing invoice_id in webhook data");
      return NextResponse.json({ error: "Missing invoice_id" }, { status: 400 });
    }
    
    const payment = await db.addFunds.findUnique({
      where: { invoiceId: invoice_id },
      include: { user: true }
    });
    
    if (!payment) {
      console.error(`Payment record not found for invoice_id: ${invoice_id}`);
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }
    
    if (payment.status === "Success") {
      console.log(`Payment ${invoice_id} is already marked as successful`);
      return NextResponse.json({ message: "Payment already processed" });
    }
    
    let paymentStatus = "Processing";
    
    if (status === "COMPLETED") {
      paymentStatus = "Success";
    } else if (status === "PENDING") {
      paymentStatus = "Processing";
    } else if (status === "CANCELLED") {
      paymentStatus = "Cancelled";
    } else {
      paymentStatus = "Failed";
    }
    
    try {
      const result = await db.$transaction(async (prisma) => {
        const updatedPayment = await prisma.addFunds.update({
          where: { invoiceId: invoice_id },
          data: {
            status: paymentStatus,
            transactionId: transaction_id || payment.transactionId,
            paymentMethod: payment_method || payment.paymentMethod || null,
            senderNumber: sender_number || payment.senderNumber || null,
            gatewayFee: fee !== undefined ? fee : payment.gatewayFee,
            name: full_name || payment.name,
            transactionDate: date ? new Date(date) : payment.transactionDate,
            amount: charged_amount !== undefined ? charged_amount : payment.amount,
          }
        });
        
        console.log(`Payment ${invoice_id} status updated to ${paymentStatus}`);
        
        if (paymentStatus === "Success" && payment.user) {
          const originalAmount = Number(payment.amount) || 0;

          const user = await prisma.users.update({
            where: { id: payment.userId },
            data: {
              balance: {
                increment: originalAmount
              },
              balanceUSD: {
                increment: originalAmount
              },
              total_deposit: {
                increment: originalAmount
              }
            }
          });
          
          console.log(`User ${payment.userId} balance updated after successful payment. New balance: ${user.balance}`);

          try {
            await sendTransactionSuccessNotification(
              payment.userId,
              updatedPayment.id,
              originalAmount
            );
          } catch (notifError) {
            console.error('Error sending transaction success notification:', notifError);
          }
        }
        
        return { updatedPayment };
      });
      
      return NextResponse.json({
        success: true,
        message: `Payment ${paymentStatus.toLowerCase()}`,
        data: {
          invoice_id,
          status: paymentStatus,
          transaction_id: result.updatedPayment.transactionId,
          amount: result.updatedPayment.amount
        }
      });
    } catch (dbError) {
      console.error("Database error updating payment:", dbError);
      
      return NextResponse.json({
        error: "Database error",
        message: "Failed to update payment record",
        details: String(dbError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed", details: String(error) },
      { status: 500 }
    );
  }
}
