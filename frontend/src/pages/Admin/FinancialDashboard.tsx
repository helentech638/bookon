import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CurrencyPoundIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';

interface FinancialSummary {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  period: string;
}

interface RevenueByVenue {
  [key: string]: number;
}

interface DailyRevenue {
  [key: string]: number;
}

const FinancialDashboard: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [revenueByVenue, setRevenueByVenue] = useState<RevenueByVenue>({});
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue>({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    period: 'month',
    venue_id: '',
    date_from: '',
    date_to: ''
  });
  const [venues, setVenues] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchFinancialData();
    fetchVenues();
  }, [filters]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const queryParams = new URLSearchParams(filters);

      const response = await fetch(`http://localhost:3000/api/v1/admin/financial-reports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.data.summary);
        setRevenueByVenue(data.data.revenueByVenue);
        setDailyRevenue(data.data.dailyRevenue);
      } else {
        toast.error('Failed to fetch financial data');
      }
    } catch (error) {
      toast.error('Error fetching financial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:3000/api/v1/admin/venues', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVenues(data.data);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const getTopVenues = () => {
    return Object.entries(revenueByVenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getTopDailyRevenue = () => {
    return Object.entries(dailyRevenue)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 7);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'year':
        return 'Last 12 Months';
      default:
        return 'Last 30 Days';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="text-gray-600">Monitor revenue, bookings, and financial performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last 12 Months</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                <select
                  value={filters.venue_id}
                  onChange={(e) => handleFilterChange('venue_id', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                >
                  <option value="">All Venues</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>{venue.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00806a] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading financial data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <CurrencyPoundIcon className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary ? formatCurrency(summary.totalRevenue) : '£0.00'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {summary ? getPeriodLabel(summary.period) : ''}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <ChartBarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary ? summary.totalBookings.toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {summary ? getPeriodLabel(summary.period) : ''}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Average Booking Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary ? formatCurrency(summary.averageBookingValue) : '£0.00'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {summary ? getPeriodLabel(summary.period) : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Revenue by Venue */}
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Venue</h3>
              <div className="space-y-4">
                {getTopVenues().map(([venueName, revenue]) => (
                  <div key={venueName} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#00806a] rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-gray-900">{venueName}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        {formatPercentage(revenue, summary?.totalRevenue || 0)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(revenue)}
                      </span>
                    </div>
                  </div>
                ))}
                {Object.keys(revenueByVenue).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No revenue data available</p>
                )}
              </div>
            </Card>

            {/* Daily Revenue Chart */}
            <Card className="p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Revenue Trend</h3>
              <div className="space-y-4">
                {getTopDailyRevenue().map(([date, revenue]) => (
                  <div key={date} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-900">
                        {new Date(date).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(revenue)}
                      </span>
                      {revenue > 0 && (
                        <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
                {Object.keys(dailyRevenue).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No daily revenue data available</p>
                )}
              </div>
            </Card>

            {/* Additional Filters */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setFilters(prev => ({
                        ...prev,
                        date_from: '',
                        date_to: ''
                      }));
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Clear Dates
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;
