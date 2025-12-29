import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userIdParam = searchParams.get('userId');

  if (!userIdParam) {
    return NextResponse.json(
      { error: 'User ID is required.' },
      { status: 400 }
    );
  }

  const userId = parseInt(userIdParam);
  if (isNaN(userId)) {
    return NextResponse.json(
      { error: 'Invalid user ID format.' },
      { status: 400 }
    );
  }

  try {
    const favoriteServices = await db.favoriteServices.findMany({
      where: { userId },
      select: {
        serviceId: true,
      },
    });

    const favoriteServiceIds = favoriteServices.map(
      (favorite) => favorite.serviceId
    );

    return NextResponse.json({ favoriteServiceIds });
  } catch (error) {
    console.error('Error fetching favorite service IDs:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
