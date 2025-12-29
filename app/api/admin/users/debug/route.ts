import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const users = await db.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
      },
      take: 20,
    });
    
    return NextResponse.json({
      total: users.length,
      users,
    });
    
  } catch (error) {
    console.error('Error fetching users for debug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
