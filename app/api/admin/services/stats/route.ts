/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const totalServices = await db.services.count();
    
    const activeServices = await db.services.count({
      where: { status: 'active' }
    });
    
    const inactiveServices = await db.services.count({
      where: { status: 'inactive' }
    });
    
    const popularServices = await db.services.count({
      where: {
        newOrders: {
          some: {}
        }
      }
    });
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyAdded = await db.services.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    return NextResponse.json(
      { 
        success: true, 
        data: {
          totalServices,
          activeServices,
          inactiveServices,
          popularServices,
          recentlyAdded
        }
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching service stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        data: {
          totalServices: 0,
          activeServices: 0,
          inactiveServices: 0,
          popularServices: 0,
          recentlyAdded: 0
        }
      },
      { status: 500 }
    );
  }
} 
