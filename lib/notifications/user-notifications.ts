import { db } from '@/lib/db';
import { trimNotificationsToMax } from '@/lib/notifications-cleanup';
import { getAppName } from '@/lib/utils/general-settings';
import { broadcastNewNotification } from '@/lib/utils/realtime-sync';
import { sendOneSignalPush } from '@/lib/notifications/onesignal-push';

interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: string;
  link: string;
}

async function shouldSendNotification(
  userId: number,
  notificationType: 'welcome' | 'apiKeyChanged' | 'orderStatusChanged' | 'newService' | 'serviceUpdates' | 'transactionAlert' | 'transferFunds' | 'affiliateWithdrawals' | 'supportTickets' | 'contactMessages' | 'blogPost' | 'announcement'
): Promise<boolean> {
  try {
    const user = await db.users.findUnique({
      where: { id: userId },
      select: { permissions: true },
    });

    let userEnabled = true;

    if (user?.permissions && typeof user.permissions === 'object') {
      const permissions = user.permissions as any;
      if (permissions.notificationPreferences) {
        const prefs = permissions.notificationPreferences;
        switch (notificationType) {
          case 'welcome':
            userEnabled = prefs.welcomeEnabled ?? true;
            break;
          case 'apiKeyChanged':
            userEnabled = prefs.apiKeyChangedEnabled ?? true;
            break;
          case 'orderStatusChanged':
            userEnabled = prefs.orderStatusChangedEnabled ?? true;
            break;
          case 'newService':
            userEnabled = prefs.newServiceEnabled ?? true;
            break;
          case 'serviceUpdates':
            userEnabled = prefs.serviceUpdatesEnabled ?? true;
            break;
          case 'transactionAlert':
            userEnabled = prefs.transactionAlertEnabled ?? true;
            break;
          case 'transferFunds':
            userEnabled = prefs.transferFundsEnabled ?? true;
            break;
          case 'affiliateWithdrawals':
            userEnabled = prefs.affiliateWithdrawalsEnabled ?? true;
            break;
          case 'supportTickets':
            userEnabled = prefs.supportTicketsEnabled ?? true;
            break;
          case 'contactMessages':
            userEnabled = prefs.contactMessagesEnabled ?? true;
            break;
          case 'blogPost':
            userEnabled = prefs.blogPostEnabled ?? true;
            break;
          case 'announcement':
            userEnabled = prefs.announcementEnabled ?? true;
            break;
        }
      }
    }

    return userEnabled;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return false;
  }
}

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

export async function sendWelcomeNotification(
  userId: number
): Promise<void> {
  try {
    const shouldSend = await shouldSendNotification(userId, 'welcome');
    
    if (!shouldSend) {
      return;
    }

    const appName = await getAppName();

    await createNotification({
      userId,
      title: `Welcome to ${appName}`,
      message: 'Start growing your social media with fast, reliable, and affordable services. We\'re glad to have you!',
      type: 'system',
      link: '/dashboard',
    });
  } catch (error) {
    console.error('Error sending welcome notification:', error);
  }
}

export async function sendApiKeyChangedNotification(
  userId: number,
  changedByAdmin: boolean = false
): Promise<void> {
  try {
    const shouldSend = await shouldSendNotification(userId, 'apiKeyChanged');
    
    if (!shouldSend) {
      return;
    }

    const title = 'API Key Changed';
    const message = changedByAdmin
      ? 'Your API Key has been changed by admin.'
      : 'Your API Key has been changed successfully.';

    await createNotification({
      userId,
      title,
      message,
      type: 'system',
      link: '/api',
    });
  } catch (error) {
    console.error('Error sending API key changed notification:', error);
  }
}

export async function sendNewOrderNotification(
  userId: number,
  orderId: number,
  serviceName: string
): Promise<void> {
  try {
    const shouldSend = await shouldSendNotification(userId, 'orderStatusChanged');
    
    if (!shouldSend) {
      return;
    }

    await createNotification({
      userId,
      title: `New Order #${orderId} Created`,
      message: `New order #${orderId} has been created for the service ${serviceName}`,
      type: 'order',
      link: '/my-orders',
    });
  } catch (error) {
    console.error('Error sending new order notification:', error);
  }
}

