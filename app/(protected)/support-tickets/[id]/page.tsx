'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaComments,
    FaExclamationTriangle,
    FaEye,
    FaFileAlt,
    FaFileArchive,
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaImage,
    FaPaperclip,
    FaReply,
    FaTicketAlt,
    FaTimes,
    FaUser,
    FaUserShield,
    FaVideo
} from 'react-icons/fa';
import TicketSystemGuard from '@/components/ticket-system-guard';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
import useTicketPolling from '@/hooks/useTicketPolling';
import { useSelector } from 'react-redux';
import { getUserDetails } from '@/lib/actions/getUser';

const GradientSpinner = ({ size = 'w-16 h-16', className = '' }) => (
  <div className={`${size} ${className} relative`}>
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-spin">
      <div className="absolute inset-1 rounded-full bg-white"></div>
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
}) => (
  <div className={`toast toast-${type} toast-enter`}>
    {type === 'success' && <FaCheckCircle className="toast-icon" />}
    <span className="font-medium">{message}</span>
    <button onClick={onClose} className="toast-close">
      <FaTimes className="toast-close-icon" />
    </button>
  </div>
);

const ButtonLoader = () => <GradientSpinner size="w-5 h-5" />;

interface TicketMessage {
  id: string;
  type: 'customer' | 'staff' | 'system';
  author: string;
  authorRole?: 'user' | 'admin';
  content: string;
  createdAt: string;
  attachments?: TicketAttachment[];
  userImage?: string;
}

interface TicketAttachment {
  id: string;
  filename: string;
  filesize: string;
  mimetype: string;
  url: string;
}

interface SupportTicketDetails {
  id: string;
  subject: string;
  createdAt: string;
  lastUpdated: string;
  status: 'Open' | 'Answered' | 'Customer Reply' | 'On Hold' | 'In Progress' | 'closed';
  messages: TicketMessage[];
  ticketType?: 'Human' | 'AI';
  aiSubcategory?: 'Refill' | 'Cancel' | 'Speed Up' | 'Restart' | 'Fake Complete';
  systemMessage?: string;
  ticketStatus?: 'Pending' | 'Processed' | 'Failed';
  orderIds?: string[];
}

