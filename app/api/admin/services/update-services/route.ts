import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { serializeService } from '@/lib/utils';

function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-remote-addr');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }
  return 'unknown';
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          data: null,
          success: false,
        },
        { status: 401 }
      );
    }

    const moduleSettings = await db.moduleSettings.findFirst();
    const serviceUpdateLogsEnabled = moduleSettings?.serviceUpdateLogsEnabled ?? true;

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const body = await request.json();
    if (!body) {
      return NextResponse.json({
        error: 'Service data is required',
        data: null,
        success: false,
      });
    }
    const {
      categoryId,
      name,
      description,
      rate,
      min_order,
      max_order,
      perqty,
      updateText,
      serviceTypeId,
      refill,
      cancel,
      refillDays,
      refillDisplay,
      serviceSpeed,
      mode,
      orderLink,
      packageType,
      providerServiceId,
      dripfeedEnabled,
      subscriptionMin,
      subscriptionMax,
      subscriptionDelay,
      autoPostsMin,
      autoPostsMax,
      autoDelay,
      customComments,
      isSecret,
    } = body;
    if (!id) {
      return NextResponse.json({
        error: 'Service ID is required',
        data: null,
        success: false,
      });
    }

    const currentService = await db.services.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: { select: { category_name: true } },
        serviceType: { select: { name: true } }
      }
    });
    
    console.log(`[Update Service] Service ID: ${id}`);
    console.log(`[Update Service] Current serviceTypeId from DB: ${currentService?.serviceTypeId} (type: ${typeof currentService?.serviceTypeId})`);
    console.log(`[Update Service] Request body serviceTypeId: ${body.serviceTypeId} (type: ${typeof body.serviceTypeId})`);
    console.log(`[Update Service] Full request body keys:`, Object.keys(body));

    if (!currentService) {
      return NextResponse.json({
        error: 'Service not found',
        data: null,
        success: false,
      });
    }
    const toBool = (value: unknown): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    const toNumber = (value: unknown, defaultValue: number = 0): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const num = Number(value);
        return isNaN(num) ? defaultValue : num;
      }
      return defaultValue;
    };

    const toInt = (value: unknown): number | undefined => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const num = parseInt(value);
        return isNaN(num) ? undefined : num;
      }
      return undefined;
    };

    const toRefillValue = (value: unknown): number | null => {
      if (value === null || value === undefined || value === '') {
        return null; // Lifetime
      }
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && value.trim() !== '') {
        const num = Number(value.trim());
        return isNaN(num) ? null : num;
      }
      return null; // Lifetime
    };

    const convertBigIntToString = (value: any): any => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    };

    const updateData: any = {};

    if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
      updateData.categoryId = toInt(categoryId);
    }
    if (name !== undefined && name !== null && name !== '') {
      updateData.name = name;
    }
    if (description !== undefined && description !== null && description !== '') {
      updateData.description = description;
    }
    if (rate !== undefined && rate !== null && rate !== '') {
      updateData.rate = toNumber(rate, 0);
    }
    if (min_order !== undefined && min_order !== null && min_order !== '') {
      updateData.min_order = toNumber(min_order, 0);
    }
    if (max_order !== undefined && max_order !== null && max_order !== '') {
      updateData.max_order = toNumber(max_order, 0);
    }
    if (perqty !== undefined && perqty !== null && perqty !== '') {
      updateData.perqty = toNumber(perqty, 1000);
    }
    // avg_time is now calculated automatically by cron job, not manually editable
    if (updateText !== undefined && updateText !== null && updateText !== '') {
      updateData.updateText = updateText;
    }
    if (serviceTypeId !== undefined && serviceTypeId !== null && serviceTypeId !== '') {
      const serviceTypeIdInt = toInt(serviceTypeId);
      if (serviceTypeIdInt !== undefined && serviceTypeIdInt !== null) {
        const currentServiceTypeId = currentService.serviceTypeId;
        
        const currentIdStr = currentServiceTypeId !== null && currentServiceTypeId !== undefined 
          ? String(currentServiceTypeId) 
          : '';
        const newIdStr = String(serviceTypeIdInt);
        
        let currentIdNum: number | null = null;
        if (currentIdStr !== '') {
          const num = Number(currentServiceTypeId);
          currentIdNum = isNaN(num) ? null : num;
        }
        const newIdNum = Number(serviceTypeIdInt);
        
        console.log(`[ServiceTypeId Debug] Service ID: ${id}`);
        console.log(`[ServiceTypeId Debug] Current from DB: ${currentServiceTypeId} (type: ${typeof currentServiceTypeId})`);
        console.log(`[ServiceTypeId Debug] Submitted: ${serviceTypeId} (type: ${typeof serviceTypeId})`);
        console.log(`[ServiceTypeId Debug] Current as string: "${currentIdStr}"`);
        console.log(`[ServiceTypeId Debug] New as string: "${newIdStr}"`);
        console.log(`[ServiceTypeId Debug] Current as number: ${currentIdNum}`);
        console.log(`[ServiceTypeId Debug] New as number: ${newIdNum}`);
        console.log(`[ServiceTypeId Debug] String match: ${currentIdStr === newIdStr}`);
        console.log(`[ServiceTypeId Debug] Number match: ${currentIdNum !== null && !isNaN(newIdNum) && currentIdNum === newIdNum}`);
        
        const valuesMatch = (currentIdStr === newIdStr) || 
                           (currentIdNum !== null && !isNaN(newIdNum) && currentIdNum === newIdNum);
        
        if (valuesMatch) {
          const serviceTypeExists = await db.serviceTypes.findUnique({
            where: { id: serviceTypeIdInt }
          });
          
          if (serviceTypeExists) {
            console.log(`[ServiceTypeId] ✅ Values match (${currentIdStr}/${currentIdNum}) and service type exists - skipping update`);
          } else {
            console.log(`[ServiceTypeId] ✅ Values match (${currentIdStr}/${currentIdNum}) but service type doesn't exist - skipping update (not changing invalid ID)`);
          }
        } else {
          console.log(`[ServiceTypeId] ⚠️ Values differ ("${currentIdStr}"/${currentIdNum} !== "${newIdStr}"/${newIdNum}) - validating new service type...`);
          const serviceTypeExists = await db.serviceTypes.findUnique({
            where: { id: serviceTypeIdInt }
          });

          if (serviceTypeExists) {
            updateData.serviceTypeId = serviceTypeIdInt;
            console.log(`[ServiceTypeId] ✅ Service type ${serviceTypeIdInt} exists, will update`);
          } else {
            console.log(`[ServiceTypeId] ❌ Service type ${serviceTypeIdInt} does not exist, returning error`);
            return NextResponse.json({
              error: `Service type with ID ${serviceTypeIdInt} does not exist. Please select a valid service type from the dropdown.`,
              data: null,
              success: false,
            }, { status: 400 });
          }
        }
      }
    }
    if (refill !== undefined && refill !== null) {
      updateData.refill = toBool(refill);
    }
    if (cancel !== undefined && cancel !== null) {
      updateData.cancel = toBool(cancel);
    }
    if (refillDays !== undefined) {
      updateData.refillDays = toRefillValue(refillDays);
    }
    if (refillDisplay !== undefined) {
      updateData.refillDisplay = toRefillValue(refillDisplay);
    }
    if (serviceSpeed !== undefined && serviceSpeed !== null && serviceSpeed !== '') {
      updateData.serviceSpeed = serviceSpeed;
    }
    if (mode !== undefined && mode !== null && mode !== '') {
      updateData.mode = mode;
    }
    if (orderLink !== undefined && orderLink !== null && orderLink !== '') {
      updateData.orderLink = orderLink;
    }

    if (packageType !== undefined && packageType !== null && packageType !== '') {
      updateData.packageType = toNumber(packageType, 1);
    }
    if (providerServiceId !== undefined && providerServiceId !== null && providerServiceId !== '') {
      updateData.providerServiceId = providerServiceId;
    }
    if (dripfeedEnabled !== undefined && dripfeedEnabled !== null) {
      updateData.dripfeedEnabled = toBool(dripfeedEnabled);
    }
    if (subscriptionMin !== undefined && subscriptionMin !== null && subscriptionMin !== '') {
      updateData.subscriptionMin = toInt(subscriptionMin);
    }
    if (subscriptionMax !== undefined && subscriptionMax !== null && subscriptionMax !== '') {
      updateData.subscriptionMax = toInt(subscriptionMax);
    }
    if (subscriptionDelay !== undefined && subscriptionDelay !== null && subscriptionDelay !== '') {
      updateData.subscriptionDelay = toInt(subscriptionDelay);
    }
    if (autoPostsMin !== undefined && autoPostsMin !== null && autoPostsMin !== '') {
      updateData.autoPostsMin = toInt(autoPostsMin);
    }
    if (autoPostsMax !== undefined && autoPostsMax !== null && autoPostsMax !== '') {
      updateData.autoPostsMax = toInt(autoPostsMax);
    }
    if (autoDelay !== undefined && autoDelay !== null && autoDelay !== '') {
      updateData.autoDelay = toInt(autoDelay);
    }
    if (customComments !== undefined && customComments !== null && customComments !== '') {
      updateData.customComments = customComments;
    }
    if (isSecret !== undefined && isSecret !== null) {
      updateData.isSecret = toBool(isSecret);
    }

    const changes: any = {};
    Object.keys(updateData).forEach(key => {
      const oldValue = (currentService as any)[key];
      const newValue = (updateData as any)[key];
      if (oldValue !== newValue) {
        changes[key] = {
          from: convertBigIntToString(oldValue),
          to: convertBigIntToString(newValue)
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      updateData.updateText = JSON.stringify({
        action: 'updated',
        changes,
        updatedAt: new Date().toISOString(),
        updatedBy: session.user.email
      });
    }

    const updatedService = await db.services.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
    });

    if (serviceUpdateLogsEnabled) {
      try {
        const clientIP = getClientIP(request);
        const userAgent = request.headers.get('user-agent') || 'unknown';

        const changes: any = {};
        const oldValues: any = {};
        const newValues: any = {};

        Object.keys(updateData).forEach(key => {
          const oldValue = (currentService as any)[key];
          const newValue = (updateData as any)[key];

          if (oldValue !== newValue) {
            changes[key] = {
              from: convertBigIntToString(oldValue),
              to: convertBigIntToString(newValue)
            };
            oldValues[key] = convertBigIntToString(oldValue);
            newValues[key] = convertBigIntToString(newValue);
          }
        });

        await db.serviceUpdateLogs.create({
          data: {
            serviceId: parseInt(id),
            serviceName: currentService.name,
            adminId: parseInt(session.user.id),
            adminEmail: session.user.email || 'unknown',
            action: 'updated',
            changes,
            oldValues,
            newValues,
            ipAddress: clientIP,
            userAgent
          }
        });

        console.log(`Service update logged: Admin ${session.user.email} updated service ${currentService.name} (ID: ${id})`);
      } catch (logError) {
        console.error('Failed to log service update:', logError);
      }
    }

    return NextResponse.json({
      error: null,
      message: 'Service updated successfully',
      data: null,
      success: true,
    });
  } catch (error: any) {
    console.error('Error updating service:', error);
    console.error('Error code:', error?.code);
    console.error('Error meta:', error?.meta);
    
    if (error?.code === 'P2003') {
      const fieldName = error?.meta?.field_name || 'unknown field';
      const targetModel = error?.meta?.target || 'unknown model';
      console.error(`Foreign key constraint violation on field: ${fieldName}, target: ${targetModel}`);
      
      if (fieldName.includes('serviceType') || targetModel.includes('ServiceType')) {
        return NextResponse.json({
          error: 'The selected service type does not exist. Please select a valid service type from the dropdown.',
          data: null,
          success: false,
        }, { status: 400 });
      } else if (fieldName.includes('category') || targetModel.includes('Category')) {
        return NextResponse.json({
          error: 'The selected category does not exist. Please select a valid category from the dropdown.',
          data: null,
          success: false,
        }, { status: 400 });
      } else {
        return NextResponse.json({
          error: `Foreign key constraint violation on ${fieldName}. The referenced record does not exist. Please check service type, category, or other related fields.`,
          data: null,
          success: false,
        }, { status: 400 });
      }
    }
    
    if (error?.code === 'P2025') {
      return NextResponse.json({
        error: 'Service not found or has been deleted.',
        data: null,
        success: false,
      }, { status: 404 });
    }

    return NextResponse.json({
      error: 'Failed to update service: ' + (error?.message || String(error)),
      data: null,
      success: false,
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({
        error: 'Service ID is required',
        data: null,
        success: false,
      });
    }
    const result = await db.services.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        category: true,
        serviceType: true,
      },
    });

    if (!result) {
      return NextResponse.json({
        error: 'Service not found',
        data: null,
        success: false,
      });
    }

    const serializedResult = serializeService(result);

    return NextResponse.json(
      {
        error: null,
        data: serializedResult,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch service: ' + error,
        data: null,
        success: false,
      },
      { status: 500 }
    );
  }
}
