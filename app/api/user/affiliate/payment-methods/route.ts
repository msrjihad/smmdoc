import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const affiliate = await db.affiliates.findUnique({ where: { userId } })
    if (!affiliate) {
      return NextResponse.json({ success: true, data: [] })
    }

    let methods: any[] = []
    if (affiliate.paymentDetails) {
      try {
        const parsed = JSON.parse(affiliate.paymentDetails)
        if (Array.isArray(parsed)) {
          const map = new Map<string, any>()
          for (const pm of parsed) {
            const key = (pm?.method || '').toString().toLowerCase()
            if (key && !map.has(key)) map.set(key, pm)
          }
          methods = Array.from(map.values())
        }
      } catch {}
    }

    return NextResponse.json({ success: true, data: methods })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: 'Failed to load withdrawal methods' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id
    const body = await request.json()
    const paymentMethods = body?.paymentMethods
    if (!Array.isArray(paymentMethods)) {
      return NextResponse.json({ success: false, message: 'Invalid withdrawal methods' }, { status: 400 })
    }

    const map = new Map<string, any>()
    for (const pm of paymentMethods) {
      if (pm && pm.method && !map.has(pm.method)) {
        map.set(pm.method, pm)
      }
    }
    const uniqueMethods = Array.from(map.values())

    let affiliate = await db.affiliates.findUnique({ where: { userId } })
    if (!affiliate) {
      affiliate = await db.affiliates.create({
        data: {
          userId,
          referralCode: `REF${userId}${Date.now().toString().slice(-4)}`,
          commissionRate: 5,
          status: 'active',
          paymentDetails: JSON.stringify(uniqueMethods),
          updatedAt: new Date(),
        },
      })
    } else {
      await db.affiliates.update({
        where: { userId },
        data: { paymentDetails: JSON.stringify(uniqueMethods), updatedAt: new Date() },
      })
    }

    return NextResponse.json({ success: true, message: 'Withdrawal methods saved' })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: 'Failed to save withdrawal methods' }, { status: 500 })
  }
}