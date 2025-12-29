'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import UserSwitchIcon from './user-switch-icon';

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

const UserSwitchWrapper = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const router = useRouter();
  const { update: updateSession } = useSession();

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSwitchBack = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/switch-back', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Successfully switched back to admin account', 'success');

        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          await updateSession();
          console.log('Session updated after switch back');
        } catch (error) {
          console.error('Error updating session:', error);
        }

        setTimeout(() => {
          const adminUrl = new URL('/admin', window.location.origin).href;
          window.location.href = adminUrl;
        }, 500);
      } else {
        showToast(data.error || 'Failed to switch back', 'error');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Switch back error:', error);
      showToast('An error occurred while switching back', 'error');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="toast-container">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>

      <UserSwitchIcon 
        onSwitchBack={handleSwitchBack}
        isLoading={isLoading}
      />
    </>
  );
};

export default UserSwitchWrapper;