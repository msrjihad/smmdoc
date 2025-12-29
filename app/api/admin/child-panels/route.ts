import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      const searchTrimmed = search.trim();
      const searchConditions: any[] = [
        { domain: { contains: searchTrimmed } },
        { panelName: { contains: searchTrimmed } },
      ];

      const matchingUsers = await db.users.findMany({
        where: {
          OR: [
            { username: { contains: searchTrimmed } },
            { email: { contains: searchTrimmed } },
          ],
        },
        select: { id: true },
      });
      
      if (matchingUsers.length > 0) {
        const userIds = matchingUsers.map(u => u.id);
        searchConditions.push({ userId: { in: userIds } });
      }

      whereClause.OR = searchConditions;
    }

    const [childPanels, total] = await Promise.all([
      db.childPanels.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.childPanels.count({ where: whereClause }),
    ]);

    const userIds = [...new Set(childPanels.map(panel => panel.userId))];
    let users: Array<{
      id: number;
      username: string | null;
      email: string | null;
      name: string | null;
      createdAt: Date;
    }> = [];

    if (userIds.length > 0) {
      users = await db.users.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });
    }

    const userMap = new Map(users.map(user => [user.id, user]));

    const formattedPanels = childPanels.map((panel) => {
      const user = userMap.get(panel.userId);
      return {
        id: panel.id,
        user: {
          id: user?.id || panel.userId,
          username: user?.username || '',
          email: user?.email || '',
          name: user?.name || '',
          joinedAt: user?.createdAt?.toISOString() || new Date().toISOString(),
        },
        domain: panel.domain,
        subdomain: panel.subdomain,
        panelName: panel.panelName,
        apiKey: panel.apiKey,
        totalOrders: panel.totalOrders,
        totalRevenue: panel.totalRevenue,
        status: panel.status,
        createdAt: panel.createdAt.toISOString(),
        lastActivity: panel.lastActivity?.toISOString() || (panel.updatedAt ? panel.updatedAt.toISOString() : panel.createdAt.toISOString()),
        expiryDate: panel.expiryDate?.toISOString(),
        theme: panel.theme,
        customBranding: panel.customBranding,
        apiCallsToday: panel.apiCallsToday,
        apiCallsTotal: panel.apiCallsTotal,
        plan: panel.plan,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedPanels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching child panels:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch child panels',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

