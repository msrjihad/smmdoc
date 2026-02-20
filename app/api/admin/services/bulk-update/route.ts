import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { serviceIds, updateData } = body;
    
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json(
        { 
          error: 'Service IDs array is required and cannot be empty',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    if (!updateData || Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { 
          error: 'Update data is required',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    const updateFields: any = {};
    
    if (updateData.rate !== undefined && updateData.rate !== null) {
      const rate = parseFloat(updateData.rate);
      if (isNaN(rate) || rate < 0) {
        return NextResponse.json(
          { 
            error: 'Rate must be a valid positive number',
            success: false,
            data: null 
          },
          { status: 400 }
        );
      }
      updateFields.rate = rate;
    }
    
    if (updateData.min_order !== undefined && updateData.min_order !== null) {
      const minOrder = parseInt(updateData.min_order);
      if (isNaN(minOrder) || minOrder < 1) {
        return NextResponse.json(
          { 
            error: 'Minimum order must be a valid positive integer',
            success: false,
            data: null 
          },
          { status: 400 }
        );
      }
      updateFields.min_order = BigInt(minOrder);
    }
    
    if (updateData.max_order !== undefined && updateData.max_order !== null) {
      const maxOrder = parseInt(updateData.max_order);
      if (isNaN(maxOrder) || maxOrder < 1) {
        return NextResponse.json(
          { 
            error: 'Maximum order must be a valid positive integer',
            success: false,
            data: null 
          },
          { status: 400 }
        );
      }
      updateFields.max_order = BigInt(maxOrder);
    }
    
    if (updateFields.min_order !== undefined && updateFields.max_order !== undefined && updateFields.min_order > updateFields.max_order) {
      return NextResponse.json(
        { 
          error: 'Minimum order cannot be greater than maximum order',
          success: false,
          data: null 
        },
        { status: 400 }
      );
    }
    
    updateFields.updatedAt = new Date();
    
    const result = await db.services.updateMany({
      where: {
        id: {
          in: serviceIds
        }
      },
      data: updateFields
    });
    
    console.log(`Admin ${session.user.email} performed bulk update on ${result.count} services`, {
      serviceIds,
      updateData: updateFields,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.count} services`,
      data: {
        updatedCount: result.count,
        serviceIds,
        updateFields
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error in bulk update services:', error);
    return NextResponse.json(
      {
        error: 'Failed to update services: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { 
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null 
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Bulk update endpoint is available',
      data: {
        endpoint: '/api/admin/services/bulk-update',
        methods: ['POST'],
        description: 'Bulk update multiple services at once'
      },
      error: null
    });
    
  } catch (error) {
    console.error('Error in bulk update GET:', error);
    return NextResponse.json(
      {
        error: 'Failed to process request: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
