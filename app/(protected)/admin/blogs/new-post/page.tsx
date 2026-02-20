'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaCheckCircle,
  FaGlobe,
  FaTimes,
  FaUpload
} from 'react-icons/fa';
import { EmailTemplateEditor } from '@/components/admin/email-template-editor';
import { useTheme } from 'next-themes';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import { validateBlogSlug, generateBlogSlug } from '@/lib/utils';

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-800"></div>
    </div>
  </div>
);

const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'pending';
  onClose: () => void;
}) => {
  const getDarkClasses = () => {
    switch (type) {
      case 'success':
        return 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
      case 'error':
        return 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
      case 'info':
        return 'dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
      case 'pending':
        return 'dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200';
      default:
        return '';
    }
  };

  return (
    <div className={`toast toast-${type} toast-enter ${getDarkClasses()}`}>
      {type === 'success' && <FaCheckCircle className="toast-icon" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="toast-close dark:hover:bg-white/10">
        <FaTimes className="toast-close-icon" />
      </button>
    </div>
  );
};

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  metaTitle: string;
  metaDescription: string;
}

const NewPostPage = () => {
  const router = useRouter();
  const { appName } = useAppNameWithFallback();
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsFormLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadTimeFormat = async () => {
      const storedTimeFormat = (userDetails as any)?.timeFormat;
      if (storedTimeFormat === '12' || storedTimeFormat === '24') {
        setTimeFormat(storedTimeFormat);
        return;
      }

      try {
        const userData = await getUserDetails();
        const userTimeFormat = (userData as any)?.timeFormat || '24';
        setTimeFormat(userTimeFormat === '12' || userTimeFormat === '24' ? userTimeFormat : '24');
      } catch (error) {
        console.error('Error loading time format:', error);
        setTimeFormat('24');
      }
    };

    loadTimeFormat();
  }, [userDetails]);

  const formatTime = (dateString: string | Date): string => {
    if (!dateString) return 'null';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'null';
    }
    
    if (isNaN(date.getTime())) return 'null';

    if (timeFormat === '12') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  };

  const isDarkMode = mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark'));

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    setPageTitle('New Post', appName);
  }, [appName]);

  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
  });

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(true);

  const [slugStatus, setSlugStatus] = useState<{
    isChecking: boolean;
    isAvailable: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isAvailable: null,
    message: ''
  });

  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const checkSlugAvailability = async (slug: string) => {
    const validation = validateBlogSlug(slug);
    
    if (!validation.isValid) {
      setSlugStatus({
        isChecking: false,
        isAvailable: false,
        message: validation.error || 'Invalid slug format'
      });
      return;
    }

    if (!slug || slug.length < 3) {
      setSlugStatus({ isChecking: false, isAvailable: null, message: '' });
      return;
    }

    setSlugStatus({ isChecking: true, isAvailable: null, message: 'Checking availability...' });

    try {
      const response = await fetch('/api/blogs/check-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug }),
      });

      const result = await response.json();

      if (!result.success) {
        setSlugStatus({
          isChecking: false,
          isAvailable: false,
          message: result.error || 'Error checking availability'
        });
        return;
      }

      setSlugStatus({
        isChecking: false,
        isAvailable: result.available,
        message: result.available 
          ? 'URL slug is available' 
          : result.error || 'URL slug is already taken'
      });
    } catch (error) {
      setSlugStatus({
        isChecking: false,
        isAvailable: null,
        message: 'Error checking availability'
      });
    }
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedSlugCheck = debounce(checkSlugAvailability, 1000);

  const handleInputChange = (field: keyof PostFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'title' && value && !isSlugManuallyEdited) {
      const newSlug = generateBlogSlug(value);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));

      if (newSlug) {
        debouncedSlugCheck(newSlug);
      }
    }

    if (field === 'slug') {
      setIsSlugManuallyEdited(true);
      
      const normalizedSlug = generateBlogSlug(value);
      if (normalizedSlug !== value) {
        setFormData(prev => ({
          ...prev,
          slug: normalizedSlug
        }));
        if (normalizedSlug) {
          debouncedSlugCheck(normalizedSlug);
        }
      } else {
        debouncedSlugCheck(value);
      }
    }
  };

  const regenerateSlug = () => {
    if (formData.title) {
      const newSlug = generateBlogSlug(formData.title);
      setFormData(prev => ({
        ...prev,
        slug: newSlug
      }));
      setIsSlugManuallyEdited(false);
      if (newSlug) {
        debouncedSlugCheck(newSlug);
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setImageUploading(true);

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast('Only image files (JPEG, PNG, GIF, WebP) are allowed', 'error');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast('File size must be less than 5MB', 'error');
        return;
      }

      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'uploads');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({
          ...prev,
          featuredImage: data.fileUrl
        }));
        showToast('Image uploaded successfully!', 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Error uploading image', 'error');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Error uploading image', 'error');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!formData.title.trim()) {
        showToast('Please enter a post title', 'error');
        setIsLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        showToast('Please enter post content', 'error');
        setIsLoading(false);
        return;
      }

      const slugValidation = validateBlogSlug(formData.slug);
      if (!slugValidation.isValid) {
        showToast(slugValidation.error || 'Invalid slug format', 'error');
        setIsLoading(false);
        return;
      }

      if (formData.slug) {
        const response = await fetch('/api/blogs/check-slug', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ slug: formData.slug }),
        });

        const result = await response.json();
        if (!result.success || !result.available) {
          showToast(result.error || 'Slug is not available', 'error');
          setIsLoading(false);
          return;
        }
      }

      const postData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImage: formData.featuredImage,
        status: 'published',
        publishedAt: new Date().toISOString(),
        seoTitle: formData.metaTitle,
        seoDescription: formData.metaDescription
      };

      console.log('Submitting post:', postData);

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create blog post');
      }

      showToast('Post published successfully!', 'success');

      setTimeout(() => {
        router.push('/admin/blogs');
      }, 2000);

    } catch (error) {
      showToast('Error saving post', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFormLoading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 w-48 gradient-shimmer rounded mb-2" />
                <div className="h-4 w-80 gradient-shimmer rounded" />
              </div>
              <div className="hidden md:flex">
                <div className="h-10 w-24 gradient-shimmer rounded" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card card-padding">
                <div className="space-y-4">
                  <div>
                    <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                    <div className="h-12 w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="card card-padding">
                <div>
                  <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                  <div className="h-64 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
              <div className="card card-padding">
                <div>
                  <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                  <div className="h-24 w-full gradient-shimmer rounded-lg" />
                </div>
              </div>
              <div className="card card-padding">
                <div className="h-6 w-28 gradient-shimmer rounded mb-4" />
                <div className="space-y-4">
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-10 w-full gradient-shimmer rounded-lg" />
                  </div>
                  <div>
                    <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                    <div className="h-20 w-full gradient-shimmer rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="card card-padding">
                <div className="h-6 w-32 gradient-shimmer rounded mb-4" />
                <div className="h-48 w-full gradient-shimmer rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Add New Post
              </h1>
              <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                Create a new blog post with rich content and SEO optimization
              </p>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={handleSubmit}
                className="btn btn-primary flex items-center gap-2 px-4 py-2.5"
                disabled={isLoading}
              >
                {!isLoading && <FaGlobe className="h-4 w-4" />}
                {isLoading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card card-padding">
              <div className="space-y-4">
                <div>
                  <label className="form-label mb-2">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="form-field w-full px-4 py-3 text-lg font-medium bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter your post title..."
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label">URL Slug</label>
                    {isSlugManuallyEdited && formData.title && (
                      <button
                        type="button"
                        onClick={regenerateSlug}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Regenerate from title
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">/blog/</span>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => handleInputChange('slug', e.target.value)}
                          className={`form-field w-full px-3 py-2 pr-8 bg-white dark:bg-gray-700/50 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 ${
                            slugStatus.isAvailable === true
                              ? 'border-green-300 dark:border-green-600 focus:ring-green-500'
                              : slugStatus.isAvailable === false
                              ? 'border-red-300 dark:border-red-600 focus:ring-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)]'
                          }`}
                          placeholder="post-url-slug"
                        />
                        {slugStatus.isChecking && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <GradientSpinner size="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                    {slugStatus.message && (
                      <div className={`text-xs flex items-center gap-1 ${
                        slugStatus.isAvailable === true
                          ? 'text-green-600 dark:text-green-400'
                          : slugStatus.isAvailable === false
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {slugStatus.message}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Preview: <span className="font-mono">/blog/{formData.slug || 'your-post-slug'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card card-padding">
              <div>
                <label className="form-label mb-2">
                  Post Content *
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <EmailTemplateEditor
                    value={formData.content}
                    onChange={(newContent) => handleInputChange('content', newContent)}
                    placeholder="Write your post content here..."
                    isDarkMode={isDarkMode}
                    editorKey="new-post-content"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Use the rich text editor to format your content with images, links, and styling.
                </p>
              </div>
            </div>
            <div className="card card-padding">
              <div>
                <label className="form-label mb-2">Post Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows={3}
                  className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
                  placeholder="Write a brief excerpt or summary of your post..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This will be used in post previews and search results (optional)
                </p>
              </div>
            </div>
            <div className="card card-padding">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                SEO Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label mb-2">Meta Title</label>
                  <input
                    type="text"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder="SEO title for search engines..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.metaTitle.length}/60 characters (recommended)
                  </p>
                </div>
                <div>
                  <label className="form-label mb-2">Meta Description</label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    rows={3}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
                    placeholder="SEO description for search engines..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formData.metaDescription.length}/160 characters (recommended)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card card-padding">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Featured Image
              </h3>
              <div className="space-y-3">
                {formData.featuredImage ? (
                  <div className="relative">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleInputChange('featuredImage', '')}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      <FaTimes className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file);
                        }
                      }}
                      className="hidden"
                      id="featured-image-upload"
                    />
                    <label
                      htmlFor="featured-image-upload"
                      className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                      <FaUpload className="mx-auto mb-2 text-3xl" />
                      <p>Click to upload featured image</p>
                      <p className="text-sm mt-1">PNG, JPG, GIF up to 5MB</p>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex flex-wrap justify-center gap-3 md:hidden z-50">
        <button
          onClick={handleSubmit}
          className="btn btn-primary flex items-center justify-center gap-2 px-4 py-2.5 w-full"
          disabled={isLoading}
        >
          {!isLoading && <FaGlobe className="h-4 w-4" />}
          {isLoading ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
};

export default NewPostPage;