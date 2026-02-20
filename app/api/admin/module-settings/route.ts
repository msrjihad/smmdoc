import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clearModuleSettingsCache } from '@/lib/utils/module-settings';
import { NextRequest, NextResponse } from 'next/server';

const defaultModuleSettings = {
  affiliateSystemEnabled: false,
  commissionRate: 5,
  minimumPayout: 10,
  servicePurchaseEarningCount: '1',
  childPanelSellingEnabled: false,
  childPanelPrice: 10,
  serviceUpdateLogsEnabled: true,
  massOrderEnabled: false,
  servicesListPublic: true,
  updatedAt: new Date(),
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await db.moduleSettings.findFirst();
    if (!settings) {
      settings = await db.moduleSettings.create({
        data: defaultModuleSettings
      });
    }

    return NextResponse.json({
      success: true,
      moduleSettings: {
        affiliateSystemEnabled: settings.affiliateSystemEnabled,
        commissionRate: settings.commissionRate,
        minimumPayout: settings.minimumPayout,
        servicePurchaseEarningCount: settings.servicePurchaseEarningCount ?? '1',
        childPanelSellingEnabled: settings.childPanelSellingEnabled,
        childPanelPrice: settings.childPanelPrice,
        serviceUpdateLogsEnabled: settings.serviceUpdateLogsEnabled,
        massOrderEnabled: settings.massOrderEnabled,
        servicesListPublic: settings.servicesListPublic,
      }
    });

  } catch (error) {
    console.error('Error loading module settings:', error);
    return NextResponse.json(
      { error: 'Failed to load module settings' },
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

    const { moduleSettings } = await request.json();

    if (!moduleSettings) {
      return NextResponse.json(
        { error: 'Module settings data is required' },
        { status: 400 }
      );
    }

    if (moduleSettings.commissionRate && (moduleSettings.commissionRate < 0 || moduleSettings.commissionRate > 100)) {
      return NextResponse.json(
        { error: 'Commission rate must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (moduleSettings.minimumPayout && moduleSettings.minimumPayout < 0) {
      return NextResponse.json(
        { error: 'Minimum payout cannot be negative' },
        { status: 400 }
      );
    }

    if (moduleSettings.childPanelPrice && moduleSettings.childPanelPrice < 0) {
      return NextResponse.json(
        { error: 'Child panel price cannot be negative' },
        { status: 400 }
      );
    }

    await db.moduleSettings.upsert({
      where: { id: 1 },
      update: {
        affiliateSystemEnabled: moduleSettings.affiliateSystemEnabled ?? false,
        commissionRate: moduleSettings.commissionRate ?? 5,
        minimumPayout: moduleSettings.minimumPayout ?? 10,
        servicePurchaseEarningCount: moduleSettings.servicePurchaseEarningCount ?? '1',
        childPanelSellingEnabled: moduleSettings.childPanelSellingEnabled ?? false,
        childPanelPrice: moduleSettings.childPanelPrice ?? 10,
        serviceUpdateLogsEnabled: moduleSettings.serviceUpdateLogsEnabled ?? true,
        massOrderEnabled: moduleSettings.massOrderEnabled ?? false,
        servicesListPublic: moduleSettings.servicesListPublic ?? true,
      },
      create: {
        id: 1,
        affiliateSystemEnabled: moduleSettings.affiliateSystemEnabled ?? false,
        commissionRate: moduleSettings.commissionRate ?? 5,
        minimumPayout: moduleSettings.minimumPayout ?? 10,
        servicePurchaseEarningCount: moduleSettings.servicePurchaseEarningCount ?? '1',
        childPanelSellingEnabled: moduleSettings.childPanelSellingEnabled ?? false,
        childPanelPrice: moduleSettings.childPanelPrice ?? 10,
        serviceUpdateLogsEnabled: moduleSettings.serviceUpdateLogsEnabled ?? true,
        massOrderEnabled: moduleSettings.massOrderEnabled ?? false,
        servicesListPublic: moduleSettings.servicesListPublic ?? true,
        updatedAt: new Date(),
      }
    });

    clearModuleSettingsCache();
    revalidatePath('/', 'layout');

    return NextResponse.json({
      success: true,
      message: 'Module settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving module settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save module settings',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
