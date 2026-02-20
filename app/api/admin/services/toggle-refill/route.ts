import { auth } from '@/auth';
import { db } from '@/lib/db';
import { serializeService } from '@/lib/utils';
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
    const { id, refill } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service ID is required' 
        },
        { status: 400 }
      );
    }

    if (typeof refill !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Refill value must be boolean' 
        },
        { status: 400 }
      );
    }

    const updatedService = await db.services.update({
      where: { id },
      data: { refill },
    });

    return NextResponse.json(
      { 
        success: true, 
        data: serializeService(updatedService),
        message: `Service refill ${refill ? 'enabled' : 'disabled'} successfully`
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error toggling service refill:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to toggle refill status'
      },
      { status: 500 }
    );
  }
}
