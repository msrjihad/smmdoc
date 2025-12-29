import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { adminNotifications } = await request.json();

    if (!adminNotifications) {
      return NextResponse.json(
        { error: 'Admin notifications data is required' },
        { status: 400 }
      );
    }

    await db.integrationSettings.upsert({
      where: { id: 1 },
      update: {
        adminNotifApiBalanceAlerts: adminNotifications.apiBalanceAlertsEnabled ?? false,
        adminNotifSupportTickets: adminNotifications.supportTicketsEnabled ?? false,
        adminNotifNewMessages: adminNotifications.newMessagesEnabled ?? false,
        adminNotifNewManualServiceOrders: adminNotifications.newManualServiceOrdersEnabled ?? false,
        adminNotifFailOrders: adminNotifications.failOrdersEnabled ?? false,
        adminNotifNewManualRefillRequests: adminNotifications.newManualRefillRequestsEnabled ?? false,
        adminNotifNewManualCancelRequests: adminNotifications.newManualCancelRequestsEnabled ?? false,
        adminNotifNewUsers: adminNotifications.newUsersEnabled ?? false,
        adminNotifUserActivityLogs: adminNotifications.userActivityLogsEnabled ?? false,
        adminNotifPendingTransactions: adminNotifications.pendingTransactionsEnabled ?? false,
        adminNotifApiSyncLogs: adminNotifications.apiSyncLogsEnabled ?? false,
        adminNotifNewChildPanelOrders: adminNotifications.newChildPanelOrdersEnabled ?? false,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        adminNotifApiBalanceAlerts: adminNotifications.apiBalanceAlertsEnabled ?? false,
        adminNotifSupportTickets: adminNotifications.supportTicketsEnabled ?? false,
        adminNotifNewMessages: adminNotifications.newMessagesEnabled ?? false,
        adminNotifNewManualServiceOrders: adminNotifications.newManualServiceOrdersEnabled ?? false,
        adminNotifFailOrders: adminNotifications.failOrdersEnabled ?? false,
        adminNotifNewManualRefillRequests: adminNotifications.newManualRefillRequestsEnabled ?? false,
        adminNotifNewManualCancelRequests: adminNotifications.newManualCancelRequestsEnabled ?? false,
        adminNotifNewUsers: adminNotifications.newUsersEnabled ?? false,
        adminNotifUserActivityLogs: adminNotifications.userActivityLogsEnabled ?? false,
        adminNotifPendingTransactions: adminNotifications.pendingTransactionsEnabled ?? false,
        adminNotifApiSyncLogs: adminNotifications.apiSyncLogsEnabled ?? false,
        adminNotifNewChildPanelOrders: adminNotifications.newChildPanelOrdersEnabled ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Admin notification settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving admin notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to save admin notification settings' },
      { status: 500 }
    );
  }
}

