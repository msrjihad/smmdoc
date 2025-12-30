import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Calculate average completion time for services based on completed orders
 * This endpoint should be called periodically (e.g., via cron job)
 * 
 * Setup:
 * - Add CRON_SECRET to your .env file for authentication
 * - Set up a cron job to call: GET /api/cron/calculate-average-time
 * - Example cron schedule: 0 */6 * * * (every 6 hours)
 * 
 * Logic (matches old project):
 * - For each active service, get the last 10 completed orders with qty = 1000
 * - Calculate time difference between createdAt and updatedAt (when status changed to completed)
 * - Average the times across all 10 orders
 * - Update service avg_time field
 * - Format: "X hours and Y minutes" or variations like "X Hours", "Y Minutes", "Not enough data"
 * 
 * Requirements:
 * - Needs at least 10 completed orders per service to calculate average
 * - If less than 10 orders, sets avg_time to "Not enough data"
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting average time calculation...');

    const services = await db.services.findMany({
      where: {
        status: 'active',
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${services.length} services to process`);

    let updatedCount = 0;
    const results = [];

    for (const service of services) {
      try {
        const completedOrders = await db.newOrders.findMany({
          where: {
            serviceId: service.id,
            status: 'completed',
            qty: BigInt(1000)
          },
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            qty: true
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 10
        });

        if (completedOrders.length < 10) {
          await db.services.update({
            where: { id: service.id },
            data: { avg_time: 'Not enough data' }
          });
          results.push({
            serviceId: service.id,
            serviceName: service.name,
            status: 'insufficient_data',
            message: 'Not enough completed orders (need at least 10)'
          });
          continue;
        }

        let totalSeconds = 0;
        let validOrders = 0;

        for (const order of completedOrders) {
          const createdAt = new Date(order.createdAt);
          const updatedAt = new Date(order.updatedAt);
          
          const diffSeconds = Math.abs((updatedAt.getTime() - createdAt.getTime()) / 1000);
          
          if (diffSeconds > 0) {
            totalSeconds += diffSeconds;
            validOrders++;
          }
        }

        if (validOrders === 0) {
          await db.services.update({
            where: { id: service.id },
            data: { avg_time: 'Not enough data' }
          });
          results.push({
            serviceId: service.id,
            serviceName: service.name,
            status: 'no_valid_data',
            message: 'No valid time data found'
          });
          continue;
        }

        const avgSeconds = totalSeconds / validOrders;
        
        const hours = Math.floor(avgSeconds / 3600);
        const minutes = Math.floor((avgSeconds % 3600) / 60);

        let formattedTime = '';
        
        if (hours === 0 && minutes === 0) {
          formattedTime = 'Not enough data';
        } else if (hours === 0) {
          formattedTime = minutes === 1 ? '1 Minute' : `${minutes} Minutes`;
        } else if (minutes === 0) {
          formattedTime = hours === 1 ? '1 Hour' : `${hours} Hours`;
        } else {
          formattedTime = `${hours} hours and ${minutes} minutes`;
        }

        await db.services.update({
          where: { id: service.id },
          data: { avg_time: formattedTime }
        });

        updatedCount++;
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          status: 'updated',
          avgTime: formattedTime,
          ordersUsed: validOrders
        });

        console.log(`Updated service ${service.id} (${service.name}): ${formattedTime}`);

      } catch (error) {
        console.error(`Error processing service ${service.id}:`, error);
        results.push({
          serviceId: service.id,
          serviceName: service.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`Average time calculation completed. Updated ${updatedCount} services.`);

    return NextResponse.json({
      success: true,
      message: `Average time calculation completed. Updated ${updatedCount} services.`,
      data: {
        totalServices: services.length,
        updatedCount,
        results
      }
    });

  } catch (error) {
    console.error('Error calculating average time:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      },
      { status: 500 }
    );
  }
}

