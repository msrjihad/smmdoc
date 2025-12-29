import { auth } from '@/auth';
import { ActivityLogger, getClientIP } from '@/lib/activity-logger';
import { db } from '@/lib/db';
import { emailTemplates, transactionEmailTemplates } from '@/lib/email-templates';
import { sendMail } from '@/lib/nodemailer';
import { NextRequest, NextResponse } from 'next/server';

function serverConvertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  currencies: any[]
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromCurrencyData = currencies.find(c => c.code === fromCurrency);
  const toCurrencyData = currencies.find(c => c.code === toCurrency);

  console.log('Server currency conversion debug:', {
    amount,
    fromCurrency,
    toCurrency,
    fromCurrencyData: fromCurrencyData ? { code: fromCurrencyData.code, rate: fromCurrencyData.rate } : null,
    toCurrencyData: toCurrencyData ? { code: toCurrencyData.code, rate: toCurrencyData.rate } : null
  });

  if (!fromCurrencyData || !toCurrencyData) {
    console.warn('Currency not found, returning original amount');
    return amount;
  }

  let convertedAmount: number;

  if (fromCurrency === 'USD') {
    convertedAmount = amount * Number(toCurrencyData.rate);
  } else if (toCurrency === 'USD') {
    convertedAmount = amount / Number(fromCurrencyData.rate);
  } else {
    const usdAmount = amount / Number(fromCurrencyData.rate);
    convertedAmount = usdAmount * Number(toCurrencyData.rate);
  }

  console.log('Server conversion result:', { original: amount, converted: convertedAmount });
  return convertedAmount;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const clientIP = getClientIP(request);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, amount, action, notes, adminCurrency } = body;

    if (!username || !amount || !action) {
      return NextResponse.json(
        {
          error: 'Username, amount, and action are required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        {
          error: 'Amount must be greater than 0',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (!['add', 'deduct'].includes(action)) {
      return NextResponse.json(
        {
          error: 'Action must be either "add" or "deduct"',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const user = await db.users.findUnique({
      where: { username: username },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        balance: true,
        dollarRate: true
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    const availableCurrencies = await db.currencies.findMany({
      where: { enabled: true },
      orderBy: { code: 'asc' }
    });

    const adminCurrencyInfo = availableCurrencies.find((c: any) => c.code === adminCurrency);
    const adminCurrencySymbol = adminCurrencyInfo?.symbol || '$';

    let amountToAdd: number;

    console.log('Currency conversion:', {
      adminCurrency,
      amount,
      availableCurrencies: availableCurrencies.map(c => ({ code: c.code, rate: c.rate }))
    });

    if (adminCurrency === 'USD') {
      amountToAdd = amount;
    } else {
      amountToAdd = serverConvertCurrency(amount, adminCurrency, 'USD', availableCurrencies);
      console.log('Converted amount:', { original: amount, converted: amountToAdd });
    }

    const transactionCurrency = adminCurrency;
    const errorCurrencySymbol = adminCurrencySymbol;
    const successMessage = `Successfully ${action === 'add' ? 'added' : 'deducted'} ${adminCurrencySymbol}${amount} ${action === 'add' ? 'to' : 'from'} ${user.username}'s balance`;

    if (action === 'deduct' && user.balance < amountToAdd) {
      return NextResponse.json(
        {
          error: `Insufficient balance. User has à§³${user.balance.toFixed(2)}, trying to deduct ${errorCurrencySymbol}${amount}`,
          success: false,
          data: null
        },
        { status: 400 }
      );
    }



    const result = await db.$transaction(async (prisma) => {
      const updatedUser = await prisma.users.update({
        where: { id: user.id },
        data: {
          balance: action === 'add'
            ? { increment: amountToAdd }
            : { decrement: amountToAdd },
          total_deposit: action === 'add'
            ? { increment: amountToAdd }
            : undefined
        }
      });

      const bdtRate = availableCurrencies.find((c: any) => c.code === 'BDT')?.rate || 120;
      const amountBDT = amountToAdd * Number(bdtRate);

      const transactionRecord = await prisma.addFunds.create({
        data: {
          userId: user.id,
          invoiceId: `MANUAL-${Date.now()}`,
          usdAmount: amountToAdd,
          amount: amountBDT,
          email: user.email || '',
          name: user.name || '',
          status: 'Success',
          paymentGateway: 'manual_adjustment',
          paymentMethod: `Admin Manual Adjustment (${adminCurrencySymbol}${amount} ${adminCurrency})`,
          senderNumber: '',
          transactionId: action === 'add' ? 'Added by Admin' : 'Deducted by Admin',
          currency: 'USD'
        }
      });

      return { updatedUser, transactionRecord };
    });

    try {
      if (user.email) {
        const displayAmount = `${adminCurrencySymbol}${amount}`;
        const notificationMessage = action === 'add'
          ? `${displayAmount} has been added to your account by admin.`
          : `${displayAmount} has been deducted from your account by admin.`;

        const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
        const supportEmail = await getSupportEmail();
        const whatsappNumber = await getWhatsAppNumber();
        
        const emailData = emailTemplates.paymentSuccess({
          userName: user.name || 'Customer',
          userEmail: user.email,
          transactionId: result.transactionRecord.id.toString(),
          amount: amount.toString(),
          currency: transactionCurrency,
          date: new Date().toLocaleDateString(),
          userId: user.id.toString(),
          supportEmail: supportEmail,
          whatsappNumber: whatsappNumber,
        });

        await sendMail({
          sendTo: user.email,
          subject: `Balance ${action === 'add' ? 'Added' : 'Deducted'} - Manual Adjustment`,
          html: emailData.html
            .replace('Payment Successful!', `Balance ${action === 'add' ? 'Added' : 'Deducted'}`)
            .replace('Your payment has been successfully processed', notificationMessage)
            .replace('funds have been added to your account', `your new balance is à§³${result.updatedUser.balance}`)
        });
      }

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const { getSupportEmail, getWhatsAppNumber } = await import('@/lib/utils/general-settings');
      const supportEmail = await getSupportEmail();
      const whatsappNumber = await getWhatsAppNumber();
      
      const adminEmailData = transactionEmailTemplates.adminAutoApproved({
        userName: user.name || 'Unknown User',
        userEmail: user.email || '',
        transactionId: result.transactionRecord.id.toString(),
        amount: amount.toString(),
        currency: transactionCurrency,
        date: new Date().toLocaleDateString(),
        supportEmail: supportEmail,
        whatsappNumber: whatsappNumber,
        userId: user.id.toString()
      });

      await sendMail({
        sendTo: adminEmail,
        subject: `Manual Balance ${action === 'add' ? 'Addition' : 'Deduction'} - ${user.username}`,
        html: adminEmailData.html
          .replace('Auto-Approved', `Manual ${action === 'add' ? 'Addition' : 'Deduction'}`)
          .replace('has been automatically approved', `balance has been manually ${action === 'add' ? 'added' : 'deducted'} by admin`)
      });
    } catch (emailError) {
      console.error('Error sending notification emails:', emailError);
    }

     try {
       const adminUsername = session.user.username || session.user.email?.split('@')[0] || `admin${session.user.id}`;
       const targetUsername = user.username || user.email?.split('@')[0] || `user${user.id}`;
       
       if (action === 'add') {
         await ActivityLogger.balanceAdded(
           session.user.id,
           adminUsername,
           user.id,
           targetUsername,
           amountToAdd,
           'USD',
           clientIP
         );
       } else {
         await ActivityLogger.balanceDeducted(
           session.user.id,
           adminUsername,
           user.id,
           targetUsername,
           amountToAdd,
           'USD',
           clientIP
         );
       }
     } catch (logError) {
       console.error('Failed to log balance activity:', logError);
     }

    return NextResponse.json({
      success: true,
      message: successMessage,
      data: {
        userId: user.id,
        username: user.username,
        previousBalance: user.balance,
        newBalance: result.updatedUser.balance,
        amount: amount,
        amountAdded: amountToAdd,
        adminCurrency: transactionCurrency,
        action: action,
        transactionId: result.transactionRecord.id
      }
    });

  } catch (error) {
    console.error('Error updating user balance:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to update user balance: ' + (error instanceof Error ? error.message : String(error)),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
