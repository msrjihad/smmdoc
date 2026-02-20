import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultPreferences: any = {
      welcomeEnabled: true,
      apiKeyChangedEnabled: true,
      orderStatusChangedEnabled: true,
      newServiceEnabled: true,
      serviceUpdatesEnabled: true,
      transactionAlertEnabled: true,
      transferFundsEnabled: true,
      affiliateWithdrawalsEnabled: true,
      supportTicketsEnabled: true,
      contactMessagesEnabled: true,
      blogPostEnabled: true,
      announcementEnabled: true,
    };

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { permissions: true },
    });

    let userPreferences = { ...defaultPreferences };
    if (user?.permissions && typeof user.permissions === 'object') {
      const permissions = user.permissions as any;
      if (permissions.notificationPreferences) {
        const savedPrefs = permissions.notificationPreferences;
        userPreferences = {
          welcomeEnabled: savedPrefs.welcomeEnabled ?? defaultPreferences.welcomeEnabled,
          apiKeyChangedEnabled: savedPrefs.apiKeyChangedEnabled ?? defaultPreferences.apiKeyChangedEnabled,
          orderStatusChangedEnabled: savedPrefs.orderStatusChangedEnabled ?? defaultPreferences.orderStatusChangedEnabled,
          newServiceEnabled: savedPrefs.newServiceEnabled ?? defaultPreferences.newServiceEnabled,
          serviceUpdatesEnabled: savedPrefs.serviceUpdatesEnabled ?? defaultPreferences.serviceUpdatesEnabled,
          transactionAlertEnabled: savedPrefs.transactionAlertEnabled ?? defaultPreferences.transactionAlertEnabled,
          transferFundsEnabled: savedPrefs.transferFundsEnabled ?? defaultPreferences.transferFundsEnabled,
          affiliateWithdrawalsEnabled: savedPrefs.affiliateWithdrawalsEnabled ?? defaultPreferences.affiliateWithdrawalsEnabled,
          supportTicketsEnabled: savedPrefs.supportTicketsEnabled ?? defaultPreferences.supportTicketsEnabled,
          contactMessagesEnabled: savedPrefs.contactMessagesEnabled ?? defaultPreferences.contactMessagesEnabled,
          blogPostEnabled: savedPrefs.blogPostEnabled ?? defaultPreferences.blogPostEnabled,
          announcementEnabled: savedPrefs.announcementEnabled ?? defaultPreferences.announcementEnabled,
        };
      }
    }

    return NextResponse.json({
      success: true,
      adminSettings: defaultPreferences,
      userPreferences: userPreferences,
    });
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to load notification preferences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { preferences } = await request.json();

    if (!preferences) {
      return NextResponse.json(
        { error: 'Notification preferences data is required' },
        { status: 400 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { permissions: true },
    });

    const currentPermissions = (user?.permissions as any) || {};

    await db.users.update({
      where: { id: parseInt(session.user.id) },
      data: {
        permissions: {
          ...currentPermissions,
          notificationPreferences: preferences,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences saved successfully',
    });
  } catch (error) {
    console.error('Error saving notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save notification preferences' },
      { status: 500 }
    );
  }
}

