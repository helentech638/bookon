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
  CreditCardIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { BookingWidget } from '../../components/booking/BookingWidget';
import toast from 'react-hot-toast';
import { buildApiUrl, API_CONFIG } from '../../config/api';

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
    const startTime = performance.now();
    try {
      setLoading(true);
      const token = authService.getToken();
      const isAuth = authService.isAuthenticated();
      
      console.log('Auth Debug:', { 
        token: token ? 'exists' : 'missing', 
        isAuth,
        tokenLength: token?.length || 0
      });
      
      if (!token || !isAuth) {
        console.log('No valid authentication, redirecting to login');
        window.location.href = '/login';
        return;
      }

      // Verify token before making API calls
      const tokenValid = await authService.verifyToken();
      if (!tokenValid) {
        console.log('Token verification failed, redirecting to login');
        authService.logout();
        window.location.href = '/login';
        return;
      }

      const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
      };

      // Make all API calls in parallel for better performance
      const apiStartTime = performance.now();
      const [statsResponse, profileResponse, activitiesResponse] = await Promise.allSettled([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.STATS), { headers }),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.PROFILE), { headers }),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES), { headers })
      ]);
      const apiEndTime = performance.now();
      console.log(`Dashboard API calls completed in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

      // Process stats response
      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json();
        setStats(statsData.data);
      } else {
        console.warn('Failed to fetch dashboard stats:', statsResponse.status === 'rejected' ? statsResponse.reason : 'Response not ok');
      }

      // Process profile response
      if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
        const profileData = await profileResponse.value.json();
        setUserProfile(profileData.data);
      } else {
        console.warn('Failed to fetch user profile:', profileResponse.status === 'rejected' ? profileResponse.reason : 'Response not ok');
      }

      // Process activities response
      if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value.ok) {
        const activitiesData = await activitiesResponse.value.json();
        setRecentActivities(activitiesData.data || []);
      } else {
        console.warn('Failed to fetch recent activities:', activitiesResponse.status === 'rejected' ? activitiesResponse.reason : 'Response not ok');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Dashboard data fetch error:', err);
      
      // If authentication failed, redirect to login after a short delay
      if (errorMessage.includes('authentication') || errorMessage.includes('token')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(false);
      const endTime = performance.now();
      console.log(`Total dashboard loading time: ${(endTime - startTime).toFixed(2)}ms`);
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
          
          {/* Debug Info */}
          <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <p>Token: {authService.getToken() ? '✅ Present' : '❌ Missing'}</p>
            <p>Authenticated: {authService.isAuthenticated() ? '✅ Yes' : '❌ No'}</p>
            <p>User: {authService.getUser() ? '✅ Loaded' : '❌ Missing'}</p>
            <div className="mt-3 p-2 bg-yellow-100 rounded text-sm">
              <strong>Issue:</strong> Token exists but backend rejects it. This usually means the token is expired or the JWT secret changed.
            </div>
          </div>
          
          <div className="space-x-4">
          <Button onClick={fetchDashboardData} className="bg-[#00806a] hover:bg-[#006d5a]">
            Retry
          </Button>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Login
            </Button>
            <Button 
              onClick={() => {
                authService.logout();
                localStorage.clear();
                window.location.href = '/login';
              }} 
              className="bg-red-600 hover:bg-red-700"
            >
              Force Logout & Clear All
          </Button>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Premium Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
              <p className="text-gray-600 text-lg">
                Welcome back, <span className="font-semibold text-[#00806a]">{userProfile?.firstName || 'User'}</span>! Here's your activity overview.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => setShowQuickBooking(true)}
                className="bg-gradient-to-r from-[#00806a] to-[#041c30] hover:from-[#006b5a] hover:to-[#052a42] text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                leftIcon={<PlusIcon className="w-5 h-5" />}
              >
                Quick Booking
              </Button>
              <Link to="/profile" className="inline-flex items-center px-6 py-3 border-2 border-[#00806a] text-[#00806a] hover:bg-[#00806a] hover:text-white rounded-xl font-medium transition-all duration-200">
                <UserIcon className="w-5 h-5 mr-2" />
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {displayStats.map((stat, index) => (
            <div key={index} className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-gray-100/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                </div>
              </div>
              <div className="space-y-2">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  stat.changeType === 'success' 
                    ? 'bg-green-100 text-green-800'
                    : stat.changeType === 'warning'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {stat.change}
                </span>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
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

        {/* Premium Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100/50 p-2">
            <nav className="flex space-x-1">
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
                  className={`relative flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#00806a] to-[#006d5a] text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/80 hover:shadow-sm'
                  }`}
                >
                  <tab.icon className={`w-4 h-4 transition-all duration-300 ${
                    activeTab === tab.id ? 'text-white' : 'text-gray-500'
                  }`} />
                  <span className="font-semibold">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00806a] to-[#006d5a] opacity-20 animate-pulse"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Premium Welcome Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Welcome to BookOn!</h3>
                <div className="w-12 h-12 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-2xl flex items-center justify-center">
                  <BellIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-blue-900">
                        Welcome, {userProfile?.firstName} {userProfile?.lastName}!
                      </p>
                      <p className="text-blue-700">
                        You've been a member for <span className="font-semibold">{stats?.memberSince || 0} days</span>.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center">
                      <CalendarDaysIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-900">
                        Ready to get started?
                      </p>
                      <p className="text-green-700">
                        Browse available activities and book your first session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Quick Actions</h3>
                <div className="w-12 h-12 bg-gradient-to-r from-[#00806a] to-[#041c30] rounded-2xl flex items-center justify-center">
                  <CogIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-4">
                <Button 
                  onClick={() => setShowQuickBooking(true)}
                  className="w-full justify-center bg-gradient-to-r from-[#00806a] to-[#006d5a] hover:from-[#006b5a] hover:to-[#005a4a] text-white py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 text-lg font-bold transform hover:-translate-y-1"
                  leftIcon={<PlusIcon className="w-6 h-6" />}
                >
                  Quick Booking
                </Button>
                <Link 
                  to="/activities" 
                  className="w-full justify-center inline-flex items-center px-6 py-5 border-2 border-gray-200 rounded-2xl text-gray-700 bg-white hover:border-[#00806a] hover:bg-gradient-to-r hover:from-[#00806a] hover:to-[#006d5a] hover:text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <CalendarDaysIcon className="w-6 h-6 mr-3" />
                  Browse Activities
                </Link>
                <Link 
                  to="/venues" 
                  className="w-full justify-center inline-flex items-center px-6 py-5 border-2 border-gray-200 rounded-2xl text-gray-700 bg-white hover:border-[#00806a] hover:bg-gradient-to-r hover:from-[#00806a] hover:to-[#006d5a] hover:text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <BuildingOfficeIcon className="w-6 h-6 mr-3" />
                  Manage Venues
                </Link>
                <Link 
                  to="/profile" 
                  className="w-full justify-center inline-flex items-center px-6 py-5 border-2 border-gray-200 rounded-2xl text-gray-700 bg-white hover:border-[#00806a] hover:bg-gradient-to-r hover:from-[#00806a] hover:to-[#006d5a] hover:text-white transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <UserIcon className="w-6 h-6 mr-3" />
                  View Profile
                </Link>
              </div>
            </div>

            {/* Premium Recent Activity */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-gray-900">Recent Activity</h3>
                <Link to="/activity-log" className="text-sm font-semibold text-[#00806a] hover:text-[#006d5a] px-3 py-1 rounded-lg hover:bg-[#00806a]/10 transition-colors">
                  View all
                </Link>
              </div>
              <div className="space-y-6">
                {recentActivities.slice(0, 5).map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <IconComponent className="w-5 h-5 text-[#00806a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{activity.title}</p>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {activity.status && (
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                      )}
                    </div>
                  );
                })}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">No recent activity</p>
                    <p className="text-xs text-gray-400 mt-1">Your activity will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Your Profile</h3>
              <Link to="/profile/edit" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#00806a] to-[#006d5a] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold">
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Profile
              </Link>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a]"></div>
                <span className="ml-3 text-gray-600">Loading profile...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <XCircleIcon className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Profile</h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button 
                  onClick={fetchDashboardData}
                  className="bg-gradient-to-r from-[#00806a] to-[#006d5a] text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : userProfile ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Information */}
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-4">Personal Information</h4>
                <div className="space-y-4">
                  <div>
                        <label className="block text-sm font-medium text-blue-800">Full Name</label>
                        <p className="mt-1 text-lg font-semibold text-blue-900">
                      {userProfile.firstName} {userProfile.lastName}
                    </p>
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-blue-800">Email</label>
                        <p className="mt-1 text-lg font-semibold text-blue-900">{userProfile.email}</p>
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-blue-800">Role</label>
                        <span className="mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-200 text-blue-800">
                          {userProfile.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : 'User'}
                        </span>
                  </div>
                  {userProfile.phone && (
                    <div>
                          <label className="block text-sm font-medium text-blue-800">Phone</label>
                          <p className="mt-1 text-lg font-semibold text-blue-900">{userProfile.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                    <h4 className="text-lg font-semibold text-green-900 mb-4">Account Information</h4>
                <div className="space-y-4">
                  <div>
                        <label className="block text-sm font-medium text-green-800">Member Since</label>
                        <p className="mt-1 text-lg font-semibold text-green-900">
                          {new Date(userProfile.memberSince).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                    </p>
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-green-800">Status</label>
                        <span className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          userProfile.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {userProfile.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                        <label className="block text-sm font-medium text-green-800">Last Login</label>
                        <p className="mt-1 text-lg font-semibold text-green-900">
                      {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  {userProfile.address && (
                    <div>
                          <label className="block text-sm font-medium text-green-800">Address</label>
                          <p className="mt-1 text-lg font-semibold text-green-900">{userProfile.address}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Data Available</h3>
                <p className="text-gray-500 mb-4">Unable to load your profile information.</p>
                <Button 
                  onClick={fetchDashboardData}
                  className="bg-gradient-to-r from-[#00806a] to-[#006d5a] text-white"
                >
                  Refresh Profile
                </Button>
              </div>
            )}
          </div>
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
          <div className="space-y-8">
            {/* Analytics Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Advanced Analytics Dashboard</h2>
                  <p className="text-blue-100 text-lg">Comprehensive insights into your booking patterns and activity trends</p>
                </div>
                <div className="text-right">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-2xl font-bold">Analytics</div>
                    <div className="text-blue-100 text-sm">Professional</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Spending Trends Card */}
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <CurrencyPoundIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Spending Trends</h3>
                      <p className="text-sm text-gray-600">Monthly spending analysis</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="text-sm font-medium text-gray-900">£{stats?.totalSpent?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average per Booking</span>
                      <span className="text-sm font-medium text-gray-900">£{(stats?.totalSpent && stats?.totalBookings ? (stats.totalSpent / stats.totalBookings).toFixed(2) : '0.00')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Top Activity Type</span>
                      <span className="text-sm font-medium text-gray-900">-</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 text-center">📊 Interactive charts and detailed breakdowns</p>
                  </div>
                </div>
              </Card>

              {/* Booking Patterns Card */}
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CalendarDaysIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Booking Patterns</h3>
                      <p className="text-sm text-gray-600">Activity preferences & timing</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Bookings</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.totalBookings || 0}</span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Confirmed</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.confirmedBookings || 0}</span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.pendingBookings || 0}</span>
                </div>
                </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 text-center">📈 Detailed analytics and trend analysis</p>
                  </div>
                </div>
              </Card>

              {/* Activity Insights Card */}
              <Card className="hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <AcademicCapIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Activity Insights</h3>
                      <p className="text-sm text-gray-600">Favorite venues & activities</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Activities Booked</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.totalActivities || 0}</span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Venues Visited</span>
                  <span className="text-sm font-medium text-gray-900">{stats?.totalVenues || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Upcoming</span>
                      <span className="text-sm font-medium text-gray-900">{stats?.upcomingActivities || 0}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 text-center">🎯 Personalized insights and recommendations</p>
                </div>
              </div>
            </Card>
            </div>
            
            {/* Analytics Features */}
            <Card>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics Features</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Interactive Charts & Graphs</h4>
                      <p className="text-sm text-gray-600">Visualize your data with beautiful, interactive charts</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Spending Trend Analysis</h4>
                      <p className="text-sm text-gray-600">Track your spending patterns over time</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Activity Preference Insights</h4>
                      <p className="text-sm text-gray-600">Discover your favorite activities and venues</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Export Reports & Data</h4>
                      <p className="text-sm text-gray-600">Download your analytics data in various formats</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-medium text-gray-900">Personalized Recommendations</h4>
                      <p className="text-sm text-gray-600">Get AI-powered activity suggestions</p>
                    </div>
                  </div>
                </div>
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
