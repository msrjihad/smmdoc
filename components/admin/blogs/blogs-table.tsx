'use client';

import React from 'react';
import { FaEye } from 'react-icons/fa';
import { formatID, formatNumber } from '@/lib/utils';
import MoreActionMenu from './more-action-menu';

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

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface BlogsTableProps {
  blogs: BlogPost[];
  pagination: PaginationInfo;
  selectedBlogs: string[];
  blogsLoading: boolean;
  formatID: (id: string) => string;
  formatNumber: (num: number) => string;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getStatusColor: (status: string) => string;
  onSelectAll: () => void;
  onSelectBlog: (blogId: string) => void;
  onViewBlog: (slug: string) => void;
  onEditBlog: (blogId: number) => void;
  onChangeStatus: (blogId: number, currentStatus: string) => void;
  onDeleteBlog: (blogId: number, blogTitle: string) => void;
  onPageChange: (page: number) => void;
}

const BlogsTable: React.FC<BlogsTableProps> = ({
  blogs,
  pagination,
  selectedBlogs,
  blogsLoading,
  formatID,
  formatNumber,
  formatDate,
  formatTime,
  getStatusColor,
  onSelectAll,
  onSelectBlog,
  onViewBlog,
  onEditBlog,
  onChangeStatus,
  onDeleteBlog,
  onPageChange,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1400px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                <input
                  type="checkbox"
                  checked={
                    selectedBlogs.length === blogs.length &&
                    blogs.length > 0
                  }
                  onChange={onSelectAll}
                  className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                />
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Title
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Author
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Published
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Status
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(blogs) ? blogs.map((blog) => (
              <tr
                key={blog.id}
                className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200"
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedBlogs.includes(blog.id.toString())}
                    onChange={() => onSelectBlog(blog.id.toString())}
                    className="rounded border-gray-300 dark:border-gray-600 w-4 h-4"
                  />
                </td>
                <td className="p-3">
                  <div className="font-mono text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded">
                    {formatID(blog.id.toString())}
                  </div>
                </td>
                <td className="p-3">
                  <div className="max-w-xs">
                    <div
                      className="font-medium text-sm truncate text-gray-900 dark:text-gray-100"
                      title={blog.title}
                    >
                      {blog.title}
                    </div>
                    <div
                      className="text-xs truncate mt-1 text-gray-600 dark:text-gray-400"
                      title={blog.excerpt}
                    >
                      {blog.excerpt}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {blog.author?.username || 'unknown'}
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    {blog.status === 'published' && blog.publishedAt && (
                      <>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(blog.publishedAt)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {formatTime(blog.publishedAt)}
                        </div>
                      </>
                    )}
                    {blog.status === 'draft' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Not published
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div 
                    className={`flex items-center gap-1 px-2 py-1 rounded-full w-fit text-xs font-medium ${getStatusColor(blog.status)}`}
                  >
                    <span className="capitalize">
                      {blog.status}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-secondary p-2"
                      title="View Details"
                      onClick={() => onViewBlog(blog.slug)}
                    >
                      <FaEye className="h-3 w-3" />
                    </button>
                    <MoreActionMenu
                      blogId={blog.id}
                      onEdit={() => onEditBlog(blog.id)}
                      onChangeStatus={() => onChangeStatus(blog.id, blog.status)}
                      onDelete={() => onDeleteBlog(blog.id, blog.title)}
                    />
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  No blogs available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-6 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {blogsLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            `Showing ${formatNumber(
              (pagination.page - 1) * pagination.limit + 1
            )} to ${formatNumber(
              Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )
            )} of ${formatNumber(pagination.total)} blogs`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || blogsLoading}
            className="btn btn-secondary"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {blogsLoading ? (
              <div className="h-4 w-24 gradient-shimmer rounded" />
            ) : (
              `Page ${formatNumber(
                pagination.page
              )} of ${formatNumber(pagination.totalPages)}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || blogsLoading}
            className="btn btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default BlogsTable;

