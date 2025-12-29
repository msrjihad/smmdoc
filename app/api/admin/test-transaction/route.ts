import { auth } from '@/auth';
import { db } from '@/lib/db';
import { convertCurrency, fetchCurrencyData } from '@/lib/currency-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { currencies } = await fetchCurrencyData();
    const amountBDT = convertCurrency(100.00, 'USD', 'BDT', currencies);

    const testTransaction = await db.addFunds.create({
      data: {
        invoiceId: `TEST-${Date.now()}`,
        usdAmount: 100.00,
        amount: amountBDT,
        email: 'test@example.com',
        name: 'Test User',
        status: 'Processing',
        paymentGateway: 'Test Gateway',
        senderNumber: '01712345678',
        transactionId: `TXN-${Date.now()}`,
        userId: session.user.id,
        currency: 'USD',
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test transaction created successfully',
      data: testTransaction,
    });
    
  } catch (error) {
    console.error('Error creating test transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create test transaction', details: String(error) },
      { status: 500 }
    );
  }
}
