import { auth } from '@/auth';
import { db } from '@/lib/db';
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
    
    const body = await req.json();
    const { userId, amountUSD, amountBDT, note, status } = body;
    
    if (!userId || !amountUSD || !amountBDT) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const user = await db.users.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const invoiceId = `ADMIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const result = await db.$transaction(async (prisma) => {
      const addFund = await prisma.addFunds.create({
        data: {
          invoiceId: invoiceId,
          amount: parseFloat(amountUSD).toString(),
          email: user.email || '',
          name: user.name || '',
          status: status || 'COMPLETED',
          paymentGateway: 'admin',
          paymentMethod: 'admin',
          transactionId: `ADMIN-${Date.now()}`,
          userId: userId,
          currency: 'USD',
        },
      });

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          balance: { increment: parseFloat(amountUSD) },
          balanceUSD: { increment: parseFloat(amountUSD) },
        }
      });

      return { addFund, updatedUser };
    });
    

    return NextResponse.json({
      success: true,
      message: 'Funds added successfully',
      data: result.addFund,
    });
    
  } catch (error) {
    console.error('Error adding funds:', error);
    return NextResponse.json(
      { error: 'Failed to add funds' },
      { status: 500 }
    );
  }
} 
