import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationSettings = await db.integrationSettings.findFirst();

    const adminUserNotifications = {
      welcomeEnabled: integrationSettings?.userNotifWelcome ?? false,
      apiKeyChangedEnabled: integrationSettings?.userNotifApiKeyChanged ?? false,
      orderStatusChangedEnabled: integrationSettings?.userNotifOrderStatusChanged ?? false,
      newServiceEnabled: integrationSettings?.userNotifNewService ?? false,
      serviceUpdatesEnabled: integrationSettings?.userNotifServiceUpdates ?? false,
      transactionAlertEnabled: integrationSettings?.userNotifTransactionAlert ?? false,
      transferFundsEnabled: integrationSettings?.userNotifTransferFunds ?? false,
      affiliateWithdrawalsEnabled: integrationSettings?.userNotifAffiliateWithdrawals ?? false,
      supportTicketsEnabled: integrationSettings?.userNotifSupportTickets ?? false,
      contactMessagesEnabled: integrationSettings?.userNotifContactMessages ?? false,
    };

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { permissions: true },
    });

    const defaultPreferences: any = {
      welcomeEnabled: adminUserNotifications.welcomeEnabled,
      apiKeyChangedEnabled: adminUserNotifications.apiKeyChangedEnabled,
      orderStatusChangedEnabled: adminUserNotifications.orderStatusChangedEnabled,
      newServiceEnabled: adminUserNotifications.newServiceEnabled,
      serviceUpdatesEnabled: adminUserNotifications.serviceUpdatesEnabled,
      transactionAlertEnabled: adminUserNotifications.transactionAlertEnabled,
      transferFundsEnabled: adminUserNotifications.transferFundsEnabled,
      affiliateWithdrawalsEnabled: adminUserNotifications.affiliateWithdrawalsEnabled,
      supportTicketsEnabled: adminUserNotifications.supportTicketsEnabled,
      contactMessagesEnabled: adminUserNotifications.contactMessagesEnabled,
    };

    let userPreferences = { ...defaultPreferences };
    if (user?.permissions && typeof user.permissions === 'object') {
      const permissions = user.permissions as any;
      if (permissions.notificationPreferences) {
        const savedPrefs = permissions.notificationPreferences;
        userPreferences = {
          welcomeEnabled: adminUserNotifications.welcomeEnabled 
            ? (savedPrefs.welcomeEnabled ?? defaultPreferences.welcomeEnabled)
            : false,
          apiKeyChangedEnabled: adminUserNotifications.apiKeyChangedEnabled
            ? (savedPrefs.apiKeyChangedEnabled ?? defaultPreferences.apiKeyChangedEnabled)
            : false,
          orderStatusChangedEnabled: adminUserNotifications.orderStatusChangedEnabled
            ? (savedPrefs.orderStatusChangedEnabled ?? defaultPreferences.orderStatusChangedEnabled)
            : false,
          newServiceEnabled: adminUserNotifications.newServiceEnabled
            ? (savedPrefs.newServiceEnabled ?? defaultPreferences.newServiceEnabled)
            : false,
          serviceUpdatesEnabled: adminUserNotifications.serviceUpdatesEnabled
            ? (savedPrefs.serviceUpdatesEnabled ?? defaultPreferences.serviceUpdatesEnabled)
            : false,
          transactionAlertEnabled: adminUserNotifications.transactionAlertEnabled
            ? (savedPrefs.transactionAlertEnabled ?? defaultPreferences.transactionAlertEnabled)
            : false,
          transferFundsEnabled: adminUserNotifications.transferFundsEnabled
            ? (savedPrefs.transferFundsEnabled ?? defaultPreferences.transferFundsEnabled)
            : false,
          affiliateWithdrawalsEnabled: adminUserNotifications.affiliateWithdrawalsEnabled
            ? (savedPrefs.affiliateWithdrawalsEnabled ?? defaultPreferences.affiliateWithdrawalsEnabled)
            : false,
          supportTicketsEnabled: adminUserNotifications.supportTicketsEnabled
            ? (savedPrefs.supportTicketsEnabled ?? defaultPreferences.supportTicketsEnabled)
            : false,
          contactMessagesEnabled: adminUserNotifications.contactMessagesEnabled
            ? (savedPrefs.contactMessagesEnabled ?? defaultPreferences.contactMessagesEnabled)
            : false,
        };
      }
    }

    return NextResponse.json({
      success: true,
      adminSettings: adminUserNotifications,
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

