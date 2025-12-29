import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

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
      data: {
        message: 'Admin API is working correctly',
        user: session.user.email,
        timestamp: new Date().toISOString()
      },
      error: null
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      {
        error: 'Test endpoint failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

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
    console.log('Test task request body:', body);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Test task processed successfully',
        receivedData: body,
        processedBy: session.user.email,
        timestamp: new Date().toISOString()
      },
      error: null
    });

  } catch (error) {
    console.error('Error processing test task:', error);
    return NextResponse.json(
      {
        error: 'Test task processing failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
