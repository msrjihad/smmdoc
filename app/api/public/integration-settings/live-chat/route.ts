import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
  try {
    const integrationSettings = await prisma.integrationSettings.findFirst();

    if (!integrationSettings) {
      return NextResponse.json({
        enabled: false,
        hoverTitle: 'Contact Support',
        socialMediaEnabled: false,
        messengerEnabled: false,
        messengerUrl: '',
        whatsappEnabled: false,
        whatsappNumber: '',
        telegramEnabled: false,
        telegramUsername: '',
        tawkToEnabled: false,
        tawkToWidgetCode: '',
        visibility: 'all',
      });
    }

    const liveChatSettings = {
      enabled: integrationSettings.liveChatEnabled,
      hoverTitle: integrationSettings.liveChatHoverTitle || 'Contact Support',
      socialMediaEnabled: integrationSettings.liveChatSocialEnabled,
      messengerEnabled: integrationSettings.liveChatMessengerEnabled,
      messengerUrl: integrationSettings.liveChatMessengerUrl || '',
      whatsappEnabled: integrationSettings.liveChatWhatsappEnabled,
      whatsappNumber: integrationSettings.liveChatWhatsappNumber || '',
      telegramEnabled: integrationSettings.liveChatTelegramEnabled,
      telegramUsername: integrationSettings.liveChatTelegramUsername || '',
      tawkToEnabled: integrationSettings.liveChatTawkToEnabled,
      tawkToWidgetCode: integrationSettings.liveChatTawkToCode || '',
      visibility: integrationSettings.liveChatVisibility || 'all',
    };

    return NextResponse.json(liveChatSettings);
  } catch (error) {
    console.error('Error fetching live chat settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live chat settings' },
      { status: 500 }
    );
  }
}
