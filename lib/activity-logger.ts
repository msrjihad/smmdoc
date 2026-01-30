import { db } from '@/lib/db';
import { trimActivityLogsToMax } from '@/lib/activity-logs-cleanup';
import { NextRequest } from 'next/server';

export function getClientIP(request?: NextRequest): string {
  if (!request) return 'unknown';

  const middlewareIP = request.headers.get('x-client-ip');
  if (middlewareIP) {
    return middlewareIP;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {

    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}

export function getUserAgent(request?: NextRequest): string {
  if (!request) return 'unknown';
  return request.headers.get('user-agent') || 'unknown';
}

interface ActivityLogData {
  userId?: number;
  username?: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(data: ActivityLogData) {
  try {
    await db.activityLogs.create({
      data: {
        userId: data.userId,
        username: data.username,
        action: data.action,
        details: data.details,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      },
    });

    trimActivityLogsToMax().catch((err) => console.error('Failed to trim activity logs:', err));

    const importantActions = [
      'login', 'admin_login', 'order_created', 'fund_added', 
      'balance_added', 'balance_deducted', 'user_created', 
      'user_deleted', 'order_status_changed', 'api_key_changed'
    ];
    
    if (data.username && importantActions.includes(data.action)) {
      try {
        const { sendAdminUserActivityLogNotification } = await import('@/lib/notifications/admin-notifications');
        await sendAdminUserActivityLogNotification(
          data.action,
          data.username,
          data.details
        );
      } catch (notificationError) {
        console.error('Failed to send activity log notification:', notificationError);
      }
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export const ActivityLogger = {
  login: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'login',
      details: `User ${username} logged in successfully`,
      ipAddress,
    }),

  adminLogin: (adminId: number, adminUsername: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'admin_login',
      details: `Admin ${adminUsername} logged into admin panel`,
      ipAddress,
    }),

  logout: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'logout',
      details: `User ${username} logged out`,
      ipAddress,
    }),

  adminLogout: (adminId: number, adminUsername: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'admin_logout',
      details: `Admin ${adminUsername} logged out from admin panel`,
      ipAddress,
    }),

  orderCreated: (userId: number, username: string, orderCount: number, totalCost: number, currency: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'order_created',
      details: `User ${username} created ${orderCount} order(s) with total cost ${totalCost} ${currency}`,
      ipAddress,
      metadata: {
        orderCount,
        totalCost,
        currency
      }
    }),

  fundAdded: (userId: number, username: string, amount: number, currency: string, method: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'fund_added',
      details: `User ${username} added ${amount} ${currency} via ${method}`,
      ipAddress,
      metadata: {
        amount,
        currency,
        method
      }
    }),

  profileUpdated: (userId: number, username: string, fields: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'profile_updated',
      details: `User ${username} updated profile fields: ${fields}`,
      ipAddress,
      metadata: {
        updatedFields: fields
      }
    }),

  passwordChanged: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'password_changed',
      details: `User ${username} changed their password`,
      ipAddress,
    }),

  userStatusChanged: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, oldStatus: string, newStatus: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'user_status_changed',
      details: `Admin ${adminUsername} changed user ${targetUsername} status from ${oldStatus} to ${newStatus}`,
      ipAddress,
      metadata: { targetUserId, targetUsername, oldStatus, newStatus },
    }),

  apiKeyGenerated: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'api_key_generated',
      details: `User ${username} generated a new API key`,
      ipAddress,
    }),

  balanceAdded: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, amount: number, currency: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'balance_added',
      details: `Admin ${adminUsername} added ${amount} ${currency} to user ${targetUsername}`,
      ipAddress,
      metadata: { targetUserId, targetUsername, amount, currency },
    }),

  balanceDeducted: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, amount: number, currency: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'balance_deducted',
      details: `Admin ${adminUsername} deducted ${amount} ${currency} from user ${targetUsername}`,
      ipAddress,
      metadata: { targetUserId, targetUsername, amount, currency },
    }),

  userRoleChanged: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, oldRole: string, newRole: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'user_role_changed',
      details: `Admin ${adminUsername} changed user ${targetUsername} role from ${oldRole} to ${newRole}`,
      ipAddress,
      metadata: { targetUserId, targetUsername, oldRole, newRole },
    }),

  userDiscountChanged: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, oldDiscount: number, newDiscount: number, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'user_discount_changed',
      details: `Admin ${adminUsername} changed user ${targetUsername} discount from ${oldDiscount}% to ${newDiscount}%`,
      ipAddress,
      metadata: { targetUserId, targetUsername, oldDiscount, newDiscount },
    }),

  userDeleted: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'user_deleted',
      details: `Admin ${adminUsername} deleted user ${targetUsername}`,
      ipAddress,
      metadata: { targetUserId, targetUsername },
    }),

  userCreated: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'user_created',
      details: `Admin ${adminUsername} created new user ${targetUsername}`,
      ipAddress,
      metadata: { targetUserId, targetUsername },
    }),

  userEdited: (adminId: number, adminUsername: string, targetUserId: number, targetUsername: string, fields: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'user_edited',
      details: `Admin ${adminUsername} edited user ${targetUsername} fields: ${fields}`,
      ipAddress,
      metadata: { targetUserId, targetUsername, editedFields: fields },
    }),

  orderStatusChanged: (adminId: number, adminUsername: string, orderId: number, userId: number, username: string, oldStatus: string, newStatus: string, ipAddress?: string) =>
    logActivity({
      userId: adminId,
      username: adminUsername,
      action: 'order_status_changed',
      details: `Admin ${adminUsername} changed order #${orderId} status from ${oldStatus} to ${newStatus} for user ${username}`,
      ipAddress,
      metadata: { orderId, targetUserId: userId, targetUsername: username, oldStatus, newStatus },
    }),

  twoFactorEnabled: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: '2fa_enabled',
      details: `User ${username} enabled two-factor authentication`,
      ipAddress,
    }),

  twoFactorDisabled: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: '2fa_disabled',
      details: `User ${username} disabled two-factor authentication`,
      ipAddress,
    }),

  emailVerified: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'email_verified',
      details: `User ${username} verified their email address`,
      ipAddress,
    }),

  passwordReset: (userId: number, username: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'password_reset',
      details: `User ${username} reset their password`,
      ipAddress,
    }),

  failedLogin: (username: string, ipAddress?: string) =>
    logActivity({
      username,
      action: 'failed_login',
      details: `Failed login attempt for user ${username}`,
      ipAddress,
    }),

  suspiciousActivity: (userId: number, username: string, activityType: string, ipAddress?: string) =>
    logActivity({
      userId,
      username,
      action: 'suspicious_activity',
      details: `Suspicious activity detected for user ${username}: ${activityType}`,
      ipAddress,
      metadata: { activityType },
    }),
};
