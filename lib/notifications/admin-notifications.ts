import { db } from '@/lib/db';
import { trimNotificationsToMax } from '@/lib/notifications-cleanup';
import { ROUTE_PERMISSION_MAP } from '@/lib/permissions';
import { broadcastNewNotification } from '@/lib/utils/realtime-sync';
import { sendOneSignalPush } from '@/lib/notifications/onesignal-push';

interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: string;
  link: string;
}

const NOTIFICATION_PERMISSION_MAP: Record<string, string | null> = {
  'apiBalanceAlerts': null,
  'supportTickets': 'support_tickets',
  'newMessages': 'contact_messages',
  'newManualServiceOrders': 'all_orders',
  'failOrders': 'all_orders',
  'refillRequests': 'refill_requests',
  'cancelRequests': 'cancel_requests',
  'newUsers': 'users',
  'userActivityLogs': 'user_activity_logs',
  'pendingTransactions': 'all_transactions',
  'apiSyncLogs': 'api_sync_logs',
  'newChildPanelOrders': 'child_panels',
  'announcement': null,
};

async function createNotification(data: NotificationData): Promise<void> {
  try {
    const notification = await db.notifications.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link,
        read: false,
      },
    });
    trimNotificationsToMax(data.userId).catch((err) =>
      console.error('Failed to trim notifications:', err)
    );
    broadcastNewNotification(data.userId, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt,
    });
    sendOneSignalPush([data.userId], data.title, data.message, data.link || undefined).catch((err) =>
      console.error('OneSignal push error:', err)
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

async function sendAdminNotification(
  notificationType: 'apiBalanceAlerts' | 'supportTickets' | 'newMessages' | 'newManualServiceOrders' | 'failOrders' | 'refillRequests' | 'cancelRequests' | 'newUsers' | 'userActivityLogs' | 'pendingTransactions' | 'apiSyncLogs' | 'newChildPanelOrders' | 'announcement',
  title: string,
  message: string,
  link: string,
  type: string = 'system',
  targetRoles?: string[]
): Promise<void> {
  try {
    const roles = targetRoles || ['admin', 'moderator'];
    let users = await db.users.findMany({
      where: {
        role: { in: roles as any }
      },
      select: {
        id: true,
        role: true,
        permissions: true,
      },
    });

    if (notificationType !== 'announcement') {
      const requiredPermission = NOTIFICATION_PERMISSION_MAP[notificationType];
      
      if (requiredPermission) {
        users = users.filter((user) => {
          const userRole = user.role as string;
          if (userRole === 'admin') {
            return true;
          }
          
          if (userRole === 'moderator') {
            const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
            return userPermissions.includes(requiredPermission);
          }
          
          return false;
        });
      } else {
        users = users.filter((user) => (user.role as string) === 'admin');
      }
    }

    console.log(`[ADMIN NOTIFICATION] Found ${users.length} admins/moderators to notify`);

    const notificationPromises = users.map(async (user) => {
      try {
        await createNotification({
          userId: user.id,
          title,
          message,
          type,
          link,
        });
      } catch (error) {
        console.error(`[ADMIN NOTIFICATION] Error sending notification to user ${user.id}:`, error);
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

export async function sendAdminSupportTicketReplyNotification(
  ticketId: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'supportTickets',
    `Support Ticket #${ticketId} Replied`,
    `@${userName} replied for support ticket #${ticketId}`,
    `/admin/tickets/${ticketId}`,
    'ticket'
  );
}

export async function sendAdminSupportTicketClosedNotification(
  ticketId: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'supportTickets',
    `Support Ticket #${ticketId} Closed`,
    `@${userName} closed the support ticket.`,
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
    `@${userName} ordered a manual service for ${serviceName}.`,
    `/admin/orders?status=pending&provider=self`,
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

export async function sendAdminNewRefillRequestNotification(
  orderId: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'refillRequests',
    `New Refill Request for Order #${orderId}`,
    `@${userName} has requested a refill for order #${orderId}.`,
    `/admin/orders/refill-requests?status=pending`,
    'order'
  );
}

export async function sendAdminRefillRequestFailedNotification(
  orderId: number,
  userName: string,
  providerName: string
): Promise<void> {
  await sendAdminNotification(
    'refillRequests',
    `Refill Request Failed #${orderId}`,
    `Failed to forward refill request from @${userName} for order #${orderId} to ${providerName}.`,
    `/admin/orders/refill-requests?status=failed`,
    'order'
  );
}

export async function sendAdminNewCancelRequestNotification(
  orderId: number,
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'cancelRequests',
    `New Cancel Request for Order #${orderId}`,
    `@${userName} has requested to cancel order #${orderId}.`,
    `/admin/orders/cancel-requests?status=pending`,
    'order'
  );
}

export async function sendAdminCancelRequestFailedNotification(
  orderId: number,
  userName: string,
  providerName: string
): Promise<void> {
  await sendAdminNotification(
    'cancelRequests',
    `Cancel Request Failed #${orderId}`,
    `Failed to forward cancel request from @${userName} for order #${orderId} to ${providerName}.`,
    `/admin/orders/cancel-requests?status=failed`,
    'order'
  );
}

export async function sendAdminNewUserNotification(
  userId: number,
  username: string,
  userEmail: string
): Promise<void> {
  await sendAdminNotification(
    'newUsers',
    `New User Registered @${username}`,
    `@${username} has registered.`,
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
  logId: string,
  provider: string,
  action: string,
  servicesAffected: number,
  status: string
): Promise<void> {
  const statusText = status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'in progress';
  await sendAdminNotification(
    'apiSyncLogs',
    `API Sync Log #${logId}`,
    `API sync ${action} for ${provider} ${statusText}. ${servicesAffected} service(s) affected.`,
    `/admin/services/sync-logs`,
    'system'
  );
}

export async function sendAdminNewChildPanelOrderNotification(
  userName: string
): Promise<void> {
  await sendAdminNotification(
    'newChildPanelOrders',
    `New Child Panel Order`,
    `@${userName} has ordered a child panel.`,
    `/admin/child-panels`,
    'order'
  );
}

export async function sendAdminApiBalanceAlertNotification(
  providerName: string,
  balance: number
): Promise<void> {
  await sendAdminNotification(
    'apiBalanceAlerts',
    `API Balance Alert for ${providerName}`,
    `${providerName} balance is $${balance.toFixed(2)}, below threshold of $50.00`,
    `/admin/settings/integrations`,
    'system'
  );
}

export async function sendAdminUserActivityLogNotification(
  action: string,
  userName: string,
  details: string
): Promise<void> {
  await sendAdminNotification(
    'userActivityLogs',
    `User Activity: ${action}`,
    `@${userName}: ${details}`,
    `/admin/activity-logs`,
    'user'
  );
}

export async function sendAdminAnnouncementNotification(
  announcementTitle: string,
  announcementType: string = 'info',
  targetedAudience: string
): Promise<void> {
  try {
    console.log(`[ADMIN NOTIFICATION] Sending announcement notification:`, {
      announcementTitle,
      announcementType,
      targetedAudience
    });

    let targetRoles: string[] = [];
    if (targetedAudience === 'admin') {
      targetRoles = ['admin'];
    } else if (targetedAudience === 'moderator') {
      targetRoles = ['moderator'];
    } else if (targetedAudience === 'all') {
      targetRoles = ['admin', 'moderator'];
    } else {
      return;
    }

    const notificationType = `announcement-${announcementType}`;

    await sendAdminNotification(
      'announcement',
      'New Announcement',
      announcementTitle,
      '/admin',
      notificationType,
      targetRoles
    );
  } catch (error) {
    console.error('[ADMIN NOTIFICATION] Error sending announcement notification:', error);
    if (error instanceof Error) {
      console.error('[ADMIN NOTIFICATION] Error stack:', error.stack);
    }
  }
}