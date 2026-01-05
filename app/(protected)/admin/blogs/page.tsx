'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import parse from 'html-react-parser';
import {
    FaBan,
    FaCheckCircle,
    FaClock,
    FaComments,
    FaEdit,
    FaHeart,
    FaNewspaper,
    FaPlus,
    FaSearch,
    FaSync,
    FaTimes,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { formatID, formatNumber } from '@/lib/utils';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';
import BlogsTable from '@/components/admin/blogs/blogs-table';
import DeleteBlogModal from '@/components/admin/blogs/modals/delete-blog';
import ChangeBlogStatusModal from '@/components/admin/blogs/modals/change-blog-status';

const BlogsTableSkeleton = () => {
  const rows = Array.from({ length: 10 });

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1400px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              {Array.from({ length: 7 }).map((_, idx) => (
                <th key={idx} className="text-left p-3">
                  <div className="h-4 rounded w-3/4 gradient-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((_, rowIdx) => (
              <tr key={rowIdx} className="border-t dark:border-gray-700">
                <td className="p-3">
                  <div className="h-4 w-4 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-6 w-16 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="max-w-xs">
                    <div className="h-4 w-48 gradient-shimmer rounded mb-2" />
                    <div className="h-3 w-64 gradient-shimmer rounded" />
                  </div>
                </td>
                <td className="p-3">
                  <div className="h-4 w-24 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-3 w-24 gradient-shimmer rounded mb-1" />
                  <div className="h-3 w-20 gradient-shimmer rounded" />
                </td>
                <td className="p-3">
                  <div className="h-5 w-20 gradient-shimmer rounded-full" />
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                    <div className="h-8 w-8 gradient-shimmer rounded" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="h-5 w-48 gradient-shimmer rounded" />
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <div className="h-9 w-20 gradient-shimmer rounded" />
          <div className="h-5 w-24 gradient-shimmer rounded" />
          <div className="h-9 w-16 gradient-shimmer rounded" />
        </div>
      </div>
    </>
  );
};

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

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  tags: string[];
  status: 'published' | 'draft';
  featuredImage?: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  readTime: number;
  seoTitle?: string;
  seoDescription?: string;
}

interface BlogStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  averageReadTime: number;
  topCategories: number;
  todayViews: number;
  thisMonthPosts: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}


const BlogsPage = () => {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');
  const router = useRouter();

  useEffect(() => {
    setPageTitle('Blogs', appName);
  }, [appName]);

  useEffect(() => {
    const loadTimeFormat = async () => {
      const storedTimeFormat = (userDetails as any)?.timeFormat;
      const storedTimezone = (userDetails as any)?.timezone;
      
      if (storedTimeFormat === '12' || storedTimeFormat === '24') {
        setTimeFormat(storedTimeFormat);
      }
      
      if (storedTimezone) {
        setUserTimezone(storedTimezone);
      }

      if ((storedTimeFormat === '12' || storedTimeFormat === '24') && storedTimezone) {
        return;
      }

      try {
        const userData = await getUserDetails();
        const userTimeFormat = (userData as any)?.timeFormat || '24';
        const userTz = (userData as any)?.timezone || 'Asia/Dhaka';
        setTimeFormat(userTimeFormat === '12' || userTimeFormat === '24' ? userTimeFormat : '24');
        setUserTimezone(userTz);
      } catch (error) {
        console.error('Error loading time format:', error);
        setTimeFormat('24');
        setUserTimezone('Asia/Dhaka');
      }
    };

    loadTimeFormat();
  }, [userDetails]);

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    averageReadTime: 0,
    topCategories: 0,
    todayViews: 0,
    thisMonthPosts: 0,
  });

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 8,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [statsLoading, setStatsLoading] = useState(false);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    blogId: number;
    blogTitle: string;
  }>({
    open: false,
    blogId: 0,
    blogTitle: '',
  });

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    blogId: number;
    currentStatus: string;
  }>({
    open: false,
    blogId: 0,
    currentStatus: '',
  });

  const [selectedBulkAction, setSelectedBulkAction] = useState('');

  const calculateStatusCounts = (blogsData: BlogPost[] | undefined | null) => {
    const counts = {
      published: 0,
      draft: 0,
    };

    if (!Array.isArray(blogsData)) {
      return counts;
    }

    blogsData.forEach((blog) => {
      if (blog.status && counts.hasOwnProperty(blog.status)) {
        counts[blog.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const fetchAllBlogsForCounts = async () => {
    try {
      console.log('Fetching all blogs for status counts from API...');

      const response = await fetch('/api/blogs?limit=1000');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch blogs for counts');
      }

      const allBlogs = result.data?.posts || [];
      const statusCounts = calculateStatusCounts(allBlogs);

      console.log('Calculated status counts from API:', statusCounts);

      setStats((prev) => ({
        ...prev,
        publishedBlogs: statusCounts.published,
        draftBlogs: statusCounts.draft,
        totalBlogs: allBlogs.length,
      }));
    } catch (error) {
      console.error('Error fetching blogs for counts:', error);

      setStats((prev) => ({
        ...prev,
        publishedBlogs: 0,
        draftBlogs: 0,
        totalBlogs: 0,
      }));
    }
  };

  const fetchBlogs = async () => {
    try {
      setBlogsLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/blogs?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch blogs');
      }

      console.log('Blogs fetched successfully from API');

      setBlogs(result.data?.posts || []);
      setPagination(prev => ({
        ...prev,
        total: result.data?.pagination?.totalCount || 0,
        totalPages: result.data?.pagination?.totalPages || 0,
        hasNext: result.data?.pagination?.hasNext || false,
        hasPrev: result.data?.pagination?.hasPrev || false,
      }));
    } catch (error) {
      console.error('Error fetching blogs:', error);
      showToast('Error fetching blogs. Please try again.', 'error');

      setBlogs([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      }));
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('Loading stats from API...');

      const response = await fetch('/api/blogs/stats');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch stats');
      }

      console.log('Stats loaded successfully:', result.data);

      setStats(result.data);
    } catch (error) {
      console.error('Error fetching stats:', error);

      setStats({
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        averageReadTime: 0,
        topCategories: 0,
        todayViews: 0,
        thisMonthPosts: 0,
      });
      showToast('Error fetching statistics. Please try again.', 'error');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBlogs();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchBlogs();
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    setStatsLoading(true);

    const loadData = async () => {
      await Promise.all([fetchStats(), fetchAllBlogsForCounts()]);
      setStatsLoading(false);
    };

    loadData();
  }, []);


  useEffect(() => {
    if (pagination.total > 0) {
      setStats((prev) => ({
        ...prev,
        totalBlogs: pagination.total,
      }));
    }
  }, [pagination.total]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleNewBlogPost = () => {
    router.push('blogs/new-post');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <FaCheckCircle className="h-3 w-3 text-green-500" />;
      case 'draft':
        return <FaEdit className="h-3 w-3 text-gray-500" />;
      default:
        return <FaClock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'draft':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string | Date): string => {
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

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });
  };

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
        timeZone: userTimezone,
      });
    } else {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: userTimezone,
      });
    }
  };

  const handleSelectAll = () => {
    const selectableBlogs = Array.isArray(blogs) ? blogs : [];

    const selectableIds = selectableBlogs.map((blog) => 
      blog.id.toString()
    );

    if (
      selectedBlogs.length === selectableIds.length &&
      selectableIds.length > 0
    ) {
      setSelectedBlogs([]);
    } else {
      setSelectedBlogs(selectableIds);
    }
  };

  const handleSelectBlog = (blogId: string) => {
    setSelectedBlogs((prev) =>
      prev.includes(blogId)
        ? prev.filter((id) => id !== blogId)
        : [...prev, blogId]
    );
  };

  const handleRefresh = async () => {
    setBlogsLoading(true);
    setStatsLoading(true);

    try {
      await Promise.all([
        fetchBlogs(),
        fetchStats(),
        fetchAllBlogsForCounts(),
      ]);
      showToast('Blog data refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Error refreshing data. Please try again.', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId: number) => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete blog');
      }

      showToast('Blog deleted successfully', 'success');
      await Promise.all([
        fetchBlogs(),
        fetchStats(),
        fetchAllBlogsForCounts(),
      ]);
      setDeleteDialog({ open: false, blogId: 0, blogTitle: '' });
    } catch (error) {
      console.error('Error deleting blog:', error);
      showToast(
        error instanceof Error ? error.message : 'Error deleting blog',
        'error'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (
    blogId: number,
    status: string
  ) => {
    try {
      const response = await fetch(`/api/admin/blogs/${blogId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update status');
      }

      showToast('Blog status updated successfully', 'success');
      await Promise.all([
        fetchBlogs(),
        fetchStats(),
        fetchAllBlogsForCounts(),
      ]);
      setStatusDialog({ open: false, blogId: 0, currentStatus: '' });

    } catch (error) {
      console.error('Error updating status:', error);
      showToast(
        error instanceof Error ? error.message : 'Error updating status',
        'error'
      );
    }
  };

  const openDeleteDialog = (blogId: number, blogTitle: string) => {
    setDeleteDialog({ open: true, blogId, blogTitle });
  };

  const openStatusDialog = (blogId: number, currentStatus: string) => {
    setStatusDialog({ open: true, blogId, currentStatus });
  };

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
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap w-full md:w-auto items-center gap-2">
              <select
                value={pagination.limit}
                onChange={(e) =>
                  setPagination((prev) => ({
                    ...prev,
                    limit:
                      e.target.value === 'all'
                        ? 1000
                        : parseInt(e.target.value),
                    page: 1,
                  }))
                }
                className="pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={blogsLoading || statsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={
                    blogsLoading || statsLoading ? 'animate-spin' : ''
                  }
                />
                Refresh
              </button>

              <button
                onClick={handleNewBlogPost}
                className="btn btn-primary flex items-center gap-2 w-full md:w-auto px-3 py-2.5"
              >
                <FaPlus />
                New Blog Post
              </button>
            </div>
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <FaSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400"
                />
                <input
                  type="text"
                  placeholder={`Search ${
                    statusFilter === 'all' ? 'all' : statusFilter
                  } blogs...`}
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
            <div className="mb-4">
              <div className="block space-y-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'all'
                      ? 'bg-gradient-to-r from-purple-700 to-purple-500 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'all'
                        ? 'bg-white/20'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {stats.totalBlogs}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('published')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'published'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Published
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'published'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {stats.publishedBlogs}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('draft')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'draft'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Draft
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'draft'
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {stats.draftBlogs}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px' }}>
            {selectedBlogs.length > 0 && (
              <div className="flex flex-wrap md:flex-nowrap items-start gap-2">
                <div className="flex items-center gap-2 mb-2 md:mb-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedBlogs.length} selected
                  </span>
                  <select
                    className="w-full md:w-auto pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
                    value={selectedBulkAction}
                    onChange={(e) => {
                      setSelectedBulkAction(e.target.value);
                    }}
                  >
                    <option value="" disabled>
                      Bulk Actions
                    </option>
                    <option value="publish">Publish Selected</option>
                    <option value="draft">Move to Draft</option>
                    <option value="delete">Delete Selected</option>
                  </select>
                </div>

                {selectedBulkAction && (
                  <button
                    onClick={async () => {
                      if (selectedBulkAction === 'publish') {
                        try {
                          const response = await fetch('/api/blogs/bulk', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              operation: 'publish',
                              blogIds: selectedBlogs,
                            }),
                          });

                          const data = await response.json();

                          if (response.ok && data.success) {
                            showToast(data.message, 'success');
                            await fetchBlogs();
                            await fetchStats();
                          } else {
                            showToast(data.error || 'Failed to publish blogs', 'error');
                          }
                        } catch (error) {
                          console.error('Error publishing blogs:', error);
                          showToast('Failed to publish blogs', 'error');
                        }
                      } else if (selectedBulkAction === 'draft') {
                        try {
                          const response = await fetch('/api/blogs/bulk', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              operation: 'draft',
                              blogIds: selectedBlogs,
                            }),
                          });

                          const data = await response.json();

                          if (response.ok && data.success) {
                            showToast(data.message, 'success');
                            await fetchBlogs();
                            await fetchStats();
                          } else {
                            showToast(data.error || 'Failed to move blogs to draft', 'error');
                          }
                        } catch (error) {
                          console.error('Error moving blogs to draft:', error);
                          showToast('Failed to move blogs to draft', 'error');
                        }
                      } else if (selectedBulkAction === 'delete') {

                        const confirmed = window.confirm(
                          `Are you sure you want to delete ${selectedBlogs.length} selected blog(s)? This action cannot be undone.`
                        );

                        if (confirmed) {
                          try {
                            const response = await fetch('/api/blogs/bulk', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                operation: 'delete',
                                blogIds: selectedBlogs,
                              }),
                            });

                            const data = await response.json();

                            if (response.ok && data.success) {
                              showToast(data.message, 'success');
                              await fetchBlogs();
                              await fetchStats();
                            } else {
                              showToast(data.error || 'Failed to delete blogs', 'error');
                            }
                          } catch (error) {
                            console.error('Error deleting blogs:', error);
                            showToast('Failed to delete blogs', 'error');
                          }
                        }
                      }

                      setSelectedBulkAction('');
                      setSelectedBlogs([]);
                    }}
                    className="btn btn-primary px-3 py-2.5 w-full md:w-auto"
                  >
                    Apply Action
                  </button>
                )}
              </div>
            )}

            {blogsLoading ? (
              <div className="min-h-[600px]">
                <BlogsTableSkeleton />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12">
                <FaNewspaper className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300">
                  No blogs found.
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No blogs match your current filters or no blogs exist yet.
                </p>
              </div>
            ) : (
              <BlogsTable
                blogs={blogs}
                pagination={pagination}
                selectedBlogs={selectedBlogs}
                blogsLoading={blogsLoading}
                formatID={formatID}
                formatNumber={formatNumber}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                onSelectAll={handleSelectAll}
                onSelectBlog={handleSelectBlog}
                onViewBlog={(slug) => window.open(`/blog/${slug}`, '_blank')}
                onEditBlog={(blogId) => router.push(`/admin/blogs/${blogId}`)}
                onChangeStatus={(blogId, currentStatus) => openStatusDialog(blogId, currentStatus)}
                onDeleteBlog={(blogId, blogTitle) => openDeleteDialog(blogId, blogTitle)}
                onPageChange={(page) =>
                  setPagination((prev) => ({
                    ...prev,
                    page,
                  }))
                }
              />
            )}
            <DeleteBlogModal
              isOpen={deleteDialog.open}
              onClose={() => {
                setDeleteDialog({
                  open: false,
                  blogId: 0,
                  blogTitle: '',
                });
              }}
              onConfirm={() => handleDeleteBlog(deleteDialog.blogId)}
              blogTitle={deleteDialog.blogTitle}
              isLoading={deleteLoading}
            />
            <ChangeBlogStatusModal
              isOpen={statusDialog.open}
              onClose={() => {
                setStatusDialog({ 
                  open: false, 
                  blogId: 0, 
                  currentStatus: '' 
                });
              }}
              onConfirm={(status) => handleStatusChange(statusDialog.blogId, status)}
              currentStatus={statusDialog.currentStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogsPage;