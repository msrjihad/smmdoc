'use client';

import { useEffect } from 'react';

interface MobileAuthFormProps {
  authType: 'signin' | 'signup';
  formData: {
    username: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  error: string;
  success: string;
  loading: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setAuthType: (type: 'signin' | 'signup') => void;
}

const MobileAuthForm = ({
  authType,
  formData,
  error,
  success,
  loading,
  handleInputChange,
  handleSubmit,
  setAuthType
}: MobileAuthFormProps) => {
  useEffect(() => {
    const mobileContainer = document.getElementById('auth-form-container-mobile');
    if (mobileContainer) {
      mobileContainer.innerHTML = '';
      const formElement = document.createElement('div');
      formElement.innerHTML = `
        <div id="mobile-auth-form-root"></div>
      `;
      mobileContainer.appendChild(formElement);
    }
  }, []);

  useEffect(() => {
    const mobileFormRoot = document.getElementById('mobile-auth-form-root');
    if (mobileFormRoot) {
      mobileFormRoot.innerHTML = `
        <div class="border border-purple-200 shadow-lg rounded-lg bg-white dark:bg-gray-800">
          <div class="flex flex-row items-center justify-between space-y-0 pb-1 px-4 pt-3">
            <h3 class="text-base font-semibold text-purple-600">
              ${authType === 'signin' ? 'Sign In' : 'Sign Up'}
            </h3>
          </div>
          <div class="px-4 pb-4">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-3 text-center">
              ${authType === 'signin' 
                ? 'Enter your details below to sign in.' 
                : 'Create your account to get started.'}
            </p>

            <form id="mobile-auth-form" class="space-y-3">
              ${authType === 'signup' ? `
                <div class="space-y-1">
                  <label class="text-xs">Username</label>
                  <input 
                    type="text" 
                    name="username"
                    placeholder="Enter your username" 
                    value="${formData.username}"
                    class="w-full h-8 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    required
                  />
                </div>
                <div class="space-y-1">
                  <label class="text-xs">Name</label>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Enter your name" 
                    value="${formData.name}"
                    class="w-full h-8 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    required
                  />
                </div>
              ` : ''}

              <div class="space-y-1">
                <label class="text-xs">Username or Email</label>
                <input
                  type="text"
                  name="email"
                  placeholder="eg: john or john@example.com"
                  value="${formData.email}"
                  class="w-full h-8 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div class="space-y-1">
                <label class="text-xs">Password</label>
                <input 
                  type="password" 
                  name="password"
                  placeholder="e.g: ********" 
                  value="${formData.password}"
                  class="w-full h-8 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                  required
                />
              </div>

              ${authType === 'signup' ? `
                <div class="space-y-1">
                  <label class="text-xs">Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    placeholder="Confirm your password" 
                    value="${formData.confirmPassword}"
                    class="w-full h-8 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                    required
                  />
                </div>
              ` : ''}

              ${error ? `
                <div class="text-red-500 text-sm text-center">
                  ${error}
                </div>
              ` : ''}

              ${success ? `
                <div class="text-green-500 text-sm text-center">
                  ${success}
                </div>
              ` : ''}

              <button 
                type="submit" 
                class="w-full bg-purple-600 hover:bg-purple-700 h-8 text-sm text-white rounded-md transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}"
                ${loading ? 'disabled' : ''}
              >
                ${loading ? 'Please wait...' : (authType === 'signin' ? 'Sign In' : 'Sign Up')}
              </button>

              <div class="flex items-center justify-center space-x-4 mt-3">
                <button type="button" class="flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
                  <svg class="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
              </div>
            </form>

            <div class="text-center mt-2">
              ${authType === 'signin' ? `
                <p class="text-xs mb-1">
                  Forgot your password? 
                  <a href="/reset-password" class="text-blue-500 hover:text-blue-700">Forgot Password</a>
                </p>
                <p class="text-xs">
                  Don't have an account? 
                  <button type="button" id="switch-to-signup" class="text-blue-500 hover:text-blue-700">Sign Up</button>
                </p>
              ` : `
                <p class="text-xs">
                  Already have an account? 
                  <button type="button" id="switch-to-signin" class="text-blue-500 hover:text-blue-700">Sign In</button>
                </p>
              `}
            </div>
          </div>
        </div>
      `;
      const form = document.getElementById('mobile-auth-form');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          handleSubmit(e as any);
        });
        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
          input.addEventListener('input', (e) => {
            handleInputChange(e as any);
          });
        });
      }
      const switchToSignup = document.getElementById('switch-to-signup');
      const switchToSignin = document.getElementById('switch-to-signin');

      if (switchToSignup) {
        switchToSignup.addEventListener('click', () => setAuthType('signup'));
      }

      if (switchToSignin) {
        switchToSignin.addEventListener('click', () => setAuthType('signin'));
      }
    }
  }, [authType, formData, error, success, loading, handleInputChange, handleSubmit, setAuthType]);

  return null;
};

export default MobileAuthForm;