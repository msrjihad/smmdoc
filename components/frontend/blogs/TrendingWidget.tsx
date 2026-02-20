'use client';

import React, { useEffect, useState } from 'react';
import { logger } from '@/lib/utils/logger';
import { FaChartLine, FaEye } from 'react-icons/fa';

interface TrendingPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  views: number;
  author: {
    id: string;
    name: string;
    image?: string;
  };
}

const TrendingWidget: React.FC = () => {
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setError(null);
        const response = await fetch('/api/blogs/trending');

        if (!response.ok) {
          throw new Error('Failed to fetch trending posts');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setTrendingPosts(data.data);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        logger.error('Error fetching trending posts', error);
        setError('Failed to load trending posts');
        setTrendingPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 dark:from-[var(--primary)]/10 dark:to-[var(--secondary)]/10 rounded-2xl p-6 mb-6 border border-[var(--primary)]/20 dark:border-[var(--secondary)]/20">
        <div className="flex items-center mb-4">
          <FaChartLine className="w-5 h-5 text-[var(--primary)] dark:text-[var(--secondary)] mr-2" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
            Trending Now
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || trendingPosts.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 dark:from-[var(--primary)]/10 dark:to-[var(--secondary)]/10 rounded-2xl p-6 mb-6 border border-[var(--primary)]/20 dark:border-[var(--secondary)]/20">
        <div className="flex items-center mb-4">
          <FaChartLine className="w-5 h-5 text-[var(--primary)] dark:text-[var(--secondary)] mr-2" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
            Trending Now
          </h3>
        </div>
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No trending posts available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 dark:from-[var(--primary)]/10 dark:to-[var(--secondary)]/10 rounded-2xl p-6 mb-6 border border-[var(--primary)]/20 dark:border-[var(--secondary)]/20">
      <div className="flex items-center mb-4">
        <FaChartLine className="w-5 h-5 text-[var(--primary)] dark:text-[var(--secondary)] mr-2" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
          Trending Now
        </h3>
      </div>
      <div className="space-y-3">
        {trendingPosts.map((post, index) => (
          <a key={post.id} href={`/blog/${post.slug}`}>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-[var(--primary)]/30 dark:hover:border-[var(--secondary)]/30 transition-all duration-200 cursor-pointer group">
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white transition-colors duration-200 group-hover:text-[var(--primary)] dark:group-hover:text-[var(--secondary)] line-clamp-2 flex-1 mr-2">
                  {post.title}
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                  <FaEye className="w-3 h-3" />
                  {post.views}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200 line-clamp-2">
                {post.excerpt || 'Read this trending article to stay updated with the latest insights.'}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  by {post.author.name}
                </span>
                <span className="text-xs font-medium text-[var(--primary)] dark:text-[var(--secondary)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  #{index + 1} Trending
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TrendingWidget;