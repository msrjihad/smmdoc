import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'
import { getModuleSettings } from '@/lib/utils/module-settings'

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const moduleSettings = await getModuleSettings(true);
    if (!moduleSettings.affiliateSystemEnabled) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { code } = await params
    const referralCode = (code || '').trim()
    const home = new URL('/', request.url)

    if (!referralCode) {
      return NextResponse.redirect(home)
    }

    const affiliate = await db.affiliates.findUnique({ where: { referralCode } })
    if (!affiliate) {
      return NextResponse.redirect(home)
    }
    if (affiliate.status !== 'active') {
      return NextResponse.redirect(home)
    }

    const xff = request.headers.get('x-forwarded-for') || ''
    const ip = xff.split(',')[0].trim() || ''
    const ua = request.headers.get('user-agent') || ''

    const visitorFingerprint = crypto
      .createHash('sha256')
      .update(`${ip}:${ua}:${affiliate.id}`)
      .digest('hex')
      .substring(0, 16)

    const visitCookie = request.cookies.get(`affiliate_visit_${affiliate.id}`)
    const hasVisitedBefore = visitCookie && visitCookie.value === visitorFingerprint

    if (!hasVisitedBefore) {
      await db.affiliates.update({
        where: { id: affiliate.id },
        data: {
          totalVisits: {
            increment: 1
          },
          updatedAt: new Date(),
        },
      })
    }

    const res = NextResponse.redirect(home)
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    const isHttps = home.protocol === 'https:'
    
    res.cookies.set('affiliate_referral', `${affiliate.id}:${referralCode}`, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      expires,
      path: '/',
    })
    res.cookies.set('affiliate_referral_meta', encodeURIComponent(JSON.stringify({ ip, ua })), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      expires,
      path: '/',
    })

    const visitExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    res.cookies.set(`affiliate_visit_${affiliate.id}`, visitorFingerprint, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      expires: visitExpires,
      path: '/',
    })
    
    return res
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

