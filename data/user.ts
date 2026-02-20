import { db } from '@/lib/db';

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.users.findUnique({ where: { email } });
    return user;
  } catch {
    return null;
  }
};

export const getUserByUsername = async (username: string) => {
  try {
    const user = await db.users.findUnique({ where: { username } });
    return user;
  } catch {
    return null;
  }
};

const getUserIdMapping = async (oldStringId: string): Promise<number | null> => {
  try {

    const numericId = parseInt(oldStringId);
    if (!isNaN(numericId)) {
      return numericId;
    }

    return null;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string | number) => {
  try {
    let userId: number;

    if (typeof id === 'number') {
      userId = id;
    } else {

      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        userId = numericId;
      } else {

        return null;
      }
    }

    const user = await db.users.findUnique({ where: { id: userId } });
    return user;
  } catch {
    return null;
  }
};
