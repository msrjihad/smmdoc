'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FaEdit,
  FaEllipsisH,
  FaTrash,
  FaUserCheck,
} from 'react-icons/fa';

interface Admin {
  id: number;
  username: string;
  email: string;
  name?: string;
  balance: number;
  spent: number;
  totalOrders: number;
  servicesDiscount: number;
  status: 'active' | 'inactive';
  currency: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  emailVerified: boolean;
  role: 'admin' | 'moderator' | 'super_admin';
  permissions: string[];
  password?: string;
}

interface MoreActionMenuProps {
  admin: Admin;
  onEdit: (adminId: string) => void;
  onChangeRole: (adminId: string, currentRole: string) => void;
  onDelete: (adminId: string) => void;
  isLoading: boolean;
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
  admin,
  onEdit,
  onChangeRole,
  onDelete,
  isLoading,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onEdit(admin.id.toString())}
        className="btn btn-secondary p-2"
        title="Edit Admin"
        disabled={isLoading}
      >
        <FaEdit className="h-3 w-3" />
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
                  onChangeRole(admin.id.toString(), admin.role);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaUserCheck className="h-3 w-3" />
                Change Role
              </button>
              <hr className="my-1 dark:border-gray-700" />
              <button
                onClick={() => {
                  onDelete(admin.id.toString());
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
              >
                <FaTrash className="h-3 w-3" />
                Delete Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoreActionMenu;

