import { NextResponse } from 'next/server';
import { handleApiError, createSuccessResponse } from '@/lib/utils/error-handler';
import { getHomepageStats } from '@/lib/homepage-stats-cache';

export async function GET() {
  try {
    const data = await getHomepageStats();
    return NextResponse.json(createSuccessResponse(data), { status: 200 });
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      {
        ...errorResponse,
        data: {
          completedOrders: 0,
          activeServices: 0,
          activeUsers: 0,
          activeAffiliateUsers: 0,
          totalUsers: 0,
          totalOrders: 0,
        },
      },
      { status: errorResponse.statusCode }
    );
  }
}