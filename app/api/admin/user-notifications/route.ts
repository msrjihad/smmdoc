import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userNotifications } = await request.json();

    if (!userNotifications) {
      return NextResponse.json(
        { error: 'User notifications data is required' },
        { status: 400 }
      );
    }

    await db.integrationSettings.upsert({
      where: { id: 1 },
      update: {
        userNotifWelcome: userNotifications.welcomeEnabled ?? false,
        userNotifApiKeyChanged: userNotifications.apiKeyChangedEnabled ?? false,
        userNotifOrderStatusChanged: userNotifications.orderStatusChangedEnabled ?? false,
        userNotifNewService: userNotifications.newServiceEnabled ?? false,
        userNotifServiceUpdates: userNotifications.serviceUpdatesEnabled ?? false,
        userNotifTransactionAlert: userNotifications.transactionAlertEnabled ?? false,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        userNotifWelcome: userNotifications.welcomeEnabled ?? false,
        userNotifApiKeyChanged: userNotifications.apiKeyChangedEnabled ?? false,
        userNotifOrderStatusChanged: userNotifications.orderStatusChangedEnabled ?? false,
        userNotifNewService: userNotifications.newServiceEnabled ?? false,
        userNotifServiceUpdates: userNotifications.serviceUpdatesEnabled ?? false,
        userNotifTransactionAlert: userNotifications.transactionAlertEnabled ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User notification settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving user notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to save user notification settings' },
      { status: 500 }
    );
  }
}

