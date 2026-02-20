import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrModerator } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminOrModerator()
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const { amount, method, notes } = await request.json()

    if (!id || !amount || amount <= 0 || !method) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
    }

    const affiliate = await db.affiliates.findUnique({ where: { id } })
    if (!affiliate) {
      return NextResponse.json({ success: false, message: 'Affiliate not found' }, { status: 404 })
    }

    if (affiliate.availableEarnings < amount) {
      return NextResponse.json({ success: false, message: 'Insufficient available earnings' }, { status: 400 })
    }

    const payout = await db.affiliatePayouts.create({
      data: {
        affiliateId: id,
        amount,
        method,
        details: affiliate.paymentDetails || null,
        status: 'paid',
        processedAt: new Date(),
        notes: notes || null,
        adminId: session.user.id,
        updatedAt: new Date(),
      },
    })

    await db.affiliates.update({
      where: { id },
      data: {
        availableEarnings: affiliate.availableEarnings - amount,
        updatedAt: new Date(),
      },
    })

    await db.activityLogs.create({
      data: {
        userId: session.user.id,
        username: session.user.email || '',
        action: 'affiliate_payout',
        details: `Payout processed for affiliate ${id} amount ${amount} via ${method}`,
      },
    })

    return NextResponse.json({ success: true, data: payout })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: 'Failed to process payout' }, { status: 500 })
  }
}