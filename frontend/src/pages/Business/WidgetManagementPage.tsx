import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { 
  Squares2X2Icon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CurrencyPoundIcon,
  CogIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  showLogo: boolean;
  customCSS: string;
  isActive: boolean;
  embedCode: string;
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

const WidgetManagementPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [analytics, setAnalytics] = useState<WidgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'settings' | 'analytics' | 'embed'>('design');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme: 'light' as 'light' | 'dark',
    primaryColor: '#10B981',
    secondaryColor: '#F3F4F6',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',
    showLogo: true,
    customCSS: ''
  });

  const colorPresets = [
    { name: 'Green', primary: '#10B981', secondary: '#F3F4F6' },
    { name: 'Blue', primary: '#3B82F6', secondary: '#EFF6FF' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#F3F4F6' },
    { name: 'Red', primary: '#EF4444', secondary: '#FEF2F2' },
    { name: 'Orange', primary: '#F97316', secondary: '#FFF7ED' },
    { name: 'Pink', primary: '#EC4899', secondary: '#FDF2F8' }
  ];

  useEffect(() => {
    fetchWidgets();
    fetchAnalytics();
  }, []);

  const fetchWidgets = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      console.log('WidgetManagementPage: fetchWidgets called', { token: !!token, user: user?.role });
      
      if (!token) {
        toast.error('Please log in to view widgets');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(buildApiUrl('/business/widgets'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('WidgetManagementPage: API response', { status: response.status, ok: response.ok });

      if (!response.ok) {
        throw new Error('Failed to fetch widgets');
      }

      const data = await response.json();
      console.log('Widget API response:', data);
      
      if (data.success) {
        // Transform API data to match our interface
        const transformedWidgets: WidgetConfig[] = (data.data.widgets || []).map((widget: any) => ({
          id: widget.id,
          name: widget.name,
          description: widget.description || '',
          theme: widget.theme || 'light',
          primaryColor: widget.primaryColor || '#10B981',
          secondaryColor: widget.secondaryColor || '#F3F4F6',
          position: widget.position || 'bottom-right',
          showLogo: widget.showLogo !== false,
          customCSS: widget.customCSS || '',
          isActive: widget.isActive !== false,
          embedCode: `<script src="https://widget.bookon.com/widget.js" data-widget-id="${widget.id}"></script>`,
          createdAt: widget.createdAt,
          updatedAt: widget.updatedAt
        }));
        
        console.log('Transformed widgets:', transformedWidgets);
        setWidgets(transformedWidgets);
      } else {
        throw new Error(data.message || 'Failed to fetch widgets');
      }
    } catch (error) {
      console.error('Error fetching widgets:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Widgets loading timeout - please refresh');
      } else {
        toast.error('Failed to load widgets');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        // Set empty analytics if no token
        setAnalytics({
          totalViews: 0,
          totalInteractions: 0,
          totalConversions: 0,
          conversionRate: 0,
          interactionRate: 0,
          dailyStats: {}
        });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(buildApiUrl('/business/widgets/analytics'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If analytics endpoint doesn't exist yet, set empty analytics
        setAnalytics({
          totalViews: 0,
          totalInteractions: 0,
          totalConversions: 0,
          conversionRate: 0,
          interactionRate: 0,
          dailyStats: {}
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data || {
          totalViews: 0,
          totalInteractions: 0,
          totalConversions: 0,
          conversionRate: 0,
          interactionRate: 0,
          dailyStats: {}
        });
      } else {
        throw new Error(data.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty analytics on error
      setAnalytics({
        totalViews: 0,
        totalInteractions: 0,
        totalConversions: 0,
        conversionRate: 0,
        interactionRate: 0,
        dailyStats: {}
      });
    }
  };

  const generateEmbedCode = (widgetId: string) => {
    return `<script src="https://widget.bookon.com/widget.js" data-widget-id="${widgetId}"></script>`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Submitting widget form data:', formData);
      
      const token = authService.getToken();
      if (!token) {
        toast.error('Please log in to save widget');
        return;
      }

      const url = editingWidget 
        ? buildApiUrl(`/business/widgets/${editingWidget.id}`)
        : buildApiUrl('/business/widgets');
      
      const method = editingWidget ? 'PUT' : 'POST';

      console.log('Submitting to:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to save widget');
      }

      const data = await response.json();
      console.log('Success response:', data);
      
      if (data.success) {
        toast.success(editingWidget ? 'Widget updated successfully!' : 'Widget created successfully!');
        setShowCreateModal(false);
        setEditingWidget(null);
        resetForm();
        fetchWidgets(); // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to save widget');
      }
    } catch (error) {
      console.error('Error saving widget:', error);
      toast.error('Failed to save widget');
    }
  };

  const handleEdit = (widget: WidgetConfig) => {
    setEditingWidget(widget);
    setFormData({
      name: widget.name,
      description: widget.description,
      theme: widget.theme,
      primaryColor: widget.primaryColor,
      secondaryColor: widget.secondaryColor,
      position: widget.position,
      showLogo: widget.showLogo,
      customCSS: widget.customCSS
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (widgetId: string) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      try {
        const token = authService.getToken();
        if (!token) {
          toast.error('Please log in to delete widget');
          return;
        }

        const response = await fetch(buildApiUrl(`/business/widgets/${widgetId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete widget');
        }

        const data = await response.json();
        if (data.success) {
          toast.success('Widget deleted successfully');
          fetchWidgets(); // Refresh the list
        } else {
          throw new Error(data.message || 'Failed to delete widget');
        }
      } catch (error) {
        console.error('Error deleting widget:', error);
        toast.error('Failed to delete widget');
      }
    }
  };

  const toggleActive = async (widgetId: string) => {
    try {
      setWidgets(prev => 
        prev.map(widget => 
          widget.id === widgetId 
            ? { ...widget, isActive: !widget.isActive, updatedAt: new Date().toISOString() }
            : widget
        )
      );
      toast.success('Widget status updated');
    } catch (error) {
      console.error('Error updating widget:', error);
      toast.error('Failed to update widget');
    }
  };

  const copyEmbedCode = (embedCode: string) => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied to clipboard');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      theme: 'light',
      primaryColor: '#10B981',
      secondaryColor: '#F3F4F6',
      position: 'bottom-right',
      showLogo: true,
      customCSS: ''
    });
  };

  // Debug logging
  console.log('WidgetManagementPage render:', { 
    loading, 
    showCreateModal, 
    editingWidget, 
    widgets: widgets?.length,
    user: user?.role,
    pathname: location.pathname
  });

  // Determine which view to show based on the current route
  const getCurrentView = () => {
    if (location.pathname === '/business/widgets/config') return 'config';
    if (location.pathname === '/business/widgets/analytics') return 'analytics';
    if (location.pathname === '/business/widgets/embed') return 'embed';
    return 'overview'; // Default to overview for /business/widgets
  };

  const currentView = getCurrentView();

  if (loading) {
    return (
      <BusinessLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      </BusinessLayout>
    );
  }

  // If creating or editing a widget, show the form page
  if (showCreateModal) {
    return (
      <BusinessLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingWidget(null);
                  resetForm();
                }}
                className="flex items-center gap-2"
              >
                ← Back to Widgets
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {editingWidget ? 'Edit Widget' : 'Create New Widget'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {editingWidget ? 'Update your widget settings' : 'Configure your new booking widget'}
                </p>
              </div>
            </div>
          </div>

          {/* Widget Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                {[
                  { id: 'design', label: 'Design', icon: PaintBrushIcon },
                  { id: 'settings', label: 'Settings', icon: CogIcon },
                  { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
                  { id: 'embed', label: 'Embed Code', icon: CodeBracketIcon }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Design Tab */}
                {activeTab === 'design' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Widget Name
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter widget name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Theme
                        </label>
                        <Select
                          value={formData.theme}
                          onChange={(value) => setFormData(prev => ({ ...prev, theme: value as any }))}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Enter widget description"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color Presets
                      </label>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {colorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              primaryColor: preset.primary,
                              secondaryColor: preset.secondary
                            }))}
                            className="flex flex-col items-center p-2 border border-gray-200 rounded-lg hover:border-green-500 transition-colors"
                          >
                            <div className="flex gap-1 mb-1">
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: preset.primary }}
                              ></div>
                              <div 
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: preset.secondary }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-600">{preset.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Primary Color
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-16 h-10 p-1 border border-gray-300 rounded"
                          />
                          <Input
                            type="text"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                            placeholder="#10B981"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Secondary Color
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-16 h-10 p-1 border border-gray-300 rounded"
                          />
                          <Input
                            type="text"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                            placeholder="#F3F4F6"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <Select
                          value={formData.position}
                          onChange={(value) => setFormData(prev => ({ ...prev, position: value as any }))}
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </Select>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="showLogo"
                          checked={formData.showLogo}
                          onChange={(e) => setFormData(prev => ({ ...prev, showLogo: e.target.checked }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showLogo" className="ml-2 block text-sm text-gray-700">
                          Show Logo
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom CSS
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        value={formData.customCSS}
                        onChange={(e) => setFormData(prev => ({ ...prev, customCSS: e.target.value }))}
                        rows={6}
                        placeholder="/* Add your custom CSS here */"
                      />
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Widget Name
                        </label>
                        <Input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter widget name"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Position
                        </label>
                        <Select
                          value={formData.position}
                          onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as any }))}
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Enter widget description"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="showLogoSettings"
                          checked={formData.showLogo}
                          onChange={(e) => setFormData(prev => ({ ...prev, showLogo: e.target.checked }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="showLogoSettings" className="ml-2 block text-sm text-gray-700">
                          Show Logo
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={editingWidget?.isActive || false}
                          onChange={(e) => {
                            if (editingWidget) {
                              setEditingWidget(prev => prev ? { ...prev, isActive: e.target.checked } : null);
                            }
                          }}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                          Widget Active
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{analytics?.totalViews.toLocaleString() || 0}</div>
                        <div className="text-sm text-gray-600">Total Views</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{analytics?.totalInteractions.toLocaleString() || 0}</div>
                        <div className="text-sm text-gray-600">Interactions</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{analytics?.totalConversions.toLocaleString() || 0}</div>
                        <div className="text-sm text-gray-600">Conversions</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{analytics?.conversionRate.toFixed(1) || 0}%</div>
                        <div className="text-sm text-gray-600">Conversion Rate</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embed Code Tab */}
                {activeTab === 'embed' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Embed Code
                      </label>
                      <div className="relative">
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm bg-gray-50"
                          value={editingWidget ? editingWidget.embedCode : generateEmbedCode('new')}
                          rows={4}
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyEmbedCode(editingWidget ? editingWidget.embedCode : generateEmbedCode('new'))}
                          className="absolute top-2 right-2"
                        >
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Copy this code and paste it into your website's HTML where you want the widget to appear.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingWidget(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    {editingWidget ? 'Update Widget' : 'Create Widget'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </BusinessLayout>
    );
  }

  // Render different content based on the current route
  const renderContent = () => {
    switch (currentView) {
      case 'config':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Widget Configuration</h1>
                <p className="text-gray-600 mt-1">Configure your widget settings and appearance</p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Widget
              </Button>
            </div>
            
            {/* Widget Configuration Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Theme</label>
                      <Select>
                        <option value="light">Light Theme</option>
                        <option value="dark">Dark Theme</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Position</label>
                      <Select>
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </Select>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="showLogoDefault" className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                      <label htmlFor="showLogoDefault" className="ml-2 block text-sm text-gray-700">Show logo by default</label>
                    </div>
                  </div>
                </div>
              </Card>
              
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Colors</label>
                      <div className="flex gap-2">
                        <Input type="color" value="#10B981" className="w-16 h-10" />
                        <Input type="text" value="#10B981" className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custom CSS</label>
                      <textarea 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                        rows={4}
                        placeholder="/* Global widget styles */"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Widget Analytics</h1>
                <p className="text-gray-600 mt-1">Track performance and engagement metrics</p>
              </div>
            </div>
            
            {/* Analytics Content */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <div className="p-4">
                    <div className="flex items-center">
                      <EyeIcon className="h-8 w-8 text-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Total Views</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card>
                  <div className="p-4">
                    <div className="flex items-center">
                      <UsersIcon className="h-8 w-8 text-green-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Interactions</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.totalInteractions.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card>
                  <div className="p-4">
                    <div className="flex items-center">
                      <CurrencyPoundIcon className="h-8 w-8 text-purple-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Conversions</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.totalConversions.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card>
                  <div className="p-4">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-orange-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                        <p className="text-2xl font-semibold text-gray-900">{analytics.conversionRate}%</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
                <div className="text-center py-8 text-gray-500">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Analytics chart will be displayed here</p>
                </div>
              </div>
            </Card>
          </div>
        );

      case 'embed':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Embed Codes</h1>
                <p className="text-gray-600 mt-1">Get embed codes for your widgets</p>
              </div>
            </div>
            
            {/* Embed Codes Content */}
            <div className="space-y-4">
              {widgets.length === 0 ? (
                <Card>
                  <div className="p-8 text-center">
                    <CodeBracketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets to embed</h3>
                    <p className="text-gray-500 mb-6">Create a widget first to get its embed code</p>
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Create Your First Widget
                    </Button>
                  </div>
                </Card>
              ) : (
                widgets.map((widget) => (
                  <Card key={widget.id}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{widget.name}</h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              widget.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {widget.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{widget.description}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Embed Code
                        </label>
                        <div className="relative">
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm bg-gray-50"
                            value={widget.embedCode}
                            rows={4}
                            readOnly
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => copyEmbedCode(widget.embedCode)}
                            className="absolute top-2 right-2"
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Copy this code and paste it into your website's HTML where you want the widget to appear.
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        );

      default: // 'overview'
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Widget Management</h1>
                <p className="text-gray-600 mt-1">Create and manage booking widgets for your website</p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Widget
              </Button>
            </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="p-4">
                <div className="flex items-center">
                  <EyeIcon className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Total Views</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.totalViews.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Interactions</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.totalInteractions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <div className="flex items-center">
                  <CurrencyPoundIcon className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Conversions</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.totalConversions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card>
              <div className="p-4">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.conversionRate}%</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Widgets List */}
        <div className="space-y-4">
          {widgets.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <Squares2X2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No widgets yet</h3>
                <p className="text-gray-500 mb-6">Create your first booking widget to get started</p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Widget
                </Button>
              </div>
            </Card>
          ) : (
            widgets.map((widget) => (
            <Card key={widget.id}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{widget.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        widget.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {widget.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{widget.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <PaintBrushIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Theme:</span>
                        <span className="font-medium capitalize">{widget.theme}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Position:</span>
                        <span className="font-medium">{widget.position.replace('-', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Squares2X2Icon className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Logo:</span>
                        <span className="font-medium">{widget.showLogo ? 'Shown' : 'Hidden'}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: widget.primaryColor }}
                      ></div>
                      <span className="text-sm text-gray-600">Primary Color: {widget.primaryColor}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyEmbedCode(widget.embedCode)}
                    >
                      <CodeBracketIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(widget)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(widget.id)}
                      className={widget.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {widget.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(widget.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            ))
          )}
        </div>
          </div>
        );
    }
  };

  return (
    <BusinessLayout>
      {renderContent()}
    </BusinessLayout>
  );
};

export default WidgetManagementPage;