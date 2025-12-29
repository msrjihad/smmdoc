import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
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
    const { action, adminNotes } = body;

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

    if (!action || !['approve', 'decline'].includes(action)) {
      return NextResponse.json(
        { 
          error: 'Valid action is required (approve or decline)',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const refillRequest = await db.refillRequests.findUnique({
      where: { id: Number(id) },
      include: {
        order: {
          select: {
            id: true,
            qty: true,
            status: true,
            categoryId: true,
            serviceId: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
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

    if (refillRequest.status !== 'pending') {
      return NextResponse.json(
        { 
          error: 'Only pending refill requests can be processed',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const updatedRequest = await db.refillRequests.update({
      where: { id: Number(id) },
      data: {
        status: action === 'approve' ? 'approved' : 'declined',
        adminNotes: adminNotes || null,
        processedBy: session.user.id,
        processedAt: new Date(),
      }
    });

    if (action === 'approve') {
      await db.newOrders.create({
        data: {
          categoryId: refillRequest.order.categoryId,
          serviceId: refillRequest.order.serviceId,
          userId: refillRequest.userId,
          link: 'REFILL_ORDER',
          qty: refillRequest.order.qty,
          price: 0,
          usdPrice: 0,
          currency: 'USD',
          avg_time: 'Instant',
          status: 'processing',
          remains: refillRequest.order.qty,
          startCount: 0,
        }
      });

      await db.refillRequests.update({
        where: { id: Number(id) },
        data: {
          status: 'completed'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        refillRequest: updatedRequest,
        message: `Refill request ${action === 'approve' ? 'approved and processed' : 'declined'} successfully`
      },
      error: null
    });

  } catch (error) {
    console.error('Error processing refill request:', error);
    return NextResponse.json(
      {
        error: 'Failed to process refill request: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
