import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getTicketSettings } from '@/lib/utils/ticket-settings';


const readStatusSchema = z.object({
  isRead: z.boolean()
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
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

    const { id } = await params;
    const ticketId = parseInt(id);
    
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
    const { isRead } = readStatusSchema.parse(body);

    const updatedTicket = await db.supportTickets.update({
      where: { id: ticketId },
      data: {
        isRead,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Ticket marked as ${isRead ? 'read' : 'unread'}`,
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Error updating ticket read status:', error);
    
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
