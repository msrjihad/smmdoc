'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaChevronDown,
    FaChevronUp,
    FaComments,
    FaEnvelope,
    FaExclamationTriangle,
    FaEye,
    FaFileAlt,
    FaFileArchive,
    FaFileExcel,
    FaFilePdf,
    FaFileWord,
    FaImage,
    FaPaperPlane,
    FaPlus,
    FaReply,
    FaStickyNote,
    FaTimes,
    FaUser,
    FaVideo
} from 'react-icons/fa';

import { useAppNameWithFallback } from '@/contexts/app-name-context';
import { setPageTitle } from '@/lib/utils/set-page-title';
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

const getFileIcon = (mimetype: string) => {
  if (!mimetype) return <FaFileAlt className="h-4 w-4" />;
  if (mimetype.startsWith('image/')) return <FaImage className="h-4 w-4" />;
  if (mimetype.startsWith('video/')) return <FaVideo className="h-4 w-4" />;
  if (mimetype.includes('pdf')) return <FaFilePdf className="h-4 w-4" />;
  if (mimetype.includes('word')) return <FaFileWord className="h-4 w-4" />;
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return <FaFileExcel className="h-4 w-4" />;
  if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('archive')) return <FaFileArchive className="h-4 w-4" />;
  return <FaFileAlt className="h-4 w-4" />;
};

interface ContactMessage {
  id: string;
  type: 'customer' | 'staff' | 'system';
  author: string;
  authorRole?: string;
  content: string;
  createdAt: string;
  attachments?: ContactAttachment[];
  isEdited?: boolean;
  editedAt?: string;
}

interface ContactAttachment {
  id: string;
  filename: string;
  originalName?: string;
  encryptedName?: string;
  filesize: string;
  mimetype: string;
  mimeType?: string;
  fileSize?: number;
  url?: string;
  fileUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface ContactNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  isPrivate: boolean;
}

interface ContactMessageDetails {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  category: string;
  subject: string;
  createdAt: string;
  lastUpdated: string;
  status: 'Unread' | 'Read' | 'Replied';
  messages: ContactMessage[];
  notes: ContactNote[];
  timeSpent: number;
  userInfo: {
    fullName: string;
    email: string;
    phone?: string;
    company?: string;
    address?: string;
    registeredAt: string;
    totalMessages: number;
    openMessages: number;
  };
}

