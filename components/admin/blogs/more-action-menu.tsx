'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FaCheckCircle,
  FaEdit,
  FaEllipsisH,
  FaTrash,
} from 'react-icons/fa';

interface MoreActionMenuProps {
  blogId: number;
  onEdit: () => void;
  onChangeStatus: () => void;
  onDelete: () => void;
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
  blogId,
  onEdit,
  onChangeStatus,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="btn btn-secondary p-2"
        title="More Actions"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <FaEllipsisH className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-900 dark:text-gray-300"
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
          >
            <FaEdit className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            Edit Blog
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-gray-900 dark:text-gray-300"
            onClick={() => {
              setIsOpen(false);
              onChangeStatus();
            }}
          >
            <FaCheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
            Change Status
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2 text-red-600 dark:text-red-400"
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
          >
            <FaTrash className="h-3 w-3" />
            Delete Blog
          </button>
        </div>
      )}
    </div>
  );
};

export default MoreActionMenu;

