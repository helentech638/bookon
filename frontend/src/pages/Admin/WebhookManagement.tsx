import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/Card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select';
import { RefreshCw, Eye, RotateCcw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WebhookEvent {
  id: string;
  event_type: string;
  source: string;
  data: any;
  processed: boolean;
  error?: string;
  created_at: string;
  processed_at?: string;
  retry_count: number;
  external_id?: string;
}

interface WebhookStats {
  total: number;
  processed: number;
  failed: number;
  bySource: { source: string; count: number }[];
  byType: { event_type: string; count: number }[];
}

const WebhookManagement: React.FC = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    source: '',
    event_type: '',
    processed: '',
    limit: '50',
    offset: '0'
  });

  useEffect(() => {
    fetchWebhookEvents();
    fetchWebhookStats();
  }, [filters]);

  const fetchWebhookEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/v1/webhooks/events?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch webhook events');
      }

      const data = await response.json();
      setEvents(data.data.events);
    } catch (error) {
      console.error('Error fetching webhook events:', error);
      toast.error('Failed to fetch webhook events');
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookStats = async () => {
    try {
      const response = await fetch('/api/v1/webhooks/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch webhook stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error fetching webhook stats:', error);
    }
  };

  const retryWebhook = async (eventId: string) => {
    try {
      setRetrying(eventId);
      const response = await fetch(`/api/v1/webhooks/events/${eventId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to retry webhook');
      }

      toast.success('Webhook retried successfully');
      fetchWebhookEvents();
    } catch (error) {
      console.error('Error retrying webhook:', error);
      toast.error('Failed to retry webhook');
    } finally {
      setRetrying(null);
    }
  };

  const getStatusIcon = (processed: boolean, error?: string) => {
    if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (processed) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (processed: boolean, error?: string) => {
    if (error) return <Badge variant="destructive">Failed</Badge>;
    if (processed) return <Badge variant="default">Processed</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: '0' // Reset offset when filters change
    }));
  };

  const loadMore = () => {
    setFilters(prev => ({
      ...prev,
      offset: (parseInt(prev.offset) + parseInt(prev.limit)).toString()
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Webhook Management</h1>
        <Button onClick={fetchWebhookEvents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Processed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.total > 0 ? Math.round((stats.processed / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Source</label>
              <Select value={filters.source} onValueChange={(value: string) => handleFilterChange('source', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sources</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Event Type</label>
              <Select value={filters.event_type} onValueChange={(value: string) => handleFilterChange('event_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="payment_intent.succeeded">Payment Succeeded</SelectItem>
                  <SelectItem value="payment_intent.payment_failed">Payment Failed</SelectItem>
                  <SelectItem value="booking.created">Booking Created</SelectItem>
                  <SelectItem value="booking.updated">Booking Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.processed} onValueChange={(value: string) => handleFilterChange('processed', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="true">Processed</SelectItem>
                  <SelectItem value="false">Pending/Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Limit</label>
              <Select value={filters.limit} onValueChange={(value: string) => handleFilterChange('limit', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading events...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(event.processed, event.error)}
                          {getStatusBadge(event.processed, event.error)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{event.event_type}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{event.source}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(event.created_at)}</TableCell>
                      <TableCell>{event.retry_count}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Show event details modal
                              console.log('Event data:', event.data);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!event.processed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryWebhook(event.id)}
                              disabled={retrying === event.id}
                            >
                              <RotateCcw className={`h-4 w-4 ${retrying === event.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {events.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No webhook events found
                </div>
              )}
              
              {events.length > 0 && (
                <div className="flex justify-center">
                  <Button variant="outline" onClick={loadMore}>
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManagement;
