'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState } from 'react';
import {
  FaCode,
  FaCheck,
  FaTimes,
  FaInfoCircle,
} from 'react-icons/fa';

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

interface CustomCodesSettings {
  headerCodes: string;
  footerCodes: string;
}

const CustomCodesPage = () => {
  const { appName } = useAppNameWithFallback();

  const currentUser = useCurrentUser();

  useEffect(() => {
    setPageTitle('Custom Codes', appName);
  }, [appName]);

  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [customCodesSettings, setCustomCodesSettings] = useState<CustomCodesSettings>({
    headerCodes: '',
    footerCodes: '',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsPageLoading(true);

        const response = await fetch('/api/admin/custom-codes-settings');
        if (response.ok) {
          const data = await response.json();

          if (data.customCodesSettings) setCustomCodesSettings(data.customCodesSettings);
        } else {
          showToast('Failed to load custom codes settings', 'error');
        }
      } catch (error) {
        console.error('Error loading custom codes settings:', error);
        showToast('Error loading custom codes settings', 'error');
      } finally {
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

  const saveCustomCodesSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/custom-codes-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customCodesSettings,
        }),
      });

      if (response.ok) {
        showToast('Custom codes settings saved successfully!', 'success');

        window.dispatchEvent(new CustomEvent('customCodesUpdated'));
      } else {
        showToast('Failed to save custom codes settings', 'error');
      }
    } catch (error) {
      console.error('Error saving custom codes settings:', error);
      showToast('Error saving custom codes settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card card-padding h-fit">
              <div className="card-header">
                <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="h-4 w-full gradient-shimmer rounded mb-2" />
                  <div className="h-4 w-full gradient-shimmer rounded mb-2" />
                  <div className="h-4 w-3/4 gradient-shimmer rounded mb-4" />
                </div>
                <div className="form-group">
                  <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                  <div className="h-96 w-full gradient-shimmer rounded-lg" />
                  <div className="h-3 w-3/4 gradient-shimmer rounded mt-2" />
                </div>
              </div>
            </div>
            <div className="card card-padding h-fit">
              <div className="card-header">
                <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
              </div>
              <div className="space-y-4">
                <div>
                  <div className="h-4 w-full gradient-shimmer rounded mb-2" />
                  <div className="h-4 w-full gradient-shimmer rounded mb-2" />
                  <div className="h-4 w-3/4 gradient-shimmer rounded mb-4" />
                </div>
                <div className="form-group">
                  <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                  <div className="h-96 w-full gradient-shimmer rounded-lg" />
                  <div className="h-3 w-3/4 gradient-shimmer rounded mt-2" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <div className="h-5 w-5 gradient-shimmer rounded-full mr-2" />
                <div className="h-6 w-40 gradient-shimmer rounded" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-4 w-full gradient-shimmer rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <div className="h-12 w-48 gradient-shimmer rounded-lg" />
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card card-padding h-fit">
            <div className="card-header">
              <div className="card-icon">
                <FaCode />
              </div>
              <h3 className="card-title">Header Codes</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add custom HTML, CSS, or JavaScript code that will be inserted into the &lt;head&gt; section of your website. This is perfect for analytics tracking codes, custom CSS styles, or meta tags.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Header Code</label>
                <textarea
                  value={customCodesSettings.headerCodes}
                  onChange={(e) =>
                    setCustomCodesSettings(prev => ({ ...prev, headerCodes: e.target.value }))
                  }
                  rows={15}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none font-mono text-sm"
                  placeholder={`
<script>

</script>

<style>

</style>

<meta name="custom-tag" content="value">`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This code will be inserted into the &lt;head&gt; section of every page.
                </p>
              </div>
            </div>
          </div>
          <div className="card card-padding h-fit">
            <div className="card-header">
              <div className="card-icon">
                <FaCode />
              </div>
              <h3 className="card-title">Footer Codes</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add custom HTML, CSS, or JavaScript code that will be inserted before the closing &lt;/body&gt; tag. This is ideal for chat widgets, analytics scripts, or custom JavaScript functionality.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Footer Code</label>
                <textarea
                  value={customCodesSettings.footerCodes}
                  onChange={(e) =>
                    setCustomCodesSettings(prev => ({ ...prev, footerCodes: e.target.value }))
                  }
                  rows={15}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none font-mono text-sm"
                  placeholder={`
<script>


</script>

<div id="custom-footer-content">

</div>`}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This code will be inserted before the closing &lt;/body&gt; tag of every page.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
              <FaInfoCircle className="mr-2" />
              Important Notes
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>• <strong>Header codes</strong> are loaded in the &lt;head&gt; section and execute before page content loads</li>
              <li>• <strong>Footer codes</strong> are loaded before &lt;/body&gt; and execute after page content loads</li>
              <li>• Always test your custom codes thoroughly before saving to avoid breaking your website</li>
              <li>• Use proper HTML, CSS, and JavaScript syntax to prevent errors</li>
              <li>• These codes will be applied to all pages of your website</li>
              <li>• For security reasons, avoid inserting untrusted third-party scripts</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex justify-center">
          <button
            onClick={saveCustomCodesSettings}
            disabled={isLoading}
            className="btn btn-primary px-8 py-3"
          >
            {isLoading ? 'Updating...' : 'Save Custom Codes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCodesPage;