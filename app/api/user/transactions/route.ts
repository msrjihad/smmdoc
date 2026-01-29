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
          amount: true,
          status: true,
          paymentGateway: true,
          paymentMethod: true,
          transactionId: true,
          currency: true,
          transactionType: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              username: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.addFunds.count({ where })
    ]);

    if (process.env.NODE_ENV === 'development' && transactions.length > 0) {
      console.log(`Fetched ${transactions.length} transactions from database`);
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const transactionsToRefresh = transactions.filter(tx => {
      const isRecent = tx.createdAt >= fiveMinutesAgo;
      const needsRefresh = (!tx.transactionId ||
                          !tx.paymentMethod ||
                          tx.status === 'Processing') &&
                          tx.transactionId !== tx.invoiceId;
      return isRecent && needsRefresh && tx.paymentGateway === 'UddoktaPay';
    });

    if (transactionsToRefresh.length > 0) {

      const transactionsToRefreshLimited = transactionsToRefresh.slice(0, 3);

      if (process.env.NODE_ENV === 'development') {
        console.log(`Auto-refreshing ${transactionsToRefreshLimited.length} recent transactions from payment gateway...`);
      }

      const refreshPromises = transactionsToRefreshLimited.map(async (transaction) => {
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
            const errorText = await verificationResponse.text();

            if (verificationResponse.status !== 403) {
              console.error(`Gateway verify API error for ${transaction.invoiceId}:`, {
                status: verificationResponse.status,
                statusText: verificationResponse.statusText,
                url: verifyUrl,
                responsePreview: errorText.substring(0, 200)
              });
            } else if (process.env.NODE_ENV === 'development') {
              console.warn(`Gateway verify API returned 403 (Forbidden) for ${transaction.invoiceId}. This usually means the endpoint doesn't allow server-side access. URL: ${verifyUrl}`);
            }
            return null;
          }

          const contentType = verificationResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const responseText = await verificationResponse.text();
            console.error(`Gateway verify API returned non-JSON for ${transaction.invoiceId}:`, {
              contentType,
              responsePreview: responseText.substring(0, 200),
              url: verifyUrl
            });
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

          const validTransactionId = extractedTransactionId &&
                                   extractedTransactionId !== transaction.invoiceId
                                   ? extractedTransactionId
                                   : null;

          let newStatus = transaction.status;
          if (verificationData.status === 'COMPLETED' || verificationData.status === 'SUCCESS') {
            newStatus = 'Success';
          } else if (verificationData.status === 'PENDING') {
            newStatus = 'Processing';
          } else if (verificationData.status === 'ERROR' || verificationData.status === 'CANCELLED' || verificationData.status === 'FAILED') {

            if (validTransactionId || transaction.status === 'Cancelled' || transaction.status === 'Success') {
              newStatus = 'Cancelled';
            } else {

              newStatus = 'Processing';
            }
          }

          const updateData: any = {};

          if (validTransactionId && validTransactionId !== transaction.transactionId) {
            updateData.transactionId = validTransactionId;
          }

          if (extractedPaymentMethod && extractedPaymentMethod !== transaction.paymentMethod) {
            updateData.paymentMethod = extractedPaymentMethod;
          }

          if (newStatus !== transaction.status) {
            updateData.status = newStatus;
          }

          if (Object.keys(updateData).length > 0) {

            if (updateData.status === 'Success' && transaction.status !== 'Success') {
              await db.$transaction(async (prisma) => {
                const paymentRecord = await prisma.addFunds.findUnique({
                  where: transaction.invoiceId
                    ? { invoiceId: transaction.invoiceId }
                    : { id: transaction.id },
                  include: { user: true }
                });

                if (paymentRecord && paymentRecord.user) {
                  const originalAmount = Number(paymentRecord.amount) || 0;

                  const userSettings = await prisma.userSettings.findFirst();
                  let bonusAmount = 0;

                  if (userSettings && userSettings.bonusPercentage > 0) {
                    bonusAmount = (originalAmount * userSettings.bonusPercentage) / 100;
                  }

                  const totalAmountToAdd = originalAmount + bonusAmount;

                  await prisma.users.update({
                    where: { id: paymentRecord.userId },
                    data: {
                      balance: { increment: totalAmountToAdd },
                      balanceUSD: { increment: originalAmount },
                      total_deposit: { increment: originalAmount }
                    }
                  });

                  if (process.env.NODE_ENV === 'development') {
                    console.log(`User ${paymentRecord.userId} balance updated. Original: ${originalAmount}, Bonus: ${bonusAmount}, Total: ${totalAmountToAdd}`);
                  }
                }

                await prisma.addFunds.update({
                  where: transaction.invoiceId
                    ? { invoiceId: transaction.invoiceId }
                    : { id: transaction.id },
                  data: updateData,
                });
              });
            } else {

              await db.addFunds.update({
                where: transaction.invoiceId
                  ? { invoiceId: transaction.invoiceId }
                  : { id: transaction.id },
                data: updateData,
              });
            }

            if (updateData.transactionId) {
              transaction.transactionId = updateData.transactionId;
            }
            if (updateData.paymentMethod) {
              transaction.paymentMethod = updateData.paymentMethod;
            }
            if (updateData.status) {
              transaction.status = updateData.status;
            }

            if (process.env.NODE_ENV === 'development') {
              console.log(`Updated transaction ${transaction.invoiceId} with gateway data:`, updateData);
            }
          }
        } catch (error) {
          console.error(`Error refreshing transaction ${transaction.invoiceId} from gateway:`, error);
        }
      });

      await Promise.all(refreshPromises).catch(err => {
        console.error('Error in batch transaction refresh:', err);
      });

      if (transactionsToRefresh.length > 0) {

        if (process.env.NODE_ENV === 'development') {
          console.log('Re-fetching transactions after auto-refresh...');
        }
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
            amount: true,
            status: true,
            paymentGateway: true,
            paymentMethod: true,
            transactionId: true,
            currency: true,
            transactionType: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            user: {
              select: {
                username: true,
                name: true,
                email: true,
              },
            },
          },
        });

        transactions.length = 0;
        transactions.push(...refreshedTransactions);

        if (process.env.NODE_ENV === 'development') {
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
    }

    const totalPages = Math.ceil(total / limit);

    const transferTransactions = transactions.filter(tx =>
      tx.transactionType === 'transfer' || tx.transactionType === 'received'
    );

    const relatedUserInfo = new Map<number, { username?: string | null; name?: string | null }>();

    if (transferTransactions.length > 0) {
      const transactionIds = transferTransactions
        .map(tx => tx.transactionId)
        .filter((id): id is string => id !== null && id !== undefined);

      if (transactionIds.length > 0) {
        const relatedTransactions = await db.addFunds.findMany({
          where: {
            transactionId: { in: transactionIds },
            userId: { not: session.user.id },
          },
          select: {
            transactionId: true,
            transactionType: true,
            user: {
              select: {
                username: true,
                name: true,
              },
            },
          },
        });

        transactions.forEach(tx => {
          if (tx.transactionId && (tx.transactionType === 'transfer' || tx.transactionType === 'received')) {
            const relatedTx = relatedTransactions.find(
              rt => rt.transactionId === tx.transactionId && rt.transactionType !== tx.transactionType
            );
            if (relatedTx?.user) {
              relatedUserInfo.set(tx.id, {
                username: relatedTx.user.username,
                name: relatedTx.user.name,
              });
            }
          }
        });
      }
    }

    const transformedTransactions = transactions.map((transaction) => {
      const dbStatus = transaction.status || 'Processing';
      const mappedStatus = mapStatus(dbStatus);

      let finalTransactionId = transaction.transactionId || null;
      if (finalTransactionId && finalTransactionId === transaction.invoiceId) {

        if (process.env.NODE_ENV === 'development') {
          console.warn(`Transaction ${transaction.invoiceId} has transactionId matching invoiceId - setting to null`);
        }
        finalTransactionId = null;
      }

      const amount = transaction.amount
        ? (typeof transaction.amount === 'object' && transaction.amount !== null
            ? Number(transaction.amount)
            : Number(transaction.amount))
        : 0;

      const relatedUser = relatedUserInfo.get(transaction.id);
      const relatedUsername = relatedUser?.username || relatedUser?.name || null;

      return {
        id: transaction.id,
        invoice_id: transaction.invoiceId || transaction.id,
        amount: amount,
        status: mappedStatus,
        method: transaction.paymentGateway || null,
        gateway: transaction.paymentGateway || null,
        payment_method: transaction.paymentMethod || null,
        transaction_id: finalTransactionId,
        transaction_type: transaction.transactionType || 'deposit',
        related_username: relatedUsername,
        createdAt: transaction.createdAt.toISOString(),
        phone: '',
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
