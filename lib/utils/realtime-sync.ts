import { db } from '@/lib/db';

const activeConnections = new Set<{
  send: (data: any) => void;
  userId: string;
}>();

const notificationConnections = new Set<{
  send: (data: any) => void;
  userId: string;
}>();

export function addRealtimeConnection(send: (data: any) => void, userId: string) {
  const connection = { send, userId };
  activeConnections.add(connection);
  return () => {
    activeConnections.delete(connection);
  };
}

export function broadcastOrderUpdate(orderId: number, orderData: any) {
  const serializedData = {
    ...orderData,
    startCount: orderData.startCount && typeof orderData.startCount === 'bigint' ? orderData.startCount.toString() : orderData.startCount,
    remains: orderData.remains && typeof orderData.remains === 'bigint' ? orderData.remains.toString() : orderData.remains,
    qty: orderData.qty && typeof orderData.qty === 'bigint' ? orderData.qty.toString() : orderData.qty,
    minQty: orderData.minQty && typeof orderData.minQty === 'bigint' ? orderData.minQty.toString() : orderData.minQty,
    maxQty: orderData.maxQty && typeof orderData.maxQty === 'bigint' ? orderData.maxQty.toString() : orderData.maxQty,
  };

  const message = {
    type: 'order_updated',
    orderId,
    data: serializedData,
    timestamp: new Date().toISOString()
  };

  const orderUserId = orderData?.user?.id ? String(orderData.user.id) : null;

  activeConnections.forEach(({ send, userId }) => {
    try {
      if (orderUserId && userId !== 'admin' && userId !== orderUserId) {
        return;
      }
      send(message);
    } catch (error) {
      console.error('Error broadcasting to connection:', error);
    }
  });
}

export function broadcastSyncProgress(progress: {
  total: number;
  processed: number;
  synced: number;
  currentOrderId?: number;
}) {
  const message = {
    type: 'sync_progress',
    progress,
    timestamp: new Date().toISOString()
  };

  activeConnections.forEach(({ send }) => {
    try {
      send(message);
    } catch (error) {
      console.error('Error broadcasting sync progress:', error);
    }
  });
}

export function getActiveConnectionsCount() {
  return activeConnections.size;
}

export function addNotificationConnection(send: (data: any) => void, userId: string) {
  const connection = { send, userId };
  notificationConnections.add(connection);
  return () => {
    notificationConnections.delete(connection);
  };
}

export function broadcastNewNotification(userId: number, notification: {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
}) {
  const message = {
    type: 'new_notification',
    notification: {
      ...notification,
      createdAt: notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : notification.createdAt,
    },
    timestamp: new Date().toISOString(),
  };

  const userIdStr = String(userId);
  notificationConnections.forEach(({ send, userId }) => {
    try {
      if (userId === userIdStr) {
        send(message);
      }
    } catch (error) {
      console.error('Error broadcasting notification:', error);
    }
  });
}

