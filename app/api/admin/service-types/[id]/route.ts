import { auth } from '@/auth';
import { db } from '@/lib/db';
import { SERVICE_TYPE_CONFIGS } from '@/lib/service-types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
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
    const serviceTypeId = Number(id);
    const serviceTypeConfig = SERVICE_TYPE_CONFIGS[serviceTypeId];

    if (!serviceTypeConfig) {
      return NextResponse.json(
        {
          error: 'Service type not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    const serviceCount = await db.services.count({
      where: {
        serviceTypeId: serviceTypeId,
        deletedAt: null
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...serviceTypeConfig,
        serviceCount: serviceCount
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching service type:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch service type: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  return NextResponse.json(
    { 
      error: 'Service types are predefined and cannot be modified. Service types are configured in the codebase.',
        success: false,
        data: null 
    },
    { status: 400 }
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  return NextResponse.json(
    { 
      error: 'Service types are predefined and cannot be deleted. Service types are configured in the codebase.',
        success: false,
        data: null 
    },
    { status: 400 }
  );
}
