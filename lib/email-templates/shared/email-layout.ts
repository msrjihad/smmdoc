export interface EmailLayoutData {
  title: string;
  headerColor?: 'primary-color';
  footerMessage?: string;
  userEmail?: string;
  supportEmail?: string;
  whatsappNumber?: string;
  siteLogo?: string;
  siteName?: string;
  tagline?: string;
  appUrl?: string;
  primaryColor?: string;
  
  secondaryColor?: string;
}

const DEFAULT_PRIMARY = '#5f1de8';
const DEFAULT_SECONDARY = '#b131f8';

export const emailHeader = (data: EmailLayoutData) => {
  const siteName = data.siteName || data.title;
  const appUrl = data.appUrl || '';
  const logoUrl = data.siteLogo ? (data.siteLogo.startsWith('http') ? data.siteLogo : `${appUrl.replace(/\/$/, '')}${data.siteLogo.startsWith('/') ? '' : '/'}${data.siteLogo}`) : '';
  const primary = data.primaryColor ?? DEFAULT_PRIMARY;
  const secondary = data.secondaryColor ?? DEFAULT_SECONDARY;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
      <style type="text/css">
        :root { --primary: ${primary}; --secondary: ${secondary}; }
        .tableWrapper { display: block; overflow-x: auto; margin: 0.75em 0; }
        table { border-collapse: collapse; width: 100%; margin: 0; display: table; table-layout: auto; }
        th, td { border: 1px solid #e5e7eb; padding: 0.5rem 0.75rem; text-align: left; display: table-cell; }
        th { font-weight: 600; background-color: #f9fafb; }
        tr { display: table-row; }
        tbody { display: table-row-group; }
        thead { display: table-header-group; }
        .email-cta-button { display: inline-block !important; padding: 12px 24px !important; background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%) !important; color: #ffffff !important; text-decoration: none !important; border-radius: 6px; font-weight: 600; border: none; cursor: pointer; }
        a.email-cta-button:hover { opacity: 0.9; }
        .email-body-content p { font-size: 14px; }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb;">
        <!-- Header: logo only (same bg as footer), logo links to app -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
          ${logoUrl ? (appUrl ? `<a href="${appUrl}" style="text-decoration: none;"><img src="${logoUrl}" alt="${siteName}" style="max-width: 200px; max-height: 60px; width: auto; height: auto; display: inline-block; border: 0;" /></a>` : `<img src="${logoUrl}" alt="${siteName}" style="max-width: 200px; max-height: 60px; width: auto; height: auto; display: inline-block;" />`) : ''}
        </div>
        <!-- Content -->
        <div class="email-body-content" style="padding: 20px; font-size: 14px;">
  `;
};

export const emailFooter = (data: EmailLayoutData) => {
  const siteName = data.siteName || 'SMM Panel';
  const appUrl = (data.appUrl || '').replace(/\/$/, '');

  return `
        </div>
        <!-- Footer (same bg as header) -->
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          ${appUrl ? `<p style="margin: 0 0 12px 0; font-size: 14px;">
            <a href="${appUrl}" style="color: #2563eb; text-decoration: underline;">Visit Website</a>
            <span style="color: #9ca3af; margin: 0 6px;">|</span>
            <a href="${appUrl}/dashboard" style="color: #2563eb; text-decoration: underline;">Login to Dashboard</a>
            <span style="color: #9ca3af; margin: 0 6px;">|</span>
            <a href="${appUrl}/contact-support" style="color: #2563eb; text-decoration: underline;">Get Support</a>
          </p>` : ''}
          <p style="color: #6b7280; font-size: 12px; margin: 0;">Copyright © ${siteName}, All Rights Reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const createEmailTemplate = (layoutData: EmailLayoutData, content: string) => {
  return emailHeader(layoutData) + content + emailFooter(layoutData);
};

export const emailContentSections = {
  greeting: (userName: string) => `
    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Dear ${userName},</h2>
  `,
  
  actionButtons: (buttons: Array<{text: string, url: string}>) => {
    const primaryStyle = 'background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); box-shadow: 0 4px 12px rgba(95, 29, 232, 0.3);';
    
    const buttonHtml = buttons.map(button => {
      return `
        <a href="${button.url}" 
           style="${primaryStyle} color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 5px 10px 5px;">
          ${button.text}
        </a>
      `;
    }).join('');
    
    return `
      <div style="text-align: center; margin: 40px 0;">
        ${buttonHtml}
      </div>
    `;
  },

  ctaButton: (text: string, url: string) => {
    const primaryStyle = 'background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); box-shadow: 0 4px 12px rgba(95, 29, 232, 0.3);';
    
    return `
      <div style="text-align: center; margin: 40px 0;">
        <a href="${url}" 
           style="${primaryStyle} color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          ${text}
        </a>
      </div>
    `;
  },
  
  infoTable: (rows: Array<{label: string, value: string, valueColor?: string}>) => {
    const tableRows = rows.map(row => `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">${row.label}:</td>
        <td style="padding: 8px 0; color: ${row.valueColor || '#1f2937'}; font-weight: bold;">${row.value}</td>
      </tr>
    `).join('');
    
    return `
      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          ${tableRows}
        </table>
      </div>
    `;
  },
  
  alertBox: (content: string) => {
    const primaryStyle = 'background-color: rgba(95, 29, 232, 0.1); border-left: 4px solid var(--primary);';
    
    return `
      <div style="${primaryStyle} border-radius: 12px; padding: 25px; margin: 30px 0;">
        ${content}
      </div>
    `;
  }
};
