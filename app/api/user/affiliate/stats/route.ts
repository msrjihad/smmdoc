import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const moduleSettings = await db.moduleSettings.findFirst();
    const affiliateSystemEnabled = moduleSettings?.affiliateSystemEnabled ?? false;

    if (!affiliateSystemEnabled) {
      return NextResponse.json({
        success: true,
        data: {
          visits: 0,
          registrations: 0,
          referrals: 0,
          conversionRate: '0.00%',
          totalEarnings: '$0.00',
          availableEarnings: '$0.00',
          commissionRate: '0%',
          minimumPayout: '$0.00',
          isAffiliate: false,
          message: 'Affiliate system is currently disabled'
        }
      });
    }

    const userId = parseInt(session.user.id);

    const affiliate = await db.affiliates.findUnique({
      where: { userId },
      include: {
        referrals: true,
        commissions: {
          where: { status: 'approved' }
        }
      }
    });

    if (!affiliate) {
      return NextResponse.json({
        success: true,
        data: {
          visits: 0,
          registrations: 0,
          referrals: 0,
          conversionRate: '0.00%',
          totalEarnings: '$0.00',
          availableEarnings: '$0.00',
          commissionRate: `${moduleSettings?.commissionRate ?? 5}%`,
          minimumPayout: `$${moduleSettings?.minimumPayout ?? 10}.00`,
          isAffiliate: false,
          referralCode: null
        }
      });
    }

    const totalCommissions = affiliate.commissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);
    
    const actualReferralsCount = affiliate.referrals?.length ?? 0;
    const totalReferrals = actualReferralsCount > 0 ? actualReferralsCount : (affiliate.totalReferrals ?? 0);
    
    if (actualReferralsCount > 0 && actualReferralsCount !== (affiliate.totalReferrals ?? 0)) {
      db.affiliates.update({
        where: { id: affiliate.id },
        data: { totalReferrals: actualReferralsCount, updatedAt: new Date() }
      }).catch(err => console.error('Error syncing totalReferrals:', err));
    }
    
    const conversionRate = affiliate.totalVisits > 0 ? ((totalReferrals / affiliate.totalVisits) * 100).toFixed(2) : '0.00';

    const totalEarnings = affiliate.totalEarnings ?? 0;
    const availableEarnings = affiliate.availableEarnings ?? 0;
    const totalVisits = affiliate.totalVisits ?? 0;
    const commissionRate = moduleSettings?.commissionRate ?? 5;

    const stats = {
      visits: totalVisits,
      registrations: totalReferrals,
      referrals: totalReferrals,
      conversionRate: `${conversionRate}%`,
      totalEarnings: `$${totalEarnings.toFixed(2)}`,
      availableEarnings: `$${availableEarnings.toFixed(2)}`,
      commissionRate: `${commissionRate}%`,
      minimumPayout: `$${moduleSettings?.minimumPayout ?? 10}.00`,
      isAffiliate: true,
      referralCode: affiliate.referralCode,
      status: affiliate.status
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[AFFILIATE_STATS_ERROR]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
    });
  }
}
