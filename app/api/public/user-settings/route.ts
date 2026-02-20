import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const defaultUserSettings = {
  resetPasswordEnabled: true,
  signUpPageEnabled: true,
  nameFieldEnabled: true,
  emailConfirmationEnabled: true,
  resetLinkMax: 3,
  minimumFundsToAddUSD: 10,
  maximumFundsToAddUSD: 10000,
  transferFundsPercentage: 3,
  userFreeBalanceEnabled: false,
  freeAmount: 0,
  paymentBonusEnabled: false,
  bonusPercentage: 0,
};

export async function GET() {
  try {
    let settings = await db.userSettings.findFirst();
    if (!settings) {
      return NextResponse.json({
        success: true,
        userSettings: defaultUserSettings
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    return NextResponse.json({
      success: true,
      userSettings: {
        resetPasswordEnabled: settings.resetPasswordEnabled,
        signUpPageEnabled: settings.signUpPageEnabled,
        nameFieldEnabled: settings.nameFieldEnabled,
        emailConfirmationEnabled: settings.emailConfirmationEnabled,
        resetLinkMax: settings.resetLinkMax,
        minimumFundsToAddUSD: settings.minimumFundsToAddUSD ?? 10,
        maximumFundsToAddUSD: settings.maximumFundsToAddUSD ?? 10000,
        transferFundsPercentage: settings.transferFundsPercentage,
        userFreeBalanceEnabled: settings.userFreeBalanceEnabled,
        freeAmount: settings.freeAmount,
        paymentBonusEnabled: settings.paymentBonusEnabled,
        bonusPercentage: settings.bonusPercentage,
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Error loading public user settings:', error);
    return NextResponse.json({
      success: true,
      userSettings: defaultUserSettings
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }
}
