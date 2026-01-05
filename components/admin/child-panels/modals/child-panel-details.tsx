'use client';

import React from 'react';
import { FaGlobe, FaTimes, FaUserCheck } from 'react-icons/fa';
import { PriceDisplay } from '@/components/price-display';
import { formatID, formatNumber } from '@/lib/utils';

interface ChildPanel {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    name: string;
    joinedAt: string;
  };
  domain: string;
  subdomain?: string;
  panelName: string;
  apiKey: string;
  totalOrders: number;
  totalRevenue: number;
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'expired';
  createdAt: string;
  lastActivity: string;
  expiryDate?: string;
  theme: string;
  customBranding: boolean;
  apiCallsToday: number;
  apiCallsTotal: number;
  plan: string;
}

interface ChildPanelDetailsModalProps {
  isOpen: boolean;
  panel: ChildPanel | null;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getStatusBadge: (status: string) => React.ReactNode;
  onClose: () => void;
  onVisitPanel: (domain: string) => void;
  onChangeStatus: (panelId: number, currentStatus: string) => void;
}

const ChildPanelDetailsModal: React.FC<ChildPanelDetailsModalProps> = ({
  isOpen,
  panel,
  formatDate,
  formatTime,
  getStatusBadge,
  onClose,
  onVisitPanel,
  onChangeStatus,
}) => {
  if (!isOpen || !panel) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Child Panel Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Basic Information
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Panel ID
                </label>
                <div className="font-mono text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded w-fit mt-1">
                  {formatID(panel.id.toString())}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Panel Name
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {panel.panelName}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Domain
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  <a 
                    href={`https://${panel.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    {panel.domain}
                  </a>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Owner
                </label>
                <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                  {panel.user?.username} ({panel.user?.email})
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </label>
                <div className="mt-1">
                  {getStatusBadge(panel.status)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Performance Metrics
            </h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Orders
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {formatNumber(panel.totalOrders)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </label>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1">
                  <PriceDisplay
                    amount={panel.totalRevenue || 0}
                    originalCurrency="USD"
                    className="text-lg font-semibold text-green-600 dark:text-green-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  API Calls Today
                </label>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  {formatNumber(panel.apiCallsToday)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total API Calls
                </label>
                <div className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-1">
                  {formatNumber(panel.apiCallsTotal)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Plan
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                  {panel.plan}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Technical Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                API Key
              </div>
              <div className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-900 dark:text-gray-100">
                {panel.apiKey}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                Theme
              </div>
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {panel.theme}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                Custom Branding
              </div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                {panel.customBranding ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Important Dates
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Created
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {formatDate(panel.createdAt)} at {formatTime(panel.createdAt)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Last Activity
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {formatDate(panel.lastActivity)} at {formatTime(panel.lastActivity)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expires
              </label>
              <div className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                {panel.expiryDate 
                  ? `${formatDate(panel.expiryDate)} at ${formatTime(panel.expiryDate)}`
                  : 'Never'
                }
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onVisitPanel(panel.domain)}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FaGlobe />
            Visit Panel
          </button>
          <button
            onClick={() => {
              onClose();
              onChangeStatus(panel.id, panel.status);
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <FaUserCheck />
            Change Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChildPanelDetailsModal;

