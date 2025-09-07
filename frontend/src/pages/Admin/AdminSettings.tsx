import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Checkbox } from '../../components/ui/Checkbox';
import { 
  CogIcon, 
  ShieldCheckIcon, 
  BellIcon, 
  GlobeAltIcon, 
  CurrencyPoundIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  KeyIcon,
  ServerIcon,
  CircleStackIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';
import { authService } from '../../services/authService';

interface SystemSettings {
  // General Settings
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  supportEmail: string;
  
  // Security Settings
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireTwoFactor: boolean;
  allowRegistration: boolean;
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationFrequency: 'immediate' | 'hourly' | 'daily';
  
  // Payment Settings
  defaultCurrency: string;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  paypalEnabled: boolean;
  paypalClientId: string;
  
  // TFC Settings
  tfcEnabled: boolean;
  tfcDefaultHoldPeriod: number;
  tfcAutoCancelEnabled: boolean;
  tfcReminderDays: number;
  
  // System Settings
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  
  // API Settings
  apiRateLimit: number;
  apiTimeout: number;
  webhookRetryAttempts: number;
  
  // Database Settings
  dbConnectionPool: number;
  dbQueryTimeout: number;
  dbBackupRetention: number;
}

const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    // General Settings
    siteName: 'BookOn Platform',
    siteDescription: 'Professional activity booking platform',
    siteUrl: 'https://bookon.com',
    adminEmail: 'admin@bookon.com',
    supportEmail: 'support@bookon.com',
    
    // Security Settings
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireTwoFactor: false,
    allowRegistration: true,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationFrequency: 'immediate',
    
    // Payment Settings
    defaultCurrency: 'GBP',
    stripeEnabled: true,
    stripePublishableKey: '',
    stripeSecretKey: '',
    paypalEnabled: false,
    paypalClientId: '',
    
    // TFC Settings
    tfcEnabled: true,
    tfcDefaultHoldPeriod: 5,
    tfcAutoCancelEnabled: true,
    tfcReminderDays: 2,
    
    // System Settings
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
    backupFrequency: 'daily',
    
    // API Settings
    apiRateLimit: 1000,
    apiTimeout: 30,
    webhookRetryAttempts: 3,
    
    // Database Settings
    dbConnectionPool: 10,
    dbQueryTimeout: 30,
    dbBackupRetention: 30
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      const response = await fetch('/api/v1/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({ ...settings, ...data.data });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const token = authService.getToken();
      
      const response = await fetch('/api/v1/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'payments', name: 'Payments', icon: CurrencyPoundIcon },
    { id: 'tfc', name: 'TFC Settings', icon: ClockIcon },
    { id: 'system', name: 'System', icon: ServerIcon },
    { id: 'api', name: 'API', icon: CloudIcon },
    { id: 'database', name: 'Database', icon: CircleStackIcon }
  ];

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GlobeAltIcon className="h-5 w-5 mr-2" />
            Site Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={settings.siteName}
              onChange={(e) => updateSetting('siteName', e.target.value)}
              placeholder="Enter site name"
            />
          </div>
          <div>
            <Label htmlFor="siteDescription">Site Description</Label>
            <Input
              id="siteDescription"
              value={settings.siteDescription}
              onChange={(e) => updateSetting('siteDescription', e.target.value)}
              placeholder="Enter site description"
            />
          </div>
          <div>
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input
              id="siteUrl"
              value={settings.siteUrl}
              onChange={(e) => updateSetting('siteUrl', e.target.value)}
              placeholder="https://your-site.com"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => updateSetting('adminEmail', e.target.value)}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={settings.supportEmail}
                onChange={(e) => updateSetting('supportEmail', e.target.value)}
                placeholder="support@example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheckIcon className="h-5 w-5 mr-2" />
            Authentication & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                min="1"
                max="168"
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
            <Input
              id="passwordMinLength"
              type="number"
              value={settings.passwordMinLength}
              onChange={(e) => updateSetting('passwordMinLength', parseInt(e.target.value))}
              min="6"
              max="20"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="requireTwoFactor"
                checked={settings.requireTwoFactor}
                onCheckedChange={(checked) => updateSetting('requireTwoFactor', checked)}
              />
              <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="allowRegistration"
                checked={settings.allowRegistration}
                onCheckedChange={(checked) => updateSetting('allowRegistration', checked)}
              />
              <Label htmlFor="allowRegistration">Allow User Registration</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BellIcon className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
              />
              <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
              />
              <Label htmlFor="smsNotifications">Enable SMS Notifications</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="pushNotifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
              <Label htmlFor="pushNotifications">Enable Push Notifications</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="notificationFrequency">Notification Frequency</Label>
            <select
              value={settings.notificationFrequency}
              onChange={(e) => updateSetting('notificationFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CurrencyPoundIcon className="h-5 w-5 mr-2" />
            Payment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="defaultCurrency">Default Currency</Label>
            <select
              value={settings.defaultCurrency}
              onChange={(e) => updateSetting('defaultCurrency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="GBP">British Pound (GBP)</option>
              <option value="USD">US Dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="stripeEnabled"
                checked={settings.stripeEnabled}
                onCheckedChange={(checked) => updateSetting('stripeEnabled', checked)}
              />
              <Label htmlFor="stripeEnabled">Enable Stripe Payments</Label>
            </div>
            
            {settings.stripeEnabled && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
                  <Input
                    id="stripePublishableKey"
                    value={settings.stripePublishableKey}
                    onChange={(e) => updateSetting('stripePublishableKey', e.target.value)}
                    placeholder="pk_test_..."
                    type="password"
                  />
                </div>
                <div>
                  <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
                  <Input
                    id="stripeSecretKey"
                    value={settings.stripeSecretKey}
                    onChange={(e) => updateSetting('stripeSecretKey', e.target.value)}
                    placeholder="sk_test_..."
                    type="password"
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <Checkbox
                id="paypalEnabled"
                checked={settings.paypalEnabled}
                onCheckedChange={(checked) => updateSetting('paypalEnabled', checked)}
              />
              <Label htmlFor="paypalEnabled">Enable PayPal Payments</Label>
            </div>
            
            {settings.paypalEnabled && (
              <div className="pl-6 border-l-2 border-gray-200">
                <div>
                  <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                  <Input
                    id="paypalClientId"
                    value={settings.paypalClientId}
                    onChange={(e) => updateSetting('paypalClientId', e.target.value)}
                    placeholder="PayPal Client ID"
                    type="password"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTFCSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Tax-Free Childcare Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="tfcEnabled"
              checked={settings.tfcEnabled}
              onCheckedChange={(checked) => updateSetting('tfcEnabled', checked)}
            />
            <Label htmlFor="tfcEnabled">Enable Tax-Free Childcare Payments</Label>
          </div>
          
          {settings.tfcEnabled && (
            <div className="space-y-4 pl-6 border-l-2 border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tfcDefaultHoldPeriod">Default Hold Period (days)</Label>
                  <Input
                    id="tfcDefaultHoldPeriod"
                    type="number"
                    value={settings.tfcDefaultHoldPeriod}
                    onChange={(e) => updateSetting('tfcDefaultHoldPeriod', parseInt(e.target.value))}
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <Label htmlFor="tfcReminderDays">Reminder Days Before Deadline</Label>
                  <Input
                    id="tfcReminderDays"
                    type="number"
                    value={settings.tfcReminderDays}
                    onChange={(e) => updateSetting('tfcReminderDays', parseInt(e.target.value))}
                    min="1"
                    max="7"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="tfcAutoCancelEnabled"
                  checked={settings.tfcAutoCancelEnabled}
                  onCheckedChange={(checked) => updateSetting('tfcAutoCancelEnabled', checked)}
                />
                <Label htmlFor="tfcAutoCancelEnabled">Enable Automatic Cancellation</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ServerIcon className="h-5 w-5 mr-2" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
              />
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="debugMode"
                checked={settings.debugMode}
                onCheckedChange={(checked) => updateSetting('debugMode', checked)}
              />
              <Label htmlFor="debugMode">Debug Mode</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="logLevel">Log Level</Label>
              <select
                value={settings.logLevel}
                onChange={(e) => updateSetting('logLevel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => updateSetting('backupFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAPISettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CloudIcon className="h-5 w-5 mr-2" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="apiRateLimit">Rate Limit (requests/hour)</Label>
              <Input
                id="apiRateLimit"
                type="number"
                value={settings.apiRateLimit}
                onChange={(e) => updateSetting('apiRateLimit', parseInt(e.target.value))}
                min="100"
                max="10000"
              />
            </div>
            <div>
              <Label htmlFor="apiTimeout">API Timeout (seconds)</Label>
              <Input
                id="apiTimeout"
                type="number"
                value={settings.apiTimeout}
                onChange={(e) => updateSetting('apiTimeout', parseInt(e.target.value))}
                min="5"
                max="300"
              />
            </div>
            <div>
              <Label htmlFor="webhookRetryAttempts">Webhook Retry Attempts</Label>
              <Input
                id="webhookRetryAttempts"
                type="number"
                value={settings.webhookRetryAttempts}
                onChange={(e) => updateSetting('webhookRetryAttempts', parseInt(e.target.value))}
                min="1"
                max="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
        <CardTitle className="flex items-center">
          <CircleStackIcon className="h-5 w-5 mr-2" />
          Database Configuration
        </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dbConnectionPool">Connection Pool Size</Label>
              <Input
                id="dbConnectionPool"
                type="number"
                value={settings.dbConnectionPool}
                onChange={(e) => updateSetting('dbConnectionPool', parseInt(e.target.value))}
                min="5"
                max="50"
              />
            </div>
            <div>
              <Label htmlFor="dbQueryTimeout">Query Timeout (seconds)</Label>
              <Input
                id="dbQueryTimeout"
                type="number"
                value={settings.dbQueryTimeout}
                onChange={(e) => updateSetting('dbQueryTimeout', parseInt(e.target.value))}
                min="5"
                max="300"
              />
            </div>
            <div>
              <Label htmlFor="dbBackupRetention">Backup Retention (days)</Label>
              <Input
                id="dbBackupRetention"
                type="number"
                value={settings.dbBackupRetention}
                onChange={(e) => updateSetting('dbBackupRetention', parseInt(e.target.value))}
                min="7"
                max="365"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'payments':
        return renderPaymentSettings();
      case 'tfc':
        return renderTFCSettings();
      case 'system':
        return renderSystemSettings();
      case 'api':
        return renderAPISettings();
      case 'database':
        return renderDatabaseSettings();
      default:
        return renderGeneralSettings();
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Admin Settings">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Admin Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Configure platform-wide settings and preferences</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={fetchSettings}>
              Reset
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
