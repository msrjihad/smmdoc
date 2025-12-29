import { useEffect, useRef, useState } from 'react';

interface TicketMessage {
  id: string;
  content: string;
  author: string;
  authorRole?: 'user' | 'admin';
  type?: 'customer' | 'staff' | 'system';
  createdAt: string;
  userImage?: string;
  attachments?: any[];
}

interface TicketDetails {
  id: string;
  messages: TicketMessage[];
  lastUpdated: string;
  [key: string]: any;
}

export const useTicketPolling = <T extends TicketDetails>(
  ticketId: string | null,
  ticketDetails: T | null,
  setTicketDetails: (details: T) => void,
  interval: number = 5000,
  apiEndpoint: 'admin' | 'user' = 'admin'
) => {
  const [isPolling, setIsPolling] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [hasStatusChange, setHasStatusChange] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<string>('');
  const lastStatusRef = useRef<string>('');

  const pollTicketUpdates = async () => {
    if (!ticketId) return;

    try {
      setIsPolling(true);
      const apiUrl = apiEndpoint === 'admin' 
        ? `/api/admin/tickets/${ticketId}` 
        : `/api/support-tickets/${ticketId}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error('Failed to fetch ticket updates');
      }

      const result = await response.json();
      const updatedTicket: T = apiEndpoint === 'admin' ? result.ticket : result;
      const currentMessageCount = updatedTicket.messages?.length || 0;
      const currentStatus = updatedTicket.status;
      const hasUpdates = updatedTicket.lastUpdated !== lastUpdateRef.current;

      if (hasUpdates) {
        if (currentMessageCount > lastMessageCount) {
          setHasNewMessages(true);
        }
        if (currentStatus !== lastStatusRef.current && lastStatusRef.current !== '') {
          setHasStatusChange(true);
        }

        setLastMessageCount(currentMessageCount);
        lastUpdateRef.current = updatedTicket.lastUpdated;
        lastStatusRef.current = currentStatus;
        if (apiEndpoint === 'admin') {
          const enhancedData = {
            ...updatedTicket,
            userInfo: {
              ...updatedTicket.userInfo,
              fullName: updatedTicket.userInfo?.name || 'N/A',
              username: updatedTicket.userInfo?.username,
              phone: 'N/A',
              company: 'N/A',
              address: 'N/A',
              registeredAt: 'N/A',
            }
          };
          setTicketDetails(enhancedData);
        } else {
          setTicketDetails(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error polling ticket updates:', error);
    } finally {
      setIsPolling(false);
    }
  };
  const startPolling = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(pollTicketUpdates, interval);
  };
  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const markMessagesAsRead = () => {
    setHasNewMessages(false);
  };
  const markStatusChangeAsRead = () => {
    setHasStatusChange(false);
  };
  useEffect(() => {
    if (ticketDetails) {
      setLastMessageCount(ticketDetails.messages?.length || 0);
      lastUpdateRef.current = ticketDetails.lastUpdated;
      lastStatusRef.current = ticketDetails.status || '';
    }
  }, [ticketDetails]);
  useEffect(() => {
    if (ticketId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [ticketId, interval]);
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    isPolling,
    hasNewMessages,
    hasStatusChange,
    markMessagesAsRead,
    markStatusChangeAsRead,
    startPolling,
    stopPolling,
    pollTicketUpdates
  };
};

export default useTicketPolling;