import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbSettings = await db.integrationSettings.findFirst();

    if (!dbSettings || !dbSettings.pushNotificationsEnabled || !dbSettings.oneSignalCode?.trim()) {
      return NextResponse.json({
        success: true,
        pushNotificationSettings: {
          enabled: false,
          oneSignalCode: '',
          oneSignalAppId: '',
          visibility: 'all',
        },
      });
    }

    return NextResponse.json({
      success: true,
      pushNotificationSettings: {
        enabled: true,
        oneSignalCode: dbSettings.oneSignalCode,
        oneSignalAppId: dbSettings.oneSignalAppId ?? '',
        visibility: dbSettings.oneSignalVisibility ?? 'all',
      },
    });
  } catch (error) {
    console.error('Error fetching push notification settings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
