import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { dollarRate } = body;
    
    if (!dollarRate || isNaN(dollarRate)) {
      return NextResponse.json(
        { error: 'Invalid dollar rate' },
        { status: 400 }
      );
    }
    
    await db.users.updateMany({
      data: {
        dollarRate: parseFloat(dollarRate),
      },
    });

    revalidatePath('/', 'layout');
    
    return NextResponse.json({
      success: true,
      message: 'Dollar rate updated successfully',
    });
    
  } catch (error) {
    console.error('Error updating dollar rate:', error);
    return NextResponse.json(
      { error: 'Failed to update dollar rate' },
      { status: 500 }
    );
  }
} 
