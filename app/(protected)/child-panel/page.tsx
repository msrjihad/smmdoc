'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState, useMemo } from 'react';
import {
    FaCheckCircle,
    FaChevronDown,
    FaCopy,
    FaEye,
    FaEyeSlash,
    FaInfoCircle,
    FaQuestionCircle,
    FaServer,
    FaShoppingCart,
    FaTimes,
} from 'react-icons/fa';

interface FormData {
  domain: string;
  currency: string;
  username: string;
  password: string;
  passwordConfirm: string;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  enabled: boolean;
}

const GradientSpinner = ({ size = 'w-5 h-5', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
    </div>
  </div>
);

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheckCircle className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

const ChildPanel: React.FC = () => {
  const { appName } = useAppNameWithFallback();
  const [formData, setFormData] = useState<FormData>({
    domain: '',
    currency: 'USD',
    username: '',
    password: '',
    passwordConfirm: '',
  });

  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [childPanelPriceUSD, setChildPanelPriceUSD] = useState<number>(10);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const nameservers = {
    ns1: 'ns1.smmdoc.com',
    ns2: 'ns2.smmdoc.com',
  };

  useEffect(() => {
    setPageTitle('Child Panel', appName);
  }, [appName]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsDataLoading(true);
        
        const currenciesResponse = await fetch('/api/currencies/enabled');
        if (currenciesResponse.ok) {
          const currenciesData = await currenciesResponse.json();
          if (currenciesData.success && currenciesData.currencies) {
            setCurrencies(currenciesData.currencies);
            if (currenciesData.currencies.length > 0) {
              const defaultCurrency = currenciesData.currencies.find((c: Currency) => c.code === 'USD') || currenciesData.currencies[0];
              setFormData(prev => {
                const currencyExists = currenciesData.currencies.find((c: Currency) => c.code === prev.currency);
                if (!currencyExists) {
                  return { ...prev, currency: defaultCurrency.code };
                }
                return prev;
              });
            }
          }
        }

        const priceResponse = await fetch('/api/user/child-panel/price');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          if (priceData.success && priceData.price !== undefined) {
            setChildPanelPriceUSD(priceData.price);
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setCurrencies([
          { id: 1, code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, enabled: true },
          { id: 5, code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 110.0, enabled: true },
        ]);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
    
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getPriceInCurrency = (usdPrice: number, currencyCode: string): number => {
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    if (!selectedCurrency) return usdPrice;
    return usdPrice * selectedCurrency.rate;
  };

  const formatPrice = (price: number, currencyCode: string): string => {
    const selectedCurrency = currencies.find(c => c.code === currencyCode);
    if (!selectedCurrency) return `$${price.toFixed(2)}`;
    
    const formattedPrice = price.toFixed(2);
    return `${selectedCurrency.symbol}${formattedPrice}`;
  };

  const faqs: FAQ[] = useMemo(() => [
    {
      question: 'What is child panel?',
      answer:
        `A child panel is a panel with a limited selection of features that is linked to one of your regular panels such as ${appName}`,
    },
    {
      question: 'How much cost for a child panel?',
      answer:
        `It will cost you ${formatPrice(childPanelPriceUSD, 'USD')} per month. Please note, you paying for panel, not for services, you have to pay for the services you will purchase from ${appName}`,
    },
    {
      question: 'How long it will take to activate the child panel?',
      answer:
        'It will take 3-6 hrs to active your child panel if you changed your name server perfectly.',
    },
    {
      question: 'Do you need hosting for child panel?',
      answer: "No, for child panel you just need a domain and that's all.",
    },
    {
      question: 'I have domain, what i can do next?',
      answer:
        `If you have domain, you can simply change your domain name server and point it to ${nameservers.ns1} ${nameservers.ns2} After you successfully changed the name server, you can submit a order for child panel`,
    },
    {
      question: 'How can i change name server for my domain?',
      answer:
        `Its actually depend on your domain provider, if you go to your domain settings and choose custom DNS and enter the name server given by ${appName}.`,
    },
    {
      question: `How to i connect child panel with ${appName}?`,
      answer:
        `You can simply go to https://yourdomain.com/admin/settings/providers and you will find out option to connect your panel with ${appName}. You can a key to connect your panel with ${appName}. This key you will find out on settings of your ${appName} account.`,
    },
    {
      question:
        'How can i get refund for child panel if i am not interested to continue?',
      answer:
        'Unfortunately refund not possible after we activate your child panel. But you can terminate your child panel any time by creating a ticket to us.',
    },
    {
      question:
        'I want to change my child panel domain address, what i need to do?',
      answer:
        'You can simply, change your new domain name server and send to us your new domain address. We will replace your new domain with old domain. But, this change only possible for 1 time.',
    },
    {
      question: 'How can i activate affiliate on my child panel?',
      answer: 'Unfortunately, there is no affiliate feature on child panel',
    },
    {
      question: 'How can i add payment gateway on our child panel?',
      answer:
        'You can visit https://yourdomain.com/admin/settings/payments - Add method - Choose Payment Method',
    },
    {
      question: 'How can i collect money from our customer?',
      answer:
        "You customer will pay to your own payment gateway account, they are not paying to us. So, you don't have to worry about payment. Setup your own payment gateway, and collect payment from your customers",
    },
    {
      question:
        `If i connect our child panel with ${appName}, is there any way customer will find out about ${appName}?`,
      answer:
        `No, your customer will never know about ${appName}. They will place order on your website and your order will automatically place to ${appName} under your user account.`,
    },
  ], [childPanelPriceUSD, currencies, appName]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        showToast(message, 'success');
      },
      (err) => {
        console.error('Could not copy text: ', err);
        showToast('Failed to copy to clipboard', 'error');
      }
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    let processedValue = value;

    if (name === 'username') {

      processedValue = value.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showToast('Child panel order submitted successfully!', 'success');
      console.log('Form submitted:', formData);
    }, 1000);
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  if (isPageLoading) {
    return (
      <div className="page-container">
          <div className="page-content">
            <div className="mb-6">
              <div className="card card-padding bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Create A Child Panel
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Create a child panel with your own domain and start your own
                      business. You can connect your child panel with {appName} and
                      start selling services to your customers.
                    </p>
                    <button className="btn btn-primary inline-flex items-center">
                      Get Started
                    </button>
                  </div>
                  <div className="lg:col-span-1 hidden lg:block">
                    <div className="flex justify-center">
                      <div className="w-48 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <FaServer className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div id="childPanelOrder">
                  <div className="card card-padding">
                    <div className="card-header mb-6">
                      <div className="card-icon">
                        <FaShoppingCart />
                      </div>
                      <h3 className="card-title">Create Child Panel</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="form-group">
                        <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="h-4 w-48 gradient-shimmer rounded mb-2" />
                        <div className="h-3 w-32 gradient-shimmer rounded mb-1" />
                        <div className="h-3 w-40 gradient-shimmer rounded" />
                      </div>

                      <div className="form-group">
                        <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>

                      <div className="form-group">
                        <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>

                      <div className="form-group">
                        <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>

                      <div className="form-group">
                        <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>

                      <div className="form-group">
                        <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>

                      <div className="pt-4">
                        <div className="h-10 w-full gradient-shimmer rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card card-padding">
                  <div className="card-header">
                    <div className="card-icon">
                      <FaQuestionCircle />
                    </div>
                    <h3 className="card-title">Frequently Asked Questions</h3>
                  </div>

                  <div className="space-y-3 mt-4">
                    {faqs.slice(0, 3).map((faq, index) => (
                      <div key={index} className="card">
                        <div className="w-full p-4 text-left flex justify-between items-center">
                          <span className="flex items-start gap-2 font-medium text-gray-900 dark:text-gray-100 pr-4">
                            <FaInfoCircle className="w-4 h-4 flex-shrink-0 mt-1" />
                            <span>{faq.question}</span>
                          </span>
                          <FaChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="page-container">
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <div className="page-content">
        <div className="mb-6">
          <div className="card card-padding bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Create A Child Panel
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Create a child panel with your own domain and start your own
                  business. You can connect your child panel with {appName} and
                  start selling services to your customers.
                </p>
                <a
                  href="#childPanelOrder"
                  className="btn btn-primary inline-flex items-center"
                >
                  Get Started
                </a>
              </div>
              <div className="lg:col-span-1 hidden lg:block">
                <div className="flex justify-center">
                  <div className="w-48 h-32 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <FaServer className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div id="childPanelOrder">
              <div className="card card-padding">
                <div className="card-header mb-6">
                  <div className="card-icon">
                    <FaShoppingCart />
                  </div>
                  <h3 className="card-title">Create Child Panel</h3>
                </div>
                <div className="space-y-6">
                  <div className="form-group">
                    <label htmlFor="domain" className="form-label">
                      Domain
                    </label>
                    <input
                      type="text"
                      id="domain"
                      name="domain"
                      value={formData.domain}
                      onChange={handleInputChange}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      placeholder="Enter your domain"
                      required
                    />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <div className="font-semibold mb-2 flex items-center">
                        <FaInfoCircle className="mr-2" />
                        Please change nameservers to:
                      </div>
                      <ul className="ml-4 space-y-1">
                        <li className="flex items-center justify-between group">
                          <span>• {nameservers.ns1}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(nameservers.ns1, 'Nameserver copied!')}
                            className="ml-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded cursor-pointer"
                            title="Copy nameserver"
                          >
                            <FaCopy className="h-3.5 w-3.5" />
                          </button>
                        </li>
                        <li className="flex items-center justify-between group">
                          <span>• {nameservers.ns2}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(nameservers.ns2, 'Nameserver copied!')}
                            className="ml-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded cursor-pointer"
                            title="Copy nameserver"
                          >
                            <FaCopy className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="currency" className="form-label">
                      Currency
                    </label>
                    <select
                      id="currency"
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      disabled={isDataLoading || currencies.length === 0}
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    >
                      {isDataLoading ? (
                        <option value="">Loading currencies...</option>
                      ) : currencies.length === 0 ? (
                        <option value="">No currencies available</option>
                      ) : (
                        currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.name} ({currency.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="username" className="form-label">
                      Admin username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.value = target.value.toLowerCase();
                      }}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      placeholder="Enter admin username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Admin password
                    </label>
                    <div className="password-input-container">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="form-field w-full px-4 py-3 pr-10 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="Enter admin password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="password-toggle text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-4 w-4" />
                        ) : (
                          <FaEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="passwordConfirm" className="form-label">
                      Confirm password
                    </label>
                    <div className="password-input-container">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="passwordConfirm"
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleInputChange}
                        className="form-field w-full px-4 py-3 pr-10 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="Confirm admin password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="password-toggle text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="h-4 w-4" />
                        ) : (
                          <FaEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="price" className="form-label">
                      Price per month
                    </label>
                    <input
                      type="text"
                      id="price"
                      value={isDataLoading ? 'Loading...' : formatPrice(getPriceInCurrency(childPanelPriceUSD, formData.currency), formData.currency)}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      readOnly
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="btn btn-primary w-full"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <GradientSpinner size="w-5 h-5" />
                          Processing...
                        </div>
                      ) : (
                        'Submit Order'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaQuestionCircle />
                </div>
                <h3 className="card-title">Frequently Asked Questions</h3>
              </div>

              <div className="space-y-3 mt-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="card">
                    <button
                      className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => toggleFAQ(index)}
                    >
                      <span className="flex items-start gap-2 font-medium text-gray-900 dark:text-gray-100 pr-4">
                        <FaInfoCircle className="w-4 h-4 flex-shrink-0 mt-1" />
                        <span>{faq.question}</span>
                      </span>
                      <div
                        className={`transform transition-transform duration-200 ${
                          openFAQ === index ? 'rotate-180' : 'rotate-0'
                        }`}
                      >
                        <FaChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      </div>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        openFAQ === index
                          ? 'max-h-96 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-3">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildPanel;
