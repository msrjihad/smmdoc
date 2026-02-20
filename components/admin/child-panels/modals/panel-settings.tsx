'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { formatNumber } from '@/lib/utils';

interface ChildPanel {
  id: number;
  panelName: string;
  apiKey: string;
  apiCallsToday: number;
  apiCallsTotal: number;
  expiryDate?: string;
  theme: string;
  customBranding: boolean;
}

interface PanelSettingsData {
  panelName: string;
  theme: string;
  customBranding: boolean;
  language: string;
  apiRateLimit: number;
  sslEnabled: boolean;
  customLogo: string;
  maxUsers: number;
  featuresEnabled: {
    bulkOrders: boolean;
    apiAccess: boolean;
    customDomain: boolean;
    analytics: boolean;
    userManagement: boolean;
    ticketSystem: boolean;
    massOrders: boolean;
    drip_feed: boolean;
  };
}

interface PanelSettingsModalProps {
  isOpen: boolean;
  panel: ChildPanel | null;
  formatDate: (dateString: string | Date) => string;
  onClose: () => void;
  onSave: (settings: PanelSettingsData) => Promise<void>;
}

const FormLabel = ({ 
  className = "", 
  style, 
  children 
}: { 
  className?: string; 
  style?: React.CSSProperties; 
  children: React.ReactNode 
}) => (
  <label className={`block text-sm font-medium ${className}`} style={style}>
    {children}
  </label>
);

