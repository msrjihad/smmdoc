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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: 'insensitive' } },
        { invoiceId: { contains: search, mode: 'insensitive' } },
        { senderNumber: { contains: search, mode: 'insensitive' } },
        { paymentMethod: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      if (status === 'success') {
        where.status = 'Success';
      } else if (status === 'pending') {
        where.status = 'Processing';
      } else if (status === 'failed') {
        where.status = { in: ['Failed', 'Cancelled'] };
      }
    }

    await db.$queryRaw`SELECT 1`;

    const skip = (page - 1) * limit;

    let [transactions, total] = await Promise.all([
      db.addFunds.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: skip,
        select: {
          id: true,
          invoiceId: true,
          usdAmount: true,
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
              name: true,
              email: true,
            },
          },
        },
      }),
      db.addFunds.count({ where })
    ]);
    
    console.log('Raw transactions from database:', transactions.map(tx => ({
      invoiceId: tx.invoiceId,
      status: tx.status,
      statusType: typeof tx.status,
      id: tx.id,
      transactionId: tx.transactionId,
      paymentMethod: tx.paymentMethod,
      senderNumber: tx.senderNumber,
      paymentGateway: tx.paymentGateway,
      allFields: Object.keys(tx),
      fullTransaction: tx
    })));

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    const transactionsToRefresh = transactions.filter(tx => {
      const isRecent = tx.createdAt >= tenMinutesAgo;
      const needsRefresh = !tx.transactionId || 
                          !tx.paymentMethod || 
                          tx.status === 'Processing' ||
                          tx.transactionId === tx.invoiceId;
      return isRecent && needsRefresh && tx.paymentGateway === 'UddoktaPay';
    });

    if (transactionsToRefresh.length > 0) {
      console.log(`Auto-refreshing ${transactionsToRefresh.length} recent transactions from payment gateway...`);
      
      const refreshPromises = transactionsToRefresh.map(async (transaction) => {
        try {
          const { getPaymentGatewayApiKey, getPaymentGatewayVerifyUrl } = await import('@/lib/payment-gateway-config');
          const apiKey = await getPaymentGatewayApiKey();
          const verifyUrl = await getPaymentGatewayVerifyUrl();
          
          if (!apiKey || !verifyUrl) {
            return null;
          }

          const verificationResponse = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'RT-UDDOKTAPAY-API-KEY': apiKey,
            },
            body: JSON.stringify({ invoice_id: transaction.invoiceId }),
          });

          if (!verificationResponse.ok) {
            return null;
          }

          const verificationData = await verificationResponse.json();
          
          const extractedTransactionId = verificationData.transaction_id || 
                                       verificationData.transactionId || 
                                       verificationData.trx_id || 
                                       verificationData.trxId ||
                                       verificationData.transactionID ||
                                       verificationData.data?.transaction_id ||
                                       verificationData.data?.transactionId ||
                                       verificationData.payment?.transaction_id ||
                                       null;

          const extractedPaymentMethod = verificationData.payment_method || 
                                       verificationData.paymentMethod || 
                                       verificationData.payment_method_name ||
                                       verificationData.method ||
                                       null;

          const extractedSenderNumber = verificationData.sender_number || 
                                      verificationData.senderNumber || 
                                      verificationData.phone ||
                                      verificationData.sender_phone ||
                                      null;

          let newStatus = transaction.status;
          if (verificationData.status === 'COMPLETED' || verificationData.status === 'SUCCESS') {
            newStatus = 'Success';
          } else if (verificationData.status === 'PENDING') {
            newStatus = 'Processing';
          } else if (verificationData.status === 'ERROR' || verificationData.status === 'CANCELLED' || verificationData.status === 'FAILED') {
            newStatus = 'Cancelled';
          }

          const validTransactionId = extractedTransactionId && 
                                   extractedTransactionId !== transaction.invoiceId
                                   ? extractedTransactionId 
                                   : null;

          const updateData: any = {};
          
          if (validTransactionId && validTransactionId !== transaction.transactionId) {
            updateData.transactionId = validTransactionId;
          }
          
          if (extractedPaymentMethod && extractedPaymentMethod !== transaction.paymentMethod) {
            updateData.paymentMethod = extractedPaymentMethod;
          }
          
          if (extractedSenderNumber && extractedSenderNumber !== transaction.senderNumber) {
            updateData.senderNumber = extractedSenderNumber;
          }

          if (newStatus !== transaction.status) {
            updateData.status = newStatus;
          }

          if (Object.keys(updateData).length > 0) {
            const updated = await db.addFunds.update({
              where: { invoiceId: transaction.invoiceId },
              data: updateData,
            });

            if (updateData.transactionId) {
              transaction.transactionId = updateData.transactionId;
            }
            if (updateData.paymentMethod) {
              transaction.paymentMethod = updateData.paymentMethod;
            }
            if (updateData.senderNumber) {
              transaction.senderNumber = updateData.senderNumber;
            }
            if (updateData.status) {
              transaction.status = updateData.status;
            }

            console.log(`Updated transaction ${transaction.invoiceId} with gateway data:`, updateData);
            console.log(`Updated transaction object:`, {
              transactionId: transaction.transactionId,
              paymentMethod: transaction.paymentMethod,
              status: transaction.status
            });
          }
        } catch (error) {
          console.error(`Error refreshing transaction ${transaction.invoiceId} from gateway:`, error);
        }
      });

      await Promise.all(refreshPromises).catch(err => {
        console.error('Error in batch transaction refresh:', err);
      });
      
      if (transactionsToRefresh.length > 0) {
        console.log('Re-fetching transactions after auto-refresh...');
        const refreshedTransactions = await db.addFunds.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: skip,
          select: {
            id: true,
            invoiceId: true,
            usdAmount: true,
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
                name: true,
                email: true,
              },
            },
          },
        });
        
        transactions.length = 0;
        transactions.push(...refreshedTransactions);
        console.log('Transactions refreshed, updated transactionId and paymentMethod values:', 
          transactions.map(tx => ({
            invoiceId: tx.invoiceId,
            transactionId: tx.transactionId,
            paymentMethod: tx.paymentMethod,
            status: tx.status
          }))
        );
      }
    }

    const totalPages = Math.ceil(total / limit);

    const transformedTransactions = transactions.map((transaction) => {
      const dbStatus = transaction.status || 'Processing';
      const mappedStatus = mapStatus(dbStatus);
      
      let finalTransactionId = transaction.transactionId || null;
      if (finalTransactionId && finalTransactionId === transaction.invoiceId) {
        console.warn(`Transaction ${transaction.invoiceId} has transactionId matching invoiceId - setting to null`);
        finalTransactionId = null;
      }
      
      console.log('Transaction mapping (status + transaction_id):', {
        invoiceId: transaction.invoiceId,
        rawTransactionId: transaction.transactionId,
        finalTransactionId,
        paymentMethod: transaction.paymentMethod,
        senderNumber: transaction.senderNumber,
        paymentGateway: transaction.paymentGateway,
        dbStatus,
        mappedStatus,
        isTransactionIdValid: finalTransactionId !== null && finalTransactionId !== transaction.invoiceId,
        rawTransaction: {
          id: transaction.id,
          status: transaction.status,
          invoiceId: transaction.invoiceId,
          transactionId: transaction.transactionId,
          paymentMethod: transaction.paymentMethod,
          paymentGateway: transaction.paymentGateway,
          senderNumber: transaction.senderNumber,
        }
      });
      
      const usdAmount = typeof transaction.usdAmount === 'object' && transaction.usdAmount !== null
        ? Number(transaction.usdAmount)
        : Number(transaction.usdAmount || 0);
      
      const amount = transaction.amount 
        ? (typeof transaction.amount === 'object' && transaction.amount !== null
            ? Number(transaction.amount)
            : Number(transaction.amount))
        : usdAmount;
      
      return {
        id: transaction.id,
        invoice_id: transaction.invoiceId || transaction.id,
        amount: amount,
        usdAmount: usdAmount,
        status: mappedStatus,
        method: transaction.paymentGateway || 'UddoktaPay',
        payment_method: transaction.paymentMethod || 'UddoktaPay',
        transaction_id: finalTransactionId,
        createdAt: transaction.createdAt.toISOString(),
        sender_number: transaction.senderNumber || '',
        phone: transaction.senderNumber || '',
        currency: transaction.currency || 'USD',
      };
    });

    return NextResponse.json({
      transactions: transformedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

function mapStatus(dbStatus: string | null | undefined): 'Success' | 'Processing' | 'Cancelled' | 'Failed' {
  if (!dbStatus) {
    console.warn('mapStatus: dbStatus is null/undefined, defaulting to Processing');
    return 'Processing';
  }
  
  const normalizedStatus = String(dbStatus).trim();
  
  switch (normalizedStatus) {
    case 'Success':
    case 'success':
    case 'SUCCESS':
    case 'Completed':
    case 'completed':
    case 'COMPLETED':
      return 'Success';
    case 'Processing':
    case 'processing':
    case 'PROCESSING':
    case 'Pending':
    case 'pending':
    case 'PENDING':
      return 'Processing';
    case 'Cancelled':
    case 'cancelled':
    case 'CANCELLED':
    case 'Canceled':
    case 'canceled':
    case 'CANCELED':
      return 'Cancelled';
    case 'Failed':
    case 'failed':
    case 'FAILED':
    case 'Error':
    case 'error':
    case 'ERROR':
      return 'Failed';
    default:
      console.warn(`mapStatus: Unknown status "${normalizedStatus}", defaulting to Processing`);
      return 'Processing';
  }
}
