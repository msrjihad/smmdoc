export const PERMISSION_ROUTE_MAP: Record<string, string[]> = {
  all_orders: ['/admin/orders'],
  refill_requests: ['/admin/orders/refill-requests'],
  cancel_requests: ['/admin/orders/cancel-requests'],
  all_services: ['/admin/services'],
  api_sync_logs: ['/admin/services/sync-logs'],
  users: ['/admin/users'],
  user_activity_logs: ['/admin/users/logs'],
  all_transactions: ['/admin/transactions'],
  support_tickets: ['/admin/tickets'],
  contact_messages: ['/admin/contact-messages'],
  blogs: ['/admin/blogs'],
  announcements: ['/admin/announcements'],
  affiliate_users: ['/admin/affiliates'],
  withdrawals: ['/admin/affiliates/withdrawals'],
  analytics: ['/admin/analytics'],
  child_panels: ['/admin/child-panels'],
  media: ['/admin/media'],
};

export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/admin/orders': 'all_orders',
  '/admin/orders/refill-requests': 'refill_requests',
  '/admin/orders/cancel-requests': 'cancel_requests',
  '/admin/services': 'all_services',
  '/admin/services/sync-logs': 'api_sync_logs',
  '/admin/users': 'users',
  '/admin/users/logs': 'user_activity_logs',
  '/admin/transactions': 'all_transactions',
  '/admin/tickets': 'support_tickets',
  '/admin/contact-messages': 'contact_messages',
  '/admin/blogs': 'blogs',
  '/admin/announcements': 'announcements',
  '/admin/affiliates': 'affiliate_users',
  '/admin/affiliates/withdrawals': 'withdrawals',
  '/admin/analytics': 'analytics',
  '/admin/child-panels': 'child_panels',
  '/admin/media': 'media',
};

export function hasPermission(
  userRole: string,
  userPermissions: string[] | null | undefined,
  routePath: string
): boolean {
  if (userRole === 'admin' || userRole === 'super_admin') {
    return true;
  }

  if (userRole === 'moderator') {
    const normalizedPath = routePath.endsWith('/') && routePath !== '/' 
      ? routePath.slice(0, -1) 
      : routePath;
    
    if (normalizedPath === '/admin' || normalizedPath === '/') {
      return true;
    }

    const requiredPermission = ROUTE_PERMISSION_MAP[normalizedPath];
    
    if (!requiredPermission) {
      return false;
    }

    const permissionsArray = Array.isArray(userPermissions) ? userPermissions : [];
    return permissionsArray.includes(requiredPermission);
  }

  return false;
}

export function getRequiredPermission(routePath: string): string | null {
  return ROUTE_PERMISSION_MAP[routePath] || null;
}

export function filterNavItemsByPermissions(
  navItems: Array<{ href: string; [key: string]: any }>,
  userRole: string,
  userPermissions: string[] | null | undefined
): Array<{ href: string; [key: string]: any }> {
  if (userRole === 'admin' || userRole === 'super_admin') {
    return navItems;
  }

  if (userRole === 'moderator') {
    return navItems.filter((item) => {
      if (item.href === '/admin' || item.href === '/admin/') {
        return true;
      }

      const requiredPermission = ROUTE_PERMISSION_MAP[item.href];
      if (!requiredPermission) {
        return false;
      }

      return userPermissions?.includes(requiredPermission) ?? false;
    });
  }

  return [];
}

