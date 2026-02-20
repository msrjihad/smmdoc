import { db } from '@/lib/db';

interface TicketSettings {
  ticketSystemEnabled: boolean;
  maxPendingTickets: string;
}

const DEFAULT_TICKET_SETTINGS: TicketSettings = {
  ticketSystemEnabled: true,
  maxPendingTickets: '3',
};

let cachedTicketSettings: TicketSettings | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000;

export async function getTicketSettings(bypassCache = false): Promise<TicketSettings> {
  const now = Date.now();

  if (!bypassCache && cachedTicketSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedTicketSettings;
  }

  try {
    const settings = await db.ticketSettings.findFirst();
    if (settings) {
      cachedTicketSettings = {
        ticketSystemEnabled: settings.ticketSystemEnabled ?? DEFAULT_TICKET_SETTINGS.ticketSystemEnabled,
        maxPendingTickets: settings.maxPendingTickets || DEFAULT_TICKET_SETTINGS.maxPendingTickets,
      };
      lastFetchTime = now;
      return cachedTicketSettings;
    }
  } catch (error) {
    console.warn('Failed to fetch ticket settings from database:', error);
    throw error;
  }

  cachedTicketSettings = { ...DEFAULT_TICKET_SETTINGS };
  lastFetchTime = now;
  return cachedTicketSettings;
}

export function clearTicketSettingsCache(): void {
  cachedTicketSettings = null;
  lastFetchTime = 0;
}