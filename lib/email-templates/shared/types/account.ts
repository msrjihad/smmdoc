

export interface AccountEmailData {
  userName: string;
  userEmail: string;
  oldEmail?: string;
  newEmail?: string;
  oldPassword?: boolean;
  newPassword?: boolean;
  loginTime?: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  date: string;
  userId?: string;
  verificationCode?: string;
  resetToken?: string;
  accountStatus?: string;
  suspensionReason?: string;
}
