'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { useEffect, useState } from 'react';
import { FaTools, FaClock, FaRedo, FaEnvelope } from 'react-icons/fa';

export default function MaintenancePage() {
  const { appName } = useAppNameWithFallback();
  const [supportEmail, setSupportEmail] = useState<string>('');

  useEffect(() => {
    document.title = `Maintenance Mode - ${appName}`;
    
    const fetchSupportEmail = async () => {
      try {
        const response = await fetch('/api/public/general-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.generalSettings?.supportEmail) {
            setSupportEmail(data.generalSettings.supportEmail);
          }
        }
      } catch (error) {
        console.error('Error fetching support email:', error);
      }
    };

    fetchSupportEmail();
  }, [appName]);

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8">
          <div className="max-w-2xl w-full">
            <div className="card" style={{ padding: '2.5rem' }}>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div 
                      className="card-icon rounded-full"
                      style={{
                        width: '5rem',
                        height: '5rem',
                        borderRadius: '50%'
                      }}
                    >
                      <FaTools style={{ width: '2.5rem', height: '2.5rem' }} />
                    </div>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Under Maintenance
                  </h1>
                  
                  <div className="flex items-center justify-center gap-2 mb-4" style={{ color: 'var(--text-secondary)' }}>
                    <FaClock className="text-xl" />
                    <p className="text-lg font-medium">
                      We&apos;re currently performing scheduled maintenance
                    </p>
                  </div>
                  
                  <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    We&apos;re working hard to improve your experience. The site will be back online shortly.
                    Thank you for your patience.
                  </p>
                </div>

                <div 
                  className="rounded-lg p-4 border"
                  style={{
                    backgroundColor: 'var(--toast-pending-bg)',
                    borderColor: 'var(--toast-pending-border)'
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--toast-pending)' }}>
                    <strong>Expected Duration:</strong> We&apos;ll be back as soon as possible. 
                    If you have urgent inquiries, please contact our support team.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary text-base px-8 py-4"
                  >
                    <FaRedo className="w-5 h-5 mr-3" />
                    Refresh Page
                  </button>
                  {supportEmail && (
                    <a
                      href={`mailto:${supportEmail}`}
                      className="btn btn-secondary text-base px-8 py-4"
                    >
                      <FaEnvelope className="w-5 h-5 mr-3" />
                      Contact Support
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

