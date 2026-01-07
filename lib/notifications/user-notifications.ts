import { db } from '@/lib/db';
import { getAppName } from '@/lib/utils/general-settings';

interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type: string;
  link: string;
}

/**
 * Check if a notification type is enabled for a user
 * Returns true if:
 * 1. Admin has enabled the notification type
 * 2. User has enabled the notification type in their preferences (or defaults to enabled)
 */
async function shouldSendNotification(
  userId: number,
  notificationType: 'welcome' | 'apiKeyChanged' | 'orderStatusChanged' | 'newService' | 'serviceUpdates' | 'transactionAlert' | 'transferFunds'
): Promise<boolean> {
  try {
    const integrationSettings = await db.integrationSettings.findFirst();
    
    if (!integrationSettings) {
      return false;
    }

    let adminEnabled = false;
    switch (notificationType) {
      case 'welcome':
        adminEnabled = integrationSettings.userNotifWelcome ?? false;
        break;
      case 'apiKeyChanged':
        adminEnabled = integrationSettings.userNotifApiKeyChanged ?? false;
        break;
      case 'orderStatusChanged':
        adminEnabled = integrationSettings.userNotifOrderStatusChanged ?? false;
        break;
      case 'newService':
        adminEnabled = integrationSettings.userNotifNewService ?? false;
        break;
      case 'serviceUpdates':
        adminEnabled = integrationSettings.userNotifServiceUpdates ?? false;
        break;
      case 'transactionAlert':
        adminEnabled = integrationSettings.userNotifTransactionAlert ?? false;
        break;
      case 'transferFunds':
        adminEnabled = integrationSettings.userNotifTransferFunds ?? false;
        break;
      default:
        return false;
    }

    if (!adminEnabled) {
      return false;
    }

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
        }
      }
    }

    return userEnabled;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return false;
  }
}

/**
 * Create a notification for a user
 */
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

/**
 * Send a welcome notification to a new user
 */
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

/**
 * Send an API key changed notification
 */
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

/**
 * Send a new order created notification
 */
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

/**
 * Send an order status changed notification
 */
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

/**
 * Send a service update notification to all users
 */
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

/**
 * Send a transaction pending notification
 */
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

/**
 * Send transfer funds notifications to sender and receiver
 */
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

