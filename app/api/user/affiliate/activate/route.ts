import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const moduleSettings = await db.moduleSettings.findFirst()
    const affiliateSystemEnabled = moduleSettings?.affiliateSystemEnabled ?? false
    if (!affiliateSystemEnabled) {
      return NextResponse.json({ success: false, message: 'Affiliate system disabled' }, { status: 400 })
    }

    let affiliate = await db.affiliates.findUnique({ where: { userId } })
    if (affiliate?.status === 'suspended') {
      return NextResponse.json({ success: false, message: 'Your affiliate account is suspended. Please contact support.' }, { status: 403 })
    }
    if (!affiliate) {
      const referralCode = `REF${userId}${Date.now().toString().slice(-6)}`
      affiliate = await db.affiliates.create({
        data: {
          userId,
          referralCode,
          commissionRate: moduleSettings?.commissionRate ?? 5,
          status: 'inactive',
          updatedAt: new Date(),
        },
      })
    }

    let hasPaymentMethod = false
    if (affiliate.paymentDetails) {
      try {
        const parsed = JSON.parse(affiliate.paymentDetails)
        hasPaymentMethod = Array.isArray(parsed) && parsed.length > 0
      } catch {}
    }

    if (!hasPaymentMethod) {
      return NextResponse.json({ success: false, message: 'Add a payment method before activation' }, { status: 400 })
    }

    if (affiliate.status !== 'active') {
      await db.affiliates.update({ where: { id: affiliate.id }, data: { status: 'active', updatedAt: new Date() } })
    }

    const updated = await db.affiliates.findUnique({ where: { id: affiliate.id } })
    return NextResponse.json({ success: true, data: { status: updated?.status, referralCode: updated?.referralCode } })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: 'Failed to activate affiliate' }, { status: 500 })
  }
}