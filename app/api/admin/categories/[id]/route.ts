import { auth } from '@/auth';
import { currentUser } from '@/lib/actions/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    const { id } = await params;
    const body = await request.json();
    const { category_name, position, hideCategory } = body;

    if (!user) {
      return NextResponse.json({
        error: 'Unauthorized access',
        data: null,
        success: false,
      }, { status: 401 });
    }

    if (!id || !category_name) {
      return NextResponse.json({
        error: 'Category ID and name are required',
        data: null,
        success: false,
      }, { status: 400 });
    }

    if (position === 'top') {
      await db.categories.updateMany({
        where: {
          position: 'top',
          userId: user.id,
          id: {
            not: parseInt(id),
          },
        },
        data: {
          position: 'bottom',
        },
      });
    }

    const updateData: any = {
      category_name: category_name,
      updatedAt: new Date(),
    };

    if (position) {
      updateData.position = position as any;
    }

    if (hideCategory !== undefined) {
      updateData.hideCategory = hideCategory;
    }

    const updatedCategory = await db.categories.update({
      where: {
        id: parseInt(id),
        userId: user.id,
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      error: null,
      message: 'Category updated successfully',
      data: updatedCategory,
      success: true,
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({
      error: 'Failed to update category: ' + (error instanceof Error ? error.message : 'Unknown error'),
      data: null,
      success: false,
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({
        error: 'Category ID is required',
        data: null,
        success: false,
      });
    }
    
    const result = await db.categories.findUnique({
      where: {
        id: parseInt(id),
      },
    });
    
    return NextResponse.json(
      {
        error: null,
        data: result,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch category: ' + error,
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
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

    if (!id) {
      return NextResponse.json({
        error: 'Category ID is required',
        data: null,
        success: false,
      }, { status: 400 });
    }

    const categoryId = parseInt(id);

    if (isNaN(categoryId)) {
      return NextResponse.json({
        error: 'Invalid category ID provided',
        data: null,
        success: false,
      }, { status: 400 });
    }

    const category = await db.categories.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json({
        error: 'Category not found',
        success: false,
        data: null
      }, { status: 404 });
    }

    let deleteRefillRequestsResult = { count: 0 };
    try {
      deleteRefillRequestsResult = await db.refillRequests.deleteMany({
        where: {
          order: {
            categoryId: categoryId
          }
        }
      });
    } catch (error) {
      console.log('RefillRequest table not found, skipping...');
    }

    console.log(`Deleted ${deleteRefillRequestsResult.count} refill requests in category ${categoryId}`);

    let deleteCancelRequestsResult = { count: 0 };
    try {
      deleteCancelRequestsResult = await db.cancelRequests.deleteMany({
        where: {
          order: {
            categoryId: categoryId
          }
        }
      });
    } catch (error) {
      console.log('CancelRequest table not found, skipping...');
    }

    console.log(`Deleted ${deleteCancelRequestsResult.count} cancel requests in category ${categoryId}`);

    const deleteOrdersResult = await db.newOrders.deleteMany({
      where: { categoryId: categoryId }
    });

    console.log(`Deleted ${deleteOrdersResult.count} orders in category ${categoryId}`);

    const deleteServicesResult = await db.services.deleteMany({
      where: { categoryId: categoryId }
    });

    console.log(`Deleted ${deleteServicesResult.count} services in category ${categoryId}`);

    await db.categories.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({
      success: true,
      data: null,
      message: `Category "${category.category_name}" deleted successfully along with ${deleteServicesResult.count} service(s), ${deleteOrdersResult.count} order(s), ${deleteRefillRequestsResult.count} refill request(s), and ${deleteCancelRequestsResult.count} cancel request(s)`,
      error: null
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({
      error: 'Failed to delete category: ' + (error instanceof Error ? error.message : 'Unknown error'),
      success: false,
      data: null
    }, { status: 500 });
  }
}
