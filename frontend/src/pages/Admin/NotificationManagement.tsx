import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/Card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/SelectNew';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/Dialog';
import { RefreshCw, Bell, Send, Eye, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '../../components/layout/AdminLayout';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  priority: string;
  channels: string[];
  userId?: string;
  venueId?: string;
  status: string;
  read: boolean;
  created_at: string;
  sent_at?: string;
  read_at?: string;
  error?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  // New notification form
  const [newNotification, setNewNotification] = useState({
    userId: '',
    venueId: '',
    type: 'system_alert',
    title: '',
    message: '',
    priority: 'medium',
    channels: ['in_app']
  });

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    priority: '',
    limit: '50',
    offset: '0'
  });

  useEffect(() => {
    fetchNotifications();
    fetchNotificationStats();
  }, [filters]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/v1/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const response = await fetch('/api/v1/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const sendNotification = async () => {
    try {
      setSending(true);
      const response = await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newNotification)
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      toast.success('Notification sent successfully');
      setNewNotification({
        userId: '',
        venueId: '',
        type: 'system_alert',
        title: '',
        message: '',
        priority: 'medium',
        channels: ['in_app']
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      toast.success('Notification marked as read');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      toast.success('Notification deleted successfully');
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getStatusIcon = (status: string, read: boolean) => {
    if (status === 'failed') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (status === 'sent') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (read) return <CheckCircle className="h-4 w-4 text-blue-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: string, read: boolean) => {
    if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
    if (status === 'sent') return <Badge variant="default">Sent</Badge>;
    if (read) return <Badge variant="secondary">Read</Badge>;
    return <Badge variant="outline">Unread</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      urgent: 'destructive'
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants] || 'default'}>
      {priority.toUpperCase()}
    </Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: '0' // Reset offset when filters change
    }));
  };

  const loadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: (parseInt(prev.offset) + parseInt(prev.limit)).toString()
    }));
  };

  return (
    <AdminLayout title="Notification Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Dialog>
            <DialogTrigger>
              <Button>
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send New Notification</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newNotification.type} onValueChange={(value: string) => setNewNotification(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system_alert">System Alert</SelectItem>
                      <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                      <SelectItem value="payment_success">Payment Success</SelectItem>
                      <SelectItem value="payment_failed">Payment Failed</SelectItem>
                      <SelectItem value="activity_reminder">Activity Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={newNotification.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Notification title"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    value={newNotification.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newNotification.priority} onValueChange={(value: string) => setNewNotification(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={sendNotification} disabled={sending} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Notifications</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Sent</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.byStatus.find(s => s.status === 'sent')?.count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.byStatus.find(s => s.status === 'failed')?.count || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={filters.type} onValueChange={(value: string) => handleFilterChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="system_alert">System Alert</SelectItem>
                  <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                  <SelectItem value="payment_success">Payment Success</SelectItem>
                  <SelectItem value="payment_failed">Payment Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value: string) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={filters.priority} onValueChange={(value: string) => handleFilterChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Limit</label>
              <Select value={filters.limit} onValueChange={(value: string) => handleFilterChange('limit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading notifications...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(notification.status, notification.read)}
                          {getStatusBadge(notification.status, notification.read)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{notification.type}</TableCell>
                      <TableCell>{notification.title}</TableCell>
                      <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          {notification.channels.map((channel) => (
                            <Badge key={channel} variant="outline" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(notification.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedNotification(notification)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {notifications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications found
                </div>
              )}
              
              {notifications.length > 0 && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={loadMore}>
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Notification Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Type</label>
                  <p className="font-medium">{selectedNotification.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <p>{getPriorityBadge(selectedNotification.priority)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="font-medium">{selectedNotification.title}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="whitespace-pre-wrap">{selectedNotification.message}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Channels</label>
                <div className="flex space-x-2">
                  {selectedNotification.channels.map((channel) => (
                    <Badge key={channel} variant="outline">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>{formatDate(selectedNotification.created_at)}</p>
                </div>
                {selectedNotification.sent_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sent</label>
                    <p>{formatDate(selectedNotification.sent_at)}</p>
                  </div>
                )}
              </div>
              
              {selectedNotification.error && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Error</label>
                  <p className="text-red-600">{selectedNotification.error}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </AdminLayout>
  );
};

export default NotificationManagement;
