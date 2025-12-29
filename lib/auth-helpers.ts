import { auth } from '@/auth';
import { getUserByEmail } from '@/data/user';

export const getCurrentUser = async () => {
  try {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    if (!session.user.id || session.user.id === null) {
      if (session.user.email) {
        const user = await getUserByEmail(session.user.email);
        if (user) {

          (session.user as any).id = user.id;
          return session;
        }
      }
      return null;
    }

    const numericId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
    if (isNaN(numericId)) {

      if (session.user.email) {
        const user = await getUserByEmail(session.user.email);
        if (user) {
          (session.user as any).id = user.id;
          return session;
        }
      }
      return null;
    }

    (session.user as any).id = numericId;
    return session;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const getCurrentUserId = async (): Promise<number | null> => {
  const session = await getCurrentUser();
  return session?.user?.id || null;
};

export const isCurrentUserAdmin = async (): Promise<boolean> => {
  const session = await getCurrentUser();
  return session?.user?.role === 'admin';
};

export const requireAdmin = async () => {
  const session = await getCurrentUser();

  if (!session?.user) {
    throw new Error('Authentication required');
  }

  if (session.user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return session;
};

export const requireAdminOrModerator = async () => {
  const session = await getCurrentUser();

  if (!session?.user) {
    throw new Error('Authentication required');
  }

  if (session.user.role !== 'admin' && session.user.role !== 'moderator') {
    throw new Error('Admin or Moderator access required');
  }

  return session;
};

export const requireAuth = async () => {
  const session = await getCurrentUser();

  if (!session?.user) {
    throw new Error('Authentication required');
  }

  return session;
};

export const canAccessUserData = async (targetUserId: number): Promise<boolean> => {
  const session = await getCurrentUser();

  if (!session?.user) {
    return false;
  }

  if (session.user.role === 'admin') {
    return true;
  }

  return session.user.id === targetUserId;
};
