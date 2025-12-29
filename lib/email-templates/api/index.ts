
import { createEmailTemplate, emailContentSections, EmailLayoutData } from '../shared/email-layout';

export interface ApiEmailData {
  userName: string;
  userEmail: string;
  apiKeyName?: string;
  apiKeyId?: string;
  apiEndpoint?: string;
  requestCount?: number;
  rateLimitInfo?: string;
  date: string;
  userId?: string;
  errorMessage?: string;
  statusCode?: number;
  ipAddress?: string;
}

export const apiTemplates = {
  userApiKeyGenerated: (data: ApiEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'API Key Generated Successfully',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated message. Please do not reply to this email.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your new API key has been successfully generated and is ready to use. Please store it securely as it won't be displayed again.
      </p>

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px; border-bottom: 2px solid #22c55e; padding-bottom: 10px;">API Key Details</h3>
        ${emailContentSections.infoTable([
          ...(data.apiKeyName ? [{label: 'Key Name', value: data.apiKeyName}] : []),
          ...(data.apiKeyId ? [{label: 'Key ID', value: data.apiKeyId}] : []),
          {label: 'Status', value: 'Active', valueColor: '#22c55e'},
          {label: 'Generated', value: data.date},
          ...(data.rateLimitInfo ? [{label: 'Rate Limit', value: data.rateLimitInfo}] : [])
        ])}
      </div>

      ${emailContentSections.alertBox(`
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Security Best Practices:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Store your API key securely and never share it publicly</li>
          <li style="margin-bottom: 8px;">Use environment variables to store the key in your applications</li>
          <li style="margin-bottom: 8px;">Regenerate your key if you suspect it has been compromised</li>
          <li style="margin-bottom: 8px;">Monitor your API usage regularly for unusual activity</li>
        </ul>
      `)}

      <div style="background-color: #e0f2fe; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Getting Started:</h3>
        <p style="color: #4b5563; margin: 0 0 15px 0;">Include your API key in the request headers:</p>
        <div style="background-color: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; overflow-x: auto;">
          Authorization: Bearer YOUR_API_KEY
        </div>
      </div>

      ${emailContentSections.actionButtons([
        {text: 'View API Documentation', url: `${process.env.NEXT_PUBLIC_APP_URL}/api/documentation`},
        {text: 'Manage API Keys', url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/api-keys`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        If you have any questions about using our API, please don't hesitate to contact our support team.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  userApiRateLimitExceeded: (data: ApiEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'API Rate Limit Exceeded',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated message. Please do not reply to this email.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        Your API usage has exceeded the allowed rate limit. Some of your recent API requests may have been throttled or rejected.
      </p>

      <div style="background-color: #fef3c7; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Usage Information</h3>
        ${emailContentSections.infoTable([
          ...(data.requestCount ? [{label: 'Requests Made', value: data.requestCount.toString()}] : []),
          ...(data.rateLimitInfo ? [{label: 'Rate Limit', value: data.rateLimitInfo}] : []),
          {label: 'Status', value: 'Rate Limited', valueColor: '#f59e0b'},
          {label: 'Time', value: data.date},
          ...(data.ipAddress ? [{label: 'IP Address', value: data.ipAddress}] : [])
        ])}
      </div>

      ${emailContentSections.alertBox(`
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">What you can do:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Wait for the rate limit window to reset (usually 1 hour)</li>
          <li style="margin-bottom: 8px;">Implement exponential backoff in your API calls</li>
          <li style="margin-bottom: 8px;">Consider upgrading to a higher tier plan for increased limits</li>
          <li style="margin-bottom: 8px;">Optimize your API usage to reduce unnecessary requests</li>
        </ul>
      `)}

      <div style="background-color: #f3f4f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Rate Limit Guidelines:</h3>
        <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; border: 1px solid #e5e7eb;">
          <p style="color: #4b5563; margin: 0 0 10px 0; font-size: 14px;"><strong>Best Practices:</strong></p>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 14px;">
            <li>Check response headers for rate limit information</li>
            <li>Implement proper error handling for 429 status codes</li>
            <li>Use caching to reduce API calls where possible</li>
            <li>Batch requests when the API supports it</li>
          </ul>
        </div>
      </div>

      ${emailContentSections.actionButtons([
        {text: 'View API Usage', url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/api-usage`},
        {text: 'Upgrade Plan', url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        If you need assistance with optimizing your API usage or have questions about rate limits, please contact our support team.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
  userApiError: (data: ApiEmailData) => {
    const layoutData: EmailLayoutData = {
      title: 'API Error Alert',
      headerColor: 'primary-color',
      footerMessage: 'This is an automated message. Please do not reply to this email.',
      userEmail: data.userEmail
    };

    const content = `
      ${emailContentSections.greeting(data.userName)}
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
        We've detected an error with your API requests. Please review the details below and take appropriate action.
      </p>

      <div style="background-color: #fef2f2; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #ef4444;">
        <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Error Details</h3>
        ${emailContentSections.infoTable([
          ...(data.statusCode ? [{label: 'Status Code', value: data.statusCode.toString(), valueColor: '#ef4444'}] : []),
          ...(data.errorMessage ? [{label: 'Error Message', value: data.errorMessage}] : []),
          ...(data.apiEndpoint ? [{label: 'Endpoint', value: data.apiEndpoint}] : []),
          {label: 'Time', value: data.date},
          ...(data.ipAddress ? [{label: 'IP Address', value: data.ipAddress}] : [])
        ])}
      </div>

      ${emailContentSections.alertBox(`
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Troubleshooting Steps:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Check your API key and ensure it's valid and active</li>
          <li style="margin-bottom: 8px;">Verify the request format and required parameters</li>
          <li style="margin-bottom: 8px;">Review the API documentation for the endpoint</li>
          <li style="margin-bottom: 8px;">Check if you've exceeded your rate limits</li>
          <li style="margin-bottom: 8px;">Ensure your account has sufficient permissions</li>
        </ul>
      `)}

      <div style="background-color: #e0f2fe; border-radius: 12px; padding: 25px; margin: 30px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Common Error Codes:</h3>
        <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; border: 1px solid #e5e7eb;">
          <ul style="color: #6b7280; margin: 0; padding-left: 20px; font-size: 14px;">
            <li><strong>400:</strong> Bad Request - Check your request format</li>
            <li><strong>401:</strong> Unauthorized - Invalid or missing API key</li>
            <li><strong>403:</strong> Forbidden - Insufficient permissions</li>
            <li><strong>429:</strong> Too Many Requests - Rate limit exceeded</li>
            <li><strong>500:</strong> Internal Server Error - Contact support</li>
          </ul>
        </div>
      </div>

      ${emailContentSections.actionButtons([
        {text: 'View Documentation', url: `${process.env.NEXT_PUBLIC_APP_URL}/api/documentation`},
        {text: 'Contact Support', url: `${process.env.NEXT_PUBLIC_APP_URL}/support`}
      ])}

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 30px 0 0 0;">
        If you continue to experience issues, please don't hesitate to contact our technical support team for assistance.
      </p>
    `;

    return createEmailTemplate(layoutData, content);
  },
};