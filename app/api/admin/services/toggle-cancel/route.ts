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
    const { id, cancel } = body;

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service ID is required' 
        },
        { status: 400 }
      );
    }

    if (typeof cancel !== 'boolean') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cancel value must be boolean' 
        },
        { status: 400 }
      );
    }

    const updatedService = await db.services.update({
      where: { id },
      data: { cancel },
    });

    return NextResponse.json(
      { 
        success: true, 
        data: updatedService,
        message: `Service cancel ${cancel ? 'enabled' : 'disabled'} successfully`
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error toggling service cancel:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to toggle cancel status'
      },
      { status: 500 }
    );
  }
}
