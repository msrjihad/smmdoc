/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireAdminOrModerator } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdminOrModerator();

    console.log(`Admin users API accessed by: ${session.user.email}`);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const role = searchParams.get('role') || 'user';

    const whereClause: any = {
      status: { not: 'deleted' }
    };

    if (role && role !== 'all') {
      if (role.includes(',')) {
        const roles = role.split(',').map((r: string) => r.trim());
        const validRoles = roles.filter((r: string) => ['user', 'admin', 'moderator'].includes(r)) as ('user' | 'admin' | 'moderator')[];
        if (validRoles.length > 0) {
          whereClause.role = { in: validRoles };
        }
      } else {
        if (['user', 'admin', 'moderator'].includes(role)) {
          whereClause.role = role as 'user' | 'admin' | 'moderator';
        }
      }
    }

    if (status && status !== 'all') {
      if (status === 'deleted') {
        whereClause.status = 'deleted';
      } else if (status === 'pending') {
        whereClause.emailVerified = null;
        whereClause.status = { not: 'deleted' };
      } else {
        whereClause.status = { not: 'deleted', equals: status };
      }
    }

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { id: { contains: search } },
      ];
    }

    const total = await db.users.count({ where: whereClause });

    const users = await db.users.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        balance: true,
        total_spent: true,
        total_deposit: true,
        currency: true,
        dollarRate: true,
        role: true,
        status: true,
        suspendedUntil: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        servicesDiscount: true,
        specialPricing: true,
        permissions: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const usersWithOrderCounts = await Promise.all(
      users.map(async (user) => {
        const orderCount = await db.newOrders.count({
          where: { userId: user.id }
        });
        
        let parsedPermissions: string[] | null = null;
        if (user.permissions) {
          if (Array.isArray(user.permissions)) {
            parsedPermissions = user.permissions.filter((p): p is string => typeof p === 'string');
          } else if (typeof user.permissions === 'string') {
            try {
              const parsed = JSON.parse(user.permissions);
              if (Array.isArray(parsed)) {
                parsedPermissions = parsed.filter((p): p is string => typeof p === 'string');
              } else {
                parsedPermissions = null;
              }
            } catch {
              parsedPermissions = null;
            }
          } else {
            parsedPermissions = null;
          }
        }
        
        return {
          ...user,
          permissions: parsedPermissions,
          totalOrders: orderCount,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    };

    return NextResponse.json({
      success: true,
      data: usersWithOrderCounts,
      pagination,
      error: null
    });

  } catch (error: any) {
    console.error('Error in admin users API:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    if (error.message === 'Admin access required') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Admin access required'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch users'
      },
      { status: 500 }
    );
  }
}
