import React, { useState, useEffect } from 'react';
import { 
  EnvelopeIcon, 
  MegaphoneIcon, 
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import TemplateModal from '../../components/Communications/TemplateModal';
import BroadcastModal from '../../components/Communications/BroadcastModal';

interface EmailTemplate {
  id: string;
  name: string;
  trigger: string;
  subjectTemplate: string;
  bodyHtmlTemplate: string;
  bodyTextTemplate?: string;
  active: boolean;
  brandOverrides?: any;
  placeholders: string[];
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  _count: {
    emails: number;
  };
}

interface Broadcast {
  id: string;
  title: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  audienceQuery: any;
  channels: string[];
  status: string;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  _count: {
    emails: number;
  };
}

interface Email {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  messageType: string;
  lastStatus: string;
  lastStatusAt?: string;
  createdAt: string;
  parent: {
    firstName: string;
    lastName: string;
  };
  booking?: {
    activity: {
      title: string;
    };
  };
  broadcast?: {
    title: string;
  };
  template?: {
    name: string;
  };
}

const CommunicationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'broadcasts' | 'emails'>('templates');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      let response;
      switch (activeTab) {
        case 'templates':
          response = await fetch('/api/v1/communications/templates', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setTemplates(data.data || []);
          }
          break;
        case 'broadcasts':
          response = await fetch('/api/v1/communications/broadcasts', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setBroadcasts(data.data || []);
          }
          break;
        case 'emails':
          response = await fetch('/api/v1/communications/emails', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setEmails(data.data || []);
          }
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'opened':
      case 'clicked':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'bounced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'opened':
      case 'clicked':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
      case 'scheduled':
        return <ClockIcon className="w-4 h-4" />;
      case 'failed':
      case 'bounced':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ExclamationTriangleIcon className="w-4 h-4" />;
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

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async (templateData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const url = selectedTemplate 
        ? `/api/v1/communications/templates/${selectedTemplate.id}`
        : '/api/v1/communications/templates';
      
      const method = selectedTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        await loadData(); // Reload data
        setShowTemplateModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save template');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const response = await fetch(`/api/v1/communications/templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await loadData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete template');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleCreateBroadcast = () => {
    setSelectedBroadcast(null);
    setShowBroadcastModal(true);
  };

  const handleEditBroadcast = (broadcast: Broadcast) => {
    setSelectedBroadcast(broadcast);
    setShowBroadcastModal(true);
  };

  const handleSaveBroadcast = async (broadcastData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const url = selectedBroadcast 
        ? `/api/v1/communications/broadcasts/${selectedBroadcast.id}`
        : '/api/v1/communications/broadcasts';
      
      const method = selectedBroadcast ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(broadcastData)
      });

      if (response.ok) {
        await loadData(); // Reload data
        setShowBroadcastModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save broadcast');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save broadcast');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600">Manage email templates, broadcasts, and track delivery</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'templates' && (
            <button 
              onClick={handleCreateTemplate}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>New Template</span>
            </button>
          )}
          {activeTab === 'broadcasts' && (
            <button 
              onClick={handleCreateBroadcast}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Send Broadcast</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'templates', name: 'Email Templates', icon: DocumentTextIcon },
            { id: 'broadcasts', name: 'Broadcasts', icon: MegaphoneIcon },
            { id: 'emails', name: 'Email Log', icon: EnvelopeIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="p-6">
            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Email Templates</h3>
                  <span className="text-sm text-gray-500">{templates.length} templates</span>
                </div>
                
                {templates.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No email templates found</p>
                    <p className="text-sm text-gray-500">Create your first template to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <div className="flex items-center space-x-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {template.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{template.trigger}</p>
                        <p className="text-sm text-gray-500 mb-4">{template.subjectTemplate}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{template._count.emails} sent</span>
                          <span>{formatDate(template.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4">
                          <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center space-x-1">
                            <EyeIcon className="w-4 h-4" />
                            <span>Preview</span>
                          </button>
                          <button 
                            onClick={() => handleEditTemplate(template)}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 flex items-center justify-center space-x-1"
                          >
                            <PencilIcon className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="bg-red-100 text-red-700 px-3 py-2 rounded text-sm hover:bg-red-200"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Broadcasts Tab */}
            {activeTab === 'broadcasts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Broadcasts</h3>
                  <span className="text-sm text-gray-500">{broadcasts.length} broadcasts</span>
                </div>
                
                {broadcasts.length === 0 ? (
                  <div className="text-center py-8">
                    <MegaphoneIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No broadcasts found</p>
                    <p className="text-sm text-gray-500">Send your first broadcast to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channels</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {broadcasts.map((broadcast) => (
                          <tr key={broadcast.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{broadcast.title}</div>
                                <div className="text-sm text-gray-500">{broadcast.subject}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-1">
                                {broadcast.channels.map((channel) => (
                                  <span key={channel} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                    {channel}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(broadcast.status)}`}>
                                {getStatusIcon(broadcast.status)}
                                <span className="ml-1">{broadcast.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {broadcast._count.emails}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {broadcast.sentAt ? formatDate(broadcast.sentAt) : formatDate(broadcast.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditBroadcast(broadcast)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Email Log Tab */}
            {activeTab === 'emails' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Email Log</h3>
                  <span className="text-sm text-gray-500">{emails.length} emails</span>
                </div>
                
                {emails.length === 0 ? (
                  <div className="text-center py-8">
                    <EnvelopeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No emails found</p>
                    <p className="text-sm text-gray-500">Emails will appear here as they are sent</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {emails.map((email) => (
                          <tr key={email.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {email.parent.firstName} {email.parent.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{email.toEmail}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{email.subject}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                {email.messageType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(email.lastStatus)}`}>
                                {getStatusIcon(email.lastStatus)}
                                <span className="ml-1">{email.lastStatus}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(email.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-blue-600 hover:text-blue-900 mr-3">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        template={selectedTemplate}
        onSave={handleSaveTemplate}
        onDelete={handleDeleteTemplate}
      />

      <BroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        broadcast={selectedBroadcast}
        onSave={handleSaveBroadcast}
      />
    </div>
  );
};

export default CommunicationsPage;
