import React, { useState, useEffect } from 'react';
import { 
  CogIcon,
  CurrencyPoundIcon,
  PercentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import AdminLayout from '../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface FranchiseFeeConfig {
  id: string;
  businessAccountId: string;
  franchiseFeeType: 'percent' | 'fixed';
  franchiseFeeValue: number;
  vatMode: 'inclusive' | 'exclusive';
  adminFeeAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BusinessAccount {
  id: string;
  name: string;
  stripeAccountId: string;
  stripeAccountType: string;
  status: string;
  franchiseFeeType: string;
  franchiseFeeValue: number;
  vatMode: string;
  adminFeeAmount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const FranchiseFeeSettings: React.FC = () => {
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [config, setConfig] = useState<FranchiseFeeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [franchiseFeeType, setFranchiseFeeType] = useState<'percent' | 'fixed'>('percent');
  const [franchiseFeeValue, setFranchiseFeeValue] = useState<number>(0);
  const [vatMode, setVatMode] = useState<'inclusive' | 'exclusive'>('inclusive');
  const [adminFeeAmount, setAdminFeeAmount] = useState<number>(0);

  useEffect(() => {
    fetchBusinessAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchFranchiseFeeConfig(selectedAccount);
    }
  }, [selectedAccount]);

  const fetchBusinessAccounts = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(buildApiUrl('/business-accounts'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business accounts');
      }

      const data = await response.json();
      setBusinessAccounts(data.data || []);
      
      if (data.data && data.data.length > 0 && !selectedAccount) {
        setSelectedAccount(data.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch business accounts');
      console.error('Error fetching business accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFranchiseFeeConfig = async (businessAccountId: string) => {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(buildApiUrl(`/business-accounts/${businessAccountId}/franchise-fee`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch franchise fee configuration');
      }

      const data = await response.json();
      setConfig(data.data);
      
      // Update form state
      if (data.data) {
        setFranchiseFeeType(data.data.franchiseFeeType);
        setFranchiseFeeValue(data.data.franchiseFeeValue);
        setVatMode(data.data.vatMode);
        setAdminFeeAmount(data.data.adminFeeAmount || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch franchise fee configuration');
      console.error('Error fetching franchise fee config:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedAccount) {
      toast.error('Please select a business account');
      return;
    }

    setSaving(true);
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(buildApiUrl(`/business-accounts/${selectedAccount}/franchise-fee`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          franchiseFeeType,
          franchiseFeeValue,
          vatMode,
          adminFeeAmount: adminFeeAmount > 0 ? adminFeeAmount : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update franchise fee configuration');
      }

      toast.success('Franchise fee configuration updated successfully');
      fetchFranchiseFeeConfig(selectedAccount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update configuration';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const calculatePreview = () => {
    const testAmount = 100; // £100 test amount
    let franchiseFee = 0;
    
    if (franchiseFeeType === 'percent') {
      franchiseFee = Math.round((testAmount * franchiseFeeValue) / 100);
    } else {
      franchiseFee = franchiseFeeValue;
    }

    const vatRate = 0.20;
    let vatAmount = 0;
    let netFranchiseFee = 0;

    if (vatMode === 'inclusive') {
      vatAmount = Math.round(franchiseFee * vatRate / (1 + vatRate));
      netFranchiseFee = franchiseFee - vatAmount;
    } else {
      vatAmount = Math.round(franchiseFee * vatRate);
      netFranchiseFee = franchiseFee;
    }

    const adminFee = adminFeeAmount || 0;
    const netAmount = testAmount - franchiseFee - adminFee;

    return {
      grossAmount: testAmount,
      franchiseFee,
      vatAmount,
      adminFee,
      netAmount,
    };
  };

  if (loading) {
    return (
      <AdminLayout title="Franchise Fee Settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading franchise fee settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const preview = calculatePreview();

  return (
    <AdminLayout title="Franchise Fee Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Franchise Fee Configuration</h1>
            <p className="text-gray-600 mt-1">
              Configure franchise fees and VAT settings for business accounts
            </p>
          </div>
        </div>

        {/* Business Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              Business Account Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Business Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select a business account</option>
                  {businessAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedAccount && (
          <>
            {/* Franchise Fee Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CurrencyPoundIcon className="h-5 w-5 mr-2" />
                  Franchise Fee Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fee Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fee Type
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="percent"
                          checked={franchiseFeeType === 'percent'}
                          onChange={(e) => setFranchiseFeeType(e.target.value as 'percent' | 'fixed')}
                          className="mr-2"
                        />
                        <span className="flex items-center">
                          <PercentIcon className="h-4 w-4 mr-1" />
                          Percentage
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="fixed"
                          checked={franchiseFeeType === 'fixed'}
                          onChange={(e) => setFranchiseFeeType(e.target.value as 'percent' | 'fixed')}
                          className="mr-2"
                        />
                        <span className="flex items-center">
                          <CurrencyPoundIcon className="h-4 w-4 mr-1" />
                          Fixed Amount
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Fee Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fee Value
                    </label>
                    <div className="relative">
                      {franchiseFeeType === 'percent' ? (
                        <input
                          type="number"
                          value={franchiseFeeValue}
                          onChange={(e) => setFranchiseFeeValue(Number(e.target.value))}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="e.g., 20"
                        />
                      ) : (
                        <div className="relative">
                          <CurrencyPoundIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="number"
                            value={franchiseFeeValue}
                            onChange={(e) => setFranchiseFeeValue(Number(e.target.value))}
                            min="0"
                            step="0.01"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="e.g., 5.00"
                          />
                        </div>
                      )}
                      <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                        {franchiseFeeType === 'percent' ? '%' : '£'}
                      </span>
                    </div>
                  </div>

                  {/* VAT Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VAT Mode
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="inclusive"
                          checked={vatMode === 'inclusive'}
                          onChange={(e) => setVatMode(e.target.value as 'inclusive' | 'exclusive')}
                          className="mr-2"
                        />
                        <span>VAT Inclusive</span>
                        <InformationCircleIcon className="h-4 w-4 ml-1 text-gray-400" title="VAT is included in the franchise fee" />
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="exclusive"
                          checked={vatMode === 'exclusive'}
                          onChange={(e) => setVatMode(e.target.value as 'inclusive' | 'exclusive')}
                          className="mr-2"
                        />
                        <span>VAT Exclusive</span>
                        <InformationCircleIcon className="h-4 w-4 ml-1 text-gray-400" title="VAT is added on top of the franchise fee" />
                      </label>
                    </div>
                  </div>

                  {/* Admin Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Fee (Optional)
                    </label>
                    <div className="relative">
                      <CurrencyPoundIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        value={adminFeeAmount}
                        onChange={(e) => setAdminFeeAmount(Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="e.g., 2.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Additional admin fee charged per transaction
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Fee Calculation Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Example calculation for a £{preview.grossAmount} transaction:
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Gross Amount:</span>
                      <span className="font-medium">£{preview.grossAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Franchise Fee:</span>
                      <span className="font-medium">-£{preview.franchiseFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT (20%):</span>
                      <span className="font-medium">-£{preview.vatAmount.toFixed(2)}</span>
                    </div>
                    {preview.adminFee > 0 && (
                      <div className="flex justify-between">
                        <span>Admin Fee:</span>
                        <span className="font-medium">-£{preview.adminFee.toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Net to Venue:</span>
                      <span>£{preview.netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default FranchiseFeeSettings;
