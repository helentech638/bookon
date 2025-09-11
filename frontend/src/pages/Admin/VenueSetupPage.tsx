import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyPoundIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  XMarkIcon,
  LinkIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';
import AdminLayout from '../../components/layout/AdminLayout';

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
  venues: {
    id: string;
    name: string;
    address: string;
    city: string;
    inheritFranchiseFee: boolean;
    franchiseFeeType?: string;
    franchiseFeeValue?: number;
  }[];
  _count: {
    venues: number;
  };
}

interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  businessAccountId?: string;
  inheritFranchiseFee: boolean;
  franchiseFeeType?: string;
  franchiseFeeValue?: number;
  isActive: boolean;
}

const VenueSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [businessAccounts, setBusinessAccounts] = useState<BusinessAccount[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateBusinessAccount, setShowCreateBusinessAccount] = useState(false);
  const [showEditBusinessAccount, setShowEditBusinessAccount] = useState(false);
  const [showVenueSetup, setShowVenueSetup] = useState(false);
  const [selectedBusinessAccount, setSelectedBusinessAccount] = useState<BusinessAccount | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    if (!authService.hasRole('admin')) {
      navigate('/dashboard');
      return;
    }

    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) return;

      // Fetch business accounts and venues in parallel
      const [businessAccountsResponse, venuesResponse] = await Promise.all([
        fetch(buildApiUrl('/business-accounts'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(buildApiUrl('/venues'), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
      ]);

      if (businessAccountsResponse.ok) {
        const businessAccountsData = await businessAccountsResponse.json();
        setBusinessAccounts(businessAccountsData.data);
      }

      if (venuesResponse.ok) {
        const venuesData = await venuesResponse.json();
        setVenues(venuesData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusinessAccount = async (accountData: any) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(buildApiUrl('/business-accounts'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData)
      });

      if (response.ok) {
        toast.success('Business account created successfully');
        fetchData();
        setShowCreateBusinessAccount(false);
      } else {
        throw new Error('Failed to create business account');
      }
    } catch (error) {
      console.error('Create business account error:', error);
      toast.error('Failed to create business account');
    }
  };

  const handleUpdateVenueBusinessAccount = async (venueId: string, businessAccountId: string, franchiseOverrides: any) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const response = await fetch(buildApiUrl(`/venues/${venueId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessAccountId,
          ...franchiseOverrides
        })
      });

      if (response.ok) {
        toast.success('Venue business account updated successfully');
        fetchData();
        setShowVenueSetup(false);
      } else {
        throw new Error('Failed to update venue business account');
      }
    } catch (error) {
      console.error('Update venue business account error:', error);
      toast.error('Failed to update venue business account');
    }
  };

  const getStripeStatusBadge = (status: string) => {
    switch (status) {
      case 'onboarded':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Onboarded
          </span>
        );
      case 'action_required':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Action Required
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const BusinessAccountCard = ({ account }: { account: BusinessAccount }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{account.name}</h3>
            <div className="flex items-center space-x-2 mb-2">
              {getStripeStatusBadge(account.status)}
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {account.stripeAccountType}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <CurrencyPoundIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {account.franchiseFeeType === 'percent' 
                ? `${account.franchiseFeeValue}%` 
                : `£${account.franchiseFeeValue.toFixed(2)}`
              }
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{account._count.venues} venues</span>
          </div>
        </div>

        {account.adminFeeAmount && (
          <div className="flex items-center text-sm text-gray-600 mb-4">
            <CreditCardIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>Admin fee: £{account.adminFeeAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="text-xs text-gray-500 mb-4">
          Stripe Account: {account.stripeAccountId}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBusinessAccount(account);
                setShowEditBusinessAccount(true);
              }}
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedBusinessAccount(account);
                setShowVenueSetup(true);
              }}
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              Link Venues
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const VenueCard = ({ venue }: { venue: Venue }) => {
    const businessAccount = businessAccounts.find(ba => ba.id === venue.businessAccountId);
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{venue.name}</h3>
              <div className="flex items-center space-x-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  <MapPinIcon className="h-3 w-3 mr-1" />
                  {venue.city}
                </span>
                {venue.isActive ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">{venue.address}</p>
          </div>

          {businessAccount ? (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Linked to Business Account</p>
                  <p className="text-xs text-green-700">{businessAccount.name}</p>
                </div>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              </div>
              {!venue.inheritFranchiseFee && (
                <div className="mt-2 text-xs text-green-700">
                  Custom fee: {venue.franchiseFeeType === 'percent' 
                    ? `${venue.franchiseFeeValue}%` 
                    : `£${venue.franchiseFeeValue?.toFixed(2)}`
                  }
                </div>
              )}
            </div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-sm font-medium text-yellow-800">
                  No business account linked
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedVenue(venue);
                setShowVenueSetup(true);
              }}
            >
              <LinkIcon className="h-4 w-4 mr-1" />
              {businessAccount ? 'Change Account' : 'Link Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <AdminLayout title="Venue Setup">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading venue setup...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Venue Setup">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Venue Setup</h1>
            <p className="text-gray-600">Manage business accounts and venue payment routing</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => setShowCreateBusinessAccount(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Business Account
            </Button>
          </div>
        </div>

        {/* Business Accounts Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Accounts</h2>
          {businessAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessAccounts.map((account) => (
                <BusinessAccountCard key={account.id} account={account} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BuildingOfficeIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No business accounts</h3>
                <p className="text-gray-600 mb-6">
                  Create your first business account to start managing venue payments
                </p>
                <Button onClick={() => setShowCreateBusinessAccount(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Business Account
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Venues Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Venues</h2>
          {venues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MapPinIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
                <p className="text-gray-600 mb-6">
                  Create venues first to link them with business accounts
                </p>
                <Button onClick={() => navigate('/admin/venues')}>
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  Manage Venues
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Business Account Modal */}
        {showCreateBusinessAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Business Account</h2>
                <button
                  onClick={() => setShowCreateBusinessAccount(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const accountData = {
                  name: formData.get('name'),
                  stripeAccountId: formData.get('stripeAccountId'),
                  stripeAccountType: formData.get('stripeAccountType'),
                  franchiseFeeType: formData.get('franchiseFeeType'),
                  franchiseFeeValue: formData.get('franchiseFeeValue'),
                  vatMode: formData.get('vatMode'),
                  adminFeeAmount: formData.get('adminFeeAmount') || null
                };
                handleCreateBusinessAccount(accountData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stripe Account ID</label>
                    <input
                      type="text"
                      name="stripeAccountId"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                    <select
                      name="stripeAccountType"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="express">Express</option>
                      <option value="standard">Standard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Franchise Fee Type</label>
                    <select
                      name="franchiseFeeType"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="percent">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Franchise Fee Value</label>
                    <input
                      type="number"
                      step="0.01"
                      name="franchiseFeeValue"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Mode</label>
                    <select
                      name="vatMode"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="inclusive">Inclusive</option>
                      <option value="exclusive">Exclusive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Fee Amount (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="adminFeeAmount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateBusinessAccount(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create Account
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default VenueSetupPage;
