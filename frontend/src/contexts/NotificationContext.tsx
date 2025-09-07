import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { authService } from '../services/authService';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  socket: Socket | null;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  connect: () => void;
  disconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isVercelProduction] = useState(() => window.location.hostname.includes('vercel.app'));

  // Connect to WebSocket
  const connect = () => {
    if (socket?.connected) return;

    // On Vercel, don't attempt WebSocket connections at all
    if (isVercelProduction) {
      console.log('Running on Vercel - WebSocket disabled, using HTTP polling for notifications');
      setIsConnected(false);
      return;
    }

    const token = authService.getToken();
    const user = authService.getUser();

    if (!token || !user) {
      console.warn('No token or user found for WebSocket connection');
      return;
    }

    // Limit connection attempts to prevent infinite loops
    if (connectionAttempts >= 3) {
      console.warn('Max WebSocket connection attempts reached, giving up');
      return;
    }

    setConnectionAttempts(prev => prev + 1);
    
    const newSocket = io(import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || window.location.origin, {
      auth: {
        token,
        userId: user.id
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
      reconnection: false, // Disable automatic reconnection
      reconnectionAttempts: 0,
      reconnectionDelay: 0
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with the server
      newSocket.emit('authenticate', {
        userId: user.id,
        token: token
      });
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('WebSocket connection error:', error.message);
      setIsConnected(false);
      // Don't attempt reconnection - let it fail gracefully
    });

    newSocket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    newSocket.on('authentication_failed', (error) => {
      console.error('WebSocket authentication failed:', error);
      disconnect();
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('booking_update', (data) => {
      console.log('Booking update received:', data);
      // Handle booking updates
    });

    newSocket.on('payment_update', (data) => {
      console.log('Payment update received:', data);
      // Handle payment updates
    });

    newSocket.on('capacity_updated', (data) => {
      console.log('Capacity update received:', data);
      // Handle capacity updates
    });

    newSocket.on('system_alert', (data) => {
      console.log('System alert received:', data);
      // Handle system alerts
    });

    newSocket.on('maintenance_notification', (data) => {
      console.log('Maintenance notification received:', data);
      // Handle maintenance notifications
    });

    newSocket.on('server_restart', (data) => {
      console.log('Server restart notification received:', data);
      // Handle server restart notifications
    });

    setSocket(newSocket);
  };

  // Disconnect from WebSocket
  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = authService.getToken();
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.data.notifications || []);
            setUnreadCount(data.data.unreadCount || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  // HTTP polling fallback for Vercel
  useEffect(() => {
    if (!isVercelProduction) return;

    const pollNotifications = async () => {
      try {
        const token = authService.getToken();
        if (!token) return;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api/v1'}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.data.notifications || []);
            setUnreadCount(data.data.unreadCount || 0);
          }
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };

    // Poll every 30 seconds on Vercel
    const interval = setInterval(pollNotifications, 30000);
    
    // Initial poll
    pollNotifications();

    return () => clearInterval(interval);
  }, [isVercelProduction]);

  // Connect to WebSocket when user is authenticated (non-Vercel)
  useEffect(() => {
    if (isVercelProduction) return;

    const user = authService.getUser();
    if (user && authService.isAuthenticated()) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [isVercelProduction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    socket,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    connect,
    disconnect,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
