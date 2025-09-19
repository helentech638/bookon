import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  CogIcon, 
  BuildingOfficeIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  UserIcon,
  KeyIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface BusinessSettings {
  businessName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  website: string;
  description: string;
  timezone: string;
  currency: string;
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
  payment: {
    stripePublicKey: string;
    stripeSecretKey: string;
    paypalClientId: string;
    paypalSecret: string;
  };
  policies: {
    cancellationPolicy: string;
    refundPolicy: string;
    adminFeeAmount: number;
    refundDeadlineHours: number;
  };
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
    website: '',
    description: '',
    timezone: 'Europe/London',
    currency: 'GBP',
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      marketingEmails: false,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
    },
    payment: {
      stripePublicKey: '',
      stripeSecretKey: '',
      paypalClientId: '',
      paypalSecret: '',
    },
    policies: {
      cancellationPolicy: '',
      refundPolicy: '',
      adminFeeAmount: 2.00,
      refundDeadlineHours: 24,
    },
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
      // Mock data for now - replace with actual API call
      const mockSettings: BusinessSettings = {
        businessName: 'Sports Centre Ltd',
        email: 'info@sportscentre.com',
        phone: '+44 20 7123 4567',
        address: '123 Sports Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        website: 'https://sportscentre.com',
        description: 'Premier sports and recreation facility',
        timezone: 'Europe/London',
        currency: 'GBP',
        notifications: {
          emailNotifications: true,
          smsNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
        },
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          passwordExpiry: 90,
        },
        payment: {
          stripePublicKey: 'pk_test_...',
          stripeSecretKey: 'sk_test_...',
          paypalClientId: 'paypal_client_id',
          paypalSecret: 'paypal_secret',
        },
        policies: {
          cancellationPolicy: 'Cancellations must be made at least 24 hours before the activity start time. Late cancellations may incur a fee.',
          refundPolicy: 'Refunds are processed within 5-7 business days. Admin fees may apply to refunds.',
          adminFeeAmount: 2.00,
          refundDeadlineHours: 24,
        },
      };
      
      setSettings(mockSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      // Mock save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', name: 'General', icon: BuildingOfficeIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'payment', name: 'Payment', icon: CreditCardIcon },
    { id: 'policies', name: 'Policies', icon: DocumentTextIcon },
  ];

  if (loading) {
    return (
      <BusinessLayout user={user}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-4 bg-gray-300 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your business settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#00806a] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">General Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                        <input
                          type="text"
                          value={settings.businessName}
                          onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={settings.phone}
                          onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={settings.website}
                          onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <input
                          type="text"
                          value={settings.address}
                          onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={settings.city}
                          onChange={(e) => setSettings(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                        <input
                          type="text"
                          value={settings.postcode}
                          onChange={(e) => setSettings(prev => ({ ...prev, postcode: e.target.value }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={settings.description}
                          onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailNotifications}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, emailNotifications: e.target.checked }
                          }))}
                          className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                          <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.smsNotifications}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, smsNotifications: e.target.checked }
                          }))}
                          className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                          <p className="text-sm text-gray-500">Receive push notifications in browser</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.pushNotifications}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, pushNotifications: e.target.checked }
                          }))}
                          className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                          <p className="text-sm text-gray-500">Receive marketing and promotional emails</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.marketingEmails}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, marketingEmails: e.target.checked }
                          }))}
                          className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Settings */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.security.twoFactorAuth}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, twoFactorAuth: e.target.checked }
                          }))}
                          className="h-4 w-4 text-[#00806a] focus:ring-[#00806a] border-gray-300 rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                        <input
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                        <input
                          type="number"
                          value={settings.security.passwordExpiry}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            security: { ...prev.security, passwordExpiry: parseInt(e.target.value) }
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Settings</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Public Key</label>
                        <input
                          type="text"
                          value={settings.payment.stripePublicKey}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripePublicKey: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stripe Secret Key</label>
                        <input
                          type="password"
                          value={settings.payment.stripeSecretKey}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            payment: { ...prev.payment, stripeSecretKey: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Client ID</label>
                        <input
                          type="text"
                          value={settings.payment.paypalClientId}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paypalClientId: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Secret</label>
                        <input
                          type="password"
                          value={settings.payment.paypalSecret}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            payment: { ...prev.payment, paypalSecret: e.target.value }
                          }))}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Policies Settings */}
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Policies</h2>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cancellation Policy
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                          value={settings.policies.cancellationPolicy}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            policies: { ...prev.policies, cancellationPolicy: e.target.value }
                          }))}
                          rows={4}
                          placeholder="Enter your cancellation policy..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          This policy will be shown to parents when they book activities
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Refund Policy
                        </label>
                        <textarea
                          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                          value={settings.policies.refundPolicy}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            policies: { ...prev.policies, refundPolicy: e.target.value }
                          }))}
                          rows={4}
                          placeholder="Enter your refund policy..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          This policy will be shown to parents when they request refunds
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Fee Amount (£)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={settings.policies.adminFeeAmount}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              policies: { ...prev.policies, adminFeeAmount: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Fee charged for cancellations and refunds
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Refund Deadline (hours)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="168"
                            value={settings.policies.refundDeadlineHours}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              policies: { ...prev.policies, refundDeadlineHours: parseInt(e.target.value) || 24 }
                            }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            Hours before activity start time when refunds are allowed
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
};

export default SettingsPage;
