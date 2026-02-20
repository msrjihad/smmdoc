'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import {
  FaBan,
  FaCreditCard,
  FaExclamationTriangle,
  FaFileContract,
  FaGavel,
  FaInfoCircle,
  FaUserCheck,
  FaUserShield,
} from 'react-icons/fa';

export default function TermsPage() {
  const { appName } = useAppNameWithFallback();
  const [isLoading, setIsLoading] = useState(true);
  const [supportEmail, setSupportEmail] = useState<string>('');

  useEffect(() => {
    setPageTitle('Terms & Conditions', appName);
  }, [appName]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const termsData = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: <FaUserCheck />,
      content: [
        'By accessing and using our social media marketing services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.',
        'If you do not agree with any part of these terms, you must not use our services.',
        'We reserve the right to modify these terms at any time without prior notice.',
      ],
    },
    {
      id: 'services',
      title: 'Description of Services',
      icon: <FaInfoCircle />,
      content: [
        'We provide social media marketing services including but not limited to followers, likes, views, comments, and engagement for various social media platforms.',
        'All services are delivered through automated systems and third-party providers.',
        'Service delivery times may vary depending on the platform and service type.',
        'We do not guarantee specific results or outcomes from our services.',
      ],
    },
    {
      id: 'user-responsibilities',
      title: 'User Responsibilities',
      icon: <FaUserShield />,
      content: [
        'You must provide accurate and complete information when placing orders.',
        "You are responsible for ensuring your social media accounts comply with the respective platform's terms of service.",
        'You must not use our services for illegal, harmful, or fraudulent purposes.',
        'You agree not to resell our services without proper authorization.',
        'You must keep your account credentials secure and confidential.',
      ],
    },
    {
      id: 'payment-terms',
      title: 'Payment Terms',
      icon: <FaCreditCard />,
      content: [
        'All payments must be made in advance before service delivery begins.',
        'We accept various payment methods as displayed on our platform.',
        'All transactions are processed securely through trusted payment gateways.',
        'Refunds are subject to our refund policy and specific service conditions.',
        'You are responsible for any transaction fees charged by payment processors.',
      ],
    },
    {
      id: 'prohibited-activities',
      title: 'Prohibited Activities',
      icon: <FaBan />,
      content: [
        'Using our services to promote illegal content, hate speech, or harmful activities.',
        'Attempting to manipulate or exploit our systems or pricing.',
        'Creating multiple accounts to abuse promotions or discounts.',
        'Sharing account access with unauthorized parties.',
        'Using our services in ways that violate social media platform policies.',
        'Engaging in fraudulent activities or chargebacks without valid reasons.',
      ],
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers and Limitations',
      icon: <FaExclamationTriangle />,
      content: [
        'Our services are provided "as is" without warranties of any kind.',
        'We do not guarantee that services will meet your specific requirements.',
        'We are not responsible for any actions taken by social media platforms against your accounts.',
        'Service delivery may be affected by platform updates, policy changes, or technical issues.',
        'We reserve the right to refuse service to any user at our discretion.',
      ],
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      icon: <FaGavel />,
      content: [
        'In no event shall we be liable for any indirect, incidental, or consequential damages.',
        'Our total liability shall not exceed the amount paid for the specific service in question.',
        'We are not responsible for any losses resulting from account suspensions or bans.',
        'Users assume all risks associated with using social media marketing services.',
        'We shall not be liable for any damages arising from service interruptions or delays.',
      ],
    },
    {
      id: 'termination',
      title: 'Termination',
      icon: <FaBan />,
      content: [
        'We reserve the right to terminate or suspend accounts that violate these terms.',
        'Users may terminate their account at any time by contacting our support team.',
        'Upon termination, all pending orders will be processed according to our refund policy.',
        'We reserve the right to retain certain information as required by law or for business purposes.',
        'Termination does not relieve users of their obligation to pay for services already provided.',
      ],
    },
  ];

  if (isLoading) {
    return (
      <div className="page-container">
          <div className="page-content">
            <div className="page-header">
              <div className="h-8 w-48 gradient-shimmer rounded mb-2" />
              <div className="h-4 w-96 gradient-shimmer rounded" />
            </div>

            <div className="card card-padding mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div className="flex items-center mb-2 md:mb-0">
                  <div className="card-icon mr-4">
                    <FaFileContract />
                  </div>
                  <div>
                    <div className="h-5 w-24 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-48 gradient-shimmer rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 gradient-shimmer rounded-full" />
              </div>
            </div>

            <div className="space-y-6">
              {termsData.map((section, index) => (
                <div key={section.id} className="card card-padding">
                  <div className="card-header mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="card-icon">
                        {section.icon}
                      </div>
                      <div className="h-6 w-40 gradient-shimmer rounded" />
                    </div>
                    <div className="h-6 w-20 gradient-shimmer rounded-full" />
                  </div>

                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="h-4 w-full gradient-shimmer rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="card card-padding mt-8">
              <div className="card-header">
                <div className="card-icon">
                  <FaInfoCircle />
                </div>
                <div className="h-6 w-48 gradient-shimmer rounded" />
              </div>

              <div className="space-y-4 mt-4">
                <div className="h-4 w-full gradient-shimmer rounded" />
                <div className="h-4 w-3/4 gradient-shimmer rounded" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="h-5 w-24 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-40 gradient-shimmer rounded" />
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="h-5 w-28 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-32 gradient-shimmer rounded" />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                  <div className="h-10 w-24 gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-32 gradient-shimmer rounded mb-2" />
                  <div className="h-4 w-full gradient-shimmer rounded mb-1" />
                  <div className="h-4 w-3/4 gradient-shimmer rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header">
          <h1 className="page-title">Terms of Service</h1>
          <p className="page-description">
            Please read these terms carefully before using our social media
            marketing services
          </p>
        </div>
        <div className="card card-padding mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-center mb-2 md:mb-0">
              <div className="card-icon mr-4">
                <FaFileContract />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Last Updated</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  These terms were last updated on January 1, 2025
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              Version 1.0
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {termsData.map((section, index) => (
            <div key={section.id} className="card card-padding">
              <div className="card-header mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="card-icon">{section.icon}</div>
                  <h3 className="card-title">{section.title}</h3>
                </div>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full text-sm font-medium w-full sm:w-auto text-center sm:ml-auto">
                  Section {index + 1}
                </span>
              </div>

              <div className="space-y-3">
                {section.content.map((paragraph, idx) => (
                  <p key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="card card-padding mt-8">
          <div className="card-header">
            <div className="card-icon">
              <FaInfoCircle />
            </div>
            <h3 className="card-title">Questions About These Terms?</h3>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms of Service, please
              don't hesitate to contact us.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Email Support
                </h4>
                {supportEmail ? (
                  <a href={`mailto:${supportEmail}`} className="text-sm text-gray-600 dark:text-gray-300 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors">
                    {supportEmail}
                  </a>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Not configured</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Response Time
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Within 24 hours</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                  href="/contact-support"
                  className={`btn btn-primary`}
                  >
                  Contact Support
              </Link>
              <Link
                  href="/faqs"
                  className={`btn btn-secondary`}
                  >
                  View FAQ
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-6">
          <div className="flex items-start">
            <FaExclamationTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Important Notice
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm leading-relaxed">
                By continuing to use our services, you acknowledge that you have
                read, understood, and agree to be bound by these Terms of
                Service. If you do not agree with these terms, please
                discontinue use of our services immediately.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}