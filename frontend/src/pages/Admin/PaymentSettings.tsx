import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CreditCardIcon,
  CogIcon,
  BuildingOfficeIcon,
  CurrencyPoundIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import AdminLayout from '../../components/layout/AdminLayout';
import { Select } from '../../components/ui/Select';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface PaymentSettings {
  platformFeePercentage: number;
  platformFeeFixed: number;
  stripeEnabled: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  webhookSecret: string;
  defaultCurrency: string;
  supportedCurrencies: string[];
  autoPayouts: boolean;
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
  minimumPayoutAmount: number;
}

interface VenuePaymentAccount {
  id: string;
  venueName: string;
  stripeAccountId: string;
  accountStatus: 'pending' | 'active' | 'restricted' | 'disabled';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  verificationStatus: 'unverified' | 'pending' | 'verified';
  lastPayout: string | null;
  nextPayout: string | null;
}

const PaymentSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'stripe' | 'venues' | 'payouts'>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showStripeKeyModal, setShowStripeKeyModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<VenuePaymentAccount | null>(null);

  const [settings, setSettings] = useState<PaymentSettings>({
    platformFeePercentage: 2.9,
    platformFeeFixed: 0.30,
    stripeEnabled: true,
    stripePublishableKey: '',
    stripeSecretKey: '',
    webhookSecret: '',
    defaultCurrency: 'GBP',
    supportedCurrencies: ['GBP', 'USD', 'EUR'],
    autoPayouts: true,
    payoutSchedule: 'weekly',
    minimumPayoutAmount: 50.00
  });

  const [venueAccounts, setVenueAccounts] = useState<VenuePaymentAccount[]>([]);

  useEffect(() => {
    fetchPaymentSettings();
    fetchVenueAccounts();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      const response = await fetch(buildApiUrl('/admin/payment-settings'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        toast.error('Failed to fetch payment settings');
      }
    } catch (error) {
      toast.error('Error fetching payment settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueAccounts = async () => {
    try {
      const token = authService.getToken();
      
      const response = await fetch(buildApiUrl('/admin/venue-payment-accounts'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVenueAccounts(data.data);
      } else {
        toast.error('Failed to fetch venue payment accounts');
      }
    } catch (error) {
      toast.error('Error fetching venue payment accounts');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const token = authService.getToken();
      
      const response = await fetch(buildApiUrl('/admin/payment-settings'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Payment settings updated successfully');
      } else {
        toast.error('Failed to update payment settings');
      }
    } catch (error) {
      toast.error('Error updating payment settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVenueAccount = async (venueId: string) => {
    try {
      const token = authService.getToken();
      
      const response = await fetch(buildApiUrl('/admin/venue-payment-accounts'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ venueId })
      });

      if (response.ok) {
        toast.success('Venue payment account created successfully');
        fetchVenueAccounts();
        setShowVenueModal(false);
      } else {
        toast.error('Failed to create venue payment account');
      }
    } catch (error) {
      toast.error('Error creating venue payment account');
    }
  };

  const getAccountStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'restricted':
        return 'bg-orange-100 text-orange-800';
      case 'disabled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckIcon className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      case 'unverified':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      default:
        return <XMarkIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment settings...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Payment Settings">
      <div className="mb-6">
        <p className="text-gray-600">Configure payment processing, fees, and venue accounts</p>
      </div>
      
      <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'general', name: 'General Settings', icon: CogIcon },
              { id: 'stripe', name: 'Stripe Configuration', icon: CreditCardIcon },
              { id: 'venues', name: 'Venue Accounts', icon: BuildingOfficeIcon },
              { id: 'payouts', name: 'Payout Settings', icon: CurrencyPoundIcon }
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

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Fee Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Fee Percentage
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={settings.platformFeePercentage}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          platformFeePercentage: parseFloat(e.target.value) || 0
                        }))}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Percentage fee charged on all transactions
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fixed Platform Fee
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.platformFeeFixed}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          platformFeeFixed: parseFloat(e.target.value) || 0
                        }))}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Fixed fee charged on all transactions
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Currency
                    </label>
                    <Select
                      value={settings.defaultCurrency}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        defaultCurrency: e.target.value
                      }))}
                    >
                      {settings.supportedCurrencies.map(currency => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Payout Amount
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.minimumPayoutAmount}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          minimumPayoutAmount: parseFloat(e.target.value) || 0
                        }))}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Auto Payouts</h4>
                    <p className="text-sm text-gray-500">Automatically process payouts to venues</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoPayouts}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        autoPayouts: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00806a] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00806a]"></div>
                  </label>
                </div>

                {settings.autoPayouts && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payout Schedule
                    </label>
                    <Select
                      value={settings.payoutSchedule}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        payoutSchedule: e.target.value as 'daily' | 'weekly' | 'monthly'
                      }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        )}

        {/* Stripe Configuration Tab */}
        {activeTab === 'stripe' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Enable Stripe</h4>
                    <p className="text-sm text-gray-500">Enable Stripe payment processing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.stripeEnabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        stripeEnabled: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00806a] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00806a]"></div>
                  </label>
                </div>

                {settings.stripeEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publishable Key
                      </label>
                      <div className="flex">
                        <Input
                          type="password"
                          value={settings.stripePublishableKey}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            stripePublishableKey: e.target.value
                          }))}
                          placeholder="pk_test_..."
                          className="rounded-r-none"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setShowStripeKeyModal(true)}
                          className="rounded-l-none border-l-0"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secret Key
                      </label>
                      <Input
                        type="password"
                        value={settings.stripeSecretKey}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          stripeSecretKey: e.target.value
                        }))}
                        placeholder="sk_test_..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Webhook Secret
                      </label>
                      <Input
                        type="password"
                        value={settings.webhookSecret}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          webhookSecret: e.target.value
                        }))}
                        placeholder="whsec_..."
                      />
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <ShieldCheckIcon className="w-5 h-5 text-blue-400 mr-2" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-800">Security Note</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Keep your Stripe keys secure. Never expose your secret key in client-side code.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
              >
                {saving ? 'Saving...' : 'Save Stripe Settings'}
              </Button>
            </div>
          </div>
        )}

        {/* Venue Accounts Tab */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Venue Payment Accounts</h3>
              <Button
                onClick={() => setShowVenueModal(true)}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Venue Account
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Venue
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stripe Account
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Payout
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {venueAccounts.map((account) => (
                        <tr key={account.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {account.venueName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 font-mono">
                              {account.stripeAccountId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccountStatusColor(account.accountStatus)}`}>
                              {account.accountStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getVerificationStatusIcon(account.verificationStatus)}
                              <span className="ml-2 text-sm text-gray-900 capitalize">
                                {account.verificationStatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {account.lastPayout ? new Date(account.lastPayout).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVenue(account)}
                              >
                                <PencilIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payout Settings Tab */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payout Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Payout Management</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Payout settings are managed through Stripe Connect. Venues can configure their payout preferences in their Stripe dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Payout Amount
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={settings.minimumPayoutAmount}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          minimumPayoutAmount: parseFloat(e.target.value) || 0
                        }))}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Minimum amount required before processing payouts
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payout Schedule
                    </label>
                    <Select
                      value={settings.payoutSchedule}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        payoutSchedule: e.target.value as 'daily' | 'weekly' | 'monthly'
                      }))}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </Select>
                    <p className="mt-1 text-sm text-gray-500">
                      Default payout frequency for venues
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Auto Payouts</h4>
                    <p className="text-sm text-gray-500">Automatically process payouts when conditions are met</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoPayouts}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        autoPayouts: e.target.checked
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00806a] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00806a]"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-[#00806a] hover:bg-[#006d5a] text-white"
              >
                {saving ? 'Saving...' : 'Save Payout Settings'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stripe Key Modal */}
      {showStripeKeyModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stripe Publishable Key</h3>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {settings.stripePublishableKey || 'No key set'}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setShowStripeKeyModal(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Venue Modal */}
      {showVenueModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Venue Payment Account</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will create a Stripe Connect account for the selected venue.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => setShowVenueModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleCreateVenueAccount('venue-id')}
                  className="bg-[#00806a] hover:bg-[#006d5a] text-white"
                >
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default PaymentSettings;
