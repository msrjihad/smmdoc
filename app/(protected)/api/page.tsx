'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { getUserDetails } from '@/lib/actions/getUser';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    FaBan,
    FaBook,
    FaCheckCircle,
    FaCode,
    FaCopy,
    FaDollarSign,
    FaExclamationTriangle,
    FaEye,
    FaEyeSlash,
    FaInfoCircle,
    FaKey,
    FaLifeRing,
    FaList,
    FaPlus,
    FaQuestionCircle,
    FaRedo,
    FaSync,
    FaTimes,
} from 'react-icons/fa';

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : type === 'error'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        : type === 'info'
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
    }`}
  >
    <div className="flex items-center space-x-2">
      {type === 'success' && <FaCheckCircle className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded">
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);

interface ServiceType {
  id: number;
  name: string;
  parameters: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export default function ApiIntegrationPage() {
  const { appName } = useAppNameWithFallback();

  useEffect(() => {
    setPageTitle('API Integration', appName);
  }, [appName]);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServiceType, setSelectedServiceType] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'php' | 'python' | 'nodejs'>(
    'php'
  );
  const user = useCurrentUser();

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setIsLoading(true);

        const userData = await getUserDetails();

        if (userData && (userData as any).apiKey) {
          setApiKey((userData as any).apiKey);
        } else {
          setApiKey(null);
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
        setApiKey(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchApiKey();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const generateNewApiKey = async () => {
    setIsGeneratingKey(true);

    try {
      const response = await fetch('/api/user/generate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setApiKey(result.data.apiKey);
        setShowApiKey(true);

        showToast(
          'New API key generated successfully! Your previous API key is no longer valid.',
          'success'
        );
      } else {
        showToast(
          result.error || 'Failed to generate new API key. Please try again later.',
          'error'
        );
      }
    } catch (error) {
      console.error('Error generating new API key:', error);
      showToast(
        'Failed to generate new API key. Please try again later.',
        'error'
      );
    } finally {
      setIsGeneratingKey(false);
    }
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

  const serviceTypes: ServiceType[] = [
    {
      id: 0,
      name: 'Default',
      parameters: [
        { name: 'key', description: 'Your API key', required: true },
        { name: 'action', description: 'add', required: true },
        { name: 'service', description: 'Service ID', required: true },
        { name: 'link', description: 'Link to page', required: true },
        { name: 'quantity', description: 'Needed quantity', required: true },
        { name: 'runs (optional)', description: 'Runs to deliver' },
        { name: 'interval (optional)', description: 'Interval in minutes' },
      ],
    },
    {
      id: 10,
      name: 'Package',
      parameters: [
        { name: 'key', description: 'Your API key', required: true },
        { name: 'action', description: 'add', required: true },
        { name: 'service', description: 'Service ID', required: true },
        { name: 'link', description: 'Link to page', required: true },
      ],
    },
    {
      id: 1,
      name: 'SEO',
      parameters: [
        { name: 'key', description: 'Your API key', required: true },
        { name: 'action', description: 'add', required: true },
        { name: 'service', description: 'Service ID', required: true },
        { name: 'link', description: 'Link to page', required: true },
        { name: 'quantity', description: 'Needed quantity', required: true },
        {
          name: 'keywords',
          description: 'Keywords list separated by \\r\\n or \\n',
          required: true,
        },
      ],
    },
    {
      id: 2,
      name: 'Custom Comments',
      parameters: [
        { name: 'key', description: 'Your API key', required: true },
        { name: 'action', description: 'add', required: true },
        { name: 'service', description: 'Service ID', required: true },
        { name: 'link', description: 'Link to page', required: true },
        {
          name: 'comments',
          description: 'Comments list separated by \\r\\n or \\n',
          required: true,
        },
      ],
    },
    {
      id: 100,
      name: 'Subscriptions',
      parameters: [
        { name: 'key', description: 'Your API key', required: true },
        { name: 'action', description: 'add', required: true },
        { name: 'service', description: 'Service ID', required: true },
        { name: 'username', description: 'Username', required: true },
        { name: 'min', description: 'Quantity min', required: true },
        { name: 'max', description: 'Quantity max', required: true },
        { name: 'delay', description: 'Delay in minutes', required: true },
      ],
    },
  ];

  const getCurrentServiceType = (): ServiceType => {
    return (
      serviceTypes.find((type) => type.id === selectedServiceType) ||
      serviceTypes[0]
    );
  };

  const codeExamples = {
    php: `<?php

