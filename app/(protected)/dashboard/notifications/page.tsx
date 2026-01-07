'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState } from 'react';
import {
  FaBell,
  FaCheck,
  FaTimes,
  FaUser,
} from 'react-icons/fa';

const NotificationPreferencesSkeleton = () => {
  return (
    <div className="card card-padding">
      <div className="card-header mb-6">
        <div className="h-10 w-10 gradient-shimmer rounded-lg" />
        <div className="h-6 w-40 gradient-shimmer rounded ml-3" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 w-48 gradient-shimmer rounded mb-2" />
              <div className="h-4 w-64 gradient-shimmer rounded" />
            </div>
            <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
          </div>
        ))}
        <div className="h-10 w-full gradient-shimmer rounded-lg" />
      </div>
    </div>
  );
};

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

const Switch = ({ checked, onCheckedChange, onClick, title, disabled }: any) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`switch ${checked ? 'switch-checked' : 'switch-unchecked'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span className="switch-thumb" />
  </button>
);

interface UserNotificationPreferences {
  welcomeEnabled: boolean;
  apiKeyChangedEnabled: boolean;
  orderStatusChangedEnabled: boolean;
  newServiceEnabled: boolean;
  serviceUpdatesEnabled: boolean;
  transactionAlertEnabled: boolean;
  transferFundsEnabled: boolean;
}

interface AdminNotificationSettings {
  welcomeEnabled: boolean;
  apiKeyChangedEnabled: boolean;
  orderStatusChangedEnabled: boolean;
  newServiceEnabled: boolean;
  serviceUpdatesEnabled: boolean;
  transactionAlertEnabled: boolean;
  transferFundsEnabled: boolean;
}

const NotificationPreferencesPage = () => {
  const { appName } = useAppNameWithFallback();
  const currentUser = useCurrentUser();

  useEffect(() => {
    setPageTitle('Notification Preferences', appName);
  }, [appName]);

  const [isSaving, setIsSaving] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [adminSettings, setAdminSettings] = useState<AdminNotificationSettings>({
    welcomeEnabled: false,
    apiKeyChangedEnabled: false,
    orderStatusChangedEnabled: false,
    newServiceEnabled: false,
    serviceUpdatesEnabled: false,
    transactionAlertEnabled: false,
    transferFundsEnabled: false,
  });

  const [userPreferences, setUserPreferences] = useState<UserNotificationPreferences>({
    welcomeEnabled: true,
    apiKeyChangedEnabled: true,
    orderStatusChangedEnabled: true,
    newServiceEnabled: true,
    serviceUpdatesEnabled: true,
    transactionAlertEnabled: true,
    transferFundsEnabled: true,
  });

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsPageLoading(true);

        const response = await fetch('/api/user/notification-preferences');
        if (response.ok) {
          const data = await response.json();

          if (data.adminSettings) {
            setAdminSettings(data.adminSettings);
          }
          if (data.userPreferences) {
            setUserPreferences(data.userPreferences);
          }
        } else {
          showToast('Failed to load notification preferences', 'error');
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        showToast('Error loading notification preferences', 'error');
      } finally {
        setIsPageLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: userPreferences }),
      });

      if (response.ok) {
        showToast('Notification preferences saved successfully!', 'success');
      } else {
        showToast('Failed to save notification preferences', 'error');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      showToast('Error saving notification preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <NotificationPreferencesSkeleton />
        </div>
      </div>
    );
  }

  const hasEnabledNotifications = Object.values(adminSettings).some(Boolean);

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
        <div className="card card-padding">
          <div className="card-header">
            <div className="card-icon">
              <FaBell />
            </div>
            <h3 className="card-title">Notification Preferences</h3>
          </div>

          {!hasEnabledNotifications ? (
            <div className="py-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No notification types are currently enabled by the administrator.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {adminSettings.welcomeEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label mb-1">Welcome</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Send welcome notification to new users
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.welcomeEnabled}
                    onClick={() =>
                      setUserPreferences(prev => ({
                        ...prev,
                        welcomeEnabled: !prev.welcomeEnabled
                      }))
                    }
                    title="Toggle welcome notifications"
                  />
                </div>
              )}

              {adminSettings.apiKeyChangedEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label mb-1">API Key Changed</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notify users when their API key is changed
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.apiKeyChangedEnabled}
                    onClick={() =>
                      setUserPreferences(prev => ({
                        ...prev,
                        apiKeyChangedEnabled: !prev.apiKeyChangedEnabled
                      }))
                    }
                    title="Toggle API key change notifications"
                  />
                </div>
              )}

              {adminSettings.orderStatusChangedEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label mb-1">Order Status Changed</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notify users when order status changes
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.orderStatusChangedEnabled}
                    onClick={() =>
                      setUserPreferences(prev => ({
                        ...prev,
                        orderStatusChangedEnabled: !prev.orderStatusChangedEnabled
                      }))
                    }
                    title="Toggle order status change notifications"
                  />
                </div>
              )}

              {adminSettings.newServiceEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label mb-1">New Service</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notify users about new services
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.newServiceEnabled}
                    onClick={() =>
                      setUserPreferences(prev => ({
                        ...prev,
                        newServiceEnabled: !prev.newServiceEnabled
                      }))
                    }
                    title="Toggle new service notifications"
                  />
                </div>
              )}

              {adminSettings.serviceUpdatesEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label mb-1">Service Updates</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notify users about service updates
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.serviceUpdatesEnabled}
                    onClick={() =>
                      setUserPreferences(prev => ({
                        ...prev,
                        serviceUpdatesEnabled: !prev.serviceUpdatesEnabled
                      }))
                    }
                    title="Toggle service update notifications"
                  />
                </div>
              )}

              {adminSettings.transactionAlertEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label mb-1">Transaction Alert</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notify users about transaction alerts
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.transactionAlertEnabled}
                    onClick={() =>
                      setUserPreferences(prev => ({
                        ...prev,
                        transactionAlertEnabled: !prev.transactionAlertEnabled
                      }))
                    }
                    title="Toggle transaction alert notifications"
                  />
                </div>
              )}

              {adminSettings.transferFundsEnabled && (
                <div className="flex items-center justify-between">
                  <div>
                    <label className="form-label mb-1">Transfer Funds</label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notify users about fund transfers
                    </p>
                  </div>
                  <Switch
                    checked={userPreferences.transferFundsEnabled}
                    onClick={() =>
                      setUserPreferences(prev => ({
                        ...prev,
                        transferFundsEnabled: !prev.transferFundsEnabled
                      }))
                    }
                    title="Toggle transfer funds notifications"
                  />
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={savePreferences}
                  disabled={isSaving}
                  className="btn btn-primary w-full"
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesPage;

