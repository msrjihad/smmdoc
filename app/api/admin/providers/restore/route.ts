import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();

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
    const { providerId } = body;

    if (!providerId || typeof providerId !== 'number') {
      return NextResponse.json(
        {
          error: 'Valid Provider ID is required.',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const provider = await db.apiProviders.findUnique({
      where: { id: providerId }
    });

    if (!provider) {
      return NextResponse.json(
        {
          error: 'Provider not found.',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (provider.status !== 'trash') {
      return NextResponse.json(
        {
          error: 'Provider is not in trash.',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    await db.apiProviders.update({
      where: { id: providerId },
      data: { 
        status: 'active',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Provider restored successfully!',
      data: null,
      error: null
    });

  } catch (error) {
    console.error('Error restoring provider:', error);
    return NextResponse.json(
      {
        error: 'Failed to restore provider: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
