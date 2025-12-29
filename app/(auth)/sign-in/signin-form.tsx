'use client';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import ReCAPTCHA from '@/components/recaptcha';
import { useUserSettings } from '@/hooks/use-user-settings';
import useReCAPTCHA from '@/hooks/useReCAPTCHA';
import { login } from '@/lib/actions/login';
import { DEFAULT_SIGN_IN_REDIRECT } from '@/lib/routes';
import {
  signInDefaultValues,
  SignInSchema,
  signInSchema,
} from '@/lib/validators/auth.validator';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useTransition, useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash, FaLock, FaUser } from 'react-icons/fa';

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { settings: userSettings, loading: settingsLoading } = useUserSettings();

  let urlError = '';
  const errorParam = searchParams?.get('error');
  const messageParam = searchParams?.get('message');
  const reasonParam = searchParams?.get('reason');
  const [showServicesWarning, setShowServicesWarning] = useState<boolean>(false);
  const [maintenanceMode, setMaintenanceMode] = useState<'inactive' | 'active'>('inactive');

  if (errorParam === 'OAuthAccountNotLinked') {
    urlError = 'Email already in use with different provider!';
  } else if (messageParam === 'registration-disabled') {
    urlError = 'User registration is currently disabled by administrator.';
  } else if (messageParam === 'password-reset-disabled') {
    urlError = 'Password reset is currently disabled by administrator. Please contact support.';
  }

  useEffect(() => {
    if (reasonParam === 'services-restricted') {
      setShowServicesWarning(true);
    }
  }, [reasonParam]);

  useEffect(() => {
    const fetchMaintenanceMode = async () => {
      try {
        const response = await fetch('/api/public/general-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.generalSettings?.maintenanceMode) {
            setMaintenanceMode(data.generalSettings.maintenanceMode);
          }
        }
      } catch (error) {
        console.error('Error fetching maintenance mode:', error);
      }
    };

    fetchMaintenanceMode();
  }, []);
  const [showTwoFactor, setShowTwoFactor] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const { recaptchaSettings, isEnabledForForm } = useReCAPTCHA();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const form = useForm<SignInSchema>({
    mode: 'all',
    resolver: zodResolver(signInSchema),
    defaultValues: signInDefaultValues,
  });

  const onSubmit: SubmitHandler<SignInSchema> = async (values) => {
    setError('');
    setSuccess('');
    urlError = '';

    if (isEnabledForForm('signIn') && !recaptchaToken) {
      setError('Please complete the ReCAPTCHA verification.');
      return;
    }

    startTransition(() => {

      const submitData = recaptchaToken 
        ? { ...values, recaptchaToken }
        : values;

      login(submitData)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
            return;
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
            return;
          }

          if (data?.success) {

            const redirectUrl = data.redirectTo || '/dashboard';
            const isAdmin = data.isAdmin === true;

            setSuccess(isAdmin 
              ? 'Login successful! Redirecting to admin dashboard...' 
              : 'Login successful! Redirecting to dashboard...');

            console.log('Redirect URL:', redirectUrl);

            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1000);
          }
        })
        .catch((err) => {
          console.error('Login error:', err);
          setError('An unexpected error occurred. Please try again.');
        });
    });
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: DEFAULT_SIGN_IN_REDIRECT });
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm w-full py-5 px-4 md:p-8 md:rounded-2xl md:shadow-lg md:border md:border-gray-200 md:dark:border-gray-700 transition-all duration-200">
      <div className="mb-6">
        <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
          Sign In
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center transition-colors duration-200">
          Enter your details below to sign in.
        </p>
      </div>

      {maintenanceMode === 'active' && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
            <strong>Maintenance Mode Active:</strong> Only administrators and moderators can sign in during maintenance.
          </p>
        </div>
      )}

      {showServicesWarning && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
            The services list is restricted. Please sign in to view the services list.
          </p>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {showTwoFactor ? (
          <div>
            <label
              htmlFor="code"
              className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
            >
              2FA Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
              </div>
              <input
                type="text"
                id="code"
                placeholder="e.g: 123456"
                disabled={isPending}
                {...form.register('code')}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
            </div>
            {form.formState.errors.code?.message && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                {form.formState.errors.code.message as string}
              </p>
            )}
          </div>
        ) : (
          <>
            <div>
              <label
                htmlFor="email"
                className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
              >
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
                </div>
                <input
                  type="text"
                  id="email"
                  placeholder="eg: john or john@example.com"
                  disabled={isPending}
                  {...form.register('email')}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
              </div>
              {form.formState.errors.email?.message && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                  {form.formState.errors.email.message as string}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="e.g: ********"
                  disabled={isPending}
                  {...form.register('password')}
                  className="w-full pl-12 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <FaEyeSlash className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <FaEye className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </div>
              {form.formState.errors.password?.message && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                  {form.formState.errors.password.message as string}
                </p>
              )}
            </div>
            {isEnabledForForm('signIn') && recaptchaSettings && (
              <ReCAPTCHA
                siteKey={recaptchaSettings.siteKey}
                version={recaptchaSettings.version}
                action="signin"
                threshold={recaptchaSettings.threshold}
                onVerify={(token) => setRecaptchaToken(token)}
                onError={() => {
                  setRecaptchaToken(null);


                }}
                onExpired={() => {
                  setRecaptchaToken(null);
                  setError('ReCAPTCHA expired. Please verify again.');
                }}
              />
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"


                  className="h-4 w-4 text-[var(--primary)] focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 transition-colors duration-200"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-gray-700 dark:text-gray-300 transition-colors duration-200"
                >
                  Remember me
                </label>
              </div>
              {(!settingsLoading && userSettings?.resetPasswordEnabled !== false) && (
                <Link
                  href="/reset-password"
                  className="text-[var(--primary)] dark:text-[var(--secondary)] hover:underline transition-colors duration-200"
                >
                  Forget Password?
                </Link>
              )}
            </div>
          </>
        )}

        <FormError message={error || urlError} />
        <FormSuccess message={success} />

        <div className="space-y-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Loading...' : 'Sign In'}
          </button>
        </div>
      </form>
      {!showTwoFactor && (
        <div className="mt-4">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600/50 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="flex-shrink-0"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      )}

      {!showTwoFactor && (
        <div className="text-center mt-4">
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
            New Here?{' '}
            <Link
              href="/sign-up"
              className="text-[var(--primary)] dark:text-[var(--secondary)] hover:underline transition-colors duration-200"
            >
              Create an account
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
