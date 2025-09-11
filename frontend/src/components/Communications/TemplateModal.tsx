import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import { Button } from '../ui/Button';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: {
    id: string;
    name: string;
    trigger: string;
    subjectTemplate: string;
    bodyHtmlTemplate: string;
    bodyTextTemplate?: string;
    active: boolean;
    brandOverrides?: any;
    placeholders?: string[];
  } | null;
  onSave: (template: any) => void;
  onDelete?: (id: string) => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: '',
    trigger: 'booking_confirmation',
    subjectTemplate: '',
    bodyHtmlTemplate: '',
    bodyTextTemplate: '',
    active: true,
    brandOverrides: {
      logoUrl: '',
      primaryColor: '#2C8F7A',
      secondaryColor: '#0F2230'
    },
    placeholders: [] as string[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const availablePlaceholders = [
    'ParentName',
    'ChildName',
    'ActivityName',
    'Venue',
    'Date',
    'Time',
    'Price',
    'BookingReference',
    'CancellationPolicy',
    'ContactInfo'
  ];

  const triggerOptions = [
    { value: 'booking_confirmation', label: 'Booking Confirmation' },
    { value: 'booking_reminder', label: 'Booking Reminder' },
    { value: 'cancellation', label: 'Cancellation' },
    { value: 'waitlist_notification', label: 'Waitlist Notification' },
    { value: 'payment_success', label: 'Payment Success' },
    { value: 'payment_failed', label: 'Payment Failed' },
    { value: 'refund_processed', label: 'Refund Processed' },
    { value: 'welcome', label: 'Welcome Email' }
  ];

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        trigger: template.trigger,
        subjectTemplate: template.subjectTemplate,
        bodyHtmlTemplate: template.bodyHtmlTemplate,
        bodyTextTemplate: template.bodyTextTemplate || '',
        active: template.active,
        brandOverrides: template.brandOverrides || {
          logoUrl: '',
          primaryColor: '#2C8F7A',
          secondaryColor: '#0F2230'
        },
        placeholders: template.placeholders || []
      });
    } else {
      setFormData({
        name: '',
        trigger: 'booking_confirmation',
        subjectTemplate: '',
        bodyHtmlTemplate: '',
        bodyTextTemplate: '',
        active: true,
        brandOverrides: {
          logoUrl: '',
          primaryColor: '#2C8F7A',
          secondaryColor: '#0F2230'
        },
        placeholders: []
      });
    }
    setErrors({});
    setIsPreview(false);
  }, [template, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePlaceholderInsert = (placeholder: string) => {
    if (!formData.placeholders.includes(placeholder)) {
      handleInputChange('placeholders', [...formData.placeholders, placeholder]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    
    if (!formData.subjectTemplate.trim()) {
      newErrors.subjectTemplate = 'Subject template is required';
    }
    
    if (!formData.bodyHtmlTemplate.trim()) {
      newErrors.bodyHtmlTemplate = 'Email body is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (template && onDelete && window.confirm('Are you sure you want to delete this template?')) {
      try {
        await onDelete(template.id);
        onClose();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Edit Template' : 'Create New Template'}
            </h2>
            <p className="text-sm text-gray-600">
              {template ? 'Update your email template' : 'Create a new email template for automated communications'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Booking Confirmation Email"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Event *
                </label>
                <select
                  value={formData.trigger}
                  onChange={(e) => handleInputChange('trigger', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {triggerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subject Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Template *
              </label>
              <input
                type="text"
                value={formData.subjectTemplate}
                onChange={(e) => handleInputChange('subjectTemplate', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.subjectTemplate ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Booking Confirmation for {ActivityName}"
              />
              {errors.subjectTemplate && (
                <p className="mt-1 text-sm text-red-600">{errors.subjectTemplate}</p>
              )}
            </div>

            {/* Email Body */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Body *
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {isPreview ? <PencilIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    <span>{isPreview ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>
              </div>
              
              {isPreview ? (
                <div 
                  className="border border-gray-300 rounded-lg p-4 min-h-[300px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formData.bodyHtmlTemplate }}
                />
              ) : (
                <RichTextEditor
                  value={formData.bodyHtmlTemplate}
                  onChange={(value) => handleInputChange('bodyHtmlTemplate', value)}
                  placeholder="Enter your email content here..."
                  availablePlaceholders={availablePlaceholders}
                  onPlaceholderInsert={handlePlaceholderInsert}
                  className="min-h-[300px]"
                />
              )}
              
              {errors.bodyHtmlTemplate && (
                <p className="mt-1 text-sm text-red-600">{errors.bodyHtmlTemplate}</p>
              )}
            </div>

            {/* Brand Overrides */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Customization</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={formData.brandOverrides.logoUrl}
                    onChange={(e) => handleInputChange('brandOverrides', {
                      ...formData.brandOverrides,
                      logoUrl: e.target.value
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.brandOverrides.primaryColor}
                      onChange={(e) => handleInputChange('brandOverrides', {
                        ...formData.brandOverrides,
                        primaryColor: e.target.value
                      })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.brandOverrides.primaryColor}
                      onChange={(e) => handleInputChange('brandOverrides', {
                        ...formData.brandOverrides,
                        primaryColor: e.target.value
                      })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.brandOverrides.secondaryColor}
                      onChange={(e) => handleInputChange('brandOverrides', {
                        ...formData.brandOverrides,
                        secondaryColor: e.target.value
                      })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.brandOverrides.secondaryColor}
                      onChange={(e) => handleInputChange('brandOverrides', {
                        ...formData.brandOverrides,
                        secondaryColor: e.target.value
                      })}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => handleInputChange('active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                Template is active and can be used for automated emails
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {template && onDelete && (
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {template ? 'Update Template' : 'Create Template'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
