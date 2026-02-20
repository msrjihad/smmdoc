import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const body = await request.json();
    const { category_name, hideCategory } = body;
    if (!id || !category_name) {
      return NextResponse.json({
        error: 'Category ID and name are required',
        data: null,
        success: false,
      });
    }

    let updateData: any = {
      category_name: category_name,
    };

    if (hideCategory !== undefined) {
      updateData.hideCategory = hideCategory;
    }

    await db.categories.update({
      where: {
        id: Number(id),
      },
      data: updateData,
    });
    return NextResponse.json({
      error: null,
      message: 'Category updated successfully',
      data: null,
      success: true,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to update categories' + error,
      data: null,
      success: false,
    });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        error: 'Category ID is required',
        data: null,
        success: false,
      });
    }
    const result = await db.categories.findUnique({
      where: {
        id: Number(id),
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
        error: 'Failed to fetch categories' + error,
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