const UserSupportTicketPage = ({ params }: { params: Promise<{ id: string }> }) => {
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
    if (!dateString) return '';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) return '';

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
    if (!dateString) return '';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: userTimezone,
    });
  };

  const formatDateTime = (dateString: string | Date): string => {
    if (!dateString) return '';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return '';
    }
    
    if (isNaN(date.getTime())) return '';

    const dateStr = formatDate(date);
    const timeStr = formatTime(date);
    return `${dateStr} at ${timeStr}`;
  };

  const [ticketDetails, setTicketDetails] = useState<SupportTicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isClosingTicket, setIsClosingTicket] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  useEffect(() => {
    if (!ticketId) return;

    const fetchTicketDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/support-tickets/${ticketId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch ticket details');
        }
        const data = await response.json();
        setTicketDetails(data);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        showToast('Error loading ticket details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [ticketId]);

  const { hasNewMessages, isPolling, markMessagesAsRead } = useTicketPolling(
    ticketId,
    ticketDetails,
    setTicketDetails,
    3000,
    'user'
  );

  const formatTicketID = (id: string | undefined) => {
    if (!id) return '0';
    return id.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Answered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Customer Reply':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'On Hold':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'In Progress':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Closed':
      case 'closed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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

  const handleReplySubmit = async () => {
    console.log('handleReplySubmit called with:', { replyContent, ticketId });
    if (!replyContent.trim()) {
      console.log('Reply content is empty, returning');
      return;
    }

    if (ticketDetails?.status === 'closed') {
      showToast('This ticket has been closed and no longer accepts replies.', 'error');
      return;
    }

    setIsReplying(true);
    console.log('Starting reply submission...');

    try {
      let attachmentPaths: string[] = [];

      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          fileFormData.append('uploadType', 'uploads');

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

      console.log('Sending request to:', `/api/support-tickets/${ticketId}/reply`);
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

      console.log('Response status:', response.status, response.statusText);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API Error:', errorData);

        if (response.status === 400 && errorData.error && errorData.error.toLowerCase().includes('closed')) {

          showToast('This ticket has been closed and no longer accepts replies. Please refresh the page.', 'error');

          if (ticketId) {
            try {
              const refreshResponse = await fetch(`/api/support-tickets/${ticketId}`);
              if (refreshResponse.ok) {
                const refreshedTicket = await refreshResponse.json();
                setTicketDetails(refreshedTicket);
              }
            } catch (refreshError) {
              console.error('Error refreshing ticket details:', refreshError);
            }
          }
          return;
        }

        throw new Error(errorData.error || 'Failed to send reply');
      }

      const responseData = await response.json();
      console.log('Received response data:', responseData);

      const updatedTicket = responseData.ticket || responseData;

      if (!updatedTicket || !updatedTicket.id) {
        console.error('Invalid response structure:', updatedTicket);
        throw new Error('Invalid response from server');
      }

      console.log('Setting ticket details with updated data');
      setTicketDetails(updatedTicket);

      console.log('Reply submitted successfully, clearing form');
      setReplyContent('');
      setSelectedFiles([]);
      showToast('Reply sent successfully', 'success');
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast(error instanceof Error ? error.message : 'Error sending reply', 'error');
    } finally {
      console.log('Reply submission completed, setting isReplying to false');
      setIsReplying(false);
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

      const maxSize = 3 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast(`File "${file.name}" is too large. Maximum 3MB allowed for user uploads.`, 'error');
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

  if (loading || !ticketId) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaTicketAlt />
              </div>
              <h3 className="card-title">Loading Ticket Details</h3>
            </div>
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <GradientSpinner size="w-12 h-12" className="mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading ticket details...</p>
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
        <div className="page-content">
          <div className="card card-padding">
            <div className="card-header">
              <div className="card-icon">
                <FaExclamationTriangle />
              </div>
              <h3 className="card-title">Ticket Not Found</h3>
            </div>
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center">
                <FaExclamationTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Ticket Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
                <button 
                  onClick={() => window.history.back()}
                  className="btn btn-primary"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TicketSystemGuard>
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
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => router.push('/support-tickets/history')}
              className="btn btn-primary flex items-center gap-2"
            >
              <FaArrowLeft className="h-4 w-4" />
              Back to Tickets
            </button>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Ticket #{formatTicketID(ticketDetails?.id)}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {}
          <div className="md:col-span-2 space-y-6">
            {}
            {ticketDetails && ticketDetails.ticketType === 'AI' && ticketDetails.systemMessage && (
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaExclamationTriangle />
                  </div>
                  <h3 className="card-title">System Processing Result</h3>
                </div>

                <div className={`p-4 rounded-lg border-l-4 ${
                  ticketDetails.ticketStatus === 'Processed' 
                    ? 'bg-green-50 border-green-400 text-green-800' 
                    : ticketDetails.ticketStatus === 'Failed'
                    ? 'bg-red-50 border-red-400 text-red-800'
                    : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      ticketDetails.ticketStatus === 'Processed' 
                        ? 'bg-green-500' 
                        : ticketDetails.ticketStatus === 'Failed'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}>
                      {ticketDetails.ticketStatus === 'Processed' ? '✓' : 
                       ticketDetails.ticketStatus === 'Failed' ? '✗' : '⏳'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-2">
                        AI {ticketDetails.aiSubcategory} Request - {ticketDetails.ticketStatus}
                      </h4>
                      <p className="text-sm whitespace-pre-wrap">{ticketDetails.systemMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {}
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaComments />
                </div>
                <h3 className="card-title">Conversation</h3>
              </div>

              <div className="space-y-6" onClick={() => hasNewMessages && markMessagesAsRead()}>
                {ticketDetails && ticketDetails.messages && ticketDetails.messages.length > 0 ? (
                  ticketDetails.messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                      {message.userImage && message.type === 'customer' ? (
                        <img
                          src={message.userImage}
                          alt={message.author}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white font-medium text-sm ${
                          message.type === 'customer' ? 'bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)]' :
                          message.type === 'staff' ? 'bg-gradient-to-r from-gray-600 to-gray-700' : 'bg-gradient-to-r from-gray-600 to-gray-700'
                        }`}>
                          {message.type === 'customer' ? <FaUser className="h-4 w-4" /> :
                           message.type === 'staff' ? <FaUserShield className="h-4 w-4" /> :
                           <FaExclamationTriangle className="h-4 w-4" />}
                        </div>
                      )}
                    </div>

                    <div className={`flex-1 min-w-0 p-4 rounded-lg ${
                      message.type === 'customer' ? 'bg-blue-50 dark:bg-blue-900/50' : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{message.author}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>

                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{message.content}</div>
                      </div>

                      {}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {message.attachments && message.attachments.map((attachment, index) => {

                            const attachmentUrl = typeof attachment === 'string' ? attachment : attachment.url;
                            const filename = typeof attachment === 'string' 
                              ? (attachment as string).split('/').pop() || 'Unknown file'
                              : attachment.filename;
                            const mimetype = typeof attachment === 'string'
                              ? ''
                              : attachment.mimetype;
                            const filesize = typeof attachment === 'object' && attachment.filesize ? attachment.filesize : '';

                            return (
                              <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                {getFileIcon(mimetype)}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                                    {filename}
                                  </div>
                                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {filesize ? `${filesize} • ` : ''}Attachment
                                  </div>
                                </div>
                                <button 
                                  className="text-blue-600 hover:text-blue-800"
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
                  <div className="text-center py-8">
                    <FaComments className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No messages found for this ticket.</p>
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
                  <h3 className="card-title">Post a Reply</h3>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply..."
                      rows={6}
                      className="form-field w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-vertical"
                    />
                  </div>

                  {}
                  <div className="form-group">
                    <label className="form-label mb-2 flex items-center gap-2">
                      <FaPaperclip />
                      Attachments
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[var(--primary)] file:to-[var(--secondary)] file:text-white hover:file:from-[#4F0FD8] hover:file:to-[#A121E8] transition-all duration-200"
                    />
                    <small className="text-xs text-gray-500 mt-1">
                      You can upload screenshots or other relevant files (max 3MB each, images and PDFs only).
                    </small>

                    {}
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                            {getFileIcon(file.type)}
                            <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{file.name}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round(file.size / 1024)} KB</span>
                            <button
                              onClick={() => removeSelectedFile(index)}
                              className="text-red-600 hover:text-red-800"
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
                      {isReplying ? 'Submitting...' : 'Submit Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="space-y-6">
            {ticketDetails && (
              <>
                {}
                <div className="card card-padding">
                  <div className="card-header">
                    <div className="card-icon">
                      <FaTicketAlt />
                    </div>
                    <h3 className="card-title">Ticket Details</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="form-label">Subject</label>
                      <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ticketDetails.subject}</p>
                    </div>
                    {ticketDetails.orderIds && Array.isArray(ticketDetails.orderIds) && ticketDetails.orderIds.length > 0 && (
                       <div>
                         <label className="form-label">
                           {ticketDetails.orderIds.length === 1 ? 'Order ID' : 'Order IDs'}
                         </label>
                         <p className="mt-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                           {ticketDetails.orderIds.join(', ')}
                         </p>
                       </div>
                     )}
                <div>
                  <label className="form-label">Status</label>
                  <span className={`mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticketDetails.status)}`}>
                  {formatStatusDisplay(ticketDetails.status)}
                </span>
                </div>
                <div>
                  <label className="form-label">Created</label>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(ticketDetails.createdAt)} {formatTime(ticketDetails.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="form-label">Last Updated</label>
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {formatDate(ticketDetails.lastUpdated)} {formatTime(ticketDetails.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>

            {}
            {ticketDetails.status !== 'closed' ? (
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaTimes />
                  </div>
                  <h3 className="card-title">Close Ticket</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>  
                    If your issue has been resolved, you can close this ticket. Once closed, you won't be able to add more replies.
                  </p>
                  <button
                    onClick={handleCloseTicket}
                    disabled={isClosingTicket}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {isClosingTicket ? 'Closing...' : 'Close Ticket'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card card-padding">
                <div className="card-header">
                  <div className="card-icon">
                    <FaTimes />
                  </div>
                  <h3 className="card-title">Ticket Status</h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>  
                    This ticket has been closed and no further replies can be added.
                  </p>
                  <button
                    disabled
                    className="btn btn-primary opacity-75 cursor-not-allowed"
                  >
                    Closed
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </TicketSystemGuard>
  );
};

export default UserSupportTicketPage;
