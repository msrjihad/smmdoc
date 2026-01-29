import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getTicketSettings } from '@/lib/utils/ticket-settings';

const updateTicketSchema = z.object({
  status: z.enum(['Open', 'in_progress', 'resolved', 'closed', 'on_hold']).optional(),
  isRead: z.boolean().optional(),
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

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
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

    const ticket = await db.supportTickets.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        repliedByUser: {
          select: {
            id: true,
            name: true,
          }
        },
        messages: {
          orderBy: {
            createdAt: 'asc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
                image: true,
              }
            }
          }
        },
        notes: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
              }
            }
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

    const [totalTickets, openTickets] = await Promise.all([
      db.supportTickets.count({
        where: { userId: ticket.userId }
      }),
      db.supportTickets.count({
        where: {
          userId: ticket.userId,
          OR: [
            { status: 'pending' },
            { status: 'Open' }
          ]
        }
      })
    ]);

    const transformedTicket = {
      ...ticket,
      id: ticket.id.toString(),
      createdAt: ticket.createdAt.toISOString(),
      lastUpdated: ticket.updatedAt.toISOString(),
      orderIds: ticket.orderIds ? JSON.parse(ticket.orderIds) : null,
      userInfo: {
        id: ticket.user?.id,
        name: ticket.user?.name,
        username: ticket.user?.username,
        email: ticket.user?.email,
        totalTickets,
        openTickets
      },
      messages: ticket.messages.map((msg: any) => ({
        id: msg.id,
        type: msg.messageType,
        author: msg.messageType === 'system' ? 'System' : msg.user.name,
        authorRole: msg.messageType === 'system' ? 'system' : (msg.isFromAdmin ? 'admin' : 'user'),
        content: msg.message,
        createdAt: msg.createdAt,
        attachments: msg.attachments ? JSON.parse(msg.attachments) : [],
        isEdited: false,
        userImage: msg.user.image,
        user: {
          ...msg.user,
          username: msg.messageType === 'system' && msg.isFromAdmin && msg.user.role === 'admin' ? msg.user.username : 
                   msg.messageType === 'system' ? 'system' : msg.user.username
        }
      })),
      notes: ticket.notes.map((note: any) => ({
        id: note.id.toString(),
        content: note.content,
        author: note.user.username || note.user.name,
        createdAt: note.createdAt.toISOString(),
        isPrivate: note.isPrivate
      }))
    };

    return NextResponse.json({
      success: true,
      ticket: transformedTicket
    });

  } catch (error) {
    console.error('Error fetching admin ticket:', error);
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

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
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

    const body = await request.json();
    const validatedData = updateTicketSchema.parse(body);

    const updateData: any = {
      lastUpdated: new Date()
    };
    
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    
    if (validatedData.isRead !== undefined) {
      updateData.isRead = validatedData.isRead;
    }
    
    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority;
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

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Error updating admin ticket:', error);
    
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
        { error: 'Admin access required' },
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
    console.error('Error deleting admin ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
