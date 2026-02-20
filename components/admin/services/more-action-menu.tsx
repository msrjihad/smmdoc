'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  FaCheckCircle,
  FaEdit,
  FaEllipsisH,
  FaTimesCircle,
  FaTrash,
  FaUndo,
} from 'react-icons/fa';

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

interface MoreActionMenuProps {
  service: any;
  statusFilter: string;
  categoryName: string;
  activeCategoryToggles: Record<string, boolean>;
  onEdit: () => void;
  onToggleStatus: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export const MoreActionMenu = React.memo<MoreActionMenuProps>(({
  service,
  statusFilter,
  categoryName,
  activeCategoryToggles,
  onEdit,
  onToggleStatus,
  onRestore,
  onDelete,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn btn-secondary p-2"
        title="More Actions"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaEllipsisH className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {statusFilter !== 'trash' && (
              <button
                onClick={() => {
                  onToggleStatus();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                {service.status === 'active' ? (
                  <FaTimesCircle className="h-3 w-3" />
                ) : (
                  <FaCheckCircle className="h-3 w-3" />
                )}
                {service.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            )}
            {statusFilter === 'trash' && (
              <button
                onClick={() => {
                  onRestore();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaUndo className="h-3 w-3" />
                Restore
              </button>
            )}
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
            >
              <FaEdit className="h-3 w-3" />
              Edit
            </button>
            <hr className="my-1 dark:border-gray-700" />
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
            >
              <FaTrash className="h-3 w-3" />
              {statusFilter === 'trash' ? 'Delete Permanently' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

MoreActionMenu.displayName = 'MoreActionMenu';

