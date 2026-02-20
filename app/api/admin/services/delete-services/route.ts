import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          data: null,
          success: false,
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          error: 'Service ID is required',
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    const existingService = await db.services.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true }
    });

    if (!existingService) {
      return NextResponse.json(
        {
          error: 'Service not found',
          data: null,
          success: false,
        },
        { status: 404 }
      );
    }

    const ordersCount = await db.newOrders.count({
      where: { serviceId: Number(id) }
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete service: It has ${ordersCount} order${ordersCount !== 1 ? 's' : ''} associated with it.`,
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    await db.services.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json(
      {
        error: null,
        message: 'Service deleted successfully',
        data: null,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete service: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
