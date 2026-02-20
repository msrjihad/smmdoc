'use client';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  FaEdit,
  FaEnvelope,
  FaFileAlt,
  FaSearch,
  FaPlug,
  FaUser,
  FaCreditCard,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa';
import Link from 'next/link';
import type { EmailCategoryId } from '@/app/api/admin/email-templates/template-data';
import {
  type AudienceRole,
  PREDEFINED_EMAIL_CATEGORIES,
  PREDEFINED_EMAIL_TEMPLATES,
  getPredefinedTemplateById,
} from '@/app/api/admin/email-templates/template-data';

const AUDIENCE_FILTER_OPTIONS: Array<{ value: '' | AudienceRole; label: string }> = [
  { value: '', label: 'All Audience' },
  { value: 'User', label: 'User' },
  { value: 'Moderator', label: 'Moderator' },
  { value: 'Admin', label: 'Admin' },
];

const CATEGORY_ICON_MAP: Record<EmailCategoryId, React.ComponentType<{ className?: string }>> = {
  2: FaUser,
  3: FaCreditCard,
  6: FaEnvelope,
  8: FaPlug,
};

function getAudienceBadgeClass(role: AudienceRole): string {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  switch (role) {
    case 'Admin':
      return `${base} bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300`;
    case 'Moderator':
      return `${base} bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
    case 'User':
      return `${base} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300`;
    default:
      return `${base} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
  }
}

export const EMAIL_TEMPLATE_CATEGORIES = PREDEFINED_EMAIL_CATEGORIES.map((cat) => {
  const templatesForCategory = PREDEFINED_EMAIL_TEMPLATES.filter((t) => t.categoryId === cat.id);
  return {
    ...cat,
    icon: CATEGORY_ICON_MAP[cat.id],
    templates: templatesForCategory.map((t) => t.name),
    templateDescriptions: templatesForCategory.map((t) => t.description),
    templateIds: templatesForCategory.map((t) => t.id),
    separateRows: true as const,
  };
});

export default function EmailTemplatesPage() {
  const { appName } = useAppNameWithFallback();
  const [audienceFilter, setAudienceFilter] = useState<'' | AudienceRole>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [templateStatuses, setTemplateStatuses] = useState<Record<string, boolean>>({});
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setPageTitle('Email Templates', appName);
  }, [appName]);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/admin/email-templates/statuses');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setTemplateStatuses(json.data);
          }
        }
      } catch (e) {
        console.error('Failed to fetch template statuses', e);
      }
    };
    fetchStatuses();
  }, []);

  const toggleTemplateStatus = useCallback(async (templateKey: string) => {
    const current = templateStatuses[templateKey] ?? true;
    const next = !current;
    setStatusLoading((prev) => ({ ...prev, [templateKey]: true }));
    try {
      const res = await fetch('/api/admin/email-templates/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey, isActive: next }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTemplateStatuses((prev) => ({ ...prev, [templateKey]: next }));
      }
    } catch (e) {
      console.error('Failed to toggle template status', e);
    } finally {
      setStatusLoading((prev) => ({ ...prev, [templateKey]: false }));
    }
  }, [templateStatuses]);

  const filteredCategories = useMemo(() => {
    let list = EMAIL_TEMPLATE_CATEGORIES;
    if (categoryFilter) list = list.filter((cat) => String(cat.id) === categoryFilter);
    if (audienceFilter) list = list.filter((cat) => cat.audience.includes(audienceFilter));
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q) ||
          cat.audience.some((r) => r.toLowerCase().includes(q)) ||
          cat.templates.some((t) => t.toLowerCase().includes(q)) ||
          (cat as { templateDescriptions?: string[] }).templateDescriptions?.some((d) => d.toLowerCase().includes(q))
      );
    }
    return list;
  }, [categoryFilter, audienceFilter, searchTerm]);

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto mb-2 md:mb-0">
              <label htmlFor="category-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value="">All Categories</option>
                {EMAIL_TEMPLATE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <label htmlFor="audience-filter" className="sr-only">
                Filter by audience
              </label>
              <select
                id="audience-filter"
                value={audienceFilter}
                onChange={(e) => setAudienceFilter((e.target.value || '') as '' | AudienceRole)}
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                {AUDIENCE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value || 'all'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{ padding: '24px 24px 0 24px' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="card-icon">
                <FaFileAlt />
              </div>
              <div className="flex-1">
                <h3 className="card-title">Email Templates</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Use the Status toggle to enable or disable each template. Disabled templates will not trigger emails. Requires Email Notification enabled in Admin → Settings → Integrations.
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px 24px' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                      Status
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                      Template Name
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                      Description
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                      Category
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                      Audience
                    </th>
                    <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.flatMap((category) => {
                    const Icon = category.icon;
                    const rows = category.separateRows && category.templateIds
                      ? category.templates.map((templateName, idx) => ({
                          category,
                          templateName,
                          templateDescription: category.templateDescriptions?.[idx] ?? '',
                          templateId: category.templateIds![idx],
                          key: `${category.id}-${category.templateIds![idx]}`,
                        }))
                      : [
                          {
                            category,
                            templateName: null as string | null,
                            templateDescription: null as string | null,
                            templateId: null as number | null,
                            key: String(category.id),
                          },
                        ];
                    return rows.map(({ category: cat, templateName, templateDescription, templateId, key }) => {
                      const templateKeys = templateId != null
                        ? [getPredefinedTemplateById(templateId)?.templateKey].filter(Boolean) as string[]
                        : (cat.templateIds ?? []).map((id) => getPredefinedTemplateById(id)?.templateKey).filter(Boolean) as string[];
                      return (
                      <tr
                        key={key}
                        className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
                      >
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {templateKeys.map((templateKey) => {
                              const isActive = templateStatuses[templateKey] ?? true;
                              const isLoading = statusLoading[templateKey] ?? false;
                              return (
                                <button
                                  key={templateKey}
                                  type="button"
                                  onClick={() => toggleTemplateStatus(templateKey)}
                                  disabled={isLoading}
                                  className={`p-1 rounded transition-colors ${
                                    isLoading
                                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50'
                                      : isActive
                                      ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                                  }`}
                                  title={isActive ? 'Disable template' : 'Enable template'}
                                >
                                  {isLoading ? (
                                    <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : isActive ? (
                                    <FaToggleOn className="h-5 w-5" />
                                  ) : (
                                    <FaToggleOff className="h-5 w-5" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {(templateName ? [templateName] : cat.templates).map((name) => (
                              <span
                                key={name}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {templateDescription ?? cat.description}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--primary)]/10 dark:bg-[var(--secondary)]/10 flex items-center justify-center text-[var(--primary)] dark:text-[var(--secondary)]">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {cat.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {cat.audience.map((role) => (
                              <span
                                key={role}
                                className={getAudienceBadgeClass(role)}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/admin/settings/email/templates/${templateId ?? cat.templateIds?.[0] ?? cat.id}`}
                            className="btn btn-secondary p-2"
                            title={templateId != null ? `Edit ${templateName}` : 'Edit templates'}
                          >
                            <FaEdit className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
