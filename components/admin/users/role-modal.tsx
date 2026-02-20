'use client';

import React from 'react';

interface ChangeRoleModalProps {
  isOpen: boolean;
  currentRole: string;
  newRole: string;
  onRoleChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  permissions?: string[];
  onPermissionsChange?: (permissions: string[]) => void;
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  currentRole,
  newRole,
  onRoleChange,
  onClose,
  onConfirm,
  isLoading,
  permissions = [],
  onPermissionsChange,
}) => {
  const availablePermissions = [
    { id: 'all_orders', label: 'All Orders' },
    { id: 'refill_requests', label: 'Refill Requests' },
    { id: 'cancel_requests', label: 'Cancel Requests' },
    { id: 'all_services', label: 'All Services' },
    { id: 'api_sync_logs', label: 'API Sync Logs' },
    { id: 'users', label: 'Users' },
    { id: 'user_activity_logs', label: 'User Activity Logs' },
    { id: 'all_transactions', label: 'All Transactions' },
    { id: 'support_tickets', label: 'Support Tickets' },
    { id: 'contact_messages', label: 'Contact Messages' },
    { id: 'blogs', label: 'Blogs' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'affiliate_users', label: 'Affiliate Users' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'child_panels', label: 'Child Panels' },
  ];

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (!onPermissionsChange) return;
    const updatedPermissions = checked
      ? [...permissions, permissionId]
      : permissions.filter((p) => p !== permissionId);
    onPermissionsChange(updatedPermissions);
  };

  const handleSelectAllPermissions = (checked: boolean) => {
    if (!onPermissionsChange) return;
    onPermissionsChange(checked ? availablePermissions.map((p) => p.id) : []);
  };

  const getSelectAllState = () => {
    if (permissions.length === 0) return { checked: false, indeterminate: false };
    if (permissions.length === availablePermissions.length) return { checked: true, indeterminate: false };
    return { checked: false, indeterminate: true };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Change Role</h3>
        <div className="mb-4">
          <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Select New Role</label>
          <select
            value={newRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
            disabled={isLoading}
          >
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
            <option value="user">User</option>
          </select>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current role:{' '}
            <span className="font-medium capitalize text-gray-700 dark:text-gray-300">
              {currentRole.replace('_', ' ')}
            </span>
          </div>
        </div>
        {newRole === 'moderator' && (
          <div className="mb-4">
            <label className="form-label mb-2 text-gray-700 dark:text-gray-300">Permissions</label>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={getSelectAllState().checked}
                    ref={(el) => {
                      if (el) el.indeterminate = getSelectAllState().indeterminate;
                    }}
                    onChange={(e) => handleSelectAllPermissions(e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 dark:focus:ring-purple-400"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Select All Permissions
                  </span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {availablePermissions.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={permissions.includes(permission.id)}
                      onChange={(e) =>
                        handlePermissionChange(permission.id, e.target.checked)
                      }
                      className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500 focus:ring-2 dark:focus:ring-purple-400"
                      disabled={isLoading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {permission.label}
                    </span>
                  </label>
                ))}
              </div>
              {permissions.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  No permissions selected. Moderator will have limited access.
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {permissions.length} of {availablePermissions.length} permissions selected.
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Role'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeRoleModal;
export type { ChangeRoleModalProps };

