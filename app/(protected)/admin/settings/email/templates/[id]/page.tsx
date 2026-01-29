'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { FaArrowLeft, FaCheck, FaEnvelope, FaFileAlt, FaSave, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { EmailTemplateEditor } from '@/components/admin/email-template-editor';
import { useTheme } from 'next-themes';
import { replaceTemplateVariables, type EmailTemplateContext } from '@/lib/email-templates/replace-template-variables';

const TestEmailModal = dynamic(
  () => import('@/components/admin/settings/email/templates/modals/test-email'),
  { ssr: false }
);

const FALLBACK_PREVIEW_CONTEXT: EmailTemplateContext = {
  sitename: 'My SMM Panel',
  username: 'johndoe',
  user_full_name: 'John Doe',
  user_email: 'user@example.com',
  user_id: '12345',
};

interface TemplateData {
  templateId: number;
  templateKey: string;
  name: string;
  categoryId: number;
  categoryName: string;
  fromName: string;
  subject: string;
  bodyHtml: string;
  isCustom: boolean;
}

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}) => (
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheck className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

export default function EmailTemplateEditPage() {
  const { appName } = useAppNameWithFallback();
  const params = useParams();
  const templateId = params?.id as string;
  const { data: session } = useSession();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [data, setData] = useState<TemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailModalOpen, setTestEmailModalOpen] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [localForm, setLocalForm] = useState<{ fromName: string; subject: string; bodyHtml: string }>({
    fromName: '',
    subject: '',
    bodyHtml: '',
  });
  const [emailLayout, setEmailLayout] = useState<{ headerHtml: string; footerHtml: string } | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(400);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const [previewVariableContext, setPreviewVariableContext] = useState<EmailTemplateContext | null>(null);

  const measurePreviewHeight = useCallback(() => {
    const iframe = previewIframeRef.current;
    if (iframe?.contentDocument?.documentElement) {
      const height = iframe.contentDocument.documentElement.scrollHeight;
      setPreviewHeight((prev) => Math.max(400, Math.min(height, 2000)));
    }
  }, []);

  useEffect(() => {
    if (!data || !emailLayout) return;
    const t = setTimeout(measurePreviewHeight, 200);
    return () => clearTimeout(t);
  }, [data, emailLayout, localForm, measurePreviewHeight]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark'));

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    setPageTitle(`Edit - ${data?.name ?? templateId ?? ''}`, appName);
  }, [appName, templateId, data?.name]);

  useEffect(() => {
    if (!templateId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/email-templates/template/${templateId}`);
        if (!res.ok) {
          if (res.status === 404) showToast('Template not found', 'error');
          return;
        }
        const json = await res.json();
        if (json.success && json.data) {
          const t = json.data as TemplateData;
          setData(t);
          setLocalForm({
            fromName: t.fromName ?? '',
            subject: t.subject,
            bodyHtml: t.bodyHtml,
          });
        }
      } catch (e) {
        console.error(e);
        showToast('Failed to load template', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [templateId, showToast]);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetch('/api/admin/email-templates/layout');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setEmailLayout({ headerHtml: json.data.headerHtml, footerHtml: json.data.footerHtml });
            if (json.data.previewVariableContext) {
              setPreviewVariableContext(json.data.previewVariableContext);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch email layout', e);
      }
    };
    fetchLayout();
  }, []);

  const updateLocal = useCallback((field: 'fromName' | 'subject' | 'bodyHtml', value: string) => {
    setLocalForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!data) return;
    try {
      setSaving(true);
      const res = await fetch('/api/admin/email-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey: data.templateKey,
          fromName: localForm.fromName,
          subject: localForm.subject,
          bodyHtml: localForm.bodyHtml,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('Template saved successfully');
        setData((prev) => (prev ? { ...prev, fromName: localForm.fromName, subject: localForm.subject, bodyHtml: localForm.bodyHtml, isCustom: true } : prev));
      } else {
        showToast(json.error || 'Failed to save', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to save template', 'error');
    } finally {
      setSaving(false);
    }
  }, [data, localForm, showToast]);

  const handleSendTestEmail = useCallback(
    async (email: string) => {
      if (!data) return;
      try {
        setTestEmailLoading(true);
        const res = await fetch('/api/admin/email-templates/test-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateKey: data.templateKey,
            recipientEmail: email,
          }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          showToast(json.message ?? 'Test email sent successfully');
          setTestEmailModalOpen(false);
        } else {
          showToast(json.error ?? 'Failed to send test email', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Failed to send test email', 'error');
      } finally {
        setTestEmailLoading(false);
      }
    },
    [data, showToast]
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <div className="h-10 w-36 gradient-shimmer rounded" />
            <div className="h-10 w-32 gradient-shimmer rounded" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header" style={{ padding: '24px 24px 0 24px' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 gradient-shimmer rounded-lg" />
                  <div className="flex-1">
                    <div className="h-6 w-48 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-full max-w-sm gradient-shimmer rounded" />
                  </div>
                </div>
              </div>
              <div style={{ padding: '0 24px 24px 24px' }} className="space-y-4">
                <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                <div className="h-12 w-full gradient-shimmer rounded-lg" />
                <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                <div className="h-12 w-full gradient-shimmer rounded-lg" />
                <div className="h-4 w-56 gradient-shimmer rounded mb-2" />
                <div className="h-64 w-full gradient-shimmer rounded-lg" />
                <div className="h-10 w-28 gradient-shimmer rounded" />
              </div>
            </div>

            <div className="lg:sticky lg:top-6 self-start">
              <div className="card card-padding">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-32 gradient-shimmer rounded" />
                </div>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                  <div className="w-full h-[400px] gradient-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card card-padding text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Template not found.</p>
            <Link
              href="/admin/settings/email/templates"
              className="btn btn-primary flex items-center gap-2 w-fit mx-auto"
            >
              <FaArrowLeft className="h-4 w-4" />
              Back to Email Templates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const previewContext = previewVariableContext ?? FALLBACK_PREVIEW_CONTEXT;
  const previewFromName = replaceTemplateVariables(localForm.fromName, previewContext);
  const previewSubject = replaceTemplateVariables(localForm.subject, previewContext);
  const previewBodyHtml = replaceTemplateVariables(localForm.bodyHtml, previewContext);

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
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/settings/email/templates"
            className="btn btn-primary flex items-center gap-2 w-fit"
          >
            <FaArrowLeft className="h-4 w-4" />
            Back to Email Templates
          </Link>
          <button
            type="button"
            onClick={() => setTestEmailModalOpen(true)}
            className="btn btn-secondary flex items-center gap-2 w-fit"
          >
            <FaEnvelope className="h-4 w-4" />
            Send Test Email
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header" style={{ padding: '24px 24px 0 24px' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="card-icon">
                  <FaFileAlt />
                </div>
                <div>
                  <h3 className="card-title">{data.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {data.categoryName} • Edit subject and HTML content. Custom content is used when sending emails.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 24px 24px 24px' }}>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800/50 space-y-4">
                <div>
                  <label className="form-label block mb-1">Template Title</label>
                  <input
                    type="text"
                    value={data.name}
                    readOnly
                    className="form-field w-full px-4 py-3 bg-gray-100 dark:bg-gray-600/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="form-label block mb-1">From Name</label>
                  <input
                    type="text"
                    value={localForm.fromName}
                    onChange={(e) => updateLocal('fromName', e.target.value)}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] text-gray-900 dark:text-white"
                    placeholder="e.g. Support Team, SMM Panel"
                  />
                </div>

                <div>
                  <label className="form-label block mb-1">Subject</label>
                  <input
                    type="text"
                    value={localForm.subject}
                    onChange={(e) => updateLocal('subject', e.target.value)}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] text-gray-900 dark:text-white"
                    placeholder="Email subject"
                  />
                </div>

                <div>
                  <label className="form-label block mb-1">Template content (between header and footer)</label>
                  <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                    <EmailTemplateEditor
                      key={data.templateKey}
                      editorKey={data.templateKey}
                      value={localForm.bodyHtml}
                      onChange={(newContent) => updateLocal('bodyHtml', newContent)}
                      isDarkMode={isDarkMode}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Use the rich text editor to format your content. Header and footer are added automatically when sending.
                  </p>
                  <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 px-4 py-3">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Template variables work in <strong>From Name</strong>, <strong>Subject</strong>, and the <strong>Editor</strong> field. They are replaced when the email is sent:</p>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 font-mono">
                      <li><code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{'{sitename}'}</code> Site name</li>
                      <li><code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{'{username}'}</code> User login / username</li>
                      <li><code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{'{user_id}'}</code> User ID</li>
                      <li><code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{'{user_full_name}'}</code> User full name</li>
                      <li><code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{'{user_email}'}</code> User email address</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {!saving && <FaSave className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-6 self-start">
            <div className="card card-padding">
              <div className="flex items-center gap-3 mb-4">
                <div className="card-icon">
                  <FaEnvelope />
                </div>
                <h3 className="card-title">Email Preview</h3>
              </div>
              {previewFromName && (
                <div className="mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">From: </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{previewFromName}</span>
                </div>
              )}
              <div className="mb-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">Subject: </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{previewSubject || '(no subject)'}</span>
              </div>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                <iframe
                  ref={previewIframeRef}
                  key={data.templateKey}
                  title="Email preview"
                  srcDoc={emailLayout ? emailLayout.headerHtml + previewBodyHtml + emailLayout.footerHtml : previewBodyHtml}
                  className="w-full border-0"
                  style={{ minHeight: 400, height: previewHeight, maxHeight: 'none' }}
                  sandbox="allow-same-origin"
                  onLoad={() => {
                    measurePreviewHeight();
                    setTimeout(measurePreviewHeight, 100);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <TestEmailModal
        isOpen={testEmailModalOpen}
        templateName={data.name}
        templateKey={data.templateKey}
        defaultEmail={session?.user?.email ?? ''}
        onClose={() => setTestEmailModalOpen(false)}
        onSend={handleSendTestEmail}
        isLoading={testEmailLoading}
      />
    </div>
  );
}
