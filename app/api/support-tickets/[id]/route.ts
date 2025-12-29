import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getTicketSettings } from '@/lib/utils/ticket-settings';

const capitalizeStatus = (status: string): string => {
  if (status === 'closed') return 'Closed';
  return status;
};

const updateTicketSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'resolved', 'closed']).optional(),
  adminReply: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
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

    const ticketSettings = await getTicketSettings();
    if (!ticketSettings.ticketSystemEnabled) {
      return NextResponse.json(
        { error: 'Ticket system is currently disabled' },
        { status: 403 }
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

    const whereClause: any = { id: ticketId };
    
    if (user?.role !== 'admin') {
      whereClause.userId = parseInt(session.user.id);
    }

    const ticket = await db.supportTickets.findUnique({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        repliedByUser: {
          select: {
            id: true,
            name: true,
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
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
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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

    let messages = ticket.messages.map((msg: any) => {
      let authorName;
      if (msg.messageType === 'system') {
        authorName = 'System';
      } else if (msg.isFromAdmin) {
        authorName = 'Support Admin';
      } else {
        authorName = msg.user.name || msg.user.email;
      }
      
      return {
        id: msg.id.toString(),
        type: msg.messageType,
        author: authorName,
        authorRole: msg.isFromAdmin ? 'admin' : 'user',
        content: msg.message,
        createdAt: msg.createdAt.toISOString(),
        attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
        userImage: msg.isFromAdmin ? null : msg.user.image
      };
    });

    if (messages.length === 0 && ticket.message) {
      messages = [{
        id: 'initial',
        type: 'customer',
        author: ticket.user.name || ticket.user.email,
        authorRole: 'user',
        content: ticket.message,
        createdAt: ticket.createdAt.toISOString(),
        attachments: ticket.attachments ? JSON.parse(ticket.attachments) : [],
        userImage: ticket.user.image
      }];
    }

    const transformedTicket = {
      id: ticket.id.toString(),
      subject: ticket.subject,
      createdAt: ticket.createdAt.toISOString(),
      lastUpdated: ticket.updatedAt.toISOString(),
      status: ticket.status,
      ticketType: ticket.ticketType,
      aiSubcategory: ticket.aiSubcategory,
      systemMessage: ticket.systemMessage,
      orderIds: ticket.orderIds ? JSON.parse(ticket.orderIds) : [],
      messages: messages,
      notes: ticket.notes.map((note: any) => {
        let authorName;
       if (note.user.role === 'admin') {
         authorName = 'Support Admin';
       } else {
         authorName = note.user.name || note.user.email;
       }
        
        return {
          id: note.id.toString(),
          content: note.content,
          author: authorName,
          createdAt: note.createdAt.toISOString(),
          isPrivate: note.isPrivate
        };
      }),
      user: ticket.user
    };

    return NextResponse.json(transformedTicket);

  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const ticketSystemEnabled = true;

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

    const existingTicket = await db.supportTickets.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true, status: true }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    const isAdmin = user?.role === 'admin';
    const isOwner = existingTicket.userId === parseInt(session.user.id);

    const body = await request.json();
    const { generateSystemMessage = true, ...validatedData } = body;
    
    const parsedData = updateTicketSchema.parse(validatedData);

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    if (!isAdmin && isOwner) {
      if (parsedData.status && parsedData.status !== 'closed') {
        return NextResponse.json(
          { error: 'Users can only close their own tickets' },
          { status: 403 }
        );
      }
      if (parsedData.adminReply || parsedData.priority) {
        return NextResponse.json(
          { error: 'Only admins can update admin reply or priority' },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    
    if (parsedData.status) {
      updateData.status = parsedData.status;
    }
    
    if (parsedData.priority) {
      updateData.priority = parsedData.priority;
    }
    
    if (parsedData.adminReply) {
      updateData.adminReply = parsedData.adminReply;
      updateData.repliedAt = new Date();
      updateData.repliedBy = parseInt(session.user.id);
    }

    const updatedTicket = await db.supportTickets.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        repliedByUser: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (parsedData.status && existingTicket && parsedData.status !== existingTicket.status && generateSystemMessage) {
      await db.ticketMessages.create({
        data: {
          ticketId: ticketId,
          userId: parseInt(session.user.id),
          message: `Ticket status changed from ${capitalizeStatus(existingTicket.status)} to ${capitalizeStatus(parsedData.status)}`,
          messageType: 'system',
          isFromAdmin: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Error updating support ticket:', error);
    
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

export async function DELETE(
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

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can delete tickets' },
        { status: 403 }
      );
    }

    const ticketSystemEnabled = true;

    const resolvedParams = await params;
    const ticketId = parseInt(resolvedParams.id);
    
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    const existingTicket = await db.supportTickets.findUnique({
      where: { id: ticketId }
    });

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    await db.supportTickets.delete({
      where: { id: ticketId }
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
