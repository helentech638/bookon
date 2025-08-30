import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  EyeIcon, 
  TrashIcon,
  DocumentTextIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:3000/api/v1/admin/email-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data);
      } else {
        toast.error('Failed to fetch email templates');
      }
    } catch (error) {
      toast.error('Error fetching email templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      id: '',
      name: '',
      subject: '',
      content: '',
      variables: [],
      isActive: true
    });
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowCreateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      // For now, just update local state
      // In production, this would make an API call
      if (editingTemplate.id) {
        // Update existing template
        setTemplates(prev => prev.map(t => 
          t.id === editingTemplate.id ? editingTemplate : t
        ));
        toast.success('Template updated successfully');
      } else {
        // Create new template
        const newTemplate = {
          ...editingTemplate,
          id: `template_${Date.now()}`
        };
        setTemplates(prev => [...prev, newTemplate]);
        toast.success('Template created successfully');
      }

      setShowCreateModal(false);
      setEditingTemplate(null);
    } catch (error) {
      toast.error('Error saving template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully');
      } catch (error) {
        toast.error('Error deleting template');
      }
    }
  };

  const toggleTemplateStatus = async (templateId: string) => {
    try {
      setTemplates(prev => prev.map(t => 
        t.id === templateId ? { ...t, isActive: !t.isActive } : t
      ));
      toast.success('Template status updated');
    } catch (error) {
      toast.error('Error updating template status');
    }
  };

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    
    return variables;
  };

  const handleContentChange = (content: string) => {
    if (editingTemplate) {
      const variables = extractVariables(content);
      setEditingTemplate(prev => prev ? { ...prev, content, variables } : null);
    }
  };

  const getVariablePreview = (content: string): string => {
    return content
      .replace(/\{\{user_name\}\}/g, 'John Doe')
      .replace(/\{\{activity_name\}\}/g, 'Swimming Lesson')
      .replace(/\{\{venue_name\}\}/g, 'Sports Complex')
      .replace(/\{\{booking_date\}\}/g, '15th March 2024')
      .replace(/\{\{booking_time\}\}/g, '10:00 AM');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-gray-600">Manage email templates for automated communications</p>
            </div>
            <Button
              onClick={handleCreateTemplate}
              className="bg-[#00806a] hover:bg-[#006d5a] text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00806a] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading templates...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-8 h-8 text-[#00806a] mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500">{template.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleTemplateStatus(template.id)}
                      className={`p-1 rounded-full ${
                        template.isActive 
                          ? 'text-green-600 hover:text-green-800' 
                          : 'text-red-600 hover:text-red-800'
                      }`}
                    >
                      {template.isActive ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <XMarkIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {template.content}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setPreviewTemplate(template)}
                      size="sm"
                      variant="outline"
                      className="text-[#00806a] border-[#00806a] hover:bg-[#00806a] hover:text-white"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => handleEditTemplate(template)}
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <PencilIcon className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteTemplate(template.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      {showCreateModal && editingTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate.id ? 'Edit Template' : 'Create New Template'}
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                      placeholder="e.g., Welcome Email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                      placeholder="e.g., Welcome to BookOn!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Content</label>
                    <textarea
                      rows={8}
                      value={editingTemplate.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                      placeholder="Enter your email content here. Use {{variable_name}} for dynamic content."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Available Variables</label>
                    <div className="text-sm text-gray-600">
                      {editingTemplate.variables.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {editingTemplate.variables.map((variable) => (
                            <span
                              key={variable}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No variables detected. Use {{variable_name}} in your content.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                    <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                      <div className="mb-2">
                        <strong>Subject:</strong> {editingTemplate.subject || 'No subject'}
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {getVariablePreview(editingTemplate.content) || 'No content'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Status</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingTemplate.isActive}
                        onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                        className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">Template is active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingTemplate(null);
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveTemplate}
                  className="bg-[#00806a] hover:bg-[#006d5a] text-white"
                >
                  {editingTemplate.id ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Template Preview</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <p className="text-sm text-gray-900">{previewTemplate.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-sm text-gray-900">{previewTemplate.subject}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content (with sample data)</label>
                  <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {getVariablePreview(previewTemplate.content)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variables Used</label>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => setPreviewTemplate(null)}
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

export default EmailTemplates;
