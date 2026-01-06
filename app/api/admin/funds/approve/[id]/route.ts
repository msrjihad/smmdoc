import { auth } from '@/auth';
import { db } from '@/lib/db';
import { emailTemplates, transactionEmailTemplates } from '@/lib/email-templates';
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
        const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
        const supportEmail = await getSupportEmail();
        const whatsappNumber = await getWhatsAppNumber();
        
        const emailData = emailTemplates.paymentSuccess({
          userName: transaction.user.name || 'Customer',
          userEmail: transaction.user.email,
          transactionId: (transaction.transactionId || transaction.invoiceId || '0').toString(),
          amount: transaction.amount.toString(),
          currency: transaction.currency || 'BDT',
          date: new Date().toLocaleDateString(),
          userId: transaction.userId.toString(),
          supportEmail: supportEmail,
          whatsappNumber: whatsappNumber,
        });
        
        await sendMail({
          sendTo: transaction.user.email,
          subject: emailData.subject,
          html: emailData.html
        });
      }

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
      const supportEmail = await getSupportEmail();
      const whatsappNumber = await getWhatsAppNumber();
      
      const adminEmailData = transactionEmailTemplates.adminAutoApproved({
        userName: transaction.user.name || 'Unknown User',
        userEmail: transaction.user.email || '',
        transactionId: (transaction.transactionId || transaction.invoiceId || '0').toString(),
        amount: transaction.amount.toString(),
        currency: transaction.currency || 'USD',
        date: new Date().toLocaleDateString(),
        userId: transaction.userId.toString(),
        supportEmail: supportEmail,
        whatsappNumber: whatsappNumber,
      });
      
      await sendMail({
        sendTo: adminEmail,
        subject: adminEmailData.subject,
        html: adminEmailData.html
      });
      
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
