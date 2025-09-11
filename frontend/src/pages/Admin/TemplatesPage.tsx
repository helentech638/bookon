import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  EyeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CurrencyPoundIcon,
  TagIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';
import AdminLayout from '../../components/layout/AdminLayout';
import CreateTemplateModal from '../../components/Templates/CreateTemplateModal';
import CreateCourseModal from '../../components/Templates/CreateCourseModal';
import EditTemplateModal from '../../components/Templates/EditTemplateModal';

interface Template {
  id: string;
  name: string;
  type: string;
  years: string;
  description?: string;
  defaultPrice: number;
  defaultCapacity: number;
  requiresPhotoConsent: boolean;
  requiresMedicalReminder: boolean;
  tags: string[];
  image?: string;
  isActive: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
  _count: {
    activities: number;
  };
}

const TemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterYears, setFilterYears] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!authService.hasRole('admin')) {
      navigate('/dashboard');
      return;
    }

    fetchTemplates();
  }, [navigate]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      const token = authService.getToken();
      if (!token) return;

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterYears !== 'all') params.append('years', filterYears);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(buildApiUrl(`/templates?${params.toString()}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        console.log(`Templates loaded in ${loadTime.toFixed(2)}ms`);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
      console.error('Templates fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTemplates();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterType, filterYears, filterStatus]);

  const handleArchiveTemplate = async (templateId: string) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(`/templates/${templateId}/archive`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Template archived successfully');
        fetchTemplates();
      } else {
        throw new Error('Failed to archive template');
      }
    } catch (error) {
      console.error('Archive template error:', error);
      toast.error('Failed to archive template');
    }
  };

  const handleUnarchiveTemplate = async (templateId: string) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(`/templates/${templateId}/unarchive`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Template unarchived successfully');
        fetchTemplates();
      } else {
        throw new Error('Failed to unarchive template');
      }
    } catch (error) {
      console.error('Unarchive template error:', error);
      toast.error('Failed to unarchive template');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(`/templates/${templateToDelete.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Template deleted successfully');
        fetchTemplates();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Delete template error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    } finally {
      setShowDeleteConfirm(false);
      setTemplateToDelete(null);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'after-school': return 'After-School';
      case 'holiday-club': return 'Holiday Club';
      case 'weekend': return 'Weekend';
      default: return type;
    }
  };

  const getStatusBadge = (template: Template) => {
    if (template.isArchived) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <ArchiveBoxIcon className="h-3 w-3 mr-1" />
          Archived
        </span>
      );
    }
    if (!template.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
        Active
      </span>
    );
  };

  const TemplateCard = ({ template }: { template: Template }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
            <div className="flex items-center space-x-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                {getTypeLabel(template.type)}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {template.years}
              </span>
              {getStatusBadge(template)}
            </div>
          </div>
          {template.image && (
            <div className="ml-4">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>

        {template.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyPoundIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>£{template.defaultPrice.toFixed(2)} per session</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{template.defaultCapacity} capacity</span>
          </div>
        </div>

        {template.tags.length > 0 && (
          <div className="flex items-center mb-4">
            <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {tag}
                </span>
              ))}
              {template.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{template.tags.length - 3} more</span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {template.requiresPhotoConsent && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <PhotoIcon className="h-3 w-3 mr-1" />
                Photo Consent
              </span>
            )}
            {template.requiresMedicalReminder && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                Medical Reminder
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            {template._count.activities} activities created
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <Button
            onClick={() => {
              setSelectedTemplate(template);
              setShowCreateCourseModal(true);
            }}
            className="flex-1 mr-2"
          >
            <CalendarDaysIcon className="h-4 w-4 mr-2" />
            Create Course
          </Button>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTemplate(template);
                setShowEditModal(true);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            {template.isArchived ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnarchiveTemplate(template.id)}
              >
                <ArchiveBoxIcon className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleArchiveTemplate(template.id)}
              >
                <ArchiveBoxIcon className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTemplateToDelete(template);
                setShowDeleteConfirm(true);
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout title="Templates">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading templates...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Templates">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
            <p className="text-gray-600">Manage activity templates for quick course creation</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center"
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                  <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="all">All Types</option>
                      <option value="after-school">After-School</option>
                      <option value="holiday-club">Holiday Club</option>
                      <option value="weekend">Weekend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year Group</label>
                    <select
                      value={filterYears}
                      onChange={(e) => setFilterYears(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="all">All Years</option>
                      <option value="Y1-Y2">Y1-Y2</option>
                      <option value="Y3-Y4">Y3-Y4</option>
                      <option value="Y5-Y6">Y5-Y6</option>
                      <option value="Y7+">Y7+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' || filterYears !== 'all' || filterStatus !== 'active'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first template'
                }
              </p>
              <div className="flex justify-center space-x-4">
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Template
                </Button>
                <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Create New Course
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <CreateTemplateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchTemplates}
        />

        <CreateCourseModal
          isOpen={showCreateCourseModal}
          onClose={() => setShowCreateCourseModal(false)}
          template={selectedTemplate}
          onSuccess={fetchTemplates}
        />

        <EditTemplateModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          template={selectedTemplate}
          onSuccess={fetchTemplates}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && templateToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Delete Template</h2>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{templateToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteTemplate}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default TemplatesPage;
