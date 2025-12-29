'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaHeadset,
  FaMoneyBillWave,
  FaPlus,
  FaShoppingCart,
  FaTicketAlt,
  FaUsers,
} from 'react-icons/fa';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DropdownMenuContentProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contactSystemEnabled: boolean;
  childPanelSellingEnabled?: boolean;
}

const DropdownMenuContentComponent = ({ 
  open, 
  onOpenChange, 
  contactSystemEnabled,
  childPanelSellingEnabled = true
}: DropdownMenuContentProps) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          className="h-10 w-10 rounded-lg text-white shadow-sm hover:shadow-lg gradient-button-hover transition-all duration-300 hover:-translate-y-0.5 flex-shrink-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(to right, var(--primary), var(--secondary))`,
          }}
        >
          <FaPlus className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 header-theme-transition shadow-sm"
        style={{
          backgroundColor: 'var(--dropdown-bg)',
          border: `1px solid var(--header-border)`,
        }}
      >
        {isLoading ? (
          <div className="p-1">
            {Array.from({ length: (contactSystemEnabled ? 1 : 0) + (childPanelSellingEnabled ? 1 : 0) + 3 }).map((_, index) => (
              <div
                key={index}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md"
              >
                <div className="w-6 h-6 rounded gradient-shimmer flex-shrink-0"></div>
                <div className="flex flex-col flex-1">
                  <div className="h-4 w-24 gradient-shimmer rounded mb-1"></div>
                  <div className="h-3 w-32 gradient-shimmer rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-1">
            <Link
            href="/new-order"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 hover:opacity-80 block"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--header-text)',
            }}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-blue-100 dark:bg-blue-900/30"
            >
              <FaShoppingCart className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">New Order</span>
              <span
                className="text-xs"
                style={{
                  color: 'var(--header-text)',
                  opacity: 0.7,
                }}
              >
                Create new order
              </span>
            </div>
          </Link>
          <Link
            href="/add-funds"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 hover:opacity-80 block"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--header-text)',
            }}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-green-100 dark:bg-green-900/30"
            >
              <FaMoneyBillWave className="h-4 w-4 text-green-500 dark:text-green-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">Add Funds</span>
              <span
                className="text-xs"
                style={{
                  color: 'var(--header-text)',
                  opacity: 0.7,
                }}
              >
                Top up your balance
              </span>
            </div>
          </Link>
          <Link
            href="/support-tickets/new"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 hover:opacity-80 block"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--header-text)',
            }}
          >
            <div
              className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900/30"
            >
              <FaTicketAlt className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm">Create Support Ticket</span>
              <span
                className="text-xs"
                style={{
                  color: 'var(--header-text)',
                  opacity: 0.7,
                }}
              >
                Submit technical issue
              </span>
            </div>
          </Link>
          {contactSystemEnabled && (
            <Link
              href="/contact-support"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 hover:opacity-80 block"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--header-text)',
              }}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-orange-100 dark:bg-orange-900/30"
              >
                <FaHeadset className="h-4 w-4 text-orange-500 dark:text-orange-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Contact Support</span>
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--header-text)',
                    opacity: 0.7,
                  }}
                >
                  Live chat & help
                </span>
              </div>
            </Link>
          )}
          {childPanelSellingEnabled && (
            <Link
              href="/child-panel"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 hover:opacity-80 block"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--header-text)',
              }}
            >
              <div
                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 bg-pink-100 dark:bg-pink-900/30"
              >
                <FaUsers className="h-4 w-4 text-pink-500 dark:text-pink-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm">Create Child Panel</span>
                <span
                  className="text-xs"
                  style={{
                    color: 'var(--header-text)',
                    opacity: 0.7,
                  }}
                >
                  Manage sub-accounts
                </span>
              </div>
            </Link>
          )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenuContentComponent;

