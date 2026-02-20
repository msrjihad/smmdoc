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

    if (payout.status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Only approved withdrawals can have their transaction ID updated' },
        { status: 400 }
      )
    }

    let notesData: any = {}
    let transactionIdEdited = false

    if (payout.notes) {
      try {
        const parsedNotes = JSON.parse(payout.notes)
        if (parsedNotes && typeof parsedNotes === 'object') {
          notesData = parsedNotes
          transactionIdEdited = parsedNotes.transactionIdEdited === true
        }
      } catch (e) {
      }
    }

    if (transactionIdEdited) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID can only be edited once' },
        { status: 400 }
      )
    }

    notesData.transactionId = transactionId.trim()
    notesData.transactionIdEdited = true

    await db.affiliatePayouts.update({
      where: { id: payoutId },
      data: {
        updatedAt: new Date(),
        notes: JSON.stringify(notesData),
      },
    })

    await db.activityLogs.create({
      data: {
        userId: session.user.id,
        username: session.user.email || '',
        action: 'affiliate_withdrawal_transaction_id_updated',
        details: `Updated transaction ID for withdrawal ${payoutId} to ${transactionId.trim()}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction ID updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating transaction ID:', error)
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
        error: 'Failed to update transaction ID',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

