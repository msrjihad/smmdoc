'use client';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import ReCAPTCHA from '@/components/recaptcha';
import { useUserSettings } from '@/hooks/use-user-settings';
import useReCAPTCHA from '@/hooks/useReCAPTCHA';
import { register } from '@/lib/actions/register';
import { DEFAULT_SIGN_IN_REDIRECT } from '@/lib/routes';
import {
  createSignUpSchema,
  signUpDefaultValues,
  type DynamicSignUpSchema
} from '@/lib/validators/auth.validator';
import { detectTimezone } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FaCheck, FaEnvelope, FaEye, FaEyeSlash, FaLock, FaTimes, FaUser } from 'react-icons/fa';

export default function SignUpForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [detectedTimezone, setDetectedTimezone] = useState<string>('Asia/Dhaka');

  const { settings: userSettings, loading: settingsLoading } = useUserSettings();

  const { recaptchaSettings, isEnabledForForm } = useReCAPTCHA();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timezone = detectTimezone();
      setDetectedTimezone(timezone);
    }
  }, []);

  const dynamicSchema = useMemo(() => {
    if (settingsLoading || !userSettings) {
      return createSignUpSchema(false);
    }
    return createSignUpSchema(userSettings.nameFieldEnabled);
  }, [userSettings, settingsLoading]);

  const formKey = useMemo(() => {
    return `form-${settingsLoading}-${userSettings?.nameFieldEnabled}`;
  }, [settingsLoading, userSettings?.nameFieldEnabled]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue('email', value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });

    if (emailStatus.message) {
      setEmailStatus({
        checking: false,
        available: null,
        message: ''
      });
    }
  };

  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: ''
  });

  const [emailStatus, setEmailStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: ''
  });

  const form = useForm<DynamicSignUpSchema>({
    mode: 'all',
    resolver: zodResolver(dynamicSchema),
    defaultValues: signUpDefaultValues,
  });

  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: ''
      });
      return;
    }

    setUsernameStatus({
      checking: true,
      available: null,
      message: 'Checking username availability...'
    });

    try {
      const response = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const result = await response.json();

      if (result.available) {
        setUsernameStatus({
          checking: false,
          available: true,
          message: 'Username is available'
        });
      } else {
        setUsernameStatus({
          checking: false,
          available: false,
          message: result.error || 'Username is not available'
        });
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus({
        checking: false,
        available: null,
        message: 'Error checking username availability'
      });
    }
  }, []);

  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus({
        checking: false,
        available: null,
        message: ''
      });
      return;
    }

    setEmailStatus({
      checking: true,
      available: null,
      message: 'Checking email availability...'
    });

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.available) {
        setEmailStatus({
          checking: false,
          available: true,
          message: 'Email is available'
        });
      } else {
        setEmailStatus({
          checking: false,
          available: false,
          message: result.error || 'Email is not available'
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailStatus({
        checking: false,
        available: null,
        message: 'Error checking email availability'
      });
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    const cleanedValue = value
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, '');

    form.setValue('username', cleanedValue, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });

    if (usernameStatus.message) {
      setUsernameStatus({
        checking: false,
        available: null,
        message: ''
      });
    }
  };


  const onSubmit: SubmitHandler<DynamicSignUpSchema> = async (values) => {
    setError('');
    setSuccess('');

    if (isEnabledForForm('signUp') && !recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    const submitData = { ...values } as any;
    if (!userSettings?.nameFieldEnabled && submitData.name === '') {
      delete submitData.name;
    }

    if (recaptchaToken) {
      submitData.recaptchaToken = recaptchaToken;
    }

    submitData.timezone = detectedTimezone;

    setUsernameStatus({
      checking: false,
      available: null,
      message: ''
    });
    setEmailStatus({
      checking: false,
      available: null,
      message: ''
    });

    if (values.username) {
      setUsernameStatus({
        checking: true,
        available: null,
        message: 'Checking username availability...'
      });

      try {
        const response = await fetch('/api/auth/check-username', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: values.username }),
        });

        const result = await response.json();

        if (!result.available) {
          setUsernameStatus({
            checking: false,
            available: false,
            message: result.error || 'Username is not available'
          });
          setError(result.error || 'Username is not available');
          return;
        }

        setUsernameStatus({
          checking: false,
          available: true,
          message: 'Username is available'
        });
      } catch (error) {
        console.error('Error checking username:', error);
        setError('Error checking username availability');
        return;
      }
    }

    if (values.email) {
      setEmailStatus({
        checking: true,
        available: null,
        message: 'Checking email availability...'
      });

      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: values.email }),
        });

        const result = await response.json();

        if (!result.available) {
          setEmailStatus({
            checking: false,
            available: false,
            message: result.error || 'Email is not available'
          });
          setError(result.error || 'Email is not available');
          return;
        }

        setEmailStatus({
          checking: false,
          available: true,
          message: 'Email is available'
        });
      } catch (error) {
        console.error('Error checking email:', error);
        setError('Error checking email availability');
        return;
      }
    }

    startTransition(() => {
      register(submitData)
        .then(async (data) => {
          if (data?.error) {
            setError(data.error);
            return;
          }
          if (data?.success) {
            if (data?.email) {
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('pendingVerificationEmail', data.email);
              }
              router.push('/verify-email');
            } else if (data?.shouldAutoLogin) {
              try {
                const signInResult = await signIn('credentials', {
                  email: data.userEmail,
                  password: submitData.password,
                  redirect: false
                });

                if (signInResult?.ok) {
                  window.location.href = DEFAULT_SIGN_IN_REDIRECT;
                } else {
                  setError('Registration successful but automatic login failed. Please sign in manually.');
                }
              } catch (loginError) {
                console.error('Auto-login error:', loginError);
                setError('Registration successful but automatic login failed. Please sign in manually.');
              }
            }
          }
        })
        .catch((err) => {
          setError('An unexpected error occurred. Please try again.');
          console.error('Sign up error:', err);
        });
    });
  };

  const handleGoogleSignUp = async () => {
    await signIn('google', { callbackUrl: DEFAULT_SIGN_IN_REDIRECT });
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm w-full py-5 px-4 md:p-8 md:rounded-2xl md:shadow-lg md:border md:border-gray-200 md:dark:border-gray-700 transition-all duration-200">
      <div className="mb-6">
        <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
          Sign Up
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center transition-colors duration-200">
          Enter your details below to sign up.
        </p>
      </div>

      <form key={formKey} onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="username"
            className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
          >
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
            </div>
            <input
              type="text"
              id="username"
              placeholder="eg: john"
              disabled={isPending}
              value={form.watch('username') || ''}
              onChange={handleUsernameChange}
              className={`w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 ${
                usernameStatus.available === false
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {!usernameStatus.checking && usernameStatus.available === false && (
                <FaTimes className="w-4 h-4 text-red-500 dark:text-red-400" />
              )}
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 transition-colors duration-200">
            Only lowercase letters, numbers, dots (.) and underscores (_) are allowed
          </p>
          {usernameStatus.message && usernameStatus.available === false && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
              {usernameStatus.message}
            </p>
          )}

          {form.formState.errors.username?.message && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
              {form.formState.errors.username.message as string}
            </p>
          )}
        </div>
        {(settingsLoading || userSettings?.nameFieldEnabled !== false) && (
          <div>
            <label
              htmlFor="name"
              className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
            >
              Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
              </div>
              <input
                type="text"
                id="name"
                placeholder="eg: John Doe"
                disabled={isPending}
                {...form.register('name')}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
            </div>
            {form.formState.errors.name?.message && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                {form.formState.errors.name.message as string}
              </p>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
            </div>
            <input
              type="email"
              id="email"
              placeholder="eg: mail@email.com"
              disabled={isPending}
              value={form.watch('email') || ''}
              onChange={handleEmailChange}
              className={`w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 ${
                emailStatus.available === false
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {!emailStatus.checking && emailStatus.available === false && (
                <FaTimes className="w-4 h-4 text-red-500 dark:text-red-400" />
              )}
            </div>
          </div>
          {emailStatus.message && emailStatus.available === false && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
              {emailStatus.message}
            </p>
          )}

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
              autoComplete="new-password"
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

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              placeholder="e.g: ********"
              disabled={isPending}
              autoComplete="new-password"
              {...form.register('confirmPassword')}
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
          {form.formState.errors.confirmPassword?.message && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
              {form.formState.errors.confirmPassword.message as string}
            </p>
          )}
        </div>

        <FormError message={error} />
        <FormSuccess message={success} />
        {isEnabledForForm('signUp') && recaptchaSettings && (
          <ReCAPTCHA
            siteKey={recaptchaSettings.siteKey}
            version={recaptchaSettings.version}
            action="signup"
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

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Loading...' : 'Sign Up'}
        </button>
      </form>
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
          onClick={handleGoogleSignUp}
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
          <span>Sign up with Google</span>
        </button>
      </div>

      <div className="text-center mt-4">
        <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="text-[var(--primary)] dark:text-[var(--secondary)] hover:underline transition-colors duration-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}