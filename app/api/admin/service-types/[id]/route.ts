import { auth } from '@/auth';
import { db } from '@/lib/db';
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
    const serviceType = await db.serviceTypes.findUnique({
      where: { id: Number(id) },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    if (!serviceType) {
      return NextResponse.json(
        {
          error: 'Service type not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...serviceType,
        serviceCount: serviceType._count.services
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

    const body = await req.json();
    const { 
      name, 
      description,
      packageType,
      requiresLink,
      requiresQuantity,
      requiresComments,
      requiresUsername,
      requiresPosts,
      requiresDelay,
      requiresMin,
      requiresMax,
      supportsDripfeed,
      supportsRefill,
      supportsCancel,
      isSubscription,
      isAutoService,
      maxQuantity,
      minQuantity,
      status
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        {
          error: 'Service type name is required',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (packageType && (packageType < 1 || packageType > 15)) {
      return NextResponse.json(
        {
          error: 'Package type must be between 1 and 15',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingType = await db.serviceTypes.findUnique({
      where: { id: Number((await params).id) }
    });

    if (!existingType) {
      return NextResponse.json(
        {
          error: 'Service type not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    const duplicateType = await db.serviceTypes.findFirst({
      where: { 
        name: name.trim(),
        id: { not: Number((await params).id) }
      }
    });

    if (duplicateType) {
      return NextResponse.json(
        {
          error: 'Service type with this name already exists',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const updatedServiceType = await db.serviceTypes.update({
      where: { id: Number((await params).id) },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        packageType: packageType || existingType.packageType,
        requiresLink: requiresLink ?? existingType.requiresLink,
        requiresQuantity: requiresQuantity ?? existingType.requiresQuantity,
        requiresComments: requiresComments ?? existingType.requiresComments,
        requiresUsername: requiresUsername ?? existingType.requiresUsername,
        requiresPosts: requiresPosts ?? existingType.requiresPosts,
        requiresDelay: requiresDelay ?? existingType.requiresDelay,
        requiresMin: requiresMin ?? existingType.requiresMin,
        requiresMax: requiresMax ?? existingType.requiresMax,
        supportsDripfeed: supportsDripfeed ?? existingType.supportsDripfeed,
        supportsRefill: supportsRefill ?? existingType.supportsRefill,
        supportsCancel: supportsCancel ?? existingType.supportsCancel,
        isSubscription: isSubscription ?? existingType.isSubscription,
        isAutoService: isAutoService ?? existingType.isAutoService,
        maxQuantity: maxQuantity ?? existingType.maxQuantity,
        minQuantity: minQuantity ?? existingType.minQuantity,
        status: status || existingType.status
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedServiceType,
      message: 'Service type updated successfully',
      error: null
    });

  } catch (error) {
    console.error('Error updating service type:', error);
    return NextResponse.json(
      {
        error: 'Failed to update service type: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
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

    const serviceType = await db.serviceTypes.findUnique({
      where: { id: Number((await params).id) },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    if (!serviceType) {
      return NextResponse.json(
        {
          error: 'Service type not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (serviceType.name === 'Default') {
      return NextResponse.json(
        {
          error: 'Cannot delete the Default service type. This is a protected system service type.',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    if (serviceType._count.services > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete service type. ${serviceType._count.services} service(s) are using this type. Please reassign or delete those services first.`,
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    await db.serviceTypes.delete({
      where: { id: Number((await params).id) }
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: 'Service type deleted successfully',
      error: null
    });

  } catch (error) {
    console.error('Error deleting service type:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete service type: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
