import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  EyeIcon, 
  PencilIcon, 
  ClockIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MapPinIcon,
  CalendarDaysIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import { Button } from '../ui/Button';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  broadcast?: {
    id: string;
    title: string;
    subject: string;
    bodyHtml: string;
    bodyText?: string;
    audienceQuery: any;
    channels: string[];
    scheduledFor?: string;
    status: string;
  } | null;
  onSave: (broadcast: any) => void;
  onSend?: (id: string) => void;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  broadcast,
  onSave,
  onSend
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    bodyHtml: '',
    bodyText: '',
    audienceQuery: {
      type: 'all',
      filters: {}
    },
    channels: ['email'],
    scheduledFor: '',
    sendNow: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [audienceCount, setAudienceCount] = useState(0);

  const steps = [
    { id: 1, name: 'Compose', description: 'Write your message' },
    { id: 2, name: 'Audience', description: 'Select recipients' },
    { id: 3, name: 'Schedule', description: 'Choose timing' },
    { id: 4, name: 'Review', description: 'Review and send' }
  ];

  const channelOptions = [
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'sms', label: 'SMS', icon: '📱' },
    { value: 'in_app', label: 'In-App Notification', icon: '🔔' }
  ];

  const audienceTypes = [
    { value: 'all', label: 'All Parents', icon: UserGroupIcon, description: 'Send to all registered parents' },
    { value: 'venue', label: 'By Venue', icon: MapPinIcon, description: 'Send to parents with bookings at specific venues' },
    { value: 'activity', label: 'By Activity', icon: CalendarDaysIcon, description: 'Send to parents with specific activity bookings' },
    { value: 'year_group', label: 'By Year Group', icon: AcademicCapIcon, description: 'Send to parents with children in specific year groups' }
  ];

  const availablePlaceholders = [
    'ParentName',
    'ChildName',
    'ActivityName',
    'Venue',
    'Date',
    'Time',
    'Price',
    'BookingReference'
  ];

  useEffect(() => {
    if (broadcast) {
      setFormData({
        title: broadcast.title,
        subject: broadcast.subject,
        bodyHtml: broadcast.bodyHtml,
        bodyText: broadcast.bodyText || '',
        audienceQuery: broadcast.audienceQuery,
        channels: broadcast.channels,
        scheduledFor: broadcast.scheduledFor || '',
        sendNow: !broadcast.scheduledFor
      });
    } else {
      setFormData({
        title: '',
        subject: '',
        bodyHtml: '',
        bodyText: '',
        audienceQuery: {
          type: 'all',
          filters: {}
        },
        channels: ['email'],
        scheduledFor: '',
        sendNow: true
      });
    }
    setErrors({});
    setIsPreview(false);
    setCurrentStep(1);
  }, [broadcast, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAudienceChange = (type: string, filters: any) => {
    handleInputChange('audienceQuery', { type, filters });
    // Simulate audience count calculation
    setAudienceCount(Math.floor(Math.random() * 1000) + 100);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
        if (!formData.bodyHtml.trim()) newErrors.bodyHtml = 'Message content is required';
        break;
      case 2:
        if (!formData.audienceQuery.type) newErrors.audience = 'Please select an audience type';
        break;
      case 3:
        if (!formData.sendNow && !formData.scheduledFor) {
          newErrors.scheduledFor = 'Please select a send time or choose to send now';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep(1)) return;
    
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving broadcast:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;
    
    setIsSaving(true);
    try {
      if (broadcast && onSend) {
        await onSend(broadcast.id);
      } else {
        await onSave({ ...formData, status: 'sending' });
      }
      onClose();
    } catch (error) {
      console.error('Error sending broadcast:', error);
    } finally {
      setIsSaving(false);
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
              {broadcast ? 'Edit Broadcast' : 'Send Broadcast'}
            </h2>
            <p className="text-sm text-gray-600">
              {broadcast ? 'Update your broadcast message' : 'Create and send a message to your audience'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Compose */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Broadcast Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Holiday Club Reminder"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Important Update About Your Booking"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Message Content *
                  </label>
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    {isPreview ? <PencilIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    <span>{isPreview ? 'Edit' : 'Preview'}</span>
                  </button>
                </div>
                
                {isPreview ? (
                  <div 
                    className="border border-gray-300 rounded-lg p-4 min-h-[300px] prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.bodyHtml }}
                  />
                ) : (
                  <RichTextEditor
                    value={formData.bodyHtml}
                    onChange={(value) => handleInputChange('bodyHtml', value)}
                    placeholder="Write your message here..."
                    availablePlaceholders={availablePlaceholders}
                    className="min-h-[300px]"
                  />
                )}
                
                {errors.bodyHtml && (
                  <p className="mt-1 text-sm text-red-600">{errors.bodyHtml}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channels
                </label>
                <div className="flex space-x-4">
                  {channelOptions.map((channel) => (
                    <label key={channel.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel.value)}
                        onChange={(e) => {
                          const newChannels = e.target.checked
                            ? [...formData.channels, channel.value]
                            : formData.channels.filter(c => c !== channel.value);
                          handleInputChange('channels', newChannels);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {channel.icon} {channel.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Select Audience *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {audienceTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => handleAudienceChange(type.value, {})}
                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                          formData.audienceQuery.type === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <Icon className="w-6 h-6 text-gray-600 mt-1" />
                          <div>
                            <h3 className="font-medium text-gray-900">{type.label}</h3>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.audience && (
                  <p className="mt-2 text-sm text-red-600">{errors.audience}</p>
                )}
              </div>

              {audienceCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      This message will be sent to approximately {audienceCount} recipients
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Schedule */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  When would you like to send this message?
                </label>
                
                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="sendTime"
                      checked={formData.sendNow}
                      onChange={() => handleInputChange('sendNow', true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <ClockIcon className="w-5 h-5 text-gray-600 mr-2" />
                        <span className="font-medium text-gray-900">Send Now</span>
                      </div>
                      <p className="text-sm text-gray-600">Send immediately to all selected recipients</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="sendTime"
                      checked={!formData.sendNow}
                      onChange={() => handleInputChange('sendNow', false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="w-5 h-5 text-gray-600 mr-2" />
                        <span className="font-medium text-gray-900">Schedule for Later</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Choose a specific date and time</p>
                      <input
                        type="datetime-local"
                        value={formData.scheduledFor}
                        onChange={(e) => handleInputChange('scheduledFor', e.target.value)}
                        disabled={formData.sendNow}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </label>
                </div>
                
                {errors.scheduledFor && (
                  <p className="mt-2 text-sm text-red-600">{errors.scheduledFor}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Broadcast</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Title</h4>
                    <p className="text-gray-600">{formData.title}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Subject</h4>
                    <p className="text-gray-600">{formData.subject}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Audience</h4>
                    <p className="text-gray-600">
                      {audienceTypes.find(t => t.value === formData.audienceQuery.type)?.label} 
                      {audienceCount > 0 && ` (${audienceCount} recipients)`}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Channels</h4>
                    <p className="text-gray-600">
                      {formData.channels.map(c => 
                        channelOptions.find(co => co.value === c)?.label
                      ).join(', ')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Send Time</h4>
                    <p className="text-gray-600">
                      {formData.sendNow 
                        ? 'Send immediately' 
                        : `Schedule for ${new Date(formData.scheduledFor).toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className="border border-gray-300 rounded-lg p-4 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.bodyHtml }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <Button
                onClick={handlePrevious}
                variant="outline"
                disabled={isSaving}
              >
                Previous
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
            
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={broadcast ? handleSave : handleSend}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {broadcast ? 'Saving...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {broadcast ? 'Update Broadcast' : 'Send Broadcast'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
