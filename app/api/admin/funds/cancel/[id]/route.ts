import { auth } from '@/auth';
import { db } from '@/lib/db';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { sendMail } from '@/lib/nodemailer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const transactionId = parseInt(id);

    if (!transactionId || isNaN(transactionId)) {
      return NextResponse.json(
        { error: 'Valid transaction ID is required' },
        { status: 400 }
      );
    }

    const transaction = await db.addFunds.findUnique({
      where: { id: transactionId },
      include: { user: true }
    });
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    if (transaction.status === 'Cancelled') {
      return NextResponse.json(
        { error: 'Transaction is already cancelled' },
        { status: 400 }
      );
    }
    
    if (transaction.status === 'Success') {
      return NextResponse.json(
        { error: 'Cannot cancel an approved transaction' },
        { status: 400 }
      );
    }
    
    if (transaction.status !== 'Processing' && transaction.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Transaction is not pending approval' },
        { status: 400 }
      );
    }
    
    try {
      await db.addFunds.update({
        where: { id: transactionId },
        data: {
          status: "Cancelled",
          updatedAt: new Date(),
        }
      });

      if (transaction.user.email) {
        const emailData = await resolveEmailContent(
          'transaction_payment_cancelled',
          {
            ...templateContextFromUser(transaction.user),
            fund_amount: String(transaction.amount ?? ''),
            transaction_id: transaction.transactionId ?? String(transaction.id),
          }
        );
        if (emailData) {
          await sendMail({
            sendTo: transaction.user.email,
            subject: emailData.subject,
            html: emailData.html,
            fromName: emailData.fromName ?? undefined,
          });
        }
      }

      console.log(`Admin ${session.user.id} cancelled transaction ${transactionId} for user ${transaction.userId}`);
      
      return NextResponse.json({
        success: true,
        message: 'Transaction cancelled successfully',
        data: {
          transactionId: transaction.id,
          amount: typeof transaction.amount === 'object' && transaction.amount !== null
            ? Number(transaction.amount)
            : Number(transaction.amount || 0),
          userId: transaction.userId,
          status: 'Cancelled'
        }
      });
    } catch (updateError) {
      console.error("Error updating payment status:", updateError);
      return NextResponse.json(
        { error: "Failed to cancel transaction" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    return NextResponse.json(
      { error: 'Failed to cancel transaction', details: String(error) },
      { status: 500 }
    );
  }
}
