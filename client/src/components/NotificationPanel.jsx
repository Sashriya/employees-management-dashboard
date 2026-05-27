// client/src/components/NotificationPanel.jsx
import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import toast from 'react-hot-toast';

const NotificationPanel = ({ isOpen, onClose, userRole, userEmail, userDepartment }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      let response;
      if (userRole === 'admin') {
        response = await notificationService.getAll();
      } else {
        response = await notificationService.getAll({
          assignedTo: userEmail,
          department: userDepartment
        });
      }
      setNotifications(response?.data?.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      const saved = JSON.parse(localStorage.getItem('ems_notifications') || '[]');
      setNotifications(saved);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
      const updated = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(updated);
      localStorage.setItem('ems_notifications', JSON.stringify(updated));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error:', error);
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      localStorage.setItem('ems_notifications', JSON.stringify(updated));
      toast.success('All notifications marked as read');
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await notificationService.clearAll();
      setNotifications([]);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error:', error);
      localStorage.setItem('ems_notifications', JSON.stringify([]));
      setNotifications([]);
      toast.success('All notifications cleared');
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'assignment': return '📋';
      case 'completion': return '✅';
      case 'update': return '🔄';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type, read) => {
    if (read) return 'bg-white';
    switch(type) {
      case 'assignment': return 'bg-blue-50';
      case 'completion': return 'bg-green-50';
      case 'update': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-md h-full shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Notifications</h2>
              <p className="text-xs text-blue-100">
                {unreadCount} unread • {notifications.length} total
              </p>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 p-1 rounded transition"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="h-16 w-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">New notifications will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition ${getNotificationColor(notification.type, notification.read)}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <button
              onClick={clearAll}
              className="w-full text-center text-sm text-red-600 hover:text-red-700 py-2 transition"
            >
              Clear All Notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;