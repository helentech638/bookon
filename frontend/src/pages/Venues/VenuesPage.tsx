import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  PhoneIcon, 
  EnvelopeIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import AdminLayout from '../../components/layout/AdminLayout';
import { buildApiUrl } from '../../config/api';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

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

const VenuesPage: React.FC = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    // Filter venues based on search term
    const filtered = venues.filter(venue =>
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVenues(filtered);
  }, [searchTerm, venues]);

  const fetchVenues = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl('/venues'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVenues(data.data || []);
      } else {
        toast.error('Failed to fetch venues');
      }
    } catch (error) {
      toast.error('Error fetching venues');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Render content based on user role
  const renderContent = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/parent/dashboard" 
                className="flex items-center text-gray-600 hover:text-[#00806a] transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                <span className="font-medium">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
                <p className="text-gray-600">
                  Discover and explore available venues for activities
                </p>
              </div>
            </div>
            {user?.role === 'admin' && (
              <div className="flex space-x-3">
                <Link to="/admin/venues/new">
                  <Button className="bg-[#00806a] hover:bg-[#006d5a] text-white">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Venue
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search venues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#00806a] focus:border-[#00806a] sm:text-sm"
            />
          </div>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No venues found' : 'No venues available'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms or browse all venues.'
                : 'Venues will appear here once they are added to the platform.'
              }
            </p>
            {!searchTerm && user?.role === 'admin' && (
              <Link to="/admin/venues/new">
                <Button className="bg-[#00806a] hover:bg-[#006d5a] text-white">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add First Venue
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <Card key={venue.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {venue.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {venue.description || 'No description available'}
                    </p>
                  </div>
                  <div className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    venue.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {venue.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{venue.address}, {venue.city} {venue.postcode}</span>
                  </div>
                  
                  {venue.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{venue.phone}</span>
                    </div>
                  )}
                  
                  {venue.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                      <span>{venue.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Added {formatDate(venue.createdAt)}
                  </span>
                  <div className="flex space-x-2">
                    {user?.role === 'admin' && (
                      <Link to={`/admin/venues/${venue.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                    )}
                    <Link to={`/venues/${venue.id}`}>
                      <Button size="sm" className="bg-[#00806a] hover:bg-[#006d5a] text-white">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venues...</p>
        </div>
      </div>
    );
  }

  // For admin users, wrap with AdminLayout, otherwise return content directly
  if (user?.role === 'admin') {
    return (
      <AdminLayout title="Venues">
        <div className="p-6">
          {renderContent()}
        </div>
      </AdminLayout>
    );
  }

  return renderContent();
};

export default VenuesPage;
