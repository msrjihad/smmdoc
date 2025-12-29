import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

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
  updatedAt: new Date(),
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings = await db.userSettings.findFirst();
    if (!settings) {
      settings = await db.userSettings.create({
        data: defaultUserSettings
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
    });

  } catch (error) {
    console.error('Error loading user settings:', error);
    return NextResponse.json(
      { error: 'Failed to load user settings' },
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

    const { userSettings } = await request.json();

    if (!userSettings) {
      return NextResponse.json(
        { error: 'User settings data is required' },
        { status: 400 }
      );
    }

    if (userSettings.resetLinkMax && (userSettings.resetLinkMax < 1 || userSettings.resetLinkMax > 10)) {
      return NextResponse.json(
        { error: 'Reset link max must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (userSettings.transferFundsPercentage && (userSettings.transferFundsPercentage < 0 || userSettings.transferFundsPercentage > 100)) {
      return NextResponse.json(
        { error: 'Transfer funds percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    if (userSettings.minimumFundsToAddUSD !== undefined && userSettings.minimumFundsToAddUSD < 0) {
      return NextResponse.json(
        { error: 'Minimum funds to add cannot be negative' },
        { status: 400 }
      );
    }

    if (userSettings.maximumFundsToAddUSD !== undefined && userSettings.maximumFundsToAddUSD < 0) {
      return NextResponse.json(
        { error: 'Maximum funds to add cannot be negative' },
        { status: 400 }
      );
    }

    if (userSettings.minimumFundsToAddUSD !== undefined && userSettings.maximumFundsToAddUSD !== undefined) {
      if (userSettings.minimumFundsToAddUSD > userSettings.maximumFundsToAddUSD) {
        return NextResponse.json(
          { error: 'Minimum funds to add cannot be greater than maximum funds to add' },
          { status: 400 }
        );
      }
    }

    if (userSettings.freeAmount && userSettings.freeAmount < 0) {
      return NextResponse.json(
        { error: 'Free amount cannot be negative' },
        { status: 400 }
      );
    }

    if (userSettings.bonusPercentage && (userSettings.bonusPercentage < 0 || userSettings.bonusPercentage > 100)) {
      return NextResponse.json(
        { error: 'Bonus percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    const updateData: any = {
      resetPasswordEnabled: userSettings.resetPasswordEnabled ?? true,
      signUpPageEnabled: userSettings.signUpPageEnabled ?? true,
      nameFieldEnabled: userSettings.nameFieldEnabled ?? true,
      emailConfirmationEnabled: userSettings.emailConfirmationEnabled ?? true,
      resetLinkMax: userSettings.resetLinkMax ?? 3,
      transferFundsPercentage: userSettings.transferFundsPercentage ?? 3,
      userFreeBalanceEnabled: userSettings.userFreeBalanceEnabled ?? false,
      freeAmount: userSettings.freeAmount ?? 0,
      paymentBonusEnabled: userSettings.paymentBonusEnabled ?? false,
      bonusPercentage: userSettings.bonusPercentage ?? 0,
    };
    
    if (userSettings.minimumFundsToAddUSD !== undefined) {
      updateData.minimumFundsToAddUSD = userSettings.minimumFundsToAddUSD ?? 10;
    }
    
    if (userSettings.maximumFundsToAddUSD !== undefined) {
      updateData.maximumFundsToAddUSD = userSettings.maximumFundsToAddUSD ?? 10000;
    }

    await db.userSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        resetPasswordEnabled: userSettings.resetPasswordEnabled ?? true,
        signUpPageEnabled: userSettings.signUpPageEnabled ?? true,
        nameFieldEnabled: userSettings.nameFieldEnabled ?? true,
        emailConfirmationEnabled: userSettings.emailConfirmationEnabled ?? true,
        resetLinkMax: userSettings.resetLinkMax ?? 3,
        minimumFundsToAddUSD: userSettings.minimumFundsToAddUSD ?? 10,
        maximumFundsToAddUSD: userSettings.maximumFundsToAddUSD ?? 10000,
        transferFundsPercentage: userSettings.transferFundsPercentage ?? 3,
        userFreeBalanceEnabled: userSettings.userFreeBalanceEnabled ?? false,
        freeAmount: userSettings.freeAmount ?? 0,
        paymentBonusEnabled: userSettings.paymentBonusEnabled ?? false,
        bonusPercentage: userSettings.bonusPercentage ?? 0,
        updatedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'User settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving user settings:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = errorMessage.toLowerCase();
    
    if (errorString.includes('minimumfundstoaddusd') || 
        errorString.includes('unknown column') || 
        errorString.includes('column') && errorString.includes('does not exist') ||
        errorString.includes('no such column')) {
      return NextResponse.json(
        { 
          error: 'Database migration required',
          details: 'The "minimumFundsToAddUSD" column does not exist in the database. Please run: npx prisma migrate dev --name add_minimum_funds_to_add_usd or manually add the column using SQL: ALTER TABLE user_settings ADD COLUMN minimumFundsToAddUSD FLOAT DEFAULT 10;',
          migrationRequired: true,
          sqlCommand: 'ALTER TABLE user_settings ADD COLUMN minimumFundsToAddUSD FLOAT DEFAULT 10;'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to save user settings',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
