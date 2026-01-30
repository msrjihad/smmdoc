import { db } from './db';

class ContactDB {
  private prisma = db;

  constructor() {

  }

  async getContactSettings() {
    try {
      console.log('🔍 ContactDB - Getting contact settings from database...');

      const settings = await this.prisma.contactSettings.findFirst({
        orderBy: { updatedAt: 'desc' }
      });
      console.log('🔍 ContactDB - Raw settings from database:', settings);
      return settings;
    } catch (error) {
      console.error('Error getting contact settings:', error);
      return null;
    }
  }

  async upsertContactSettings(data: {
    contactSystemEnabled: boolean;
    maxPendingContacts: string;
  }) {
    try {

      const existingSettings = await this.prisma.contactSettings.findFirst();

      if (existingSettings) {
        await this.prisma.contactSettings.update({
          where: { id: existingSettings.id },
          data: {
            contactSystemEnabled: data.contactSystemEnabled,
            maxPendingContacts: data.maxPendingContacts
          }
        });
      } else {
        await this.prisma.contactSettings.create({
          data: {
            contactSystemEnabled: data.contactSystemEnabled,
            maxPendingContacts: data.maxPendingContacts
          }
        });
      }
      return true;
    } catch (error) {
      console.error('Error upserting contact settings:', error);
      return false;
    }
  }

  async getContactCategories() {
    try {
      const categories = await this.prisma.contactCategories.findMany({
        orderBy: { name: 'asc' }
      });
      return categories;
    } catch (error) {
      console.error('Error getting contact categories:', error);
      return [];
    }
  }

  async createContactCategory(name: string) {
    try {

      let settings = await this.prisma.contactSettings.findFirst();
      if (!settings) {
        settings = await this.prisma.contactSettings.create({
          data: {
            contactSystemEnabled: true,
            maxPendingContacts: 'unlimited'
          }
        });
      }

      await this.prisma.contactCategories.create({
        data: {
          name,
          contactSettings: {
            connect: { id: settings.id }
          }
        }
      });
      return true;
    } catch (error) {
      console.error('Error creating contact category:', error);
      return false;
    }
  }

  async updateContactCategory(id: number, name: string) {
    try {
      await this.prisma.contactCategories.update({
        where: { id },
        data: { name: name.trim() }
      });
      return true;
    } catch (error) {
      console.error('Error updating contact category:', error);
      return false;
    }
  }

  async deleteContactCategory(id: number) {
    try {
      await this.prisma.contactCategories.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting contact category:', error);
      return false;
    }
  }

  async createContactMessage(data: {
    userId: number;
    subject: string;
    message: string;
    categoryId: number;
    attachments?: string;
  }) {
    try {
      await this.prisma.contactMessages.create({
        data: {
          userId: data.userId,
          subject: data.subject,
          message: data.message,
          categoryId: data.categoryId,
          attachments: data.attachments || null,
          status: 'Unread'
        }
      });
      return true;
    } catch (error) {
      console.error('Error creating contact message:', error);
      return false;
    }
  }

