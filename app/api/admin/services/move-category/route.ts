import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { fromCategoryId, toCategoryId } = body;

    if (!fromCategoryId || !toCategoryId) {
      return NextResponse.json(
        {
          error: 'Both fromCategoryId and toCategoryId are required',
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    const fromCatId = parseInt(fromCategoryId);
    const toCatId = parseInt(toCategoryId);

    if (isNaN(fromCatId) || isNaN(toCatId)) {
      return NextResponse.json(
        {
          error: 'Invalid category IDs provided',
          data: null,
          success: false,
        },
        { status: 400 }
      );
    }

    const [fromCategory, toCategory] = await Promise.all([
      db.categories.findUnique({ where: { id: fromCatId } }),
      db.categories.findUnique({ where: { id: toCatId } })
    ]);

    if (!fromCategory) {
      return NextResponse.json(
        {
          error: 'Source category not found',
          data: null,
          success: false,
        },
        { status: 404 }
      );
    }

    if (!toCategory) {
      return NextResponse.json(
        {
          error: 'Target category not found',
          data: null,
          success: false,
        },
        { status: 404 }
      );
    }

    const updateResult = await db.services.updateMany({
      where: { categoryId: fromCatId },
      data: { categoryId: toCatId }
    });

    return NextResponse.json(
      {
        error: null,
        message: `Successfully moved ${updateResult.count} service(s) to ${toCategory.category_name}`,
        data: { movedCount: updateResult.count },
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error moving services:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    return NextResponse.json(
      {
        error: 'Failed to move services: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
