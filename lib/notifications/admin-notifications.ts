import { db } from '@/lib/db';

interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: string;
  link: string;
}

async function createNotification(data: NotificationData): Promise<void> {
  try {
    await db.notifications.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        read: false,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

async function shouldSendAdminNotification(
  notificationType: 'apiBalanceAlerts' | 'supportTickets' | 'newMessages' | 'newManualServiceOrders' | 'failOrders' | 'newManualRefillRequests' | 'newManualCancelRequests' | 'newUsers' | 'userActivityLogs' | 'pendingTransactions' | 'apiSyncLogs' | 'newChildPanelOrders'
): Promise<boolean> {
  try {
    const integrationSettings = await db.integrationSettings.findFirst();
    
    if (!integrationSettings) {
      return false;
    }

    switch (notificationType) {
      case 'apiBalanceAlerts':
        return integrationSettings.adminNotifApiBalanceAlerts ?? false;
      case 'supportTickets':
        return integrationSettings.adminNotifSupportTickets ?? false;
      case 'newMessages':
        return integrationSettings.adminNotifNewMessages ?? false;
      case 'newManualServiceOrders':
        return integrationSettings.adminNotifNewManualServiceOrders ?? false;
      case 'failOrders':
        return integrationSettings.adminNotifFailOrders ?? false;
      case 'newManualRefillRequests':
        return integrationSettings.adminNotifNewManualRefillRequests ?? false;
      case 'newManualCancelRequests':
        return integrationSettings.adminNotifNewManualCancelRequests ?? false;
      case 'newUsers':
        return integrationSettings.adminNotifNewUsers ?? false;
      case 'userActivityLogs':
        return integrationSettings.adminNotifUserActivityLogs ?? false;
      case 'pendingTransactions':
        return integrationSettings.adminNotifPendingTransactions ?? false;
      case 'apiSyncLogs':
        return integrationSettings.adminNotifApiSyncLogs ?? false;
      case 'newChildPanelOrders':
        return integrationSettings.adminNotifNewChildPanelOrders ?? false;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking admin notification settings:', error);
    return false;
  }
}

async function sendAdminNotification(
  notificationType: 'apiBalanceAlerts' | 'supportTickets' | 'newMessages' | 'newManualServiceOrders' | 'failOrders' | 'newManualRefillRequests' | 'newManualCancelRequests' | 'newUsers' | 'userActivityLogs' | 'pendingTransactions' | 'apiSyncLogs' | 'newChildPanelOrders',
  title: string,
  message: string,
  link: string,
  type: string = 'system'
): Promise<void> {
  try {
    const shouldSend = await shouldSendAdminNotification(notificationType);
    
    if (!shouldSend) {
      console.log(`[ADMIN NOTIFICATION] ${notificationType} not sent - settings disabled`);
      return;
    }

    const admins = await db.users.findMany({
      where: {
        role: { in: ['admin', 'moderator'] }
      },
      select: {
        id: true,
      },
    });

    console.log(`[ADMIN NOTIFICATION] Found ${admins.length} admins/moderators to notify`);

    const notificationPromises = admins.map(async (admin) => {
      try {
        await createNotification({
          userId: admin.id,
          title,
          message,
          type,
          link,
        });
      } catch (error) {
        console.error(`[ADMIN NOTIFICATION] Error sending notification to admin ${admin.id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`[ADMIN NOTIFICATION] ${notificationType} notifications sent successfully`);
  } catch (error) {
    console.error(`[ADMIN NOTIFICATION] Error sending ${notificationType} notification:`, error);
    if (error instanceof Error) {
      console.error('[ADMIN NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendAdminSupportTicketNotification(
  ticketId: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'supportTickets',
    `New Support Ticket #${ticketId}`,
    `@${userName} created a new support ticket.`,
    `/admin/tickets/${ticketId}`,
    'ticket'
  );
}

export async function sendAdminNewMessageNotification(
  messageId: number,
  subject: string,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'newMessages',
    `New Contact Message #${messageId}`,
    `@${userName} sent a new message.`,
    `/admin/contact-messages/${messageId}`,
    'user'
  );
}

export async function sendAdminNewManualServiceOrderNotification(
  orderId: number,
  serviceName: string,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'newManualServiceOrders',
    `New Manual Service Order #${orderId}`,
    `@${userName} created a new manual service order for ${serviceName}.`,
    `/admin/orders`,
    'order'
  );
}

export async function sendAdminFailOrderNotification(
  orderId: number,
  serviceName: string,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'failOrders',
    `Order #${orderId} Failed`,
    `Order #${orderId} for ${serviceName} by ${userName} has failed.`,
    `/admin/orders?status=failed`,
    'order'
  );
}

export async function sendAdminNewManualRefillRequestNotification(
  requestId: number,
  orderId: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'newManualRefillRequests',
    `New Manual Order Refill Request #${requestId}`,
    `@${userName} requested a refill for manual order #${orderId}.`,
    `/admin/orders/refill-requests`,
    'order'
  );
}

export async function sendAdminNewManualCancelRequestNotification(
  requestId: number,
  orderId: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'newManualCancelRequests',
    `New Manual Order Cancel Request #${orderId}`,
    `@${userName} requested to cancel order #${orderId}.`,
    `/admin/orders/cancel-requests`,
    'order'
  );
}

export async function sendAdminNewUserNotification(
  userId: number,
  userName: string,
  userEmail: string
): Promise<void> {
  await sendAdminNotification(
    'newUsers',
    `New User Registered @${userName}`,
    `@${userName} has registered.`,
    `/admin/users`,
    'user'
  );
}

export async function sendAdminPendingTransactionNotification(
  transactionId: number,
  amount: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'pendingTransactions',
    `Pending Transaction #${transactionId}`,
    `@${userName} has a pending transaction of $${amount.toFixed(2)}.`,
    `/admin/transactions`,
    'payment'
  );
}

export async function sendAdminApiSyncLogNotification(
  logId: number,
  serviceName: string,
  changeType: string
): Promise<void> {
  await sendAdminNotification(
    'apiSyncLogs',
    `API Sync Log #${logId}`,
    `Service ${serviceName} was ${changeType} during API sync.`,
    `/admin/services/sync-logs`,
    'system'
  );
}

export async function sendAdminNewChildPanelOrderNotification(
  orderId: number,
  serviceName: string,
  panelName: string
): Promise<void> {
  await sendAdminNotification(
    'newChildPanelOrders',
    `New Child Panel Order #${orderId}`,
    `New order for ${serviceName} from child panel: ${panelName}.`,
    `/admin/orders`,
    'order'
  );
}

export async function sendAdminApiBalanceAlertNotification(
  providerName: string,
  balance: number,
  threshold: number
): Promise<void> {
  await sendAdminNotification(
    'apiBalanceAlerts',
    `API Balance Alert for ${providerName}`,
    `${providerName} balance is below 50$, please add funds to avoid service interruptions.`,
    `/admin/settings/providers`,
    'system'
  );
}