export async function sendOrderStatusChangedNotification(
  userId: number,
  orderId: number,
  status: 'completed' | 'cancelled'
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Attempting to send order status notification:`, {
      userId,
      orderId,
      status
    });

    const shouldSend = await shouldSendNotification(userId, 'orderStatusChanged');
    
    console.log(`[NOTIFICATION] Should send notification:`, shouldSend);
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Notification not sent - settings disabled`);
      return;
    }

    let title: string;
    let message: string;
    let link: string;

    if (status === 'completed') {
      title = `Order #${orderId} is Completed`;
      message = `Your order #${orderId} is completed.`;
      link = '/my-orders?status=completed';
    } else if (status === 'cancelled') {
      title = `Order #${orderId} has been cancelled`;
      message = `Your order #${orderId} has been canceled, and the refund has already been processed back to your account.`;
      link = '/my-orders?status=cancelled';
    } else {
      console.log(`[NOTIFICATION] Invalid status: ${status}`);
      return;
    }

    console.log(`[NOTIFICATION] Creating notification:`, { userId, title, message, link });
    
    await createNotification({
      userId,
      title,
      message,
      type: 'order',
      link,
    });

    console.log(`[NOTIFICATION] Notification created successfully for order #${orderId}`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending order status changed notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendNewServiceNotification(
  serviceId: number,
  serviceName: string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending new service notification:`, {
      serviceId,
      serviceName
    });

    const users = await db.users.findMany({
      where: {
        role: 'user'
      },
      select: {
        id: true,
      },
    });

    console.log(`[NOTIFICATION] Found ${users.length} users to notify`);

    const notificationPromises = users.map(async (user) => {
      try {
        const shouldSend = await shouldSendNotification(user.id, 'newService');
        
        if (!shouldSend) {
          return;
        }

        await createNotification({
          userId: user.id,
          title: 'New Service Added',
          message: serviceName,
          type: 'system',
          link: `/new-order?serviceId=${serviceId}`,
        });
      } catch (error) {
        console.error(`[NOTIFICATION] Error sending notification to user ${user.id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`[NOTIFICATION] New service notifications sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending new service notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

function formatServiceUpdateMessage(changes: any, serviceName: string): string {
  const updates: string[] = [];
  let hasRateChange = false;
  let hasStatusChange = false;

  if (changes.rate && changes.rate.from !== undefined && changes.rate.to !== undefined) {
    const oldRate = parseFloat(changes.rate.from);
    const newRate = parseFloat(changes.rate.to);
    
    if (!isNaN(oldRate) && !isNaN(newRate)) {
      const formatRate = (rate: number) => {
        const formatted = rate.toFixed(6);
        return parseFloat(formatted).toString();
      };
      
      if (newRate > oldRate) {
        updates.push(`Rate increased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
        hasRateChange = true;
      } else if (newRate < oldRate) {
        updates.push(`Rate decreased from $${formatRate(oldRate)} to $${formatRate(newRate)}`);
        hasRateChange = true;
      }
    }
  }

  if (changes.status && changes.status.from !== undefined && changes.status.to !== undefined) {
    const oldStatus = changes.status.from;
    const newStatus = changes.status.to;
    if (newStatus === 'active' && oldStatus !== 'active') {
      updates.push('Service enabled');
      hasStatusChange = true;
    } else if (newStatus !== 'active' && oldStatus === 'active') {
      updates.push('Service disabled');
      hasStatusChange = true;
    }
  }

  const infoFields = ['name', 'description', 'min_order', 'max_order', 'categoryId'];
  const hasInfoUpdate = infoFields.some(field => 
    changes[field] && changes[field].from !== undefined && changes[field].to !== undefined
  );

  if (hasInfoUpdate && !hasRateChange && !hasStatusChange) {
    updates.push('Service info updated');
  }

  if (updates.length === 0) {
    return `${serviceName} has been updated`;
  }

  return `${serviceName}: ${updates.join(', ')}`;
}

