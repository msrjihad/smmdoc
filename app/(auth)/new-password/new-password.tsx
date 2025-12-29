'use client';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import { newPasswordValues } from '@/lib/actions/new-password';
import {
  newPasswordDefaultValues,
  newPasswordSchema,
  NewPasswordSchema,
} from '@/lib/validators/auth.validator';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FaLock } from 'react-icons/fa';

export default function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');

  const form = useForm<NewPasswordSchema>({
    mode: 'all',
    resolver: zodResolver(newPasswordSchema),
    defaultValues: newPasswordDefaultValues,
  });

  const onSubmit: SubmitHandler<NewPasswordSchema> = async (values) => {
    setError('');
    setSuccess('');

    startTransition(() => {
      newPasswordValues(values, token)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
          }
          if (data?.message) {
            setSuccess(data.message);
          }
        })
        .catch((err) => {
          setError('An unexpected error occurred. Please try again.');
          console.error('New password error:', err);
        });
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm w-full py-5 px-4 md:p-8 md:rounded-2xl md:shadow-lg md:border md:border-gray-200 md:dark:border-gray-700 transition-all duration-200">
      <div className="mb-6">
        <h2 className="text-2xl text-center font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
          New Password
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center transition-colors duration-200">
          Enter your new password.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block text-lg text-gray-900 dark:text-white font-medium mb-2 transition-colors duration-200"
          >
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-colors duration-200" />
            </div>
            <input
              type="password"
              id="password"
              placeholder="e.g: ********"
              disabled={isPending}
              {...form.register('password')}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
            />
          </div>
          {form.formState.errors.password && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <FormError message={error} />
        <FormSuccess message={success} />

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
{isPending ? 'Loading...' : 'Reset Password'}
        </button>
      </form>

      <div className="text-center mt-4">
        <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
          Remember your password?{' '}
          <Link
            href="/sign-in"
            className="text-[var(--primary)] dark:text-[var(--secondary)] hover:underline transition-colors duration-200"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
