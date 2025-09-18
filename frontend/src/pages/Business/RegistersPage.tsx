import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  ClipboardDocumentListIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface Register {
  id: string;
  activityName: string;
  venueName: string;
  date: string;
  time: string;
  instructor: string;
  totalCapacity: number;
  registeredCount: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
}

const RegistersPage: React.FC = () => {
  const { user } = useAuth();
  const [registers, setRegisters] = useState<Register[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchRegisters();
  }, []);

  const fetchRegisters = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        toast.error('Please log in to view registers');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(buildApiUrl('/business/registers'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch registers');
      }

      const data = await response.json();
      if (data.success) {
        // Transform API data to match our interface
        const transformedRegisters: Register[] = (data.data.registers || []).map((register: any) => ({
          id: register.id,
          activityName: register.session?.activity?.title || 'Unknown Activity',
          venueName: register.session?.activity?.venue?.name || 'Unknown Venue',
          date: register.session?.date || register.createdAt,
          time: register.session?.startTime || 'Unknown Time',
          instructor: register.session?.activity?.instructor || 'TBD',
          totalCapacity: register.session?.activity?.capacity || 0,
          registeredCount: register.attendees?.length || 0,
          status: register.status || 'upcoming',
          createdAt: register.createdAt
        }));
        
        setRegisters(transformedRegisters);
      } else {
        throw new Error(data.message || 'Failed to fetch registers');
      }
    } catch (error) {
      console.error('Error fetching registers:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Registers loading timeout - please refresh');
      } else {
        toast.error('Failed to load registers');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRegisters = registers.filter(register => {
    const matchesSearch = register.activityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         register.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         register.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || register.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteRegister = async (registerId: string) => {
    if (window.confirm('Are you sure you want to delete this register?')) {
      try {
        // Mock delete - replace with actual API call
        setRegisters(prev => prev.filter(r => r.id !== registerId));
        toast.success('Register deleted successfully');
      } catch (error) {
        console.error('Error deleting register:', error);
        toast.error('Failed to delete register');
      }
    }
  };

  if (loading) {
    return (
      <BusinessLayout user={user}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registers</h1>
            <p className="text-gray-600 mt-1">Manage activity registers and attendance</p>
          </div>
          <Button 
            className="flex items-center gap-2"
            onClick={() => {
              // TODO: Navigate to create register page or open modal
              toast('Create Register functionality coming soon!');
            }}
          >
            <PlusIcon className="h-5 w-5" />
            Create Register
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Registers</p>
                <p className="text-2xl font-bold text-gray-900">{registers.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registers.filter(r => r.status === 'upcoming').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registers.filter(r => r.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {registers.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search registers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Registers List */}
        <div className="space-y-4">
          {filteredRegisters.map((register) => (
            <Card key={register.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-[#00806a]" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{register.activityName}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(register.status)}`}>
                          {register.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{register.venueName}</span>
                        <span>{register.instructor}</span>
                        <span>{new Date(register.date).toLocaleDateString()} at {register.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>{register.registeredCount} / {register.totalCapacity} registered</span>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#00806a] h-2 rounded-full" 
                          style={{ width: `${(register.registeredCount / register.totalCapacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span>Created {new Date(register.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-600">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRegister(register.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredRegisters.length === 0 && (
          <Card className="p-12 text-center">
            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No registers found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first register'
              }
            </p>
            <Button
              onClick={() => {
                // TODO: Navigate to create register page or open modal
                toast('Create Register functionality coming soon!');
              }}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Register
            </Button>
          </Card>
        )}
      </div>
    </BusinessLayout>
  );
};

export default RegistersPage;
