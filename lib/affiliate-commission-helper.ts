import { db } from '@/lib/db';

export async function updateAffiliateCommissionForOrder(
  orderId: number,
  orderStatus: string,
  prisma?: any
): Promise<void> {
  try {
    const dbClient = prisma || db;
    
    const commission = await dbClient.affiliateCommissions.findFirst({
      where: { orderId: orderId },
      include: {
        affiliate: {
          select: {
            id: true,
            status: true,
          }
        }
      }
    });

    if (!commission || !commission.affiliate || commission.affiliate.status !== 'active') {
      return;
    }

    if (orderStatus === 'cancelled' && commission.status === 'pending') {
      await dbClient.affiliateCommissions.update({
        where: { id: commission.id },
        data: {
          status: 'cancelled',
          updatedAt: new Date(),
        }
      });
      console.log(`Affiliate commission ${commission.id} marked as cancelled for order ${orderId}`);
    }
    else if (orderStatus === 'completed') {
      if (commission.status === 'pending') {
        await dbClient.affiliateCommissions.update({
          where: { id: commission.id },
          data: {
            status: 'approved',
            updatedAt: new Date(),
          }
        });

        await dbClient.affiliates.update({
          where: { id: commission.affiliateId },
          data: {
            totalEarnings: {
              increment: commission.commissionAmount
            },
            availableEarnings: {
              increment: commission.commissionAmount
            },
            updatedAt: new Date(),
          }
        });

        console.log(`Affiliate commission ${commission.id} approved and $${commission.commissionAmount.toFixed(2)} added to affiliate ${commission.affiliateId} earnings for completed order ${orderId}`);
      } else if (commission.status !== 'approved') {
        await dbClient.affiliateCommissions.update({
          where: { id: commission.id },
          data: {
            status: 'approved',
            updatedAt: new Date(),
          }
        });
        console.log(`Affiliate commission ${commission.id} status updated to approved for completed order ${orderId} (earnings already added)`);
      }
    }
  } catch (error) {
    console.error('Error updating affiliate commission status:', error);
  }
}

