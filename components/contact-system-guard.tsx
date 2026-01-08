'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FaEnvelope, FaExclamationTriangle, FaPhone, FaClock, FaTicketAlt, FaQuestionCircle, FaPaperPlane, FaHeadset } from 'react-icons/fa';

interface ContactSystemGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ContactSystemGuard: React.FC<ContactSystemGuardProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [supportEmail, setSupportEmail] = useState<string>('');
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const checkContactSystem = async () => {
      try {
        const response = await fetch('/api/contact-system-status');
        if (response.ok) {
          const data = await response.json();
          const enabled = data.contactSystemEnabled || false;
          setIsEnabled(enabled);

          if (!enabled) {

            const isAdmin = session?.user?.role === 'admin';
            const redirectPath = isAdmin ? '/admin' : '/dashboard';
            router.push(redirectPath);
            return;
          }
        } else {

          const isAdmin = session?.user?.role === 'admin';
          const redirectPath = isAdmin ? '/admin' : '/dashboard';
          router.push(redirectPath);
          return;
        }
      } catch (error) {
        console.error('Error checking contact system status:', error);

        const isAdmin = session?.user?.role === 'admin';
        const redirectPath = isAdmin ? '/admin' : '/dashboard';
        router.push(redirectPath);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkContactSystem();
  }, []);

  if (isLoading) {
    return (
      <>
        <div className="page-container">
          <div className="page-content">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card card-padding">
                  <div className="card-header">
                    <div className="card-icon">
                      <FaHeadset />
                    </div>
                    <h3 className="card-title">Send Message</h3>
                  </div>

                  <div className="space-y-6 mt-6">
                    <div className="form-group">
                      <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>

                    <div className="form-group">
                      <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>

                    <div className="form-group">
                      <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>

                    <div className="form-group">
                      <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                      <div className="h-24 w-full gradient-shimmer rounded-lg" />
                      <div className="h-3 w-64 gradient-shimmer rounded mt-1" />
                    </div>

                    <div className="form-group">
                      <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                      <div className="h-10 w-full gradient-shimmer rounded-lg" />
                    </div>

                    <button
                      type="button"
                      disabled
                      className="btn btn-primary w-full"
                    >
                      <FaPaperPlane className="mr-2 w-4 h-4" />
                      Send Message
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card card-padding">
                  <div className="card-header">
                    <div className="card-icon">
                      <FaEnvelope />
                    </div>
                    <h3 className="card-title">Contact Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <FaEnvelope className="text-blue-600 text-sm" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Email</h4>
                        {supportEmail ? (
                          <a href={`mailto:${supportEmail}`} className="text-gray-600 text-sm hover:text-[var(--primary)] transition-colors">
                            {supportEmail}
                          </a>
                        ) : (
                          <p className="text-gray-600 text-sm">Not configured</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <FaClock className="text-purple-600 text-sm" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Hours</h4>
                        <p className="text-gray-600 text-sm">24/7 Support</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card card-padding">
                  <div className="card-header">
                    <div className="card-icon">
                      <FaTicketAlt />
                    </div>
                    <h3 className="card-title">Support Tickets</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      For ongoing issues, you can also create a Support Tickets and
                      track its progress.
                    </p>
                    <Link
                      href="/support-tickets/history"
                      className={`btn btn-secondary w-full inline-flex items-center justify-center`}
                    >
                      <FaTicketAlt className="mr-2 w-4 h-4" />
                      View My Ticket
                    </Link>
                  </div>
                </div>

                <div className="card card-padding">
                  <div className="card-header">
                    <div className="card-icon">
                      <FaQuestionCircle />
                    </div>
                    <h3 className="card-title">Frequently Asked Questions</h3>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Check our FAQ section for quick answers to common questions.
                    </p>
                    <Link
                      href="/faqs"
                      className={`btn btn-secondary w-full inline-flex items-center justify-center`}
                    >
                      <FaQuestionCircle className="mr-2 w-4 h-4" />
                      View FAQs
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default ContactSystemGuard;