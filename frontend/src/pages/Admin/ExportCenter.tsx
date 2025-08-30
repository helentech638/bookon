import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  ClockIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  CreditCardIcon,
  EyeIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { authService } from '../../services/authService';

interface ExportFilter {
  venue_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}

interface ExportSchedule {
  type: 'registers' | 'bookings' | 'financial';
  format: 'csv' | 'pdf';
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  filters: ExportFilter;
}

const ExportCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'schedule' | 'history'>('export');
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<any[]>([]);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

  const [exportFilters, setExportFilters] = useState<ExportFilter>({});
  const [scheduleData, setScheduleData] = useState<ExportSchedule>({
    type: 'registers',
    format: 'csv',
    schedule: 'weekly',
    recipients: [''],
    filters: {}
  });

  useEffect(() => {
    fetchVenues();
    fetchExportHistory();
  }, []);

  const fetchVenues = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:3000/api/v1/venues', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVenues(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchExportHistory = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch('http://localhost:3000/api/v1/admin/export/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setExportHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching export history:', error);
    }
  };

  const handleExport = async (type: 'registers' | 'bookings' | 'financial') => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      const params = new URLSearchParams();
      params.append('format', 'csv');
      
      if (exportFilters.venue_id) params.append('venue_id', exportFilters.venue_id);
      if (exportFilters.date_from) params.append('date_from', exportFilters.date_from);
      if (exportFilters.date_to) params.append('date_to', exportFilters.date_to);
      if (exportFilters.status) params.append('status', exportFilters.status);

      const response = await fetch(`http://localhost:3000/api/v1/admin/export/${type}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully`);
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error exporting data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleExport = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      const response = await fetch('http://localhost:3000/api/v1/admin/export/schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        toast.success('Export scheduled successfully');
        setScheduleData({
          type: 'registers',
          format: 'csv',
          schedule: 'weekly',
          recipients: [''],
          filters: {}
        });
      } else {
        toast.error('Failed to schedule export');
      }
    } catch (error) {
      console.error('Error scheduling export:', error);
      toast.error('Error scheduling export');
    } finally {
      setLoading(false);
    }
  };

  const addRecipient = () => {
    setScheduleData(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const removeRecipient = (index: number) => {
    setScheduleData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index: number, value: string) => {
    setScheduleData(prev => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) => i === index ? value : recipient)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Export Center</h1>
              <p className="text-gray-600">Export data, schedule reports, and manage exports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'export', name: 'Export Data', icon: DocumentArrowDownIcon },
              { id: 'schedule', name: 'Schedule Exports', icon: ClockIcon },
              { id: 'history', name: 'Export History', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-[#00806a] text-[#00806a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Export Data Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  Export Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue
                    </label>
                    <Select
                      value={exportFilters.venue_id || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        venue_id: e.target.value || undefined
                      }))}
                    >
                      <option value="">All Venues</option>
                      {venues.map(venue => (
                        <option key={venue.id} value={venue.id}>{venue.name}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date From
                    </label>
                    <Input
                      type="date"
                      value={exportFilters.date_from || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        date_from: e.target.value || undefined
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date To
                    </label>
                    <Input
                      type="date"
                      value={exportFilters.date_to || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        date_to: e.target.value || undefined
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      value={exportFilters.status || ''}
                      onChange={(e) => setExportFilters(prev => ({
                        ...prev,
                        status: e.target.value || undefined
                      }))}
                    >
                      <option value="">All Statuses</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Registers Export */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-[#00806a] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Registers</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Export attendance registers with children and staff information
                  </p>
                  <Button
                    onClick={() => handleExport('registers')}
                    disabled={loading}
                    className="w-full bg-[#00806a] hover:bg-[#006d5a] text-white"
                  >
                    {loading ? 'Exporting...' : 'Export Registers'}
                  </Button>
                </CardContent>
              </Card>

              {/* Bookings Export */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <CalendarIcon className="w-12 h-12 text-[#00806a] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bookings</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Export booking data with customer and payment information
                  </p>
                  <Button
                    onClick={() => handleExport('bookings')}
                    disabled={loading}
                    className="w-full bg-[#00806a] hover:bg-[#006d5a] text-white"
                  >
                    {loading ? 'Exporting...' : 'Export Bookings'}
                  </Button>
                </CardContent>
              </Card>

              {/* Financial Export */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <CreditCardIcon className="w-12 h-12 text-[#00806a] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Financial</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Export financial reports with revenue and fee breakdowns
                  </p>
                  <Button
                    onClick={() => handleExport('financial')}
                    disabled={loading}
                    className="w-full bg-[#00806a] hover:bg-[#006d5a] text-white"
                  >
                    {loading ? 'Exporting...' : 'Export Financial'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Schedule Exports Tab */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2" />
                  Schedule Automated Exports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Type
                    </label>
                    <Select
                      value={scheduleData.type}
                      onChange={(e) => setScheduleData(prev => ({
                        ...prev,
                        type: e.target.value as any
                      }))}
                    >
                      <option value="registers">Registers</option>
                      <option value="bookings">Bookings</option>
                      <option value="financial">Financial</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <Select
                      value={scheduleData.format}
                      onChange={(e) => setScheduleData(prev => ({
                        ...prev,
                        format: e.target.value as any
                      }))}
                    >
                      <option value="csv">CSV</option>
                      <option value="pdf">PDF</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule
                    </label>
                    <Select
                      value={scheduleData.schedule}
                      onChange={(e) => setScheduleData(prev => ({
                        ...prev,
                        schedule: e.target.value as any
                      }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipients
                  </label>
                  <div className="space-y-2">
                    {scheduleData.recipients.map((recipient, index) => (
                      <div key={index} className="flex space-x-2">
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={recipient}
                          onChange={(e) => updateRecipient(index, e.target.value)}
                          className="flex-1"
                        />
                        {scheduleData.recipients.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeRecipient(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addRecipient}
                      className="mt-2"
                    >
                      Add Recipient
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleScheduleExport}
                    disabled={loading}
                    className="bg-[#00806a] hover:bg-[#006d5a] text-white"
                  >
                    {loading ? 'Scheduling...' : 'Schedule Export'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  Export History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {exportHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No export history available
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Format
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {exportHistory.map((exportItem) => (
                          <tr key={exportItem.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(exportItem.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                              {exportItem.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 uppercase">
                              {exportItem.format}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                exportItem.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : exportItem.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {exportItem.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={exportItem.status !== 'completed'}
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExportCenter;
