'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FaEdit,
  FaEllipsisH,
  FaEye,
  FaEyeSlash,
  FaGripVertical,
  FaTrash,
  FaUsers,
} from 'react-icons/fa';

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  status: 'active' | 'scheduled' | 'expired' | 'draft';
  targetedAudience: 'users' | 'admins' | 'moderators' | 'all';
  startDate: string | Date;
  endDate: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: number;
  views: number;
  isSticky: boolean;
  buttonEnabled: boolean;
  buttonText: string | null;
  buttonLink: string | null;
  visibility?: string;
  order: number;
  user?: {
    id: number;
    username: string | null;
    name: string | null;
    email: string | null;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AnnouncementsTableProps {
  announcements: Announcement[];
  pagination: PaginationInfo;
  announcementsLoading: boolean;
  draggedAnnouncement: number | null;
  dropTargetAnnouncement: number | null;
  dropPosition: 'before' | 'after' | null;
  formatDate: (dateString: string | Date) => string;
  formatTime: (dateString: string | Date) => string;
  getTypeBadgeStyle: (type: string) => string;
  getStatusColor: (status: string) => string;
  onDragStart: (e: React.DragEvent, announcementId: number) => void;
  onDragOver: (e: React.DragEvent, targetAnnouncementId: number) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetAnnouncementId: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onToggleStatus: (id: number, currentStatus: string) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: number) => void;
  onPageChange: (newPage: number) => void;
}

const useClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || !event.target || !(event.target instanceof Node)) {
        return;
      }
      if (ref.current.contains(event.target)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

const AnnouncementActions: React.FC<{
  announcement: Announcement;
  onToggleStatus: (id: number, currentStatus: string) => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: number) => void;
}> = ({ announcement, onToggleStatus, onEdit, onDelete }) => {
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="btn btn-secondary p-2"
        title="More Actions"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaEllipsisH className="h-3 w-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onToggleStatus(announcement.id, announcement.status);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
            >
              {announcement.status === 'active' ? (
                <>
                  <FaEyeSlash className="h-3 w-3" />
                  Deactivate
                </>
              ) : (
                <>
                  <FaEye className="h-3 w-3" />
                  Activate
                </>
              )}
            </button>
            {announcement.status !== 'expired' && (
              <>
                <button
                  onClick={() => {
                    onEdit(announcement);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 flex items-center gap-2"
                >
                  <FaEdit className="h-3 w-3" />
                  Edit
                </button>
                <hr className="my-1 dark:border-gray-700" />
              </>
            )}
            <button
              onClick={() => {
                onDelete(announcement.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
            >
              <FaTrash className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AnnouncementsTable: React.FC<AnnouncementsTableProps> = ({
  announcements,
  pagination,
  announcementsLoading,
  draggedAnnouncement,
  dropTargetAnnouncement,
  dropPosition,
  formatDate,
  formatTime,
  getTypeBadgeStyle,
  getStatusColor,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onToggleStatus,
  onEdit,
  onDelete,
  onPageChange,
}) => {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[1200px]">
          <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
            <tr>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Order
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                ID
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Type
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Title
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Action Button
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Audience
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Views
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Start
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                End
              </th>
              <th className="text-left p-3 font-semibold text-gray-900 dark:text-gray-100">
                Visibility
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
            {announcements.map((announcement) => (
              <React.Fragment key={announcement.id}>
                {draggedAnnouncement && draggedAnnouncement !== announcement.id && (
                  <tr
                    className={`transition-all duration-200 ${
                      dropTargetAnnouncement === announcement.id && dropPosition === 'before'
                        ? 'h-2 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                        : 'h-0'
                    }`}
                    onDragOver={(e) => onDragOver(e, announcement.id)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, announcement.id)}
                  >
                    <td colSpan={12}></td>
                  </tr>
                )}
                <tr
                  className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200 ${
                    draggedAnnouncement === announcement.id ? 'opacity-50' : ''
                  } ${announcement.isSticky ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                  onDragOver={(e) => onDragOver(e, announcement.id)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, announcement.id)}
                >
                  <td className="py-3 pl-3 pr-1">
                    <div
                      className="cursor-move"
                      title="Drag to reorder announcement"
                      draggable={true}
                      onDragStart={(e) => onDragStart(e, announcement.id)}
                      onDragEnd={onDragEnd}
                      style={{
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                      }}
                    >
                      <FaGripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">
                      {announcement.id}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getTypeBadgeStyle(announcement.type)}`}>
                      {announcement.type}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="max-w-xs">
                      <div className="font-medium text-sm flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        {announcement.title}
                        {announcement.isSticky && (
                          <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                            Pinned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    {announcement.buttonEnabled && announcement.buttonText && announcement.buttonLink ? (
                      <a
                        href={announcement.buttonLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {announcement.buttonText}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <FaUsers className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-900 dark:text-gray-100">
                        {(announcement.targetedAudience === 'all' || announcement.targetedAudience === 'users') 
                          ? 'Users' 
                          : announcement.targetedAudience.charAt(0).toUpperCase() + announcement.targetedAudience.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {announcement.views}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="text-xs text-gray-900 dark:text-gray-100">
                      {formatDate(announcement.startDate)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTime(announcement.startDate)}
                    </div>
                  </td>
                  <td className="p-3">
                    {announcement.endDate ? (
                      <>
                        <div className="text-xs text-gray-900 dark:text-gray-100">
                          {formatDate(announcement.endDate)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTime(announcement.endDate)}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-xs capitalize text-gray-900 dark:text-gray-100">
                      {(announcement as any).visibility === 'all_pages' ? 'All Pages' : 'Dashboard'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(announcement.status)}`}>
                      {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3">
                    <AnnouncementActions
                      announcement={announcement}
                      onToggleStatus={onToggleStatus}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
                {draggedAnnouncement && draggedAnnouncement !== announcement.id && (
                  <tr
                    className={`transition-all duration-200 ${
                      dropTargetAnnouncement === announcement.id && dropPosition === 'after'
                        ? 'h-2 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                        : 'h-0'
                    }`}
                    onDragOver={(e) => onDragOver(e, announcement.id)}
                    onDragLeave={onDragLeave}
                    onDrop={(e) => onDrop(e, announcement.id)}
                  >
                    <td colSpan={12}></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-0 border-t dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {announcementsLoading ? (
            <div className="flex items-center gap-2">
              <span>Loading pagination...</span>
            </div>
          ) : (
            `Showing ${(
              (pagination.page - 1) * pagination.limit +
              1
            ).toLocaleString()} to ${Math.min(
              pagination.page * pagination.limit,
              pagination.total
            ).toLocaleString()} of ${pagination.total.toLocaleString()} announcements`
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={!pagination.hasPrev || announcementsLoading}
            className="btn btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {announcementsLoading ? (
              <div className="h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              `Page ${pagination.page} of ${pagination.totalPages}`
            )}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={!pagination.hasNext || announcementsLoading}
            className="btn btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default AnnouncementsTable;

