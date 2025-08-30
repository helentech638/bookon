import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup?: string;
  allergies?: string;
  medicalInfo?: string;
  emergencyContacts?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChildFormProps {
  child?: Child;
  onSubmit: (data: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const ChildForm: React.FC<ChildFormProps> = ({ child, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    yearGroup: '',
    allergies: '',
    medicalInfo: '',
    emergencyContacts: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (child) {
      setFormData({
        firstName: child.firstName,
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth,
        yearGroup: child.yearGroup || '',
        allergies: child.allergies || '',
        medicalInfo: child.medicalInfo || '',
        emergencyContacts: child.emergencyContacts || '',
      });
    }
  }, [child]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    if (formData.allergies && formData.allergies.length > 500) {
      newErrors.allergies = 'Allergies description is too long (max 500 characters)';
    }

    if (formData.medicalInfo && formData.medicalInfo.length > 1000) {
      newErrors.medicalInfo = 'Medical information is too long (max 1000 characters)';
    }

    if (formData.emergencyContacts && formData.emergencyContacts.length > 500) {
      newErrors.emergencyContacts = 'Emergency contacts description is too long (max 500 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && (
            <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth *
          </label>
          <input
            type="date"
            id="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Year Group */}
        <div>
          <label htmlFor="yearGroup" className="block text-sm font-medium text-gray-700 mb-1">
            Year Group
          </label>
          <input
            type="text"
            id="yearGroup"
            value={formData.yearGroup}
            onChange={(e) => handleInputChange('yearGroup', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Year 3, Reception"
          />
        </div>
      </div>

      {/* Allergies */}
      <div>
        <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-1">
          Allergies & Dietary Requirements
        </label>
        <textarea
          id="allergies"
          value={formData.allergies}
          onChange={(e) => handleInputChange('allergies', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.allergies ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="List any allergies, dietary restrictions, or food preferences..."
        />
        {errors.allergies && (
          <p className="text-red-600 text-sm mt-1">{errors.allergies}</p>
        )}
      </div>

      {/* Medical Information */}
      <div>
        <label htmlFor="medicalInfo" className="block text-sm font-medium text-gray-700 mb-1">
          Medical Information
        </label>
        <textarea
          id="medicalInfo"
          value={formData.medicalInfo}
          onChange={(e) => handleInputChange('medicalInfo', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.medicalInfo ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Any medical conditions, medications, or special needs..."
        />
        {errors.medicalInfo && (
          <p className="text-red-600 text-sm mt-1">{errors.medicalInfo}</p>
        )}
      </div>

      {/* Emergency Contacts */}
      <div>
        <label htmlFor="emergencyContacts" className="block text-sm font-medium text-gray-700 mb-1">
          Emergency Contacts
        </label>
        <textarea
          id="emergencyContacts"
          value={formData.emergencyContacts}
          onChange={(e) => handleInputChange('emergencyContacts', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.emergencyContacts ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Emergency contact details (name, phone, relationship)..."
        />
        {errors.emergencyContacts && (
          <p className="text-red-600 text-sm mt-1">{errors.emergencyContacts}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : (child ? 'Update Child' : 'Add Child')}
        </Button>
      </div>
    </form>
  );
};

export default ChildForm;
