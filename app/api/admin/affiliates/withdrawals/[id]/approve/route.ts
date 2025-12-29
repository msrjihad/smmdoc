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
    const { transactionId } = body || {}

    if (!payoutId || isNaN(payoutId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid withdrawal ID' },
        { status: 400 }
      )
    }

    if (!transactionId || !transactionId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
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
        { success: false, error: 'Only pending withdrawals can be approved' },
        { status: 400 }
      )
    }

    const notesData = JSON.stringify({ 
      transactionId: transactionId.trim(),
      transactionIdEdited: false 
    })

    await db.affiliatePayouts.update({
      where: { id: payoutId },
      data: {
        status: 'paid',
        processedAt: new Date(),
        updatedAt: new Date(),
        adminId: session.user.id,
        notes: notesData,
      },
    })

    await db.activityLogs.create({
      data: {
        userId: session.user.id,
        username: session.user.email || '',
        action: 'affiliate_withdrawal_approved',
        details: `Approved withdrawal ${payoutId} for affiliate ${payout.affiliateId}, amount ${payout.amount}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal approved successfully',
    })
  } catch (error: any) {
    console.error('Error approving withdrawal:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    })
    
    if (error?.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (error?.message === 'Admin access required') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    const errorMessage = error?.message || 'Unknown error occurred'
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to approve withdrawal',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

