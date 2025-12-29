/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { serializeServices } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId } = body;
    console.log('categoryId', categoryId);
    const result = await db.services.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(
      { success: true, data: serializeServices(result), error: null },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}
