import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrationSettings = await db.integrationSettings.findFirst();

    if (!integrationSettings) {
      return NextResponse.json({
        success: true,
        userNotifications: {
          welcomeEnabled: false,
          apiKeyChangedEnabled: false,
          orderStatusChangedEnabled: false,
          newServiceEnabled: false,
          serviceUpdatesEnabled: false,
          transactionAlertEnabled: false,
          transferFundsEnabled: false,
          affiliateWithdrawalsEnabled: false,
        },
        adminNotifications: {
          apiBalanceAlertsEnabled: false,
          supportTicketsEnabled: false,
          newMessagesEnabled: false,
          newManualServiceOrdersEnabled: false,
          failOrdersEnabled: false,
          newManualRefillRequestsEnabled: false,
          newManualCancelRequestsEnabled: false,
          newUsersEnabled: false,
          userActivityLogsEnabled: false,
          pendingTransactionsEnabled: false,
          apiSyncLogsEnabled: false,
          newChildPanelOrdersEnabled: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      userNotifications: {
        welcomeEnabled: integrationSettings.userNotifWelcome ?? false,
        apiKeyChangedEnabled: integrationSettings.userNotifApiKeyChanged ?? false,
        orderStatusChangedEnabled: integrationSettings.userNotifOrderStatusChanged ?? false,
        newServiceEnabled: integrationSettings.userNotifNewService ?? false,
        serviceUpdatesEnabled: integrationSettings.userNotifServiceUpdates ?? false,
        transactionAlertEnabled: integrationSettings.userNotifTransactionAlert ?? false,
        transferFundsEnabled: integrationSettings.userNotifTransferFunds ?? false,
        affiliateWithdrawalsEnabled: integrationSettings.userNotifAffiliateWithdrawals ?? false,
      },
      adminNotifications: {
        apiBalanceAlertsEnabled: integrationSettings.adminNotifApiBalanceAlerts ?? false,
        supportTicketsEnabled: integrationSettings.adminNotifSupportTickets ?? false,
        newMessagesEnabled: integrationSettings.adminNotifNewMessages ?? false,
        newManualServiceOrdersEnabled: integrationSettings.adminNotifNewManualServiceOrders ?? false,
        failOrdersEnabled: integrationSettings.adminNotifFailOrders ?? false,
        newManualRefillRequestsEnabled: integrationSettings.adminNotifNewManualRefillRequests ?? false,
        newManualCancelRequestsEnabled: integrationSettings.adminNotifNewManualCancelRequests ?? false,
        newUsersEnabled: integrationSettings.adminNotifNewUsers ?? false,
        userActivityLogsEnabled: integrationSettings.adminNotifUserActivityLogs ?? false,
        pendingTransactionsEnabled: integrationSettings.adminNotifPendingTransactions ?? false,
        apiSyncLogsEnabled: integrationSettings.adminNotifApiSyncLogs ?? false,
        newChildPanelOrdersEnabled: integrationSettings.adminNotifNewChildPanelOrders ?? false,
      },
    });
  } catch (error) {
    console.error('Error loading notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to load notification settings' },
      { status: 500 }
    );
  }
}

