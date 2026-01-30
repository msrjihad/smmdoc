'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaChevronDown,
    FaChevronUp,
    FaComments,
    FaExclamationTriangle,
    FaEye,
    FaFileAlt,
    FaFileArchive,
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaImage,
    FaPlus,
    FaReply,
    FaStickyNote,
    FaTicketAlt,
    FaTimes,
    FaUser,
    FaUserShield,
    FaVideo
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import useTicketPolling from '@/hooks/useTicketPolling';
import TicketSystemGuard from '@/components/ticket-system-guard';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-800"></div>
    </div>
  </div>
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

const ButtonLoader = () => <GradientSpinner size="w-5 h-5" />;

interface TicketMessage {
  id: string;
  type: 'customer' | 'staff' | 'system';
  author: string;
  authorRole?: 'user' | 'admin';
  content: string;
  createdAt: string;
  attachments?: (string | TicketAttachment)[];
  isEdited?: boolean;
  editedAt?: string;
  userImage?: string;
  user?: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
}

interface TicketAttachment {
  id: string;
  filename: string;
  filesize: string;
  mimetype: string;
  uploadedAt: string;
  uploadedBy: string;
  url?: string;
}

interface TicketNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  isPrivate: boolean;
}

interface SupportTicketDetails {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  subject: string;
  createdAt: string;
  lastUpdated: string;
  status: 'Open' | 'Answered' | 'Customer Reply' | 'On Hold' | 'In Progress' | 'closed';
  isRead: boolean;
  messages: TicketMessage[];
  notes: TicketNote[];
  assignedTo?: string;
  timeSpent: number;
  ticketType?: 'Human' | 'AI';
  aiSubcategory?: 'Refill' | 'Cancel' | 'Speed Up' | 'Restart' | 'Fake Complete';
  systemMessage?: string;
  ticketStatus?: 'Pending' | 'Processed' | 'Failed';
  orderIds?: string[];
  userInfo: {
    fullName: string;
    username?: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    registeredAt: string;
    totalTickets: number;
    openTickets: number;
  };
}

const SupportTicketDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const { appName } = useAppNameWithFallback();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');
  const [ticketId, setTicketId] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setTicketId(resolvedParams.id);
      } catch (error) {
        console.error('Error resolving params:', error);
      }
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (ticketId) {
      setPageTitle(`Ticket #${ticketId}`, appName);
    }
  }, [appName, ticketId]);

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

    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: userTimezone,
    });
  };

  const [ticketDetails, setTicketDetails] = useState<SupportTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [showUserInfo, setShowUserInfo] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isClosingTicket, setIsClosingTicket] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const { hasNewMessages, markMessagesAsRead, isPolling } = useTicketPolling(
    ticketId,
    ticketDetails,
    setTicketDetails,
    3000
  );

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicketDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/tickets/${ticketId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch ticket details');
        }
        const result = await response.json();
        const data = result.ticket;

        const enhancedData = {
          ...data,
          userInfo: {
            ...data.userInfo,
            fullName: data.userInfo?.name || 'N/A',
            phone: 'N/A',
            company: 'N/A',
            address: 'N/A',
            registeredAt: 'N/A',
          }
        };

        setTicketDetails(enhancedData);

        if (!data.isRead) {
          try {
            await fetch(`/api/admin/tickets/${ticketId}/read`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ isRead: true }),
            });
          } catch (readError) {
            console.error('Error marking ticket as read:', readError);
          }
        }
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        showToast('Error loading ticket details', 'error');
        setTicketDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  const formatTicketID = (id: string | number) => {
    return String(id || '0');
  };

  const calculateTimeSpent = (createdAt: string, status: string, lastUpdated?: string) => {
    const created = new Date(createdAt);
    let endTime: Date;

    if (status === 'Closed' && lastUpdated) {
      endTime = new Date(lastUpdated);
    } else if (status === 'Closed') {

      endTime = created;
    } else {
      endTime = new Date();
    }

    const diffMs = endTime.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours.toString().padStart(2, '0')}:${diffMinutes.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Answered':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'Customer Reply':
        return 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'On Hold':
        return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'In Progress':
        return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Closed':
      case 'closed':
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const formatStatusDisplay = (status: string) => {
    switch (status) {
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (!mimetype) return <FaFileAlt className="h-4 w-4" />;
    if (mimetype.startsWith('image/')) return <FaImage className="h-4 w-4" />;
    if (mimetype.startsWith('video/')) return <FaVideo className="h-4 w-4" />;
    if (mimetype.includes('pdf')) return <FaFilePdf className="h-4 w-4" />;
    if (mimetype.includes('word')) return <FaFileWord className="h-4 w-4" />;
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return <FaFileExcel className="h-4 w-4" />;
    if (mimetype.includes('zip') || mimetype.includes('rar')) return <FaFileArchive className="h-4 w-4" />;
    return <FaFileAlt className="h-4 w-4" />;
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update ticket status');
      }

      const responseData = await response.json();
      setTicketDetails(responseData);

      showToast(`Ticket status updated to ${newStatus}`, 'success');
    } catch (error) {
      console.error('Error updating ticket status:', error);
      showToast('Error updating ticket status', 'error');
    }
  };

  const handleCloseTicket = async () => {
    const confirmed = window.confirm('Are you sure you want to close this ticket? This action cannot be undone.');
    if (!confirmed) return;

    setIsClosingTicket(true);
    try {
      const response = await fetch(`/api/support-tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'closed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to close ticket');
      }

      const updatedTicket = await response.json();
      setTicketDetails(updatedTicket);

      showToast('Ticket has been closed successfully', 'success');
    } catch (error) {
      console.error('Error closing ticket:', error);
      showToast('Error closing ticket', 'error');
    } finally {
      setIsClosingTicket(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    setIsReplying(true);

    try {
      let attachmentPaths: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          fileFormData.append('uploadType', 'admin_uploads');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: fileFormData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload file: ${file.name}`);
          }

          const uploadResult = await uploadResponse.json();
          attachmentPaths.push(uploadResult.filePath);
        }
      }

      const response = await fetch(`/api/support-tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: replyContent,
          attachments: attachmentPaths.length > 0 ? JSON.stringify(attachmentPaths) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      const responseData = await response.json();
      setTicketDetails(responseData);

      setReplyContent('');
      setSelectedFiles([]);
      showToast('Reply sent successfully', 'success');
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast(error instanceof Error ? error.message : 'Error sending reply', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);

    try {
      const response = await fetch(`/api/support-tickets/${ticketId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const updatedTicket = await response.json();
      setTicketDetails(updatedTicket);

      setNewNote('');
      showToast('Note added successfully', 'success');
    } catch (error) {
      console.error('Error adding note:', error);
      showToast('Error adding note', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: File[] = [];

    for (const file of files) {

      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];
      if (!allowedTypes.includes(file.type)) {
        showToast(`File "${file.name}" has an unsupported format. Only images and PDFs are allowed.`, 'error');
        continue;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast(`File "${file.name}" is too large. Maximum 10MB allowed for admin uploads.`, 'error');
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      showToast(`${validFiles.length} file(s) selected successfully!`, 'success');
    }

    event.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (loading || !ticketId) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                <div className="h-10 w-40 gradient-shimmer rounded-lg" />
              </div>
              <div className="h-8 w-48 gradient-shimmer rounded" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-40 gradient-shimmer rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-32 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-24 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                    <div className="h-6 w-20 gradient-shimmer rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-32 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-32 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-16 gradient-shimmer rounded" />
                  </div>
                </div>
              </div>

              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-48 gradient-shimmer rounded" />
                </div>
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="w-10 h-10 gradient-shimmer rounded-full" />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-24 gradient-shimmer rounded" />
                          <div className="h-4 w-16 gradient-shimmer rounded" />
                          <div className="h-4 w-32 gradient-shimmer rounded" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-full gradient-shimmer rounded" />
                          <div className="h-4 w-3/4 gradient-shimmer rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-32 gradient-shimmer rounded" />
                </div>
                <div className="space-y-4">
                  <div className="h-32 gradient-shimmer rounded-lg" />
                  <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-40 gradient-shimmer rounded" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-32 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-40 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-48 gradient-shimmer rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
                    <div>
                      <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                      <div className="h-6 w-8 gradient-shimmer rounded" />
                    </div>
                    <div>
                      <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                      <div className="h-6 w-8 gradient-shimmer rounded" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-40 gradient-shimmer rounded" />
                </div>
                <div className="space-y-3">
                  <div className="h-20 gradient-shimmer rounded-lg" />
                  <div className="h-8 w-24 gradient-shimmer rounded-lg" />
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="h-3 w-32 gradient-shimmer rounded mb-2" />
                      <div className="h-4 w-full gradient-shimmer rounded" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-32 gradient-shimmer rounded" />
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-48 gradient-shimmer rounded" />
                  <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticketDetails) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ticket Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">The ticket you're looking for doesn't exist or has been deleted.</p>
            <button 
              onClick={() => window.history.back()}
              className="btn btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {}
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
        {}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            {}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/admin/tickets')}
                className="btn btn-primary flex items-center gap-2"
              >
                <FaArrowLeft className="h-4 w-4" />
                Back to Tickets
              </button>

              {}
              {ticketDetails.status !== 'closed' && (
                <select 
                  value={ticketDetails.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="form-field pl-4 pr-10 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white transition-all duration-200 appearance-none cursor-pointer text-sm"
                >
                  <option value="Open">Open</option>
                  <option value="Answered">Answered</option>
                  <option value="Customer Reply">Customer Reply</option>
                  <option value="On Hold">On Hold</option>
                  <option value="In Progress">In Progress</option>
                </select>
              )}
              {ticketDetails.status === 'closed' && (
                <button 
                  disabled
                  className="btn btn-primary opacity-75 cursor-not-allowed"
                >
                  Closed
                </button>
              )}
            </div>

            <div className="flex flex-row items-center gap-1 md:gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Ticket #{formatTicketID(ticketDetails.id)}
              </h1>
            </div>
          </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 space-y-6">
            {}
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaTicketAlt />
                </div>
                <h3 className="card-title">Ticket Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="form-label">Subject</label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{ticketDetails.subject}</p>
                </div>
                {ticketDetails.orderIds && Array.isArray(ticketDetails.orderIds) && ticketDetails.orderIds.length > 0 && (
                  <div>
                    <label className="form-label">
                      {ticketDetails.orderIds.length === 1 ? 'Order ID' : 'Order IDs'}
                    </label>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ticketDetails.orderIds.join(', ')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="form-label">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticketDetails.status)}`}>
                    {formatStatusDisplay(ticketDetails.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="form-label">Created</label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {formatDate(ticketDetails.createdAt)} at{' '}
                    {formatTime(ticketDetails.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="form-label">Last Updated</label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {formatDate(ticketDetails.lastUpdated)} at{' '}
                    {formatTime(ticketDetails.lastUpdated)}
                  </p>
                </div>
                <div>
                  <label className="form-label">Time Spent</label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">{calculateTimeSpent(ticketDetails.createdAt, ticketDetails.status, ticketDetails.lastUpdated)}</p>
                </div>
              </div>
            </div>

            {}
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaComments />
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <h3 className="card-title">Conversation ({ticketDetails.messages?.length || 0})</h3>
                </div>
              </div>

              <div className="space-y-6" onClick={() => hasNewMessages && markMessagesAsRead()}>
                {ticketDetails.messages && ticketDetails.messages.length > 0 ? (
                  ticketDetails.messages.map((message) => (
                  <div key={message.id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center relative">
                      {message.type === 'system' ? (
                         <div className="w-full h-full flex items-center justify-center text-white font-medium text-sm bg-gradient-to-r from-gray-600 to-gray-700">
                           <FaExclamationTriangle className="h-4 w-4" />
                         </div>
                      ) : message.type !== 'system' && (message.userImage || message.authorRole === 'user') ? (
                        <img
                          src={message.userImage || '/general/user-placeholder.jpg'}
                          alt={message.author}
                          className="w-full h-full object-cover relative z-10"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center text-white font-medium text-sm absolute inset-0 ${
                        message.type === 'system' ? 'bg-gradient-to-r from-gray-600 to-gray-700' :
                        message.authorRole === 'user' ? 'bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)]' : 
                        message.authorRole === 'admin' ? 'bg-gradient-to-r from-gray-600 to-gray-700' : 
                        'bg-gradient-to-r from-gray-500 to-gray-600'
                      }`}>
                        {message.type === 'system' ? (
                          <FaExclamationTriangle className="h-4 w-4" />
                        ) : message.authorRole === 'user' ? (
                          message.author?.charAt(0)?.toUpperCase() || <FaUser className="h-4 w-4" />
                        ) : message.authorRole === 'admin' ? (
                          <FaUserShield className="h-4 w-4" />
                        ) : (
                          <FaExclamationTriangle className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    <div className={`flex-1 min-w-0 p-4 rounded-lg ${
                      (message.authorRole === 'admin' || message.type === 'system') ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {message.author}
                        </span>
                        {message.authorRole && (
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-bold text-gray-600 dark:text-gray-400">
                            {message.authorRole}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(message.createdAt)} at{' '}
                          {formatTime(message.createdAt)}
                        </span>
                        {message.isEdited && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">(edited)</span>
                        )}
                      </div>

                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{message.content}</div>
                      </div>

                      {}
                      {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Attachments:</h4>
                          {message.attachments.map((attachment, index) => {

                            const attachmentUrl = typeof attachment === 'string' ? attachment : attachment.url;
                            const filename = typeof attachment === 'string' 
                              ? attachment.split('/').pop() || 'Unknown file'
                              : attachment.filename;
                            const mimetype = typeof attachment === 'string'
                              ? ''
                              : attachment.mimetype;

                            return (
                              <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                {getFileIcon(mimetype)}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                                    {filename}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {typeof attachment === 'object' && attachment.filesize ? `${attachment.filesize} • ` : ''}Attachment
                                  </div>
                                </div>
                                <button 
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  onClick={() => window.open(attachmentUrl, '_blank')}
                                  title="View attachment"
                                >
                                  <FaEye className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaComments className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No messages found for this ticket.</p>
                  </div>
                )}
              </div>
            </div>

            {}
            {ticketDetails.status !== 'closed' && (
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaReply />
                  </div>
                  <h3 className="card-title">Reply to Ticket</h3>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply to the customer..."
                      rows={6}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
                    />
                    <small className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      This reply will be visible to the customer and will update the ticket status.
                    </small>
                  </div>

                  {}
                  <div className="form-group">
                    <label className="form-label mb-2">
                      Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[var(--primary)] file:to-[var(--secondary)] file:text-white hover:file:from-[#4F0FD8] hover:file:to-[#A121E8] transition-all duration-200"
                    />
                    <small className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      You can upload screenshots or other relevant files (max 10MB each).
                    </small>

                    {}
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                            {getFileIcon(file.type)}
                            <span className="text-sm flex-1 text-gray-900 dark:text-gray-100">{file.name}</span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{Math.round(file.size / 1024)} KB</span>
                            <button
                              onClick={() => removeSelectedFile(index)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            >
                              <FaTimes className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReplySubmit}
                      disabled={!replyContent.trim() || isReplying}
                      className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {isReplying ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="space-y-6">
            {}
            <div className="card card-padding">
              <div 
                className="card-header cursor-pointer flex items-center justify-between"
                onClick={() => setShowUserInfo(!showUserInfo)}
              >
                <div className="flex items-center gap-2">
                  <div className="card-icon">
                    <FaUser />
                  </div>
                  <h3 className="card-title">User Information</h3>
                </div>
                {showUserInfo ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {showUserInfo && (
                <div className="space-y-4">
                  <div>
                    <div className="form-label">Username</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{ticketDetails.userInfo?.username || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="form-label">Full Name</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{ticketDetails.userInfo?.fullName || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="form-label">Email</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{ticketDetails.userInfo?.email || 'N/A'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
                    <div>
                      <div className="form-label">Total Tickets</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{ticketDetails.userInfo?.totalTickets || 0}</div>
                    </div>
                    <div>
                      <div className="form-label">Open Tickets</div>
                      <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{ticketDetails.userInfo?.openTickets || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card card-padding">
              <div 
                className="card-header cursor-pointer flex items-center justify-between"
                onClick={() => setShowNotes(!showNotes)}
              >
                <div className="flex items-center gap-2">
                  <div className="card-icon">
                    <FaStickyNote />
                  </div>
                  <h3 className="card-title">Internal Notes ({ticketDetails.notes?.length || 0})</h3>
                </div>
                {showNotes ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {showNotes && (
                <div>
                  {}
                  <div className="mb-4">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal note..."
                      rows={3}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
                    />
                    <small className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      Internal notes are only visible to support staff members.
                    </small>
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isAddingNote}
                      className="mt-2 btn btn-primary text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      {isAddingNote ? (
                        "Adding Note..."
                      ) : (
                        <>
                          <FaPlus className="h-3 w-3" />
                          Add Note
                        </>
                      )}
                    </button>
                  </div>

                  {}
                  <div className="space-y-3">
                    {ticketDetails.notes?.map((note) => (
                      <div key={note.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="text-xs mb-1 text-gray-600 dark:text-gray-400">
                          {note.author} • {formatDate(note.createdAt)} {formatTime(note.createdAt)}
                        </div>
                        <div className="text-sm whitespace-pre-wrap text-gray-900 dark:text-gray-100">{note.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaTimes />
                </div>
                <h3 className="card-title">Close Ticket</h3>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Closing this ticket will mark it as resolved and prevent further customer replies.
                </p>
                <button
                  onClick={handleCloseTicket}
                  disabled={isClosingTicket || ticketDetails.status === 'closed'}
                  className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isClosingTicket ? 'Closing...' : (ticketDetails.status === 'closed' ? 'Ticket Closed' : 'Close Ticket')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtectedSupportTicketDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => (
  <TicketSystemGuard>
    <SupportTicketDetailsPage params={params} />
  </TicketSystemGuard>
);

export default ProtectedSupportTicketDetailsPage;