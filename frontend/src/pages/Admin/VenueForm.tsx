import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { buildApiUrl } from '../../config/api';
import AdminLayout from '../../components/layout/AdminLayout';

interface VenueFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
}

const VenueForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    description: '',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    email: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<VenueFormData>>({});

  useEffect(() => {
    if (id) {
      const fetchVenue = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(buildApiUrl(`/venues/${id}`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setFormData(data.data);
          } else {
            toast.error('Failed to fetch venue details');
          }
        } catch (error) {
          toast.error('Error fetching venue details');
        }
      };

      fetchVenue();
    }
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<VenueFormData> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const url = id 
        ? buildApiUrl(`/venues/${id}`)
        : buildApiUrl('/venues');
      
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(`Venue ${id ? 'updated' : 'created'} successfully`);
        navigate('/admin/venues');
      } else {
        toast.error(`Failed to ${id ? 'update' : 'create'} venue`);
      }
    } catch (error) {
      toast.error(`Error ${id ? 'updating' : 'creating'} venue`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof VenueFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AdminLayout title={isEditing ? 'Edit Venue' : 'Add New Venue'}>
      <div className="mb-6">
        <p className="text-gray-600">
          {isEditing ? 'Update venue information' : 'Create a new venue for activities'}
        </p>
      </div>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter venue name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                placeholder="Enter venue description"
              />
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                  errors.address ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full address"
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            {/* City and Postcode */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter city"
                />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>
              
              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode *
                </label>
                <input
                  type="text"
                  id="postcode"
                  value={formData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                    errors.postcode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter postcode"
                />
                {errors.postcode && <p className="mt-1 text-sm text-red-600">{errors.postcode}</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={() => navigate('/admin')}
                variant="outline"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
              >
                {isLoading ? (
                  'Saving...'
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Update Venue
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Venue
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
      </div>
    </AdminLayout>
  );
};

export default VenueForm;
