import { NextResponse } from 'next/server'
import { requireAdminOrModerator } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET() {
  try {
    await requireAdminOrModerator()

    const aggAff = await db.affiliates.aggregate({
      _sum: { totalVisits: true, totalReferrals: true },
      _count: { _all: true },
    })

    const activeCount = await db.affiliates.count({ where: { status: 'active' } })
    const inactiveCount = await db.affiliates.count({ where: { status: 'inactive' } })
    const suspendedCount = await db.affiliates.count({ where: { status: 'suspended' } })

    const approvedCommissionAgg = await db.affiliateCommissions.aggregate({
      where: { status: 'approved' },
      _sum: { commissionAmount: true },
    })

    const paidPayoutAgg = await db.affiliatePayouts.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
    })

    const pendingPayoutAgg = await db.affiliatePayouts.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true },
    })

    const totalVisits = aggAff._sum.totalVisits || 0
    const totalSignUps = aggAff._sum.totalReferrals || 0
    const averageConversionRate = totalVisits > 0 ? (totalSignUps / totalVisits) * 100 : 0

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todaySignUps = await db.affiliateReferrals.count({ where: { createdAt: { gte: startOfDay } } })

    const topPerformers = await db.affiliates.count({ where: { totalReferrals: { gte: 50 } } })

    return NextResponse.json({
      success: true,
      data: {
        totalAffiliates: aggAff._count._all,
        activeAffiliates: activeCount,
        inactiveAffiliates: inactiveCount,
        suspendedAffiliates: suspendedCount,
        totalVisits,
        totalSignUps,
        totalCommissionEarned: approvedCommissionAgg._sum.commissionAmount || 0,
        totalCommissionPaid: paidPayoutAgg._sum.amount || 0,
        pendingPayouts: pendingPayoutAgg._sum.amount || 0,
        averageConversionRate,
        topPerformers,
        todaySignUps,
      },
    })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 })
  }
}