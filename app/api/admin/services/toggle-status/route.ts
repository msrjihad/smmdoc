/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    const newStatus = status === 'active' ? 'inactive' : 'active';

    const updatedService = await db.services.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json(
      { 
        success: true, 
        data: updatedService,
        message: `Service ${updatedService.name} is now ${newStatus}`
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error toggling service status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 
