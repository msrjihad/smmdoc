'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { FaArrowRight } from 'react-icons/fa';
import { GradientSpinner } from '@/components/ui/gradient-spinner';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  featuredImage?: string;
  slug: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SectionProps {
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ children, className = '' }) => (
  <section
    className={`bg-white dark:bg-[#0d0712] transition-colors duration-200 ${
      className || 'pb-[30px]'
    }`}
  >
    <div className="max-w-[1200px] mx-auto px-4">{children}</div>
  </section>
);

const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => (
  <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl dark:shadow-lg dark:shadow-black/20 hover:dark:shadow-purple-500/10 transition-all duration-300 h-full hover:-translate-y-1 group overflow-hidden">
    <div className="relative overflow-hidden">
      <Image
        src={post.featuredImage || '/placeholder.png'}
        alt={post.title}
        width={800}
        height={250}
        className="w-full h-[250px] object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-200">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3 transition-colors duration-200">
        {post.excerpt}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-4 py-2 text-sm rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
      >
        <span>Read more</span>
        <FaArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  </div>
);

const BlogPage: React.FC = () => {
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([]);
  const [visiblePosts, setVisiblePosts] = useState(6);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/blogs?status=published&limit=50');

      if (!response.ok) {
        throw new Error('Failed to fetch blog posts');
      }

      const data = await response.json();

      if (data.success && data.data && data.data.posts) {
        setAllBlogPosts(data.data.posts);
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      logger.error('Frontend: Error fetching blog posts', error);
      setError('Failed to load blog posts');
      setAllBlogPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const displayedPosts = allBlogPosts.slice(0, visiblePosts);
  const hasMorePosts = visiblePosts < allBlogPosts.length;

  const loadMorePosts = () => {

    setTimeout(() => {
      setVisiblePosts((prev) => Math.min(prev + 3, allBlogPosts.length));
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      <Section className="pt-[60px] lg:pt-[120px]">
        <div className="text-center">
          <h4 className="text-2xl font-bold text-[var(--primary)] dark:text-[var(--secondary)] mb-2 transition-colors duration-200">
            Our Blog
          </h4>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight mb-6 transition-colors duration-200">
            Latest Articles on <br />
            <span className="text-[var(--primary)] dark:text-[var(--secondary)] transition-colors duration-200">
              Social Media
            </span>{' '}
            Strategies
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed max-w-4xl mx-auto transition-colors duration-200">
            Welcome to SMMDOC's blog page. Your gateway to the latest insights
            and trends in social media marketing. This resource outlines how we
            share knowledge, provide valuable content, and help you stay ahead
            in the digital marketing landscape with cutting-edge strategies and
            expert guidance.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                {error} - Showing sample content
              </p>
            </div>
          )}
        </div>
      </Section>
      <Section className="pt-[30px]">
        {isLoading ? (
          <div className="card-padding bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <GradientSpinner size="w-16 h-16" className="mb-4" />
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium transition-colors duration-200">
                Loading blog posts...
              </p>
            </div>
          </div>
        ) : allBlogPosts.length === 0 ? (
          <div className="card-padding bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-gray-600 dark:text-gray-300 text-lg font-medium transition-colors duration-200">
                No blog found!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {displayedPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </Section>
      <Section className="pt-0 pb-[120px]">
        {hasMorePosts && allBlogPosts.length > 0 && (
          <div className="text-center">
            <button
              onClick={loadMorePosts}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-semibold px-8 py-4 rounded-lg hover:shadow-lg hover:from-[#4F0FD8] hover:to-[#A121E8] dark:shadow-lg dark:shadow-purple-500/20 hover:dark:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              <span>Load More</span>
            </button>
          </div>
        )}
        {!hasMorePosts && allBlogPosts.length > 6 && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors duration-200">
              You've reached the end of our blog posts. Stay tuned for more
              updates!
            </p>
          </div>
        )}
      </Section>
    </div>
  );
};

export default BlogPage;
