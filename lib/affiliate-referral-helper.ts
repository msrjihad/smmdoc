import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function processAffiliateReferral(userId: number, requestHeaders?: Headers): Promise<void> {
  try {
    const cookieStore = await cookies();
    const affiliateCookie = cookieStore.get('affiliate_referral');
    const affiliateMetaCookie = cookieStore.get('affiliate_referral_meta');

    if (!affiliateCookie || !userId) {
      console.log('No affiliate cookie found or no user ID for referral processing');
      return;
    }

    const cookieValue = affiliateCookie.value;
    const [affiliateIdStr, referralCode] = cookieValue.split(':');
    const affiliateId = parseInt(affiliateIdStr);

    if (!affiliateId || isNaN(affiliateId)) {
      console.log('Invalid affiliate ID from cookie:', affiliateIdStr);
      return;
    }

    let ip = '';
    let ua = '';
    
    if (requestHeaders) {
      const xff = requestHeaders.get('x-forwarded-for') || '';
      ip = xff.split(',')[0].trim() || '';
      ua = requestHeaders.get('user-agent') || '';
    } else if (affiliateMetaCookie) {
      try {
        const meta = JSON.parse(decodeURIComponent(affiliateMetaCookie.value));
        ip = meta.ip || '';
        ua = meta.ua || '';
      } catch (e) {
        console.error('Error parsing affiliate meta cookie:', e);
      }
    }

    const registrationFingerprint = crypto
      .createHash('sha256')
      .update(`${ip}:${ua}:${affiliateId}:registration`)
      .digest('hex')
      .substring(0, 16);

    const registrationCookie = cookieStore.get(`affiliate_registration_${affiliateId}`);
    const hasRegisteredBefore = registrationCookie && registrationCookie.value === registrationFingerprint;

    if (hasRegisteredBefore) {
      console.log('Registration already counted for this browser/IP combination. Skipping referral.');
      return;
    }

    console.log('Processing referral for affiliate:', affiliateId, 'referralCode:', referralCode, 'userId:', userId);

    const affiliate = await db.affiliates.findUnique({
      where: { id: affiliateId }
    });

    if (!affiliate || affiliate.status !== 'active' || affiliate.referralCode !== referralCode) {
      console.log('Affiliate not found or not active:', {
        affiliate: !!affiliate,
        status: affiliate?.status,
        codeMatch: affiliate?.referralCode === referralCode
      });
      return;
    }

    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (affiliateMetaCookie) {
      try {
        const meta = JSON.parse(decodeURIComponent(affiliateMetaCookie.value));
        ipAddress = meta.ip || null;
        userAgent = meta.ua || null;
      } catch (e) {
        console.error('Error parsing affiliate meta cookie:', e);
      }
    }

    let referralCreated = false;
    await db.$transaction(async (tx) => {
      const existingReferral = await tx.affiliateReferrals.findUnique({
        where: { referredUserId: userId }
      });

      if (!existingReferral) {
        console.log('Creating new referral record and incrementing count');

        await tx.affiliateReferrals.create({
          data: {
            affiliateId,
            referredUserId: userId,
            ipAddress,
            userAgent,
          },
        });

        const updated = await tx.affiliates.update({
          where: { id: affiliateId },
          data: {
            totalReferrals: {
              increment: 1
            },
            updatedAt: new Date(),
          },
        });

        console.log('Referral created successfully. New totalReferrals count:', updated.totalReferrals);
        referralCreated = true;
      } else {
        console.log('Referral already exists for user:', userId);
      }
    });
    
    if (referralCreated) {
      try {
        const registrationExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        cookieStore.set(`affiliate_registration_${affiliateId}`, registrationFingerprint, {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          expires: registrationExpires,
          path: '/',
        });
        console.log('Registration cookie set to prevent duplicate registrations from same browser');
      } catch (cookieError) {
        console.error('Error setting registration cookie:', cookieError);
      }
    }
  } catch (error) {
    console.error('Error processing affiliate referral:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}
