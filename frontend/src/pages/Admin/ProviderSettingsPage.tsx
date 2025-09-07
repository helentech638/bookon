import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Checkbox } from '../../components/ui/Checkbox';
import { Badge } from '../../components/ui/Badge';
import { 
  CogIcon, 
  CurrencyPoundIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/layout/AdminLayout';

interface ProviderSettings {
  id: string;
  providerId: string;
  tfcEnabled: boolean;
  tfcHoldPeriod: number;
  tfcInstructions?: string;
  tfcPayeeName?: string;
  tfcPayeeReference?: string;
  tfcSortCode?: string;
  tfcAccountNumber?: string;
  defaultRefundMethod: 'credit' | 'cash' | 'parent_choice';
  adminFeeAmount: number;
  creditExpiryMonths: number;
  cancellationPolicy: {
    parentCancellation: {
      before24Hours: {
        refundMethod: string;
        adminFee: number;
        description: string;
      };
      within24Hours: {
        refundMethod: string;
        adminFee: number;
        description: string;
      };
    };
    providerCancellation: {
      refundMethod: string;
      adminFee: number;
      description: string;
    };
    noShow: {
      refundMethod: string;
      adminFee: number;
      description: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface Venue {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
}

const ProviderSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    if (selectedVenueId) {
      fetchProviderSettings(selectedVenueId);
    }
  }, [selectedVenueId]);

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/v1/admin/venues', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }

      const result = await response.json();
      setVenues(result.data);
      
      // Select first venue by default
      if (result.data.length > 0) {
        setSelectedVenueId(result.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
      setError('Failed to load venues');
    }
  };

  const fetchProviderSettings = async (venueId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/v1/provider-settings/${venueId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch provider settings');
      }

      const result = await response.json();
      setSettings(result.data);
    } catch (error) {
      console.error('Error fetching provider settings:', error);
      setError('Failed to load provider settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !selectedVenueId) return;

    try {
      setSaving(true);

      const response = await fetch(`/api/v1/provider-settings/${selectedVenueId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save provider settings');
      }

      toast.success('Provider settings saved successfully');
    } catch (error) {
      console.error('Error saving provider settings:', error);
      toast.error('Failed to save provider settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!selectedVenueId) return;

    try {
      const response = await fetch(`/api/v1/provider-settings/${selectedVenueId}/reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reset provider settings');
      }

      const result = await response.json();
      setSettings(result.data);
      toast.success('Provider settings reset to defaults');
    } catch (error) {
      console.error('Error resetting provider settings:', error);
      toast.error('Failed to reset provider settings');
    }
  };

  const updateSetting = (key: keyof ProviderSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const updateCancellationPolicy = (section: string, subsection: string, key: string, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings };
    (newSettings.cancellationPolicy as any)[section][subsection][key] = value;
    setSettings(newSettings);
  };

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  if (loading) {
    return (
      <AdminLayout title="Provider Settings">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading provider settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Provider Settings">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Settings</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} className="w-full">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Provider Settings">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Settings</h1>
            <p className="text-gray-600">Configure TFC, refund policies, and admin settings for each venue</p>
          </div>

          {/* Venue Selector */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CogIcon className="h-5 w-5" />
                Select Venue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {venues.map((venue) => (
                  <div
                    key={venue.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedVenueId === venue.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVenueId(venue.id)}
                  >
                    <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                    {venue.city && (
                      <p className="text-sm text-gray-600">{venue.city}</p>
                    )}
                    {venue.email && (
                      <p className="text-sm text-gray-500">{venue.email}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedVenue && settings && (
            <>
              {/* TFC Settings */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CurrencyPoundIcon className="h-5 w-5" />
                    Tax-Free Childcare Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="tfcEnabled"
                      checked={settings.tfcEnabled}
                      onCheckedChange={(checked) => updateSetting('tfcEnabled', checked)}
                    />
                    <Label htmlFor="tfcEnabled" className="text-sm font-medium">
                      Enable Tax-Free Childcare payments
                    </Label>
                  </div>

                  {settings.tfcEnabled && (
                    <>
                      <div>
                        <Label htmlFor="tfcHoldPeriod" className="text-sm font-medium text-gray-700">
                          Hold Period (days)
                        </Label>
                        <Input
                          id="tfcHoldPeriod"
                          type="number"
                          min="1"
                          max="30"
                          value={settings.tfcHoldPeriod}
                          onChange={(e) => updateSetting('tfcHoldPeriod', parseInt(e.target.value))}
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Number of days to hold bookings for TFC payment
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="tfcInstructions" className="text-sm font-medium text-gray-700">
                          TFC Instructions
                        </Label>
                        <textarea
                          id="tfcInstructions"
                          value={settings.tfcInstructions || ''}
                          onChange={(e) => updateSetting('tfcInstructions', e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={4}
                          placeholder="Custom instructions for parents making TFC payments..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Optional custom instructions for TFC payments
                        </p>
                      </div>

                      {/* TFC Payee Details */}
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">TFC Payment Details</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Configure the payment details that parents will use for Tax-Free Childcare payments.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="tfcPayeeName" className="text-sm font-medium text-gray-700">
                              Payee Name
                            </Label>
                            <Input
                              id="tfcPayeeName"
                              type="text"
                              value={settings.tfcPayeeName || ''}
                              onChange={(e) => updateSetting('tfcPayeeName', e.target.value)}
                              className="mt-1"
                              placeholder="Your business name"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Name that appears on parent's TFC payment
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="tfcPayeeReference" className="text-sm font-medium text-gray-700">
                              Payment Reference
                            </Label>
                            <Input
                              id="tfcPayeeReference"
                              type="text"
                              value={settings.tfcPayeeReference || ''}
                              onChange={(e) => updateSetting('tfcPayeeReference', e.target.value)}
                              className="mt-1"
                              placeholder="YOUR-BUSINESS-TFC"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Reference parents will use in TFC payments
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="tfcSortCode" className="text-sm font-medium text-gray-700">
                              Sort Code
                            </Label>
                            <Input
                              id="tfcSortCode"
                              type="text"
                              value={settings.tfcSortCode || ''}
                              onChange={(e) => updateSetting('tfcSortCode', e.target.value)}
                              className="mt-1"
                              placeholder="20-00-00"
                              pattern="\d{2}-\d{2}-\d{2}"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Bank sort code (format: XX-XX-XX)
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="tfcAccountNumber" className="text-sm font-medium text-gray-700">
                              Account Number
                            </Label>
                            <Input
                              id="tfcAccountNumber"
                              type="text"
                              value={settings.tfcAccountNumber || ''}
                              onChange={(e) => updateSetting('tfcAccountNumber', e.target.value)}
                              className="mt-1"
                              placeholder="12345678"
                              pattern="\d{8}"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              8-digit bank account number
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Refund Settings */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowPathIcon className="h-5 w-5" />
                    Refund & Cancellation Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="defaultRefundMethod" className="text-sm font-medium text-gray-700">
                      Default Refund Method
                    </Label>
                    <select
                      id="defaultRefundMethod"
                      value={settings.defaultRefundMethod}
                      onChange={(e) => updateSetting('defaultRefundMethod', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="credit">Credit to Wallet</option>
                      <option value="cash">Cash Refund</option>
                      <option value="parent_choice">Parent Choice</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="adminFeeAmount" className="text-sm font-medium text-gray-700">
                      Admin Fee Amount (£)
                        </Label>
                    <Input
                      id="adminFeeAmount"
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={settings.adminFeeAmount}
                      onChange={(e) => updateSetting('adminFeeAmount', parseFloat(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Admin fee charged for cancellations
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="creditExpiryMonths" className="text-sm font-medium text-gray-700">
                      Credit Expiry (months)
                    </Label>
                    <Input
                      id="creditExpiryMonths"
                      type="number"
                      min="1"
                      max="24"
                      value={settings.creditExpiryMonths}
                      onChange={(e) => updateSetting('creditExpiryMonths', parseInt(e.target.value))}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      How long credits remain valid
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cancellation Policy */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    Cancellation Policy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Parent Cancellation - Before 24 Hours */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Parent Cancellation (&ge;24 hours before)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Refund Method</Label>
                        <select
                          value={settings.cancellationPolicy.parentCancellation.before24Hours.refundMethod}
                          onChange={(e) => updateCancellationPolicy('parentCancellation', 'before24Hours', 'refundMethod', e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="parent_choice">Parent Choice</option>
                          <option value="credit">Credit Only</option>
                          <option value="cash">Cash Only</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Admin Fee (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={settings.cancellationPolicy.parentCancellation.before24Hours.adminFee}
                          onChange={(e) => updateCancellationPolicy('parentCancellation', 'before24Hours', 'adminFee', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {settings.cancellationPolicy.parentCancellation.before24Hours.description}
                    </p>
                  </div>

                  {/* Parent Cancellation - Within 24 Hours */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Parent Cancellation (&lt;24 hours before)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Refund Method</Label>
                        <select
                          value={settings.cancellationPolicy.parentCancellation.within24Hours.refundMethod}
                          onChange={(e) => updateCancellationPolicy('parentCancellation', 'within24Hours', 'refundMethod', e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="credit">Credit Only</option>
                          <option value="none">No Refund</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Admin Fee (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={settings.cancellationPolicy.parentCancellation.within24Hours.adminFee}
                          onChange={(e) => updateCancellationPolicy('parentCancellation', 'within24Hours', 'adminFee', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {settings.cancellationPolicy.parentCancellation.within24Hours.description}
                    </p>
                  </div>

                  {/* Provider Cancellation */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Provider Cancellation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Refund Method</Label>
                        <select
                          value={settings.cancellationPolicy.providerCancellation.refundMethod}
                          onChange={(e) => updateCancellationPolicy('providerCancellation', '', 'refundMethod', e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="parent_choice">Parent Choice</option>
                          <option value="credit">Credit Only</option>
                          <option value="cash">Cash Only</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Admin Fee (£)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={settings.cancellationPolicy.providerCancellation.adminFee}
                          onChange={(e) => updateCancellationPolicy('providerCancellation', '', 'adminFee', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {settings.cancellationPolicy.providerCancellation.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProviderSettingsPage;
