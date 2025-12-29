import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('=== Homepage Stats API Called ===');
    
    const [completedOrders, activeServices, activeUsers, totalUsers, totalOrders] = await Promise.all([
      db.newOrders.count({
        where: { status: 'completed' },
      }).catch(err => {
        console.error('Error counting completed orders:', err);
        return 0;
      }),
      db.services.count({
        where: { status: 'active', deletedAt: null },
      }).catch(err => {
        console.error('Error counting active services:', err);
        return 0;
      }),
      db.users.count({
        where: { role: 'user', status: 'active' },
      }).catch(err => {
        console.error('Error counting active users:', err);
        return 0;
      }),
      db.users.count().catch(err => {
        console.error('Error counting total users:', err);
        return 0;
      }),
      db.newOrders.count().catch(err => {
        console.error('Error counting total orders:', err);
        return 0;
      }),
    ]);

    const responseData = {
      success: true,
      data: {
        completedOrders: completedOrders ?? 0,
        activeServices: activeServices ?? 0,
        activeUsers: activeUsers ?? 0,
        totalUsers: totalUsers ?? 0,
        totalOrders: totalOrders ?? 0,
      },
    };

    console.log('=== Homepage Stats - Final Response ===');
    console.log('Raw counts from Promise.all:', {
      completedOrders,
      activeServices,
      activeUsers,
      totalUsers,
      totalOrders,
    });
    console.log('Response data:', responseData);
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('=== Error fetching homepage stats ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching homepage stats',
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          completedOrders: 0,
          activeServices: 0,
          activeUsers: 0,
          totalUsers: 0,
          totalOrders: 0,
        },
      },
      { status: 500 }
    );
  }
}