const PanelSettingsModal: React.FC<PanelSettingsModalProps> = ({
  isOpen,
  panel,
  formatDate,
  onClose,
  onSave,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [settingsData, setSettingsData] = useState<PanelSettingsData>({
    panelName: '',
    theme: '',
    customBranding: false,
    language: 'en',
    apiRateLimit: 1000,
    sslEnabled: true,
    customLogo: '',
    maxUsers: 1000,
    featuresEnabled: {
      bulkOrders: true,
      apiAccess: true,
      customDomain: true,
      analytics: true,
      userManagement: true,
      ticketSystem: true,
      massOrders: true,
      drip_feed: true,
    },
  });

  useEffect(() => {
    if (isOpen && panel) {
      setActiveSettingsTab('general');
      setSettingsData({
        panelName: panel.panelName,
        theme: panel.theme,
        customBranding: panel.customBranding,
        language: 'en',
        apiRateLimit: 1000,
        sslEnabled: true,
        customLogo: '',
        maxUsers: 1000,
        featuresEnabled: {
          bulkOrders: true,
          apiAccess: true,
          customDomain: true,
          analytics: true,
          userManagement: true,
          ticketSystem: true,
          massOrders: true,
          drip_feed: true,
        },
      });
    }
  }, [isOpen, panel]);

  const handleSave = async () => {
    await onSave(settingsData);
  };

  if (!isOpen || !panel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Panel Settings - {panel.panelName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex flex-wrap space-x-0 sm:space-x-8 gap-2">
            <button
              onClick={() => setActiveSettingsTab('general')}
              className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                activeSettingsTab === 'general'
                  ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveSettingsTab('appearance')}
              className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                activeSettingsTab === 'appearance'
                  ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveSettingsTab('api')}
              className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                activeSettingsTab === 'api'
                  ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              API & Limits
            </button>
            <button
              onClick={() => setActiveSettingsTab('features')}
              className={`py-2 px-4 sm:px-1 border-b-2 font-medium text-sm flex-1 text-center ${
                activeSettingsTab === 'features'
                  ? 'border-purple-500 dark:border-purple-400 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Features
            </button>
          </nav>
        </div>
        <div className="mb-6">
          {activeSettingsTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormLabel
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Panel Name
                  </FormLabel>
                  <input
                    type="text"
                    value={settingsData.panelName}
                    onChange={(e) =>
                      setSettingsData(prev => ({
                        ...prev,
                        panelName: e.target.value
                      }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter panel name"
                  />
                </div>
                <div>
                  <FormLabel
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Language
                  </FormLabel>
                  <select
                    value={settingsData.language}
                    onChange={(e) =>
                      setSettingsData(prev => ({
                        ...prev,
                        language: e.target.value
                      }))
                    }
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>

              <div>
                <FormLabel
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Maximum Users
                </FormLabel>
                <input
                  type="number"
                  value={settingsData.maxUsers}
                  onChange={(e) =>
                    setSettingsData(prev => ({
                      ...prev,
                      maxUsers: parseInt(e.target.value) || 0
                    }))
                  }
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Maximum number of users"
                  min="1"
                  max="10000"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum number of users that can register on this panel
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'appearance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormLabel
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Theme
                  </FormLabel>
                  <select
                    value={settingsData.theme}
                    onChange={(e) =>
                      setSettingsData(prev => ({
                        ...prev,
                        theme: e.target.value
                      }))
                    }
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="Dark Blue">Dark Blue</option>
                    <option value="Green">Green</option>
                    <option value="Purple">Purple</option>
                    <option value="Blue">Blue</option>
                    <option value="Pink">Pink</option>
                    <option value="Red">Red</option>
                    <option value="Orange">Orange</option>
                    <option value="Teal">Teal</option>
                  </select>
                </div>
                <div>
                  <FormLabel
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Custom Logo
                  </FormLabel>
                  <input
                    type="text"
                    value={settingsData.customLogo}
                    onChange={(e) =>
                      setSettingsData(prev => ({
                        ...prev,
                        customLogo: e.target.value
                      }))
                    }
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder="Logo URL (optional)"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={settingsData.customBranding}
                    onChange={(e) =>
                      setSettingsData(prev => ({
                        ...prev,
                        customBranding: e.target.checked
                      }))
                    }
                    className="rounded border-gray-300"
                  />
                  <span className="font-medium">Enable Custom Branding</span>
                </label>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Allow this panel to use custom branding, logos, and remove "Powered by" links
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Theme Preview</h4>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded border-2 border-white dark:border-gray-700 shadow-sm"
                    style={{
                      backgroundColor: 
                        settingsData.theme === 'Dark Blue' ? '#1e40af' :
                        settingsData.theme === 'Green' ? '#059669' :
                        settingsData.theme === 'Purple' ? '#7c3aed' :
                        settingsData.theme === 'Blue' ? '#2563eb' :
                        settingsData.theme === 'Pink' ? '#db2777' :
                        settingsData.theme === 'Red' ? '#dc2626' :
                        settingsData.theme === 'Orange' ? '#ea580c' :
                        settingsData.theme === 'Teal' ? '#0d9488' : '#6b7280'
                    }}
                  ></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Primary Color: {settingsData.theme}</span>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'api' && (
            <div className="space-y-6">
              <div>
                <label className="form-label mb-2">API Rate Limit (per hour)</label>
                <input
                  type="number"
                  value={settingsData.apiRateLimit}
                  onChange={(e) =>
                    setSettingsData(prev => ({
                      ...prev,
                      apiRateLimit: parseInt(e.target.value) || 0
                    }))
                  }
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="API calls per hour"
                  min="100"
                  max="10000"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum API calls this panel can make per hour
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-3">Current API Usage</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Today</div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {formatNumber(panel.apiCallsToday)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                    <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                      {formatNumber(panel.apiCallsTotal)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">API Information</h4>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <div>API Key: <span className="font-mono text-xs">{panel.apiKey}</span></div>
                  <div className="text-xs">Keep this API key secure and do not share it publicly</div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">Panel Features</h4>
                <div className="mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Object.values(settingsData.featuresEnabled).every(v => v)}
                      onChange={(e) => {
                        const allEnabled = e.target.checked;
                        setSettingsData(prev => ({
                          ...prev,
                          featuresEnabled: {
                            bulkOrders: allEnabled,
                            apiAccess: allEnabled,
                            customDomain: allEnabled,
                            analytics: allEnabled,
                            userManagement: allEnabled,
                            ticketSystem: allEnabled,
                            massOrders: allEnabled,
                            drip_feed: allEnabled,
                          }
                        }))
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="font-medium text-sm">Select All Features</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.bulkOrders}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              bulkOrders: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Bulk Orders</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.userManagement || false}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              userManagement: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">User Management</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.analytics}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              analytics: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Analytics Dashboard</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.massOrders || false}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              massOrders: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Mass Orders</span>
                    </label>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.apiAccess}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              apiAccess: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">API Access</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.customDomain}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              customDomain: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Custom Domain</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.ticketSystem || false}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              ticketSystem: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Ticket System</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settingsData.featuresEnabled.drip_feed || false}
                        onChange={(e) =>
                          setSettingsData(prev => ({
                            ...prev,
                            featuresEnabled: {
                              ...prev.featuresEnabled,
                              drip_feed: e.target.checked
                            }
                          }))
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Drip Feed</span>
                    </label>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {Object.values(settingsData.featuresEnabled).every(v => !v) ? (
                    <span className="text-amber-600 dark:text-amber-400">No features selected. Panel will have limited functionality.</span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400">
                      {Object.values(settingsData.featuresEnabled).filter(v => v).length} features enabled.
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">Current Plan</h4>
                <div className="text-sm text-green-700 dark:text-green-300">
                  <div className="text-xs">
                    Expires: {panel.expiryDate 
                      ? formatDate(panel.expiryDate)
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PanelSettingsModal;

