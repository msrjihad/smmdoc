

export interface AnnouncementEmailData {
  userName: string;
  userEmail: string;
  announcementTitle: string;
  announcementContent: string;
  announcementType: 'general' | 'maintenance' | 'feature' | 'promotion' | 'security' | 'policy';
  date: string;
  actionUrl?: string;
  actionText?: string;
  expiryDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}