const ContactDetailsPage = () => {
  const router = useRouter();
  const { appName } = useAppNameWithFallback();
  const currentUser = useCurrentUser();
  const userDetails = useSelector((state: any) => state.userDetails);
  const [timeFormat, setTimeFormat] = useState<string>('24');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Dhaka');

  const messageId: string = typeof window !== 'undefined'
    ? (window.location.pathname.split('/').pop() ?? '1')
    : '1';

  useEffect(() => {
    setPageTitle(`Message Details ${formatMessageID(messageId)}`, appName);
  }, [messageId]);

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
    if (!dateString) return 'Unknown';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Unknown';
    }
    
    if (isNaN(date.getTime())) return 'Unknown';

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
    if (!dateString) return 'Unknown';
    
    let date: Date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Unknown';
    }
    
    if (isNaN(date.getTime())) return 'Unknown';

    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: userTimezone,
    });
  };

  const [contactDetails, setContactDetails] = useState<ContactMessageDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [showUserInfo, setShowUserInfo] = useState(true);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'pending';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatMessageID = (id: string) => {
    return `#${parseInt(id.toString()).toString()}`;
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <FaImage className="h-4 w-4" />;
    if (mimetype.startsWith('video/')) return <FaVideo className="h-4 w-4" />;
    if (mimetype.includes('pdf')) return <FaFilePdf className="h-4 w-4" />;
    if (mimetype.includes('word')) return <FaFileWord className="h-4 w-4" />;
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return <FaFileExcel className="h-4 w-4" />;
    if (mimetype.includes('zip') || mimetype.includes('rar')) return <FaFileArchive className="h-4 w-4" />;
    return <FaFileAlt className="h-4 w-4" />;
  };

  const fetchContactDetails = async () => {
    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}?include_notes=true`);
      const data = await response.json();

      if (response.ok && data.success) {

        const messages: ContactMessage[] = [];

        if (data.message.message) {

          let parsedAttachments: ContactAttachment[] = [];
          if (data.message.attachments) {
            try {
              const attachmentData = JSON.parse(data.message.attachments);
              if (Array.isArray(attachmentData)) {
                parsedAttachments = attachmentData.map((att, index) => {
                  return {
                    id: `${data.message.id}_${index}`,
                    filename: att.encryptedName || att.originalName || att.filename || 'Unknown file',
                    filesize: att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Unknown size',
                    mimetype: att.mimeType || att.mimetype || 'application/octet-stream',
                    url: att.fileUrl || att.url,
                    uploadedAt: data.message.createdAt,
                    uploadedBy: data.message.user?.username || 'User'
                  };
                });
              }
            } catch (error) {
              console.error('Error parsing attachments:', error);
            }
          }

          messages.push({
            id: `customer_${data.message.id}`,
            type: 'customer',
            author: data.message.user?.username || 'Unknown User',
            content: data.message.message,
            createdAt: data.message.createdAt,
            attachments: parsedAttachments
          });
        }

        if (data.message.adminReply) {
          try {

            const replies = JSON.parse(data.message.adminReply);
            if (Array.isArray(replies)) {

              replies.forEach((reply, index) => {

                let replyAttachments: ContactAttachment[] = [];
                if (reply.attachments && Array.isArray(reply.attachments)) {
                  replyAttachments = reply.attachments.map((attachment: any, attachIndex: number) => {

                    let filename, fileUrl, filesize = '0 KB', mimetype = 'application/octet-stream';

                    if (typeof attachment === 'string') {

                      filename = attachment.split('/').pop() || 'attachment';
                      fileUrl = attachment;
                      const extension = filename.split('.').pop()?.toLowerCase() || '';
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                        mimetype = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                      } else if (extension === 'pdf') {
                        mimetype = 'application/pdf';
                      } else if (['doc', 'docx'].includes(extension)) {
                        mimetype = 'application/msword';
                      } else if (['xls', 'xlsx'].includes(extension)) {
                        mimetype = 'application/vnd.ms-excel';
                      }
                    } else {

                      filename = attachment.encryptedName || attachment.filename || 'attachment';
                      fileUrl = attachment.encryptedPath || attachment.fileUrl;
                      filesize = attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : 'Unknown size';
                      mimetype = attachment.mimeType || 'application/octet-stream';
                    }

                    return {
                      id: `admin_reply_${data.message.id}_${index}_${attachIndex}`,
                      filename: filename,
                      filesize: filesize,
                      mimetype: mimetype,
                      url: fileUrl,
                      uploadedAt: reply.repliedAt,
                      uploadedBy: reply.author || 'Admin'
                    };
                  });
                }

                messages.push({
                  id: `admin_${data.message.id}_${index}`,
                  type: 'staff',
                  author: reply.author || 'Admin',
                  content: reply.content,
                  createdAt: reply.repliedAt,
                  attachments: replyAttachments
                });
              });
            } else {

              let singleReplyAttachments: ContactAttachment[] = [];
              if (data.message.attachments) {
                try {
                  const attachmentData = JSON.parse(data.message.attachments);
                  singleReplyAttachments = attachmentData.map((attachment: any, index: number) => {
                    let filename, fileUrl, fileSize = 0, mimeType = 'application/octet-stream';

                    if (typeof attachment === 'string') {
                      filename = attachment.split('/').pop() || 'attachment';
                      fileUrl = attachment;
                      const extension = filename.split('.').pop()?.toLowerCase() || '';
                      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                        mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
                      } else if (extension === 'pdf') {
                        mimeType = 'application/pdf';
                      }
                    } else {

                      const encryptedName = attachment.encryptedName || (attachment.encryptedPath ? attachment.encryptedPath.split('/').pop() : null);
                      filename = encryptedName || attachment.filename || 'attachment';
                      fileUrl = attachment.encryptedPath || attachment.fileUrl;
                      fileSize = attachment.fileSize || 0;
                      mimeType = attachment.mimeType || 'application/octet-stream';
                    }

                    return {
                      id: `single-admin-reply-${index}`,
                      filename: filename,
                      filesize: fileSize ? `${Math.round(fileSize / 1024)} KB` : '0 KB',
                      mimetype: mimeType,
                      uploadedAt: data.message.repliedAt || data.message.updatedAt,
                      uploadedBy: 'Admin'
                    };
                  });
                } catch (e) {
                  console.error('Error parsing single reply attachments:', e);
                }
              }

              messages.push({
                id: `admin_${data.message.id}`,
                type: 'staff',
                author: data.message.repliedByUser?.username || 'Admin',
                content: data.message.adminReply,
                createdAt: data.message.repliedAt || data.message.updatedAt,
                attachments: singleReplyAttachments
              });
            }
          } catch {

            messages.push({
              id: `admin_${data.message.id}`,
              type: 'staff',
              author: data.message.repliedByUser?.username || 'Admin',
              content: data.message.adminReply,
              createdAt: data.message.repliedAt || data.message.updatedAt
            });
          }
        }

        const transformedData: ContactMessageDetails = {
          id: data.message.id.toString(),
          userId: data.message.userId.toString(),
          username: data.message.user?.username || 'Unknown User',
          userEmail: data.message.user?.email || 'No Email',
          category: data.message.category?.name || 'Unknown Category',
          subject: data.message.subject,
          createdAt: data.message.createdAt,
          lastUpdated: data.message.updatedAt,
          status: data.message.status || 'Read',
          messages: messages,
          notes: (data.message.notes || []).map((note: any) => ({
            id: note.id,
            content: note.content,
            author: note.admin_username || note.author || 'Unknown',
            createdAt: note.created_at,
            isPrivate: note.is_private || true
          })),
          timeSpent: data.message.time_spent || 0,
          userInfo: {
            fullName: data.message.user?.name || data.message.user?.username || 'Unknown User',
            email: data.message.user?.email || 'No Email',
            phone: data.message.user?.phone || '',
            company: data.message.user?.company || '',
            address: data.message.user?.address || '',
            registeredAt: data.message.user?.created_at || data.message.user?.registeredAt || new Date().toISOString(),
            totalMessages: data.message.user?.total_messages || 1,
            openMessages: data.message.user?.open_messages || 0
          }
        };

        setContactDetails(transformedData);

        if (data.message.status !== 'Read') {
          markAsRead();
        }
      } else {
        showToast(data.error || 'Failed to load contact details', 'error');
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
      showToast('Error loading contact details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'Read'
        }),
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  useEffect(() => {
    if (messageId) {
      fetchContactDetails();
    }
  }, [messageId]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'pending' = 'success'
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const removeSelectedFile = (index: number) => {
    const newSelectedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newSelectedFiles);

    if (newSelectedFiles.length === 0) {

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;

    setIsReplying(true);

    try {

      let attachmentData: Array<{
        originalName: string;
        encryptedPath: string;
        fileSize?: number;
        mimeType?: string;
      }> = [];
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('uploadType', 'admin_uploads');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload files');
        }

        if (uploadData.files) {

          attachmentData = uploadData.files.map((file: any) => ({
            originalName: file.originalName,
            encryptedPath: file.fileUrl,
            fileSize: file.fileSize,
            mimeType: file.mimeType
          }));
        } else if (uploadData.originalName) {

          attachmentData = [{
            originalName: uploadData.originalName,
            encryptedPath: uploadData.fileUrl,
            fileSize: uploadData.fileSize,
            mimeType: uploadData.mimeType
          }];
        }
      }

      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reply',
          adminReply: replyContent.trim(),
          attachments: attachmentData.length > 0 ? JSON.stringify(attachmentData) : undefined
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {

        setContactDetails(prev => prev ? ({
          ...prev,
          adminReply: replyContent.trim(),
          status: 'Replied',
          lastUpdated: new Date().toISOString(),
          repliedAt: new Date().toISOString()
        }) : null);

        setReplyContent('');
        setSelectedFiles([]);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        showToast(data.message || 'Reply sent successfully', 'success');

        fetchContactDetails();
      } else {
        showToast(data.error || 'Error sending reply', 'error');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Error sending reply', 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsAddingNote(true);

    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newNote }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const updatedMessage = await response.json();

      setContactDetails(prev => prev ? ({
        ...prev,
        notes: updatedMessage.notes.map((note: any) => ({
          id: note.id,
          content: note.content,
          author: note.author,
          createdAt: note.createdAt,
          isPrivate: note.isPrivate
        }))
      }) : null);

      setNewNote('');
      showToast('Note added successfully', 'success');
    } catch (error) {
      console.error('Error adding note:', error);
      showToast('Error adding note', 'error');
    } finally {
      setIsAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-32 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-20 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-24 gradient-shimmer rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-4 w-16 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-40 gradient-shimmer rounded" />
                  </div>
                  <div>
                    <div className="h-4 w-24 gradient-shimmer rounded mb-2" />
                    <div className="h-4 w-40 gradient-shimmer rounded" />
                  </div>
                </div>
              </div>

              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-40 gradient-shimmer rounded" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-full gradient-shimmer rounded" />
                    <div className="h-4 w-5/6 gradient-shimmer rounded" />
                    <div className="h-4 w-4/5 gradient-shimmer rounded" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-24 gradient-shimmer rounded" />
                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                      <div className="h-4 w-4 gradient-shimmer rounded" />
                      <div className="flex-1">
                        <div className="h-4 w-32 gradient-shimmer rounded mb-1" />
                        <div className="h-3 w-24 gradient-shimmer rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-24 gradient-shimmer rounded" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="h-3 w-32 gradient-shimmer rounded mb-2" />
                    <div className="space-y-2">
                      <div className="h-4 w-full gradient-shimmer rounded" />
                      <div className="h-4 w-4/5 gradient-shimmer rounded" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-32 gradient-shimmer rounded" />
                </div>
                <div className="space-y-4">
                  <div className="h-32 gradient-shimmer rounded-lg" />
                  <div className="h-10 w-24 gradient-shimmer rounded" />
                  <div className="h-10 w-32 gradient-shimmer rounded-lg" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card card-padding">
                <div className="card-header">
                  <div className="h-5 w-6 gradient-shimmer rounded" />
                  <div className="h-5 w-48 gradient-shimmer rounded" />
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
                      <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
                      <div className="h-6 w-8 gradient-shimmer rounded" />
                    </div>
                    <div>
                      <div className="h-4 w-28 gradient-shimmer rounded mb-2" />
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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contactDetails) {
    return (
      <div className="page-container">
        <div className="page-content">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <FaExclamationTriangle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Message Not Found</h2>
              <p className="text-lg mb-4 text-gray-600 dark:text-gray-400">The requested contact message could not be found.</p>
              <button 
                onClick={() => router.push('/admin/contact-messages')}
                className="btn btn-primary flex items-center gap-2 mx-auto"
              >
                <FaArrowLeft className="h-4 w-4" />
                Back to Messages
              </button>
            </div>
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
                onClick={() => router.push('/admin/contact-messages')}
                className="btn btn-primary flex items-center gap-2"
              >
                <FaArrowLeft className="h-4 w-4" />
                Back to Messages
              </button>

            </div>

            <div className="flex flex-row items-center gap-1 md:gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Message {formatMessageID(contactDetails?.id || '1')}
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
                  <FaEnvelope />
                </div>
                <h3 className="card-title">Message Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="form-label">Subject</label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{contactDetails?.subject || 'No Subject'}</p>
                </div>
                <div>
                  <label className="form-label">Category</label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{contactDetails?.category || 'Unknown'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="form-label">Created</label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {contactDetails?.createdAt ? formatDate(contactDetails.createdAt) : 'Unknown'} at{' '}
                    {contactDetails?.createdAt ? formatTime(contactDetails.createdAt) : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="form-label">Last Updated</label>
                  <p className="mt-1 text-gray-900 dark:text-gray-100">
                    {contactDetails?.lastUpdated ? formatDate(contactDetails.lastUpdated) : 'Unknown'} at{' '}
                    {contactDetails?.lastUpdated ? formatTime(contactDetails.lastUpdated) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaComments />
                </div>
                <h3 className="card-title">Customer Message</h3>
              </div>

              <div className="space-y-6">
                {(contactDetails?.messages || [])
                  .filter(message => message.type === 'customer')
                  .map((message) => (
                  <div key={message.id}>
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{message.content}</div>
                    </div>

                    {}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Attachments:</h4>
                        {message.attachments.map((attachment, index) => {

                          const attachmentUrl = attachment.url || attachment.fileUrl;
                          const filename = attachment.encryptedName || attachment.filename || 'Unknown file';
                          const mimetype = attachment.mimetype || attachment.mimeType || 'application/octet-stream';
                          const filesize = attachment.filesize || (attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : '');

                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                              {getFileIcon(mimetype)}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                                  {filename}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {filesize ? `${filesize} • ` : ''}Attachment
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
                ))}
              </div>
            </div>

            {}
            <div className="card card-padding">
              <div className="card-header">
                <div className="card-icon">
                  <FaReply />
                </div>
                <h3 className="card-title">Reply</h3>
              </div>

              <div className="space-y-6">
                {(contactDetails?.messages || []).filter(message => message.type === 'staff').length > 0 ? (
                  (contactDetails?.messages || [])
                    .filter(message => message.type === 'staff')
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((message) => (
                    <div key={message.id}>
                      <div className="mb-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {message.author} • {formatDate(message.createdAt)} at {formatTime(message.createdAt)}
                        </span>
                      </div>

                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">{message.content}</div>
                      </div>

                      {}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Attachments:</h4>
                          {message.attachments.map((attachment, index) => {

                            const attachmentUrl = attachment.url || attachment.fileUrl;
                            const filename = attachment.encryptedName || attachment.filename || 'Unknown file';
                            const mimetype = attachment.mimetype || attachment.mimeType || 'application/octet-stream';
                            const filesize = attachment.filesize || (attachment.fileSize ? `${Math.round(attachment.fileSize / 1024)} KB` : '');

                            return (
                              <div key={index} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                                {getFileIcon(mimetype)}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                                    {filename}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {filesize ? `${filesize} • ` : ''}Attachment
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FaReply className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No replied yet</p>
                  </div>
                )}
              </div>
            </div>

            {}
            {(contactDetails?.messages || []).filter(message => message.type === 'staff').length === 0 && (
              <div className="card card-padding overflow-hidden">
                <div className="card-header">
                  <div className="card-icon">
                    <FaPaperPlane />
                  </div>
                  <h3 className="card-title">Send Reply</h3>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply to the customer..."
                      rows={6}
                      className="form-field w-full min-w-0 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none max-h-48 overflow-y-auto"
                    />
                    <small className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      This reply will be sent to the customer and will update the message status to "Replied". You can only reply once.
                    </small>
                  </div>

                  {}
                  <div className="form-group">
                    <label className="form-label" htmlFor="attachments">
                      Attachments (Optional)
                    </label>
                    <input
                      type="file"
                      id="attachments"
                      ref={fileInputRef}
                      multiple
                      onChange={handleFileSelect}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-[var(--primary)] file:to-[var(--secondary)] file:text-white hover:file:from-[#4F0FD8] hover:file:to-[#A121E8] transition-all duration-200"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
                    />
                    <small className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      You can upload screenshots or other relevant files (max 5MB each).
                    </small>
                  </div>

                  {}
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Selected Files ({selectedFiles.length}):
                      </p>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex-shrink-0">
                            {getFileIcon(file.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate text-gray-900 dark:text-gray-100">
                              {file.name}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            className="flex-shrink-0 p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Remove file"
                          >
                            <FaTimes className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReplySubmit}
                      disabled={!replyContent.trim() || isReplying}
                      className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      {!isReplying && <FaPaperPlane className="h-3 w-3" />}
                      {isReplying ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {}
            {(contactDetails?.messages || []).filter(message => message.type === 'staff').length > 0 && (
              <div className="flex justify-left mt-4">
                <button
                  disabled
                  className="btn btn-primary opacity-50 cursor-not-allowed"
                >
                  Replied
                </button>
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
                  <h3 className="card-title">Customer Information</h3>
                </div>
                {showUserInfo ? <FaChevronUp /> : <FaChevronDown />}
              </div>

              {showUserInfo && (
                <div className="space-y-4">
                  <div>
                    <div className="form-label">Username</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contactDetails?.username || 'No Username'}</div>
                  </div>
                  <div>
                    <div className="form-label">Full Name</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contactDetails?.userInfo?.fullName || 'No Name'}</div>
                  </div>
                  <div>
                    <div className="form-label">Email</div>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">{contactDetails?.userInfo?.email || contactDetails?.userEmail}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700">
                    <div>
                      <div className="form-label">Total Messages</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{contactDetails?.userInfo?.totalMessages || 0}</div>
                    </div>
                    <div>
                      <div className="form-label">Open Messages</div>
                      <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{contactDetails?.userInfo?.openMessages || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card card-padding overflow-hidden">
              <div 
                className="card-header cursor-pointer flex items-center justify-between"
                onClick={() => setShowNotes(!showNotes)}
              >
                <div className="flex items-center gap-2">
                  <div className="card-icon">
                    <FaStickyNote />
                  </div>
                  <h3 className="card-title">Internal Notes ({contactDetails?.notes?.length || 0})</h3>
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
                      className="form-field w-full min-w-0 px-4 py-3 bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] dark:focus:ring-[var(--secondary)] focus:border-transparent shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 resize-none max-h-32 overflow-y-auto"
                    />
                    <small className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                      Internal notes are only visible to support staff members.
                    </small>
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || isAddingNote}
                      className="mt-2 btn btn-primary text-xs flex items-center gap-2 disabled:opacity-50"
                    >
                      {!isAddingNote && <FaPlus className="h-3 w-3" />}
                      {isAddingNote ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>

                  {}
                  <div className="space-y-3">
                    {(contactDetails?.notes || []).map((note) => (
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsPage;
