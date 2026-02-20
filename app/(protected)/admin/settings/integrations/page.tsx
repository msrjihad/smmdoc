'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaBell,
  FaCheck,
  FaChartLine,
  FaComments,
  FaEnvelope,
  FaPlug,
  FaShieldAlt,
  FaTimes,
} from 'react-icons/fa';

const ButtonLoader = () => <div className="loading-spinner"></div>;

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheck className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

const Switch = ({ checked, onCheckedChange, onClick, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`switch ${checked ? 'switch-checked' : 'switch-unchecked'}`}
  >
    <span className="switch-thumb" />
  </button>
);

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
  visibility: 'all' | 'not-logged-in' | 'signed-in';
}

interface AnalyticsSettings {
  enabled: boolean;
  googleAnalyticsEnabled: boolean;
  googleAnalyticsCode: string;
  googleAnalyticsVisibility: 'all' | 'not-logged-in' | 'signed-in';
  facebookPixelEnabled: boolean;
  facebookPixelCode: string;
  facebookPixelVisibility: 'all' | 'not-logged-in' | 'signed-in';
  gtmEnabled: boolean;
  gtmCode: string;
  gtmVisibility: 'all' | 'not-logged-in' | 'signed-in';
}

interface NotificationSettings {
  pushNotificationsEnabled: boolean;
  oneSignalCode: string;
  oneSignalAppId: string;
  oneSignalRestApiKey: string;
  oneSignalVisibility: 'all' | 'not-logged-in' | 'signed-in';
  userNotifications: {
    welcome: boolean;
    apiKeyChanged: boolean;
    orderStatusChanged: boolean;
    newService: boolean;
    serviceUpdates: boolean;
  };
  adminNotifications: {
    apiBalanceAlerts: boolean;
    supportTickets: boolean;
    newMessages: boolean;
    newManualServiceOrders: boolean;
    failOrders: boolean;
    refillRequests: boolean;
    cancelRequests: boolean;
    newUsers: boolean;
    userActivityLogs: boolean;
    pendingTransactions: boolean;
    apiSyncLogs: boolean;
    newChildPanelOrders: boolean;
  };
  pushUserNotifications: {
    welcome: boolean;
    apiKeyChanged: boolean;
    orderStatusChanged: boolean;
    newService: boolean;
    serviceUpdates: boolean;
    transactionAlert: boolean;
    transferFunds: boolean;
    affiliateWithdrawals: boolean;
    supportTickets: boolean;
    contactMessages: boolean;
    blogPost: boolean;
    announcement: boolean;
  };
  pushAdminNotifications: {
    apiBalanceAlerts: boolean;
    supportTickets: boolean;
    newMessages: boolean;
    newManualServiceOrders: boolean;
    failOrders: boolean;
    refillRequests: boolean;
    cancelRequests: boolean;
    newUsers: boolean;
    userActivityLogs: boolean;
    pendingTransactions: boolean;
    apiSyncLogs: boolean;
    newChildPanelOrders: boolean;
    announcement: boolean;
  };
}

interface ReCAPTCHASettings {
  enabled: boolean;
  version: 'v2' | 'v3';
  v2: {
    siteKey: string;
    secretKey: string;
  };
  v3: {
    siteKey: string;
    secretKey: string;
    threshold: number;
  };
  enabledForms: {
    signUp: boolean;
    signIn: boolean;
    contact: boolean;
    supportTicket: boolean;
    contactSupport: boolean;
  };
}

const IntegrationPage = () => {
  const { appName } = useAppNameWithFallback();

  const currentUser = useCurrentUser();

  useEffect(() => {
    setPageTitle('Integrations', appName);
  }, [appName]);

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [liveChatLoading, setLiveChatLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [recaptchaLoading, setRecaptchaLoading] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [liveChatSettings, setLiveChatSettings] = useState<LiveChatSettings>({
    enabled: false,
    hoverTitle: 'Chat with us',
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

  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings>({
    enabled: false,
    googleAnalyticsEnabled: false,
    googleAnalyticsCode: '',
    googleAnalyticsVisibility: 'all',
    facebookPixelEnabled: false,
    facebookPixelCode: '',
    facebookPixelVisibility: 'all',
    gtmEnabled: false,
    gtmCode: '',
    gtmVisibility: 'all',
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    pushNotificationsEnabled: false,
    oneSignalCode: '',
    oneSignalAppId: '',
    oneSignalRestApiKey: '',
    oneSignalVisibility: 'all',
    userNotifications: {
      welcome: false,
      apiKeyChanged: false,
      orderStatusChanged: false,
      newService: false,
      serviceUpdates: false,
    },
    adminNotifications: {
      apiBalanceAlerts: false,
      supportTickets: false,
      newMessages: false,
      newManualServiceOrders: false,
      failOrders: false,
      refillRequests: false,
      cancelRequests: false,
      newUsers: false,
      userActivityLogs: false,
      pendingTransactions: false,
      apiSyncLogs: false,
      newChildPanelOrders: false,
    },
    pushUserNotifications: {
      welcome: false,
      apiKeyChanged: false,
      orderStatusChanged: false,
      newService: false,
      serviceUpdates: false,
      transactionAlert: false,
      transferFunds: false,
      affiliateWithdrawals: false,
      supportTickets: false,
      contactMessages: false,
      blogPost: false,
      announcement: false,
    },
    pushAdminNotifications: {
      apiBalanceAlerts: false,
      supportTickets: false,
      newMessages: false,
      newManualServiceOrders: false,
      failOrders: false,
      refillRequests: false,
      cancelRequests: false,
      newUsers: false,
      userActivityLogs: false,
      pendingTransactions: false,
      apiSyncLogs: false,
      newChildPanelOrders: false,
      announcement: false,
    },
  });

  const [recaptchaSettings, setRecaptchaSettings] = useState<ReCAPTCHASettings>({
    enabled: true,
    version: 'v2',
    v2: {
      siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
      secretKey: '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe',
    },
    v3: {
      siteKey: '',
      secretKey: '',
      threshold: 0.5,
    },
    enabledForms: {
      signUp: true,
      signIn: true,
      contact: true,
      supportTicket: true,
      contactSupport: true,
    },
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsPageLoading(true);
        console.log('🔄 Loading integration settings...');

        const response = await fetch('/api/admin/integration-settings');
        console.log('📡 API Response status:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log('📦 API Response data:', data);

          if (data.success && data.integrationSettings) {
            const settings = data.integrationSettings;
            console.log('⚙️ Integration settings loaded:', settings);

            setRecaptchaSettings({
              enabled: settings.recaptchaEnabled,
              version: settings.recaptchaVersion,
              v2: {
                siteKey: settings.v2?.siteKey || '',
                secretKey: settings.v2?.secretKey || '',
              },
              v3: {
                siteKey: settings.v3?.siteKey || '',
                secretKey: settings.v3?.secretKey || '',
                threshold: settings.v3?.threshold || 0.5,
              },
              enabledForms: {
                signUp: settings.recaptchaSignUp,
                signIn: settings.recaptchaSignIn,
                contact: settings.recaptchaContact,
                supportTicket: settings.recaptchaSupportTicket,
                contactSupport: settings.recaptchaContactSupport,
              },
            });

            setLiveChatSettings({
              enabled: settings.liveChatEnabled,
              hoverTitle: settings.liveChatHoverTitle,
              socialMediaEnabled: settings.liveChatSocialEnabled,
              messengerEnabled: settings.liveChatMessengerEnabled,
              messengerUrl: settings.liveChatMessengerUrl || '',
              whatsappEnabled: settings.liveChatWhatsappEnabled,
              whatsappNumber: settings.liveChatWhatsappNumber || '',
              telegramEnabled: settings.liveChatTelegramEnabled,
              telegramUsername: settings.liveChatTelegramUsername || '',
              tawkToEnabled: settings.liveChatTawkToEnabled,
              tawkToWidgetCode: settings.liveChatTawkToCode || '',
              visibility: settings.liveChatVisibility,
            });

            setAnalyticsSettings({
              enabled: settings.analyticsEnabled,
              googleAnalyticsEnabled: settings.googleAnalyticsEnabled,
              googleAnalyticsCode: settings.googleAnalyticsCode || '',
              googleAnalyticsVisibility: settings.googleAnalyticsVisibility,
              facebookPixelEnabled: settings.facebookPixelEnabled,
              facebookPixelCode: settings.facebookPixelCode || '',
              facebookPixelVisibility: settings.facebookPixelVisibility,
              gtmEnabled: settings.gtmEnabled,
              gtmCode: settings.gtmCode || '',
              gtmVisibility: settings.gtmVisibility,
            });

            setNotificationSettings({
              pushNotificationsEnabled: settings.pushNotificationsEnabled,
              oneSignalCode: settings.oneSignalCode || '',
              oneSignalAppId: settings.oneSignalAppId || '',
              oneSignalRestApiKey: settings.oneSignalRestApiKey || '',
              oneSignalVisibility: settings.oneSignalVisibility,
              userNotifications: {
                welcome: settings.userNotifWelcome,
                apiKeyChanged: settings.userNotifApiKeyChanged,
                orderStatusChanged: settings.userNotifOrderStatusChanged,
                newService: settings.userNotifNewService,
                serviceUpdates: settings.userNotifServiceUpdates,
              },
              adminNotifications: {
                apiBalanceAlerts: settings.adminNotifApiBalanceAlerts,
                supportTickets: settings.adminNotifSupportTickets,
                newMessages: settings.adminNotifNewMessages,
                newManualServiceOrders: settings.adminNotifNewManualServiceOrders,
                failOrders: settings.adminNotifFailOrders,
                refillRequests: settings.adminNotifNewManualRefillRequests,
                cancelRequests: settings.adminNotifNewManualCancelRequests,
                newUsers: settings.adminNotifNewUsers,
                userActivityLogs: settings.adminNotifUserActivityLogs,
                pendingTransactions: settings.adminNotifPendingTransactions,
                apiSyncLogs: settings.adminNotifApiSyncLogs,
                newChildPanelOrders: settings.adminNotifNewChildPanelOrders,
              },
              pushUserNotifications: {
                welcome: settings.userNotifWelcome || false,
                apiKeyChanged: settings.userNotifApiKeyChanged || false,
                orderStatusChanged: settings.userNotifOrderStatusChanged || false,
                newService: settings.userNotifNewService || false,
                serviceUpdates: settings.userNotifServiceUpdates || false,
                transactionAlert: settings.userNotifTransactionAlert || false,
                transferFunds: settings.userNotifTransferFunds || false,
                affiliateWithdrawals: settings.userNotifAffiliateWithdrawals || false,
                supportTickets: settings.userNotifSupportTickets || false,
                contactMessages: settings.userNotifContactMessages || false,
                blogPost: settings.userNotifBlogPost || false,
                announcement: settings.userNotifAnnouncement || false,
              },
              pushAdminNotifications: {
                apiBalanceAlerts: settings.adminNotifApiBalanceAlerts || false,
                supportTickets: settings.adminNotifSupportTickets || false,
                newMessages: settings.adminNotifNewMessages || false,
                newManualServiceOrders: settings.adminNotifNewManualServiceOrders || false,
                failOrders: settings.adminNotifFailOrders || false,
                refillRequests: settings.adminNotifNewManualRefillRequests || false,
                cancelRequests: settings.adminNotifNewManualCancelRequests || false,
                newUsers: settings.adminNotifNewUsers || false,
                userActivityLogs: settings.adminNotifUserActivityLogs || false,
                pendingTransactions: settings.adminNotifPendingTransactions || false,
                apiSyncLogs: settings.adminNotifApiSyncLogs || false,
                newChildPanelOrders: settings.adminNotifNewChildPanelOrders || false,
                announcement: settings.adminNotifAnnouncement || false,
              },
            });
          }
        } else {
          console.error('❌ API request failed:', response.status, response.statusText);
          showToast('Failed to load integration settings', 'error');
        }
      } catch (error) {
        console.error('💥 Error loading integration settings:', error);
        showToast('Error loading integration settings', 'error');
      } finally {
        console.log('✅ Loading complete, setting isPageLoading to false');
        setIsPageLoading(false);
      }
    };

    loadSettings();
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const saveLiveChatSettings = async () => {
    setLiveChatLoading(true);
    try {
      const response = await fetch('/api/admin/integration-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          integrationSettings: {
            liveChatEnabled: liveChatSettings.enabled,
            liveChatHoverTitle: liveChatSettings.hoverTitle,
            liveChatSocialEnabled: liveChatSettings.socialMediaEnabled,
            liveChatMessengerEnabled: liveChatSettings.messengerEnabled,
            liveChatMessengerUrl: liveChatSettings.messengerUrl,
            liveChatWhatsappEnabled: liveChatSettings.whatsappEnabled,
            liveChatWhatsappNumber: liveChatSettings.whatsappNumber,
            liveChatTelegramEnabled: liveChatSettings.telegramEnabled,
            liveChatTelegramUsername: liveChatSettings.telegramUsername,
            liveChatTawkToEnabled: liveChatSettings.tawkToEnabled,
            liveChatTawkToCode: liveChatSettings.tawkToWidgetCode,
            liveChatVisibility: liveChatSettings.visibility,
          }
        }),
      });

      if (response.ok) {
        (await import('@/lib/settings-invalidation')).dispatchSettingsInvalidated('integrations');
        showToast('Live Chat settings saved successfully!', 'success');
      } else {
        showToast('Failed to save Live Chat settings', 'error');
      }
    } catch (error) {
      console.error('Error saving Live Chat settings:', error);
      showToast('Error saving Live Chat settings', 'error');
    } finally {
      setLiveChatLoading(false);
    }
  };

  const saveAnalyticsSettings = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('/api/admin/integration-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          integrationSettings: {
            analyticsEnabled:
              analyticsSettings.googleAnalyticsEnabled ||
              analyticsSettings.facebookPixelEnabled ||
              analyticsSettings.gtmEnabled,
            googleAnalyticsEnabled: analyticsSettings.googleAnalyticsEnabled,
            googleAnalyticsCode: analyticsSettings.googleAnalyticsCode,
            googleAnalyticsVisibility: analyticsSettings.googleAnalyticsVisibility,
            facebookPixelEnabled: analyticsSettings.facebookPixelEnabled,
            facebookPixelCode: analyticsSettings.facebookPixelCode,
            facebookPixelVisibility: analyticsSettings.facebookPixelVisibility,
            gtmEnabled: analyticsSettings.gtmEnabled,
            gtmCode: analyticsSettings.gtmCode,
            gtmVisibility: analyticsSettings.gtmVisibility,
          }
        }),
      });

      if (response.ok) {
        (await import('@/lib/settings-invalidation')).dispatchSettingsInvalidated('integrations');
        showToast('Analytics settings saved successfully!', 'success');
      } else {
        showToast('Failed to save Analytics settings', 'error');
      }
    } catch (error) {
      console.error('Error saving Analytics settings:', error);
      showToast('Error saving Analytics settings', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const saveNotificationSettings = async () => {
    setNotificationsLoading(true);
    try {
      const getRes = await fetch('/api/admin/integration-settings');
      const existing = getRes.ok ? await getRes.json() : { integrationSettings: null };
      const current = existing?.success ? existing.integrationSettings : {};

      const response = await fetch('/api/admin/integration-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationSettings: {
            ...current,
            pushNotificationsEnabled: notificationSettings.pushNotificationsEnabled,
            oneSignalCode: notificationSettings.oneSignalCode,
            oneSignalAppId: notificationSettings.oneSignalAppId,
            oneSignalRestApiKey: notificationSettings.oneSignalRestApiKey,
            oneSignalVisibility: notificationSettings.oneSignalVisibility,
          },
        }),
      });

      if (response.ok) {
        (await import('@/lib/settings-invalidation')).dispatchSettingsInvalidated('integrations');
        showToast('Notification settings saved successfully!', 'success');
      } else {
        showToast('Failed to save notification settings', 'error');
      }
    } catch (error) {
      console.error('Error saving Notification settings:', error);
      showToast('Error saving notification settings', 'error');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const saveRecaptchaSettings = async () => {
    setRecaptchaLoading(true);
    try {
      if (recaptchaSettings.enabled) {
        if (recaptchaSettings.version === 'v2') {
          if (!recaptchaSettings.v2.siteKey?.trim() || !recaptchaSettings.v2.secretKey?.trim()) {
            showToast('Please configure ReCAPTCHA v2 Site Key and Secret Key before saving.', 'error');
            setRecaptchaLoading(false);
            return;
          }
        } else if (recaptchaSettings.version === 'v3') {
          if (!recaptchaSettings.v3.siteKey?.trim() || !recaptchaSettings.v3.secretKey?.trim()) {
            showToast('Please configure ReCAPTCHA v3 Site Key and Secret Key before saving.', 'error');
            setRecaptchaLoading(false);
            return;
          }
        }
      }

      const getRes = await fetch('/api/admin/integration-settings');
      const existing = getRes.ok ? await getRes.json() : { integrationSettings: null };
      const current = existing?.success ? existing.integrationSettings : {};

      const integrationSettings = {
        ...current,
        recaptchaEnabled: recaptchaSettings.enabled,
        recaptchaVersion: recaptchaSettings.version,
        recaptchaSiteKey: recaptchaSettings.version === 'v2' ? recaptchaSettings.v2.siteKey : recaptchaSettings.v3.siteKey,
        recaptchaSecretKey: recaptchaSettings.version === 'v2' ? recaptchaSettings.v2.secretKey : recaptchaSettings.v3.secretKey,
        v2: {
          siteKey: recaptchaSettings.v2.siteKey,
          secretKey: recaptchaSettings.v2.secretKey,
        },
        v3: {
          siteKey: recaptchaSettings.v3.siteKey,
          secretKey: recaptchaSettings.v3.secretKey,
          threshold: Math.max(0, Math.min(1, recaptchaSettings.v3.threshold ?? 0.5)),
        },
        recaptchaThreshold: Math.max(0, Math.min(1, recaptchaSettings.v3.threshold ?? 0.5)),
        recaptchaSignUp: recaptchaSettings.enabledForms.signUp,
        recaptchaSignIn: recaptchaSettings.enabledForms.signIn,
        recaptchaContact: recaptchaSettings.enabledForms.contact,
        recaptchaSupportTicket: recaptchaSettings.enabledForms.supportTicket,
        recaptchaContactSupport: recaptchaSettings.enabledForms.contactSupport,
      };

      const response = await fetch('/api/admin/integration-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationSettings }),
      });

      if (response.ok) {
        (await import('@/lib/settings-invalidation')).dispatchSettingsInvalidated('integrations');
        showToast('ReCAPTCHA settings saved successfully!', 'success');
      } else {
        showToast('Failed to save ReCAPTCHA settings', 'error');
      }
    } catch (error) {
      console.error('Error saving ReCAPTCHA settings:', error);
      showToast('Error saving ReCAPTCHA settings', 'error');
    } finally {
      setRecaptchaLoading(false);
    }
  };

  const saveIntegrationSettings = async () => {
    setIsLoading(true);
    try {

      if (recaptchaSettings.enabled) {
        if (recaptchaSettings.version === 'v2') {
          if (!recaptchaSettings.v2.siteKey || !recaptchaSettings.v2.secretKey) {
            showToast('Please configure ReCAPTCHA v2 Site Key and Secret Key before saving.', 'error');
            setIsLoading(false);
            return;
          }
        } else if (recaptchaSettings.version === 'v3') {
          if (!recaptchaSettings.v3.siteKey || !recaptchaSettings.v3.secretKey) {
            showToast('Please configure ReCAPTCHA v3 Site Key and Secret Key before saving.', 'error');
            setIsLoading(false);
            return;
          }
        }
      }

      const integrationSettings = {

        recaptchaEnabled: recaptchaSettings.enabled,
        recaptchaVersion: recaptchaSettings.version,

        recaptchaSiteKey: recaptchaSettings.version === 'v2' ? recaptchaSettings.v2.siteKey : recaptchaSettings.v3.siteKey,
        recaptchaSecretKey: recaptchaSettings.version === 'v2' ? recaptchaSettings.v2.secretKey : recaptchaSettings.v3.secretKey,

        v2: {
          siteKey: recaptchaSettings.v2.siteKey,
          secretKey: recaptchaSettings.v2.secretKey,
        },
        v3: {
          siteKey: recaptchaSettings.v3.siteKey,
          secretKey: recaptchaSettings.v3.secretKey,
          threshold: Math.max(0, Math.min(1, recaptchaSettings.v3.threshold ?? 0.5)),
        },
        recaptchaThreshold: Math.max(0, Math.min(1, recaptchaSettings.v3.threshold ?? 0.5)),
        recaptchaSignUp: recaptchaSettings.enabledForms.signUp,
        recaptchaSignIn: recaptchaSettings.enabledForms.signIn,
        recaptchaContact: recaptchaSettings.enabledForms.contact,
        recaptchaSupportTicket: recaptchaSettings.enabledForms.supportTicket,
        recaptchaContactSupport: recaptchaSettings.enabledForms.contactSupport,
      };

      const response = await fetch('/api/admin/integration-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationSettings }),
      });

      if (response.ok) {
        (await import('@/lib/settings-invalidation')).dispatchSettingsInvalidated('integrations');
        showToast('ReCAPTCHA settings saved successfully!', 'success');
      } else {
        showToast('Failed to save ReCAPTCHA settings', 'error');
      }
    } catch (error) {
      console.error('Error saving ReCAPTCHA settings:', error);
      showToast('Error saving ReCAPTCHA settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="flex justify-center">
            <div className="page-content">
              <div className="columns-1 md:columns-3 gap-6 space-y-6">
                <div className="card card-padding h-fit break-inside-avoid mb-6">
                  <div className="card-header">
                    <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                    <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-5 w-32 gradient-shimmer rounded mb-2" />
                        <div className="h-4 w-48 gradient-shimmer rounded" />
                      </div>
                      <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                    </div>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div className="form-group">
                        <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                        <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                            <div className="h-3 w-40 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                        </div>
                        <div className="form-group">
                          <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                          <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                            <div className="h-3 w-40 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                        </div>
                        <div className="form-group">
                          <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                          <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                            <div className="h-3 w-40 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                        </div>
                        <div className="form-group">
                          <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                          <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                            <div className="h-3 w-40 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                        </div>
                        <div className="form-group">
                          <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                          <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                </div>

                <div className="card card-padding h-fit break-inside-avoid mb-6">
                  <div className="card-header">
                    <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                    <div className="h-6 w-28 gradient-shimmer rounded ml-3" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-5 w-36 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-48 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                        </div>
                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          <div className="form-group">
                            <div className="h-4 w-40 gradient-shimmer rounded mb-2" />
                            <div className="h-32 w-full gradient-shimmer rounded-lg" />
                          </div>
                          <div className="form-group">
                            <div className="h-4 w-48 gradient-shimmer rounded mb-2" />
                            <div className="h-10 w-full gradient-shimmer rounded-lg" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-5 w-32 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-48 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                        </div>
                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          <div className="form-group">
                            <div className="h-4 w-36 gradient-shimmer rounded mb-2" />
                            <div className="h-32 w-full gradient-shimmer rounded-lg" />
                          </div>
                          <div className="form-group">
                            <div className="h-4 w-48 gradient-shimmer rounded mb-2" />
                            <div className="h-10 w-full gradient-shimmer rounded-lg" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-5 w-20 gradient-shimmer rounded mb-2" />
                            <div className="h-4 w-48 gradient-shimmer rounded" />
                          </div>
                          <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                        </div>
                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          <div className="form-group">
                            <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                            <div className="h-32 w-full gradient-shimmer rounded-lg" />
                          </div>
                          <div className="form-group">
                            <div className="h-4 w-48 gradient-shimmer rounded mb-2" />
                            <div className="h-10 w-full gradient-shimmer rounded-lg" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                </div>

                <div className="card card-padding h-fit break-inside-avoid mb-6">
                  <div className="card-header">
                    <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                    <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-5 w-36 gradient-shimmer rounded mb-2" />
                        <div className="h-4 w-48 gradient-shimmer rounded" />
                      </div>
                      <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                    </div>
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                      <div className="form-group">
                        <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>
                      <div className="form-group">
                        <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                        <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                      </div>
                      <div className="form-group">
                        <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                        <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                      </div>
                      <div className="form-group">
                        <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                        <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                      </div>
                      <div className="form-group">
                        <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                        <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                </div>

                <div className="card card-padding h-fit break-inside-avoid mb-6">
                  <div className="card-header">
                    <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                    <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-5 w-48 gradient-shimmer rounded mb-2" />
                          <div className="h-4 w-56 gradient-shimmer rounded" />
                        </div>
                        <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                      </div>
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                        <div className="form-group">
                          <div className="h-4 w-40 gradient-shimmer rounded mb-2" />
                          <div className="h-32 w-full gradient-shimmer rounded-lg" />
                        </div>
                        <div className="form-group">
                          <div className="h-4 w-48 gradient-shimmer rounded mb-2" />
                          <div className="h-10 w-full gradient-shimmer rounded-lg" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="h-5 w-40 gradient-shimmer rounded mb-2" />
                          <div className="h-4 w-48 gradient-shimmer rounded" />
                        </div>
                        <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="h-4 w-40 gradient-shimmer rounded" />
                            <div className="h-6 w-11 gradient-shimmer rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="h-4 w-40 gradient-shimmer rounded" />
                            <div className="h-6 w-11 gradient-shimmer rounded-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="page-content">
        <div className="justify-center">
          <div className="page-content">
            <div className="columns-1 md:columns-3 gap-6 space-y-6">
              <div className="card card-padding h-fit break-inside-avoid mb-6">
                <div className="card-header">
                  <div className="card-icon">
                    <FaComments />
                  </div>
                  <h3 className="card-title">Live Chat</h3>
                </div>

            <div className="space-y-4">
              <>
                <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Social Media</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enable social media chat integrations
                          </p>
                        </div>
                        <Switch
                          checked={liveChatSettings.socialMediaEnabled}
                          onClick={() =>
                            setLiveChatSettings(prev => ({
                              ...prev,
                              socialMediaEnabled: !prev.socialMediaEnabled,

                              tawkToEnabled: !prev.socialMediaEnabled ? false : prev.tawkToEnabled
                            }))
                          }
                          title="Toggle social media chat"
                        />
                      </div>

                      {liveChatSettings.socialMediaEnabled && (
                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          <div className="form-group">
                            <label className="form-label">Hover Title</label>
                            <input
                              type="text"
                              value={liveChatSettings.hoverTitle}
                              onChange={(e) =>
                                setLiveChatSettings(prev => ({ ...prev, hoverTitle: e.target.value }))
                              }
                              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              placeholder="Chat with us"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="form-label mb-1">Messenger</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Enable Facebook Messenger integration
                                </p>
                              </div>
                              <Switch
                                checked={liveChatSettings.messengerEnabled}
                                onClick={() =>
                                  setLiveChatSettings(prev => ({
                                    ...prev,
                                    messengerEnabled: !prev.messengerEnabled
                                  }))
                                }
                                title="Toggle Messenger"
                              />
                            </div>
                            {liveChatSettings.messengerEnabled && (
                              <div className="form-group">
                                <label className="form-label">Messenger URL</label>
                                <input
                                  type="text"
                                  value={liveChatSettings.messengerUrl}
                                  onChange={(e) =>
                                    setLiveChatSettings(prev => ({ ...prev, messengerUrl: e.target.value }))
                                  }
                                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="https://m.me/yourpage"
                                />
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="form-label mb-1">WhatsApp</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Enable WhatsApp chat integration
                                </p>
                              </div>
                              <Switch
                                checked={liveChatSettings.whatsappEnabled}
                                onClick={() =>
                                  setLiveChatSettings(prev => ({
                                    ...prev,
                                    whatsappEnabled: !prev.whatsappEnabled
                                  }))
                                }
                                title="Toggle WhatsApp"
                              />
                            </div>
                            {liveChatSettings.whatsappEnabled && (
                              <div className="form-group">
                                <label className="form-label">WhatsApp Number</label>
                                <input
                                  type="text"
                                  value={liveChatSettings.whatsappNumber}
                                  onChange={(e) =>
                                    setLiveChatSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))
                                  }
                                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="+1234567890"
                                />
                              </div>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <label className="form-label mb-1">Telegram</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Enable Telegram chat integration
                                </p>
                              </div>
                              <Switch
                                checked={liveChatSettings.telegramEnabled}
                                onClick={() =>
                                  setLiveChatSettings(prev => ({
                                    ...prev,
                                    telegramEnabled: !prev.telegramEnabled
                                  }))
                                }
                                title="Toggle Telegram"
                              />
                            </div>
                            {liveChatSettings.telegramEnabled && (
                              <div className="form-group">
                                <label className="form-label">Telegram Username</label>
                                <input
                                  type="text"
                                  value={liveChatSettings.telegramUsername}
                                  onChange={(e) =>
                                    setLiveChatSettings(prev => ({ ...prev, telegramUsername: e.target.value }))
                                  }
                                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  placeholder="@yourusername"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Tawk.to</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enable tawk.to free live chat widget
                          </p>
                        </div>
                        <Switch
                          checked={liveChatSettings.tawkToEnabled}
                          onClick={() =>
                            setLiveChatSettings(prev => ({
                              ...prev,
                              tawkToEnabled: !prev.tawkToEnabled,

                              socialMediaEnabled: !prev.tawkToEnabled ? false : prev.socialMediaEnabled
                            }))
                          }
                          title="Toggle tawk.to"
                        />
                      </div>

                      {liveChatSettings.tawkToEnabled && (
                        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                          <div className="form-group">
                            <label className="form-label">Widget Code</label>
                            <textarea
                              value={liveChatSettings.tawkToWidgetCode}
                              onChange={(e) =>
                                setLiveChatSettings(prev => ({ ...prev, tawkToWidgetCode: e.target.value }))
                              }
                              rows={6}
                              className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none font-mono text-sm"
                              placeholder="Paste your tawk.to widget code here..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Visibility</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Choose when to show the live chat widget
                        </p>
                        <select
                          value={liveChatSettings.visibility}
                          onChange={(e) =>
                            setLiveChatSettings(prev => ({ 
                              ...prev, 
                              visibility: e.target.value as 'all' | 'not-logged-in' | 'signed-in'
                            }))
                          }
                          className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="all">All pages</option>
                          <option value="not-logged-in">Not logged in</option>
                          <option value="signed-in">Signed in</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={saveLiveChatSettings}
                      disabled={liveChatLoading}
                      className="w-full btn btn-primary px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {liveChatLoading ? (
                        <>
                          Saving...
                        </>
                      ) : (
                        <>
                          Save Live Chat Settings
                        </>
                      )}
                    </button>
                  </div>
                </>
            </div>
          </div>
          <div className="card card-padding h-fit break-inside-avoid mb-6">
            <div className="card-header">
              <div className="card-icon">
                <FaChartLine />
              </div>
              <h3 className="card-title">Analytics</h3>
            </div>

            <div className="space-y-4">
              <>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="form-label mb-1">Google Analytics</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Enable Google Analytics tracking
                        </p>
                      </div>
                      <Switch
                        checked={analyticsSettings.googleAnalyticsEnabled}
                        onClick={() =>
                          setAnalyticsSettings(prev => ({
                            ...prev,
                            googleAnalyticsEnabled: !prev.googleAnalyticsEnabled
                          }))
                        }
                        title="Toggle Google Analytics"
                      />
                    </div>
                    {analyticsSettings.googleAnalyticsEnabled && (
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                        <div className="form-group">
                          <label className="form-label">Google Analytics Code</label>
                          <textarea
                            value={analyticsSettings.googleAnalyticsCode}
                            onChange={(e) =>
                              setAnalyticsSettings(prev => ({ ...prev, googleAnalyticsCode: e.target.value }))
                            }
                            rows={6}
                            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none font-mono text-sm"
                            placeholder="Paste your Google Analytics code here..."
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Visibility</label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Choose when to load Google Analytics
                          </p>
                          <select
                            value={analyticsSettings.googleAnalyticsVisibility}
                            onChange={(e) =>
                              setAnalyticsSettings(prev => ({ 
                                ...prev, 
                                googleAnalyticsVisibility: e.target.value as 'all' | 'not-logged-in' | 'signed-in'
                              }))
                            }
                            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="all">All pages</option>
                            <option value="not-logged-in">Not logged in</option>
                            <option value="signed-in">Signed in</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="form-label mb-1">Facebook Pixel</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Enable Facebook Pixel tracking
                        </p>
                      </div>
                      <Switch
                        checked={analyticsSettings.facebookPixelEnabled}
                        onClick={() =>
                          setAnalyticsSettings(prev => ({
                            ...prev,
                            facebookPixelEnabled: !prev.facebookPixelEnabled
                          }))
                        }
                        title="Toggle Facebook Pixel"
                      />
                    </div>
                    {analyticsSettings.facebookPixelEnabled && (
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                        <div className="form-group">
                          <label className="form-label">Facebook Pixel Code</label>
                          <textarea
                            value={analyticsSettings.facebookPixelCode}
                            onChange={(e) =>
                              setAnalyticsSettings(prev => ({ ...prev, facebookPixelCode: e.target.value }))
                            }
                            rows={6}
                            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none font-mono text-sm"
                            placeholder="Paste your Facebook Pixel code here..."
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Visibility</label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Choose when to load Facebook Pixel
                          </p>
                          <select
                            value={analyticsSettings.facebookPixelVisibility}
                            onChange={(e) =>
                              setAnalyticsSettings(prev => ({ 
                                ...prev, 
                                facebookPixelVisibility: e.target.value as 'all' | 'not-logged-in' | 'signed-in'
                              }))
                            }
                            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="all">All pages</option>
                            <option value="not-logged-in">Not logged in</option>
                            <option value="signed-in">Signed in</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="form-label mb-1">Google Tag Manager</label>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Enable Google Tag Manager
                        </p>
                      </div>
                      <Switch
                        checked={analyticsSettings.gtmEnabled}
                        onClick={() =>
                          setAnalyticsSettings(prev => ({
                            ...prev,
                            gtmEnabled: !prev.gtmEnabled
                          }))
                        }
                        title="Toggle Google Tag Manager"
                      />
                    </div>
                    {analyticsSettings.gtmEnabled && (
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                        <div className="form-group">
                          <label className="form-label">Google Tag Manager Code</label>
                          <textarea
                            value={analyticsSettings.gtmCode}
                            onChange={(e) =>
                              setAnalyticsSettings(prev => ({ ...prev, gtmCode: e.target.value }))
                            }
                            rows={6}
                            className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none font-mono text-sm"
                            placeholder="Paste your Google Tag Manager code here..."
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Visibility</label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Choose when to load Google Tag Manager
                          </p>
                          <select
                            value={analyticsSettings.gtmVisibility}
                            onChange={(e) =>
                              setAnalyticsSettings(prev => ({ 
                                ...prev, 
                                gtmVisibility: e.target.value as 'all' | 'not-logged-in' | 'signed-in'
                              }))
                            }
                            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                          >
                            <option value="all">All pages</option>
                            <option value="not-logged-in">Not logged in</option>
                            <option value="signed-in">Signed in</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={saveAnalyticsSettings}
                    disabled={analyticsLoading}
                    className="w-full btn btn-primary px-6 py-2.5 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {analyticsLoading ? (
                      <>
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Analytics Settings
                      </>
                    )}
                  </button>
                </div>
              </>
            </div>
          </div>
          <div className="card card-padding h-fit break-inside-avoid mb-6">
            <div className="card-header">
              <div className="card-icon">
                <FaShieldAlt />
              </div>
              <h3 className="card-title">ReCAPTCHA</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="form-label mb-1">Enable ReCAPTCHA</label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Protect forms from spam and abuse
                  </p>
                </div>
                <Switch
                  checked={recaptchaSettings.enabled}
                  onClick={() =>
                    setRecaptchaSettings(prev => ({
                      ...prev,
                      enabled: !prev.enabled
                    }))
                  }
                  title="Toggle ReCAPTCHA"
                />
              </div>
              <>
                  <div className="form-group">
                    <label className="form-label">ReCAPTCHA Version</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Get your Site Key and Secret Key from{' '}
                      <a
                        href="https://www.google.com/recaptcha/admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Google reCAPTCHA Admin
                      </a>
                    </p>
                    <select
                      value={recaptchaSettings.version}
                      onChange={(e) =>
                        setRecaptchaSettings(prev => ({ 
                          ...prev, 
                          version: e.target.value as 'v2' | 'v3'
                        }))
                      }
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="v2">reCAPTCHA v2</option>
                      <option value="v3">reCAPTCHA v3</option>
                    </select>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">ReCAPTCHA v2 Configuration</h4>
                      {recaptchaSettings.version === 'v2' && (!recaptchaSettings.v2.siteKey || !recaptchaSettings.v2.secretKey) && (
                        <div className="flex items-center text-amber-600 dark:text-amber-400">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium">Configuration Required</span>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">v2 Site Key</label>
                      <input
                        type="text"
                        value={recaptchaSettings.v2.siteKey}
                        onChange={(e) =>
                          setRecaptchaSettings(prev => ({ 
                            ...prev, 
                            v2: { ...prev.v2, siteKey: e.target.value }
                          }))
                        }
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter ReCAPTCHA v2 site key"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">v2 Secret Key</label>
                      <input
                        type="text"
                        value={recaptchaSettings.v2.secretKey}
                        onChange={(e) =>
                          setRecaptchaSettings(prev => ({ 
                            ...prev, 
                            v2: { ...prev.v2, secretKey: e.target.value }
                          }))
                        }
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter ReCAPTCHA v2 secret key"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">ReCAPTCHA v3 Configuration</h4>
                      {recaptchaSettings.version === 'v3' && (!recaptchaSettings.v3.siteKey || !recaptchaSettings.v3.secretKey) && (
                        <div className="flex items-center text-amber-600 dark:text-amber-400">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium">Configuration Required</span>
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">v3 Site Key</label>
                      <input
                        type="text"
                        value={recaptchaSettings.v3.siteKey}
                        onChange={(e) =>
                          setRecaptchaSettings(prev => ({ 
                            ...prev, 
                            v3: { ...prev.v3, siteKey: e.target.value }
                          }))
                        }
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter ReCAPTCHA v3 site key"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">v3 Secret Key</label>
                      <input
                        type="text"
                        value={recaptchaSettings.v3.secretKey}
                        onChange={(e) =>
                          setRecaptchaSettings(prev => ({ 
                            ...prev, 
                            v3: { ...prev.v3, secretKey: e.target.value }
                          }))
                        }
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Enter ReCAPTCHA v3 secret key"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">v3 Score Threshold</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Set the minimum score (0.0 to 1.0) required to pass verification
                      </p>
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={recaptchaSettings.v3.threshold}
                        onChange={(e) =>
                          setRecaptchaSettings(prev => ({ 
                            ...prev, 
                            v3: { ...prev.v3, threshold: parseFloat(e.target.value) || 0.5 }
                          }))
                        }
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="0.5"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Enable ReCAPTCHA for Forms</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Select which forms should have ReCAPTCHA protection
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center space-x-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                        <input
                          type="checkbox"
                          id="recaptcha-select-all"
                          checked={Object.values(recaptchaSettings.enabledForms).every(Boolean)}
                          onChange={(e) => {
                            const allSelected = e.target.checked;
                            setRecaptchaSettings(prev => ({
                              ...prev,
                              enabledForms: {
                                signUp: allSelected,
                                signIn: allSelected,
                                contact: allSelected,
                                supportTicket: allSelected,
                                contactSupport: allSelected,
                              }
                            }));
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="recaptcha-select-all" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                          Select All Forms
                        </label>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="recaptcha-signup"
                            checked={recaptchaSettings.enabledForms.signUp}
                            onChange={(e) =>
                              setRecaptchaSettings(prev => ({
                                ...prev,
                                enabledForms: { ...prev.enabledForms, signUp: e.target.checked }
                              }))
                            }
                            className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="recaptcha-signup" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            <span className="block">Sign Up</span>
                            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">/sign-up</span>
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="recaptcha-signin"
                            checked={recaptchaSettings.enabledForms.signIn}
                            onChange={(e) =>
                              setRecaptchaSettings(prev => ({
                                ...prev,
                                enabledForms: { ...prev.enabledForms, signIn: e.target.checked }
                              }))
                            }
                            className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="recaptcha-signin" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            <span className="block">Sign In</span>
                            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">/sign-in, Homepage</span>
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="recaptcha-contact"
                            checked={recaptchaSettings.enabledForms.contact}
                            onChange={(e) =>
                              setRecaptchaSettings(prev => ({
                                ...prev,
                                enabledForms: { ...prev.enabledForms, contact: e.target.checked }
                              }))
                            }
                            className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="recaptcha-contact" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            <span className="block">Contact</span>
                            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">/contact</span>
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="recaptcha-support-ticket"
                            checked={recaptchaSettings.enabledForms.supportTicket}
                            onChange={(e) =>
                              setRecaptchaSettings(prev => ({
                                ...prev,
                                enabledForms: { ...prev.enabledForms, supportTicket: e.target.checked }
                              }))
                            }
                            className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="recaptcha-support-ticket" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            <span className="block">Support Ticket</span>
                            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">/support-tickets (new ticket)</span>
                          </label>
                        </div>

                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="recaptcha-contact-support"
                            checked={recaptchaSettings.enabledForms.contactSupport}
                            onChange={(e) =>
                              setRecaptchaSettings(prev => ({
                                ...prev,
                                enabledForms: { ...prev.enabledForms, contactSupport: e.target.checked }
                              }))
                            }
                            className="w-4 h-4 mt-0.5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor="recaptcha-contact-support" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            <span className="block">Contact Support</span>
                            <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">/contact-support</span>
                          </label>
                        </div>
                      </div>
                      {!Object.values(recaptchaSettings.enabledForms).some(Boolean) && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            No forms selected. ReCAPTCHA will not be active on any forms.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={saveRecaptchaSettings}
                      disabled={recaptchaLoading}
                      className="w-full btn btn-primary px-6 py-2.5 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {recaptchaLoading ? (
                        <>
                          Saving...
                        </>
                      ) : (
                        <>
                          Save ReCAPTCHA Settings
                        </>
                      )}
                    </button>
                  </div>

                </>
            </div>
          </div>
          <div className="card card-padding h-fit break-inside-avoid mb-6">
            <div className="card-header">
              <div className="card-icon">
                <FaBell />
              </div>
              <h3 className="card-title">Notification</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1 max-w-[75%] pr-4">
                    <label className="form-label mb-1">Push Notifications (OneSignal)</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Enable OneSignal push notifications. Configure which notifications to send in{' '}
                      <Link href="/admin/settings/notifications" className="text-[var(--primary)] hover:underline">
                        Notification Settings
                      </Link>.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                  <Switch
                    checked={notificationSettings.pushNotificationsEnabled}
                    onClick={() =>
                      setNotificationSettings(prev => ({
                        ...prev,
                        pushNotificationsEnabled: !prev.pushNotificationsEnabled
                      }))
                    }
                    title="Toggle OneSignal push notifications"
                  />
                  </div>
                </div>
                {notificationSettings.pushNotificationsEnabled && (
                  <div className="space-y-6 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
                    <div className="form-group">
                      <label className="form-label">OneSignal Code</label>
                      <textarea
                        value={notificationSettings.oneSignalCode}
                        onChange={(e) =>
                          setNotificationSettings(prev => ({ ...prev, oneSignalCode: e.target.value }))
                        }
                        rows={6}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none font-mono text-sm"
                        placeholder="Paste your OneSignal Web SDK init code (script tag) here..."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">OneSignal App ID</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Required for server-side push. Found in OneSignal Dashboard → Settings → Keys &amp; IDs
                      </p>
                      <input
                        type="text"
                        value={notificationSettings.oneSignalAppId}
                        onChange={(e) =>
                          setNotificationSettings(prev => ({ ...prev, oneSignalAppId: e.target.value }))
                        }
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">REST API Key</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Required for server-side push. Found in OneSignal Dashboard → Settings → Keys &amp; IDs
                      </p>
                      <input
                        type="password"
                        value={notificationSettings.oneSignalRestApiKey}
                        onChange={(e) =>
                          setNotificationSettings(prev => ({ ...prev, oneSignalRestApiKey: e.target.value }))
                        }
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Your REST API Key"
                        autoComplete="off"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Visibility</label>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Choose when to load OneSignal notifications
                      </p>
                      <select
                        value={notificationSettings.oneSignalVisibility}
                        onChange={(e) =>
                          setNotificationSettings(prev => ({ 
                            ...prev, 
                            oneSignalVisibility: e.target.value as 'all' | 'not-logged-in' | 'signed-in'
                          }))
                        }
                        className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="all">All pages</option>
                        <option value="not-logged-in">Not logged in</option>
                        <option value="signed-in">Signed in</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={saveNotificationSettings}
                    disabled={notificationsLoading}
                    className="w-full btn btn-primary px-6 py-2.5 font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {notificationsLoading ? (
                      <>
                        Saving...
                      </>
                    ) : (
                      <>
                        Save Notification Settings
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationPage;