'use client';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { sendVerificationCode, verifyCodeAndLogin } from '@/lib/actions/verification';
import {
  verifyEmailDefaultValues,
  verifyEmailSchema,
  type VerifyEmailSchema,
} from '@/lib/validators/auth.validator';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FaEnvelope, FaLock, FaEdit } from 'react-icons/fa';

export default function VerifyEmail() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [isFromRegistration, setIsFromRegistration] = useState(false);
  const [emailFromStorage, setEmailFromStorage] = useState<string>('');
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [originalEmail, setOriginalEmail] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = sessionStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setEmailFromStorage(storedEmail);
        setOriginalEmail(storedEmail);
        setIsFromRegistration(true);
        sessionStorage.removeItem('pendingVerificationEmail');
      }
    }
  }, []);

  const form = useForm<VerifyEmailSchema>({
    mode: 'all',
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email: '',
      code: '',
    },
  });

  const handleSendCode = useCallback(async (silent = false) => {
    const email = form.getValues('email') || emailFromStorage;
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (emailExists === true) {
      setError('User is already exist. Please use a different email address.');
      return;
    }

    if (!silent) {
      setSendingCode(true);
    }
    setError('');
    if (!silent) {
      setSuccess('');
    }

    try {
      const result = await sendVerificationCode(email);
      if (result.success) {
        if (!silent) {
          setSuccess(result.message);
        }
        setCodeSent(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    } finally {
      if (!silent) {
        setSendingCode(false);
      }
    }
  }, [emailFromStorage, form]);

  useEffect(() => {
    if (emailFromStorage) {
      form.setValue('email', emailFromStorage);
      setCodeSent(true);
    }
  }, [emailFromStorage, form]);

  const handleUpdateEmail = () => {
    const currentEmail = form.getValues('email') || emailFromStorage;
    if (!originalEmail && currentEmail) {
      setOriginalEmail(currentEmail);
    }
    setIsEmailEditable(true);
    setCodeSent(false);
    setError('');
    setSuccess('');
    setEmailExists(null);
  };

  const checkEmailExists = useCallback(async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailExists(null);
      setCheckingEmail(false);
      return;
    }

    const currentOriginalEmail = originalEmail || emailFromStorage;
    if (email.toLowerCase() === currentOriginalEmail.toLowerCase()) {
      setEmailExists(false);
      setError('');
      setCheckingEmail(false);
      return;
    }

    setCheckingEmail(true);
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.available === false) {
        setEmailExists(true);
        setError('User is already exist');
      } else {
        setEmailExists(false);
        setError('');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailExists(null);
    } finally {
      setCheckingEmail(false);
    }
  }, [originalEmail, emailFromStorage]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    form.setValue('email', newEmail, { shouldValidate: true });
    
    if (!isEmailEditable || !newEmail || !newEmail.includes('@')) {
      setEmailExists(null);
      setError('');
      return;
    }
  };

  const watchedEmail = form.watch('email');

  useEffect(() => {
    if (!isEmailEditable) {
      setEmailExists(null);
      return;
    }

    if (!watchedEmail || !watchedEmail.includes('@')) {
      setEmailExists(null);
      setError('');
      return;
    }

    const timer = setTimeout(() => {
      checkEmailExists(watchedEmail);
    }, 500);

    return () => clearTimeout(timer);
  }, [watchedEmail, isEmailEditable, checkEmailExists]);

  const onSubmit: SubmitHandler<VerifyEmailSchema> = async (values) => {
    setError('');
    setSuccess('');

    if (emailExists === true) {
      setError('User is already exist. Please use a different email address.');
      return;
    }

    if (!codeSent) {
      if (isFromRegistration) {
        setError('Verification code is being sent. Please wait a moment and try again.');
        return;
      }
      setError('Please request a verification code first');
      return;
    }

    startTransition(() => {
      verifyCodeAndLogin(values.email, values.code)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
            return;
          }

          if (data?.success) {
            const redirectUrl = data.redirectTo || '/dashboard';
            const isAdmin = data.isAdmin === true;
            setSuccess(
              isAdmin
                ? 'Email verified! Redirecting to admin dashboard...'
                : 'Email verified! Redirecting to dashboard...'
            );

            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1000);
          }
        })
        .catch((err) => {
          console.error('Verification error:', err);
          setError('An unexpected error occurred. Please try again.');
        });
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm w-full py-5 px-4 md:p-8 md:rounded-2xl md:shadow-lg md:border md:border-gray-200 md:dark:border-gray-700 transition-all duration-200">
      <div className="mb-6">
        <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
          Verify Your Email
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center transition-colors duration-200">
          Enter your email address and verification code to verify your email and log in.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
            </div>
            <input
              type="email"
              id="email"
              placeholder="eg: john@example.com"
              disabled={isPending || ((isFromRegistration || codeSent) && !isEmailEditable)}
              readOnly={(isFromRegistration || codeSent) && !isEmailEditable}
              {...form.register('email', {
                onChange: handleEmailChange,
              })}
              className="w-full pl-12 pr-12 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {(isFromRegistration || codeSent) && !isEmailEditable && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  onClick={handleUpdateEmail}
                  disabled={isPending}
                  className="text-[var(--primary)] dark:text-[var(--secondary)] hover:text-[#4F0FD8] dark:hover:text-[#A121E8] transition-colors duration-200 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Update email address"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {emailExists === true && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
              User is already exist
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
            htmlFor="code"
            className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
          >
            Verification Code
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
              maxLength={6}
              {...form.register('code')}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
          </div>
          {form.formState.errors.code?.message && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
              {form.formState.errors.code.message as string}
            </p>
          )}
          <div className="flex items-center justify-end mt-2">
            {codeSent && (
              <button
                type="button"
                onClick={() => handleSendCode(false)}
                disabled={sendingCode || isPending}
                className="text-[var(--primary)] dark:text-[var(--secondary)] hover:underline transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
{sendingCode ? 'Resending...' : 'Resend Code'}
              </button>
            )}
          </div>
        </div>

        {(!codeSent || isEmailEditable) && (
          <button
            type="button"
            onClick={() => handleSendCode(false)}
            disabled={sendingCode || isPending || emailExists === true || checkingEmail}
            className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
{sendingCode ? 'Sending...' : 'Send Verification Code'}
          </button>
        )}

        <FormError message={error} />
        <FormSuccess message={success} />

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
{isPending ? 'Verifying...' : 'Verify & Log In'}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
          Already verified?{' '}
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
