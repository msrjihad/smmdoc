import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrModerator } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminOrModerator()
    const { id: idParam } = await params
    const id = parseInt(idParam)
    const { status, reason } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
    }

    const validStatuses = ['active', 'inactive', 'suspended']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 })
    }

    const existing = await db.affiliates.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Affiliate not found' }, { status: 404 })
    }

    await db.affiliates.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    })

    await db.activityLogs.create({
      data: {
        userId: session.user.id,
        username: session.user.email || '',
        action: 'affiliate_status_change',
        details: `Affiliate ${id} status changed to ${status}${reason ? `: ${reason}` : ''}`,
      },
    })

    return NextResponse.json({ success: true, message: 'Status updated' })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    if (error.message === 'Admin access required') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ success: false, error: 'Failed to update status' }, { status: 500 })
  }
}