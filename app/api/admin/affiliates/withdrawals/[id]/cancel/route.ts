import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrModerator } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminOrModerator()
    const { id } = await params
    const payoutId = parseInt(id)
    const body = await request.json()
    const { cancelReason } = body || {}

    if (!payoutId || isNaN(payoutId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid withdrawal ID' },
        { status: 400 }
      )
    }

    const payout = await db.affiliatePayouts.findUnique({
      where: { id: payoutId },
      include: {
        affiliate: true,
      },
    })

    if (!payout) {
      return NextResponse.json(
        { success: false, error: 'Withdrawal not found' },
        { status: 404 }
      )
    }

    if (payout.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Only pending withdrawals can be cancelled' },
        { status: 400 }
      )
    }

    const updateData: any = {
      status: 'cancelled',
      updatedAt: new Date(),
      adminId: session.user.id,
    }

    if (cancelReason && cancelReason.trim()) {
      updateData.notes = JSON.stringify({ cancelReason: cancelReason.trim() })
    }

    await db.$transaction(async (tx) => {
      await tx.affiliatePayouts.update({
        where: { id: payoutId },
        data: updateData,
      })

      await tx.affiliates.update({
        where: { id: payout.affiliateId },
        data: {
          availableEarnings: {
            increment: payout.amount,
          },
          updatedAt: new Date(),
        },
      })
    })

    const logDetails = cancelReason && cancelReason.trim()
      ? `Cancelled withdrawal ${payoutId} for affiliate ${payout.affiliateId}, amount ${payout.amount} returned to available earnings. Reason: ${cancelReason.trim()}`
      : `Cancelled withdrawal ${payoutId} for affiliate ${payout.affiliateId}, amount ${payout.amount} returned to available earnings`

    await db.activityLogs.create({
      data: {
        userId: session.user.id,
        username: session.user.email || '',
        action: 'affiliate_withdrawal_cancelled',
        details: logDetails,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal cancelled successfully. Amount returned to available earnings.',
    })
  } catch (error: any) {
    console.error('Error cancelling withdrawal:', error)
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to cancel withdrawal' },
      { status: 500 }
    )
  }
}

