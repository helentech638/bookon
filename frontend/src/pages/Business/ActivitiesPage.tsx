import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';
import toast from 'react-hot-toast';

interface Activity {
  id: string;
  name: string;
  type: string;
  venue: string;
  venueId: string;
  time: string;
  capacity: number;
  booked: number;
  status: string;
  nextSession: string;
  description?: string;
  price?: number;
  createdAt: string;
  updatedAt: string;
}

interface Venue {
  id: string;
  name: string;
}

const ActivitiesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    venue: '',
    status: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchActivities();
  }, [filters, pagination.page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      if (!token) {
        navigate('/login');
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.type && { type: filters.type }),
        ...(filters.venue && { venue: filters.venue }),
        ...(filters.status && { status: filters.status })
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(buildApiUrl(`/business/activities?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      
      if (data.success) {
        setActivities(data.data.activities || []);
        setVenues(data.data.venues || []);
        setPagination(data.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      } else {
        throw new Error(data.message || 'Failed to fetch activities');
      }
    } catch (error) {
      console.error('Activities fetch error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setError('Activities loading timeout - please refresh');
        toast.error('Activities loading timeout - please refresh');
      } else {
        setError(error instanceof Error ? error.message : 'Failed to load activities');
        toast.error('Failed to load activities');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/business/activities/${activityId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Activity deleted successfully');
        fetchActivities(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to delete activity');
      }
    } catch (error) {
      console.error('Delete activity error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete activity');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <BusinessLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-gray-600">Manage your activities and sessions</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => {/* Navigate to templates */}}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              <CalendarDaysIcon className="w-4 h-4 mr-2" />
              From Template
            </Button>
            <Button
              onClick={() => navigate('/business/activities/new')}
              className="bg-[#00806a] hover:bg-[#006d5a] text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Activity
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search activities..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              />
            </div>
            <select 
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a]"
            >
              <option value="">All Types</option>
              <option value="After-School">After-School</option>
              <option value="Holiday Club">Holiday Club</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Other">Other</option>
            </select>
            <select 
              value={filters.venue}
              onChange={(e) => handleFilterChange('venue', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a]"
            >
              <option value="">All Venues</option>
              {venues.map(venue => (
                <option key={venue.id} value={venue.id}>{venue.name}</option>
              ))}
            </select>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a]"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <Card key={activity.id} className="bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{activity.name}</h3>
                  <p className="text-sm text-gray-600">{activity.type}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  {activity.venue}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  {activity.time}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <UserGroupIcon className="w-4 h-4 mr-2" />
                  {activity.booked}/{activity.capacity} children
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Capacity</span>
                  <span>{Math.round((activity.booked / activity.capacity) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      activity.booked / activity.capacity > 0.8 
                        ? 'bg-red-500' 
                        : activity.booked / activity.capacity > 0.6 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${(activity.booked / activity.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  onClick={() => {/* View activity */}}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  onClick={() => {/* Edit activity */}}
                  className="flex-1 bg-[#00806a] hover:bg-[#006d5a] text-white text-sm"
                >
                  <PencilIcon className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteActivity(activity.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 text-sm px-3"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {activities.length === 0 && (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No activities</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new activity.</p>
            <div className="mt-6">
              <Button
                onClick={() => navigate('/business/activities/new')}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New Activity
              </Button>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
};

export default ActivitiesPage;
