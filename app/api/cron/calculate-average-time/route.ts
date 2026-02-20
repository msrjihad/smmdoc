import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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

    const serviceIds = services.map((s) => s.id);
    if (serviceIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active services to process',
        data: { totalServices: 0, updatedCount: 0, results: [] }
      });
    }

    type OrderRow = { id: number; serviceId: number; createdAt: Date; updatedAt: Date };
    const last10PerService = await db.$queryRaw<OrderRow[]>`
      SELECT id, "serviceId", "createdAt", "updatedAt"
      FROM (
        SELECT id, "serviceId", "createdAt", "updatedAt",
               ROW_NUMBER() OVER (PARTITION BY "serviceId" ORDER BY "updatedAt" DESC) AS rn
        FROM new_orders
        WHERE "serviceId" = ANY(${serviceIds})
          AND status = 'completed'
          AND qty = 1000
      ) sub
      WHERE rn <= 10
    `;

    const ordersByService = new Map<number, OrderRow[]>();
    for (const row of last10PerService) {
      const list = ordersByService.get(row.serviceId) ?? [];
      list.push(row);
      ordersByService.set(row.serviceId, list);
    }
    for (const [sid, list] of ordersByService) {
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    let updatedCount = 0;
    const results = [];

    for (const service of services) {
      try {
        const completedOrders = ordersByService.get(service.id) ?? [];

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

