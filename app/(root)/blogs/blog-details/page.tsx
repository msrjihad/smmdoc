'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import {
    FaArrowRight,
    FaCalendarAlt,
    FaChartLine,
    FaClock,
    FaEnvelope,
    FaEye,
    FaFacebookF,
    FaLinkedinIn,
    FaSearch,
    FaShare,
    FaTag,
    FaTwitter,
    FaUser
} from 'react-icons/fa';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  status: string;
  views: number;
  readingTime?: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
}

interface BlogPostDetailClientProps {
  post: BlogPost;
}

const SearchBar: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BlogPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchBlogs = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`/api/blogs/search?term=${encodeURIComponent(searchTerm)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSearchResults(data.data || []);
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchBlogs, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-lg dark:shadow-black/20 p-6 mb-6 transition-colors duration-200">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
        Search
      </h3>
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all duration-200"
        />

        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {searchResults.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                  {post.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        )}

        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Searching...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RecentPosts: React.FC = () => {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPosts = async () => {
      try {
        const response = await fetch('/api/blogs?limit=3&sort=recent');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {

            const posts = Array.isArray(data.data) ? data.data : (data.data?.posts || []);
            setRecentPosts(posts);
          }
        }
      } catch (error) {
        console.error('Error fetching recent posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPosts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-lg dark:shadow-black/20 p-6 mb-6 transition-colors duration-200">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
          Recent Posts
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-lg dark:shadow-black/20 p-6 mb-6 transition-colors duration-200">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
        Recent Posts
      </h3>
      <div className="space-y-4">
        {recentPosts.map((post) => (
          <a key={post.id} href={`/blog/${post.slug}`} className="block group">
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <Image
                   src={post.featuredImage || '/placeholder.png'}
                   alt={post.title}
                   width={80}
                   height={60}
                   className="rounded-lg object-cover"
                    style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                 />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[var(--primary)] dark:group-hover:text-[var(--secondary)] transition-colors duration-200 line-clamp-2">
                  {post.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <FaCalendarAlt className="w-3 h-3 mr-1" />
                  <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <FaClock className="w-3 h-3 mr-1" />
                  <span>{post.readingTime || 5} min read</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const Categories: React.FC = () => {
  return null;
};

const PopularTags: React.FC = () => {
  return null;
};

const TrendingWidget: React.FC = () => {
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/blogs/trending');
        if (!response.ok) {
          throw new Error('Failed to fetch trending posts');
        }
        const data = await response.json();
        setTrendingPosts(data.posts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingPosts();
  }, []);

  return (
    <div className="bg-gradient-to-br from-[var(--primary)]/5 to-[var(--secondary)]/5 dark:from-[var(--primary)]/10 dark:to-[var(--secondary)]/10 rounded-2xl p-6 mb-6 border border-[var(--primary)]/20 dark:border-[var(--secondary)]/20">
      <div className="flex items-center mb-4">
        <FaChartLine className="w-5 h-5 text-[var(--primary)] dark:text-[var(--secondary)] mr-2" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors duration-200">
          Trending Now
        </h3>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-3 animate-pulse">
              <div className="flex-shrink-0">
                <div className="w-20 h-15 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          {trendingPosts.length > 0 ? (
            trendingPosts.map((post) => (
              <a key={post.id} href={`/blog/${post.slug}`}>
                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 cursor-pointer mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 transition-colors duration-200 line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200 line-clamp-1">
                      {post.excerpt || 'Read more about this trending topic'}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-2">
                      <FaEye className="w-3 h-3 mr-1" />
                      {post.views}
                    </div>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">No trending posts available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SocialShare: React.FC<{ post: BlogPost }> = ({ post }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && event.target && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(post.title)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(post.title);
    const body = encodeURIComponent(`Check out this article: ${post.title}\n\n${post.excerpt || 'Read this insightful article on SMMDOC blog.'}\n\nRead more: ${currentUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors duration-200"
      >
        <FaShare className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-0 transform -translate-y-full -translate-y-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 min-w-[160px] z-10">
          <button
            onClick={shareOnFacebook}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors duration-200"
          >
            <FaFacebookF className="w-4 h-4 mr-3 text-blue-600" />
            Facebook
          </button>

          <button
            onClick={shareOnTwitter}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 dark:hover:text-blue-400 rounded-md transition-colors duration-200"
          >
            <FaTwitter className="w-4 h-4 mr-3 text-blue-500" />
            Twitter
          </button>

          <button
            onClick={shareOnLinkedIn}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 rounded-md transition-colors duration-200"
          >
            <FaLinkedinIn className="w-4 h-4 mr-3 text-blue-700" />
            LinkedIn
          </button>

          <button
            onClick={shareViaEmail}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 rounded-md transition-colors duration-200"
          >
            <FaEnvelope className="w-4 h-4 mr-3 text-gray-600" />
            Email
          </button>
        </div>
      )}
    </div>
  );
};

const BlogPostDetailClient: React.FC<BlogPostDetailClientProps> = ({ post }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0712] transition-colors duration-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-[30px] lg:pt-[6  0px] pb-[120px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {}
          <div className="lg:col-span-2">
            <article className="bg-white dark:bg-gray-800/50 dark:backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-lg dark:shadow-black/20 overflow-hidden transition-colors duration-200">
              {}
              <div className="p-8">
                <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight transition-colors duration-200">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center text-gray-600 dark:text-gray-300 mb-6 gap-4">
                   <div className="flex items-center">
                     <FaCalendarAlt className="w-5 h-5 mr-2 text-[var(--primary)] dark:text-[var(--secondary)]" />
                     <span>{new Date(post.publishedAt).toLocaleDateString('en-US', {
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                     })}</span>
                   </div>
                   <div className="flex items-center">
                     <FaClock className="w-5 h-5 mr-2 text-[var(--primary)] dark:text-[var(--secondary)]" />
                     <span>{post.readingTime || 8} min read</span>
                   </div>
                 </div>

                {}
                {post.featuredImage && (
                  <div className="mb-8">
                    <Image
                       src={post.featuredImage}
                       alt={post.title}
                       width={800}
                       height={450}
                       className="w-full h-[450px] object-cover rounded-lg"
                     />
                  </div>
                )}

                {}
                <div className="prose prose-lg max-w-none">
                  <div 
                    className="text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-200"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {}
                <div className="mt-8 p-6 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-2xl text-white">
                  <h3 className="text-xl font-bold mb-2">
                    Ready to Boost Your Social Media Presence?
                  </h3>
                  <p className="mb-4 text-purple-100">
                    Join thousands of users experiencing explosive growth with our proven SMM services.
                  </p>
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 text-[var(--primary)] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <span>Get Started Today</span>
                    <FaArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </div>

                {}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FaEye className="w-4 h-4" />
                        <span>{post.views} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Share:
                      </span>
                      <SocialShare post={post} />
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <SearchBar />
              <RecentPosts />
              <TrendingWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostDetailClient;