import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', valid: false },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const invoice_id = searchParams.get('invoice_id');

    if (!invoice_id) {
      return NextResponse.json(
        { error: 'Invoice ID is required', valid: false },
        { status: 400 }
      );
    }

    const payment = await db.addFunds.findUnique({
      where: { invoiceId: invoice_id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found', valid: false },
        { status: 404 }
      );
    }

    const userId = parseInt(session.user.id);
    if (payment.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this payment', valid: false },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      payment: {
        id: payment.id,
        invoice_id: payment.invoiceId,
        amount: typeof payment.amount === 'object' && payment.amount !== null
          ? Number(payment.amount)
          : Number(payment.amount || 0),
        gateway_amount: payment.gatewayAmount || null,
        status: payment.status,
        transaction_id: payment.transactionId,
        payment_method: payment.paymentMethod,
        sender_number: payment.senderNumber,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      },
      user: payment.user ? {
        id: payment.user.id,
        email: payment.user.email,
        name: payment.user.name,
      } : null,
    });
  } catch (error) {
    console.error('Error validating payment access:', error);
    return NextResponse.json(
      { error: 'Internal server error', valid: false },
      { status: 500 }
    );
  }
}

