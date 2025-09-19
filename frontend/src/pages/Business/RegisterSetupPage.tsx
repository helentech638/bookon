import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { 
  CogIcon, 
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface RegisterSetup {
  id: string;
  name: string;
  description: string;
  defaultCapacity: number;
  allowWaitlist: boolean;
  autoConfirm: boolean;
  requireApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RegisterTemplate {
  id: string;
  name: string;
  description: string;
  fields: RegisterField[];
  isDefault: boolean;
}

interface RegisterField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

const RegisterSetupPage: React.FC = () => {
  const { user } = useAuth();
  const [registerSetups, setRegisterSetups] = useState<RegisterSetup[]>([]);
  const [templates, setTemplates] = useState<RegisterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSetup, setEditingSetup] = useState<RegisterSetup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultCapacity: 20,
    allowWaitlist: true,
    autoConfirm: false,
    requireApproval: false
  });

  useEffect(() => {
    fetchRegisterSetups();
    fetchTemplates();
  }, []);

  const fetchRegisterSetups = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        toast.error('Please log in to view register setups');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(buildApiUrl('/business/register-setup'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch register setups');
      }

      const data = await response.json();
      if (data.success) {
        // Transform API data to match our interface
        const transformedSetups: RegisterSetup[] = (data.data.registerSetups || []).map((setup: any) => ({
          id: setup.id,
          name: setup.name,
          description: setup.description,
          defaultCapacity: setup.defaultCapacity || 20,
          allowWaitlist: setup.allowWaitlist || false,
          autoConfirm: setup.autoConfirm || false,
          requireApproval: setup.requireApproval || false,
          cancellationPolicy: setup.cancellationPolicy || '',
          refundPolicy: setup.refundPolicy || '',
          isActive: setup.isActive !== false,
          createdAt: setup.createdAt,
          updatedAt: setup.updatedAt
        }));
        
        setRegisterSetups(transformedSetups);
      } else {
        throw new Error(data.message || 'Failed to fetch register setups');
      }
    } catch (error) {
      console.error('Error fetching register setups:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Register setups loading timeout - please refresh');
      } else {
        toast.error('Failed to load register setups');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Mock templates - replace with actual API call
      const mockTemplates: RegisterTemplate[] = [
        {
          id: '1',
          name: 'Basic Registration',
          description: 'Simple registration form',
          isDefault: true,
          fields: [
            { id: '1', name: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
            { id: '2', name: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
            { id: '3', name: 'Phone', type: 'phone', required: true, placeholder: 'Enter phone number' }
          ]
        },
        {
          id: '2',
          name: 'Detailed Registration',
          description: 'Comprehensive registration form',
          isDefault: false,
          fields: [
            { id: '1', name: 'Full Name', type: 'text', required: true, placeholder: 'Enter full name' },
            { id: '2', name: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
            { id: '3', name: 'Phone', type: 'phone', required: true, placeholder: 'Enter phone number' },
            { id: '4', name: 'Date of Birth', type: 'date', required: true },
            { id: '5', name: 'Emergency Contact', type: 'text', required: true, placeholder: 'Emergency contact name' },
            { id: '6', name: 'Medical Information', type: 'textarea', required: false, placeholder: 'Any medical conditions or allergies' }
          ]
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error('Please log in to save register setup');
        return;
      }

      const url = editingSetup 
        ? buildApiUrl(`/business/register-setup/${editingSetup.id}`)
        : buildApiUrl('/business/register-setup');
      
      const method = editingSetup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save register setup');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(editingSetup ? 'Register setup updated successfully!' : 'Register setup created successfully!');
        setShowCreateModal(false);
        setEditingSetup(null);
        setFormData({
          name: '',
          description: '',
          defaultCapacity: 20,
          allowWaitlist: true,
          autoConfirm: false,
          requireApproval: false,
          cancellationPolicy: '',
          refundPolicy: ''
        });
        fetchRegisterSetups(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to save register setup');
      }
    } catch (error) {
      console.error('Error saving register setup:', error);
      toast.error('Failed to save register setup');
    }
  };

  const handleEdit = (setup: RegisterSetup) => {
    setEditingSetup(setup);
    setFormData({
      name: setup.name,
      description: setup.description,
      defaultCapacity: setup.defaultCapacity,
      allowWaitlist: setup.allowWaitlist,
      autoConfirm: setup.autoConfirm,
      requireApproval: setup.requireApproval
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (setupId: string) => {
    if (window.confirm('Are you sure you want to delete this register setup?')) {
      try {
        const token = authService.getToken();
        if (!token) {
          toast.error('Please log in to delete register setup');
          return;
        }

        const response = await fetch(buildApiUrl(`/business/register-setup/${setupId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete register setup');
        }

        const data = await response.json();
        if (data.success) {
          toast.success('Register setup deleted successfully');
          fetchRegisterSetups(); // Refresh the list
        } else {
          throw new Error(data.message || 'Failed to delete register setup');
        }
      } catch (error) {
        console.error('Error deleting register setup:', error);
        toast.error('Failed to delete register setup');
      }
    }
  };

  const toggleActive = async (setupId: string) => {
    try {
      setRegisterSetups(prev => 
        prev.map(setup => 
          setup.id === setupId 
            ? { ...setup, isActive: !setup.isActive, updatedAt: new Date().toISOString() }
            : setup
        )
      );
      toast.success('Register setup status updated');
    } catch (error) {
      console.error('Error updating register setup:', error);
      toast.error('Failed to update register setup');
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Register Setup</h1>
            <p className="text-gray-600 mt-1">Configure registration settings and templates</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Setup
          </Button>
        </div>

        {/* Register Setups */}
        <div className="grid gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Register Setups</h2>
                <span className="text-sm text-gray-500">{registerSetups.length} setups</span>
              </div>
              
              <div className="space-y-4">
                {registerSetups.map((setup) => (
                  <div key={setup.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900">{setup.name}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            setup.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {setup.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{setup.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <UserGroupIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Capacity:</span>
                            <span className="font-medium">{setup.defaultCapacity}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircleIcon className={`h-4 w-4 ${setup.allowWaitlist ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-gray-600">Waitlist:</span>
                            <span className="font-medium">{setup.allowWaitlist ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ClockIcon className={`h-4 w-4 ${setup.autoConfirm ? 'text-green-500' : 'text-gray-400'}`} />
                            <span className="text-gray-600">Auto-confirm:</span>
                            <span className="font-medium">{setup.autoConfirm ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ExclamationTriangleIcon className={`h-4 w-4 ${setup.requireApproval ? 'text-yellow-500' : 'text-gray-400'}`} />
                            <span className="text-gray-600">Approval:</span>
                            <span className="font-medium">{setup.requireApproval ? 'Required' : 'Not Required'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(setup)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(setup.id)}
                          className={setup.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                        >
                          {setup.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(setup.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Templates */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Templates</h2>
              
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      {template.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{template.fields.length}</span> fields configured
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingSetup ? 'Edit Register Setup' : 'Create New Register Setup'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Setup Name
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter setup name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Capacity
                    </label>
                    <Input
                      type="number"
                      value={formData.defaultCapacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultCapacity: parseInt(e.target.value) }))}
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Enter description"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowWaitlist"
                      checked={formData.allowWaitlist}
                      onChange={(e) => setFormData(prev => ({ ...prev, allowWaitlist: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowWaitlist" className="ml-2 text-sm text-gray-700">
                      Allow waitlist when full
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="autoConfirm"
                      checked={formData.autoConfirm}
                      onChange={(e) => setFormData(prev => ({ ...prev, autoConfirm: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoConfirm" className="ml-2 text-sm text-gray-700">
                      Auto-confirm registrations
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requireApproval"
                      checked={formData.requireApproval}
                      onChange={(e) => setFormData(prev => ({ ...prev, requireApproval: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="requireApproval" className="ml-2 text-sm text-gray-700">
                      Require manual approval
                    </label>
                  </div>
                </div>
                
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingSetup(null);
                      setFormData({
                        name: '',
                        description: '',
                        defaultCapacity: 20,
                        allowWaitlist: true,
                        autoConfirm: false,
                        requireApproval: false,
                        cancellationPolicy: '',
                        refundPolicy: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingSetup ? 'Update Setup' : 'Create Setup'}
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

export default RegisterSetupPage;
