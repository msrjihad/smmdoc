import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { serviceId, userId, action } = await req.json();

    if (!serviceId || !userId) {
      return NextResponse.json(
        { error: 'Service ID and User ID are required' },
        { status: 400 }
      );
    }

    const serviceExists = await db.services.findUnique({
      where: { id: serviceId },
    });

    if (!serviceExists) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    const userExists = await db.users.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const existingFavorite = await db.favoriteServices.findUnique({
      where: {
        userId_serviceId: {
          userId: parseInt(userId),
          serviceId,
        },
      },
    });

    if (action === 'add') {
      if (existingFavorite) {
        return NextResponse.json(
          { message: 'Already in favorites', isFavorite: true },
          { status: 200 }
        );
      }

      await db.favoriteServices.create({
        data: {
          userId: parseInt(userId),
          serviceId,
        },
      });

      return NextResponse.json(
        { message: 'Added to favorites', isFavorite: true },
        { status: 200 }
      );
    } else if (action === 'remove') {
      if (!existingFavorite) {
        return NextResponse.json(
          { message: 'Not in favorites', isFavorite: false },
          { status: 200 }
        );
      }

      await db.favoriteServices.delete({
        where: {
          userId_serviceId: {
            userId: parseInt(userId),
            serviceId,
          },
        },
      });

      return NextResponse.json(
        { message: 'Removed from favorites', isFavorite: false },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error managing favorite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
