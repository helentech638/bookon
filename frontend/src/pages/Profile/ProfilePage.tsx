import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  ShieldCheckIcon,
  BellIcon,
  KeyIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock user data - replace with actual user context
  const user = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+44 7700 900123',
    dateOfBirth: '1985-03-15',
    address: '123 Main Street',
    city: 'London',
    postcode: 'SW1A 1AA',
    role: 'parent',
    avatar: null,
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true,
      newsletter: false,
      language: 'en',
      timezone: 'Europe/London'
    },
    children: [
      {
        id: '1',
        name: 'Emma Johnson',
        dateOfBirth: '2015-08-22',
        age: 8,
        yearGroup: 'Year 3'
      },
      {
        id: '2',
        name: 'Liam Johnson',
        dateOfBirth: '2018-03-10',
        age: 5,
        yearGroup: 'Reception'
      }
    ]
  };

  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    address: user.address,
    city: user.city,
    postcode: user.postcode
  });

  const [preferences, setPreferences] = useState(user.preferences);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Implement actual save logic
      // await userService.updateProfile(formData);
      // await userService.updatePreferences(preferences);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsEditing(false);
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to save profile:', error);
      // TODO: Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      city: user.city,
      postcode: user.postcode
    });
    setPreferences(user.preferences);
    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'children', name: 'Children', icon: UserGroupIcon },
    { id: 'preferences', name: 'Preferences', icon: Cog6ToothIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                className="inline-flex items-center"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#041c30] to-[#00806a] rounded-full flex items-center justify-center mx-auto mb-4">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <UserCircleIcon className="w-12 h-12 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-[#00806a] text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4 mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={isLoading}
                          size="sm"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="flex items-center">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <div className="flex items-center">
                        <CalendarDaysIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{user.dateOfBirth}</span>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postcode
                      </label>
                      <input
                        type="text"
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#00806a] focus:border-[#00806a]'
                            : 'border-gray-200 bg-gray-50 text-gray-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Children Tab */}
            {activeTab === 'children' && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Children</h3>
                    <Link to="/children/new" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00806a] hover:bg-[#006d5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Child
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {user.children.map((child) => (
                      <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-900">{child.name}</h4>
                          <Link
                            to={`/children/${child.id}/edit`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </Link>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2" />
                            Age: {child.age} years old
                          </div>
                          <div className="flex items-center">
                            <UserCircleIcon className="w-4 h-4 mr-2" />
                            Year Group: {child.yearGroup}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                        <p className="text-sm text-gray-500">Receive notifications about bookings and activities</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00806a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00806a]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                        <p className="text-sm text-gray-500">Receive text messages for urgent updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.smsNotifications}
                          onChange={(e) => handlePreferenceChange('smsNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00806a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00806a]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Marketing Emails</h4>
                        <p className="text-sm text-gray-500">Receive promotional content and special offers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.marketingEmails}
                          onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00806a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00806a]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Newsletter</h4>
                        <p className="text-sm text-gray-500">Receive our monthly newsletter</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.newsletter}
                          onChange={(e) => handlePreferenceChange('newsletter', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#00806a]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00806a]"></div>
                      </label>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <Button onClick={handleSave} disabled={isLoading} className="w-full">
                      {isLoading ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Security Settings</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Password</h4>
                        <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                      </div>
                      <Link to="/profile/change-password" className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                        Change Password
                      </Link>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable 2FA
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Login Sessions</h4>
                        <p className="text-sm text-gray-500">Manage active sessions</p>
                      </div>
                      <Link to="/profile/sessions" className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                        View Sessions
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Billing Information</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Billing History</h4>
                        <p className="text-sm text-gray-500">View your past invoices and payments</p>
                      </div>
                      <Link to="/bookings" className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]">
                        View Bookings
                      </Link>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">Payment Information</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Payment methods and billing details are managed during the booking process. 
                            All payment information is securely handled by Stripe.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
