import { auth } from '@/auth';
import { db as prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [
      totalServices,
      totalCategories,
      totalOrders,
      totalUsers
    ] = await Promise.all([
      prisma.services.count(),
      prisma.categories.count(),
      prisma.newOrders.count(),
      prisma.users.count()
    ]);

    const stats = {
      totalServices,
      totalCategories,
      totalOrders,
      totalUsers,
      activeConnections: 1,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error getting database stats:', error);
    return NextResponse.json(
      { error: 'Failed to get database stats' },
      { status: 500 }
    );
  }
}
