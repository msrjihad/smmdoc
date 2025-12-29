import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { ProviderOrderForwarder } from '@/lib/utils/provider-order-forwarder';
import axios from 'axios';

const API_TIMEOUT = 15000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = API_TIMEOUT): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

const retryApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`❌ Balance check attempt ${attempt}/${maxRetries} failed:`, lastError.message);

      if (attempt === maxRetries) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

function sanitizeProviderUrl(raw: string | null | undefined): string {
  try {
    let url = (raw || '').trim();

    if ((url.startsWith('`') && url.endsWith('`')) || (url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
      url = url.substring(1, url.length - 1);
    }

    url = url.replace(/[`\\]/g, '');

    url = url.replace(/\s+/g, '');

    if (!/^https?:\/\//.test(url)) {
      url = `https://${url}`;
    }

    url = url.replace(/^(https?:)\/+/i, '$1//').replace(/([^:])\/\/+/, '$1/');

    try {
      const u = new URL(url);
      return u.toString();
    } catch {
      const fallback = `https://${url.replace(/^https?:\/\//i, '')}`;
      const u2 = new URL(fallback);
      return u2.toString();
    }
  } catch {
    return (raw || '').trim();
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking balance for provider:', providerId);

    const provider = await db.apiProviders.findUnique({
      where: { id: parseInt(providerId) }
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    if (provider.status !== 'active') {
      return NextResponse.json(
        { error: 'Provider is not active' },
        { status: 400 }
      );
    }

    console.log('✅ Provider found:', provider.name);

    try {
      console.log('🔍 Attempting to fetch balance using ProviderOrderForwarder...');
      const forwarder = new ProviderOrderForwarder();
      const balance = await forwarder.getProviderBalance(provider as any);

      const formattedBalance = {
        balance: balance,
        currency: 'USD',
        provider: provider.name,
        providerId: provider.id,
        lastChecked: new Date().toISOString()
      };

      try {
        await db.apiProviders.update({
          where: { id: provider.id },
          data: {
            current_balance: formattedBalance.balance,
            balance_last_updated: new Date()
          }
        });
        console.log(`💾 Balance cached in database for ${provider.name}: $${formattedBalance.balance}`);
      } catch (dbError) {
        console.error(`❌ Failed to cache balance in database for ${provider.name}:`, dbError);
      }

      console.log(`✅ Balance check completed for ${provider.name}:`, formattedBalance);

      return NextResponse.json({
        success: true,
        data: formattedBalance
      });
    } catch (forwarderError) {
      console.warn(`⚠️ ProviderOrderForwarder failed, falling back to manual method:`, forwarderError);
    }

    const apiUrlSan = sanitizeProviderUrl(provider.api_url);
    const balanceEndpointSan = sanitizeProviderUrl(provider.balance_endpoint || '');
    const balanceUrl = balanceEndpointSan || apiUrlSan;
    const apiKey = provider.api_key;

    console.log(`🔗 Balance URL (sanitized): ${balanceUrl}`);
    console.log(`📋 HTTP Method: ${provider.http_method}`);

    let balanceData = null;

    if (provider.http_method === 'POST') {
      try {
        console.log(`🌐 Checking balance using POST method with standard SMM panel format`);

        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('action', provider.balance_action || 'balance');

        const response = await retryApiCall(async () => {
          return await fetchWithTimeout(balanceUrl, {
            method: 'POST',
            body: formData
          });
        });

        if (response.ok) {
          const responseText = await response.text();
          console.log(`📄 POST Response (${response.status}):`, responseText.substring(0, 200));

          try {
            if (responseText.trim().startsWith('<!DOCTYPE html') || responseText.trim().startsWith('<html')) {
              console.error(`❌ Received HTML response instead of JSON from ${provider.name}. This usually means the API endpoint is incorrect.`);

              if (provider.name === 'ATTPanel' && balanceUrl.startsWith('http://')) {
                const httpsUrl = balanceUrl.replace('http://', 'https://');
                console.log(`🔄 Trying HTTPS URL for ATTPanel: ${httpsUrl}`);

                const httpsResponse = await retryApiCall(async () => {
                  return await fetchWithTimeout(httpsUrl, {
                    method: 'POST',
                    body: formData
                  });
                });

                if (httpsResponse.ok) {
                  const httpsResponseText = await httpsResponse.text();
                  console.log(`📄 HTTPS Response (${httpsResponse.status}):`, httpsResponseText.substring(0, 200));

                  try {
                    const httpsData = JSON.parse(httpsResponseText);
                    if (httpsData.balance !== undefined || httpsData.current_balance !== undefined) {
                      balanceData = httpsData;
                      console.log(`✅ HTTPS POST balance check successful for ATTPanel:`, balanceData);
                    }
                  } catch (httpsParseError) {
                    console.error(`❌ Failed to parse HTTPS response as JSON:`, httpsParseError);
                  }
                }
              }
            } else {
              const data = JSON.parse(responseText);
              if (data.balance !== undefined || data.current_balance !== undefined) {
                balanceData = data;
                console.log(`✅ POST balance check successful:`, balanceData);
              } else {
                console.log(`⚠️ POST response doesn't contain balance field:`, data);
              }
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse POST response as JSON:`, parseError);
            console.log(`Raw response:`, responseText);
          }
        } else {
          console.error(`❌ POST request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ POST balance check failed for sanitized URL ${balanceUrl}:`, error);

        if (error instanceof Error) {
          if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
            console.error(`🌐 Network error: Unable to connect to ${balanceUrl}. Please check if the API URL is correct and the server is accessible.`);
          } else if (error.message.includes('timeout')) {
            console.error(`⏰ Timeout error: The API at ${balanceUrl} took too long to respond.`);
          } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
            console.error(`🔒 SSL/Certificate error: There's an issue with the SSL certificate at ${balanceUrl}.`);
          }
        }
      }

    } else if (provider.http_method === 'GET') {
      try {
        const balanceAction = provider.balance_action || 'balance';
        const getBalanceUrl = `${balanceUrl}?key=${encodeURIComponent(apiKey)}&action=${balanceAction}`;
        console.log(`🌐 Checking balance using GET method: ${getBalanceUrl}`);

        const response = await retryApiCall(async () => {
          return await fetchWithTimeout(getBalanceUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
          });
        });

        if (response.ok) {
          const responseText = await response.text();
          console.log(`📄 GET Response (${response.status}):`, responseText.substring(0, 200));

          try {
            const data = JSON.parse(responseText);
            if (data.balance !== undefined || data.current_balance !== undefined) {
              balanceData = data;
              console.log(`✅ GET balance check successful:`, balanceData);
            } else {
              console.log(`⚠️ GET response doesn't contain balance field:`, data);
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse GET response as JSON:`, parseError);
            console.log(`Raw response:`, responseText);
          }
        } else {
          console.error(`❌ GET request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ GET balance check failed for ${balanceUrl}:`, error);

        if (error instanceof Error) {
          if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
            console.error(`🌐 Network error: Unable to connect to ${balanceUrl}. Please check if the API URL is correct and the server is accessible.`);
          } else if (error.message.includes('timeout')) {
            console.error(`⏰ Timeout error: The API at ${balanceUrl} took too long to respond.`);
          } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
            console.error(`🔒 SSL/Certificate error: There's an issue with the SSL certificate at ${balanceUrl}.`);
          }
        }
      }
    } else {
      console.log(`⚠️ No HTTP method configured, trying both POST and GET methods`);

      try {
        console.log(`🌐 Trying POST method as fallback`);

        const formData = new FormData();
        formData.append('key', apiKey);
        formData.append('action', provider.balance_action || 'balance');

        const response = await retryApiCall(async () => {
          return await fetchWithTimeout(balanceUrl, {
            method: 'POST',
            body: formData
          });
        });

        if (response.ok) {
          const responseText = await response.text();
          console.log(`📄 POST Response (${response.status}):`, responseText.substring(0, 200));

          try {
            const data = JSON.parse(responseText);
            if (data.balance !== undefined || data.current_balance !== undefined) {
              balanceData = data;
              console.log(`✅ POST balance check successful:`, balanceData);
            } else {
              console.log(`⚠️ POST response doesn't contain balance field:`, data);
            }
          } catch (parseError) {
            console.error(`❌ Failed to parse POST response as JSON:`, parseError);
            console.log(`Raw response:`, responseText);
          }
        } else {
          console.error(`❌ POST request failed with status ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ POST balance check failed for ${balanceUrl}:`, error);
      }

      if (!balanceData) {
        try {
          const balanceAction = provider.balance_action || 'balance';
          const getBalanceUrl = `${balanceUrl}?key=${encodeURIComponent(apiKey)}&action=${balanceAction}`;
          console.log(`🌐 Trying GET method as fallback: ${getBalanceUrl}`);

          const response = await retryApiCall(async () => {
            return await fetchWithTimeout(getBalanceUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          });

          if (response.ok) {
            const responseText = await response.text();
            console.log(`📄 GET Response (${response.status}):`, responseText.substring(0, 200));

            try {
              const data = JSON.parse(responseText);
              if (data.balance !== undefined || data.current_balance !== undefined) {
                balanceData = data;
                console.log(`✅ GET balance check successful:`, balanceData);
              } else {
                console.log(`⚠️ GET response doesn't contain balance field:`, data);
              }
            } catch (parseError) {
              console.error(`❌ Failed to parse GET response as JSON:`, parseError);
              console.log(`Raw response:`, responseText);
            }
          } else {
            console.error(`❌ GET request failed with status ${response.status}`);
          }
        } catch (error) {
          console.error(`❌ GET balance check failed for ${balanceUrl}:`, error);
        }
      }
    }

    if (!balanceData) {
      console.error(`❌ No balance data received for provider ${provider.name} (ID: ${provider.id})`);
      console.error(`   API URL: ${provider.api_url}`);
      console.error(`   Balance Endpoint: ${provider.balance_endpoint || 'Not set'}`);
      console.error(`   API Key: ${provider.api_key?.substring(0, 3)}***`);

      return NextResponse.json(
        {
          error: `Failed to fetch balance from provider ${provider.name}. Please check API credentials and endpoint configuration.`,
          success: false,
          data: null,
          debug: {
            providerId: provider.id,
            providerName: provider.name,
            apiUrlRaw: provider.api_url,
            balanceEndpointRaw: provider.balance_endpoint,
            apiUrl: apiUrlSan,
            balanceEndpoint: balanceEndpointSan || null,
            balanceUrl: balanceUrl,
            httpMethod: provider.http_method,
            balanceAction: provider.balance_action,
            hasApiKey: !!provider.api_key,
            hasBalanceEndpoint: !!provider.balance_endpoint
          }
        },
        { status: 500 }
      );
    }

    const formattedBalance = {
      balance: parseFloat(balanceData.balance || '0'),
      currency: balanceData.currency || 'USD',
      provider: provider.name,
      providerId: provider.id,
      lastChecked: new Date().toISOString()
    };

    try {
      await db.apiProviders.update({
        where: { id: provider.id },
        data: {
          current_balance: formattedBalance.balance,
          balance_last_updated: new Date()
        }
      });
      console.log(`💾 Balance cached in database for ${provider.name}: $${formattedBalance.balance}`);
    } catch (dbError) {
      console.error(`❌ Failed to cache balance in database for ${provider.name}:`, dbError);
    }

    console.log(`✅ Balance check completed for ${provider.name}:`, formattedBalance);

    return NextResponse.json({
      success: true,
      data: formattedBalance,
      error: null
    });

  } catch (error) {
    console.error('❌ Error in balance check:', error);
    return NextResponse.json(
      {
        error: `Failed to check balance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