export async function sendServiceUpdateNotification(
  serviceId: number,
  serviceName: string,
  changes: any
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending service update notification:`, {
      serviceId,
      serviceName,
      changes
    });

    const users = await db.users.findMany({
      where: {
        role: 'user'
      },
      select: {
        id: true,
      },
    });

    console.log(`[NOTIFICATION] Found ${users.length} users to notify`);

    const updateMessage = formatServiceUpdateMessage(changes, serviceName);

    const notificationPromises = users.map(async (user) => {
      try {
        const shouldSend = await shouldSendNotification(user.id, 'serviceUpdates');
        
        if (!shouldSend) {
          return;
        }

        await createNotification({
          userId: user.id,
          title: 'Service Updated',
          message: updateMessage,
          type: 'system',
          link: `/services/updates`,
        });
      } catch (error) {
        console.error(`[NOTIFICATION] Error sending notification to user ${user.id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`[NOTIFICATION] Service update notifications sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending service update notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

async function deletePendingTransactionNotification(
  userId: number,
  transactionId: number
): Promise<void> {
  try {
    const trxId = transactionId.toString();
    const pendingTitle = `Transaction #${trxId} is Pending`;
    
    await db.notifications.deleteMany({
      where: {
        userId,
        title: pendingTitle,
        type: 'payment',
      },
    });
    
    console.log(`[NOTIFICATION] Deleted pending notification for transaction #${trxId}`);
  } catch (error) {
    console.error('[NOTIFICATION] Error deleting pending notification:', error);
  }
}