  async countContactMessages(filters: {
    userId?: number;
    status?: string | string[];
  }) {
    try {
      const where: any = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { in: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      const count = await this.prisma.contactMessages.count({ where });
      return count;
    } catch (error) {
      console.error('Error counting contact messages:', error);
      return 0;
    }
  }

  async getContactMessages(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {

      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      if (filters?.status && filters.status !== 'All') {
        whereClause += ' AND cm.status = ?';
        params.push(filters.status);
      }

      if (filters?.search) {
        whereClause += ' AND (cm.subject LIKE ? OR cm.message LIKE ? OR u.username LIKE ? OR u.email LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      let limitClause = '';
      if (filters?.limit) {
        const safeLimit = Math.max(1, Math.min(1000, parseInt(String(filters.limit)) || 20));
        limitClause = ` LIMIT ?`;
        params.push(safeLimit);
        if (filters?.offset) {
          const safeOffset = Math.max(0, parseInt(String(filters.offset)) || 0);
          limitClause += ` OFFSET ?`;
          params.push(safeOffset);
        }
      }

      const query = `
        SELECT
          cm.*,
          u.username,
          u.email,
          u.name,
          cc.name as categoryName,
          ru.username as repliedByUsername
        FROM contact_messages cm
        LEFT JOIN users u ON cm.userId = u.id
        LEFT JOIN contact_categories cc ON cm.categoryId = cc.id
        LEFT JOIN users ru ON cm.repliedBy = ru.id
        ${whereClause}
        ORDER BY cm.createdAt DESC
        ${limitClause}
      `;

      const messages = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

      const formattedMessages = messages.map((msg: any) => ({
        id: msg.id,
        userId: msg.userId,
        subject: msg.subject,
        message: msg.message,
        status: msg.status,
        categoryId: msg.categoryId,
        attachments: msg.attachments,
        adminReply: msg.adminReply,
        repliedAt: msg.repliedAt,
        repliedBy: msg.repliedBy,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        user: {
          username: msg.username || 'Unknown User',
          email: msg.email || 'No Email',
          name: msg.name || null
        },
        category: {
          name: msg.categoryName || 'Unknown Category'
        },
        repliedByUser: msg.repliedByUsername ? {
          username: msg.repliedByUsername
        } : null
      }));

      return formattedMessages;
    } catch (error) {
      console.error('Error getting contact messages:', error);
      return [];
    }
  }

  async getContactMessageById(id: number, includeNotes: boolean = false) {
    try {
      const query = `
        SELECT
          cm.*,
          u.username,
          u.email,
          u.name,
          u.image as userImage,
          cc.name as categoryName,
          ru.username as repliedByUsername
        FROM contact_messages cm
        LEFT JOIN users u ON cm.userId = u.id
        LEFT JOIN contact_categories cc ON cm.categoryId = cc.id
        LEFT JOIN users ru ON cm.repliedBy = ru.id
        WHERE cm.id = ?
      `;

      const messages = await this.prisma.$queryRawUnsafe(query, id) as any[];
      const message = messages[0];

      if (!message) return null;

      let notes = [];
      if (includeNotes) {
        const notesQuery = `
          SELECT
            cn.*,
            u.username as admin_username,
            u.name as admin_name
          FROM contact_notes cn
          LEFT JOIN users u ON cn.userId = u.id
          WHERE cn.messageId = ?
          ORDER BY cn.createdAt DESC
        `;
        notes = await this.prisma.$queryRawUnsafe(notesQuery, id) as any[];
      }

      const userStatsQuery = `
        SELECT 
          COUNT(*) as total_messages,
          SUM(CASE WHEN adminReply IS NULL OR adminReply = '' THEN 1 ELSE 0 END) as open_messages
        FROM contact_messages 
        WHERE userId = ?
      `;
      const userStats = await this.prisma.$queryRawUnsafe(userStatsQuery, message.userId) as any[];
      const stats = userStats[0] || { total_messages: 0, open_messages: 0 };

      return {
        id: message.id,
        userId: message.userId,
        subject: message.subject,
        message: message.message,
        status: message.status,
        categoryId: message.categoryId,
        attachments: message.attachments,
        adminReply: message.adminReply,
        repliedAt: message.repliedAt,
        repliedBy: message.repliedBy,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        notes: notes.map((note: any) => ({
          id: note.id,
          content: note.content,
          admin_username: note.admin_name || note.admin_username || 'Admin',
          created_at: note.createdAt,
          is_private: note.isPrivate
        })),
        user: {
          username: message.username || 'Unknown User',
          email: message.email || 'No Email',
          name: message.name || null,
          image: message.userImage || null,
          total_messages: Number(stats.total_messages) || 0,
          open_messages: Number(stats.open_messages) || 0
        },
        category: {
          name: message.categoryName || 'Unknown Category'
        },
        repliedByUser: message.repliedByUsername ? {
          username: message.repliedByUsername
        } : null
      };
    } catch (error) {
      console.error('Error getting contact message by id:', error);
      return null;
    }
  }

  async getContactMessageCounts() {
    try {
      const total = await this.prisma.contactMessages.count();
      const unread = await this.prisma.contactMessages.count({
        where: { status: 'Unread' }
      });
      const read = await this.prisma.contactMessages.count({
        where: { status: 'Read' }
      });
      const replied = await this.prisma.contactMessages.count({
        where: { status: 'Replied' }
      });

      return { total, unread, read, replied };
    } catch (error) {
      console.error('Error getting contact message counts:', error);
      return { total: 0, unread: 0, read: 0, replied: 0 };
    }
  }

  async updateContactMessageStatus(id: number, status: string) {
    try {
      await this.prisma.contactMessages.update({
        where: { id },
        data: { status }
      });
      return true;
    } catch (error) {
      console.error('Error updating contact message status:', error);
      return false;
    }
  }

  async replyToContactMessage(id: number, adminReply: string, repliedBy: number, attachments?: string) {
    try {

      const currentMessage = await this.prisma.contactMessages.findUnique({
        where: { id },
        select: { adminReply: true }
      });

      let replies = [];

      if (currentMessage?.adminReply) {
        try {

          replies = JSON.parse(currentMessage.adminReply);
          if (!Array.isArray(replies)) {

            replies = [{
              content: currentMessage.adminReply,
              repliedAt: new Date().toISOString(),
              repliedBy: repliedBy,
              author: 'Admin'
            }];
          }
        } catch {

          replies = [{
            content: currentMessage.adminReply,
            repliedAt: new Date().toISOString(),
            repliedBy: repliedBy,
            author: 'Admin'
          }];
        }
      }

      const adminUser = await this.prisma.users.findUnique({
        where: { id: repliedBy },
        select: { username: true, name: true }
      });

      replies.push({
        content: adminReply,
        repliedAt: new Date().toISOString(),
        repliedBy: repliedBy,
        author: adminUser?.username || adminUser?.name || 'Admin',
        attachments: attachments ? JSON.parse(attachments) : undefined
      });

      await this.prisma.contactMessages.update({
        where: { id },
        data: {
          adminReply: JSON.stringify(replies),
          repliedAt: new Date(),
          repliedBy,
          status: 'Replied'
        }
      });
      return true;
    } catch (error) {
      console.error('Error replying to contact message:', error);
      return false;
    }
  }

  async deleteContactMessage(id: number) {
    try {
      await this.prisma.contactMessages.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting contact message:', error);
      return false;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export const contactDB = new ContactDB();
