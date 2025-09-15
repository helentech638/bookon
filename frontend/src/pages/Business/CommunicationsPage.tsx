import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  ChatBubbleLeftRightIcon, 
  EnvelopeIcon,
  MegaphoneIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface Communication {
  id: string;
  type: 'email' | 'sms' | 'notification';
  subject?: string;
  content: string;
  recipients: number;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  createdAt: string;
}

const CommunicationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(buildApiUrl('/business/communications'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch communications');
      }

      const data = await response.json();
      if (data.success) {
        // Transform API data to match our interface
        const transformedCommunications: Communication[] = (data.data.communications || []).map((comm: any) => ({
          id: comm.id,
          type: comm.type || 'email',
          subject: comm.subject,
          content: comm.content || '',
          recipients: comm.recipients || 0,
          sentAt: comm.sentAt,
          status: comm.status || 'draft',
          createdAt: comm.createdAt
        }));
        setCommunications(transformedCommunications);
      } else {
        throw new Error(data.message || 'Failed to fetch communications');
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Communications loading timeout - please refresh');
      } else {
        toast.error('Failed to load communications');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = (comm.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || comm.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || comm.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'scheduled':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteCommunication = async (commId: string) => {
    if (window.confirm('Are you sure you want to delete this communication?')) {
      try {
        // Mock delete - replace with actual API call
        setCommunications(prev => prev.filter(c => c.id !== commId));
        toast.success('Communication deleted successfully');
      } catch (error) {
        console.error('Error deleting communication:', error);
        toast.error('Failed to delete communication');
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
            <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
            <p className="text-gray-600 mt-1">Manage your email, SMS, and notification communications</p>
          </div>
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            New Communication
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {communications.filter(c => c.type === 'email' && c.status === 'sent').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">SMS Sent</p>
                <p className="text-2xl font-bold text-gray-900">
                  {communications.filter(c => c.type === 'sms' && c.status === 'sent').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <MegaphoneIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notifications</p>
                <p className="text-2xl font-bold text-gray-900">
                  {communications.filter(c => c.type === 'notification' && c.status === 'sent').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {communications.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="notification">Notification</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Communications List */}
        <div className="space-y-4">
          {filteredCommunications.map((comm) => (
            <Card key={comm.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    {comm.type === 'email' && <EnvelopeIcon className="h-6 w-6 text-blue-500" />}
                    {comm.type === 'sms' && <ChatBubbleLeftRightIcon className="h-6 w-6 text-green-500" />}
                    {comm.type === 'notification' && <MegaphoneIcon className="h-6 w-6 text-purple-500" />}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">
                          {comm.subject || `${comm.type.toUpperCase()} Message`}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comm.status)}`}>
                          {getStatusIcon(comm.status)}
                          <span className="ml-1">{comm.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{comm.content}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>{comm.recipients} recipients</span>
                    {comm.sentAt && (
                      <span>Sent {new Date(comm.sentAt).toLocaleDateString()}</span>
                    )}
                    <span>Created {new Date(comm.createdAt).toLocaleDateString()}</span>
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
                    onClick={() => handleDeleteCommunication(comm.id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredCommunications.length === 0 && (
          <Card className="p-12 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No communications found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria'
                : 'Get started by creating your first communication'
              }
            </p>
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Communication
            </Button>
          </Card>
        )}
      </div>
    </BusinessLayout>
  );
};

export default CommunicationsPage;
