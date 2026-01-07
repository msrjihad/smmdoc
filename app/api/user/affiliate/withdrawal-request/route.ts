import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { getModuleSettings } from '@/lib/utils/module-settings'
import { sendAffiliateWithdrawalRequestNotification } from '@/lib/notifications/user-notifications'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = parseInt(session.user.id)
    const body = await request.json()
    const { amount, withdrawalMethodId } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid withdrawal amount' 
      }, { status: 400 })
    }

    if (!withdrawalMethodId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Withdrawal method is required' 
      }, { status: 400 })
    }

    const affiliate = await db.affiliates.findUnique({ where: { userId } })
    
    if (!affiliate) {
      return NextResponse.json({ 
        success: false, 
        message: 'Affiliate account not found' 
      }, { status: 404 })
    }

    const moduleSettings = await getModuleSettings()
    const minimumPayout = moduleSettings.minimumPayout || 10

    if (amount < minimumPayout) {
      return NextResponse.json({ 
        success: false, 
        message: `Minimum withdrawal amount is $${minimumPayout.toFixed(2)}` 
      }, { status: 400 })
    }

    if (affiliate.availableEarnings < amount) {
      return NextResponse.json({ 
        success: false, 
        message: 'Insufficient available earnings' 
      }, { status: 400 })
    }

    let paymentMethod = ''
    let paymentDetails = null
    if (affiliate.paymentDetails) {
      try {
        const parsed = JSON.parse(affiliate.paymentDetails)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const method = parsed.find((m: any) => String(m.id) === String(withdrawalMethodId))
          if (method && method.method) {
            paymentMethod = method.method
            paymentDetails = method
          } else {
            const methodIndex = parseInt(withdrawalMethodId)
            if (!isNaN(methodIndex) && methodIndex >= 0 && methodIndex < parsed.length) {
              const method = parsed[methodIndex]
              if (method && method.method) {
                paymentMethod = method.method
                paymentDetails = method
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing payment details:', e)
      }
    }

    if (!paymentMethod && affiliate.paymentMethod) {
      paymentMethod = affiliate.paymentMethod
    }

    if (!paymentMethod) {
      return NextResponse.json({ 
        success: false, 
        message: 'Withdrawal method not found. Please configure your withdrawal methods first.' 
      }, { status: 400 })
    }

    const now = new Date()
    
    const payout = await db.affiliatePayouts.create({
      data: {
        affiliateId: affiliate.id,
        amount,
        method: paymentMethod,
        details: paymentDetails ? JSON.stringify([paymentDetails]) : affiliate.paymentDetails,
        status: 'pending',
        requestedAt: now,
        updatedAt: now,
        notes: null,
      },
    })

    await db.affiliates.update({
      where: { id: affiliate.id },
      data: {
        availableEarnings: affiliate.availableEarnings - amount,
        updatedAt: new Date(),
      },
    })

    const currencySettings = await db.currencySettings.findFirst()
    const defaultCurrency = currencySettings?.defaultCurrency || 'USD'
    const currency = await db.currencies.findUnique({
      where: { code: defaultCurrency },
      select: { symbol: true }
    })
    const currencySymbol = currency?.symbol || '$'

    await sendAffiliateWithdrawalRequestNotification(
      userId,
      amount,
      currencySymbol
    )

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully',
      data: payout 
    })
  } catch (error: any) {
    console.error('Error creating withdrawal request:', error)
    if (error.message === 'Authentication required') {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 })
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create withdrawal request',
      message: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

