'use client';
import { FormError } from '@/components/form-error';
import { FormSuccess } from '@/components/form-success';
import ReCAPTCHA from '@/components/recaptcha';
import ErrorBoundary from '@/components/error-boundary';
import { login } from '@/lib/actions/login';
import { DEFAULT_SIGN_IN_REDIRECT } from '@/lib/routes';
import {
  signInDefaultValues,
  SignInSchema,
  signInSchema,
} from '@/lib/validators/auth.validator';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import {
  FaBriefcase,
  FaEye,
  FaEyeSlash,
  FaHome,
  FaLock,
  FaTachometerAlt,
  FaUser,
  FaUserCheck,
  FaUserShield,
} from 'react-icons/fa';
import useReCAPTCHA from '@/hooks/useReCAPTCHA';
import { useUserSettings } from '@/hooks/use-user-settings';

const Hero: React.FC = () => {

  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [urlError, setUrlError] = useState(
    searchParams?.get('error') === 'OAuthAccountNotLinked'
      ? 'Email already in use with different provider!'
      : ''
  );
  const [showTwoFactor, setShowTwoFactor] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>('');
  const [success, setSuccess] = useState<string | undefined>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);

  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const { recaptchaSettings, isEnabledForForm } = useReCAPTCHA();
  const { settings: userSettings, loading: settingsLoading } = useUserSettings();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isAuthenticated = status === 'authenticated' && session?.user;
  const isLoading = status === 'loading';
  const userRole = session?.user?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator';
  const isAdminOrModerator = isAdmin || isModerator;

  const [usersCount, setUsersCount] = useState<number>(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [activeOrdersCountUser, setActiveOrdersCountUser] = useState<number | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState<boolean>(false);
  const [userStatsError, setUserStatsError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchHomepageStats = async () => {
      try {
        const res = await fetch('/api/homepage/stats', {
          cache: 'no-store',
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || 'Failed to fetch homepage stats');
        }

        if (!isMounted || !isMountedRef.current) {
          return;
        }

        const { totalUsers, completedOrders, activeUsers, totalOrders } = json?.data || {};

        const finalUsersCount = typeof totalUsers === 'number' ? totalUsers : (totalUsers === null || totalUsers === undefined ? 0 : Number(totalUsers) || 0);
        const finalCompletedOrders = typeof completedOrders === 'number' ? completedOrders : (completedOrders === null || completedOrders === undefined ? 0 : Number(completedOrders) || 0);
        const finalTotalOrders = typeof totalOrders === 'number' ? totalOrders : (totalOrders === null || totalOrders === undefined ? 0 : Number(totalOrders) || 0);
        const finalActiveUsers = typeof activeUsers === 'number' ? activeUsers : (activeUsers === null || activeUsers === undefined ? 0 : Number(activeUsers) || 0);

        // Batch state updates using startTransition for better performance
        startTransition(() => {
          setUsersCount(finalUsersCount);
          setCompletedOrdersCount(finalCompletedOrders);
          setTotalOrdersCount(finalTotalOrders);
          setActiveUsersCount(finalActiveUsers);
        });

        // Only set debug info in development
        if (process.env.NODE_ENV === 'development') {
          setDebugInfo({
            apiResponse: json,
            extracted: { totalUsers, completedOrders, activeUsers, totalOrders },
            final: {
              finalUsersCount,
              finalTotalOrders,
              finalActiveUsers,
            },
          });
        }
      } catch (err: any) {
        if (!isMounted || !isMountedRef.current) return;
        setStatsError(err.message || 'Failed to fetch homepage stats');
        // Batch state updates
        startTransition(() => {
          setUsersCount(0);
          setCompletedOrdersCount(0);
          setTotalOrdersCount(0);
          setActiveUsersCount(0);
        });
      }
    };
    
    fetchHomepageStats();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;
    let cancelled = false;
    const fetchUserStats = async () => {
      try {
        setUserStatsLoading(true);
        setUserStatsError(null);
        const res = await fetch('/api/user/dashboard/stats');
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to fetch user stats');
        }
        const data = json.data || {};
        const ordersByStatus = data.ordersByStatus || {};
        const pending = ordersByStatus.pending || 0;
        const processing = ordersByStatus.processing || 0;
        if (!cancelled) {
          setActiveOrdersCountUser(pending + processing);
          setUserBalance(typeof data.balance === 'number' ? data.balance : 0);
        }
      } catch (e: any) {
        if (!cancelled) setUserStatsError(e.message || 'Failed to fetch user stats');
      } finally {
        if (!cancelled) setUserStatsLoading(false);
      }
    };
    fetchUserStats();
    return () => { cancelled = true; };
  }, [isAuthenticated, isAdmin]);

  const renderCountRef = useRef(0);
  useEffect(() => {
    renderCountRef.current += 1;
    if (process.env.NODE_ENV === 'development' && renderCountRef.current % 100 === 0) {
      console.warn('[Homepage Hero] high render count:', renderCountRef.current);
    }
  });

  const form = useForm<SignInSchema>({
    mode: 'all',
    resolver: zodResolver(signInSchema),
    defaultValues: signInDefaultValues,
  });

  const onSubmit: SubmitHandler<SignInSchema> = async (values) => {
    setError('');
    setSuccess('');
    setUrlError('');

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
          setError('An unexpected error occurred. Please try again.');
          console.error('Login error:', err);
        });
    });
  };

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: DEFAULT_SIGN_IN_REDIRECT });
  };

  const AuthenticatedUserContent = () => (
    <div
      className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm w-full -mt-[30px] lg:-mt-[0px] pt-[30px] p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200"
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          {isAdmin ? (
            <FaUserShield className="w-8 h-8 text-white" />
          ) : isModerator ? (
            <FaUserCheck className="w-8 h-8 text-white" />
          ) : (
            <FaUser className="w-8 h-8 text-white" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
          Welcome back,{' '}
          <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
            {session?.user?.username ||
              session?.user?.email?.split('@')[0] ||
              session?.user?.name ||
              'User'}!
          </span>
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors duration-200">
          {isAdminOrModerator
            ? isModerator
              ? 'Ready to moderate the platform?'
              : 'Ready to manage the platform?'
            : 'Ready to boost your social media presence?'}
        </p>

        <div className="space-y-4">
          {isAdminOrModerator ? (
            <Link
              href="/admin"
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              <FaHome className="w-5 h-5" />
              Go to Admin Panel
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              <FaTachometerAlt className="w-5 h-5" />
              Go to Dashboard
            </Link>
          )}

          {!isAdminOrModerator && (
            <Link
              href="/services"
              className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-600/50 hover:shadow-lg transition-all duration-300 inline-flex items-center justify-center gap-2"
            >
              <FaBriefcase className="w-5 h-5" />
              Browse Services
            </Link>
          )}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)]">
                {isAdminOrModerator
                  ? (typeof totalOrdersCount === 'number' ? totalOrdersCount.toString() : '0')
                  : (typeof activeOrdersCountUser === 'number' ? activeOrdersCountUser.toString() : (userStatsLoading ? '0' : '0'))
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {isAdminOrModerator ? 'Total Orders' : 'Active Orders'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)]">
                {isAdminOrModerator
                  ? (typeof activeUsersCount === 'number' ? activeUsersCount.toString() : '0')
                  : (typeof userBalance === 'number' ? `$${userBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (userStatsLoading ? '0' : '$0.00'))
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {isAdminOrModerator ? 'Active Users' : 'Account Balance'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const LoadingContent = () => (
    <div
      className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm w-full p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200"
      data-aos="fade-down"
      data-aos-duration="500"
    >
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mx-auto mb-4"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto mb-6"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
      </div>
    </div>
  );

  return (
    <section className="flex justify-center items-center pt-[60px] pb-[30px] lg:pt-[120px] lg:pb-[60px] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className={`${isAuthenticated ? 'flex flex-col-reverse' : 'grid grid-cols-1'} lg:grid lg:grid-cols-2 gap-8 2xl:gap-x-20 items-center`}>
          <div>
            <div className="text-left">
              <h1
                className="text-4xl lg:text-6xl font-extrabold mb-4 text-gray-900 dark:text-white leading-tight transition-colors duration-200"
                data-aos="fade-down"
                data-aos-duration="500"
              >
                <span className="text-[var(--primary)] dark:text-[var(--secondary)]">
                  SMMDOC - #1
                </span>{' '}
                <br />
                Cheap SMM Panel
              </h1>
              <p
                className="text-lg mb-6 leading-7 text-gray-600 dark:text-gray-300 lg:w-full mx-auto transition-colors duration-200 text-justify"
                data-aos="fade-down"
                data-aos-duration="1000"
              >
                Boost your online presence today with our Cheap SMM Panel –
                the ultimate solution for social media success! SMMDOC is a
                SMM Panel with more then 3 years on the market and 1,000+
                Orders processed successfully until now!
              </p>
              {!isAuthenticated && !isLoading && (!settingsLoading && userSettings?.signUpPageEnabled !== false) && (
                <Link
                  href="/sign-up"
                  className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-7 py-4 rounded-lg text-lg font-semibold inline-flex items-center justify-center space-x-2 hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] transition-all duration-300 mb-4 hover:-translate-y-1"
                  data-aos="fade-down"
                  data-aos-duration="1000"
                >
                  <span>Sign Up Now</span>
                </Link>
              )}

              {isAuthenticated && (
                <Link
                  href={isAdminOrModerator ? "/admin" : "/dashboard"}
                  className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white px-7 py-4 rounded-lg text-lg font-semibold inline-flex items-center justify-center space-x-2 hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] transition-all duration-300 mb-4 hover:-translate-y-1"
                  data-aos="fade-down"
                  data-aos-duration="1000"
                >
                  {isAdminOrModerator ? (
                    <>
                      <FaHome className="w-5 h-5" />
                      <span>Go to Admin Panel</span>
                    </>
                  ) : (
                    <>
                      <FaTachometerAlt className="w-5 h-5" />
                      <span>Go to Dashboard</span>
                    </>
                  )}
                </Link>
              )}
              <div
                className="flex items-center gap-3 justify-start mt-4"
                data-aos="fade-up"
                data-aos-duration="1200"
              >
                <Image
                  src="/smmgen-users.webp"
                  alt="SMMDOC Users"
                  width={60}
                  height={40}
                  className="rounded"
                />
                <div className="text-gray-600 dark:text-gray-300 font-semibold text-base transition-colors duration-200">
                  <span className="text-[var(--primary)] dark:text-[var(--secondary)] font-bold transition-colors duration-200">
                    {typeof usersCount === 'number' ? usersCount.toString() : '0'}
                  </span>
                  {' '}+ Users using our services.
                </div>
              </div>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
              <strong>Debug Info:</strong>
              <pre className="mt-2 overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
          <div className="w-full lg:flex lg:justify-center">
            {isLoading && <LoadingContent />}
            {!isLoading && isAuthenticated && <AuthenticatedUserContent />}
            {!isLoading && !isAuthenticated && (
              <div
                className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm w-full p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200"
                data-aos="fade-down"
                data-aos-duration="500"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-200">
                    Login to{' '}
                    <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
                      SMMDOC.
                    </span>
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors duration-200">
                    {(!settingsLoading && userSettings?.signUpPageEnabled !== false) && (
                      <>
                        New Here?{' '}
                        <Link
                          href="/sign-up"
                          className="text-[var(--primary)] dark:text-[var(--secondary)] font-bold hover:underline transition-colors duration-200"
                        >
                          Create an account.
                        </Link>
                      </>
                    )}
                  </p>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
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
                      {form.formState.errors.code && (
                        <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                          {form.formState.errors.code.message}
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
                            placeholder="Username or Email"
                            disabled={isPending}
                            {...form.register('email')}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          />
                        </div>
                        {form.formState.errors.email && (
                          <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                            {String(form.formState.errors.email.message) || 'Invalid email'}
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
                            placeholder="Password"
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
                        {form.formState.errors.password && (
                          <p className="text-red-500 dark:text-red-400 text-sm mt-1 transition-colors duration-200">
                            {form.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      {isEnabledForForm('signIn') && (
                        <ErrorBoundary fallback={
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                            ReCAPTCHA temporarily unavailable. You can still sign in.
                          </div>
                        }>
                          <ReCAPTCHA
                            siteKey={recaptchaSettings?.siteKey || ''}
                            version={recaptchaSettings?.version || 'v2'}
                            threshold={recaptchaSettings?.threshold}
                            onVerify={(token) => setRecaptchaToken(token)}
                            onError={() => setRecaptchaToken(null)}
                            onExpired={() => setRecaptchaToken(null)}
                          />
                        </ErrorBoundary>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
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

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white py-3 px-4 rounded-lg text-lg font-semibold hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? 'Logged in...' : showTwoFactor ? 'Confirm' : 'Login to Dashboard'}
                  </button>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;