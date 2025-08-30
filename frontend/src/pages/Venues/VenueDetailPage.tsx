import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon, 
  CalendarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  maxCapacity: number;
  isActive: boolean;
}

const VenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchVenueDetails();
      fetchVenueActivities();
    }
  }, [id]);

  const fetchVenueDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/v1/venues/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVenue(data.data);
      } else {
        toast.error('Failed to fetch venue details');
        navigate('/venues');
      }
    } catch (error) {
      toast.error('Error fetching venue details');
      navigate('/venues');
    }
  };

  const fetchVenueActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/v1/activities?venueId=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching venue activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Venue not found</h3>
          <p className="text-gray-500 mb-4">The venue you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/venues')} className="bg-[#00806a] hover:bg-[#006d5a] text-white">
            Back to Venues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => navigate('/venues')}
                variant="outline"
                className="p-2"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
                <p className="text-gray-600">Venue details and activities</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link to={`/admin/venues/${venue.id}/edit`}>
                <Button variant="outline">
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Venue
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Venue Information */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Venue Information</h2>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    venue.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {venue.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              {venue.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{venue.description}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{venue.address}, {venue.city} {venue.postcode}</span>
                </div>
                
                {venue.phone && (
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="w-5 h-5 mr-3 text-gray-400" />
                    <span>{venue.phone}</span>
                  </div>
                )}
                
                {venue.email && (
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-400" />
                    <span>{venue.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(venue.createdAt)}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {formatDate(venue.updatedAt)}
                  </div>
                </div>
              </div>
            </Card>

            {/* Activities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Activities</h2>
              
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities available</h3>
                  <p className="text-gray-500 mb-4">
                    This venue doesn't have any activities scheduled yet.
                  </p>
                  <Link to="/admin/activities/new">
                    <Button className="bg-[#00806a] hover:bg-[#006d5a] text-white">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">{activity.name}</h3>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {activity.duration} min
                            </div>
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{formatPrice(activity.price)}</span>
                            </div>
                            <div className="flex items-center">
                              <span>Max: {activity.maxCapacity}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                          activity.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {activity.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/bookings/flow" className="w-full">
                  <Button className="w-full bg-[#00806a] hover:bg-[#006d5a] text-white">
                    Book Activity
                  </Button>
                </Link>
                <Link to="/admin/activities/new" className="w-full">
                  <Button variant="outline" className="w-full">
                    Add Activity
                  </Button>
                </Link>
                <Link to="/venues" className="w-full">
                  <Button variant="outline" className="w-full">
                    View All Venues
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailPage;
