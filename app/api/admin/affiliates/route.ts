import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrModerator } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModerator()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = (searchParams.get('search') || '').trim()
    const status = (searchParams.get('status') || '').trim()

    const whereAffiliates: any = {}
    if (status && status !== 'all') {
      whereAffiliates.status = status
    }

    let userIdsFilter: number[] | null = null
    if (search) {
      const matchedUsers = await db.users.findMany({
        where: {
          OR: [
            { email: { contains: search } },
            { username: { contains: search } },
            { name: { contains: search } },
          ],
        },
        select: { id: true },
        take: 500,
      })
      userIdsFilter = matchedUsers.map(u => u.id)
      whereAffiliates.OR = [
        { referralCode: { contains: search } },
      ]
      if (userIdsFilter.length > 0) {
        whereAffiliates.OR.push({ userId: { in: userIdsFilter } })
      }
    }

    const total = await db.affiliates.count({ where: whereAffiliates })

    const affiliates = await db.affiliates.findMany({
      where: whereAffiliates,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        commissions: true,
        payouts: true,
      },
    })

    const userIds = affiliates.map(a => a.userId)
    const users = await db.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true, name: true, createdAt: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    const data = affiliates.map(a => {
      const approvedCommissions = a.commissions.filter(c => c.status === 'approved')
      const totalFunds = approvedCommissions.reduce((sum, c) => sum + c.amount, 0)
      const earnedCommission = approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0)
      const pendingRequested = a.payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
      const totalWithdrawn = a.payouts.filter(p => p.status === 'paid' || p.status === 'approved').reduce((sum, p) => sum + p.amount, 0)
      const lastActivityCandidateDates: Date[] = []
      if (a.updatedAt) lastActivityCandidateDates.push(a.updatedAt as unknown as Date)
      a.commissions.forEach(c => lastActivityCandidateDates.push(c.updatedAt as unknown as Date))
      a.payouts.forEach(p => lastActivityCandidateDates.push((p.processedAt || p.requestedAt) as unknown as Date))
      const lastActivity = lastActivityCandidateDates.length > 0 ? new Date(Math.max(...lastActivityCandidateDates.map(d => d.getTime()))) : a.updatedAt
      const user = userMap.get(a.userId)
      const payoutHistory = a.payouts.map(p => ({
        id: p.id,
        amount: p.amount,
        requestedAt: p.requestedAt,
        processedAt: p.processedAt || null,
        status: p.status as 'pending' | 'approved' | 'declined' | 'paid',
        method: p.method,
        notes: p.notes || undefined,
      }))
      return {
        id: a.id,
        user: {
          id: user?.id || a.userId,
          username: user?.username || '',
          email: user?.email || '',
          name: user?.name || '',
          joinedAt: user?.createdAt || a.createdAt,
        },
        referralCode: a.referralCode,
        totalVisits: a.totalVisits,
        signUps: a.totalReferrals,
        conversionRate: a.totalVisits > 0 ? (a.totalReferrals / a.totalVisits) * 100 : 0,
        totalFunds,
        totalEarnings: a.totalEarnings || 0,
        earnedCommission,
        availableEarnings: a.availableEarnings || 0,
        requestedCommission: pendingRequested,
        totalCommission: earnedCommission,
        totalWithdrawn,
        status: a.status as 'active' | 'inactive' | 'suspended' | 'pending',
        createdAt: a.createdAt,
        lastActivity,
        commissionRate: a.commissionRate,
        paymentMethod: a.paymentMethod || '',
        paymentDetails: a.paymentDetails || null,
        payoutHistory,
      }
    })

    const totalPages = Math.ceil(total / limit)
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch affiliates' }, { status: 500 })
  }
}