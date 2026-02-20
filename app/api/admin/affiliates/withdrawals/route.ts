import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrModerator } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModerator()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = (searchParams.get('status') || 'all').trim()
    const search = (searchParams.get('search') || '').trim()

    const wherePayouts: any = {}

    if (status !== 'all') {
      if (status === 'success') {
        wherePayouts.status = 'paid'
      } else if (status === 'pending') {
        wherePayouts.status = 'pending'
      } else if (status === 'cancelled') {
        wherePayouts.status = { in: ['declined', 'cancelled'] }
      }
    }

    if (search) {
      const searchTrimmed = search.trim().toUpperCase()
      const searchNum = parseInt(searchTrimmed)

      if (!isNaN(searchNum) && searchNum > 0) {
        wherePayouts.id = searchNum
      } else if (searchTrimmed.startsWith('WD-')) {
        const idFromWd = parseInt(searchTrimmed.replace(/^WD-/, ''))
        if (!isNaN(idFromWd) && idFromWd > 0) {
          wherePayouts.id = idFromWd
        }
      } else if (searchTrimmed.length === 10 && /^[A-Z0-9]+$/.test(searchTrimmed)) {
        wherePayouts.notes = {
          contains: `"withdrawalId":"${searchTrimmed}"`,
        }
      } else {
        const matchingUsers = await db.users.findMany({
          where: {
            OR: [
              { username: { contains: search } },
              { email: { contains: search } },
              { name: { contains: search } },
            ],
          },
          select: { id: true },
        })

        if (matchingUsers.length > 0) {
          const userIds = matchingUsers.map(u => u.id)
          const affiliateIds = await db.affiliates.findMany({
            where: { userId: { in: userIds } },
            select: { id: true },
          })
          if (affiliateIds.length > 0) {
            wherePayouts.affiliateId = { in: affiliateIds.map(a => a.id) }
          } else {
            wherePayouts.id = -1
          }
        } else {
          wherePayouts.id = -1
        }
      }
    }

    const skip = (page - 1) * limit

    const [payouts, total] = await Promise.all([
      db.affiliatePayouts.findMany({
        where: wherePayouts,
        take: limit,
        skip: skip,
        orderBy: { requestedAt: 'desc' },
        include: {
          affiliate: true,
        },
      }),
      db.affiliatePayouts.count({ where: wherePayouts })
    ])

    const userIds = [...new Set(payouts.map(p => p.affiliate.userId))]
    let users: Array<{
      id: number;
      username: string | null;
      email: string | null;
      name: string | null;
    }> = []

    if (userIds.length > 0) {
      users = await db.users.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
        },
      })
    }

    const userMap = new Map(users.map(user => [user.id, user]))

    const totalPages = Math.ceil(total / limit)

    const withdrawals = payouts.map((payout) => {
      let transactionStatus: 'Success' | 'Pending' | 'Cancelled' = 'Pending'
      if (payout.status === 'paid') {
        transactionStatus = 'Success'
      } else if (payout.status === 'pending') {
        transactionStatus = 'Pending'
      } else if (payout.status === 'declined' || payout.status === 'cancelled') {
        transactionStatus = 'Cancelled'
      }

      let withdrawalId: string | null = null
      let paymentMethod = payout.method || ''
      let paymentMethodDisplay = payout.method || ''

      const getMethodDisplayName = (method: string): string => {
        const names: Record<string, string> = {
          bkash: 'bKash',
          nagad: 'Nagad',
          rocket: 'Rocket',
          upay: 'Upay',
          bank: 'Bank Transfer',
        }
        const key = (method || '').toLowerCase()
        return names[key] || method
      }

      let transactionIdEdited = false
      if (payout.notes) {
        try {
          const parsedNotes = JSON.parse(payout.notes)
          if (parsedNotes && typeof parsedNotes === 'object') {
            if (parsedNotes.transactionId) {
              withdrawalId = parsedNotes.transactionId
            } else if (parsedNotes.withdrawalId) {
              withdrawalId = parsedNotes.withdrawalId
            }
            if (parsedNotes.transactionIdEdited === true) {
              transactionIdEdited = true
            }
          }
        } catch (e) {
          console.error('Error parsing withdrawal notes:', e)
        }
      }

      if (!withdrawalId) {
        withdrawalId = null
      }

      if (payout.details) {
        try {
          const parsed = JSON.parse(payout.details)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const method = parsed.find((p: any) =>
              p.method && p.method.toLowerCase() === payout.method?.toLowerCase()
            )
            if (method && method.method) {
              paymentMethod = method.method
              paymentMethodDisplay = getMethodDisplayName(method.method)
            }
          }
        } catch (e) {
          console.error('Error parsing payment details:', e)
        }
      }

      if (!paymentMethodDisplay || paymentMethodDisplay === paymentMethod) {
        paymentMethodDisplay = getMethodDisplayName(paymentMethod || payout.method || '')
      }

      const user = userMap.get(payout.affiliate.userId)

      return {
        id: payout.id,
        affiliate: {
          id: payout.affiliate.id,
          user: {
            id: user?.id || payout.affiliate.userId,
            username: user?.username || null,
            email: user?.email || null,
            name: user?.name || null,
          },
        },
        withdrawalId,
        amount: payout.amount,
        status: transactionStatus,
        method: (payout.method || '').toLowerCase(),
        payment_method: paymentMethodDisplay,
        createdAt: payout.requestedAt.toISOString(),
        processedAt: payout.processedAt?.toISOString(),
        notes: payout.notes,
        transactionIdEdited: transactionIdEdited,
      }
    })

    const stats = {
      totalWithdrawals: await db.affiliatePayouts.count(),
      pendingWithdrawals: await db.affiliatePayouts.count({ where: { status: 'pending' } }),
      completedWithdrawals: await db.affiliatePayouts.count({ where: { status: 'paid' } }),
      cancelledWithdrawals: await db.affiliatePayouts.count({ where: { status: { in: ['declined', 'cancelled'] } } }),
      totalVolume: await db.affiliatePayouts.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }).then(result => result._sum.amount || 0),
      todayWithdrawals: await db.affiliatePayouts.count({
        where: {
          requestedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
    }

    return NextResponse.json({
      success: true,
      data: withdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching affiliate withdrawals:', error)
    console.error('Error stack:', error.stack)
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch withdrawals',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

