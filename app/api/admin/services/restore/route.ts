import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Service ID is required' },
        { status: 400 }
      );
    }

    const service = await db.services.findUnique({
      where: { id: parseInt(id) }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Service not found' },
        { status: 404 }
      );
    }

    if (service.status !== 'inactive' || !service.providerId) {
      return NextResponse.json(
        { success: false, message: 'Service is not in trash' },
        { status: 400 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: service.providerId }
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, message: 'Provider not found' },
        { status: 404 }
      );
    }

    if (provider.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Cannot restore service: Provider is not active' },
        { status: 400 }
      );
    }

    await db.services.update({
      where: { id: parseInt(id) },
      data: {
        status: 'active',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Service restored successfully'
    });

  } catch (error) {
    console.error('Error restoring service:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
