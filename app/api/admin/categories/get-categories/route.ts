import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await db.categories.findMany({
      orderBy: [
        {
          position: 'asc',
        },
        {
          updatedAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            services: true,
          },
        },
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
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch categories: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
