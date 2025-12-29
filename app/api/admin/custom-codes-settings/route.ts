import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const customCodesSettings = await db.customCodesSettings.findFirst();

    return NextResponse.json({
      success: true,
      customCodesSettings: customCodesSettings || {
        headerCodes: '',
        footerCodes: '',
      },
    });
  } catch (error) {
    console.error('Error fetching custom codes settings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    const { customCodesSettings } = await request.json();

    if (!customCodesSettings) {
      return NextResponse.json(
        { success: false, message: 'Custom codes settings are required' },
        { status: 400 }
      );
    }

    const updatedSettings = await db.customCodesSettings.upsert({
      where: { id: 1 },
      update: {
        headerCodes: customCodesSettings.headerCodes || '',
        footerCodes: customCodesSettings.footerCodes || '',
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        headerCodes: customCodesSettings.headerCodes || '',
        footerCodes: customCodesSettings.footerCodes || '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom codes settings updated successfully',
      customCodesSettings: updatedSettings,
    });
  } catch (error) {
    console.error('Error updating custom codes settings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
