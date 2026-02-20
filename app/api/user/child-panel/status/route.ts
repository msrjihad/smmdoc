import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          data: null,
        },
        { status: 401 }
      );
    }

    const moduleSettings = await db.moduleSettings.findFirst();
    const childPanelSellingEnabled = moduleSettings?.childPanelSellingEnabled ?? false;
    const childPanelPrice = moduleSettings?.childPanelPrice ?? 10;

    if (!childPanelSellingEnabled) {
      return NextResponse.json({
        success: true,
        data: {
          hasPanel: false,
          isEnabled: false,
          price: childPanelPrice,
          message: 'Child panel selling is currently disabled'
        },
      });
    }

    const userId = parseInt(session.user.id);

    const childPanel = await db.childPanels.findUnique({
      where: { userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!childPanel) {
      return NextResponse.json({
        success: true,
        data: {
          hasPanel: false,
          isEnabled: true,
          price: childPanelPrice,
          message: 'No child panel found'
        },
      });
    }

    const now = new Date();
    const expiryDate = childPanel.expiryDate ? new Date(childPanel.expiryDate) : null;
    const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    return NextResponse.json({
      success: true,
      data: {
        hasPanel: true,
        isEnabled: true,
        price: childPanelPrice,
        panel: {
          id: childPanel.id,
          domain: childPanel.domain,
          subdomain: childPanel.subdomain,
          panelName: childPanel.panelName,
          apiKey: childPanel.apiKey,
          status: childPanel.status,
          plan: childPanel.plan,
          theme: childPanel.theme,
          customBranding: childPanel.customBranding,
          totalOrders: childPanel.totalOrders,
          totalRevenue: childPanel.totalRevenue,
          apiCallsToday: childPanel.apiCallsToday,
          apiCallsTotal: childPanel.apiCallsTotal,
          lastActivity: childPanel.lastActivity,
          expiryDate: childPanel.expiryDate,
          daysUntilExpiry,
          settings: childPanel.settings,
          createdAt: childPanel.createdAt,
          latestSubscription: childPanel.subscriptions[0] || null
        }
      },
    });

  } catch (error) {
    console.error('Error getting child panel status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get child panel status: ' + (error instanceof Error ? error.message : 'Unknown error'),
        data: null,
      },
      { status: 500 }
    );
  }
}
