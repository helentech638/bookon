import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  DocumentDuplicateIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { buildApiUrl } from '../../config/api';
import CreateTemplateModal from '../../components/Templates/CreateTemplateModal';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'notification';
  subject?: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const TemplatesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(buildApiUrl(`/business/templates?search=${searchTerm}&type=${typeFilter}&status=${statusFilter}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      if (data.success) {
        // Transform API data to match our interface
        const transformedTemplates: Template[] = data.data.templates.map((template: any) => ({
          id: template.id,
          name: template.name,
          type: template.trigger,
          subject: template.subjectTemplate,
          content: template.bodyHtmlTemplate,
          isActive: template.active,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        }));
        setTemplates(transformedTemplates);
      } else {
        throw new Error(data.message || 'Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Templates loading timeout - please refresh');
      } else {
        toast.error('Failed to load templates');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && template.isActive) ||
                         (statusFilter === 'inactive' && !template.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const token = authService.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(buildApiUrl(`/business/templates/${templateId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete template');
        }

        const data = await response.json();
        if (data.success) {
          setTemplates(prev => prev.filter(t => t.id !== templateId));
          toast.success('Template deleted successfully');
        } else {
          throw new Error(data.message || 'Failed to delete template');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  const handleToggleStatus = async (templateId: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(buildApiUrl(`/business/templates/${templateId}/toggle`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle template status');
      }

      const data = await response.json();
      if (data.success) {
        const updatedTemplate = data.data;
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? { 
            ...t, 
            isActive: updatedTemplate.active,
            updatedAt: updatedTemplate.updatedAt
          } : t
        ));
        toast.success('Template status updated');
      } else {
        throw new Error(data.message || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
  };

  if (loading) {
    return (
      <BusinessLayout user={user}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600 mt-1">Manage your email, SMS, and notification templates</p>
          </div>
          <Button className="flex items-center gap-2" onClick={handleCreateTemplate}>
            <PlusIcon className="h-5 w-5" />
            Create Template
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="notification">Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <DocumentDuplicateIcon className="h-8 w-8 text-[#00806a]" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.type === 'email' ? 'bg-blue-100 text-blue-800' :
                      template.type === 'sms' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {template.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(template.id)}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      template.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>

              {template.subject && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Subject:</p>
                  <p className="text-sm text-gray-600">{template.subject}</p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Content:</p>
                <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-xs text-gray-500">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-blue-600">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card className="p-12 text-center">
            <DocumentDuplicateIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first template'
              }
            </p>
            <Button onClick={handleCreateTemplate}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Template
            </Button>
          </Card>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <CreateTemplateModal
            isOpen={showCreateModal}
            onClose={handleCloseCreateModal}
            onSuccess={() => {
              setShowCreateModal(false);
              fetchTemplates(); // Refresh the templates list
              toast.success('Template created successfully');
            }}
          />
        )}
      </div>
    </BusinessLayout>
  );
};

export default TemplatesPage;
