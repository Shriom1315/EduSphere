import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle, Clock, User, BookOpen, FileText, Calendar } from 'lucide-react';
import { getStorageData, setStorageData } from '../../utils/mockData';
import { getCurrentUser } from '../../utils/auth';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'grade' | 'attendance' | 'notice';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: {
    assignmentId?: string;
    gradeId?: string;
    noticeId?: string;
    className?: string;
    subjectName?: string;
  };
}

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      const allNotifications = getStorageData<Notification>('edusphere_notifications');
      const userNotifications = allNotifications
        .filter(n => n.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50); // Keep only latest 50 notifications

      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    try {
      const allNotifications = getStorageData<Notification>('edusphere_notifications');
      const updatedNotifications = allNotifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      setStorageData('edusphere_notifications', updatedNotifications);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      const allNotifications = getStorageData<Notification>('edusphere_notifications');
      const updatedNotifications = allNotifications.map(n =>
        n.userId === currentUser.id ? { ...n, read: true } : n
      );
      
      setStorageData('edusphere_notifications', updatedNotifications);
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = (notificationId: string) => {
    try {
      const allNotifications = getStorageData<Notification>('edusphere_notifications');
      const updatedNotifications = allNotifications.filter(n => n.id !== notificationId);
      
      setStorageData('edusphere_notifications', updatedNotifications);
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'assignment':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'grade':
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case 'attendance':
        return <User className="w-5 h-5 text-orange-600" />;
      case 'notice':
        return <Bell className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'assignment':
        return 'bg-blue-50 border-blue-200';
      case 'grade':
        return 'bg-purple-50 border-purple-200';
      case 'attendance':
        return 'bg-orange-50 border-orange-200';
      case 'notice':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatNotificationTime = (createdAt: string) => {
    const date = new Date(createdAt);
    
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      // In a real app, this would navigate to the specific page
      console.log('Navigate to:', notification.actionUrl);
    }
    
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors group"
      >
        <Bell className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center px-1">
            <span className="text-xs text-white font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[32rem] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No notifications yet</p>
                  <p className="text-sm text-gray-500 mt-1">You'll see updates about assignments, grades, and announcements here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`relative px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {notification.title}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-gray-500">
                                {formatNotificationTime(notification.createdAt)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                                title="Delete notification"
                              >
                                <X className="w-3 h-3 text-gray-500" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          {notification.metadata && (
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              {notification.metadata.className && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {notification.metadata.className}
                                </span>
                              )}
                              {notification.metadata.subjectName && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {notification.metadata.subjectName}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // In a real app, this would navigate to a full notifications page
                    console.log('View all notifications');
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};