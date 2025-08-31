import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { buildApiUrl } from '../../config/api';

interface ActivityFormData {
  venue_id: string;
  name: string;
  description: string;
  duration: string | number;
  price: string | number;
  max_capacity: string | number;
  is_active: boolean;
}

interface Venue {
  id: string;
  name: string;
}

const ActivityForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState<ActivityFormData>({
    venue_id: '',
    name: '',
    description: '',
    duration: 60,
    price: 0,
    max_capacity: 20,
    is_active: true
  });
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ActivityFormData>>({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const fetchVenues = async () => {
      try {
        const response = await fetch(buildApiUrl('/venues'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVenues(data.data || []);
          if (data.data.length > 0 && !formData.venue_id) {
            setFormData(prev => ({ ...prev, venue_id: data.data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        toast.error('Failed to fetch venues');
      }
    };

    if (token) {
      fetchVenues();
    }
  }, [formData.venue_id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (id) {
      const fetchActivity = async () => {
        try {
          const response = await fetch(buildApiUrl(`/activities/${id}`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setFormData(data.data);
          } else {
            toast.error('Failed to fetch activity details');
          }
        } catch (error) {
          console.error('Error fetching activity:', error);
          toast.error('Failed to fetch activity details');
        }
      };

      fetchActivity();
    }
  }, [id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ActivityFormData> = {};
    
    if (!formData.venue_id) newErrors.venue_id = 'Venue is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    const duration = Number(formData.duration);
    if (duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    
    const price = Number(formData.price);
    if (price < 0) newErrors.price = 'Price cannot be negative';
    
    const maxCapacity = Number(formData.max_capacity);
    if (maxCapacity <= 0) newErrors.max_capacity = 'Capacity must be greater than 0';

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
        ? buildApiUrl(`/activities/${id}`)
        : buildApiUrl('/activities');
      
      const method = id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Activity ${isEditing ? 'updated' : 'created'} successfully`);
        navigate('/admin');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} activity`);
      }
    } catch (error) {
      toast.error(`Error ${isEditing ? 'updating' : 'creating'} activity`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ActivityFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="p-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Edit Activity' : 'Add New Activity'}
                </h1>
                <p className="text-gray-600">
                  {isEditing ? 'Update activity information' : 'Create a new activity for a venue'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Venue Selection */}
            <div>
              <label htmlFor="venue_id" className="block text-sm font-medium text-gray-700 mb-2">
                Venue *
              </label>
              <select
                id="venue_id"
                value={formData.venue_id}
                onChange={(e) => handleInputChange('venue_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                  errors.venue_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a venue</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              {errors.venue_id && <p className="mt-1 text-sm text-red-600">{errors.venue_id}</p>}
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Activity Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter activity name"
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
                placeholder="Enter activity description"
              />
            </div>

            {/* Duration, Price, and Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="1"
                />
                {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (£) *
                </label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                    errors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="0"
                  step="0.01"
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>
              
              <div>
                <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Capacity *
                </label>
                <input
                  type="number"
                  id="max_capacity"
                  value={formData.max_capacity}
                  onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a] ${
                    errors.max_capacity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  min="1"
                />
                {errors.max_capacity && <p className="mt-1 text-sm text-red-600">{errors.max_capacity}</p>}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Activity is active
              </label>
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
                        Update Activity
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Activity
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
  );
};

export default ActivityForm;
