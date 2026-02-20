'use client';

import dynamic from 'next/dynamic';
import { DEFAULT_USER_PLACEHOLDER } from '@/lib/constants';
import { useCurrentUser } from '@/hooks/use-current-user';
import { getUserDetails } from '@/lib/actions/getUser';
import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { setUserDetails } from '@/lib/slice/userDetails';
import React, { useEffect, useMemo, useState } from 'react';

const MediaAttachModal = dynamic(
  () => import('@/components/media/media-attach-modal'),
  { ssr: false }
);
import {
    FaCamera,
    FaCheck,
    FaClock,
    FaCopy,
    FaEye,
    FaEyeSlash,
    FaGlobe,
    FaKey,
    FaShieldAlt,
    FaTimes,
    FaUser,
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => (
  <div
    className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg backdrop-blur-sm border ${
      type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
        : type === 'error'
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        : type === 'info'
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
    }`}
  >
    <div className="flex items-center space-x-2">
      {type === 'success' && <FaCheck className="w-4 h-4" />}
      <span className="font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
      >
        <FaTimes className="w-3 h-3" />
      </button>
    </div>
  </div>
);

const Switch = ({ checked, onCheckedChange, onClick, title }: any) => (
  <button
    onClick={onClick}
    title={title}
    className={`switch ${checked ? 'switch-checked' : 'switch-unchecked'}`}
  >
    <span className="switch-thumb" />
  </button>
);

const PasswordInput = React.forwardRef<HTMLInputElement, any>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="password-input-container">
        <input
          type={showPassword ? 'text' : 'password'}
          className={className}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {showPassword ? (
            <FaEyeSlash className="h-4 w-4" />
          ) : (
            <FaEye className="h-4 w-4" />
          )}
        </button>
      </div>
    );
  }
);

interface ApiKey {
  key: string;
  createdAt: Date;
  updatedAt: Date;
  id: number;
  userid: number;
}

const ProfilePage = () => {
  const { appName } = useAppNameWithFallback();

  const dispatch = useDispatch();
  const currentUser = useCurrentUser();
  const userDetails = useSelector((state: any) => state.userDetails);

  useEffect(() => {
    setPageTitle('Account Settings', appName);
  }, [appName]);

  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [twoFactor, setTwoFactor] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Dhaka');
  const [selectedTimeFormat, setSelectedTimeFormat] = useState<'12' | '24'>('24');
  const [showApiKey, setShowApiKey] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);
  const [formData, setFormData] = useState({
    currentPass: '',
    newPass: '',
    confirmNewPass: '',
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    username: '',
    verificationCode: '',
  });
  const [hasProfileChanges, setHasProfileChanges] = useState(false);
  const [isSendingVerificationCode, setIsSendingVerificationCode] = useState(false);
  const [showMediaAttachModal, setShowMediaAttachModal] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState<string | null>(null);
  const [isEmailVerificationPending, setIsEmailVerificationPending] = useState(false);
  const [isGeneratingApiKey, setIsGeneratingApiKey] = useState(false);
  const [isSavingTimezone, setIsSavingTimezone] = useState(false);
  const [isSavingTimeFormat, setIsSavingTimeFormat] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  const [validationErrors, setValidationErrors] = useState<{
    fullName?: string;
    email?: string;
    username?: string;
    verificationCode?: string;
    currentPass?: string;
    newPass?: string;
    confirmNewPass?: string;
  }>({});
  const [isFormValid, setIsFormValid] = useState(true);

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'bn', label: 'Bengali' },
    { value: 'ar', label: 'Arabic' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'hi', label: 'Hindi' },
  ];

  const timezones = useMemo(() => {
    try {
      const tzList = Intl.supportedValuesOf('timeZone');
      return tzList.map(timezone => {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'longOffset'
        });

        const offsetString = formatter.formatToParts(now)
          .find(part => part.type === 'timeZoneName')?.value || '';

        const offsetMinutes = -now.getTimezoneOffset();
        const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const localDate = new Date(now.toLocaleString('en-US'));
        const offsetSeconds = Math.round((targetDate.getTime() - localDate.getTime()) / 1000) + (offsetMinutes * 60);

        return {
          value: timezone,
          label: `${offsetString} ${timezone.replace('_', ' ')}`,
          timezone: timezone,
          offsetSeconds: offsetSeconds
        };
      }).sort((a, b) => {
        if (a.offsetSeconds !== b.offsetSeconds) {
          return a.offsetSeconds - b.offsetSeconds;
        }
        return a.timezone.localeCompare(b.timezone);
      });
    } catch (error) {
      console.error('Error generating timezones:', error);
      return [
        { value: 'Asia/Dhaka', label: '(UTC+06:00) Asia/Dhaka', timezone: 'Asia/Dhaka', offsetSeconds: 21600 },
        { value: 'UTC', label: '(UTC+00:00) UTC', timezone: 'UTC', offsetSeconds: 0 },
        { value: 'Europe/Berlin', label: '(UTC+01:00) Europe/Berlin', timezone: 'Europe/Berlin', offsetSeconds: 3600 },
        { value: 'Asia/Kolkata', label: '(UTC+05:30) Asia/Kolkata', timezone: 'Asia/Kolkata', offsetSeconds: 19800 },
        { value: 'America/New_York', label: '(UTC-05:00) America/New York', timezone: 'America/New_York', offsetSeconds: -18000 },
      ];
    }
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsUserDataLoading(true);

        const userData = await getUserDetails();

        if (userData) {

          dispatch(setUserDetails(userData));

          setTwoFactor(userData.isTwoFactorEnabled || false);
          setSelectedLanguage((userData as any).language || 'en');

          const userTimezone = (userData as any).timezone;
          const userTimeFormat = (userData as any).timeFormat || '24';

          setSelectedTimezone(userTimezone || 'Asia/Dhaka');
          setSelectedTimeFormat((userTimeFormat === '12' || userTimeFormat === '24') ? userTimeFormat : '24');

          setProfileData({
            fullName: userData.name || '',
            email: userData.email || '',
            username: userData.username || '',
            verificationCode: '',
          });

          if ((userData as any).apiKey) {
            setApiKey({
              key: (userData as any).apiKey,
              createdAt: new Date(),
              updatedAt: new Date(),
              id: 1,
              userid: userData.id,
            });
          }
        } else {
          showToast('Failed to load user data', 'error');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        showToast('Error loading user data', 'error');
      } finally {
        setIsUserDataLoading(false);
        setIsPageLoading(false);
      }
    };

    if (currentUser?.id) {
      loadUserData();
    } else {
      setIsPageLoading(false);
      setIsUserDataLoading(false);
    }
  }, [currentUser?.id, dispatch]);

  useEffect(() => {
    if (userDetails?.apiKey && !apiKey) {
      setApiKey({
        key: userDetails.apiKey,
        createdAt: new Date(userDetails.apiKeyCreatedAt || new Date()),
        updatedAt: new Date(userDetails.apiKeyUpdatedAt || new Date()),
        id: userDetails.apiKeyId || 1,
        userid: userDetails.id,
      });
    }
  }, [userDetails, apiKey]);

  useEffect(() => {
    if (userDetails?.image || currentUser?.image) {
      setProfileImageError(false);
    }
  }, [userDetails?.image, currentUser?.image]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (key: ApiKey | null) => {
    if (key) {
      navigator.clipboard.writeText(key.key).then(() => {
        setCopied(true);
        showToast('API key copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.currentPass ||
      !formData.newPass ||
      !formData.confirmNewPass
    ) {
      showToast('Please fill in all password fields', 'error');
      return;
    }

    if (formData.newPass !== formData.confirmNewPass) {
      showToast('New passwords do not match', 'error');
      return;
    }

    if (formData.newPass.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsLoading(true);

    try {

      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPass,
          newPassword: formData.newPass,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setFormData({ currentPass: '', newPass: '', confirmNewPass: '' });
        showToast('Password changed successfully!', 'success');
      } else {
        showToast(result.error || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      showToast('Error changing password', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    const nextState = !twoFactor;

    try {
      const response = await fetch('/api/user/toggle-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: nextState,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTwoFactor(nextState);

        dispatch(
          setUserDetails({
            ...userDetails,
            isTwoFactorEnabled: nextState,
          })
        );

        showToast(
          `Two-factor authentication ${
            nextState ? 'enabled' : 'disabled'
          } successfully!`,
          'success'
        );
      } else {
        showToast(result.message || 'Failed to toggle 2FA', 'error');
      }
    } catch (error) {
      console.error('2FA toggle error:', error);
      showToast('Error toggling 2FA', 'error');
    }
  };

  const handleApiKeyGeneration = async () => {
    setIsGeneratingApiKey(true);
    try {
      const response = await fetch('/api/user/generate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        const newApiKey = {
          key: result.data.apiKey,
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
          id: result.data.id,
          userid: result.data.userId,
        };

        setApiKey(newApiKey);
        setShowApiKey(true);

        dispatch(
          setUserDetails({
            ...userDetails,
            apiKey: result.data.apiKey,
            apiKeyCreatedAt: result.data.createdAt,
            apiKeyUpdatedAt: result.data.updatedAt,
            apiKeyId: result.data.id,
          })
        );

        showToast('API key generated successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to generate API key', 'error');
      }
    } catch (error) {
      console.error('API key generation error:', error);
      showToast('Error generating API key', 'error');
    } finally {
      setIsGeneratingApiKey(false);
    }
  };

  const handleTimezoneSave = async () => {
    setIsSavingTimezone(true);
    setIsSavingTimeFormat(true);
    try {
      const response = await fetch('/api/user/update-timezone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timezone: selectedTimezone,
          timeFormat: selectedTimeFormat,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        dispatch(
          setUserDetails({
            ...userDetails,
            timezone: selectedTimezone,
            timeFormat: selectedTimeFormat,
          })
        );

        showToast('Timezone and time format updated successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to update timezone and time format', 'error');
      }
    } catch (error) {
      console.error('Timezone and time format update error:', error);
      showToast('Error updating timezone and time format', 'error');
    } finally {
      setIsSavingTimezone(false);
      setIsSavingTimeFormat(false);
    }
  };

  const handleLanguageSave = async () => {
    setIsSavingLanguage(true);
    try {
      const response = await fetch('/api/user/update-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        dispatch(
          setUserDetails({
            ...userDetails,
            language: selectedLanguage,
          })
        );

        showToast('Language updated successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to update language', 'error');
      }
    } catch (error) {
      console.error('Language update error:', error);
      showToast('Error updating language', 'error');
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleUpdateProfile = () => {
    if (isEditingProfile) {

      setProfileData({
        username: user?.username || '',
        fullName: user?.name || '',
        email: user?.email || '',
        verificationCode: '',
      });
      setIsEditingProfile(false);
      setHasProfileChanges(false);
    } else {

      setIsEditingProfile(true);
    }
  };

  const handleProfileDataChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field !== 'verificationCode') {
      validateProfileField(field, value);
    }

    const originalFullName = user?.name || '';
    const originalEmail = user?.email || '';
    const originalUsername = user?.username || '';

    const newData = {
      ...profileData,
      [field]: value,
    };

    const hasProfileFieldChanges =
      newData.fullName !== originalFullName || 
      newData.email !== originalEmail ||
      newData.username !== originalUsername;
    const hasVerificationCodeForUnverified = !!(user as any)?.emailVerified === false && !!newData.verificationCode?.trim();
    const hasChanges = hasProfileFieldChanges || hasVerificationCodeForUnverified;
    setHasProfileChanges(hasChanges);
  };

  const handleSaveProfileChanges = async () => {
    if (!hasProfileChanges) return;

    const emailError = validateEmail(profileData.email);
    const fullNameError = validateFullName(profileData.fullName);
    const usernameError = validateUsername(profileData.username);

    if (emailError || fullNameError || usernameError) {
      setValidationErrors({
        email: emailError || undefined,
        fullName: fullNameError || undefined,
        username: usernameError || undefined,
      });
      showToast('Please fix validation errors before saving', 'error');
      return;
    }

    setIsLoading(true);

    try {

      const originalEmail = user?.email || '';
      const isEmailChanged = profileData.email !== originalEmail;

      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          email: profileData.email,
          username: profileData.username,
          ...(profileData.verificationCode?.trim() && {
            verificationCode: profileData.verificationCode.trim(),
          }),
        }),
      });

      const result = await response.json();

      if (response.ok) {

        if (isEmailChanged) {
          const wasVerifiedWithCode = !!(profileData.verificationCode?.trim());
          if (wasVerifiedWithCode) {
            setPendingEmailChange(null);
            setIsEmailVerificationPending(false);
            showToast('Profile updated! Email changed and verified successfully.', 'success');
          } else {
            setPendingEmailChange(profileData.email);
            setIsEmailVerificationPending(true);
            showToast('Profile updated! Account is unverified. Please verify your new email address.', 'info');
          }
        } else if (result.data?.emailVerified && !(userDetails as any)?.emailVerified) {
          setPendingEmailChange(null);
          setIsEmailVerificationPending(false);
          showToast('Email verified successfully!', 'success');
        } else {
          showToast('Profile updated successfully!', 'success');
        }

        const updatedEmailVerified = result.data !== undefined ? result.data.emailVerified : userDetails.emailVerified;
        dispatch(
          setUserDetails({
            ...userDetails,
            name: profileData.fullName,
            username: profileData.username,
            email: isEmailChanged ? profileData.email : (userDetails.email ?? profileData.email),
            emailVerified: updatedEmailVerified,
          })
        );

        setIsEditingProfile(false);
        setHasProfileChanges(false);
        setProfileData((prev) => ({
          ...prev,
          verificationCode: '',
          email: result.data?.email ?? prev.email,
        }));

        if (result.data) {
          getUserDetails().then((freshUser) => {
            if (freshUser) {
              dispatch(setUserDetails(freshUser));
            }
          });
        }
      } else {

        const errorMessage = result.error || result.message || 'Failed to update profile';
        showToast(errorMessage, 'error');
        console.error('Profile update failed:', result);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showToast('Network error: Unable to update profile. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    const emailTarget = pendingEmailChange || (isEditingProfile && profileData.email !== user?.email ? profileData.email : null) || user?.email;
    if (!emailTarget) {
      showToast('Please enter an email address first', 'error');
      return;
    }
    if (isEditingProfile && profileData.email !== user?.email) {
      const emailError = validateEmail(profileData.email);
      if (emailError) {
        showToast(emailError, 'error');
        return;
      }
    }
    setIsSendingVerificationCode(true);
    try {
      const response = await fetch('/api/user/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailTarget }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast(`Verification code sent to ${emailTarget}!`, 'success');
      } else {
        showToast(
          result.error || result.message || 'Failed to send verification email',
          'error'
        );
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      showToast('Error sending verification email', 'error');
    } finally {
      setIsSendingVerificationCode(false);
    }
  };

  const handleProfileImageSelected = async (fileUrl: string) => {
    const user = userDetails || currentUser;
    try {
      if (user?.image?.trim()) {
        try {
          await fetch('/api/admin/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imagePath: user.image }),
          });
        } catch {
        }
      }

      const response = await fetch('/api/user/set-profile-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: fileUrl }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedUserDetails = { ...userDetails, image: result.data.image };
        dispatch(setUserDetails(updatedUserDetails));

        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: result.data.image }),
          });
        } catch {
        }

        showToast('Profile picture updated successfully!', 'success');

        setTimeout(async () => {
          try {
            const updatedUserData = await getUserDetails();
            if (updatedUserData) {
              dispatch(setUserDetails(updatedUserData));
              window.dispatchEvent(new CustomEvent('avatarUpdated'));
            }
          } catch {
          }
        }, 500);
      } else {
        showToast(result.error || 'Failed to update profile picture', 'error');
      }
    } catch (error) {
      console.error('Profile image update error:', error);
      showToast('Error updating profile picture', 'error');
    }
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validateFullName = (name: string): string | null => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Full name must be at least 2 characters';
    return null;
  };

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) return 'Username is required';
    if (username.trim().length < 3) return 'Username must be at least 3 characters';
    if (username.trim().length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const validateProfileField = (field: string, value: string) => {
    let error: string | null = null;

    if (field === 'fullName') {
      error = validateFullName(value);
    } else if (field === 'email') {
      error = validateEmail(value);
    } else if (field === 'username') {
      error = validateUsername(value);
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));

    return error === null;
  };

  const validatePasswordField = (field: string, value: string) => {
    let error: string | null = null;

    if (field === 'currentPass') {
      error = value ? null : 'Current password is required';
    } else if (field === 'newPass') {
      error = validatePassword(value);
    } else if (field === 'confirmNewPass') {
      error = validateConfirmPassword(formData.newPass, value);
    }

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));

    const isValid = !error &&
      !!formData.currentPass &&
      !!formData.newPass &&
      !!formData.confirmNewPass &&
      formData.newPass === formData.confirmNewPass;

    setIsFormValid(isValid);

    return error === null;
  };

  if (isPageLoading || isUserDataLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-40 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-4">
                  <div className="form-group">
                    <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                    <div className="h-10 w-40 gradient-shimmer rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-32 gradient-shimmer rounded ml-3" />
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="h-24 w-24 gradient-shimmer rounded-full" />
                    <div className="absolute bottom-0 right-0 h-8 w-8 gradient-shimmer rounded-full border-2 border-white dark:border-gray-800" />
                  </div>
                  <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                </div>
              </div>
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-36 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-4">
                  <div className="form-group">
                    <div className="h-4 w-36 gradient-shimmer rounded mb-2" />
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="form-group">
                    <div className="h-4 w-40 gradient-shimmer rounded mb-2" />
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="card card-padding">
                <div className="card-header mb-4">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-16 gradient-shimmer rounded ml-3" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-5 w-48 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-full gradient-shimmer rounded mb-1" />
                    <div className="h-4 w-3/4 gradient-shimmer rounded" />
                  </div>
                  <div className="h-6 w-11 gradient-shimmer rounded-full ml-4" />
                </div>
              </div>
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-28 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-[42px] w-full gradient-shimmer rounded-lg" />
                    <div className="h-3 w-32 gradient-shimmer rounded mt-2" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 w-24 gradient-shimmer rounded-lg" />
                    <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-28 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-4">
                  <div className="form-group">
                    <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-10 w-10 gradient-shimmer rounded-lg" />
                  <div className="h-6 w-36 gradient-shimmer rounded ml-3" />
                </div>
                <div className="space-y-4">
                  <div className="form-group">
                    <div className="h-4 w-32 gradient-shimmer rounded mb-2" />
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div className="h-10 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = userDetails || currentUser;

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaUser />
                </div>
                <h3 className="card-title">Account Information</h3>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    value={
                      isEditingProfile ? profileData.username : (user?.username || profileData.username || '')
                    }
                    onChange={(e) =>
                      handleProfileDataChange('username', e.target.value)
                    }
                    readOnly={!isEditingProfile}
                    className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                      validationErrors.username
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder="Enter username"
                  />
                  {validationErrors.username && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{validationErrors.username}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) =>
                      handleProfileDataChange('fullName', e.target.value)
                    }
                    className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                      validationErrors.fullName
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder="Enter full name"
                  />
                  {validationErrors.fullName && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{validationErrors.fullName}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileDataChange('email', e.target.value)
                      }
                      readOnly={!(user as any)?.emailVerified}
                      className={`form-field w-full px-4 py-3 border ${
                        !(user as any)?.emailVerified
                          ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700/50'
                      } ${
                        !(user as any)?.emailVerified && !pendingEmailChange
                          ? 'border-red-500 dark:border-red-400'
                          : validationErrors.email
                          ? 'border-red-500 dark:border-red-400'
                          : 'border-gray-300 dark:border-gray-600'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                      placeholder="Enter email address"
                    />
                    {profileData.email === user?.email && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {(user as any)?.emailVerified && !pendingEmailChange ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Not Verified
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{validationErrors.email}</p>
                  )}
                  {pendingEmailChange && (
                    <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
                      Pending verification for: {pendingEmailChange}
                    </p>
                  )}
                </div>

                {(!(user as any)?.emailVerified || pendingEmailChange) && (
                  <div className="form-group">
                    <label className="form-label">
                      {profileData.email !== user?.email && profileData.email
                        ? 'Verification Code (optional)'
                        : 'Verification Code'}
                    </label>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                      {profileData.email !== user?.email && profileData.email
                        ? 'Enter the code sent to your new email to verify immediately. Or save without code, your account will be unverified until you verify via login.'
                        : 'Enter the code sent to your email to verify your account.'}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={profileData.verificationCode}
                        onChange={(e) =>
                          handleProfileDataChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        maxLength={6}
                        className="form-field w-32 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        placeholder="123456"
                      />
                      <button
                        type="button"
                        onClick={handleResendVerificationEmail}
                        disabled={isSendingVerificationCode}
                        className="btn btn-secondary whitespace-nowrap"
                      >
                        {isSendingVerificationCode ? 'Sending...' : 'Send Code'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {hasProfileChanges ? (
                    <button
                      onClick={handleSaveProfileChanges}
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="btn btn-primary opacity-50 cursor-not-allowed"
                    >
                      No Changes to Save
                    </button>
                  )}

                </div>
              </div>
            </div>
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaCamera />
                </div>
                <h3 className="card-title">Profile Picture</h3>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {((user?.image || DEFAULT_USER_PLACEHOLDER) && !profileImageError) ? (
                    <img
                      src={user?.image || DEFAULT_USER_PLACEHOLDER}
                      alt="Profile"
                      className="profile-picture object-cover"
                      onError={() => {
                        setProfileImageError(true);
                      }}
                    />
                  ) : (
                    <div className="profile-picture bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white font-semibold text-2xl">
                      {user?.username?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowMediaAttachModal(true)}
                    className="profile-picture-edit cursor-pointer"
                    title="Change profile picture"
                  >
                    <FaCamera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <MediaAttachModal
                isOpen={showMediaAttachModal}
                onClose={() => setShowMediaAttachModal(false)}
                currentPath="uploads/avatars"
                singleFile
                showTabs={false}
                accept="image/*"
                maxFileSize={1 * 1024 * 1024}
                uploadHint="Image only [Max 1MB]"
                hideUploadPath
                onFilesUploaded={(fileUrls) => {
                  if (fileUrls[0]) {
                    handleProfileImageSelected(fileUrls[0]);
                  }
                }}
              />
            </div>

            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaShieldAlt />
                </div>
                <h3 className="card-title">Change Password</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <PasswordInput
                    value={formData.currentPass || ''}
                    onChange={(e: any) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        currentPass: value,
                      }));
                      validatePasswordField('currentPass', value);
                    }}
                    className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                      validationErrors.currentPass
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder="Enter current password"
                  />
                  {validationErrors.currentPass && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{validationErrors.currentPass}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <PasswordInput
                    value={formData.newPass || ''}
                    onChange={(e: any) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        newPass: value,
                      }));
                      validatePasswordField('newPass', value);
                    }}
                    className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                      validationErrors.newPass
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder="Enter new password"
                  />
                  {validationErrors.newPass && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{validationErrors.newPass}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <PasswordInput
                    value={formData.confirmNewPass || ''}
                    onChange={(e: any) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        confirmNewPass: value,
                      }));
                      validatePasswordField('confirmNewPass', value);
                    }}
                    className={`form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border ${
                      validationErrors.confirmNewPass
                        ? 'border-red-500 dark:border-red-400'
                        : 'border-gray-300 dark:border-gray-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200`}
                    placeholder="Confirm new password"
                  />
                  {validationErrors.confirmNewPass && (
                    <p className="text-red-500 dark:text-red-400 text-sm mt-1">{validationErrors.confirmNewPass}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card card-padding">
              <div className="card-header mb-4">
                <div className="card-icon">
                  <FaShieldAlt />
                </div>
                <h3 className="card-title">2FA</h3>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label className="form-label">
                    Two-factor authentication
                  </label>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Email-based option to add an extra layer of protection to
                    your account. When signing in you'll need to enter a code
                    that will be sent to your email address.
                  </p>
                </div>
                <div className="ml-4">
                  <Switch
                    checked={twoFactor}
                    onCheckedChange={setTwoFactor}
                    onClick={handleTwoFactorToggle}
                    title={`${
                      twoFactor ? 'Disable' : 'Enable'
                    } Two-Factor Authentication`}
                  />
                </div>
              </div>
            </div>
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaKey />
                </div>
                <h3 className="card-title">API Keys</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label mb-2">API Key</label>
                  <div className="api-key-container">
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={
                          apiKey && showApiKey
                            ? (apiKey.key || '')
                            : apiKey
                            ? '••••••••••••••••••••••••••••••••'
                            : 'No API key generated'
                        }
                        className="form-field w-full pr-20 font-mono px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      />

                      {apiKey && (
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title={showApiKey ? 'Hide API Key' : 'Show API Key'}
                        >
                          {showApiKey ? (
                            <FaEyeSlash className="h-4 w-4" />
                          ) : (
                            <FaEye className="h-4 w-4" />
                          )}
                        </button>
                      )}

                      {apiKey && (
                        <div className="api-key-timestamp">
                          <small>
                            Created:{' '}
                            {new Date(apiKey.createdAt).toLocaleString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="api-key-buttons">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(apiKey)}
                        className="btn btn-secondary flex items-center justify-center gap-2"
                        disabled={!apiKey}
                      >
                        <FaCopy className="h-4 w-4" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>

                      <button
                        onClick={handleApiKeyGeneration}
                        disabled={isGeneratingApiKey}
                        className="btn btn-primary"
                      >
                        {isGeneratingApiKey ? 'Generating...' : (apiKey ? 'Generate New' : 'Generate')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaClock />
                </div>
                <h3 className="card-title">Timezone</h3>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select
                    value={selectedTimezone || ''}
                    onChange={(e) => setSelectedTimezone(e.target.value)}
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {timezones.map((tz, index) => (
                      <option key={`${tz.timezone}-${index}`} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time Format</label>
                  <select
                    value={selectedTimeFormat}
                    onChange={(e) => setSelectedTimeFormat(e.target.value as '12' | '24')}
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                </div>
                <button
                  onClick={handleTimezoneSave}
                  disabled={isSavingTimezone || isSavingTimeFormat}
                  className="btn btn-primary"
                >
                  {(isSavingTimezone || isSavingTimeFormat) ? 'Saving...' : 'Save Timezone'}
                </button>
              </div>
            </div>
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaGlobe />
                </div>
                <h3 className="card-title">Change Language</h3>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Select Language</label>
                  <select
                    value={selectedLanguage || ''}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    {languages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleLanguageSave}
                  disabled={isSavingLanguage}
                  className="btn btn-primary"
                >
                  {isSavingLanguage ? 'Saving...' : 'Save Language'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;