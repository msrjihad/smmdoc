import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = parseInt(session.user.id)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = (searchParams.get('status') || 'all').trim()
    const search = (searchParams.get('search') || '').trim()

    const affiliate = await db.affiliates.findUnique({ where: { userId } })
    
    if (!affiliate) {
      return NextResponse.json({ 
        success: true, 
        transactions: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        }
      })
    }

    const wherePayouts: any = { affiliateId: affiliate.id }
    
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
      } 
      else if (searchTrimmed.startsWith('WD-')) {
        const idFromWd = parseInt(searchTrimmed.replace(/^WD-/, ''))
        if (!isNaN(idFromWd) && idFromWd > 0) {
          wherePayouts.id = idFromWd
        }
      }
      else {
        wherePayouts.notes = {
          contains: searchTrimmed,
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
      }),
      db.affiliatePayouts.count({ where: wherePayouts })
    ])

    const totalPages = Math.ceil(total / limit)

    const transactions = payouts.map((payout) => {
      let transactionStatus: 'Success' | 'Pending' | 'Cancelled' = 'Pending'
      if (payout.status === 'paid') {
        transactionStatus = 'Success'
      } else if (payout.status === 'pending') {
        transactionStatus = 'Pending'
      } else if (payout.status === 'declined' || payout.status === 'cancelled') {
        transactionStatus = 'Cancelled'
      }

      let paymentMethod = payout.method
      let paymentMethodDisplay = payout.method
      let paymentDetails = null
      
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
              paymentDetails = method
            }
          }
        } catch (e) {
        }
      }
      
      if (!paymentMethodDisplay || paymentMethodDisplay === paymentMethod) {
        paymentMethodDisplay = getMethodDisplayName(paymentMethod || payout.method || '')
      }

      let withdrawalId: string | null = null
      let adminNotes = null
      let cancelReason = null
      
      if (transactionStatus === 'Success') {
        if (payout.notes) {
          try {
            const notesParsed = JSON.parse(payout.notes)
            if (notesParsed && typeof notesParsed === 'object') {
              if (notesParsed.transactionId && typeof notesParsed.transactionId === 'string') {
                withdrawalId = notesParsed.transactionId
              } else if (notesParsed.withdrawalId && typeof notesParsed.withdrawalId === 'string') {
                withdrawalId = notesParsed.withdrawalId
              }
              if (notesParsed.adminNotes) {
                adminNotes = notesParsed.adminNotes
              }
            }
          } catch (e) {
            if (typeof payout.notes === 'string' && payout.notes.trim()) {
              adminNotes = payout.notes
            }
          }
        }
      }
      
      if (transactionStatus === 'Cancelled' && payout.notes) {
        try {
          const notesParsed = JSON.parse(payout.notes)
          if (notesParsed && typeof notesParsed === 'object') {
            if (notesParsed.cancelReason) {
              cancelReason = notesParsed.cancelReason
            }
            if (notesParsed.adminNotes) {
              adminNotes = notesParsed.adminNotes
            }
          }
        } catch (e) {
          if (typeof payout.notes === 'string' && payout.notes.trim()) {
            adminNotes = payout.notes
          }
        }
      }

      return {
        id: payout.id,
        invoice_id: payout.id,
        amount: payout.amount,
        status: transactionStatus,
        method: (payout.method || '').toLowerCase(),
        payment_method: paymentMethodDisplay,
        transaction_id: withdrawalId,
        createdAt: payout.requestedAt.toISOString(),
        processedAt: payout.processedAt?.toISOString(),
        notes: adminNotes,
        cancelReason: cancelReason,
      }
    })

    return NextResponse.json({ 
      success: true, 
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    })
  } catch (error: any) {
    console.error('Error fetching affiliate withdrawals:', error)
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch withdrawals' 
    }, { status: 500 })
  }
}

