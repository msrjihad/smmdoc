import { auth } from '@/auth';
import { db } from '@/lib/db';
import { convertCurrency, convertToUSD, fetchCurrencyData } from '@/lib/currency-utils';
import { sendTransferFundsNotification } from '@/lib/notifications/user-notifications';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { username, amount, currency } = body;

    if (!username || !amount || !currency) {
      return NextResponse.json(
        { error: 'Username, amount, and currency are required' },
        { status: 400 }
      );
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const { currencies } = await fetchCurrencyData();
    const amountUSD = convertToUSD(transferAmount, currency, currencies);

    const sender = await db.users.findUnique({
      where: { id: session.user.id },
    });

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    const receiver = await db.users.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
        ],
      },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    if (receiver.id === sender.id) {
      return NextResponse.json(
        { error: 'You cannot transfer fund yourself!' },
        { status: 400 }
      );
    }

    const userSettings = await db.userSettings.findFirst();
    const feePercentage = userSettings?.transferFundsPercentage || 3;
    const fee = (transferAmount * feePercentage) / 100;
    const totalDeduction = transferAmount + fee;
    const totalDeductionUSD = convertToUSD(totalDeduction, currency, currencies);

    const senderBalanceUSD = sender.balanceUSD || 0;
    const senderBalance = sender.balance || 0;
    const senderCurrency = sender.currency || 'USD';
    
    let availableBalanceUSD = senderBalanceUSD;
    
    if (senderBalance > 0) {
      if (senderCurrency === 'USD') {
        availableBalanceUSD = Math.max(senderBalanceUSD, senderBalance);
      } else {
        const balanceInUSD = convertToUSD(senderBalance, senderCurrency, currencies);
        availableBalanceUSD = Math.max(senderBalanceUSD, balanceInUSD);
      }
    }
    
    if (availableBalanceUSD < totalDeductionUSD) {
      const availableInCurrency = currency === 'USD' 
        ? availableBalanceUSD 
        : convertCurrency(availableBalanceUSD, 'USD', currency, currencies);
      return NextResponse.json(
        { 
          error: 'Insufficient balance',
          details: `Available: ${availableInCurrency.toFixed(2)} ${currency}, Required: ${totalDeduction.toFixed(2)} ${currency}`
        },
        { status: 400 }
      );
    }

    const generateRandomString = (length: number): string => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const transactionId = `${generateRandomString(8)}`;

    const result = await db.$transaction(async (prisma) => {
      await prisma.users.update({
        where: { id: sender.id },
        data: {
          balance: { decrement: totalDeduction },
          balanceUSD: { decrement: totalDeductionUSD },
        },
      });

      await prisma.users.update({
        where: { id: receiver.id },
        data: {
          balance: { increment: transferAmount },
          balanceUSD: { increment: amountUSD },
        },
      });

      const totalDeductionBDT = convertCurrency(totalDeductionUSD, 'USD', 'BDT', currencies);
      const transferAmountBDT = convertCurrency(amountUSD, 'USD', 'BDT', currencies);

      const senderTransaction = await prisma.addFunds.create({
        data: {
          invoiceId: null as any,
          amount: totalDeductionUSD.toString(),
          gatewayAmount: totalDeductionBDT,
          email: sender.email || '',
          name: sender.name || '',
          status: 'Success',
          paymentGateway: 'transfer',
          paymentMethod: 'Manual',
          transactionId: transactionId,
          transactionType: 'transfer' as any,
          userId: sender.id,
          currency: currency,
        },
      });

      const receiverTransaction = await prisma.addFunds.create({
        data: {
          invoiceId: null as any,
          amount: amountUSD.toString(),
          gatewayAmount: transferAmountBDT,
          email: receiver.email || '',
          name: receiver.name || '',
          status: 'Success',
          paymentGateway: 'transfer',
          paymentMethod: 'Manual',
          transactionId: transactionId,
          transactionType: 'received' as any,
          userId: receiver.id,
          currency: currency,
        },
      });

      return { senderTransaction, receiverTransaction };
    });

    const currencyData = await db.currencies.findUnique({
      where: { code: currency },
      select: { symbol: true }
    });
    const currencySymbol = currencyData?.symbol || '$';

    try {
      await sendTransferFundsNotification(
        sender.id,
        receiver.id,
        transferAmount,
        currency,
        currencySymbol,
        sender.username || sender.name || 'User',
        receiver.username || receiver.name || 'User'
      );
    } catch (notificationError) {
      console.error('Error sending transfer funds notifications:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ${transferAmount} ${currency} to ${receiver.username || receiver.name}`,
      data: {
        transactionId,
        amount: transferAmount,
        fee,
        totalDeduction,
        currency,
        receiver: {
          id: receiver.id,
          username: receiver.username,
          name: receiver.name,
        },
      },
    });
  } catch (error) {
    console.error('Transfer funds error:', error);
    return NextResponse.json(
      { error: 'Failed to transfer funds', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

