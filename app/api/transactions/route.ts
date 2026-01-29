import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search') || '';
    const searchType = searchParams.get('searchType') || 'id';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const adminView = searchParams.get('admin') === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (!adminView || session.user.role !== 'admin') {
      where.userId = session.user.id;
    }

    if (search && adminView && session.user.role === 'admin') {
      if (searchType === 'id') {
        const searchConditions: any[] = [
          { transactionId: { contains: search } },
          { invoiceId: { contains: search } },
        ];
        if (!isNaN(parseInt(search))) {
          searchConditions.push({ id: parseInt(search) });
        }
        where.OR = searchConditions;
      } else if (searchType === 'username') {
        where.OR = [
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
          { user: { username: { contains: search } } },
        ];
      } else {
        where.OR = [
          { transactionId: { contains: search } },
          { invoiceId: { contains: search } },
          { user: { name: { contains: search } } },
          { user: { email: { contains: search } } },
        ];
      }
    }

    if (search && (!adminView || session.user.role !== 'admin')) {
      where.OR = [
        { transactionId: { contains: search } },
        { invoiceId: { contains: search } },
      ];
    }

    if (status && status !== 'all') {
      if (status === 'Success' || status === 'completed') {
        where.status = 'Success';
        if (adminView && session.user.role === 'admin') {
          where.adminStatus = 'Success';
        }
      } else if (status === 'pending' || status === 'Pending') {
        where.status = 'Processing';
        if (adminView && session.user.role === 'admin') {
          where.adminStatus = 'Pending';
        }
      } else if (status === 'cancelled' || status === 'Cancelled') {
        where.status = 'Cancelled';
        if (adminView && session.user.role === 'admin') {
          where.adminStatus = 'Cancelled';
        }
      } else if (status === 'failed') {
        where.status = { in: ['Failed', 'Cancelled'] };
        if (adminView && session.user.role === 'admin') {
          where.adminStatus = { in: ['Cancelled'] };
        }
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        where.createdAt.gte = new Date(startDate + 'T00:00:00.000Z');
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    let transactions: any[] = [];
    let totalCount = 0;

    try {
      await db.$queryRaw`SELECT 1`;

      const [transactionsResult, totalCountResult] = await Promise.all([
        db.addFunds.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          take: limit > 10000 ? undefined : limit,
          skip: adminView ? skip : offset,
          select: {
            id: true,
            invoiceId: true,
            amount: true,
            status: true,
            paymentGateway: true,
            paymentMethod: true,
            transactionId: true,
            transactionType: true,
            createdAt: true,
            updatedAt: true,
            currency: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true,
              },
            },
          },
        }),
        adminView && session.user.role === 'admin'
          ? db.addFunds.count({ where })
          : Promise.resolve(0)
      ]);

      transactions = transactionsResult;
      totalCount = totalCountResult;

    } catch (dbError) {
      console.error('Database error:', dbError);

      if (adminView && session.user.role === 'admin') {
        return NextResponse.json({
          success: false,
          error: 'Database connection failed',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          stats: {
            totalTransactions: 0,
            pendingTransactions: 0,
            completedTransactions: 0,
            cancelledTransactions: 0,
            totalVolume: 0,
            todayTransactions: 0
          }
        });
      } else {
        return NextResponse.json([]);
      }
    }

    const transformedTransactions = transactions.map((transaction: any) => {
      const amount = transaction.amount 
        ? (typeof transaction.amount === 'object' && transaction.amount !== null
            ? Number(transaction.amount)
            : Number(transaction.amount))
        : 0;

      return {
        id: transaction.id,
        transactionId: transaction.transactionId || transaction.id?.toString(),
        invoice_id: transaction.invoiceId || transaction.id?.toString(),
        amount: amount,
        bdt_amount: transaction.amount || amount,
        status: transaction.status || 'Processing',
        admin_status: transaction.status || 'Processing',
        method: transaction.paymentGateway || null,
        gateway: transaction.paymentGateway || null,
        payment_method: transaction.paymentMethod || null,
        transaction_id: transaction.transactionId || transaction.id?.toString(),
        createdAt: transaction.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: transaction.updatedAt?.toISOString() || transaction.createdAt?.toISOString() || new Date().toISOString(),
        type: transaction.transactionType || 'deposit',
        transaction_type: transaction.transactionType || 'deposit',
        phone: '',
        currency: transaction.currency || 'BDT',
        userId: transaction.userId,
        user: transaction.user ? {
          id: transaction.user.id,
          name: transaction.user.name || '',
          email: transaction.user.email || '',
          username: transaction.user.username || '',
        } : null,
        notes: '',
        processedAt: transaction.status === 'Success' ? transaction.updatedAt?.toISOString() : null,
      };
    });

    if (adminView && session.user.role === 'admin') {
      const totalPages = Math.ceil(totalCount / limit);

      const stats = {
        totalTransactions: totalCount,
        pendingTransactions: await db.addFunds.count({
          where: { ...where, status: 'Processing' }
        }),
        completedTransactions: await db.addFunds.count({
          where: { ...where, status: 'Success' }
        }),
        cancelledTransactions: await db.addFunds.count({
          where: { ...where, status: 'Cancelled' }
        }),
        totalVolume: await db.addFunds.aggregate({
          where: { ...where, status: 'Success' },
          _sum: { amount: true }
        }).then(result => {
          const sum = result._sum.amount;
          return sum 
            ? (typeof sum === 'object' && sum !== null ? Number(sum) : Number(sum))
            : 0;
        }),
        todayTransactions: await db.addFunds.count({
          where: {
            ...where,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      };

      return NextResponse.json({
        success: true,
        data: transformedTransactions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats,
        error: null
      });
    } else {
      return NextResponse.json(transformedTransactions);
    }

  } catch (error) {
    console.error('Error fetching transactions:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch transactions',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');
    const body = await request.json();
    const { status } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const transaction = await db.addFunds.findUnique({
      where: { id: Number(transactionId) },
      include: { user: true }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };

    const amount = typeof transaction.amount === 'object' && transaction.amount !== null
      ? Number(transaction.amount)
      : Number(transaction.amount || 0);

    if (status === 'approved' || status === 'Success') {
      updateData.status = 'Success';

      if (transaction.status !== 'Success') {
        await db.users.update({
          where: { id: transaction.userId },
          data: {
            balance: { increment: amount },
            total_deposit: { increment: amount }
          }
        });
      }
    } else if (status === 'cancelled' || status === 'Cancelled') {
      updateData.status = 'Cancelled';

      if (transaction.status === 'Success') {
        await db.users.update({
          where: { id: transaction.userId },
          data: {
            balance: { decrement: amount },
            total_deposit: { decrement: amount }
          }
        });
      }
    } else if (status === 'Pending' || status === 'pending') {
      updateData.status = 'Processing';
    }

    const updatedTransaction = await db.addFunds.update({
      where: { id: Number(transactionId) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance: true
          }
        }
      }
    });

    const updatedAmount = typeof updatedTransaction.amount === 'object' && updatedTransaction.amount !== null
      ? Number(updatedTransaction.amount)
      : Number(updatedTransaction.amount || 0);

    return NextResponse.json({
      success: true,
      message: `Transaction ${status} successfully`,
      data: {
        id: updatedTransaction.id,
        transactionId: updatedTransaction.transactionId,
        amount: updatedAmount,
        status: updatedTransaction.status,
        admin_status: updatedTransaction.status,
        currency: updatedTransaction.currency,
        user: updatedTransaction.user,
        updatedAt: updatedTransaction.updatedAt.toISOString()
      },
      error: null
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

