'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FaEllipsisH,
  FaExclamationCircle,
  FaEye,
  FaSync,
  FaEdit,
} from 'react-icons/fa';

interface Order {
  id: number;
  status: string;
  providerOrderId?: string;
  startCount?: number;
}

interface MoreActionMenuProps {
  order: Order;
  onResendOrder?: (orderId: number) => void;
  onRequestCancelOrder?: (orderId: number) => void;
  onEditOrderUrl?: (orderId: number) => void;
  onEditStartCount?: (orderId: number, startCount: number) => void;
  onMarkPartial?: (orderId: number) => void;
  onUpdateStatus?: (orderId: number, status: string) => void;
}

const MoreActionMenu: React.FC<MoreActionMenuProps> = ({
  order,
  onResendOrder,
  onRequestCancelOrder,
  onEditOrderUrl,
  onEditStartCount,
  onMarkPartial,
  onUpdateStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const status = order.status?.toLowerCase();
  const isCancelled = ['cancelled', 'canceled'].includes(status);
  const isCompleted = status === 'completed';

  if (isCancelled || isCompleted) {
    return null;
  }

  const pendingOrInProgress = ['pending', 'in_progress', 'inprogress', 'processing'].includes(status);
  const failed = status === 'failed';
  const cancelledOrCompleted = ['cancelled', 'canceled', 'completed'].includes(status);

  const showResendOrder = failed && onResendOrder;
  const isAutoMode = !!order.providerOrderId;
  const isPending = status === 'pending';
  const showRequestCancelOrder = isPending && isAutoMode && onRequestCancelOrder;
  const showEditOrderUrl = (pendingOrInProgress || failed) && !isAutoMode && onEditOrderUrl;
  const showEditStartCount = (pendingOrInProgress || failed || cancelledOrCompleted) && !isAutoMode && onEditStartCount;
  const showMarkPartial = (pendingOrInProgress || failed || cancelledOrCompleted) && !isAutoMode && onMarkPartial && order.status !== 'partial';
  const showUpdateStatus = (pendingOrInProgress || failed || cancelledOrCompleted) && !showRequestCancelOrder && onUpdateStatus;

  const handleAction = (callback: () => void) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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
        <div
          ref={menuRef}
          className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
        >
          <div className="py-1">
            {showResendOrder && (
              <button
                onClick={() => handleAction(() => onResendOrder!(order.id))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FaSync className="h-3 w-3" />
                Resend Order
              </button>
            )}
            {showRequestCancelOrder && (
              <button
                onClick={() => handleAction(() => onRequestCancelOrder!(order.id))}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <FaExclamationCircle className="h-3 w-3" />
                Request Cancel Order
              </button>
            )}
            {showEditOrderUrl && (
              <button
                onClick={() => handleAction(() => onEditOrderUrl!(order.id))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FaEdit className="h-3 w-3" />
                Edit Order URL
              </button>
            )}
            {showEditStartCount && (
              <button
                onClick={() => handleAction(() => onEditStartCount!(order.id, order.startCount || 0))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FaEye className="h-3 w-3" />
                Edit Start Count
              </button>
            )}
            {showMarkPartial && (
              <button
                onClick={() => handleAction(() => onMarkPartial!(order.id))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FaExclamationCircle className="h-3 w-3" />
                Mark Partial
              </button>
            )}
            {showUpdateStatus && (
              <button
                onClick={() => handleAction(() => onUpdateStatus!(order.id, order.status))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <FaSync className="h-3 w-3" />
                Update Order Status
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoreActionMenu;

