

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
