

export interface ContactMessageEmailData {
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: string;
  messageId: number;
  supportEmail?: string;
  whatsappNumber?: string;
  attachments?: Array<{
    originalName: string;
    encryptedName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}

export interface AdminReplyEmailData {
  userName: string;
  subject: string;
  adminReply: string;
  adminName: string;
  messageId: number;
  originalMessage: string;
  supportEmail?: string;
  whatsappNumber?: string;
  attachments?: Array<{
    originalName: string;
    encryptedName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }>;
}
