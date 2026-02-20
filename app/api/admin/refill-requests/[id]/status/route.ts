import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { 
          error: 'Refill request ID is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { 
          error: 'Status is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'refilling', 'completed', 'rejected', 'error', 'approved', 'declined'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return NextResponse.json(
        { 
          error: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const refillRequest = await db.refillRequests.findUnique({
      where: { id: parseInt(id) }
    });

    if (!refillRequest) {
      return NextResponse.json(
        { 
          error: 'Refill request not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }

    const updatedRequest = await db.refillRequests.update({
      where: { id: parseInt(id) },
      data: {
        status: status.toLowerCase(),
        processedBy: session.user.id,
        processedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        refillRequest: updatedRequest,
        message: `Refill request status updated to ${status}`
      },
      error: null
    });

  } catch (error) {
    console.error('Error updating refill request status:', error);
    return NextResponse.json(
      {
        error: 'Failed to update refill request status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

