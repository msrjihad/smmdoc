import { requireAuth } from '@/lib/auth-helpers';
import { NextResponse } from 'next/server';

export async function PUT() {
  try {
    const session = await requireAuth();

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}

