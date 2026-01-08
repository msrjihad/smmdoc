import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const replySchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  attachments: z.string().optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const ticketId = parseInt(resolvedParams.id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true }
    });

    const ticket = await db.supportTickets.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const isAdmin = user?.role === 'admin';
    const isOwner = ticket.userId === parseInt(session.user.id);

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot reply to closed ticket' },
        { status: 400 }
      );
    }

    let message: string;
    let attachments: string | undefined;

    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = formData.get('message') as string;
      attachments = formData.get('attachments') as string;
    } else {
      const body = await request.json();
      const validatedData = replySchema.parse(body);
      message = validatedData.message;
      attachments = validatedData.attachments;
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const reply = await db.ticketMessages.create({
      data: {
        ticketId: ticketId,
        userId: parseInt(session.user.id),
        message: message.trim(),
        messageType: isAdmin ? 'staff' : 'customer',
        isFromAdmin: isAdmin,
        attachments: attachments || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        }
      }
    });

    const newStatus = isAdmin ? 'Answered' : 'Customer Reply';
    await db.supportTickets.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        repliedAt: new Date(),
        repliedBy: parseInt(session.user.id)
      }
    });

    if (!isAdmin) {
      try {
        const { sendAdminSupportTicketReplyNotification } = await import('@/lib/notifications/admin-notifications');
        const user = await db.users.findUnique({
          where: { id: parseInt(session.user.id) },
          select: { username: true, name: true }
        });
        await sendAdminSupportTicketReplyNotification(
          ticketId,
          user?.username || user?.name || 'User'
        );
      } catch (notificationError) {
        console.error('Error sending admin support ticket reply notification:', notificationError);
      }
    }

    if (isAdmin && ticket?.user?.id) {
      try {
        const { sendSupportTicketRepliedNotification } = await import('@/lib/notifications/user-notifications');
        await sendSupportTicketRepliedNotification(
          ticket.user.id,
          ticketId
        );
      } catch (notificationError) {
        console.error('Error sending user support ticket replied notification:', notificationError);
      }
    }

    const updatedTicket = await db.supportTickets.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!updatedTicket) {
      return NextResponse.json(
        { error: 'Failed to fetch updated ticket' },
        { status: 500 }
      );
    }

    const ticketWithNotes = await db.supportTickets.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            createdAt: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        notes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!ticketWithNotes) {
      return NextResponse.json(
        { error: 'Failed to fetch complete ticket data' },
        { status: 500 }
      );
    }

    const totalTickets = await db.supportTickets.count({
      where: { userId: ticketWithNotes.userId }
    });

    const openTickets = await db.supportTickets.count({
      where: {
        userId: ticketWithNotes.userId,
        status: { not: 'closed' }
      }
    });

    const transformedTicket = {
      id: ticketWithNotes.id.toString(),
      userId: ticketWithNotes.userId.toString(),
      username: ticketWithNotes.user?.username || 'N/A',
      userEmail: ticketWithNotes.user?.email || 'N/A',
      subject: ticketWithNotes.subject,
      createdAt: ticketWithNotes.createdAt.toISOString(),
      lastUpdated: ticketWithNotes.updatedAt.toISOString(),
      status: ticketWithNotes.status,
      isRead: ticketWithNotes.isRead,
      timeSpent: 0,
      ticketType: ticketWithNotes.ticketType,
      aiSubcategory: ticketWithNotes.aiSubcategory,
      systemMessage: ticketWithNotes.systemMessage,
      orderIds: ticketWithNotes.orderIds ? JSON.parse(ticketWithNotes.orderIds) : [],
      userInfo: {
        fullName: ticketWithNotes.user?.name || 'N/A',
        username: ticketWithNotes.user?.username,
        email: ticketWithNotes.user?.email || 'N/A',
        phone: 'N/A',
        company: 'N/A',
        address: 'N/A',
        registeredAt: ticketWithNotes.user?.createdAt?.toISOString() || 'N/A',
        totalTickets,
        openTickets
      },
      messages: ticketWithNotes.messages.map(msg => {
        let authorName;
        if (msg.messageType === 'system') {
           authorName = 'System';
         } else if (msg.isFromAdmin || msg.user?.role === 'admin') {
           authorName = 'Support Admin';
         } else {
           authorName = msg.user?.name || 'Unknown';
         }
        
        return {
          id: msg.id.toString(),
          type: msg.messageType === 'staff' ? 'staff' : msg.messageType === 'system' ? 'system' : 'customer',
          author: authorName,
          authorRole: msg.user?.role,
          content: msg.message,
          createdAt: msg.createdAt.toISOString(),
          userImage: (msg.isFromAdmin || msg.user?.role === 'admin') ? null : msg.user?.image,
          attachments: msg.attachments ? JSON.parse(msg.attachments) : []
        };
      }),
      notes: ticketWithNotes.notes.map(note => {
        let authorName;
         if (note.user.role === 'admin') {
           authorName = 'Support Admin';
         } else {
           authorName = note.user.username || note.user.name || 'Unknown';
         }
        
        return {
          id: note.id.toString(),
          content: note.content,
          author: authorName,
          createdAt: note.createdAt.toISOString(),
          isPrivate: note.isPrivate
        };
      })
    };

    return NextResponse.json(transformedTicket);

  } catch (error) {
    console.error('Error adding reply:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
