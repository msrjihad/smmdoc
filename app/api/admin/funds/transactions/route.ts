import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = new URL(req.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    
    const skip = (page - 1) * limit;
    
    let whereCondition = {};
    
    if (search) {
      whereCondition = {
        OR: [
          { transactionId: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ],
      };
    }
    
    const transactions = await db.addFunds.findMany({
      where: whereCondition,
      select: {
        id: true,
        invoiceId: true,
        amount: true,
        status: true,
        paymentGateway: true,
        paymentMethod: true,
        transactionId: true,
        senderNumber: true,
        currency: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            currency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
    
    const totalCount = await db.addFunds.count({ where: whereCondition });
    const totalPages = Math.ceil(totalCount / limit);
    
    const transformedTransactions = transactions.map((t: any) => ({
      id: t.id,
      invoiceId: t.invoiceId,
      invoice_id: t.invoiceId,
      amount: typeof t.amount === 'object' && t.amount !== null
        ? Number(t.amount)
        : Number(t.amount || 0),
      usd_amount: typeof t.amount === 'object' && t.amount !== null
        ? Number(t.amount)
        : Number(t.amount || 0),
      bdtAmount: t.amount,
      bdt_amount: t.amount,
      status: t.status,
      admin_status: t.status,
      paymentGateway: t.paymentGateway,
      payment_gateway: t.paymentGateway,
      paymentMethod: t.paymentMethod,
      payment_method: t.paymentMethod,
      transactionId: t.transactionId,
      transaction_id: t.transactionId,
      phoneNumber: t.senderNumber,
      phone_number: t.senderNumber,
      phone: t.senderNumber,
      currency: t.currency,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      userId: t.userId,
      user: t.user,
    }));
    
    return NextResponse.json({
      transactions: transformedTransactions,
      totalPages,
      currentPage: page,
      totalCount,
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
