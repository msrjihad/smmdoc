import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string   }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Please login.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }

    const { id  } = await params;
    const body = await req.json();
    const { reason } = body;

    if (!id) {
      return NextResponse.json(
        { 
          error: 'Order ID is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const order = await db.newOrders.findUnique({
      where: { id: parseInt(id) },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            refill: true,
            refillDays: true,
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { 
          error: 'Order not found',
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { 
          error: 'You can only request refill for your own orders',
          success: false,
          data: null 
        },
        { status: 403 }
      );
    }

    if (!order.service.refill) {
      return NextResponse.json(
        { 
          error: 'This service does not support refill',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    if (!['completed', 'partial'].includes(order.status)) {
      return NextResponse.json(
        { 
          error: 'Only completed or partial orders are eligible for refill',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    // Check if 24 hours have passed since order completion
    const completionTime = new Date(order.updatedAt).getTime();
    const currentTime = new Date().getTime();
    const hoursSinceCompletion = (currentTime - completionTime) / (1000 * 60 * 60);
    
    if (hoursSinceCompletion < 24) {
      return NextResponse.json(
        { 
          error: 'The refill request will be eligible after 24 hours of order completion',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const refillDays = order.service.refillDays || 30;
    const daysDifference = Math.floor((currentTime - completionTime) / (1000 * 60 * 60 * 24));

    if (refillDays && daysDifference > refillDays) {
      return NextResponse.json(
        { 
          error: `Refill period has expired. Refill is only available for ${refillDays} days after order completion.`,
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const existingRequest = await db.refillRequests.findFirst({
      where: {
        orderId: parseInt(id),
        status: 'pending'
      }
    });

    if (existingRequest) {
      return NextResponse.json(
        { 
          error: 'A refill request for this order is already pending',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }

    const refillRequest = await db.refillRequests.create({
      data: {
        orderId: parseInt(id),
        userId: session.user.id,
        reason: reason || 'Customer requested refill due to drop in count',
        status: 'pending',
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        refillRequest,
        message: 'Refill request submitted successfully. Our team will review it within 24 hours.'
      },
      error: null
    });

  } catch (error) {
    console.error('Error creating refill request:', error);
    return NextResponse.json(
      {
        error: 'Failed to create refill request: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
