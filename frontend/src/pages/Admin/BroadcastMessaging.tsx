import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  MegaphoneIcon,
  ClockIcon,
  UsersIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface BroadcastMessage {
  id: string;
  subject: string;
  message: string;
  targetUsers: string;
  templateId?: string;
  scheduledFor: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: string;
  sentCount?: number;
  failedCount?: number;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

const BroadcastMessaging: React.FC = () => {
  const [messages, setMessages] = useState<BroadcastMessage[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<BroadcastMessage | null>(null);
  
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    targetUsers: 'all',
    templateId: '',
    scheduledFor: '',
    useTemplate: false
  });

  useEffect(() => {
    fetchMessages();
    fetchTemplates();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // For now, use mock data
      // In production, this would fetch from the API
      const mockMessages: BroadcastMessage[] = [
        {
          id: '1',
          subject: 'Welcome to BookOn!',
          message: 'We\'re excited to have you on board. Start exploring our activities today!',
          targetUsers: 'all',
          scheduledFor: new Date().toISOString(),
          status: 'sent',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sentCount: 1250,
          failedCount: 3
        },
        {
          id: '2',
          subject: 'New Activities Available',
          message: 'Check out our latest swimming and tennis lessons for kids!',
          targetUsers: 'active',
          scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'scheduled',
          createdAt: new Date().toISOString()
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      toast.error('Error fetching messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl('/admin/email-templates'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateMessage = () => {
    setFormData({
      subject: '',
      message: '',
      targetUsers: 'all',
      templateId: '',
      scheduledFor: '',
      useTemplate: false
    });
    setShowCreateModal(true);
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        templateId,
        subject: template.subject,
        message: template.content,
        useTemplate: true
      }));
    }
  };

  const handleSendMessage = async () => {
    if (!formData.subject || !formData.message) {
      toast.error('Subject and message are required');
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl('/admin/broadcast-message'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: formData.subject,
          message: formData.message,
          targetUsers: formData.targetUsers,
          templateId: formData.templateId || undefined,
          scheduledFor: formData.scheduledFor || new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to local state
        const newMessage: BroadcastMessage = {
          id: data.data.id,
          subject: formData.subject,
          message: formData.message,
          targetUsers: formData.targetUsers,
          templateId: formData.templateId,
          scheduledFor: formData.scheduledFor || new Date().toISOString(),
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };

        setMessages(prev => [newMessage, ...prev]);
        toast.success('Message scheduled successfully');
        setShowCreateModal(false);
        setFormData({
          subject: '',
          message: '',
          targetUsers: 'all',
          templateId: '',
          scheduledFor: '',
          useTemplate: false
        });
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('Error sending message');
    }
  };

  const handlePreviewMessage = () => {
    if (!formData.subject || !formData.message) {
      toast.error('Subject and message are required');
      return;
    }

    setPreviewMessage({
      id: 'preview',
      subject: formData.subject,
      message: formData.message,
      targetUsers: formData.targetUsers,
      templateId: formData.templateId,
      scheduledFor: formData.scheduledFor || new Date().toISOString(),
      status: 'draft',
      createdAt: new Date().toISOString()
    });
    setShowPreviewModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckIcon className="w-4 h-4" />;
      case 'scheduled':
        return <ClockIcon className="w-4 h-4" />;
      case 'draft':
        return <EyeIcon className="w-4 h-4" />;
      case 'failed':
        return <XMarkIcon className="w-4 h-4" />;
      default:
        return <EyeIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTargetUsersLabel = (target: string) => {
    switch (target) {
      case 'all':
        return 'All Users';
      case 'active':
        return 'Active Users';
      case 'venue_owners':
        return 'Venue Owners';
      case 'admins':
        return 'Administrators';
      default:
        return target;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broadcast Messaging</h1>
              <p className="text-gray-600">Send messages to users and manage communication campaigns</p>
            </div>
            <Button
              onClick={handleCreateMessage}
              className="bg-[#00806a] hover:bg-[#006d5a] text-white"
            >
              <MegaphoneIcon className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00806a] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading messages...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <Card key={message.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <MegaphoneIcon className="w-6 h-6 text-[#00806a]" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{message.subject}</h3>
                        <p className="text-sm text-gray-500">
                          To: {getTargetUsersLabel(message.targetUsers)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-700 line-clamp-2">{message.message}</p>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(message.scheduledFor)}
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-1" />
                        {message.sentCount ? `${message.sentCount} sent` : 'Not sent yet'}
                        {message.failedCount && message.failedCount > 0 && (
                          <span className="ml-2 text-red-600">({message.failedCount} failed)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                      {getStatusIcon(message.status)}
                      <span className="ml-1 capitalize">{message.status}</span>
                    </span>
                  </div>
                </div>
              </Card>
            ))}

            {messages.length === 0 && (
              <Card className="p-12 text-center">
                <MegaphoneIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500 mb-4">Start communicating with your users by sending your first broadcast message.</p>
                <Button
                  onClick={handleCreateMessage}
                  className="bg-[#00806a] hover:bg-[#006d5a] text-white"
                >
                  <MegaphoneIcon className="w-4 h-4 mr-2" />
                  Send First Message
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Create Message Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Broadcast Message</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Message Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Users</label>
                    <select
                      value={formData.targetUsers}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                    >
                      <option value="all">All Users</option>
                      <option value="active">Active Users Only</option>
                      <option value="venue_owners">Venue Owners Only</option>
                      <option value="admins">Administrators Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Use Email Template</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.useTemplate}
                        onChange={(e) => setFormData(prev => ({ ...prev, useTemplate: e.target.checked }))}
                        className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">Use existing template</span>
                    </div>
                  </div>

                  {formData.useTemplate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Template</label>
                      <select
                        value={formData.templateId}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                      >
                        <option value="">Choose a template...</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                      placeholder="Enter message subject..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                    <textarea
                      rows={8}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                      placeholder="Enter your message content here..."
                    />
                  </div>
                </div>

                {/* Right Column - Scheduling & Preview */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Message</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledFor}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduledFor: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to send immediately
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Preview</label>
                    <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                      <div className="mb-2">
                        <strong>To:</strong> {getTargetUsersLabel(formData.targetUsers)}
                      </div>
                      <div className="mb-2">
                        <strong>Subject:</strong> {formData.subject || 'No subject'}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {formData.message || 'No message content'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handlePreviewMessage}
                      variant="outline"
                      className="w-full mb-2"
                      disabled={!formData.subject || !formData.message}
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      Preview Message
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  className="bg-[#00806a] hover:bg-[#006d5a] text-white"
                  disabled={!formData.subject || !formData.message}
                >
                  <MegaphoneIcon className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewMessage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Message Preview</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                  <p className="text-sm text-gray-900">{getTargetUsersLabel(previewMessage.targetUsers)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-sm text-gray-900">{previewMessage.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {previewMessage.message}
                    </div>
                  </div>
                </div>

                {previewMessage.scheduledFor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
                    <p className="text-sm text-gray-900">{formatDate(previewMessage.scheduledFor)}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setShowPreviewModal(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BroadcastMessaging;
