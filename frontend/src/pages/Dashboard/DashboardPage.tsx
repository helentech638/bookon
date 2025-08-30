import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  UsersIcon, 
  CurrencyPoundIcon, 
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { BookingWidget } from '../../components/booking/BookingWidget';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  totalSpent: number;
  upcomingActivities: number;
  memberSince: number;
  lastLogin: string;
  totalActivities: number;
  totalVenues: number;
  pendingBookings: number;
  cancelledBookings: number;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  memberSince: string;
  phone?: string;
  address?: string;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'activity' | 'payment' | 'login';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickBooking, setShowQuickBooking] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      if (!token) {
        throw new Error('No authentication token');
      }

      // Fetch dashboard statistics
      const statsResponse = await fetch('http://localhost:3000/api/v1/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const statsData = await statsResponse.json();
      setStats(statsData.data);

      // Fetch user profile
      const profileResponse = await fetch('http://localhost:3000/api/v1/dashboard/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profileData = await profileResponse.json();
      setUserProfile(profileData.data.user);

      // Fetch recent activities
      const activitiesResponse = await fetch('http://localhost:3000/api/v1/dashboard/recent-activities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData.data || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickBooking = () => {
    setShowQuickBooking(false);
    // Navigate to the booking flow
    navigate('/bookings/flow');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error loading dashboard</p>
            <p>{error}</p>
          </div>
          <Button onClick={fetchDashboardData} className="bg-[#00806a] hover:bg-[#006d5a]">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Transform stats for display
  const displayStats = [
    {
      title: 'Total Bookings',
      value: stats?.totalBookings?.toString() || '0',
      change: stats?.pendingBookings ? `${stats.pendingBookings} pending` : 'All confirmed',
      changeType: stats?.pendingBookings ? 'warning' : 'success',
      icon: CalendarDaysIcon,
      color: 'bg-blue-500',
      description: 'Total bookings made'
    },
    {
      title: 'Confirmed Bookings',
      value: stats?.confirmedBookings?.toString() || '0',
      change: 'Active',
      changeType: 'success',
      icon: UsersIcon,
      color: 'bg-green-500',
      description: 'Confirmed and active bookings'
    },
    {
      title: 'Total Spent',
      value: `£${stats?.totalSpent?.toFixed(2) || '0.00'}`,
      change: 'This month',
      changeType: 'info',
      icon: CurrencyPoundIcon,
      color: 'bg-[#00806a]',
      description: 'Total amount spent on activities'
    },
    {
      title: 'Upcoming Activities',
      value: stats?.upcomingActivities?.toString() || '0',
      change: 'Next 7 days',
      changeType: 'info',
      icon: ClockIcon,
      color: 'bg-purple-500',
      description: 'Activities scheduled soon'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return CalendarDaysIcon;
      case 'activity':
        return AcademicCapIcon;
      case 'payment':
        return CurrencyPoundIcon;
      case 'login':
        return UserIcon;
      default:
        return DocumentTextIcon;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, {userProfile?.firstName || 'User'}! Here's your activity overview.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowQuickBooking(true)}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
                leftIcon={<PlusIcon className="w-4 h-4" />}
              >
                Quick Booking
              </Button>
              <Link to="/profile" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                <UserIcon className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stat.changeType === 'success' 
                    ? 'bg-green-100 text-green-800'
                    : stat.changeType === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {stat.change}
                </span>
                <span className="text-xs text-gray-500 ml-2">{stat.description}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Access Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/bookings/flow"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#00806a] hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#00806a] rounded-lg flex items-center justify-center mr-3 group-hover:bg-[#006d5a] transition-colors">
                  <CalendarDaysIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-[#00806a]">Book Activity</h3>
                  <p className="text-sm text-gray-500">Start new booking</p>
                </div>
              </div>
            </Link>

            <Link
              to="/children"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#00806a] hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#00806a] rounded-lg flex items-center justify-center mr-3 group-hover:bg-[#006d5a] transition-colors">
                  <UserGroupIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-[#00806a]">My Children</h3>
                  <p className="text-sm text-gray-500">Manage profiles</p>
                </div>
              </div>
            </Link>

            <Link
              to="/bookings"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#00806a] hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#00806a] rounded-lg flex items-center justify-center mr-3 group-hover:bg-[#006d5a] transition-colors">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-[#00806a]">My Bookings</h3>
                  <p className="text-sm text-gray-500">View all bookings</p>
                </div>
              </div>
            </Link>

            <Link
              to="/activities"
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-[#00806a] hover:shadow-md transition-all group"
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#00806a] rounded-lg flex items-center justify-center mr-3 group-hover:bg-[#006d5a] transition-colors">
                  <AcademicCapIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-[#00806a]">Browse Activities</h3>
                  <p className="text-sm text-gray-500">Find activities</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'profile', name: 'Profile', icon: UserIcon },
                { id: 'activities', name: 'Activities', icon: AcademicCapIcon },
                { id: 'venues', name: 'Venues', icon: BuildingOfficeIcon },
                { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
                // Admin-specific tabs
                ...(userProfile?.role === 'admin' || userProfile?.role === 'staff' ? [
                  { id: 'registers', name: 'Registers', icon: ClipboardDocumentListIcon },
                  { id: 'financial', name: 'Financial', icon: CreditCardIcon }
                ] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-[#00806a] text-[#00806a]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Welcome Card */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Welcome to BookOn!</h3>
                <BellIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Welcome, {userProfile?.firstName} {userProfile?.lastName}!
                      </p>
                      <p className="text-sm text-blue-700">
                        You've been a member for {stats?.memberSince || 0} days.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Ready to get started?
                      </p>
                      <p className="text-sm text-green-700">
                        Browse available activities and book your first session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                <CogIcon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowQuickBooking(true)}
                  className="w-full justify-center bg-[#00806a] hover:bg-[#006d5a] text-white"
                  leftIcon={<PlusIcon className="w-4 h-4" />}
                >
                  Quick Booking
                </Button>
                <Link 
                  to="/activities" 
                  className="w-full justify-center inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]"
                >
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  Browse Activities
                </Link>
                <Link 
                  to="/venues" 
                  className="w-full justify-center inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]"
                >
                  <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                  Manage Venues
                </Link>
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                <Link to="/activity-log" className="text-sm text-[#00806a] hover:text-[#006d5a]">
                  View all
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivities.slice(0, 5).map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                  );
                })}
                {recentActivities.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'profile' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Your Profile</h3>
              <Link to="/profile/edit" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </Link>
            </div>
            {userProfile && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {userProfile.firstName} {userProfile.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{userProfile.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{userProfile.role}</p>
                  </div>
                  {userProfile.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{userProfile.phone}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Member Since</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(userProfile.memberSince).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userProfile.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userProfile.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  {userProfile.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="mt-1 text-sm text-gray-900">{userProfile.address}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Available Activities</h3>
                <Link to="/activities" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Activity
                </Link>
              </div>
              <div className="text-center py-12">
                <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Activities Available Yet</h3>
                <p className="text-gray-500 mb-4">
                  Activities will be added by venue administrators. Check back soon!
                </p>
                <Link to="/activities" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  Check for Activities
                </Link>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'venues' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Venue Management</h3>
                <Link to="/venues" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Venue
                </Link>
              </div>
              <div className="text-center py-12">
                <BuildingOfficeIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Venues Available Yet</h3>
                <p className="text-gray-500 mb-4">
                  Venues will be added by administrators. Check back soon!
                </p>
                <Link to="/venues" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  Manage Venues
                </Link>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Account Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.totalBookings || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Confirmed Bookings</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.confirmedBookings || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Pending Bookings</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.pendingBookings || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Spent</span>
                  <span className="text-sm font-medium text-gray-900">£{stats?.totalSpent?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Activities</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.totalActivities || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Venues</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.totalVenues || 0}</span>
                </div>
              </div>
            </Card>
            
            <Card>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Coming Soon</h3>
              <div className="text-center py-8">
                <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Advanced analytics and charts will be available here once you start using the platform.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Admin-specific tabs */}
        {activeTab === 'registers' && (userProfile?.role === 'admin' || userProfile?.role === 'staff') && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Digital Registers</h3>
                <Link to="/admin/registers" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <PlusIcon className="w-4 w-4 mr-2" />
                  Manage Registers
                </Link>
              </div>
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="w-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Attendance Management</h3>
                <p className="text-gray-500 mb-4">
                  Create digital registers, track attendance, and manage student records.
                </p>
                <Link to="/admin/registers" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <ClipboardDocumentListIcon className="w-4 w-4 mr-2" />
                  Go to Registers
                </Link>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'financial' && (userProfile?.role === 'admin' || userProfile?.role === 'staff') && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Financial Management</h3>
                <Link to="/admin/financial" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <PlusIcon className="w-4 w-4 mr-2" />
                  Financial Dashboard
                </Link>
              </div>
              <div className="text-center py-12">
                <CreditCardIcon className="w-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment & Revenue</h3>
                <p className="text-gray-500 mb-4">
                  Manage Stripe Connect accounts, track payments, and view financial reports.
                </p>
                <Link to="/admin/financial" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <CreditCardIcon className="w-4 w-4 mr-2" />
                  Go to Financial
                </Link>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'widget' && (userProfile?.role === 'admin' || userProfile?.role === 'staff') && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Widget Management</h3>
                <Link to="/admin/widget" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <PlusIcon className="w-4 w-4 mr-2" />
                  Manage Widgets
                </Link>
              </div>
              <div className="text-center py-12">
                <AcademicCapIcon className="w-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Embeddable Booking Widget</h3>
                <p className="text-gray-500 mb-4">
                  Create and configure widgets to embed the booking system on external websites.
                </p>
                <Link to="/admin/widget" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                  <AcademicCapIcon className="w-4 w-4 mr-2" />
                  Go to Widget Management
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Booking Modal */}
      {showQuickBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Booking</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a quick booking for an activity. You can customize the details later.
            </p>
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowQuickBooking(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickBooking}
                className="flex-1 bg-[#00806a] hover:bg-[#006d5a]"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
