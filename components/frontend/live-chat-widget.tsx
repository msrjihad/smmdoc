'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  FaComment,
  FaFacebookMessenger,
  FaTimes,
  FaWhatsapp,
} from 'react-icons/fa';
import { RiTelegramFill } from 'react-icons/ri';

interface LiveChatSettings {
  enabled: boolean;
  hoverTitle: string;
  socialMediaEnabled: boolean;
  messengerEnabled: boolean;
  messengerUrl: string;
  whatsappEnabled: boolean;
  whatsappNumber: string;
  telegramEnabled: boolean;
  telegramUsername: string;
  tawkToEnabled: boolean;
  tawkToWidgetCode: string;
  visibility: string;
}

export default function LiveChatWidget() {
  const { data: session, status } = useSession();
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [liveChatSettings, setLiveChatSettings] = useState<LiveChatSettings>({
    enabled: false,
    hoverTitle: 'Contact Support',
    socialMediaEnabled: false,
    messengerEnabled: false,
    messengerUrl: '',
    whatsappEnabled: false,
    whatsappNumber: '',
    telegramEnabled: false,
    telegramUsername: '',
    tawkToEnabled: false,
    tawkToWidgetCode: '',
    visibility: 'all',
  });
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [generalWhatsAppNumber, setGeneralWhatsAppNumber] = useState<string>('');

  useEffect(() => {
    const fetchLiveChatSettings = async () => {
      try {
        const response = await fetch('/api/public/integration-settings/live-chat');
        if (response.ok) {
          const settings = await response.json();
          setLiveChatSettings(settings);
          setIsSettingsLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching live chat settings:', error);
        setIsSettingsLoaded(true);
      }
    };

    fetchLiveChatSettings();
  }, []);

  useEffect(() => {
    if (isSettingsLoaded && liveChatSettings.tawkToEnabled && liveChatSettings.tawkToWidgetCode) {
      const isAuthenticated = !!(status === 'authenticated' && session?.user);
      const isLoading = status === 'loading';
      
      let shouldShow = false;
      
      if (liveChatSettings.visibility === 'all') {
        shouldShow = true;
      } else if (liveChatSettings.visibility === 'signed-in') {
        shouldShow = isAuthenticated;
      } else if (liveChatSettings.visibility === 'not-logged-in') {
        shouldShow = !isAuthenticated && !isLoading;
      } else if (liveChatSettings.visibility === 'homepage' && typeof window !== 'undefined' && window.location.pathname === '/') {
        shouldShow = true;
      } else if (liveChatSettings.visibility === 'specific' && typeof window !== 'undefined' && window.location.pathname.includes('/specific')) {
        shouldShow = true;
      }
      
      if (!shouldShow) {
        try {
          const existingScript = document.querySelector('script[src*="embed.tawk.to"]');
          if (existingScript && existingScript.parentNode) {
            existingScript.remove();
          }
        } catch (error) {
          console.warn('Error removing Tawk.to script:', error);
        }
        return;
      }
      
      try {
        const existingScript = document.querySelector('script[src*="embed.tawk.to"]');
        if (existingScript && existingScript.parentNode) {
          existingScript.remove();
        }
      } catch (error) {
        console.warn('Error removing existing Tawk.to script:', error);
      }
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = 'https://embed.tawk.to/66e0962dea492f34bc10c2e9/1i7ekl9at';
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      
      if (!(window as any).Tawk_API) {
        (window as any).Tawk_API = {};
        (window as any).Tawk_LoadStart = new Date();
      }
      
      document.head.appendChild(script);
      
      return () => {
        try {
          const existingScript = document.querySelector('script[src*="embed.tawk.to"]');
          if (existingScript && existingScript.parentNode) {
            existingScript.remove();
          }
        } catch (error) {
          console.warn('Error removing Tawk.to script in cleanup:', error);
        }
      };
    }
  }, [isSettingsLoaded, liveChatSettings.tawkToEnabled, liveChatSettings.tawkToWidgetCode, liveChatSettings.visibility, session, status]);

  useEffect(() => {
    const fetchGeneralWhatsApp = async () => {
      try {
        const response = await fetch('/api/public/general-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.generalSettings?.whatsappNumber) {
            setGeneralWhatsAppNumber(data.generalSettings.whatsappNumber);
          }
        }
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error);
      }
    };
    fetchGeneralWhatsApp();
  }, []);

  const toggleChat = () => {
    setIsChatExpanded(!isChatExpanded);
  };

  const handleWhatsApp = () => {
    const whatsappNumber = liveChatSettings.whatsappNumber || generalWhatsAppNumber;
    const whatsappUrl = whatsappNumber && whatsappNumber.trim() !== ''
      ? `https://wa.me/${whatsappNumber.replace(/[^\d+]/g, '').replace(/^\+/, '')}`
      : '#';
    window.open(whatsappUrl, '_blank');
  };

  const handleTelegram = () => {
    const telegramUrl = liveChatSettings.telegramUsername
      ? `https://t.me/${liveChatSettings.telegramUsername.replace('@', '')}`
      : 'https://t.me/Smmdoc';
    window.open(telegramUrl, '_blank');
  };

  const handleMessenger = () => {
    const messengerUrl = liveChatSettings.messengerUrl || 'https://m.me/smmdocbd';
    window.open(messengerUrl, '_blank');
  };

  if (!isSettingsLoaded || (!liveChatSettings.enabled && !liveChatSettings.socialMediaEnabled)) {
    return null;
  }

  const isAuthenticated = !!(status === 'authenticated' && session?.user);
  const isLoading = status === 'loading';
  
  let shouldShowChatMenu = false;
  
  if (liveChatSettings.visibility === 'all') {
    shouldShowChatMenu = true;
  } else if (liveChatSettings.visibility === 'signed-in') {
    shouldShowChatMenu = isAuthenticated;
  } else if (liveChatSettings.visibility === 'not-logged-in') {
    shouldShowChatMenu = !isAuthenticated && !isLoading;
  } else if (liveChatSettings.visibility === 'homepage' && typeof window !== 'undefined' && window.location.pathname === '/') {
    shouldShowChatMenu = true;
  } else if (liveChatSettings.visibility === 'specific' && typeof window !== 'undefined' && window.location.pathname.includes('/specific')) {
    shouldShowChatMenu = true;
  }
  
  if (!shouldShowChatMenu) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {liveChatSettings.whatsappEnabled && (
        <div
          className={`transition-all duration-300 relative group ${
            isChatExpanded
              ? 'opacity-100 transform translate-y-0 mb-3'
              : 'opacity-0 transform translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={handleWhatsApp}
            className="inline-flex items-center justify-center w-14 h-14 bg-green-500 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-green-600 transition-all duration-300 hover:-translate-y-1"
            aria-label="Contact via WhatsApp"
          >
            <FaWhatsapp className="w-7 h-7" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
              WhatsApp
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      {liveChatSettings.telegramEnabled && (
        <div
          className={`transition-all duration-300 relative group ${
            isChatExpanded
              ? 'opacity-100 transform translate-y-0 mb-3'
              : 'opacity-0 transform translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={handleTelegram}
            className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all duration-300 hover:-translate-y-1"
            aria-label="Contact via Telegram"
          >
            <RiTelegramFill className="w-7 h-7" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
              Telegram
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      {liveChatSettings.messengerEnabled && (
        <div
          className={`transition-all duration-300 relative group ${
            isChatExpanded
              ? 'opacity-100 transform translate-y-0 mb-3'
              : 'opacity-0 transform translate-y-4 pointer-events-none mb-0'
          }`}
        >
          <button
            onClick={handleMessenger}
            className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-300 hover:-translate-y-1"
            aria-label="Contact via Facebook Messenger"
          >
            <FaFacebookMessenger className="w-7 h-7" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            <div className="bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
              Messenger
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        </div>
      )}

      <div className="relative group">
        <button
          onClick={toggleChat}
          className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white rounded-full shadow-lg hover:shadow-xl hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1 ${
            isChatExpanded ? 'rotate-180' : 'rotate-0'
          }`}
          aria-label={isChatExpanded ? 'Close chat menu' : 'Open chat menu'}
        >
          {isChatExpanded ? (
            <FaTimes className="w-6 h-6" />
          ) : (
            <FaComment className="w-6 h-6" />
          )}
        </button>
        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
          <div className="bg-gray-900 text-white text-sm px-3 py-1 rounded-lg whitespace-nowrap">
            {isChatExpanded ? 'Close' : liveChatSettings.hoverTitle}
            <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
