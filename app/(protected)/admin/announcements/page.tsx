'use client';

import React, { useEffect, useState } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaBullhorn,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaUsers,
  FaTimes,
  FaSave,
  FaGripVertical,
  FaEllipsisH,
  FaSync,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { getUserDetails } from '@/lib/actions/getUser';
import { useSelector } from 'react-redux';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (newPage: number) => void;
  isLoading: boolean;
}

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-800"></div>
    </div>
  </div>
);

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

const AnnouncementsSkeleton = () => {
  const rows = Array.from({ length: 5 });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[1200px]">
        <thead className="sticky top-0 bg-white dark:bg-[var(--card-bg)] border-b dark:border-gray-700 z-10">
          <tr>
            <th className="text-left py-3 pl-3 pr-1 text-gray-900 dark:text-gray-100">
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
          {rows.map((_, idx) => (
            <tr key={idx} className="border-t dark:border-gray-700">
              <td className="py-3 pl-3 pr-1">
                <div className="h-4 w-4 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-6 w-12 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-6 w-20 gradient-shimmer rounded-full" />
              </td>
              <td className="p-3">
                <div className="h-4 w-48 gradient-shimmer rounded mb-1" />
                <div className="h-3 w-32 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-4 w-20 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-4 w-24 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-4 w-12 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                <div className="h-3 w-16 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-4 w-20 gradient-shimmer rounded mb-1" />
                <div className="h-3 w-16 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-4 w-16 gradient-shimmer rounded" />
              </td>
              <td className="p-3">
                <div className="h-6 w-20 gradient-shimmer rounded-full" />
              </td>
              <td className="p-3">
                <div className="h-8 w-8 gradient-shimmer rounded-lg" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'critical';
  targetedAudience: 'users' | 'admins' | 'moderators' | 'all';
  startDate: string;
  endDate: string;
  isSticky: boolean;
  buttonEnabled: boolean;
  buttonText: string;
  buttonLink: string;
  visibility: 'dashboard' | 'all_pages';
}

const AnnouncementsPage = () => {
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');
  const [timeFormat, setTimeFormat] = useState<string>('24');

  const getLocalDateTimeString = (timezone: string, date?: Date) => {
    const dateToFormat = date || new Date();
    const dateStr = dateToFormat.toLocaleString('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    const [datePart, timePart] = dateStr.split(', ');
    return `${datePart}T${timePart}`;
  };

  useEffect(() => {
    setPageTitle('Announcements', appName);
  }, [appName]);

  useEffect(() => {
    const loadUserTimezone = async () => {
      try {
        const userData = await getUserDetails();
        if (userData && (userData as any).timezone) {
          setUserTimezone((userData as any).timezone);
        }
        if (userData && (userData as any).timeFormat) {
          setTimeFormat((userData as any).timeFormat);
        }
      } catch (error) {
        console.error('Error loading user timezone:', error);
      }
    };
    loadUserTimezone();
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

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [paginatedAnnouncements, setPaginatedAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  const [draggedAnnouncement, setDraggedAnnouncement] = useState<number | null>(null);
  const [dropTargetAnnouncement, setDropTargetAnnouncement] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    type: 'info',
    targetedAudience: 'users',
    startDate: getLocalDateTimeString('Asia/Dhaka'),
    endDate: '',
    isSticky: false,
    buttonEnabled: false,
    buttonText: '',
    buttonLink: '',
    visibility: 'dashboard',
  });

  useEffect(() => {
    if (userTimezone) {
      setFormData(prev => ({
        ...prev,
        startDate: getLocalDateTimeString(userTimezone),
      }));
    }
  }, [userTimezone]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const response = await fetch('/api/admin/announcements');
      const data = await response.json();
      
      if (data.success) {
        setAnnouncements(data.data);
      } else {
        showToast('Failed to load announcements', 'error');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      showToast('Error loading announcements', 'error');
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    let filtered = announcements.filter(announcement => {
      const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || announcement.status === statusFilter;
      const matchesAudience = audienceFilter === 'all' 
        ? true 
        : audienceFilter === 'users' 
          ? (announcement.targetedAudience === 'users' || announcement.targetedAudience === 'all')
          : announcement.targetedAudience === audienceFilter;

      return matchesSearch && matchesStatus && matchesAudience;
    });

    filtered.sort((a, b) => {
      const aOrder = a.order ?? 0;
      const bOrder = b.order ?? 0;
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      let aValue, bValue;
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'views':
          aValue = a.views;
          bValue = b.views;
          break;
        case 'date':
        default:
          aValue = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : a.createdAt.getTime();
          bValue = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : b.createdAt.getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const sortedFiltered = filtered;
    setFilteredAnnouncements(sortedFiltered);
    
    const total = sortedFiltered.length;
    const totalPages = Math.ceil(total / pagination.limit);
    const currentPage = pagination.page > totalPages && totalPages > 0 ? 1 : pagination.page;
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    
    setPagination(prev => ({
      ...prev,
      page: currentPage,
      total,
      totalPages,
      hasNext,
      hasPrev,
    }));
    
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    setPaginatedAnnouncements(sortedFiltered.slice(startIndex, endIndex));
  }, [announcements, searchTerm, statusFilter, audienceFilter, sortBy, sortOrder, pagination.limit, pagination.page]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      targetedAudience: 'users',
      startDate: getLocalDateTimeString(userTimezone),
      endDate: '',
      isSticky: false,
      buttonEnabled: false,
      buttonText: '',
      buttonLink: '',
      visibility: 'dashboard',
    });
  };

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(prev => [data.data, ...prev]);
        setShowCreateModal(false);
        resetForm();
        showToast('Announcement created successfully!', 'success');
      } else {
        const errorMsg = data.error || 'Error creating announcement';
        console.error('Create announcement error:', data);
        showToast(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Create announcement exception:', error);
      showToast('Error creating announcement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAnnouncement = async () => {
    if (!editingAnnouncement || !formData.title.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/announcements/${editingAnnouncement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(prev => prev.map(ann => 
          ann.id === editingAnnouncement.id ? data.data : ann
        ));
        setEditingAnnouncement(null);
        resetForm();
        showToast('Announcement updated successfully!', 'success');
      } else {
        showToast(data.error || 'Error updating announcement', 'error');
      }
    } catch (error) {
      showToast('Error updating announcement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(prev => prev.filter(ann => ann.id !== id));
        setShowDeleteConfirm(null);
        showToast('Announcement deleted successfully!', 'success');
      } else {
        showToast(data.error || 'Error deleting announcement', 'error');
      }
    } catch (error) {
      showToast('Error deleting announcement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'expired' : 'active';

    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncements(prev => prev.map(ann => 
          ann.id === id ? data.data : ann
        ));
        showToast(`Announcement ${newStatus === 'active' ? 'activated' : 'expired'}`, 'success');
      } else {
        showToast(data.error || 'Error updating announcement status', 'error');
      }
    } catch (error) {
      showToast('Error updating announcement status', 'error');
    }
  };

  const handleDragStart = (e: React.DragEvent, announcementId: number) => {
    setDraggedAnnouncement(announcementId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', announcementId.toString());

    const target = e.currentTarget as HTMLElement;
    target.classList.add('dragging');
  };

  const handleDragOver = (e: React.DragEvent, targetAnnouncementId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (!draggedAnnouncement || draggedAnnouncement === targetAnnouncementId) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';

    setDropTargetAnnouncement(targetAnnouncementId);
    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDropTargetAnnouncement(null);
      setDropPosition(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetAnnouncementId: number) => {
    e.preventDefault();

    if (!draggedAnnouncement || draggedAnnouncement === targetAnnouncementId || !dropPosition) {
      setDraggedAnnouncement(null);
      setDropTargetAnnouncement(null);
      setDropPosition(null);
      return;
    }

    const currentOrder = [...announcements];
    const draggedIndex = currentOrder.findIndex(ann => ann.id === draggedAnnouncement);
    const targetIndex = currentOrder.findIndex(ann => ann.id === targetAnnouncementId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedAnnouncement(null);
      setDropTargetAnnouncement(null);
      setDropPosition(null);
      return;
    }

    const [draggedItem] = currentOrder.splice(draggedIndex, 1);

    let finalIndex = targetIndex;
    if (draggedIndex < targetIndex) {
      finalIndex = targetIndex - 1;
    }

    if (dropPosition === 'after') {
      finalIndex += 1;
    }

    currentOrder.splice(finalIndex, 0, draggedItem);

    const reorderedWithNewOrder = currentOrder.map((ann, index) => ({
      ...ann,
      order: index,
    }));

    setAnnouncements(reorderedWithNewOrder);

    const announcementIds = currentOrder.map(ann => ann.id);
    
    try {
      const response = await fetch('/api/admin/announcements/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: announcementIds }),
      });

      const data = await response.json();
      if (!data.success) {
        showToast('Failed to save order', 'error');
        const fetchResponse = await fetch('/api/admin/announcements');
        const fetchData = await fetchResponse.json();
        if (fetchData.success) {
          setAnnouncements(fetchData.data);
        }
      }
    } catch (error) {
      showToast('Error saving order', 'error');
      const fetchResponse = await fetch('/api/admin/announcements');
      const fetchData = await fetchResponse.json();
      if (fetchData.success) {
        setAnnouncements(fetchData.data);
      }
    }

    setDraggedAnnouncement(null);
    setDropTargetAnnouncement(null);
    setDropPosition(null);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('dragging');
    setDraggedAnnouncement(null);
    setDropTargetAnnouncement(null);
    setDropPosition(null);
  };

  const startEditing = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    const startDateObj = typeof announcement.startDate === 'string' 
      ? new Date(announcement.startDate)
      : announcement.startDate;
    const endDateObj = announcement.endDate 
      ? (typeof announcement.endDate === 'string' 
          ? new Date(announcement.endDate)
          : announcement.endDate)
      : null;
    
    const startDate = getLocalDateTimeString(userTimezone, startDateObj);
    const endDate = endDateObj ? getLocalDateTimeString(userTimezone, endDateObj) : '';
    
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      targetedAudience: announcement.targetedAudience,
      startDate,
      endDate,
      isSticky: announcement.isSticky,
      buttonEnabled: announcement.buttonEnabled,
      buttonText: announcement.buttonText || '',
      buttonLink: announcement.buttonLink || '',
      visibility: (announcement as any).visibility || 'dashboard',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle className="h-4 w-4" />;
      case 'success': return <FaCheckCircle className="h-4 w-4" />;
      case 'critical': return <FaExclamationTriangle className="h-4 w-4" />;
      default: return <FaInfoCircle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'success': return 'text-green-600 bg-green-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30';
      case 'scheduled': return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30';
      case 'expired': return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800';
      default: return 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30';
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-800';
      case 'success':
        return 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-800';
      case 'critical':
        return 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-800';
      default:
        return 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-800';
    }
  };

  const AnnouncementActions = ({ announcement }: { announcement: Announcement }) => {
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
                  handleToggleStatus(announcement.id, announcement.status);
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
                      startEditing(announcement);
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
                  setShowDeleteConfirm(announcement.id);
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
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAnnouncements}
                disabled={announcementsLoading}
                className="btn btn-primary flex items-center gap-2 px-3 py-2.5"
              >
                <FaSync
                  className={announcementsLoading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
              <div className="min-w-0">
                <select
                  value={audienceFilter}
                  onChange={(e) => setAudienceFilter(e.target.value)}
                  className="form-field w-full pl-4 pr-10 py-2.5 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="users">Users</option>
                  <option value="admins">Admins</option>
                  <option value="moderators">Moderators</option>
                </select>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="btn btn-primary flex items-center gap-2 px-4 py-2.5"
              >
                <FaPlus className="h-4 w-4" />
                Create Announcement
              </button>
            </div>
            <div className="flex flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search announcements..."
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
                    {announcements.length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'active'
                      ? 'bg-gradient-to-r from-green-600 to-green-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Active
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'active'
                        ? 'bg-white/20'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}
                  >
                    {announcements.filter(a => a.status === 'active').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('scheduled')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'scheduled'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Scheduled
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'scheduled'
                        ? 'bg-white/20'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {announcements.filter(a => a.status === 'scheduled').length}
                  </span>
                </button>
                <button
                  onClick={() => setStatusFilter('expired')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 mr-2 mb-2 ${
                    statusFilter === 'expired'
                      ? 'bg-gradient-to-r from-gray-600 to-gray-400 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Expired
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      statusFilter === 'expired'
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {announcements.filter(a => a.status === 'expired').length}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px 24px' }}>
            {announcementsLoading ? (
              <AnnouncementsSkeleton />
            ) : filteredAnnouncements.length === 0 ? (
              <div className="text-center py-12">
                <FaBullhorn className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-300">
                  No announcements found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {announcements.length === 0 
                    ? "You haven't created any announcements yet."
                    : "No announcements match your current filters."
                  }
                </p>
                {announcements.length === 0 && (
                  <button
                    onClick={() => {
                      resetForm();
                      setShowCreateModal(true);
                    }}
                    className="btn btn-primary mt-4"
                  >
                    Create Your First Announcement
                  </button>
                )}
              </div>
            ) : (
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
                  {paginatedAnnouncements.map((announcement, index) => (
                    <React.Fragment key={announcement.id}>
                      {draggedAnnouncement && draggedAnnouncement !== announcement.id && (
                        <tr
                          className={`transition-all duration-200 ${
                            dropTargetAnnouncement === announcement.id && dropPosition === 'before'
                              ? 'h-2 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                              : 'h-0'
                          }`}
                          onDragOver={(e) => handleDragOver(e, announcement.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, announcement.id)}
                        >
                          <td colSpan={12}></td>
                        </tr>
                      )}
                      <tr
                        className={`border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[var(--card-bg)] transition-colors duration-200 ${
                          draggedAnnouncement === announcement.id ? 'opacity-50' : ''
                        } ${announcement.isSticky ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                        onDragOver={(e) => handleDragOver(e, announcement.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, announcement.id)}
                      >
                        <td className="py-3 pl-3 pr-1">
                          <div
                            className="cursor-move"
                            title="Drag to reorder announcement"
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, announcement.id)}
                            onDragEnd={handleDragEnd}
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
                          <AnnouncementActions announcement={announcement} />
                        </td>
                      </tr>
                      {draggedAnnouncement && draggedAnnouncement !== announcement.id && (
                        <tr
                          className={`transition-all duration-200 ${
                            dropTargetAnnouncement === announcement.id && dropPosition === 'after'
                              ? 'h-2 bg-blue-100 dark:bg-blue-900/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                              : 'h-0'
                          }`}
                          onDragOver={(e) => handleDragOver(e, announcement.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, announcement.id)}
                        >
                          <td colSpan={12}></td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
                </div>
                <Pagination
                  pagination={pagination}
                  onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
                  isLoading={announcementsLoading}
                />
              </>
            )}
          </div>
        </div>
      </div>
      {(showCreateModal || editingAnnouncement) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAnnouncement(null);
                    resetForm();
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    placeholder="Enter announcement title..."
                  />
                </div>

                <div>
                  <label className="form-label mb-2">Content (Optional)</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
                    placeholder="Enter announcement content..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label mb-2">Targeted Audience</label>
                    <select
                      value={formData.targetedAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetedAudience: e.target.value as any }))}
                      className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                    >
                      <option value="users">Users</option>
                      <option value="admins">Admins</option>
                      <option value="moderators">Moderators</option>
                    </select>
                  </div>
                </div>

                {editingAnnouncement && editingAnnouncement.status === 'active' ? (
                  <div>
                    <label className="form-label mb-2">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label mb-2">Start Date</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="form-label mb-2">End Date (Optional)</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label mb-2">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as 'dashboard' | 'all_pages' }))}
                    className="form-field w-full pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer"
                  >
                    <option value="dashboard">Dashboard</option>
                    <option value="all_pages">All Pages</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      checked={formData.buttonEnabled}
                      onChange={(e) => setFormData(prev => ({ ...prev, buttonEnabled: e.target.checked }))}
                      className="w-4 h-4 text-[var(--primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="form-label">Enable Action Button</span>
                  </label>

                  {formData.buttonEnabled && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-200 dark:border-blue-800">
                      <div>
                        <label className="form-label mb-2">Button Text *</label>
                        <input
                          type="text"
                          value={formData.buttonText}
                          onChange={(e) => setFormData(prev => ({ ...prev, buttonText: e.target.value }))}
                          className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          placeholder="e.g., Learn More, Get Started, Download"
                        />
                      </div>

                      <div>
                        <label className="form-label mb-2">Button Link *</label>
                        <input
                          type="url"
                          value={formData.buttonLink}
                          onChange={(e) => setFormData(prev => ({ ...prev, buttonLink: e.target.value }))}
                          className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                          placeholder="https://example.com or /internal-page"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isSticky}
                      onChange={(e) => setFormData(prev => ({ ...prev, isSticky: e.target.checked }))}
                      className="w-4 h-4 text-[var(--primary)] bg-gray-100 border-gray-300 rounded focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="form-label">Pin this announcement</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Pinned announcements will appear at the top of the list
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAnnouncement(null);
                    resetForm();
                  }}
                  className="btn btn-secondary px-4 py-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={editingAnnouncement ? handleEditAnnouncement : handleCreateAnnouncement}
                  className="btn btn-primary flex items-center gap-2 px-4 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (editingAnnouncement ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <FaTrash className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Delete Announcement</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Are you sure you want to delete this announcement? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="btn btn-secondary px-4 py-2"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteAnnouncement(showDeleteConfirm)}
                  className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <FaTrash className="h-4 w-4" />
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  isLoading,
}) => (
  <div className="flex flex-col md:flex-row items-center justify-between pt-4 pb-0 border-t dark:border-gray-700">
    <div className="text-sm text-gray-600 dark:text-gray-400">
      {isLoading ? (
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
        disabled={!pagination.hasPrev || isLoading}
        className="btn btn-secondary disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {isLoading ? (
          <GradientSpinner size="w-4 h-4" />
        ) : (
          `Page ${pagination.page} of ${pagination.totalPages}`
        )}
      </span>
      <button
        onClick={() =>
          onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
        }
        disabled={!pagination.hasNext || isLoading}
        className="btn btn-secondary disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
);

export default AnnouncementsPage;