

export interface SupportTicketEmailData {
  userName: string;
  userEmail: string;
  ticketId: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  date: string;
  userId?: string;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  adminResponse?: string;
  supportEmail?: string;
  whatsappNumber?: string;
}
