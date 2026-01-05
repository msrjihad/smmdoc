'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaCog, FaEllipsisH, FaGlobe, FaUserCheck } from 'react-icons/fa';

interface ChildPanel {
  id: number;
  domain: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'expired';
}

interface MoreActionMenuProps {
  panel: ChildPanel;
  onChangeStatus: (panelId: number, currentStatus: string) => void;
  onOpenSettings: (panel: ChildPanel) => void;
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
  panel,
  onChangeStatus,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="btn btn-secondary p-2"
        title="More Actions"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaEllipsisH className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              onChangeStatus(panel.id, panel.status);
            }}
          >
            <FaUserCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            Change Status
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              onOpenSettings(panel);
            }}
          >
            <FaCog className="h-3 w-3 text-gray-600 dark:text-gray-400" />
            Panel Settings
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
            onClick={() => {
              setIsOpen(false);
              window.open(`https://${panel.domain}`, '_blank');
            }}
          >
            <FaGlobe className="h-3 w-3 text-green-600 dark:text-green-400" />
            Visit Panel
          </button>
        </div>
      )}
    </div>
  );
};

export default MoreActionMenu;

