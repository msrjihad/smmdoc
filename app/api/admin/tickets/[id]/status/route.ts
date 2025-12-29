import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const capitalizeStatus = (status: string): string => {
  if (status === 'closed') return 'Closed';
  return status;
};

const statusUpdateSchema = z.object({
  status: z.enum(['Open', 'Answered', 'Customer Reply', 'On Hold', 'In Progress', 'Closed'])
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
    const { generateSystemMessage = true, ...statusData } = body;
    
    const { status } = statusUpdateSchema.parse(statusData);

    const updatedTicket = await db.supportTickets.update({
      where: { id: ticketId },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === 'Closed' && { isRead: true })
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

    if (status !== existingTicket.status && generateSystemMessage) {
      await db.ticketMessages.create({
        data: {
          ticketId: ticketId,
          userId: parseInt(session.user.id),
          message: `Ticket status changed from ${capitalizeStatus(existingTicket.status)} to ${capitalizeStatus(status)}`,
          messageType: 'system',
          isFromAdmin: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    
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
