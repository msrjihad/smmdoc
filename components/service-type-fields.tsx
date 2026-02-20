'use client';

import React from 'react';
import { getServiceTypeConfig } from '@/lib/service-types';

interface ServiceTypeFieldsProps {
  serviceType: number;
  values: {
    comments?: string;
    username?: string;
    posts?: number;
    delay?: number;
    minQty?: number;
    maxQty?: number;
    isDripfeed?: boolean;
    dripfeedRuns?: number;
    dripfeedInterval?: number;
    isSubscription?: boolean;
  };
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export const ServiceTypeFields: React.FC<ServiceTypeFieldsProps> = ({
  serviceType,
  values,
  onChange,
  errors = {}
}) => {
  const config = getServiceTypeConfig(serviceType);

  if (!config) {
    return null;
  }

  const fields: Array<{ name: string; type: string; label: string; placeholder?: string; required?: boolean; description?: string; min?: number; max?: number }> = [];

  if (config.requiresComments) {
    fields.push({
      name: 'comments',
      type: 'textarea',
      label: 'Comments',
      placeholder: 'Enter your comments',
      required: true,
      description: 'Custom comments for this service'
    });
  }

  if (config.requiresUsername) {
    fields.push({
      name: 'username',
      type: 'text',
      label: 'Username',
      placeholder: 'Enter username',
      required: true,
      description: 'Username for this service'
    });
  }

  if (config.requiresPosts) {
    fields.push({
      name: 'posts',
      type: 'number',
      label: 'Number of Posts',
      placeholder: 'Enter number of posts',
      required: true,
      min: 1,
      description: 'Number of posts for this service'
    });
  }

  if (config.allowsDelay) {
    fields.push({
      name: 'delay',
      type: 'number',
      label: 'Delay (minutes)',
      placeholder: 'Enter delay in minutes',
      required: false,
      min: 0,
      description: 'Delay before starting the service'
    });
  }

  if (config.allowsRuns) {
    fields.push({
      name: 'dripfeedRuns',
      type: 'number',
      label: 'Number of Runs',
      placeholder: 'Enter number of runs',
      required: config.isSubscription,
      min: 1,
      description: 'Number of times to run this service'
    });
  }

  if (config.allowsInterval) {
    fields.push({
      name: 'dripfeedInterval',
      type: 'number',
      label: 'Interval (minutes)',
      placeholder: 'Enter interval in minutes',
      required: config.isSubscription,
      min: 1,
      description: 'Interval between runs'
    });
  }

  if (config.isSubscription) {
    fields.push({
      name: 'minQty',
      type: 'number',
      label: 'Min Quantity',
      placeholder: 'Enter minimum quantity',
      required: false,
      min: 1,
      description: 'Minimum quantity for subscription'
    });
    fields.push({
      name: 'maxQty',
      type: 'number',
      label: 'Max Quantity',
      placeholder: 'Enter maximum quantity',
      required: false,
      min: 1,
      description: 'Maximum quantity for subscription'
    });
  }

  if (fields.length === 0) {
    return null;
  }

  const renderField = (field: any) => {
    const fieldValue = values[field.name as keyof typeof values];
    const hasError = errors[field.name];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="form-group">
            <label className="form-label" htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              id={field.name}
              className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
              placeholder={field.placeholder || field.label}
              value={fieldValue as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
            />
            {field.description && (
              <small className="text-xs text-gray-500 mt-1">{field.description}</small>
            )}
            {hasError && (
              <div className="text-red-500 text-xs mt-1">{hasError}</div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="form-group">
            <label className="form-label" htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              id={field.name}
              className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical`}
              placeholder={field.placeholder || field.label}
              value={fieldValue as string || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              rows={3}
            />
            {field.description && (
              <small className="text-xs text-gray-500 mt-1">{field.description}</small>
            )}
            {hasError && (
              <div className="text-red-500 text-xs mt-1">{hasError}</div>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="form-group">
            <label className="form-label" htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              id={field.name}
              className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                hasError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
              placeholder={field.placeholder || field.label}
              value={fieldValue as number || ''}
              onChange={(e) => onChange(field.name, e.target.value ? parseInt(e.target.value) : undefined)}
              required={field.required}
              min={field.min}
              max={field.max}
            />
            {field.description && (
              <small className="text-xs text-gray-500 mt-1">{field.description}</small>
            )}
            {hasError && (
              <div className="text-red-500 text-xs mt-1">{hasError}</div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="form-group">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id={field.name}
                className="w-4 h-4 text-[var(--primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={fieldValue as boolean || false}
                onChange={(e) => onChange(field.name, e.target.checked)}
              />
              <label className="form-label mb-0" htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
            </div>
            {field.description && (
              <small className="text-xs text-gray-500 mt-1 ml-7">{field.description}</small>
            )}
            {hasError && (
              <div className="text-red-500 text-xs mt-1 ml-7">{hasError}</div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {config.name} Settings
        </h4>
        <div className="space-y-4">
          {fields.map(renderField)}
        </div>
      </div>
    </div>
  );
};

export default ServiceTypeFields;