/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { favrouteCatId } = body;
    const result = await db.services.findMany({
      where: {
        favrouteCatId: favrouteCatId,
      },
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
        favrouteCat: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(
      { success: true, data: result, error: null },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, data: null, error: error.message },
      { status: 500 }
    );
  }
}
