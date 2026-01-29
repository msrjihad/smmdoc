'use client';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaDollarSign,
    FaExclamationTriangle,
    FaInfoCircle,
    FaRocket,
    FaTimes,
    FaUser
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const WithdrawalMethodsSection = dynamic(
  () => import('@/components/dashboard/affiliate/withdrawal-methods'),
  { ssr: false }
);

const WithdrawalMethodsSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="card card-padding">
        <div className="card-header mb-6">
          <div className="card-icon">
            <div className="h-10 w-10 gradient-shimmer rounded-lg" />
          </div>
          <div className="h-6 w-56 gradient-shimmer rounded" />
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-[#1e1f2e] rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-4 w-4 gradient-shimmer rounded" />
              <div className="h-5 w-40 gradient-shimmer rounded" />
            </div>
            <div className="h-4 w-32 gradient-shimmer rounded mb-1" />
            <div className="h-4 w-40 gradient-shimmer rounded" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-32 gradient-shimmer rounded" />
              <div className="h-9 w-40 gradient-shimmer rounded-lg" />
            </div>
            <div className="text-center py-8 bg-gray-50 dark:bg-[#1e1f2e] border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="h-8 w-8 gradient-shimmer rounded mx-auto mb-2" />
              <div className="h-4 w-64 gradient-shimmer rounded mx-auto" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-4 w-4 gradient-shimmer rounded mt-1" />
              <div className="h-4 w-64 gradient-shimmer rounded" />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 h-12 gradient-shimmer rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

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
      {type === 'error' && <FaExclamationTriangle className="w-4 h-4" />}
      {type === 'info' && <FaInfoCircle className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
      >
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);

interface WithdrawalMethod {
  id: string;
  method: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank';
  mobileNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  routingNumber?: string;
  swiftCode?: string;
}

interface ActivationFormData {
  withdrawalMethods: WithdrawalMethod[];
}

export default function ActivateAffiliatePage() {
  const { appName } = useAppNameWithFallback();
  const router = useRouter();

  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [formData, setFormData] = useState<ActivationFormData>({
    withdrawalMethods: [],
  });
  const [errors, setErrors] = useState<{ withdrawalMethods?: string }>({});

  useEffect(() => {
    setPageTitle('Activate Affiliate Account', appName);
  }, [appName]);

  useEffect(() => {
    const checkAffiliateStatus = async () => {
      try {
        const response = await fetch('/api/user/affiliate/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.isActivated) {
            setIsActivated(true);
          }
        }
      } catch (error) {
        console.error('Error checking affiliate status:', error);
      } finally {
        setCheckingStatus(false);
      }
    };

    if (user?.id) {
      checkAffiliateStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [user]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const validateForm = (): boolean => {
    const newErrors: any = {};

    if (formData.withdrawalMethods.length === 0) {
      newErrors.withdrawalMethods = 'Please add at least one withdrawal method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddWithdrawalMethod = async (withdrawalMethod: WithdrawalMethod) => {
    const updatedWithdrawalMethods = [...formData.withdrawalMethods, withdrawalMethod];
    setFormData(prev => ({
      ...prev,
      withdrawalMethods: updatedWithdrawalMethods,
    }));

    try {
      const response = await fetch('/api/user/affiliate/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethods: updatedWithdrawalMethods,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to save withdrawal method:', response.status, errorText);
        setFormData(prev => ({
          ...prev,
          withdrawalMethods: prev.withdrawalMethods.filter(wm => wm.id !== withdrawalMethod.id),
        }));
        showToast(`Failed to save withdrawal method`, 'error');
        return;
      }

      const data = await response.json();
      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const res = await fetch('/api/user/affiliate/payment-methods');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setFormData(prev => ({ ...prev, withdrawalMethods: json.data }));
            showToast('Withdrawal method saved successfully!', 'success');
          }
        }
      } else {
        setFormData(prev => ({
          ...prev,
          withdrawalMethods: prev.withdrawalMethods.filter(wm => wm.id !== withdrawalMethod.id),
        }));
        showToast(data.message || 'Failed to save withdrawal method', 'error');
      }
    } catch (error: any) {
      console.error('Error saving withdrawal method:', error);
      setFormData(prev => ({
        ...prev,
        withdrawalMethods: prev.withdrawalMethods.filter(wm => wm.id !== withdrawalMethod.id),
      }));
      showToast('Error saving withdrawal method. Please try again.', 'error');
    }
  };

  const handleRemoveWithdrawalMethod = async (id: string) => {
    if (formData.withdrawalMethods.length <= 1) {
      showToast('You must have at least one payment method', 'error');
      return;
    }

    const withdrawalMethodToRemove = formData.withdrawalMethods.find(wm => wm.id === id);
    const updatedWithdrawalMethods = formData.withdrawalMethods.filter(wm => wm.id !== id);
    
    setFormData(prev => ({
      ...prev,
      withdrawalMethods: updatedWithdrawalMethods,
    }));

    try {
      const response = await fetch('/api/user/affiliate/payment-methods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethods: updatedWithdrawalMethods,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to remove withdrawal method:', response.status, errorText);
        setFormData(prev => ({
          ...prev,
          withdrawalMethods: [...prev.withdrawalMethods, withdrawalMethodToRemove!].filter(Boolean),
        }));
        showToast(`Failed to remove withdrawal method`, 'error');
        return;
      }

      const data = await response.json();
      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const res = await fetch('/api/user/affiliate/payment-methods');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const deletedItemStillExists = json.data.some((wm: WithdrawalMethod) => wm.id === id);
            if (deletedItemStillExists) {
              setFormData(prev => ({
                ...prev,
                withdrawalMethods: [...prev.withdrawalMethods, withdrawalMethodToRemove!].filter(Boolean),
              }));
              showToast('Delete failed: Item still exists', 'error');
            } else {
              setFormData(prev => ({ ...prev, withdrawalMethods: json.data }));
              showToast('Withdrawal method removed successfully!', 'info');
            }
          }
        }
      } else {
        setFormData(prev => ({
          ...prev,
          withdrawalMethods: [...prev.withdrawalMethods, withdrawalMethodToRemove!].filter(Boolean),
        }));
        showToast(data.message || 'Failed to remove withdrawal method', 'error');
      }
    } catch (error: any) {
      console.error('Error removing withdrawal method:', error);
      setFormData(prev => ({
        ...prev,
        withdrawalMethods: [...prev.withdrawalMethods, withdrawalMethodToRemove!].filter(Boolean),
      }));
      showToast('Error removing withdrawal method. Please try again.', 'error');
    }
  };

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors below', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/affiliate/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethods: formData.withdrawalMethods,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActivated(true);
        showToast('Affiliate account activated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to activate affiliate account', 'error');
      }
    } catch (error) {
      console.error('Error activating affiliate account:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/affiliate/payment-methods')
        if (res.ok) {
          const json = await res.json()
          if (json.success && Array.isArray(json.data)) {
            setFormData(prev => ({ ...prev, withdrawalMethods: json.data }))
          }
        }
      } catch {}
    })()
  }, [])

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] dark:bg-[var(--page-bg)] transition-colors duration-200">
        <div className="space-y-6">
          <WithdrawalMethodsSkeleton />
        </div>
      </div>
    );
  }

  if (isActivated) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] dark:bg-[var(--page-bg)] transition-colors duration-200">
        <div className="space-y-6">
          <div className="card card-padding">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Affiliate Account Active!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your affiliate account is already activated and ready to use.
              </p>
              <a
                href="/affiliate"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity duration-200"
              >
                <FaRocket className="w-4 h-4 mr-2" />
                Go to Affiliate Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] dark:bg-[var(--page-bg)] transition-colors duration-200">
      <div className="space-y-6">
        {toastMessage && (
          <Toast
            message={toastMessage.message}
            type={toastMessage.type}
            onClose={() => setToastMessage(null)}
          />
        )}
        <div className="mb-4">
          <button
            onClick={() => router.push('/affiliate')}
            className="btn btn-primary inline-flex items-center"
          >
            <FaArrowLeft className="w-4 h-4 mr-2" />
            Back to Affiliate Page
          </button>
        </div>
        <div className="card card-padding">
          <div className="card-header mb-6">
            <div className="card-icon">
              <FaDollarSign />
            </div>
            <h2 className="card-title">Configure Withdrawal Methods</h2>
          </div>

          <form onSubmit={handleActivateAccount} className="space-y-6">
            <div className="bg-gray-50 dark:bg-[#1e1f2e] rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-2">
                <FaUser className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Account Information</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Username:</strong> {user?.username || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Email:</strong> {user?.email || 'Not available'}
              </p>
            </div>
            <WithdrawalMethodsSection
              withdrawalMethods={formData.withdrawalMethods}
              onAddWithdrawalMethod={handleAddWithdrawalMethod}
              onRemoveWithdrawalMethod={handleRemoveWithdrawalMethod}
              errors={errors}
              onShowToast={showToast}
            />
            
          </form>
        </div>
      </div>
    </div>
  );
}