import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  AcademicCapIcon, 
  CodeBracketIcon, 
  EyeIcon, 
  Cog6ToothIcon,
  ClipboardDocumentIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CurrencyPoundIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';

interface WidgetConfig {
  id: string;
  name: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showLogo: boolean;
  customCSS: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WidgetAnalytics {
  totalViews: number;
  totalInteractions: number;
  totalConversions: number;
  conversionRate: number;
  interactionRate: number;
  dailyStats: Record<string, any>;
}

const WidgetManagement: React.FC = () => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null);
  const [widgetAnalytics, setWidgetAnalytics] = useState<WidgetAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    theme: 'light' as const,
    primaryColor: '#00806a',
    position: 'bottom-right' as const,
    showLogo: true,
    customCSS: ''
  });

  useEffect(() => {
    fetchWidgets();
  }, []);

  const fetchWidgets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/widget-config');
      if (response.ok) {
        const data = await response.json();
        setWidgets(data.data || []);
      } else {
        toast.error('Failed to fetch widgets');
      }
    } catch (error) {
      toast.error('Failed to fetch widgets');
      console.error('Error fetching widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgetAnalytics = async (widgetId: string) => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch(`/api/v1/widget/performance?widgetId=${widgetId}&days=30`);
      if (response.ok) {
        const data = await response.json();
        setWidgetAnalytics(data.data);
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      toast.error('Failed to fetch analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateWidget = async () => {
    try {
      const response = await fetch('/api/v1/widget-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setWidgets([...widgets, data.data]);
        setShowCreateModal(false);
        resetForm();
        toast.success('Widget created successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to create widget');
      }
    } catch (error) {
      toast.error('Failed to create widget');
      console.error('Error creating widget:', error);
    }
  };

  const handleUpdateWidget = async (widget: WidgetConfig) => {
    try {
      const response = await fetch(`/api/v1/widget-config/${widget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(widget)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedWidgets = widgets.map(w => 
          w.id === widget.id ? data.data : w
        );
        setWidgets(updatedWidgets);
        toast.success('Widget updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to update widget');
      }
    } catch (error) {
      toast.error('Failed to update widget');
      console.error('Error updating widget:', error);
    }
  };

  const handleToggleWidgetStatus = async (widgetId: string) => {
    try {
      const response = await fetch(`/api/v1/widget-config/${widgetId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const updatedWidgets = widgets.map(w => 
          w.id === widgetId ? data.data : w
        );
        setWidgets(updatedWidgets);
        toast.success('Widget status updated');
      } else {
        toast.error('Failed to update widget status');
      }
    } catch (error) {
      toast.error('Failed to update widget status');
      console.error('Error updating widget status:', error);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;

    try {
      const response = await fetch(`/api/v1/widget-config/${widgetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setWidgets(widgets.filter(w => w.id !== widgetId));
        toast.success('Widget deleted successfully');
      } else {
        toast.error('Failed to delete widget');
      }
    } catch (error) {
      toast.error('Failed to delete widget');
      console.error('Error deleting widget:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      theme: 'light',
      primaryColor: '#00806a',
      position: 'bottom-right',
      showLogo: true,
      customCSS: ''
    });
  };

  const generateEmbedCode = (widget: WidgetConfig) => {
    const baseUrl = window.location.origin;
    const embedCode = `
<!-- BookOn Widget -->
<div id="bookon-widget-${widget.id}"></div>
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${baseUrl}/widget.js';
    script.onload = function() {
      BookOnWidget.init({
        widgetId: '${widget.id}',
        theme: '${widget.theme}',
        primaryColor: '${widget.primaryColor}',
        position: '${widget.position}',
        showLogo: ${widget.showLogo}
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
    return embedCode;
  };

  const openAnalyticsModal = (widget: WidgetConfig) => {
    setSelectedWidget(widget);
    setShowAnalyticsModal(true);
    fetchWidgetAnalytics(widget.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Widget Management</h1>
          <p className="text-gray-600">Create and manage embeddable booking widgets</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <AcademicCapIcon className="w-5 h-5 mr-2" />
          Create Widget
        </Button>
      </div>

      {/* Widget Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <GlobeAltIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Widgets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {widgets.filter(w => w.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <EyeIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <CurrencyPoundIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets List */}
      <Card>
        <CardHeader>
          <CardTitle>Widgets</CardTitle>
        </CardHeader>
        <CardContent>
          {widgets.length === 0 ? (
            <div className="text-center py-8">
              <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No widgets created yet</p>
              <Button onClick={() => setShowCreateModal(true)}>Create Your First Widget</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {widgets.map((widget) => (
                <div key={widget.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${widget.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <h3 className="font-medium text-gray-900">{widget.name}</h3>
                        <p className="text-sm text-gray-600">
                          Theme: {widget.theme} • Position: {widget.position}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAnalyticsModal(widget)}
                      >
                        <ChartBarIcon className="w-4 w-4 mr-2" />
                        Analytics
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWidget(widget);
                          setShowPreviewModal(true);
                        }}
                      >
                        <EyeIcon className="w-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWidget(widget);
                          setShowCodeModal(true);
                        }}
                      >
                        <CodeBracketIcon className="w-4 w-4 mr-2" />
                        Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleWidgetStatus(widget.id)}
                      >
                        {widget.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWidget(widget.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Widget Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Widget"
      >
        <div className="space-y-4">
          <Input
            label="Widget Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter widget name"
          />
          
          <Select
            label="Theme"
            value={formData.theme}
            onChange={(e) => setFormData({ ...formData, theme: e.target.value as any })}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto</option>
          </Select>

          <Input
            label="Primary Color"
            type="color"
            value={formData.primaryColor}
            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
          />

          <Select
            label="Position"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="top-right">Top Right</option>
            <option value="top-left">Top Left</option>
          </Select>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showLogo"
              checked={formData.showLogo}
              onChange={(e) => setFormData({ ...formData, showLogo: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="showLogo" className="text-sm text-gray-700">
              Show Logo
            </label>
          </div>

          <Textarea
            label="Custom CSS"
            value={formData.customCSS}
            onChange={(e) => setFormData({ ...formData, customCSS: e.target.value })}
            placeholder="Enter custom CSS styles"
            rows={4}
          />

          <div className="flex space-x-3 pt-4">
            <Button onClick={handleCreateWidget} className="flex-1">
              Create Widget
            </Button>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        title={`Widget Analytics - ${selectedWidget?.name}`}
        size="lg"
      >
        {analyticsLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : widgetAnalytics ? (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{widgetAnalytics.totalViews}</p>
                <p className="text-sm text-blue-600">Total Views</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{widgetAnalytics.totalInteractions}</p>
                <p className="text-sm text-green-600">Interactions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{widgetAnalytics.totalConversions}</p>
                <p className="text-sm text-purple-600">Conversions</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{widgetAnalytics.conversionRate}%</p>
                <p className="text-sm text-orange-600">Conversion Rate</p>
              </div>
            </div>

            {/* Daily Stats Chart */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Performance</h3>
              <div className="space-y-2">
                {Object.entries(widgetAnalytics.dailyStats).map(([date, stats]) => (
                  <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{date}</span>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>👁 {stats.views}</span>
                      <span>💬 {stats.interactions}</span>
                      <span>✅ {stats.conversions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No analytics data available</p>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={`Widget Preview - ${selectedWidget?.name}`}
        size="lg"
      >
        {selectedWidget && (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Widget Configuration</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Theme:</span> {selectedWidget.theme}
                </div>
                <div>
                  <span className="font-medium">Position:</span> {selectedWidget.position}
                </div>
                <div>
                  <span className="font-medium">Primary Color:</span>
                  <div className="w-6 h-4 rounded border mt-1" style={{ backgroundColor: selectedWidget.primaryColor }} />
                </div>
                <div>
                  <span className="font-medium">Show Logo:</span> {selectedWidget.showLogo ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Widget preview would appear here</p>
              <p className="text-sm text-gray-500 mt-2">Configure the widget to see a live preview</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Embed Code Modal */}
      <Modal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        title={`Embed Code - ${selectedWidget?.name}`}
        size="lg"
      >
        {selectedWidget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Copy and paste this code into your website to embed the widget:
            </p>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{generateEmbedCode(selectedWidget)}</pre>
            </div>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(generateEmbedCode(selectedWidget));
                toast.success('Code copied to clipboard!');
              }}
              className="w-full"
            >
              <ClipboardDocumentIcon className="w-4 w-4 mr-2" />
              Copy Code
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WidgetManagement;
