'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
    FaCode,
    FaCreditCard,
    FaHeadset,
    FaQuestionCircle,
    FaSearch,
    FaShoppingCart,
    FaUserTie,
} from 'react-icons/fa';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQPage = () => {
  const { appName } = useAppNameWithFallback();

  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageTitle('FAQs', appName);
  }, [appName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: 'What is SMM Panel?',
      answer:
        'SMM (Social Media Marketing) Panel is a platform that allows you to purchase social media marketing services like followers, likes, views, and more for various social media platforms at wholesale prices.',
      category: 'general',
    },
    {
      id: 2,
      question: 'How do I place an order?',
      answer:
        'To place an order, simply navigate to the "New Order" section, select the service you want, enter the required details (like the link to your social media profile or post), enter the quantity, and complete the payment.',
      category: 'orders',
    },
    {
      id: 3,
      question: 'How long does it take to deliver an order?',
      answer:
        'Delivery time varies depending on the service. Some services start delivering within minutes, while others may take a few hours to start. The estimated delivery time is mentioned in the service description.',
      category: 'orders',
    },
    {
      id: 4,
      question: 'What payment methods do you accept?',
      answer:
        'We accept various payment methods including credit/debit cards, PayPal, cryptocurrency, and local payment options like bKash, Nagad, and bank transfers.',
      category: 'payment',
    },
    {
      id: 5,
      question: 'Is it safe to use SMM services?',
      answer:
        "Yes, our services are safe to use. We use high-quality methods that comply with social media platforms' terms of service. However, we recommend using these services moderately and naturally.",
      category: 'general',
    },
    {
      id: 6,
      question: 'What happens if my order is not delivered?',
      answer:
        'If your order is not delivered within the expected timeframe, you can open a Support Tickets, and our team will investigate the issue. If the service cannot be delivered, you will receive a refund.',
      category: 'orders',
    },
    {
      id: 7,
      question: "Can I get a refund if I'm not satisfied?",
      answer:
        'Refund policies vary by service. Generally, if a service is not delivered as described, you can request a refund through our support system. Please check our terms of service for detailed refund policies.',
      category: 'payment',
    },
    {
      id: 8,
      question: 'How do I add funds to my account?',
      answer:
        'To add funds, go to the "Add Funds" section, select your preferred payment method, enter the amount you wish to add, and follow the payment instructions.',
      category: 'payment',
    },
    {
      id: 9,
      question: 'Do you offer an API for resellers?',
      answer:
        'Yes, we provide an API for resellers. You can access the API documentation in the "API Integration" section of your dashboard. Our API is available at /api/v2 and allows you to automate orders and check service status.',
      category: 'api',
    },
    {
      id: 10,
      question: 'What is a child panel?',
      answer:
        "A child panel is a reseller panel that you can purchase from us. It's a complete SMM panel with your own domain, where you can set your own prices and sell services to your customers.",
      category: 'reseller',
    },
    {
      id: 11,
      question: 'How can I contact support?',
      answer:
        'You can contact our support team by opening a ticket in the "Support Tickets" section of your dashboard. Our support team is available 24/7 to assist you.',
      category: 'support',
    },
    {
      id: 12,
      question: 'Can I cancel my order after placing it?',
      answer:
        "Once an order is placed, it cannot be canceled as our system starts processing it immediately. However, if the order hasn't started yet, you can contact support for assistance.",
      category: 'orders',
    },
  ];

  const filteredFAQs = faqItems.filter(
    (item) =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedFAQs = filteredFAQs.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  const categoryNames: Record<string, { name: string; icon: React.ReactNode }> =
    {
      general: {
        name: 'General Questions',
        icon: <FaQuestionCircle className="w-5 h-5" />,
      },
      orders: { name: 'Orders', icon: <FaShoppingCart className="w-5 h-5" /> },
      payment: {
        name: 'Payment & Billing',
        icon: <FaCreditCard className="w-5 h-5" />,
      },
      api: { name: 'API & Integration', icon: <FaCode className="w-5 h-5" /> },
      reseller: {
        name: 'Reseller Services',
        icon: <FaUserTie className="w-5 h-5" />,
      },
      support: { name: 'Support', icon: <FaHeadset className="w-5 h-5" /> },
    };

  const toggleItem = (itemId: number) => {
    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  if (isLoading) {
    return (
      <div className="page-container">
          <div className="page-content">
            <div className="card card-padding">
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="h-10 w-full gradient-shimmer rounded-lg pl-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(categoryNames).map(([category, categoryInfo]) => (
                  <div key={category}>
                    <div className="card-header mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="card-icon">
                          {categoryInfo.icon}
                        </div>
                        <div className="h-6 w-32 gradient-shimmer rounded" />
                      </div>
                      <div className="h-6 w-20 gradient-shimmer rounded-full" />
                    </div>

                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, itemIdx) => (
                        <div key={itemIdx} className="card">
                          <div className="w-full p-4 flex justify-between items-center">
                            <div className="flex-1">
                              <div className="h-5 w-full gradient-shimmer rounded mb-2" />
                              <div className="h-5 w-3/4 gradient-shimmer rounded" />
                            </div>
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="card card-padding">
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-field w-full pl-10 pr-4 py-3 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                autoComplete="off"
              />
            </div>
          </div>
          {Object.keys(groupedFAQs).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FaQuestionCircle className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
              <div className="text-lg text-gray-900 dark:text-gray-300">
                No questions found matching your search.
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Try different keywords or browse all categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(groupedFAQs).map(([category, items]) => (
                <div key={category}>
                  <div className="card-header mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="card-icon">
                        {categoryNames[category]?.icon}
                      </div>
                      <h3 className="card-title">
                        {categoryNames[category]?.name || category}
                      </h3>
                    </div>
                    <span className="bg-primary/10 dark:bg-[var(--primary)]/20 text-primary dark:text-[var(--primary)] border border-primary/20 dark:border-[var(--primary)]/30 px-3 py-1 rounded-full text-sm font-medium w-full sm:w-auto text-center">
                      {items.length}{' '}
                      {items.length === 1 ? 'question' : 'questions'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="card">
                        <button
                          className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => toggleItem(item.id)}
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100 pr-4">
                            {item.question}
                          </span>
                          <div
                            className={`transform transition-transform duration-200 ${
                              openItems.includes(item.id)
                                ? 'rotate-180'
                                : 'rotate-0'
                            }`}
                          >
                            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          </div>
                        </button>

                        <div
                          className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            openItems.includes(item.id)
                              ? 'max-h-96 opacity-100'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
