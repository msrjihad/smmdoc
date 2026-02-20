'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { FaFile, FaFilePdf, FaFolder, FaImages, FaTimes, FaUpload } from 'react-icons/fa';

type MediaItem =
  | { type: 'folder'; path: string; name: string }
  | { type: 'file'; url: string; name: string; path: string; size: number; mimeType: string };

interface MediaAttachModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
  onUploadSuccess?: () => void;
  onFilesUploaded?: (fileUrls: string[]) => void;
  accept?: string;
  singleFile?: boolean;
  showTabs?: boolean;
  maxFileSize?: number;
  uploadHint?: string;
  hideUploadPath?: boolean;
}

const ANIMATION_DURATION = 300;

const MediaAttachModal: React.FC<MediaAttachModalProps> = ({
  isOpen,
  onClose,
  currentPath = '',
  onUploadSuccess,
  onFilesUploaded,
  accept,
  singleFile = false,
  showTabs = true,
  maxFileSize,
  uploadHint,
  hideUploadPath = false,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [libraryPath, setLibraryPath] = useState('');
  const [libraryLoading, setLibraryLoading] = useState(false);

  const uploadPath = currentPath === undefined ? 'general' : currentPath;

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      if (showTabs) setLibraryPath(currentPath === undefined ? 'general' : currentPath);
    }
  }, [isOpen, showTabs, currentPath]);

  useEffect(() => {
    if (isOpen && showTabs && activeTab === 'library') {
      const fetchLibrary = async () => {
        setLibraryLoading(true);
        try {
          const url = libraryPath
            ? `/api/admin/media?path=${encodeURIComponent(libraryPath)}`
            : '/api/admin/media';
          const res = await fetch(url);
          const data = await res.json();
          if (data.success) {
            setLibraryItems(data.data);
          }
        } catch (err) {
          console.error('Error fetching media:', err);
        } finally {
          setLibraryLoading(false);
        }
      };
      fetchLibrary();
    }
  }, [isOpen, showTabs, activeTab, libraryPath]);

  const matchesAccept = useCallback(
    (item: MediaItem): boolean => {
      if (!accept || item.type === 'folder') return true;
      if (accept === 'image/*') return item.mimeType?.startsWith('image/');
      if (accept === 'image/png') return item.mimeType === 'image/png';
      return true;
    },
    [accept]
  );

  const fileItems = libraryItems.filter(
    (i) => i.type === 'file' && matchesAccept(i)
  ) as Array<{ type: 'file'; url: string; name: string; path: string; size: number; mimeType: string }>;

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, ANIMATION_DURATION);
  }, [isClosing, onClose]);

  const fileMatchesAccept = useCallback(
    (file: File): boolean => {
      if (!accept) return true;
      if (accept === 'image/*') return file.type.startsWith('image/');
      if (accept === 'image/png') return file.type === 'image/png';
      return true;
    },
    [accept]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      if (accept) {
        const invalidFiles = fileArray.filter((f) => !fileMatchesAccept(f));
        if (invalidFiles.length > 0) {
          setError(accept === 'image/png' ? 'Only PNG images are allowed.' : 'Invalid file type.');
          return;
        }
      }

      if (maxFileSize) {
        const oversizedFiles = fileArray.filter((f) => f.size > maxFileSize);
        if (oversizedFiles.length > 0) {
          const maxMB = Math.floor(maxFileSize / (1024 * 1024));
          setError(`File size too large. Maximum ${maxMB}MB per file.`);
          return;
        }
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('uploadType', 'admin_uploads');
        formData.append('uploadPath', uploadPath);
        fileArray.forEach((file) => formData.append('files', file));

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          const fileUrls = data.fileUrl
            ? [data.fileUrl]
            : (data.files || []).map((f: { fileUrl: string }) => f.fileUrl);
          if (fileUrls.length > 0) {
            onFilesUploaded?.(singleFile ? [fileUrls[0]] : fileUrls);
          }
          onUploadSuccess?.();
          handleClose();
        } else {
          setError(data.error || 'Failed to upload files');
        }
      } catch (err) {
        console.error('Upload error:', err);
        setError('Failed to upload files');
      } finally {
        setIsUploading(false);
      }
    },
    [uploadPath, handleClose, onUploadSuccess, onFilesUploaded, singleFile, accept, fileMatchesAccept, maxFileSize]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (isUploading) return;
      uploadFiles(e.dataTransfer.files);
    },
    [isUploading, uploadFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) {
        uploadFiles(files);
      }
      e.target.value = '';
    },
    [uploadFiles]
  );

  const handleSelectFile = (url: string) => {
    onFilesUploaded?.([url]);
    handleClose();
  };

  const isImage = (mimeType: string) => mimeType?.startsWith('image/');

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${
        isClosing ? 'modal-fade-exit' : 'modal-backdrop-enter'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col ${
          isClosing ? 'modal-fade-exit' : 'modal-fade-enter'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Attach Media
            </h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          {showTabs && (
            <div className="flex gap-2 mb-4 border-b border-[#ddd] dark:border-[#ddd]">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === 'upload'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Upload Media
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${
                  activeTab === 'library'
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Media Library
              </button>
            </div>
          )}

          {(!showTabs || activeTab === 'upload') && (
            <>
              {uploadPath && !hideUploadPath && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Uploading to: <span className="font-medium text-gray-700 dark:text-gray-300">{uploadPath}</span>
                </p>
              )}

              <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            } ${isUploading ? 'pointer-events-none opacity-70' : 'cursor-pointer'}`}
            onClick={() => !isUploading && document.getElementById('media-attach-file-input')?.click()}
          >
            <input
              id="media-attach-file-input"
              type="file"
              multiple={!singleFile}
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
              </div>
            ) : (
              <>
                <FaUpload className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {uploadHint
                    ? uploadHint
                    : accept === 'image/png'
                    ? `PNG images only. Max ${maxFileSize ? Math.floor(maxFileSize / (1024 * 1024)) : 50}MB per file.`
                    : accept === 'image/*'
                    ? `Images only. Max ${maxFileSize ? Math.floor(maxFileSize / (1024 * 1024)) : 50}MB per file.`
                    : `Any file type. Max ${maxFileSize ? Math.floor(maxFileSize / (1024 * 1024)) : 50}MB per file.`}
                </p>
              </>
            )}
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </>
          )}

          {showTabs && activeTab === 'library' && (
            <div className="flex-1 min-h-0 overflow-auto">
              {libraryPath && (
                <button
                  type="button"
                  onClick={() => {
                    const parts = libraryPath.split('/').filter(Boolean);
                    parts.pop();
                    setLibraryPath(parts.join('/'));
                  }}
                  className="text-sm text-[var(--primary)] hover:underline mb-2"
                >
                  ← Back
                </button>
              )}
              {libraryLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                </div>
              ) : fileItems.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <FaImages className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No media files found</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto">
                  {libraryItems
                    .filter((i): i is { type: 'folder' } & MediaItem => i.type === 'folder')
                    .map((item) => (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => setLibraryPath(item.path)}
                        className="flex flex-col items-center p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[var(--primary)] dark:hover:border-[var(--primary)] transition-colors"
                      >
                        <FaFolder className="h-10 w-10 text-amber-500 dark:text-amber-400 mb-1" />
                        <span className="text-xs truncate w-full text-center">{item.name}</span>
                      </button>
                    ))}
                  {fileItems.map((item) => (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => handleSelectFile(item.url)}
                      className="flex flex-col items-center p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-[var(--primary)] dark:hover:border-[var(--primary)] transition-colors"
                    >
                      <div className="w-12 h-12 relative bg-gray-100 dark:bg-gray-700 rounded overflow-hidden mb-1">
                        {isImage(item.mimeType) ? (
                          <Image
                            src={item.url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized={item.mimeType === 'image/svg+xml'}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.mimeType === 'application/pdf' ? (
                              <FaFilePdf className="h-6 w-6 text-red-500" />
                            ) : (
                              <FaFile className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-xs truncate w-full text-center">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaAttachModal;
