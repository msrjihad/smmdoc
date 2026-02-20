import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbSettings = await db.integrationSettings.findFirst();
    
    if (!dbSettings || !dbSettings.recaptchaEnabled) {
      return NextResponse.json({
        success: true,
        recaptchaSettings: {
          enabled: false,
          version: 'v3',
          siteKey: '',
          threshold: 0.5,
          enabledForms: {
            signUp: false,
            signIn: false,
            contact: false,
            supportTicket: false,
            contactSupport: false,
          },
        },
      });
    }

    const siteKey = dbSettings.recaptchaVersion === 'v2' 
      ? dbSettings.recaptchaV2SiteKey 
      : dbSettings.recaptchaV3SiteKey;
    
    const publicSettings = {
      enabled: dbSettings.recaptchaEnabled,
      version: dbSettings.recaptchaVersion,
      siteKey: siteKey || dbSettings.recaptchaSiteKey,
      threshold: dbSettings.recaptchaThreshold,
      enabledForms: {
        signUp: dbSettings.recaptchaSignUp,
        signIn: dbSettings.recaptchaSignIn,
        contact: dbSettings.recaptchaContact,
        supportTicket: dbSettings.recaptchaSupportTicket,
        contactSupport: dbSettings.recaptchaContactSupport,
      },
    };

    return NextResponse.json({
      success: true,
      recaptchaSettings: publicSettings,
    });
  } catch (error) {
    console.error('Error fetching public ReCAPTCHA settings:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
