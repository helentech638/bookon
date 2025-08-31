import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface Notification {
  id: string;
  type: 'system' | 'booking' | 'user' | 'financial' | 'security';
  title: string;
  message: string;
  status: 'unread' | 'read';
  createdAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  relatedId?: string;
  relatedType?: string;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const queryParams = new URLSearchParams({
        ...filters
      });

      const response = await fetch(buildApiUrl(`/admin/notifications?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.notifications.filter((n: Notification) => n.status === 'unread').length);
      } else {
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      toast.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/admin/notifications/${notificationId}/read`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, status: 'read' as const } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Notification marked as read');
      } else {
        toast.error('Failed to mark notification as read');
      }
    } catch (error) {
      toast.error('Error updating notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      
      // Mark all unread notifications as read
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
      setUnreadCount(0);
      
      toast.success(`Marked ${unreadNotifications.length} notifications as read`);
    } catch (error) {
      toast.error('Error marking notifications as read');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      status: '',
      priority: '',
      search: ''
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'booking':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'user':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'financial':
        return <ExclamationTriangleIcon className="w-5 h-5 text-purple-500" />;
      case 'security':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-100 text-blue-800';
      case 'booking':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-yellow-100 text-yellow-800';
      case 'financial':
        return 'bg-purple-100 text-purple-800';
      case 'security':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.search && !notification.title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !notification.message.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type && notification.type !== filters.type) {
      return false;
    }
    if (filters.status && notification.status !== filters.status) {
      return false;
    }
    if (filters.priority && notification.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <BellIcon className="w-8 h-8 text-[#00806a]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  variant="outline"
                  className="text-[#00806a] border-[#00806a] hover:bg-[#00806a] hover:text-white"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FunnelIcon className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        {showFilters && (
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                >
                  <option value="">All Types</option>
                  <option value="system">System</option>
                  <option value="booking">Booking</option>
                  <option value="user">User</option>
                  <option value="financial">Financial</option>
                  <option value="security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                >
                  <option value="">All Statuses</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                >
                  <option value="">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00806a] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading notifications...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`p-6 transition-all duration-200 ${
                  notification.status === 'unread' 
                    ? 'border-l-4 border-l-[#00806a] bg-blue-50' 
                    : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className={`text-lg font-medium ${
                            notification.status === 'unread' ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {notification.actionRequired && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Action Required
                            </span>
                          )}
                        </div>

                        <p className={`text-sm ${
                          notification.status === 'unread' ? 'text-gray-800' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>

                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium border ${getPriorityColor(notification.priority)}`}>
                            {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)} Priority
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </span>
                          <span>{formatDate(notification.createdAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {notification.status === 'unread' ? (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            size="sm"
                            variant="outline"
                            className="text-[#00806a] border-[#00806a] hover:bg-[#00806a] hover:text-white"
                          >
                            <EyeIcon className="w-4 h-4 mr-1" />
                            Mark Read
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-500 flex items-center">
                            <EyeSlashIcon className="w-4 h-4 mr-1" />
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredNotifications.length === 0 && (
              <Card className="p-12 text-center">
                <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {filters.search || filters.type || filters.status || filters.priority 
                    ? 'No notifications match your filters' 
                    : 'No notifications yet'}
                </h3>
                <p className="text-gray-500 mb-4">
                  {filters.search || filters.type || filters.status || filters.priority 
                    ? 'Try adjusting your filters or search terms.' 
                    : 'You\'ll see system updates, user activities, and important alerts here.'}
                </p>
                {(filters.search || filters.type || filters.status || filters.priority) && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="text-[#00806a] border-[#00806a] hover:bg-[#00806a] hover:text-white"
                  >
                    Clear Filters
                  </Button>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
