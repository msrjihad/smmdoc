import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = parseInt(session.user.id)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const status = (searchParams.get('status') || 'all').trim()

    console.log(`[AFFILIATE_EARNINGS] Fetching earnings for userId: ${userId}`);

    const affiliate = await db.affiliates.findUnique({ where: { userId } })
    
    console.log(`[AFFILIATE_EARNINGS] Affiliate found:`, {
      found: !!affiliate,
      affiliateId: affiliate?.id,
      status: affiliate?.status
    });
    if (!affiliate) {
      return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } })
    }

    const whereCommissions: any = { affiliateId: affiliate.id }
    if (status !== 'all') {
      if (status === 'completed') whereCommissions.status = 'approved'
      else whereCommissions.status = status
    }

    const total = await db.affiliateCommissions.count({ where: whereCommissions })

    const commissions = await db.affiliateCommissions.findMany({
      where: whereCommissions,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const referredIds = commissions.map(c => c.referredUserId).filter(Boolean) as number[]
    const users = referredIds.length > 0 ? await db.users.findMany({ where: { id: { in: referredIds } }, select: { id: true, email: true, name: true, username: true } }) : []
    const userMap = new Map(users.map(u => [u.id, u]))

    const orderIds = commissions.map(c => c.orderId).filter(Boolean) as number[]
    const orders = orderIds.length > 0 ? await db.newOrders.findMany({ 
      where: { id: { in: orderIds } }, 
      select: { 
        id: true, 
        serviceId: true, 
        categoryId: true,
        createdAt: true, 
        currency: true 
      } 
    }) : []
    const orderMap = new Map(orders.map(o => [o.id, o]))

    const serviceIds = orders.map(o => o.serviceId)
    const services = serviceIds.length > 0 ? await db.services.findMany({ where: { id: { in: serviceIds } }, select: { id: true, name: true } }) : []
    const serviceMap = new Map(services.map(s => [s.id, s.name]))

    const categoryIds = orders.map(o => o.categoryId).filter(Boolean) as number[]
    const categories = categoryIds.length > 0 ? await db.categories.findMany({ where: { id: { in: categoryIds } }, select: { id: true, category_name: true } }) : []
    const categoryMap = new Map(categories.map(c => [c.id, c.category_name]))

    let data = commissions.map(c => {
      const u = userMap.get(c.referredUserId)
      const o = c.orderId ? orderMap.get(c.orderId) : null
      const serviceName = o ? (serviceMap.get(o.serviceId) || 'Order') : 'Referral'
      const categoryName = o && o.categoryId ? (categoryMap.get(o.categoryId) || null) : null
      const statusMap: Record<string, 'completed' | 'pending' | 'cancelled'> = {
        approved: 'completed',
        pending: 'pending',
        cancelled: 'cancelled',
        rejected: 'cancelled',
      }
      return {
        id: c.id,
        signupDate: (o?.createdAt || c.createdAt),
        service: serviceName,
        category: categoryName,
        amount: c.amount,
        commission: c.commissionAmount,
        status: statusMap[c.status] || 'pending',
        user: {
          id: u?.id || c.referredUserId,
          email: u?.email || '',
          name: u?.name || '',
          username: u?.username || undefined,
        },
        currency: o?.currency || 'USD',
      }
    })

    if (search) {
      data = data.filter(e =>
        e.service.toLowerCase().includes(search) ||
        (e.user.name || '').toLowerCase().includes(search) ||
        (e.user.email || '').toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    })
  } catch (error: any) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch earnings' }, { status: 500 })
  }
}