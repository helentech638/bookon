import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BusinessLayout from '../../components/layout/BusinessLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { 
  BuildingOfficeIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  CurrencyPoundIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface VenueSetup {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  phone: string;
  email: string;
  capacity: number;
  facilities: string[];
  operatingHours: OperatingHours;
  pricing: PricingSettings;
  bookingRules: BookingRules;
  businessAccountId?: string;
  businessAccount?: {
    id: string;
    businessName: string;
    stripeAccountId: string;
  };
  inheritFranchiseFee: boolean;
  franchiseFeeType?: 'percent' | 'fixed';
  franchiseFeeValue?: number;
  tfcEnabled: boolean;
  tfcHoldPeriod: number;
  tfcInstructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OperatingHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

interface PricingSettings {
  basePrice: number;
  currency: string;
  pricingType: 'fixed' | 'hourly' | 'per_person';
  discounts: DiscountRule[];
}

interface DiscountRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditions: string[];
}

interface BookingRules {
  advanceBookingDays: number;
  cancellationHours: number;
  minimumBookingDuration: number;
  maximumBookingDuration: number;
  requireApproval: boolean;
  allowRecurring: boolean;
}

const VenueSetupPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venueSetups, setVenueSetups] = useState<VenueSetup[]>([]);
  const [businessAccounts, setBusinessAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSetup, setEditingSetup] = useState<VenueSetup | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
    capacity: 50,
    facilities: [] as string[],
    operatingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    pricing: {
      basePrice: 0,
      currency: 'GBP',
      pricingType: 'fixed' as 'fixed' | 'hourly' | 'per_person',
      discounts: [] as DiscountRule[]
    },
    bookingRules: {
      advanceBookingDays: 30,
      cancellationHours: 24,
      minimumBookingDuration: 1,
      maximumBookingDuration: 8,
      requireApproval: false,
      allowRecurring: true
    },
    businessAccountId: '',
    inheritFranchiseFee: true,
    franchiseFeeType: 'percent' as 'percent' | 'fixed',
    franchiseFeeValue: 0,
    tfcEnabled: true,
    tfcHoldPeriod: 5,
    tfcInstructions: ''
  });

  useEffect(() => {
    fetchVenueSetups();
    fetchBusinessAccounts();
  }, []);

  const fetchVenueSetups = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(buildApiUrl('/business/venue-setup'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to fetch venue setups');
      }

      const data = await response.json();
      if (data.success) {
        // Transform API data to match our interface
        const transformedSetups: VenueSetup[] = (data.data.venueSetups || []).map((setup: any) => ({
          id: setup.id,
          name: setup.name,
          address: setup.address,
          city: setup.city,
          postcode: setup.postcode,
          phone: setup.phone || '',
          email: setup.email || '',
          capacity: setup.capacity,
          facilities: setup.facilities || [],
          operatingHours: setup.operatingHours || {
            monday: { open: '09:00', close: '17:00', closed: false },
            tuesday: { open: '09:00', close: '17:00', closed: false },
            wednesday: { open: '09:00', close: '17:00', closed: false },
            thursday: { open: '09:00', close: '17:00', closed: false },
            friday: { open: '09:00', close: '17:00', closed: false },
            saturday: { open: '10:00', close: '16:00', closed: false },
            sunday: { open: '10:00', close: '16:00', closed: true }
          },
          pricing: setup.pricing || {
            basePrice: 0,
            currency: 'GBP',
            pricingType: 'fixed' as 'fixed' | 'hourly' | 'per_person',
            discounts: [] as DiscountRule[]
          },
          bookingRules: setup.bookingRules || {
            advanceBookingDays: 30,
            cancellationHours: 24,
            minimumBookingDuration: 1,
            maximumBookingDuration: 8,
            requireApproval: false,
            allowRecurring: true
          },
          businessAccountId: setup.businessAccountId || '',
          businessAccount: setup.businessAccount || null,
          inheritFranchiseFee: setup.inheritFranchiseFee !== false,
          franchiseFeeType: setup.franchiseFeeType || 'percent',
          franchiseFeeValue: setup.franchiseFeeValue || 0,
          tfcEnabled: setup.tfcEnabled !== false,
          tfcHoldPeriod: setup.tfcHoldPeriod || 5,
          tfcInstructions: setup.tfcInstructions || '',
          isActive: setup.isActive !== false,
          createdAt: setup.createdAt,
          updatedAt: setup.updatedAt
        }));
        
        setVenueSetups(transformedSetups);
      } else {
        throw new Error(data.message || 'Failed to fetch venue setups');
      }
    } catch (error) {
      console.error('Error fetching venue setups:', error);
      toast.error('Failed to fetch venue setups');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessAccounts = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        return;
      }

      const response = await fetch(buildApiUrl('/business-accounts'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBusinessAccounts(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching business accounts:', error);
      // Don't show error toast as this is not critical for venue setup
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const url = editingSetup 
        ? buildApiUrl(`/business/venue-setup/${editingSetup.id}`)
        : buildApiUrl('/business/venue-setup');
      
      const method = editingSetup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save venue setup');
      }

      const data = await response.json();
      if (data.success) {
        toast.success(editingSetup ? 'Venue setup updated successfully!' : 'Venue setup created successfully!');
        setShowCreateModal(false);
        setEditingSetup(null);
        resetForm();
        fetchVenueSetups();
      } else {
        throw new Error(data.message || 'Failed to save venue setup');
      }
    } catch (error) {
      console.error('Error saving venue setup:', error);
      toast.error('Failed to save venue setup');
    }
  };

  const handleEdit = (setup: VenueSetup) => {
    setEditingSetup(setup);
    setFormData({
      name: setup.name,
      address: setup.address,
      city: setup.city,
      postcode: setup.postcode,
      phone: setup.phone,
      email: setup.email,
      capacity: setup.capacity,
      facilities: setup.facilities,
      operatingHours: setup.operatingHours,
      pricing: setup.pricing,
      bookingRules: setup.bookingRules,
      businessAccountId: setup.businessAccountId || '',
      inheritFranchiseFee: setup.inheritFranchiseFee,
      franchiseFeeType: setup.franchiseFeeType || 'percent',
      franchiseFeeValue: setup.franchiseFeeValue || 0,
      tfcEnabled: setup.tfcEnabled,
      tfcHoldPeriod: setup.tfcHoldPeriod,
      tfcInstructions: setup.tfcInstructions || ''
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (setupId: string) => {
    if (window.confirm('Are you sure you want to delete this venue setup?')) {
      try {
        const token = authService.getToken();
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(buildApiUrl(`/business/venue-setup/${setupId}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete venue setup');
        }

        const data = await response.json();
        if (data.success) {
          toast.success('Venue setup deleted successfully');
          fetchVenueSetups();
        } else {
          throw new Error(data.message || 'Failed to delete venue setup');
        }
      } catch (error) {
        console.error('Error deleting venue setup:', error);
        toast.error('Failed to delete venue setup');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      postcode: '',
      phone: '',
      email: '',
      capacity: 50,
      facilities: [],
      operatingHours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true }
      },
      pricing: {
        basePrice: 0,
        currency: 'GBP',
        pricingType: 'fixed' as 'fixed' | 'hourly' | 'per_person',
        discounts: [] as DiscountRule[]
      },
      bookingRules: {
        advanceBookingDays: 30,
        cancellationHours: 24,
        minimumBookingDuration: 1,
        maximumBookingDuration: 8,
        requireApproval: false,
        allowRecurring: true
      },
      businessAccountId: '',
      inheritFranchiseFee: true,
      franchiseFeeType: 'percent' as 'percent' | 'fixed',
      franchiseFeeValue: 0,
      tfcEnabled: true,
      tfcHoldPeriod: 5,
      tfcInstructions: ''
    });
  };

  const handleCreateNew = () => {
    resetForm();
    setEditingSetup(null);
    setShowCreateModal(true);
  };

  const filteredSetups = venueSetups.filter(setup => {
    const matchesSearch = !searchTerm || 
      setup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setup.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setup.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && setup.isActive) ||
      (statusFilter === 'inactive' && !setup.isActive);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <BusinessLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00806a]"></div>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout user={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Venue Setup</h1>
          <p className="text-gray-600 mt-1">Configure your venues and their settings</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search venue setups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00806a] focus:border-transparent"
              />
              <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <Button
            onClick={handleCreateNew}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            New Venue Setup
          </Button>
        </div>

        {/* Venue Setups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSetups.map((setup) => (
            <Card key={setup.id} className="bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#00806a] rounded-lg">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{setup.name}</h3>
                    <p className="text-sm text-gray-500">{setup.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(setup)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(setup.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{setup.address}, {setup.postcode}</span>
                </div>
                {setup.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{setup.phone}</span>
                  </div>
                )}
                {setup.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4" />
                    <span>{setup.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Capacity: {setup.capacity} people</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${setup.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-sm text-gray-600">
                    {setup.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(setup.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredSetups.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No venue setups found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first venue setup.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={handleCreateNew}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Venue Setup
              </Button>
            )}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingSetup ? 'Edit Venue Setup' : 'Create Venue Setup'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingSetup(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Venue Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity *
                      </label>
                      <Input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                        required
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <Input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <Input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Postcode *
                      </label>
                      <Input
                        type="text"
                        value={formData.postcode}
                        onChange={(e) => setFormData(prev => ({ ...prev, postcode: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base Price *
                        </label>
                        <Input
                          type="number"
                          value={formData.pricing.basePrice}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, basePrice: parseFloat(e.target.value) }
                          }))}
                          required
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Currency
                        </label>
                        <Select
                          value={formData.pricing.currency}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, currency: e.target.value }
                          }))}
                        >
                          <option value="GBP">GBP (£)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pricing Type
                        </label>
                        <Select
                          value={formData.pricing.pricingType}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            pricing: { ...prev.pricing, pricingType: e.target.value as 'fixed' | 'hourly' | 'per_person' }
                          }))}
                        >
                          <option value="fixed">Fixed Price</option>
                          <option value="hourly">Per Hour</option>
                          <option value="per_person">Per Person</option>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Booking Rules */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Rules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Advance Booking (days)
                        </label>
                        <Input
                          type="number"
                          value={formData.bookingRules.advanceBookingDays}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            bookingRules: { ...prev.bookingRules, advanceBookingDays: parseInt(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cancellation Notice (hours)
                        </label>
                        <Input
                          type="number"
                          value={formData.bookingRules.cancellationHours}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            bookingRules: { ...prev.bookingRules, cancellationHours: parseInt(e.target.value) }
                          }))}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Account & Payment Routing */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Business Account & Payment Routing</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Account
                        </label>
                        <Select
                          value={formData.businessAccountId}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ 
                            ...prev, 
                            businessAccountId: e.target.value 
                          }))}
                        >
                          <option value="">Select Business Account</option>
                          {businessAccounts.map(account => (
                            <option key={account.id} value={account.id}>
                              {account.name} ({account.status})
                            </option>
                          ))}
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">
                          Link this venue to a Stripe Connect business account for payment routing
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Franchise Fee Settings</h4>
                        
                        <div className="flex items-center mb-3">
                          <input
                            type="checkbox"
                            id="inheritFranchiseFee"
                            checked={formData.inheritFranchiseFee}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              inheritFranchiseFee: e.target.checked 
                            }))}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <label htmlFor="inheritFranchiseFee" className="ml-2 block text-sm text-gray-700">
                            Inherit Business Account franchise fee
                          </label>
                        </div>

                        {!formData.inheritFranchiseFee && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fee Type
                              </label>
                              <Select
                                value={formData.franchiseFeeType}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ 
                                  ...prev, 
                                  franchiseFeeType: e.target.value as 'percent' | 'fixed' 
                                }))}
                              >
                                <option value="percent">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (£)</option>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fee Value
                              </label>
                              <Input
                                type="number"
                                value={formData.franchiseFeeValue}
                                onChange={(e) => setFormData(prev => ({ 
                                  ...prev, 
                                  franchiseFeeValue: parseFloat(e.target.value) || 0 
                                }))}
                                min="0"
                                step={formData.franchiseFeeType === 'percent' ? '0.1' : '0.01'}
                                placeholder={formData.franchiseFeeType === 'percent' ? 'e.g., 5.0' : 'e.g., 2.50'}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tax-Free Childcare Settings */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tax-Free Childcare Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="tfcEnabled"
                          checked={formData.tfcEnabled}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            tfcEnabled: e.target.checked 
                          }))}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <label htmlFor="tfcEnabled" className="ml-2 block text-sm text-gray-700">
                          Enable Tax-Free Childcare payments
                        </label>
                      </div>

                      {formData.tfcEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hold Period (days)
                            </label>
                            <Input
                              type="number"
                              value={formData.tfcHoldPeriod}
                              onChange={(e) => setFormData(prev => ({ 
                                ...prev, 
                                tfcHoldPeriod: parseInt(e.target.value) || 5 
                              }))}
                              min="1"
                              max="30"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              How many days to hold bookings pending payment
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          TFC Instructions (Optional)
                        </label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={formData.tfcInstructions}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            tfcInstructions: e.target.value 
                          }))}
                          rows={3}
                          placeholder="Custom instructions for parents using Tax-Free Childcare..."
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Custom text shown to parents when they select TFC payment
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingSetup(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSetup ? 'Update Venue Setup' : 'Create Venue Setup'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </BusinessLayout>
  );
};

export default VenueSetupPage;