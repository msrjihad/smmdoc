import { auth } from '@/auth';
import { sendSMS, smsTemplates, logSMS } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { phone, type, amount, transaction_id } = body;
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }
    
    let smsMessage;
    
    switch (type) {
      case 'payment_success':
        smsMessage = smsTemplates.paymentSuccess(
          'Test User',
          parseFloat(amount) || 100,
          transaction_id || 'TEST-TXN-123'
        );
        break;
        
      case 'payment_pending':
        smsMessage = smsTemplates.paymentPending(
          'Test User',
          parseFloat(amount) || 100,
          transaction_id || 'TEST-TXN-123'
        );
        break;
        
      case 'payment_cancelled':
        smsMessage = smsTemplates.paymentCancelled(
          'Test User',
          parseFloat(amount) || 100,
          transaction_id || 'TEST-TXN-123'
        );
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid SMS type' },
          { status: 400 }
        );
    }
    
    smsMessage = `${smsMessage}`;
    
    const smsResult = await sendSMS({
      to: phone,
      message: smsMessage
    });
    
    await logSMS({
      userId: 'test-user-id',
      phone: phone,
      message: smsMessage,
      status: smsResult.success ? 'sent' : 'failed',
      messageId: smsResult.messageId,
      error: smsResult.error
    });
    
    if (smsResult.success) {
      console.log(`Test SMS sent successfully to ${phone}`);
      return NextResponse.json({
        success: true,
        message: `Test SMS sent successfully to ${phone}`,
        data: {
          type,
          phone,
          messageId: smsResult.messageId,
          message: smsMessage.substring(0, 50) + '...'
        }
      });
    } else {
      return NextResponse.json(
        { error: `Failed to send test SMS: ${smsResult.error}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error sending test SMS:', error);
    return NextResponse.json(
      { error: 'Failed to send test SMS', details: String(error) },
      { status: 500 }
    );
  }
}
