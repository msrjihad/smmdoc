import { auth } from '@/auth';
import { contactDB } from '@/lib/contact-db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'All';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    console.log('🔍 Fetching contact messages with filters:', { status, search, limit, offset });

    const messages = await contactDB.getContactMessages({
      status: status !== 'All' ? status : undefined,
      search: search || undefined,
      limit,
      offset
    });

    console.log('📋 Found messages:', messages.length);

    const totalCount = await contactDB.countContactMessages({});
    const unreadCount = await contactDB.countContactMessages({ status: ['Unread'] });
    const readCount = await contactDB.countContactMessages({ status: ['Read'] });
    const repliedCount = await contactDB.countContactMessages({ status: ['Replied'] });

    const counts = {
      total: totalCount,
      unread: unreadCount,
      read: readCount,
      replied: repliedCount
    };
    console.log('📊 Message counts:', counts);

    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id.toString(),
      username: msg.user?.username || 'No Username',
      user: {
        username: msg.user?.username || 'No Username',
        email: msg.user?.email || 'No Email'
      },
      email: msg.user?.email || 'No Email',
      category: msg.category?.name || 'Unknown Category',
      subject: msg.subject,
      message: msg.message,
      status: msg.status,
      attachments: msg.attachments ? JSON.parse(msg.attachments) : null,
      adminReply: msg.adminReply,
      repliedAt: msg.repliedAt,
      repliedBy: msg.repliedByUser?.username || null,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      messageCounts: counts,
      pagination: {
        page,
        limit,
        total: counts.total,
        totalPages: Math.ceil(counts.total / limit),
        hasNext: page < Math.ceil(counts.total / limit),
        hasPrev: page > 1
      },
      fallbackMode: false
    });

  } catch (error) {
    console.error('Error getting contact messages:', error);
    
    const sampleMessages = [
      {
        id: '001',
        username: 'socialmarketer_john',
        user: {
          username: 'socialmarketer_john',
          email: 'john.doe@agency.com'
        },
        email: 'john.doe@agency.com',
        category: 'Instagram Services',
        subject: 'Instagram followers delivery time inquiry',
        message: 'Hi, I placed an order for 10K Instagram followers. How long does delivery usually take?',
        status: 'Unread',
        attachments: null,
        adminReply: null,
        repliedAt: null,
        repliedBy: null,
        createdAt: '2024-06-28T10:30:00Z',
        updatedAt: '2024-06-28T10:30:00Z'
      },
      {
        id: '002',
        username: 'sarah_influencer',
        user: {
          username: 'sarah_influencer',
          email: 'sarah.smith@gmail.com'
        },
        email: 'sarah.smith@gmail.com',
        category: 'YouTube Services',
        subject: 'YouTube subscribers quality question',
        message: 'I want to buy YouTube subscribers but need high-quality, active accounts. Do you provide this?',
        status: 'Read',
        attachments: null,
        adminReply: null,
        repliedAt: null,
        repliedBy: null,
        createdAt: '2024-06-27T15:45:00Z',
        updatedAt: '2024-06-27T15:45:00Z'
      },
      {
        id: '003',
        username: 'mike_business',
        user: {
          username: 'mike_business',
          email: 'mike.johnson@company.com'
        },
        email: 'mike.johnson@company.com',
        category: 'Bulk Orders',
        subject: 'Enterprise package for multiple accounts',
        message: 'We need SMM services for 50+ business accounts. Do you offer enterprise packages with discounts?',
        status: 'Replied',
        attachments: null,
        adminReply: 'Thank you for your inquiry. We do offer enterprise packages with volume discounts.',
        repliedAt: '2024-06-26T09:00:00Z',
        repliedBy: 'admin',
        createdAt: '2024-06-26T08:20:00Z',
        updatedAt: '2024-06-26T09:00:00Z'
      }
    ];

    const sampleCounts = {
      total: 3,
      unread: 1,
      read: 1,
      replied: 1
    };

    return NextResponse.json({
      success: true,
      messages: sampleMessages,
      messageCounts: sampleCounts,
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      },
      fallbackMode: true,
      warning: 'Database connection unavailable. Showing sample data.'
    });
  }
}
