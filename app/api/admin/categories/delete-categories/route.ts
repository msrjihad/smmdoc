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
    
    console.log('Delete category request - ID parameter:', id);
    
    if (!id || id.trim() === '') {
      console.log('Category ID is missing or empty');
      return NextResponse.json(
        {
          error: 'Category ID is required',
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    const categoryId = parseInt(id);
    if (isNaN(categoryId)) {
      console.log('Category ID is not a valid number:', id);
      return NextResponse.json(
        {
          error: 'Category ID must be a valid number',
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    console.log('Parsed category ID:', categoryId);

    const category = await db.categories.findUnique({
      where: {
        id: categoryId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!category) {
      console.log('Category not found with ID:', categoryId);
      return NextResponse.json(
        {
          error: 'Category not found',
          data: null,
          success: false,
        },
        { status: 404 }
      );
    }

    console.log('Found category to delete:', category.category_name);

    const servicesCount = await db.services.count({
      where: { categoryId: categoryId }
    });

    if (servicesCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category: It has ${servicesCount} service${servicesCount !== 1 ? 's' : ''} associated with it. Please delete or move the services first.`,
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    const ordersCount = await db.newOrders.count({
      where: { categoryId: categoryId }
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category: It has ${ordersCount} order${ordersCount !== 1 ? 's' : ''} associated with it.`,
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    await db.categories.delete({
      where: {
        id: categoryId,
      },
    });

    console.log('Category deleted successfully:', category.category_name);

    return NextResponse.json(
      {
        error: null,
        message: 'Category deleted successfully',
        data: category,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete category: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
