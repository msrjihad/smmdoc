'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaEllipsisH, FaEye, FaSync } from 'react-icons/fa';

interface Transaction {
  id: number;
  user?: {
    id?: number;
    email?: string;
    name?: string;
    username?: string;
  };
  transactionId?: number | string;
  amount: number;
  bdt_amount?: number;
  currency: string;
  phone?: string;
  sender_number?: string;
  method?: string;
  payment_method?: string;
  paymentGateway?: string;
  paymentMethod?: string;
  status?: 'pending' | 'completed' | 'cancelled' | 'Processing' | 'Success' | 'Cancelled' | string;
  admin_status?: 'Pending' | 'pending' | 'Success' | 'Cancelled' | string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
}

interface MoreActionMenuProps {
  transaction: Transaction;
  onViewDetails: () => void;
  onUpdateStatus: () => void;
}

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
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
  transaction,
  onViewDetails,
  onUpdateStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsOpen(false));

  return (
    <div className="flex items-center">
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
          <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={() => {
                  onViewDetails();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaEye className="h-3 w-3" />
                View Details
              </button>
              <button
                onClick={() => {
                  onUpdateStatus();
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
              >
                <FaSync className="h-3 w-3" />
                Update Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoreActionMenu;

