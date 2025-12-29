import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const defaultPaymentGatewaySettings = {
  gatewayName: 'UddoktaPay',
  liveApiKey: '',
  liveApiUrl: '',
  sandboxApiKey: '',
  sandboxApiUrl: '',
  mode: 'Live',
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await db.paymentGatewaySettings.findFirst();
    if (!settings) {
      settings = await db.paymentGatewaySettings.create({
        data: defaultPaymentGatewaySettings
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        gatewayName: settings.gatewayName || defaultPaymentGatewaySettings.gatewayName,
        liveApiKey: settings.liveApiKey || '',
        liveApiUrl: settings.liveApiUrl || '',
        sandboxApiKey: settings.sandboxApiKey || '',
        sandboxApiUrl: settings.sandboxApiUrl || '',
        mode: settings.mode || defaultPaymentGatewaySettings.mode,
      }
    });

  } catch (error) {
    console.error('Error loading payment gateway settings:', error);
    return NextResponse.json(
      { error: 'Failed to load payment gateway settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!settings) {
      return NextResponse.json(
        { error: 'Payment gateway settings data is required' },
        { status: 400 }
      );
    }

    if (!settings.gatewayName?.trim()) {
      return NextResponse.json(
        { error: 'Gateway name is required' },
        { status: 400 }
      );
    }

    if (!settings.mode || !['Live', 'Sandbox'].includes(settings.mode)) {
      return NextResponse.json(
        { error: 'Mode must be either Live or Sandbox' },
        { status: 400 }
      );
    }

    const existingSettings = await db.paymentGatewaySettings.findFirst();

    const updateData: any = {
      gatewayName: settings.gatewayName.trim(),
      mode: settings.mode,
      updatedAt: new Date()
    };

    if (settings.liveApiKey !== undefined) {
      updateData.liveApiKey = settings.liveApiKey?.trim() || '';
    }
    if (settings.liveApiUrl !== undefined) {
      updateData.liveApiUrl = settings.liveApiUrl?.trim() || '';
    }
    if (settings.sandboxApiKey !== undefined) {
      updateData.sandboxApiKey = settings.sandboxApiKey?.trim() || '';
    }
    if (settings.sandboxApiUrl !== undefined) {
      updateData.sandboxApiUrl = settings.sandboxApiUrl?.trim() || '';
    }

    if (existingSettings) {
      await db.paymentGatewaySettings.update({
        where: { id: existingSettings.id },
        data: updateData
      });
    } else {
      await db.paymentGatewaySettings.create({
        data: {
          ...defaultPaymentGatewaySettings,
          ...updateData
        }
      });
    }

    const { clearPaymentGatewayCache } = await import('@/lib/payment-gateway-config');
    clearPaymentGatewayCache();

    return NextResponse.json({
      success: true,
      message: 'Payment gateway settings saved successfully'
    });

  } catch (error: any) {
    console.error('Error saving payment gateway settings:', error);
    const errorMessage = error?.message || 'Failed to save payment gateway settings';
    console.error('Detailed error:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: 'Failed to save payment gateway settings',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}

