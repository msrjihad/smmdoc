'use client';

import React, { useEffect, useState } from 'react';
import {
  FaCoins,
  FaEdit,
  FaEllipsisH,
  FaSignInAlt,
  FaSync,
  FaTag,
  FaTimesCircle,
  FaTrash,
  FaUserCheck,
} from 'react-icons/fa';

interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
  balance: number;
  total_spent: number;
  totalOrders: number;
  servicesDiscount: number;
  status: 'active' | 'suspended' | 'banned';
  currency: string;
  dollarRate?: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: string | null;
  role: 'user' | 'admin' | 'moderator';
  suspendedUntil?: string;
}

interface MoreActionMenuProps {
  user: User;
  onView: (userId: number) => void;
  onEditUser: (userId: number) => void;
  onEditBalance: (userId: number) => void;
  onEditDiscount: (userId: number, currentDiscount: number) => void;
  onChangeRole: (userId: number, currentRole: string) => void;
  onSetNewApiKey: (userId: number) => Promise<boolean>;
  onUpdateStatus: (userId: number, currentStatus: string) => void;
  onDelete: (userId: number) => void;
  isLoading: boolean;
  isModerator?: boolean;
}

const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || !event.target || !(event.target instanceof Node)) {
        return;
      }
      if (ref.current.contains(event.target)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const MoreActionMenu: React.FC<MoreActionMenuProps> = ({
  user,
  onView,
  onEditUser,
  onEditBalance,
  onEditDiscount,
  onChangeRole,
  onSetNewApiKey,
  onUpdateStatus,
  onDelete,
  isLoading,
  isModerator = false,
}) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onView(user.id)}
        className="btn btn-secondary p-2"
        title="Switch to this User"
        disabled={isLoading}
      >
        <FaSignInAlt className="h-3 w-3" />
      </button>

      <div className="relative" ref={dropdownRef}>
        <button
          className="btn btn-secondary p-2"
          title="More Actions"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
        >
          <FaEllipsisH className="h-3 w-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  onEditUser(user.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaEdit className="h-3 w-3" />
                Edit User
              </button>
              {(user.status === 'suspended' || user.status === 'banned') && (
                <button
                  onClick={() => {
                    onUpdateStatus(user.id, user.status);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                >
                  <FaUserCheck className="h-3 w-3" />
                  Update User Status
                </button>
              )}
              {!user.emailVerified && (
                <>
                  <hr className="my-1 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      onDelete(user.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <FaTrash className="h-3 w-3" />
                    Delete User
                  </button>
                </>
              )}
              {user.emailVerified && user.status !== 'suspended' && user.status !== 'banned' && (
                <>
                  <button
                    onClick={() => {
                      onEditBalance(user.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    <FaCoins className="h-3 w-3" />
                    Add/Deduct Balance
                  </button>
                  <button
                    onClick={() => {
                      onEditDiscount(user.id, user.servicesDiscount || 0);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    <FaTag className="h-3 w-3" />
                    Edit Discount
                  </button>
                  {!isModerator && (
                    <button
                      onClick={() => {
                        onChangeRole(user.id, user.role || 'user');
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                    >
                      <FaUserCheck className="h-3 w-3" />
                      Change Role
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onSetNewApiKey(user.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    <FaSync className="h-3 w-3" />
                    Set New API Key
                  </button>
                  <button
                    onClick={() => {
                      onUpdateStatus(user.id, user.status);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                  >
                    <FaUserCheck className="h-3 w-3" />
                    Update User Status
                  </button>
                  <hr className="my-1 dark:border-gray-700" />
                  <button
                    onClick={() => {
                      onDelete(user.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                  >
                    <FaTrash className="h-3 w-3" />
                    Delete User
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoreActionMenu;

