"use server";

interface ReCAPTCHAVerificationResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyReCAPTCHA(
  token: string,
  secretKey: string,
  expectedAction?: string,
  minimumScore?: number
): Promise<{ success: boolean; error?: string; score?: number }> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to verify reCAPTCHA with Google servers',
      };
    }

    const data: ReCAPTCHAVerificationResponse = await response.json();

    if (!data.success) {
      const errorCodes = data['error-codes'] || [];
      let errorMessage = 'reCAPTCHA verification failed';

      if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'reCAPTCHA token has expired or been used already';
      } else if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Invalid reCAPTCHA token';
      } else if (errorCodes.includes('invalid-input-secret')) {
        errorMessage = 'Invalid reCAPTCHA secret key configuration';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    if (data.score !== undefined) {

      if (expectedAction && data.action !== expectedAction) {
        return {
          success: false,
          error: 'reCAPTCHA action mismatch',
        };
      }

      if (minimumScore !== undefined && data.score < minimumScore) {
        return {
          success: false,
          error: 'reCAPTCHA score too low - suspicious activity detected',
          score: data.score,
        };
      }

      return {
        success: true,
        score: data.score,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      error: 'Failed to verify reCAPTCHA - network error',
    };
  }
}

export async function getReCAPTCHASettings() {
  try {
    const { db } = await import('./db');
    const integrationSettings = await db.integrationSettings.findFirst();

    if (!integrationSettings?.recaptchaEnabled) {
      return null;
    }

    const secretKey = integrationSettings.recaptchaVersion === 'v2' 
      ? integrationSettings.recaptchaV2SecretKey 
      : integrationSettings.recaptchaV3SecretKey;

    return {
      enabled: integrationSettings.recaptchaEnabled,
      version: integrationSettings.recaptchaVersion || 'v3',
      secretKey: secretKey || integrationSettings.recaptchaSecretKey,
      threshold: integrationSettings.recaptchaThreshold || 0.5,
      enabledForms: {
        signUp: integrationSettings.recaptchaSignUp || false,
        signIn: integrationSettings.recaptchaSignIn || false,
        contact: integrationSettings.recaptchaContact || false,
        supportTicket: integrationSettings.recaptchaSupportTicket || false,
        contactSupport: integrationSettings.recaptchaContactSupport || false,
      },
    };
  } catch (error) {
    console.error('Error fetching reCAPTCHA settings:', error);
    return null;
  }
}