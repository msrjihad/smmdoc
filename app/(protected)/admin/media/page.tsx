'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  FaCheckCircle,
  FaChevronRight,
  FaCopy,
  FaFile,
  FaFilePdf,
  FaFolderOpen,
  FaImages,
  FaPlus,
  FaSearch,
  FaSync,
  FaTimes,
  FaTrash,
  FaUpload,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';

const MediaAttachModal = dynamic(
  () => import('@/components/media/media-attach-modal'),
  { ssr: false }
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

type MediaItem =
  | { type: 'folder'; path: string; name: string }
  | { type: 'file'; url: string; name: string; path: string; size: number; mimeType: string };

const PAGE_SIZE = 30;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MediaPage = () => {
  const { appName } = useAppNameWithFallback();
  const [currentPath, setCurrentPath] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'folders' | 'images' | 'documents'>('all');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showMediaAttachModal, setShowMediaAttachModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  useEffect(() => {
    setPageTitle('Media', appName);
  }, [appName]);

  const fetchMedia = useCallback(async (path: string = '') => {
    try {
      setLoading(true);
      const url = path ? `/api/admin/media?path=${encodeURIComponent(path)}` : '/api/admin/media';
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setMediaItems(data.data);
      } else {
        setToast({ message: data.error || 'Failed to load media', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      setToast({ message: 'Error loading media', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia(currentPath);
  }, [currentPath, fetchMedia]);

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
    setSearchInput('');
  };

  const breadcrumbParts = currentPath ? ['', ...currentPath.split('/').filter(Boolean)] : [''];

  useEffect(() => {
    const term = searchInput.toLowerCase().trim();
    let filtered = mediaItems;
    if (term) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.path.toLowerCase().includes(term)
      );
    }
    if (mediaFilter !== 'all') {
      filtered = filtered.filter((item) => {
        if (mediaFilter === 'folders') return item.type === 'folder';
        if (mediaFilter === 'images') return item.type === 'file' && item.mimeType.startsWith('image/');
        if (mediaFilter === 'documents') return item.type === 'file' && item.mimeType === 'application/pdf';
        return true;
      });
    }
    setFilteredItems(filtered);
    setVisibleCount(PAGE_SIZE);
  }, [mediaItems, searchInput, mediaFilter]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || filteredItems.length <= PAGE_SIZE || visibleCount >= filteredItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
        }
      },
      { rootMargin: '100px', threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredItems.length, visibleCount]);

  const displayedItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  const filterCounts = {
    all: mediaItems.length,
    folders: mediaItems.filter((i) => i.type === 'folder').length,
    images: mediaItems.filter((i) => i.type === 'file' && i.mimeType.startsWith('image/')).length,
    documents: mediaItems.filter((i) => i.type === 'file' && i.mimeType === 'application/pdf').length,
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyUrl = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('URL copied to clipboard', 'success');
    });
  };

  const copyFolderPath = (folderPath: string) => {
    const fullUrl = `${window.location.origin}/${folderPath}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      showToast('Folder path copied to clipboard', 'success');
    });
  };

  const handleDeleteMedia = async (item: { url: string; path: string; name: string }) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const response = await fetch('/api/admin/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: item.url }),
      });
      const data = await response.json();
      if (data.success) {
        setMediaItems((prev) => prev.filter((i) => i.type !== 'file' || i.url !== item.url));
        showToast('Media deleted successfully', 'success');
      } else {
        showToast(data.error || 'Failed to delete media', 'error');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      showToast('Error deleting media', 'error');
    }
  };

  const isImage = (mimeType: string) =>
    mimeType.startsWith('image/');

  const MediaGridSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700/50 animate-pulse"
        >
          <div className="w-full h-full gradient-shimmer" />
        </div>
      ))}
    </div>
  );

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="btn btn-primary flex items-center gap-2 px-4 py-2.5"
                onClick={() => fetchMedia(currentPath)}
                disabled={loading}
              >
                <FaSync className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                className="btn btn-primary flex items-center gap-2 px-4 py-2.5"
                onClick={() => setShowMediaAttachModal(true)}
              >
                <FaUpload className="h-4 w-4" />
                Upload
              </button>
              <select
                value={mediaFilter}
                onChange={(e) => setMediaFilter(e.target.value as 'all' | 'folders' | 'images' | 'documents')}
                className="h-[42px] pl-4 pr-8 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
              >
                <option value="all">All ({filterCounts.all})</option>
                <option value="folders">Folders ({filterCounts.folders})</option>
                <option value="images">Images ({filterCounts.images})</option>
                <option value="documents">Documents ({filterCounts.documents})</option>
              </select>
            </div>
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search media..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ padding: '24px 24px 0 24px' }}>
            <div className="mb-4 flex flex-col gap-3">
              {breadcrumbParts.length > 1 && (
                <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  {breadcrumbParts.map((part, i) => {
                    const pathUpToHere = breadcrumbParts.slice(1, i + 1).join('/');
                    const isLast = i === breadcrumbParts.length - 1;
                    return (
                      <span key={i} className="flex items-center gap-2">
                        {i > 0 && <FaChevronRight className="h-3 w-3 text-gray-400" />}
                        <button
                          onClick={() => {
                            if (!isLast) {
                              setCurrentPath(pathUpToHere);
                              setSearchInput('');
                            }
                          }}
                          className={`hover:text-[var(--primary)] dark:hover:text-[var(--secondary)] transition-colors ${
                            isLast ? 'font-medium text-gray-900 dark:text-gray-100 cursor-default' : ''
                          }`}
                        >
                          {i === 0 ? 'Public' : part}
                        </button>
                      </span>
                    );
                  })}
                </nav>
              )}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {currentPath ? `${currentPath.split('/').pop() || 'Folder'}` : 'Public'} ({filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'})
                </h2>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {loading ? (
              <MediaGridSkeleton />
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg">
                <FaImages className="h-16 w-16 text-gray-300 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {mediaItems.length === 0 ? 'No media found' : 'No matching media'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                  {mediaItems.length === 0
                    ? 'No media files or folders found in the public folder.'
                    : 'Try a different search term.'}
                </p>
                {mediaItems.length === 0 && (
                  <button
                    className="btn btn-primary flex items-center gap-2 px-4 py-2.5"
                    onClick={() => setShowMediaAttachModal(true)}
                  >
                    <FaPlus className="h-4 w-4" />
                    Add Media
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
                  {displayedItems.map((item) =>
                  item.type === 'folder' ? (
                    <button
                      key={`folder-${item.path}`}
                      type="button"
                      onClick={() => navigateToFolder(item.path)}
                      className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-[var(--primary)] dark:hover:border-[var(--secondary)] transition-all duration-200 text-left w-full"
                    >
                      <div className="aspect-square relative bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                        <FaFolderOpen className="h-16 w-16 text-amber-500 dark:text-amber-400" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              copyFolderPath(item.path);
                            }}
                            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
                            title="Copy folder path"
                          >
                            <FaCopy className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                      <div className="p-2 truncate" title={item.name}>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Folder
                        </p>
                      </div>
                    </button>
                  ) : (
                    <div
                      key={item.url}
                      className="group relative bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:border-[var(--primary)] dark:hover:border-[var(--secondary)] transition-all duration-200"
                    >
                      <div className="aspect-square relative bg-gray-100 dark:bg-gray-700/50">
                        {isImage(item.mimeType) ? (
                          <Image
                            src={item.url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16.67vw, (max-width: 1536px) 12.5vw, 10vw"
                            unoptimized={item.mimeType === 'image/svg+xml'}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.mimeType === 'application/pdf' ? (
                              <FaFilePdf className="h-16 w-16 text-red-500 dark:text-red-400" />
                            ) : (
                              <FaFile className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                            )}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => copyUrl(item.url)}
                            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors"
                            title="Copy URL"
                          >
                            <FaCopy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedia(item)}
                            className="p-2 rounded-lg bg-white/90 dark:bg-gray-800/90 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="p-2 truncate" title={item.name}>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(item.size)}
                        </p>
                      </div>
                    </div>
                  )
                  )}
                </div>
                {hasMore && (
                  <div
                    ref={loadMoreRef}
                    className="flex justify-center py-8"
                  >
                    <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <MediaAttachModal
        isOpen={showMediaAttachModal}
        onClose={() => setShowMediaAttachModal(false)}
        currentPath={currentPath}
        showTabs={false}
        onUploadSuccess={() => {
          fetchMedia(currentPath);
          showToast('Media uploaded successfully', 'success');
        }}
      />
    </div>
  );
};

export default MediaPage;
