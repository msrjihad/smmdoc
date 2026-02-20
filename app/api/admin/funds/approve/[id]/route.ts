import { auth } from '@/auth';
import { db } from '@/lib/db';
import { resolveEmailContent } from '@/lib/email-templates/resolve-email-content';
import { templateContextFromUser } from '@/lib/email-templates/replace-template-variables';
import { sendMail } from '@/lib/nodemailer';
import { sendTransactionSuccessNotification } from '@/lib/notifications/user-notifications';
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
    
    if (transaction.status === 'Success') {
      return NextResponse.json(
        { error: 'Transaction is already approved' },
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
      await db.$transaction(async (prisma) => {
        await prisma.addFunds.update({
          where: { id: transactionId },
          data: {
            status: "Success",
            updatedAt: new Date(),
          }
        });
        
        const user = await prisma.users.update({
          where: { id: transaction.userId },
          data: {
            balance: { increment: Number(transaction.amount) },
            total_deposit: { increment: Number(transaction.amount) }
          }
        });
        
        console.log(`User ${transaction.userId} balance updated. New balance: ${user.balance}`);

        try {
          await sendTransactionSuccessNotification(
            transaction.userId,
            transactionId,
            Number(transaction.amount)
          );
        } catch (notifError) {
          console.error('Error sending transaction success notification:', notifError);
        }
      });

      if (transaction.user.email) {
        const emailData = await resolveEmailContent(
          'transaction_payment_success',
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

      return NextResponse.json({
        success: true,
        message: 'Transaction approved successfully',
        data: {
          transactionId: transaction.id,
          amount: transaction.amount,
          userId: transaction.userId,
          status: 'Success'
        }
      });
    } catch (transactionError) {
      console.error("Error updating payment and user balance:", transactionError);
      return NextResponse.json(
        { error: "Failed to approve transaction" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error approving transaction:', error);
    return NextResponse.json(
      { error: 'Failed to approve transaction', details: String(error) },
      { status: 500 }
    );
  }
}
