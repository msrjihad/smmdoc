import { db as prisma } from './db';
import nodemailer, { Transporter } from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type EmailCache = {
  config: EmailConfig;
  transporter: Transporter;
  fromEmail: string;
  cachedAt: number;
};

let emailCache: EmailCache | null = null;

export function invalidateEmailConfigCache(): void {
  if (emailCache) {
    try {
      emailCache.transporter.close();
    } catch {
    }
    emailCache = null;
    console.log('Email config cache invalidated');
  }
}

export async function getEmailConfig(): Promise<EmailConfig | null> {
  try {
    const emailSettings = await prisma.emailSettings.findFirst({
      orderBy: { updated_at: 'desc' }
    });

    if (!emailSettings || !emailSettings.smtp_host || !emailSettings.smtp_username) {
      console.warn('Email settings not configured in database');
      return null;
    }

    const supportEmail = emailSettings.email || emailSettings.smtp_username;

    return {
      host: emailSettings.smtp_host,
      port: emailSettings.smtp_port,
      secure: emailSettings.smtp_port === 465,
      auth: {
        user: emailSettings.smtp_username,
        pass: emailSettings.smtp_password,
      },
      from: supportEmail,
    };
  } catch (error) {
    console.error('Error fetching email configuration from database:', error);
    return null;
  }
}

export async function createEmailTransporter(): Promise<Transporter | null> {
  const now = Date.now();
  if (emailCache && now - emailCache.cachedAt < CACHE_TTL_MS) {
    return emailCache.transporter;
  }

  invalidateEmailConfigCache();

  const config = await getEmailConfig();
  if (!config) {
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false,
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      ...(process.env.DKIM_PRIVATE_KEY && {
        dkim: {
          domainName: config.from.split('@')[1] || config.host,
          keySelector: 'default',
          privateKey: process.env.DKIM_PRIVATE_KEY,
        }
      }),
    });

    try {
      await transporter.verify();
      console.log('Email transporter created and verified successfully');
    } catch (verifyError) {
      console.warn('Transporter verification failed, continuing anyway:', (verifyError as Error).message);
    }

    const fromEmail = config.from || config.auth.user;
    emailCache = {
      config,
      transporter,
      fromEmail,
      cachedAt: Date.now(),
    };
    return transporter;
  } catch (error) {
    const err = error as Error & { code?: string; command?: string; response?: string; responseCode?: number };
    console.error('Error creating email transporter:', err.message);
    console.error('Full error details:', {
      name: err.name,
      code: err.code,
      command: err.command,
      response: err.response,
      responseCode: err.responseCode
    });
    return null;
  }
}

export async function getFromEmailAddress(): Promise<string | null> {
  const now = Date.now();
  if (emailCache && now - emailCache.cachedAt < CACHE_TTL_MS) {
    return emailCache.fromEmail;
  }

  const config = await getEmailConfig();
  if (config) {
    return config.from || config.auth.user;
  }

  try {
    const emailSettings = await prisma.emailSettings.findFirst({
      orderBy: { updated_at: 'desc' }
    });
    if (emailSettings?.email) return emailSettings.email;
    return emailSettings?.smtp_username || null;
  } catch (error) {
    console.error('Error fetching support email from Email Settings:', error);
    return null;
  }
}