export async function sendTransactionSuccessNotification(
  userId: number,
  transactionId: number,
  amount: number | string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending transaction success notification:`, {
      userId,
      transactionId,
      amount
    });

    const shouldSend = await shouldSendNotification(userId, 'transactionAlert');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Transaction alert notification not sent - settings disabled`);
      return;
    }

    await deletePendingTransactionNotification(userId, transactionId);

    const amountStr = typeof amount === 'number' ? amount.toFixed(2) : amount;
    const trxId = transactionId.toString();

    await createNotification({
      userId,
      title: `Fund $${amountStr} Added`,
      message: `$${amountStr} for #${trxId} has been added to your account.`,
      type: 'payment',
      link: '/transactions',
    });

    console.log(`[NOTIFICATION] Transaction success notification created successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending transaction success notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendTransactionPendingNotification(
  userId: number,
  transactionId: number
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending transaction pending notification:`, {
      userId,
      transactionId
    });

    const shouldSend = await shouldSendNotification(userId, 'transactionAlert');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Transaction alert notification not sent - settings disabled`);
      return;
    }

    const trxId = transactionId.toString();

    await createNotification({
      userId,
      title: `Transaction #${trxId} is Pending`,
      message: `Your transaction #${trxId} is pending. Please wait for approval.`,
      type: 'payment',
      link: '/transactions?status=pending',
    });

    console.log(`[NOTIFICATION] Transaction pending notification created successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending transaction pending notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendTransferFundsNotification(
  senderId: number,
  receiverId: number,
  amount: number,
  currencyCode: string,
  currencySymbol: string,
  senderUsername: string,
  receiverUsername: string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending transfer funds notifications:`, {
      senderId,
      receiverId,
      amount,
      currencyCode
    });

    let symbol = currencySymbol;
    if (!symbol) {
      const currency = await db.currencies.findUnique({
        where: { code: currencyCode },
        select: { symbol: true }
      });
      symbol = currency?.symbol || '$';
    }

    const formattedAmount = amount.toFixed(2);

    const senderShouldSend = await shouldSendNotification(senderId, 'transferFunds');
    if (senderShouldSend) {
      await createNotification({
        userId: senderId,
        title: `${symbol}${formattedAmount} Transferred to @${receiverUsername}`,
        message: `${symbol}${formattedAmount} has been transferred to your friend @${receiverUsername}.`,
        type: 'payment',
        link: '/transactions',
      });
      console.log(`[NOTIFICATION] Transfer funds notification sent to sender ${senderId}`);
    }

    const receiverShouldSend = await shouldSendNotification(receiverId, 'transferFunds');
    if (receiverShouldSend) {
      await createNotification({
        userId: receiverId,
        title: `${symbol}${formattedAmount} Received from @${senderUsername}`,
        message: `${symbol}${formattedAmount} has been received from your friend @${senderUsername}.`,
        type: 'payment',
        link: '/transactions',
      });
      console.log(`[NOTIFICATION] Transfer funds notification sent to receiver ${receiverId}`);
    }

    console.log(`[NOTIFICATION] Transfer funds notifications sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending transfer funds notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendAffiliateWithdrawalRequestNotification(
  userId: number,
  amount: number,
  currencySymbol: string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending affiliate withdrawal request notification:`, {
      userId,
      amount,
      currencySymbol
    });

    const shouldSend = await shouldSendNotification(userId, 'affiliateWithdrawals');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Affiliate withdrawal notification not sent - settings disabled`);
      return;
    }

    const formattedAmount = amount.toFixed(2);

    await createNotification({
      userId,
      title: `${currencySymbol}${formattedAmount} Withdrawal Requested`,
      message: `Your ${currencySymbol}${formattedAmount} withdrawal has been requested. Please wait for approval.`,
      type: 'payment',
      link: '/affiliate/withdrawals',
    });

    console.log(`[NOTIFICATION] Affiliate withdrawal request notification sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending affiliate withdrawal request notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendAffiliateWithdrawalApprovedNotification(
  userId: number,
  amount: number,
  currencySymbol: string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending affiliate withdrawal approved notification:`, {
      userId,
      amount,
      currencySymbol
    });

    const shouldSend = await shouldSendNotification(userId, 'affiliateWithdrawals');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Affiliate withdrawal notification not sent - settings disabled`);
      return;
    }

    const formattedAmount = amount.toFixed(2);

    await createNotification({
      userId,
      title: `${currencySymbol}${formattedAmount} Withdrawal Request Approved`,
      message: `Your ${currencySymbol}${formattedAmount} withdrawal request has been approved. Please check your withdrawal method account balance.`,
      type: 'payment',
      link: '/affiliate/withdrawals?status=success',
    });

    console.log(`[NOTIFICATION] Affiliate withdrawal approved notification sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending affiliate withdrawal approved notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendAffiliateWithdrawalDeclinedNotification(
  userId: number,
  amount: number,
  currencySymbol: string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending affiliate withdrawal declined notification:`, {
      userId,
      amount,
      currencySymbol
    });

    const shouldSend = await shouldSendNotification(userId, 'affiliateWithdrawals');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Affiliate withdrawal notification not sent - settings disabled`);
      return;
    }

    const formattedAmount = amount.toFixed(2);

    await createNotification({
      userId,
      title: `${currencySymbol}${formattedAmount} Withdrawal Request Declined`,
      message: `Your ${currencySymbol}${formattedAmount} withdrawal request has been declined. Please try again later or check your withdrawal method.`,
      type: 'payment',
      link: '/affiliate/withdrawals?status=cancelled',
    });

    console.log(`[NOTIFICATION] Affiliate withdrawal declined notification sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending affiliate withdrawal declined notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendSupportTicketRepliedNotification(
  userId: number,
  ticketId: number
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending support ticket replied notification:`, {
      userId,
      ticketId
    });

    const shouldSend = await shouldSendNotification(userId, 'supportTickets');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Support ticket notification not sent - settings disabled`);
      return;
    }

    await createNotification({
      userId,
      title: `Support Ticket #${ticketId} Replied`,
      message: `Your support ticket #${ticketId} has been replied by admin. Please check it.`,
      type: 'ticket',
      link: `/support-tickets/${ticketId}`,
    });

    console.log(`[NOTIFICATION] Support ticket replied notification sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending support ticket replied notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendSupportTicketClosedNotification(
  userId: number,
  ticketId: number
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending support ticket closed notification:`, {
      userId,
      ticketId
    });

    const shouldSend = await shouldSendNotification(userId, 'supportTickets');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Support ticket notification not sent - settings disabled`);
      return;
    }

    await createNotification({
      userId,
      title: `Support Ticket #${ticketId} Closed`,
      message: `Your support ticket #${ticketId} has been closed by admin.`,
      type: 'ticket',
      link: `/support-tickets/${ticketId}`,
    });

    console.log(`[NOTIFICATION] Support ticket closed notification sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending support ticket closed notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendSupportTicketStatusUpdatedNotification(
  userId: number,
  ticketId: number,
  statusName: string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending support ticket status updated notification:`, {
      userId,
      ticketId,
      statusName
    });

    const shouldSend = await shouldSendNotification(userId, 'supportTickets');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Support ticket notification not sent - settings disabled`);
      return;
    }

    await createNotification({
      userId,
      title: `Support Ticket #${ticketId} Status Updated`,
      message: `Your support ticket #${ticketId} status has been updated to ${statusName} by admin.`,
      type: 'ticket',
      link: `/support-tickets/${ticketId}`,
    });

    console.log(`[NOTIFICATION] Support ticket status updated notification sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending support ticket status updated notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendContactMessageRepliedNotification(
  userId: number,
  messageId: number
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending contact message replied notification:`, {
      userId,
      messageId
    });

    const shouldSend = await shouldSendNotification(userId, 'contactMessages');
    
    if (!shouldSend) {
      console.log(`[NOTIFICATION] Contact message notification not sent - settings disabled`);
      return;
    }

    await createNotification({
      userId,
      title: `Support Message Replied #${messageId}`,
      message: `Admin has been replied your support message #${messageId}. Please check your email.`,
      type: 'message',
      link: '',
    });

    console.log(`[NOTIFICATION] Contact message replied notification sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending contact message replied notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendBlogPostNotification(
  blogTitle: string,
  blogSlug: string
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending blog post notification:`, {
      blogTitle,
      blogSlug
    });

    const users = await db.users.findMany({
      where: {
        role: 'user'
      },
      select: {
        id: true,
      },
    });

    console.log(`[NOTIFICATION] Found ${users.length} users to notify`);

    const notificationPromises = users.map(async (user) => {
      try {
        const shouldSend = await shouldSendNotification(user.id, 'blogPost');
        
        if (!shouldSend) {
          return;
        }

        await createNotification({
          userId: user.id,
          title: 'New Blog Post Released',
          message: blogTitle,
          type: 'blog',
          link: `/blogs/${blogSlug}`,
        });
      } catch (error) {
        console.error(`[NOTIFICATION] Error sending notification to user ${user.id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`[NOTIFICATION] Blog post notifications sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending blog post notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

export async function sendAnnouncementNotification(
  announcementTitle: string,
  announcementType: string = 'info'
): Promise<void> {
  try {
    console.log(`[NOTIFICATION] Sending announcement notification:`, {
      announcementTitle,
      announcementType
    });

    const users = await db.users.findMany({
      where: {
        role: 'user'
      },
      select: {
        id: true,
      },
    });

    console.log(`[NOTIFICATION] Found ${users.length} users to notify`);

    const notificationType = `announcement-${announcementType}`;

    const notificationPromises = users.map(async (user) => {
      try {
        const shouldSend = await shouldSendNotification(user.id, 'announcement');
        
        if (!shouldSend) {
          return;
        }

        await createNotification({
          userId: user.id,
          title: 'New Announcement for User',
          message: announcementTitle,
          type: notificationType,
          link: '/dashboard',
        });
      } catch (error) {
        console.error(`[NOTIFICATION] Error sending notification to user ${user.id}:`, error);
      }
    });

    await Promise.all(notificationPromises);
    console.log(`[NOTIFICATION] Announcement notifications sent successfully`);
  } catch (error) {
    console.error('[NOTIFICATION] Error sending announcement notification:', error);
    if (error instanceof Error) {
      console.error('[NOTIFICATION] Error stack:', error.stack);
    }
  }
}

