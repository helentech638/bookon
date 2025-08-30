import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { BookingWidget } from '../../components/booking/BookingWidget';
import { Activity, Venue } from '../../types/booking';
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

const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        const mockActivities: Activity[] = [
          {
            id: '1',
            name: 'Swimming Lessons',
            description: 'Learn to swim with certified instructors in our heated pool. Suitable for all skill levels.',
            category: 'Sports',
            venue_id: '1',
            max_capacity: 8,
            current_capacity: 5,
            price: 25,
            duration: 60,
            age_range: { min: 5, max: 12 },
            skill_level: 'Beginner',
            instructor: 'Sarah Johnson',
            is_active: true,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            start_time: '09:00',
            end_time: '10:00',
            created_at: '2025-08-29T10:00:00Z',
            updated_at: '2025-08-29T10:00:00Z',
          },
          {
            id: '2',
            name: 'Art & Craft Workshop',
            description: 'Creative arts and crafts for children. Develop creativity and fine motor skills.',
            category: 'Arts',
            venue_id: '1',
            max_capacity: 12,
            current_capacity: 8,
            price: 20,
            duration: 45,
            age_range: { min: 6, max: 10 },
            skill_level: 'All Levels',
            instructor: 'Emma Davis',
            is_active: true,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            start_time: '14:00',
            end_time: '14:45',
            created_at: '2025-08-29T10:00:00Z',
            updated_at: '2025-08-29T10:00:00Z',
          },
          {
            id: '3',
            name: 'Football Training',
            description: 'Professional football coaching for young players. Improve skills and teamwork.',
            category: 'Sports',
            venue_id: '2',
            max_capacity: 15,
            current_capacity: 12,
            price: 30,
            duration: 90,
            age_range: { min: 8, max: 14 },
            skill_level: 'Intermediate',
            instructor: 'Mike Wilson',
            is_active: true,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            start_time: '16:00',
            end_time: '17:30',
            created_at: '2025-08-29T10:00:00Z',
            updated_at: '2025-08-29T10:00:00Z',
          },
          {
            id: '4',
            name: 'Music Lessons',
            description: 'Individual and group music lessons. Piano, guitar, and singing available.',
            category: 'Music',
            venue_id: '1',
            max_capacity: 6,
            current_capacity: 4,
            price: 35,
            duration: 30,
            age_range: { min: 7, max: 15 },
            skill_level: 'All Levels',
            instructor: 'David Brown',
            is_active: true,
            start_date: '2025-09-01',
            end_date: '2025-12-31',
            start_time: '15:00',
            end_time: '15:30',
            created_at: '2025-08-29T10:00:00Z',
            updated_at: '2025-08-29T10:00:00Z',
          },
        ];

        const mockVenues: Venue[] = [
          {
            id: '1',
            name: 'Community Sports Centre',
            description: 'Modern sports facility with swimming pool, gym, and activity rooms.',
            address: '123 Sports Lane',
            city: 'London',
            state: 'England',
            zip_code: 'SW1A 1AA',
            country: 'UK',
            phone: '+44 20 7123 4567',
            email: 'info@sportscentre.com',
            website: 'https://sportscentre.com',
            capacity: 200,
            amenities: ['Swimming Pool', 'Gym', 'Activity Rooms', 'Café'],
            is_active: true,
            created_at: '2025-08-29T10:00:00Z',
            updated_at: '2025-08-29T10:00:00Z',
          },
          {
            id: '2',
            name: 'Riverside Park',
            description: 'Beautiful outdoor sports facility with football pitches and running tracks.',
            address: '456 River Road',
            city: 'London',
            state: 'England',
            zip_code: 'SW2B 2BB',
            country: 'UK',
            phone: '+44 20 7123 4568',
            email: 'info@riversidepark.com',
            website: 'https://riversidepark.com',
            capacity: 500,
            amenities: ['Football Pitches', 'Running Track', 'Playground', 'Picnic Area'],
            is_active: true,
            created_at: '2025-08-29T10:00:00Z',
            updated_at: '2025-08-29T10:00:00Z',
          },
        ];

        setActivities(mockActivities);
        setVenues(mockVenues);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = ['All', 'Sports', 'Arts', 'Music', 'Academic', 'Recreation'];
  const venueOptions = ['All', ...venues.map(v => v.name)];

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || activity.category === selectedCategory;
    const matchesVenue = selectedVenue === 'All' || 
                        venues.find(v => v.id === activity.venue_id)?.name === selectedVenue;
    const matchesPrice = activity.price >= priceRange[0] && activity.price <= priceRange[1];

    return matchesSearch && matchesCategory && matchesVenue && matchesPrice;
  });

  const handleBookingComplete = (bookingId: string) => {
    console.log('Booking completed:', bookingId);
    // TODO: Show success message and redirect to booking confirmation
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activities</h1>
          <p className="text-gray-600">Discover and book exciting activities for your children</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Venue Filter */}
            <select
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
            >
              {venueOptions.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>

            {/* Price Range */}
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-20 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                placeholder="Max"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100])}
                className="w-20 px-2 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActivities.map((activity) => {
            const venue = venues.find(v => v.id === activity.venue_id);
            
            return (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{activity.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{activity.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">£{activity.price}</div>
                      <div className="text-sm text-gray-500">per session</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 mb-4">{activity.description}</p>
                  
                  {/* Activity Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{activity.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="h-4 w-4" />
                      <span>{activity.current_capacity}/{activity.max_capacity} spots</span>
                    </div>
                    {venue && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{venue.name}</span>
                      </div>
                    )}
                    {activity.instructor && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Star className="h-4 w-4" />
                        <span>Instructor: {activity.instructor}</span>
                      </div>
                    )}
                  </div>

                  {/* Availability Status */}
                  <div className="mb-4">
                    {activity.current_capacity < activity.max_capacity ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <span>Available</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <span>Fully Booked</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <BookingWidget
                      activityId={activity.id}
                      venueId={activity.venue_id}
                      onBookingComplete={handleBookingComplete}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivitiesPage;
