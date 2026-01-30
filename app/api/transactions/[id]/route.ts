import { auth } from '@/auth';
import { db } from '@/lib/db';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { sendMail } from '@/lib/nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const transaction = await db.addFunds.findUnique({
      where: { id: transactionId },
      include: { user: true }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    let updateData: {
      status?: string;
    } = {};
    let balanceChange = 0;
    let notificationMessage = '';

    const result = await db.$transaction(async (prisma) => {
      const currentUser = await prisma.users.findUnique({
        where: { id: transaction.userId },
        select: { balance: true, name: true, email: true }
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      if (status === 'approved' || status === 'Success') {
        updateData = {
          status: 'Success'
        };

        if (transaction.status !== 'Success' && transaction.status !== 'approved') {
          const usdAmount = typeof transaction.amount === 'object' && transaction.amount !== null
            ? Number(transaction.amount)
            : Number(transaction.amount || 0);
          balanceChange = usdAmount;
          await prisma.users.update({
            where: { id: transaction.userId },
            data: {
              balance: { increment: usdAmount },
              total_deposit: { increment: usdAmount }
            }
          });
          notificationMessage = `Your deposit of $${usdAmount} has been approved and added to your account.`;
        }
      } else if (status === 'cancelled' || status === 'Cancelled') {
        updateData = {
          status: 'Cancelled'
        };
        const usdAmount = typeof transaction.amount === 'object' && transaction.amount !== null
          ? Number(transaction.amount)
          : Number(transaction.amount || 0);
        notificationMessage = `Your deposit of $${usdAmount} has been cancelled.`;
      } else if (status === 'Pending' || status === 'pending') {
        updateData = {
          status: 'Processing'
        };

        const usdAmount = typeof transaction.amount === 'object' && transaction.amount !== null
          ? Number(transaction.amount)
          : Number(transaction.amount || 0);

        if (transaction.status === 'Success') {
          if (currentUser.balance >= usdAmount) {
            balanceChange = -usdAmount;
            await prisma.users.update({
              where: { id: transaction.userId },
              data: {
                balance: { decrement: usdAmount },
                total_deposit: { decrement: usdAmount }
              }
            });
            notificationMessage = `Your transaction of $${usdAmount} has been moved to pending status. Amount has been deducted from your account.`;
          } else {
            const deductAmount = currentUser.balance;
            balanceChange = -deductAmount;
            await prisma.users.update({
              where: { id: transaction.userId },
              data: {
                balance: 0,
                total_deposit: { decrement: deductAmount }
              }
            });
            notificationMessage = `Your transaction of $${usdAmount} has been moved to pending status. Available balance of $${deductAmount} has been deducted from your account.`;
          }
        } else {
          notificationMessage = `Your deposit of $${usdAmount} is now pending review.`;
        }
      } else {
        updateData = {
          status: status
        };
        notificationMessage = `Your transaction status has been updated to ${status}.`;
      }

      const updatedTransaction = await prisma.addFunds.update({
        where: { id: transactionId },
        data: updateData
      });

      return { updatedTransaction, currentUser, balanceChange, notificationMessage };
    });

    try {
      if (result.currentUser.email && notificationMessage) {
        const usdAmount = typeof transaction.amount === 'object' && transaction.amount !== null
          ? Number(transaction.amount)
          : Number(transaction.amount || 0);
        const emailData = await resolveEmailContent(
          'transaction_payment_success',
          {
            ...templateContextFromUser(result.currentUser),
            fund_amount: String(usdAmount),
            transaction_id: transaction.transactionId ?? String(transaction.id),
          }
        );
        if (emailData) {
          await sendMail({
            sendTo: result.currentUser.email,
            subject: emailData.subject,
            html: emailData.html,
            fromName: emailData.fromName ?? undefined,
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: `Transaction updated to ${updateData.status || status} successfully`,
      data: result.updatedTransaction,
      balanceChange: result.balanceChange,
      notification: result.notificationMessage
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const transactionId = parseInt(id);

    if (isNaN(transactionId)) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const transaction = await db.addFunds.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.userId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const usdAmount = typeof transaction.amount === 'object' && transaction.amount !== null
      ? Number(transaction.amount)
      : Number(transaction.amount || 0);
    const transformedTransaction = {
      id: transaction.id,
      invoice_id: transaction.invoiceId || transaction.id.toString(),
      amount: usdAmount,
      status: mapStatus(transaction.status || 'Processing'),
      method: transaction.paymentGateway || 'UddoktaPay',
      payment_method: transaction.paymentMethod || 'UddoktaPay',
      transaction_id: transaction.transactionId || transaction.id.toString(),
      createdAt: transaction.createdAt.toISOString(),
      phone: null,
      currency: transaction.currency || 'USD',
      admin_status: transaction.status,
    };

    return NextResponse.json(transformedTransaction);

  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

function mapStatus(status: string): string {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'completed':
      return 'success';
    case 'processing':
    case 'pending':
      return 'pending';
    case 'failed':
    case 'cancelled':
      return 'failed';
    default:
      return 'pending';
  }
}
