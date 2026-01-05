'use client';

import { PriceDisplay } from '@/components/price-display';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';
import {
  FaArrowDown,
  FaArrowUp,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaLink,
  FaRedo,
  FaTachometerAlt,
  FaTimes
} from 'react-icons/fa';

import { useEffect, useState } from 'react';

interface Service {
  id: number;
  name: string;
  rate: number;
  min_order: number;
  max_order: number;
  avg_time: string;
  description: string;
  refill?: boolean;
  cancel?: boolean;
  start_time?: string;
  guarantee?: string;
  speed?: string;
  orderLink?: string;
  [key: string]: any;
}

interface ServiceDetailsModalProps {
  service: Service;
  setIsOpen: (isOpen: boolean) => void;
  isOpen: boolean;
}

const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({ service, setIsOpen, isOpen }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleBackdropClick}
      />
      <div className={`relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-xl transition-all duration-300 transform ${
        isAnimating 
          ? 'scale-100 opacity-100 translate-y-0' 
          : 'scale-95 opacity-0 translate-y-4'
      }`}>
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="flex justify-end p-4 pb-0 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
          <div className="bg-[#f3f3f3] dark:bg-gray-700/50 mx-6 mb-6 px-6 py-4 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                ID: {service?.id ? formatNumber(service.id) : '14832'}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                {service?.name || 'TikTok ~ Followers ~ [100% Real Users] ~ Max 10M ~ 100k/days ~ Instant ~ NO REFILL'}
              </h2>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaDollarSign className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Price Per 1000</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  <PriceDisplay amount={service?.rate || 1.9688} originalCurrency="USD" />
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaArrowDown className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Min Order</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {(service?.min_order || 10).toString()}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaArrowUp className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Max order</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {(service?.max_order || 10000000).toString()}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaClock className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Average Time</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {service?.avg_time || '4 minutes'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaRedo className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Refill</span>
                </div>
                <div className="flex items-center gap-2">
                  {service?.refill ? (
                    <>
                      <span className="text-green-600 dark:text-green-400 font-semibold">Available</span>
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    </>
                  ) : (
                    <>
                      <span className="text-red-600 dark:text-red-400 font-semibold">Not Available</span>
                      <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaTimes className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Cancel</span>
                </div>
                <div className="flex items-center gap-2">
                  {service?.cancel ? (
                    <>
                      <span className="text-green-600 dark:text-green-400 font-semibold">Available</span>
                      <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    </>
                  ) : (
                    <>
                      <span className="text-red-600 dark:text-red-400 font-semibold">Not Available</span>
                      <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full"></div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaClock className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Start Time</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {service?.start_time || '0-1 mint'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Guarantee</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {service?.guarantee || 'No Guarantee'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaTachometerAlt className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Speed</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {service?.speed || '100k/Days'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-dotted border-gray-300 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <FaLink className="text-black dark:text-gray-300 w-4 h-4" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Link Type</span>
                </div>
                <span className="text-gray-800 dark:text-gray-100 font-semibold">
                  {service?.orderLink === 'username' ? 'Username' : 'Order Link'}
                </span>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Service Description:</p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• When the service is experiencing high demand, the starting speed may vary.</p>
                  <p>• Please avoid placing a second order on the same link until the current order is fully completed in the system.</p>
                  <p>• If you encounter any issues with the service, kindly reach out to our support team for assistance.</p>
                  <p>• Do not place orders for private accounts or private links. Orders for private content will not be processed and may not be refunded.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            <Link href={`/new-order?sId=${service?.id}`}>
              <button 
                className="btn btn-primary w-full h-12 text-lg font-semibold"
                onClick={handleClose}
              >
                Buy Now
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsModal;