$url = 'https://smmdoc.com/api/v2';

$apiKey = '${apiKey || 'YOUR_API_KEY'}';

$postData = [
    'key' => $apiKey,
    'action' => 'add',
    'service' => 1,
    'link' => 'https://www.instagram.com/username',
    'quantity' => 100
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`,
    python: `import requests

url = 'https://smmdoc.com/api/v2'
api_key = '${apiKey || 'YOUR_API_KEY'}'

payload = {
    'key': api_key,
    'action': 'add',
    'service': 1,
    'link': 'https://www.instagram.com/username',
    'quantity': 100
}

response = requests.post(url, data=payload)
print(response.json())`,
    nodejs: `const axios = require('axios');

const url = 'https://smmdoc.com/api/v2';
const apiKey = '${apiKey || 'YOUR_API_KEY'}';

const payload = {
  key: apiKey,
  action: 'add',
  service: 1,
  link: 'https://www.instagram.com/username',
  quantity: 100
};

axios.post(url, payload)
  .then(response => console.log(response.data))
  .catch(error => console.error(error));`,
  };

  return (
    <div className="page-container">
        {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      <div className="page-content">
        <div className="space-y-6">
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaKey />
              </div>
              <h3 className="card-title">API Key Management</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use this key to authenticate your API requests. Keep it secret
                and secure.
              </p>

              {isLoading ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 gradient-shimmer rounded" />
                  </div>
                  <div className="h-10 w-20 gradient-shimmer rounded-lg" />
                  <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey || ''}
                      readOnly
                      className="form-field w-full pr-10 font-monow-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showApiKey ? (
                        <FaEyeSlash className="h-4 w-4" />
                      ) : (
                        <FaEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      apiKey &&
                      copyToClipboard(apiKey, 'API key copied to clipboard')
                    }
                    disabled={!apiKey}
                    className="btn btn-secondary"
                  >
                    <FaCopy className="h-4 w-4 mr-2" />
                    Copy
                  </button>
                  <button
                    onClick={generateNewApiKey}
                    disabled={isGeneratingKey}
                    className="btn btn-primary"
                  >
                    {isGeneratingKey ? (
                      <>
                        Generating...
                      </>
                    ) : (
                      <>
                        <FaSync className="h-4 w-4 mr-2" />
                        Generate New Key
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-yellow-800 dark:text-yellow-200 font-medium">Important</h4>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                      Generating a new API key will invalidate your previous
                      key. Make sure to update your applications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaCode />
              </div>
              <h3 className="card-title">API Documentation</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    HTTP Method
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">POST</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">API URL</h4>
                  <p className="text-gray-600 dark:text-gray-300 font-mono text-sm">
                    https:
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Response Format
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">JSON</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">API Key</h4>
                  <p className="text-gray-600 dark:text-gray-300">Required for all requests</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaList />
              </div>
              <h3 className="card-title">Service List</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        services
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`[
  {
    "service": 1,
    "name": "Followers",
    "type": "Default",
    "category": "Instagram",
    "rate": "0.90",
    "min": "50",
    "max": "10000"
  }
]`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaPlus />
              </div>
              <h3 className="card-title">Add Order</h3>
            </div>

            <div className="space-y-6">
              <div className="form-group">
                <label className="form-label">Service Type</label>
                <div className="relative">
                  <select
                    value={selectedServiceType}
                    onChange={(e) => setSelectedServiceType(Number(e.target.value))}
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointe"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentServiceType().parameters.map((param, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            {param.name}
                          </span>
                          {param.required && (
                            <span className="text-red-500 dark:text-red-400 ml-1">*</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                          {param.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "order": 23501
}`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaCheckCircle />
              </div>
              <h3 className="card-title">Order Status</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        status
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">order</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Order ID
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "charge": "0.27819",
  "start_count": "3572",
  "status": "Partial",
  "remains": "157",
  "currency": "USD"
}`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaList />
              </div>
              <h3 className="card-title">Multiple Orders Status</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        status
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">orders</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Order IDs (separated by a comma, up to 100 IDs)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "1": {
    "charge": "0.27819",
    "start_count": "3572",
    "status": "Partial",
    "remains": "157",
    "currency": "USD"
  },
  "10": {
    "error": "Incorrect order ID"
  },
  "100": {
    "charge": "1.44219",
    "start_count": "234",
    "status": "In progress",
    "remains": "10",
    "currency": "USD"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaRedo />
              </div>
              <h3 className="card-title">Create Refill</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        refill
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">order</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Order ID
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "refill": "1"
}`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaRedo />
              </div>
              <h3 className="card-title">Create Multiple Refill</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        refill
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">orders</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Order IDs (separated by a comma, up to 100 IDs)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`[
  {
    "order": 1,
    "refill": 1
  },
  {
    "order": 2,
    "refill": 2
  },
  {
    "order": 3,
    "refill": {
      "error": "Incorrect order ID"
    }
  }
]`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaInfoCircle />
              </div>
              <h3 className="card-title">Get Refill Status</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        refill_status
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">refill</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Refill ID
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "status": "Completed"
}`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaInfoCircle />
              </div>
              <h3 className="card-title">Get Multiple Refill Status</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        refill_status
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">refills</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Refill IDs (separated by a comma, up to 100 IDs)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`[
  {
    "refill": 1,
    "status": "Completed"
  },
  {
    "refill": 2,
    "status": "Rejected"
  },
  {
    "refill": 3,
    "status": {
      "error": "Refill not found"
    }
  }
]`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaBan />
              </div>
              <h3 className="card-title">Create Cancel</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        cancel
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">orders</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Order IDs (separated by a comma, up to 100 IDs)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`[
  {
    "order": 9,
    "cancel": {
      "error": "Incorrect order ID"
    }
  },
  {
    "order": 2,
    "cancel": 1
  }
]`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaDollarSign />
              </div>
              <h3 className="card-title">User Balance</h3>
            </div>

            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[var(--card-bg)]">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Parameters
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">key</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        Your API key
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)]">
                      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">action</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        balance
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Example Response
                </h4>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  {`{
  "balance": "100.84292",
  "currency": "USD"
}`}
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaCode />
              </div>
              <h3 className="card-title">Code Examples</h3>
            </div>

            <div className="space-y-6">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('php')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'php'
                      ? 'bg-white dark:bg-gradient-to-r dark:from-[var(--primary)] dark:to-[var(--secondary)] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  PHP
                </button>
                <button
                  onClick={() => setActiveTab('python')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'python'
                      ? 'bg-white dark:bg-gradient-to-r dark:from-[var(--primary)] dark:to-[var(--secondary)] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveTab('nodejs')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'nodejs'
                      ? 'bg-white dark:bg-gradient-to-r dark:from-[var(--primary)] dark:to-[var(--secondary)] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  Node.js
                </button>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {activeTab === 'php' && 'PHP'}
                    {activeTab === 'python' && 'Python'}
                    {activeTab === 'nodejs' && 'Node.js'}
                  </h4>
                  <button
                    onClick={() => {
                      const currentCode =
                        activeTab === 'php'
                          ? codeExamples.php
                          : activeTab === 'python'
                          ? codeExamples.python
                          : codeExamples.nodejs;
                      copyToClipboard(
                        currentCode,
                        `${
                          activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                        } code copied to clipboard`
                      );
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <FaCopy className="h-4 w-4 mr-2" />
                    Copy
                  </button>
                </div>
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>
                    {activeTab === 'php' && codeExamples.php}
                    {activeTab === 'python' && codeExamples.python}
                    {activeTab === 'nodejs' && codeExamples.nodejs}
                  </code>
                </pre>
              </div>
            </div>
          </div>
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaQuestionCircle />
              </div>
              <h3 className="card-title">Need Help?</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you need assistance with API integration, please contact our
                support team or check our detailed documentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact-support"
                  className={`btn btn-secondary inline-flex items-center justify-center`}
                >
                  <FaLifeRing className="mr-2 w-4 h-4" />
                  Contact Support
                </Link>
                <Link
                  href="https://docs.smmdoc.com"
                  target="_blank"
                  className={`btn btn-secondary inline-flex items-center justify-center`}
                >
                  <FaBook className="mr-2 w-4 h-4" />
                  API Documentation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
}
