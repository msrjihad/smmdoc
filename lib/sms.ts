
interface SMSOptions {
  to: string;
  message: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const smsTemplates = {
  paymentSuccess: (userName: string, amount: number, transactionId: string) => 
    `Dear ${userName}, your payment of ৳${amount} has been successfully processed. Transaction ID: ${transactionId}. Your account balance has been updated. Thank you! - SMM Panel`,

  paymentPending: (userName: string, amount: number, transactionId: string) => 
    `Dear ${userName}, your payment of ৳${amount} is being processed. Transaction ID: ${transactionId}. You will be notified once approved. - SMM Panel`,

  paymentCancelled: (userName: string, amount: number, transactionId: string) => 
    `Dear ${userName}, your payment of ৳${amount} has been cancelled. Transaction ID: ${transactionId}. Please contact support if needed. - SMM Panel`,

  newContactMessageAdminSMS: (userName: string, subject: string) => 
    `New contact message from ${userName}: ${subject.substring(0, 50)}... Check admin panel.`,

  adminReplyToUserSMS: (subject: string) => 
    `Response received for your message "${subject.substring(0, 40)}...". Check your email or login to view.`
};

export const sendSMS = async ({ to, message }: SMSOptions): Promise<SMSResponse> => {
  try {

    if (!to || !isValidBangladeshiPhone(to)) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    const cleanPhone = cleanPhoneNumber(to);

    console.log('SMS Service - Sending SMS:', {
      to: cleanPhone,
      message: message.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });

    const mockMessageId = `SMS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('SMS Sent Successfully:', {
      messageId: mockMessageId,
      to: cleanPhone,
      message,
      sentAt: new Date().toISOString()
    });

    return {
      success: true,
      messageId: mockMessageId
    };

  } catch (error) {
    console.error('SMS Service Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error'
    };
  }
};

export const isValidBangladeshiPhone = (phone: string): boolean => {

  const cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
    return true;
  }

  if (cleanPhone.length === 13 && cleanPhone.startsWith('880')) {
    return true;
  }

  if (cleanPhone.length === 14 && cleanPhone.startsWith('8801')) {
    return true;
  }

  return false;
};

export const cleanPhoneNumber = (phone: string): string => {

  let cleanPhone = phone.replace(/\D/g, '');

  if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
    cleanPhone = '880' + cleanPhone;
  }

  if (cleanPhone.length === 13 && cleanPhone.startsWith('880')) {
    cleanPhone = '+' + cleanPhone;
  }

  return cleanPhone;
};

export const logSMS = async (smsData: {
  userId?: string;
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
}) => {
  try {

    console.log('SMS Log:', {
      ...smsData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error logging SMS:', error);
  }
};

export const sendBulkSMS = async (recipients: Array<{ phone: string; message: string }>): Promise<SMSResponse[]> => {
  const results: SMSResponse[] = [];

  for (const recipient of recipients) {
    const result = await sendSMS({
      to: recipient.phone,
      message: recipient.message
    });
    results.push(result);

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
};
