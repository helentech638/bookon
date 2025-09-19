import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { 
  BellIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channel: 'email' | 'sms' | 'push' | 'in_app';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  targetAudience: 'all' | 'specific_users' | 'venue_staff' | 'customers';
  scheduledAt?: string;
  sentAt?: string;
  readCount: number;
  totalRecipients: number;
  createdAt: string;
  updatedAt: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'booking_confirmation' | 'booking_reminder' | 'cancellation' | 'payment' | 'general';
  isDefault: boolean;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
  bookingConfirmations: boolean;
  bookingReminders: boolean;
  paymentNotifications: boolean;
  cancellationNotifications: boolean;
}

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    bookingConfirmations: true,
    bookingReminders: true,
    paymentNotifications: true,
    cancellationNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'settings'>('notifications');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'success' | 'warning' | 'error',
    channel: 'email' as 'email' | 'sms' | 'push' | 'in_app',
    targetAudience: 'all' as 'all' | 'specific_users' | 'venue_staff' | 'customers',
    scheduledAt: ''
  });

  useEffect(() => {
    fetchNotifications();
    fetchTemplates();
    fetchSettings();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'New Booking Received',
          message: 'You have received a new booking for Swimming Lessons on January 20th at 10:00 AM.',
          type: 'success',
          channel: 'email',
          status: 'sent',
          targetAudience: 'venue_staff',
          sentAt: '2024-01-15T10:30:00Z',
          readCount: 3,
          totalRecipients: 5,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          title: 'Payment Processing Issue',
          message: 'There was an issue processing payment for booking #12345. Please review.',
          type: 'error',
          channel: 'email',
          status: 'sent',
          targetAudience: 'venue_staff',
          sentAt: '2024-01-15T09:15:00Z',
          readCount: 2,
          totalRecipients: 3,
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:15:00Z'
        },
        {
          id: '3',
          title: 'Weekly Activity Reminder',
          message: 'Don\'t forget! Your weekly swimming lesson is tomorrow at 10:00 AM.',
          type: 'info',
          channel: 'email',
          status: 'scheduled',
          targetAudience: 'customers',
          scheduledAt: '2024-01-20T08:00:00Z',
          readCount: 0,
          totalRecipients: 0,
          createdAt: '2024-01-15T14:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z'
        },
        {
          id: '4',
          title: 'Venue Maintenance Notice',
          message: 'The main sports centre will be closed for maintenance on January 25th.',
          type: 'warning',
          channel: 'push',
          status: 'draft',
          targetAudience: 'all',
          readCount: 0,
          totalRecipients: 0,
          createdAt: '2024-01-15T16:00:00Z',
          updatedAt: '2024-01-15T16:00:00Z'
        }
      ];
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Mock templates - replace with actual API call
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Booking Confirmation',
          subject: 'Booking Confirmed - {{activity_name}}',
          content: 'Your booking for {{activity_name}} on {{date}} at {{time}} has been confirmed. Please arrive 10 minutes early.',
          type: 'booking_confirmation',
          isDefault: true
        },
        {
          id: '2',
          name: 'Booking Reminder',
          subject: 'Reminder: {{activity_name}} Tomorrow',
          content: 'This is a friendly reminder that you have {{activity_name}} scheduled for tomorrow at {{time}}. See you there!',
          type: 'booking_reminder',
          isDefault: true
        },
        {
          id: '3',
          name: 'Cancellation Notice',
          subject: 'Booking Cancelled - {{activity_name}}',
          content: 'Your booking for {{activity_name}} on {{date}} has been cancelled. If you have any questions, please contact us.',
          type: 'cancellation',
          isDefault: true
        },
        {
          id: '4',
          name: 'Payment Confirmation',
          subject: 'Payment Received - {{activity_name}}',
          content: 'Thank you! We have received your payment of £{{amount}} for {{activity_name}}. Your booking is confirmed.',
          type: 'payment',
          isDefault: true
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      // Mock settings - replace with actual API call
      // Settings are already initialized in state
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircleIcon;
      case 'error': return XCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'info': return InformationCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return EnvelopeIcon;
      case 'sms': return ChatBubbleLeftRightIcon;
      case 'push': return BellIcon;
      case 'in_app': return MegaphoneIcon;
      default: return BellIcon;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNotification) {
        // Update existing notification
        const updatedNotification = { 
          ...editingNotification, 
          ...formData,
          updatedAt: new Date().toISOString()
        };
        setNotifications(prev => 
          prev.map(notification => notification.id === editingNotification.id ? updatedNotification : notification)
        );
        toast.success('Notification updated successfully');
      } else {
        // Create new notification
        const newNotification: Notification = {
          id: Date.now().toString(),
          ...formData,
          status: 'draft',
          readCount: 0,
          totalRecipients: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setNotifications(prev => [...prev, newNotification]);
        toast.success('Notification created successfully');
      }
      
      setShowCreateModal(false);
      setEditingNotification(null);
      resetForm();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Failed to save notification');
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingNotification(notification);
    setFormData({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      channel: notification.channel,
      targetAudience: notification.targetAudience,
      scheduledAt: notification.scheduledAt || ''
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (notificationId: string) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
        toast.success('Notification deleted successfully');
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
      }
    }
  };

  const handleSend = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { 
                ...notification, 
                status: 'sent', 
                sentAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : notification
        )
      );
      toast.success('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  };

  const handleSaveSettings = async () => {
    try {
      // Save settings to API
      toast.success('Notification settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      channel: 'email',
      targetAudience: 'all',
      scheduledAt: ''
    });
  };

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">Manage notifications and communication settings</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Notification
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'notifications', label: 'Notifications', icon: BellIcon },
            { id: 'templates', label: 'Templates', icon: DocumentTextIcon },
            { id: 'settings', label: 'Settings', icon: CogIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const TypeIcon = getTypeIcon(notification.type);
              const ChannelIcon = getChannelIcon(notification.channel);
              
              return (
                <Card key={notification.id}>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <TypeIcon className={`h-5 w-5 ${
                            notification.type === 'success' ? 'text-green-500' :
                            notification.type === 'error' ? 'text-red-500' :
                            notification.type === 'warning' ? 'text-yellow-500' :
                            'text-blue-500'
                          }`} />
                          <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                            {notification.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <ChannelIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Channel:</span>
                            <span className="font-medium capitalize">{notification.channel}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <UserGroupIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Audience:</span>
                            <span className="font-medium">{notification.targetAudience.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Read:</span>
                            <span className="font-medium">{notification.readCount}/{notification.totalRecipients}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium">{new Date(notification.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {notification.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSend(notification.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Send
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(notification)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                        {template.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-600">Subject:</span>
                          <p className="text-sm text-gray-900">{template.subject}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Content:</span>
                          <p className="text-sm text-gray-900">{template.content}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            title: template.subject,
                            message: template.content
                          }));
                          setShowCreateModal(true);
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Communication Channels</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications' },
                        { key: 'smsNotifications', label: 'SMS Notifications' },
                        { key: 'pushNotifications', label: 'Push Notifications' },
                        { key: 'marketingEmails', label: 'Marketing Emails' }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={setting.key}
                            checked={settings[setting.key as keyof NotificationSettings]}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              [setting.key]: e.target.checked
                            }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label htmlFor={setting.key} className="ml-2 text-sm text-gray-700">
                            {setting.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Automatic Notifications</h4>
                    <div className="space-y-2">
                      {[
                        { key: 'bookingConfirmations', label: 'Booking Confirmations' },
                        { key: 'bookingReminders', label: 'Booking Reminders' },
                        { key: 'paymentNotifications', label: 'Payment Notifications' },
                        { key: 'cancellationNotifications', label: 'Cancellation Notifications' }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center">
                          <input
                            type="checkbox"
                            id={setting.key}
                            checked={settings[setting.key as keyof NotificationSettings]}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              [setting.key]: e.target.checked
                            }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label htmlFor={setting.key} className="ml-2 text-sm text-gray-700">
                            {setting.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={handleSaveSettings} className="bg-green-600 hover:bg-green-700">
                      Save Settings
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingNotification ? 'Edit Notification' : 'Create New Notification'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter notification title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    placeholder="Enter notification message"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <Select
                      value={formData.type}
                      onChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                    >
                      <option value="info">Information</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Channel
                    </label>
                    <Select
                      value={formData.channel}
                      onChange={(value) => setFormData(prev => ({ ...prev, channel: value as any }))}
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="push">Push Notification</option>
                      <option value="in_app">In-App</option>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <Select
                    value={formData.targetAudience}
                    onChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value as any }))}
                  >
                    <option value="all">All Users</option>
                    <option value="specific_users">Specific Users</option>
                    <option value="venue_staff">Venue Staff</option>
                    <option value="customers">Customers Only</option>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule (Optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Leave empty to send immediately
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingNotification(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingNotification ? 'Update Notification' : 'Create Notification'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
};

export default NotificationsPage;
