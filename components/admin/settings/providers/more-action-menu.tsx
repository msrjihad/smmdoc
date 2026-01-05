'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaEdit, FaEllipsisH, FaSync, FaTrash, FaUndo } from 'react-icons/fa';

interface Provider {
  id: number;
  name: string;
  apiUrl: string;
  status: 'active' | 'inactive' | 'trash';
  services: number;
  orders: number;
  importedServices: number;
  activeServices: number;
  inactiveServices: number;
  currentBalance: number;
  lastSync: Date | string;
  [key: string]: any;
}

interface MoreActionMenuProps {
  provider: Provider;
  syncingProvider: number | null;
  onSync: (providerId: number) => void;
  onEdit: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
  onRestore: (provider: Provider) => void;
}

const useClickOutside = (ref: React.RefObject<HTMLElement | null>, handler: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
};

const MoreActionMenu: React.FC<MoreActionMenuProps> = ({
  provider,
  syncingProvider,
  onSync,
  onEdit,
  onDelete,
  onRestore,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div className="flex items-center gap-2 justify-center">
      {provider.status !== 'trash' && (
        <button
          onClick={() => onSync(provider.id)}
          disabled={syncingProvider === provider.id}
          className="btn btn-sm btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sync Provider Data"
        >
          <FaSync className={`w-3 h-3 ${syncingProvider === provider.id ? 'animate-spin' : ''}`} />
        </button>
      )}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-sm btn-secondary p-2"
          title="More actions"
        >
          <FaEllipsisH className="w-3 h-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="py-1">
              {provider.status === 'trash' ? (
                <>
                  <button
                    onClick={() => {
                      onRestore(provider);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                  >
                    <FaUndo className="w-3 h-3" />
                    Restore
                  </button>

                  <button
                    onClick={() => {
                      onDelete(provider);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <FaTrash className="w-3 h-3" />
                    Permanently Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onEdit(provider);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <FaEdit className="w-3 h-3" />
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      onDelete(provider);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <FaTrash className="w-3 h-3" />
                    Delete Provider
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

