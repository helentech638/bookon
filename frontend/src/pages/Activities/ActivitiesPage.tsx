import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingWidget } from '../../components/booking/BookingWidget';
import { Activity, Venue } from '../../types/booking';
import AdminLayout from '../../components/layout/AdminLayout';
import { buildApiUrl } from '../../config/api';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Users, 
  Star,
  Calendar,
  Tag
} from 'lucide-react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch activities
        const token = authService.getToken();
        if (!token) {
          toast.error('Please log in to view activities');
          navigate('/login');
          return;
        }

        const activitiesResponse = await fetch(buildApiUrl('/activities'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!activitiesResponse.ok) {
          throw new Error('Failed to fetch activities');
        }

        const activitiesData = await activitiesResponse.json();
        
        if (activitiesData.success) {
          // Transform backend data to frontend format
          const transformedActivities: Activity[] = activitiesData.data.map((activity: any) => ({
            id: activity.id.toString(),
            name: activity.title,
            description: activity.description || 'No description available',
            category: 'Sports', // Default category since backend doesn't have this field
            venue_id: activity.venueId?.toString() || '1',
            max_capacity: activity.capacity || 10,
            current_capacity: 0, // Backend doesn't track current capacity
            price: parseFloat(activity.price) || 0,
            duration: 60, // Default duration since backend doesn't have this field
            age_range: { min: 5, max: 16 }, // Default age range
            skill_level: 'All Levels', // Default skill level
            instructor: 'TBD', // Default instructor
            is_active: activity.isActive,
            start_date: activity.startDate ? new Date(activity.startDate).toISOString().split('T')[0] : '2024-01-01',
            end_date: activity.endDate ? new Date(activity.endDate).toISOString().split('T')[0] : '2024-12-31',
            start_time: activity.startTime || '10:00',
            end_time: activity.endTime || '11:00',
            images: ['/images/default-activity.jpg'],
            created_at: activity.createdAt || '2024-01-01T00:00:00Z',
            updated_at: activity.updatedAt || '2024-01-01T00:00:00Z'
          }));
          
          setActivities(transformedActivities);
        } else {
          throw new Error(activitiesData.message || 'Failed to fetch activities');
        }

        // Fetch venues (using a mock for now since we don't have a venues endpoint)
        const mockVenues: Venue[] = [
          {
            id: '1',
            name: 'Main Venue',
            address: '123 Main Street',
            city: 'London',
            state: 'England',
            zip_code: 'SW1A 1AA',
            country: 'UK',
            capacity: 50,
            amenities: ['Parking', 'Changing Rooms'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ];
        setVenues(mockVenues);

      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load activities. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const categories = ['All', 'Sports', 'Arts', 'Music', 'Academic', 'Recreation'];
  const venueOptions = ['All', ...venues.map(v => v.name)];

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activity.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || activity.category === selectedCategory;
    const matchesVenue = !selectedVenue || selectedVenue === 'All' || 
                        venues.find(v => v.id === activity.venue_id)?.name === selectedVenue;
    const matchesPrice = activity.price >= priceRange[0] && activity.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesVenue && matchesPrice;
  });

  const handleBookActivity = (activityId: string) => {
    navigate(`/bookings/flow/${activityId}`);
  };

  // Render content based on user role
  const renderContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              to="/parent/dashboard" 
              className="flex items-center text-gray-600 hover:text-[#00806a] transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activities</h1>
          <p className="text-gray-600">Discover and book activities for your children</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Venues</option>
                {venueOptions.slice(1).map(venue => (
                  <option key={venue} value={venue}>{venue}</option>
                ))}
              </select>

              <Button variant="outline" className="px-4 py-3">
                <Filter className="h-5 w-5 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Price Range:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Min"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100])}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Max"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredActivities.length} of {activities.length} activities
          </p>
        </div>

        {/* Activities Grid */}
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
            <Button onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
              setSelectedVenue('');
              setPriceRange([0, 100]);
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => (
              <Card key={activity.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={activity.images?.[0] || '/images/default-activity.jpg'}
                    alt={activity.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {activity.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Tag className="h-4 w-4" />
                        <span>{activity.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        £{activity.price}
                      </div>
                      <div className="text-sm text-gray-500">per session</div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {activity.description || 'No description available'}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{venues.find(v => v.id === activity.venue_id)?.name || 'Unknown Venue'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{activity.start_time} - {activity.end_time}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{activity.current_capacity}/{activity.max_capacity} participants</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">4.8 (24 reviews)</span>
                    </div>
                    
                    <Button
                      onClick={() => handleBookActivity(activity.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For admin users, wrap with AdminLayout, otherwise return content directly
  if (user?.role === 'admin') {
    return (
      <AdminLayout title="Activities">
        <div className="p-6">
          {renderContent()}
        </div>
      </AdminLayout>
    );
  }

  return renderContent();
};

export default ActivitiesPage;