import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          data: null,
        },
        { status: 401 }
      );
    }

    const moduleSettings = await db.moduleSettings.findFirst();
    const affiliateSystemEnabled = moduleSettings?.affiliateSystemEnabled ?? false;

    if (!affiliateSystemEnabled) {
      return NextResponse.json(
        {
          success: false,
          message: 'Affiliate system is currently disabled',
          data: null,
        },
        { status: 403 }
      );
    }

    const userId = parseInt(session.user.id);

    const existingAffiliate = await db.affiliates.findUnique({
      where: { userId }
    });

    if (existingAffiliate) {
      return NextResponse.json(
        {
          success: false,
          message: 'You are already part of the affiliate program',
          data: existingAffiliate,
        },
        { status: 400 }
      );
    }

    const generateReferralCode = async (): Promise<string> => {
      const baseCode = `REF${userId}${Date.now().toString().slice(-4)}`;
      const existingCode = await db.affiliates.findUnique({
        where: { referralCode: baseCode }
      });
      
      if (existingCode) {
        return generateReferralCode();
      }
      
      return baseCode;
    };

    const referralCode = await generateReferralCode();
    const commissionRate = moduleSettings?.commissionRate ?? 5;

    const affiliate = await db.affiliates.create({
      data: {
        userId,
        referralCode,
        commissionRate,
        status: 'pending',
        updatedAt: new Date()
      }
    });

    console.log(`User ${session.user.email} joined affiliate program with code ${referralCode}`);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the affiliate program. Please activate to start earning.',
      data: {
        referralCode: affiliate.referralCode,
        commissionRate: affiliate.commissionRate,
        status: affiliate.status
      },
    });

  } catch (error) {
    console.error('Error joining affiliate program:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to join affiliate program: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null,
      },
      { status: 500 }
    );
  }
}
