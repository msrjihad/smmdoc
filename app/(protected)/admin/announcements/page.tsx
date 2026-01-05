'use client';

import React, { useEffect, useState } from 'react';
import {
  FaPlus,
  FaSearch,
  FaBullhorn,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaTimes,
  FaSync,
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import { getUserDetails } from '@/lib/actions/getUser';
import { useSelector } from 'react-redux';
import AnnouncementsTable from '@/components/admin/announcements/announcements-table';
import CreateNewAnnouncementModal from '@/components/admin/announcements/modals/create-new-announcement';
import EditAnnouncementModal from '@/components/admin/announcements/modals/edit-announcement';
import DeleteAnnouncementModal from '@/components/admin/announcements/modals/delete-announcement';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}


const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-800"></div>
    </div>
  </div>
);


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
              <AnnouncementsTable
                announcements={paginatedAnnouncements}
                pagination={pagination}
                announcementsLoading={announcementsLoading}
                draggedAnnouncement={draggedAnnouncement}
                dropTargetAnnouncement={dropTargetAnnouncement}
                dropPosition={dropPosition}
                formatDate={formatDate}
                formatTime={formatTime}
                getTypeBadgeStyle={getTypeBadgeStyle}
                getStatusColor={getStatusColor}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                onToggleStatus={handleToggleStatus}
                onEdit={startEditing}
                onDelete={(id) => setShowDeleteConfirm(id)}
                onPageChange={(newPage) => setPagination(prev => ({ ...prev, page: newPage }))}
              />
            )}
          </div>
        </div>
      </div>
      <CreateNewAnnouncementModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onConfirm={handleCreateAnnouncement}
        formData={formData}
        onFormDataChange={setFormData}
        isLoading={isLoading}
      />
      <EditAnnouncementModal
        isOpen={!!editingAnnouncement}
        onClose={() => {
          setEditingAnnouncement(null);
          resetForm();
        }}
        onConfirm={handleEditAnnouncement}
        formData={formData}
        onFormDataChange={setFormData}
        editingAnnouncement={editingAnnouncement}
        isLoading={isLoading}
      />
      <DeleteAnnouncementModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDeleteAnnouncement(showDeleteConfirm)}
        isLoading={isLoading}
      />
    </div>
  );
};


export default AnnouncementsPage;