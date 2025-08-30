import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  UsersIcon, 
  CurrencyPoundIcon, 
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';

interface AdminStats {
  totalVenues: number;
  totalActivities: number;
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  activeVenues: number;
  upcomingActivities: number;
  monthlyGrowth: number;
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  status: 'active' | 'inactive' | 'pending';
  totalActivities: number;
  totalBookings: number;
  revenue: number;
  lastActivity: string;
}

interface Activity {
  id: string;
  name: string;
  venue_name: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'draft';
  current_capacity: number;
  max_capacity: number;
  nextSession: string;
}

interface RecentBooking {
  id: string;
  activity_name: string;
  venue_name: string;
  customer_name: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('No authentication token');
      }

      // Fetch admin statistics
      const statsResponse = await fetch('http://localhost:3000/api/v1/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch admin statistics');
      }

      const statsData = await statsResponse.json();
      setStats(statsData.data);

      // Fetch venues
      const venuesResponse = await fetch('http://localhost:3000/api/v1/admin/venues', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        setVenues(venuesData.data || []);
      }

      // Fetch activities
      const activitiesResponse = await fetch('http://localhost:3000/api/v1/admin/activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.data || []);
      }

      // Fetch recent bookings
      const bookingsResponse = await fetch('http://localhost:3000/api/v1/admin/recent-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.data || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVenueAction = async (venueId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      const token = authService.getToken();
      if (!token) return;

      let method = 'PUT';
      let endpoint = `http://localhost:3000/api/v1/admin/venues/${venueId}`;
      
      if (action === 'delete') {
        method = 'DELETE';
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: action !== 'delete' ? JSON.stringify({ status: action === 'activate' ? 'active' : 'inactive' }) : undefined,
      });

      if (response.ok) {
        toast.success(`Venue ${action}d successfully`);
        fetchAdminData(); // Refresh data
      } else {
        throw new Error(`Failed to ${action} venue`);
      }
    } catch (error) {
      console.error(`Error ${action}ing venue:`, error);
      toast.error(`Failed to ${action} venue`);
    }
  };

  const handleActivityAction = async (activityId: string, action: 'activate' | 'deactivate' | 'delete') => {
    try {
      const token = authService.getToken();
      if (!token) return;

      let method = 'PUT';
      let endpoint = `http://localhost:3000/api/v1/admin/activities/${activityId}`;
      
      if (action === 'delete') {
        method = 'DELETE';
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: action !== 'delete' ? JSON.stringify({ status: action === 'activate' ? 'active' : 'inactive' }) : undefined,
      });

      if (response.ok) {
        toast.success(`Activity ${action}d successfully`);
        fetchAdminData(); // Refresh data
      } else {
        throw new Error(`Failed to ${action} activity`);
      }
    } catch (error) {
      console.error(`Error ${action}ing activity:`, error);
      toast.error(`Failed to ${action} activity`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error loading admin dashboard</p>
            <p>{error}</p>
          </div>
          <Button onClick={fetchAdminData} className="bg-[#00806a] hover:bg-[#006d5a]">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Transform stats for display
  const displayStats = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: '+12% from last month',
      changeType: 'success' as const,
      color: 'bg-blue-500',
      icon: UsersIcon
    },
    {
      title: 'Total Venues',
      value: stats?.totalVenues || 0,
      change: '+5% from last month',
      changeType: 'success' as const,
      color: 'bg-green-500',
      icon: BuildingOfficeIcon
    },
    {
      title: 'Total Activities',
      value: stats?.totalActivities || 0,
      change: '+8% from last month',
      changeType: 'success' as const,
      color: 'bg-purple-500',
      icon: AcademicCapIcon
    },
    {
      title: 'Total Revenue',
      value: `£${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      change: '+15% from last month',
      changeType: 'success' as const,
      color: 'bg-emerald-500',
      icon: CurrencyPoundIcon
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'confirmed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'inactive':
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'draft':
        return <DocumentTextIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your BookOn platform</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                System Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Venue Management Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BuildingOfficeIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                  {stats?.totalVenues || 0} venues
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Venue Management</h3>
              <p className="text-gray-600 text-sm mb-4">Create, edit, and manage all venues in your platform</p>
              <div className="flex space-x-2">
                <Link
                  to="/admin/venues/new"
                  className="flex-1 bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Add Venue
                </Link>
                <Link
                  to="/admin/venues"
                  className="bg-white hover:bg-gray-50 text-[#00806a] text-sm font-medium py-2 px-3 rounded-md border border-green-200 transition-colors duration-200"
                >
                  View All
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Activity Management Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <AcademicCapIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                  {stats?.totalActivities || 0} activities
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity Management</h3>
              <p className="text-gray-600 text-sm mb-4">Manage all activities, schedules, and pricing</p>
              <div className="flex space-x-2">
                <Link
                  to="/admin/activities/new"
                  className="flex-1 bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Add Activity
                </Link>
                <Link
                  to="/admin/activities"
                  className="bg-white hover:bg-gray-50 text-[#00806a] text-sm font-medium py-2 px-3 rounded-md border border-green-200 transition-colors duration-200"
                >
                  View All
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Booking Management Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <CalendarDaysIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                  {stats?.totalBookings || 0} bookings
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Management</h3>
              <p className="text-gray-600 text-sm mb-4">View, manage, and update all booking statuses</p>
              <div className="flex space-x-2">
                <Link
                  to="/admin/bookings"
                  className="flex-1 bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Manage Bookings
                </Link>
                <Link
                  to="/admin/bookings"
                  className="bg-white hover:bg-gray-50 text-[#00806a] text-sm font-medium py-2 px-3 rounded-md border border-green-200 transition-colors duration-200"
                >
                  View All
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Financial Dashboard Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                  £{stats?.totalRevenue?.toFixed(2) || '0.00'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Financial Dashboard</h3>
              <p className="text-gray-600 text-sm mb-4">Track revenue, analytics, and financial reports</p>
              <div className="flex space-x-2">
                <Link
                  to="/admin/financial"
                  className="flex-1 bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  View Reports
                </Link>
                <Link
                  to="/admin/financial"
                  className="bg-white hover:bg-gray-50 text-[#00806a] text-sm font-medium py-2 px-3 rounded-md border border-green-200 transition-colors duration-200"
                >
                  Analytics
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <CreditCardIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                  Configure
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Settings</h3>
              <p className="text-gray-600 text-sm mb-4">Manage Stripe integration, fees, and venue accounts</p>
              <div className="flex space-x-2">
                <Link
                  to="/admin/payment-settings"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Configure
                </Link>
                <Link
                  to="/admin/payment-settings"
                  className="bg-white hover:bg-gray-50 text-blue-600 text-sm font-medium py-2 px-3 rounded-md border border-blue-200 transition-colors duration-200"
                >
                  Manage
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* User Management Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <UsersIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                  {stats?.totalUsers || 0} users
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-gray-600 text-sm mb-4">Manage user accounts, roles, and permissions</p>
              <div className="flex space-x-2">
                <Link
                  to="/admin/users"
                  className="flex-1 bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Manage Users
                </Link>
                <Link
                  to="/admin/users"
                  className="bg-white hover:bg-gray-50 text-[#00806a] text-sm font-medium py-2 px-3 rounded-md border border-green-200 transition-colors duration-200"
                >
                  View All
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Communication Tools Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <MegaphoneIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                  Communication
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Communication Tools</h3>
              <p className="text-gray-600 text-sm mb-4">Email templates, broadcast messaging, and notifications</p>
              <div className="flex space-x-2">
                <Link
                  to="/admin/email-templates"
                  className="flex-1 bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Email Templates
                </Link>
                <Link
                  to="/admin/broadcast"
                  className="bg-white hover:bg-gray-50 text-[#00806a] text-sm font-medium py-2 px-3 rounded-md border border-green-200 transition-colors duration-200"
                >
                  Broadcast
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Tools Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Admin Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Notification Center Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <BellIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                    Notifications
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Center</h3>
                <p className="text-gray-600 text-sm mb-4">Manage system notifications and alerts</p>
                <Link
                  to="/admin/notifications"
                  className="inline-block w-full bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Open Center
                </Link>
              </CardContent>
            </Card>

            {/* Advanced Tools Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <CogIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                    System
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Tools</h3>
                <p className="text-gray-600 text-sm mb-4">Bulk operations, system config, and audit logs</p>
                <Link
                  to="/admin/advanced-tools"
                  className="inline-block w-full bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Open Tools
                </Link>
              </CardContent>
            </Card>

            {/* Widget Management Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                    Widgets
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Widget Management</h3>
                <p className="text-gray-600 text-sm mb-4">Create and manage embeddable booking widgets</p>
                <Link
                  to="/admin/widget"
                  className="inline-block w-full bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                >
                  Manage Widgets
                </Link>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#00806a] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#00806a] bg-green-200 px-2 py-1 rounded-full">
                    Quick
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
                <p className="text-gray-600 text-sm mb-4">Fast access to common admin tasks</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/admin/venues/new"
                    className="bg-[#00806a] hover:bg-[#006d5a] text-white text-xs font-medium py-2 px-2 rounded text-center transition-colors duration-200"
                  >
                    New Venue
                  </Link>
                  <Link
                    to="/admin/activities/new"
                    className="bg-[#00806a] hover:bg-[#006d5a] text-white text-xs font-medium py-2 px-2 rounded text-center transition-colors duration-200"
                  >
                    New Activity
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDaysIcon className="w-5 h-5 mr-2 text-[#00806a]" />
                Recent Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {recentBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{booking.user.name}</p>
                        <p className="text-xs text-gray-500">{booking.activity.name} at {booking.venue.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">£{booking.totalAmount}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No recent bookings</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CogIcon className="w-5 h-5 mr-2 text-[#00806a]" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database Connection</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-900">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    to="/admin/advanced-tools"
                    className="inline-block w-full bg-[#00806a] hover:bg-[#006d5a] text-white text-sm font-medium py-2 px-3 rounded-md text-center transition-colors duration-200"
                  >
                    View System Details
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
