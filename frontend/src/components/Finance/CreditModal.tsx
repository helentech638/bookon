import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  CheckIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  CalendarDaysIcon,
  CurrencyPoundIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  credit?: {
    id: string;
    amount: number;
    usedAmount: number;
    source: string;
    description?: string;
    status: string;
    expiresAt?: string;
    parentId: string;
    parent: {
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  onSave: (credit: any) => void;
  onDelete?: (id: string) => void;
}

const CreditModal: React.FC<CreditModalProps> = ({
  isOpen,
  onClose,
  credit,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    parentId: '',
    amount: 0,
    source: 'manual',
    description: '',
    expiresAt: '',
    status: 'active'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [parents, setParents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredParents, setFilteredParents] = useState<any[]>([]);

  const creditSources = [
    { value: 'manual', label: 'Manual Issue', description: 'Manually issued by admin' },
    { value: 'refund', label: 'Refund Credit', description: 'Credit from refund' },
    { value: 'cancellation', label: 'Cancellation Credit', description: 'Credit from booking cancellation' },
    { value: 'policy', label: 'Policy Credit', description: 'Credit issued per policy' }
  ];

  const creditStatuses = [
    { value: 'active', label: 'Active', description: 'Credit can be used' },
    { value: 'used', label: 'Used', description: 'Credit has been fully used' },
    { value: 'expired', label: 'Expired', description: 'Credit has expired' },
    { value: 'cancelled', label: 'Cancelled', description: 'Credit has been cancelled' }
  ];

  useEffect(() => {
    if (credit) {
      setFormData({
        parentId: credit.parentId,
        amount: credit.amount,
        source: credit.source,
        description: credit.description || '',
        expiresAt: credit.expiresAt ? credit.expiresAt.split('T')[0] : '',
        status: credit.status
      });
    } else {
      setFormData({
        parentId: '',
        amount: 0,
        source: 'manual',
        description: '',
        expiresAt: '',
        status: 'active'
      });
    }
    setErrors({});
    setSearchTerm('');
  }, [credit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadParents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = parents.filter(parent =>
        `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(filtered);
    } else {
      setFilteredParents(parents);
    }
  }, [searchTerm, parents]);

  const loadParents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/v1/users?role=parent', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setParents(data.data || []);
        setFilteredParents(data.data || []);
      }
    } catch (error) {
      console.error('Error loading parents:', error);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.parentId) {
      newErrors.parentId = 'Please select a parent';
    }
    
    if (formData.amount <= 0) {
      newErrors.amount = 'Credit amount must be greater than 0';
    }
    
    if (formData.amount > 1000) {
      newErrors.amount = 'Credit amount cannot exceed £1000';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.expiresAt && formData.expiresAt <= new Date().toISOString().split('T')[0]) {
      newErrors.expiresAt = 'Expiry date must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const creditData = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
      };
      
      await onSave(creditData);
      onClose();
    } catch (error) {
      console.error('Error saving credit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (credit && onDelete && window.confirm('Are you sure you want to delete this credit?')) {
      try {
        await onDelete(credit.id);
        onClose();
      } catch (error) {
        console.error('Error deleting credit:', error);
      }
    }
  };

  const selectedParent = parents.find(p => p.id === formData.parentId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {credit ? 'Edit Credit' : 'Issue New Credit'}
            </h2>
            <p className="text-sm text-gray-600">
              {credit ? 'Update credit details' : 'Issue credit to a parent account'}
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
            {/* Parent Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Parent *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search parents by name or email..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <UserIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              
              {searchTerm && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                  {filteredParents.length > 0 ? (
                    filteredParents.map((parent) => (
                      <button
                        key={parent.id}
                        onClick={() => {
                          handleInputChange('parentId', parent.id);
                          setSearchTerm(`${parent.firstName} ${parent.lastName}`);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {parent.firstName} {parent.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{parent.email}</div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-gray-500 text-sm">No parents found</div>
                  )}
                </div>
              )}
              
              {selectedParent && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <div className="font-medium text-blue-900">
                        {selectedParent.firstName} {selectedParent.lastName}
                      </div>
                      <div className="text-sm text-blue-700">{selectedParent.email}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.parentId && (
                <p className="mt-1 text-sm text-red-600">{errors.parentId}</p>
              )}
            </div>

            {/* Credit Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Amount (£) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CurrencyPoundIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0.01"
                  max="1000"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                  className={`w-full pl-10 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Credit Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Source *
              </label>
              <div className="space-y-2">
                {creditSources.map((source) => (
                  <label key={source.value} className="flex items-start">
                    <input
                      type="radio"
                      name="source"
                      value={source.value}
                      checked={formData.source === source.value}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{source.label}</div>
                      <div className="text-sm text-gray-500">{source.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Reason for issuing this credit..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.expiresAt ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.expiresAt && (
                <p className="mt-1 text-sm text-red-600">{errors.expiresAt}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Leave empty for no expiration</p>
            </div>

            {/* Status (only for editing) */}
            {credit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {creditStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Credit Summary */}
            {formData.amount > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Credit Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">£{formData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source:</span>
                    <span className="font-medium">
                      {creditSources.find(s => s.value === formData.source)?.label}
                    </span>
                  </div>
                  {formData.expiresAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires:</span>
                      <span className="font-medium">
                        {new Date(formData.expiresAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {credit && onDelete && (
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
                  {credit ? 'Update Credit' : 'Issue Credit'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditModal;
