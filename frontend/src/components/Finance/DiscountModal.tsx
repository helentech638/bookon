import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  TagIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  MapPinIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discount?: {
    id: string;
    name: string;
    code: string;
    type: string;
    value: number;
    minAmount?: number;
    maxUses?: number;
    validFrom: string;
    validUntil?: string;
    applicableTo: string[];
    venueIds: string[];
    activityIds: string[];
    active: boolean;
  } | null;
  onSave: (discount: any) => void;
  onDelete?: (id: string) => void;
}

const DiscountModal: React.FC<DiscountModalProps> = ({
  isOpen,
  onClose,
  discount,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'percentage',
    value: 0,
    minAmount: 0,
    maxUses: 0,
    validFrom: '',
    validUntil: '',
    applicableTo: ['all'],
    venueIds: [] as string[],
    activityIds: [] as string[],
    active: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const discountTypes = [
    { value: 'percentage', label: 'Percentage (%)', description: 'Discount as a percentage of total' },
    { value: 'fixed_amount', label: 'Fixed Amount (£)', description: 'Fixed discount amount in pounds' }
  ];

  const applicableToOptions = [
    { value: 'all', label: 'All Bookings', icon: UserGroupIcon, description: 'Apply to all bookings' },
    { value: 'venues', label: 'Specific Venues', icon: MapPinIcon, description: 'Apply only to selected venues' },
    { value: 'activities', label: 'Specific Activities', icon: AcademicCapIcon, description: 'Apply only to selected activities' }
  ];

  useEffect(() => {
    if (discount) {
      setFormData({
        name: discount.name,
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minAmount: discount.minAmount || 0,
        maxUses: discount.maxUses || 0,
        validFrom: discount.validFrom.split('T')[0],
        validUntil: discount.validUntil ? discount.validUntil.split('T')[0] : '',
        applicableTo: discount.applicableTo,
        venueIds: discount.venueIds,
        activityIds: discount.activityIds,
        active: discount.active
      });
    } else {
      setFormData({
        name: '',
        code: '',
        type: 'percentage',
        value: 0,
        minAmount: 0,
        maxUses: 0,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: '',
        applicableTo: ['all'],
        venueIds: [],
        activityIds: [],
        active: true
      });
    }
    setErrors({});
  }, [discount, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadVenuesAndActivities();
    }
  }, [isOpen]);

  const loadVenuesAndActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [venuesResponse, activitiesResponse] = await Promise.all([
        fetch('/api/v1/venues', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/v1/activities', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        setVenues(venuesData.data || []);
      }

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.data || []);
      }
    } catch (error) {
      console.error('Error loading venues and activities:', error);
    }
  };

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

  const handleApplicableToChange = (value: string) => {
    const newApplicableTo = formData.applicableTo.includes(value)
      ? formData.applicableTo.filter(item => item !== value)
      : [...formData.applicableTo, value];
    
    handleInputChange('applicableTo', newApplicableTo);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Discount name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Discount code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, hyphens, and underscores';
    }
    
    if (formData.value <= 0) {
      newErrors.value = 'Discount value must be greater than 0';
    }
    
    if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Percentage discount cannot exceed 100%';
    }
    
    if (formData.minAmount < 0) {
      newErrors.minAmount = 'Minimum amount cannot be negative';
    }
    
    if (formData.maxUses < 0) {
      newErrors.maxUses = 'Maximum uses cannot be negative';
    }
    
    if (!formData.validFrom) {
      newErrors.validFrom = 'Valid from date is required';
    }
    
    if (formData.validUntil && formData.validUntil <= formData.validFrom) {
      newErrors.validUntil = 'Valid until date must be after valid from date';
    }
    
    if (formData.applicableTo.length === 0) {
      newErrors.applicableTo = 'Please select at least one applicable option';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const discountData = {
        ...formData,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : null,
        minAmount: formData.minAmount > 0 ? formData.minAmount : null,
        maxUses: formData.maxUses > 0 ? formData.maxUses : null
      };
      
      await onSave(discountData);
      onClose();
    } catch (error) {
      console.error('Error saving discount:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (discount && onDelete && window.confirm('Are you sure you want to delete this discount?')) {
      try {
        await onDelete(discount.id);
        onClose();
      } catch (error) {
        console.error('Error deleting discount:', error);
      }
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('code', result);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {discount ? 'Edit Discount' : 'Create New Discount'}
            </h2>
            <p className="text-sm text-gray-600">
              {discount ? 'Update your discount settings' : 'Create a new discount code for promotions'}
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
                  Discount Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Summer Sale 2024"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Code *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="SUMMER2024"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Generate
                  </button>
                </div>
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                )}
              </div>
            </div>

            {/* Discount Type and Value */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <div className="space-y-2">
                  {discountTypes.map((type) => (
                    <label key={type.value} className="flex items-start">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={formData.type === type.value}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={formData.type === 'percentage' ? 100 : undefined}
                    step={formData.type === 'percentage' ? 0.01 : 0.01}
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value))}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.value ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={formData.type === 'percentage' ? '10' : '5.00'}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">
                      {formData.type === 'percentage' ? '%' : '£'}
                    </span>
                  </div>
                </div>
                {errors.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.value}</p>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">£</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minAmount}
                    onChange={(e) => handleInputChange('minAmount', parseFloat(e.target.value))}
                    className={`w-full pl-8 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.minAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.minAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.minAmount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Leave empty for no minimum</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxUses}
                  onChange={(e) => handleInputChange('maxUses', parseInt(e.target.value))}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.maxUses ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.maxUses && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxUses}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited uses</p>
              </div>
            </div>

            {/* Validity Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid From *
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => handleInputChange('validFrom', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.validFrom ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.validFrom && (
                  <p className="mt-1 text-sm text-red-600">{errors.validFrom}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleInputChange('validUntil', e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.validUntil ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.validUntil && (
                  <p className="mt-1 text-sm text-red-600">{errors.validUntil}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Leave empty for no expiration</p>
              </div>
            </div>

            {/* Applicable To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Applicable To *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {applicableToOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleApplicableToChange(option.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        formData.applicableTo.includes(option.value)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Icon className="w-6 h-6 text-gray-600 mt-1" />
                        <div>
                          <h3 className="font-medium text-gray-900">{option.label}</h3>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.applicableTo && (
                <p className="mt-2 text-sm text-red-600">{errors.applicableTo}</p>
              )}
            </div>

            {/* Venue Selection */}
            {formData.applicableTo.includes('venues') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Venues
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {venues.map((venue) => (
                    <label key={venue.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={formData.venueIds.includes(venue.id)}
                        onChange={(e) => {
                          const newVenueIds = e.target.checked
                            ? [...formData.venueIds, venue.id]
                            : formData.venueIds.filter(id => id !== venue.id);
                          handleInputChange('venueIds', newVenueIds);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {venue.name} - {venue.city}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Selection */}
            {formData.applicableTo.includes('activities') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Activities
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {activities.map((activity) => (
                    <label key={activity.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={formData.activityIds.includes(activity.id)}
                        onChange={(e) => {
                          const newActivityIds = e.target.checked
                            ? [...formData.activityIds, activity.id]
                            : formData.activityIds.filter(id => id !== activity.id);
                          handleInputChange('activityIds', newActivityIds);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {activity.title} - {activity.type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
                Discount is active and can be used
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {discount && onDelete && (
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
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
                  {discount ? 'Update Discount' : 'Create Discount'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountModal;
