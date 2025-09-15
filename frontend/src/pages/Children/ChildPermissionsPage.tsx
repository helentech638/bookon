import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  yearGroup?: string;
  school?: string;
  class?: string;
}

interface ChildPermissions {
  id: string;
  childId: string;
  consentToWalkHome: boolean;
  consentToPhotography: boolean;
  consentToFirstAid: boolean;
  consentToEmergencyContact: boolean;
}

const ChildPermissionsPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  
  const [child, setChild] = useState<Child | null>(null);
  const [permissions, setPermissions] = useState<ChildPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch child details
        const childResponse = await fetch(buildApiUrl(`/children/${childId}`), {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        });
        
        if (!childResponse.ok) throw new Error('Failed to fetch child');
        const childData = await childResponse.json();
        setChild(childData.data);

        // Fetch permissions
        const permissionsResponse = await fetch(buildApiUrl(`/child-permissions/${childId}`), {
          headers: {
            'Authorization': `Bearer ${authService.getToken()}`
          }
        });
        
        if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions');
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.data);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load child permissions');
      } finally {
        setIsLoading(false);
      }
    };

    if (childId) {
      fetchData();
    }
  }, [childId]);

  const handlePermissionChange = (permission: keyof Omit<ChildPermissions, 'id' | 'childId'>) => {
    if (!permissions) return;
    
    setPermissions(prev => prev ? {
      ...prev,
      [permission]: !prev[permission]
    } : null);
  };

  const handleSave = async () => {
    if (!permissions) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await fetch(buildApiUrl(`/child-permissions/${childId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({
          consentToWalkHome: permissions.consentToWalkHome,
          consentToPhotography: permissions.consentToPhotography,
          consentToFirstAid: permissions.consentToFirstAid,
          consentToEmergencyContact: permissions.consentToEmergencyContact
        })
      });
      
      if (!response.ok) throw new Error('Failed to save permissions');
      
      // Show success message and navigate back
      navigate(`/children/${childId}`, { 
        state: { message: 'Permissions updated successfully' }
      });
      
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00806a]"></div>
        </div>
      </div>
    );
  }

  if (error && !child) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center h-screen px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/children')}>
              Back to Children
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Permissions</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Child Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {child?.firstName} {child?.lastName}
          </h2>
          <div className="text-gray-600 space-y-1">
            {child?.yearGroup && <div>Year Group: {child.yearGroup}</div>}
            {child?.school && <div>School: {child.school}</div>}
            {child?.class && <div>Class: {child.class}</div>}
          </div>
        </Card>

        {/* Permissions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Consent Permissions</h3>
          
          <div className="space-y-6">
            {/* Walk Home Consent */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Consent to Walk Home</h4>
                <p className="text-sm text-gray-600">
                  I give permission for my child to walk home alone after activities
                </p>
              </div>
              <button
                onClick={() => handlePermissionChange('consentToWalkHome')}
                className={`ml-4 w-12 h-6 rounded-full transition-colors ${
                  permissions?.consentToWalkHome ? 'bg-[#00806a]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  permissions?.consentToWalkHome ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Photography Consent */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Consent to Photography</h4>
                <p className="text-sm text-gray-600">
                  I give permission for photos/videos of my child to be taken during activities
                </p>
              </div>
              <button
                onClick={() => handlePermissionChange('consentToPhotography')}
                className={`ml-4 w-12 h-6 rounded-full transition-colors ${
                  permissions?.consentToPhotography ? 'bg-[#00806a]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  permissions?.consentToPhotography ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* First Aid Consent */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Consent to First Aid</h4>
                <p className="text-sm text-gray-600">
                  I give permission for first aid to be administered to my child if needed
                </p>
              </div>
              <button
                onClick={() => handlePermissionChange('consentToFirstAid')}
                className={`ml-4 w-12 h-6 rounded-full transition-colors ${
                  permissions?.consentToFirstAid ? 'bg-[#00806a]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  permissions?.consentToFirstAid ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Emergency Contact Consent */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-1">Consent to Emergency Contact</h4>
                <p className="text-sm text-gray-600">
                  I give permission for emergency services to be contacted if necessary
                </p>
              </div>
              <button
                onClick={() => handlePermissionChange('consentToEmergencyContact')}
                className={`ml-4 w-12 h-6 rounded-full transition-colors ${
                  permissions?.consentToEmergencyContact ? 'bg-[#00806a]' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                  permissions?.consentToEmergencyContact ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Permission Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              {permissions?.consentToWalkHome ? (
                <CheckIcon className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XMarkIcon className="h-4 w-4 text-red-600 mr-2" />
              )}
              <span className={permissions?.consentToWalkHome ? 'text-green-700' : 'text-red-700'}>
                Walk Home: {permissions?.consentToWalkHome ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
            <div className="flex items-center">
              {permissions?.consentToPhotography ? (
                <CheckIcon className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XMarkIcon className="h-4 w-4 text-red-600 mr-2" />
              )}
              <span className={permissions?.consentToPhotography ? 'text-green-700' : 'text-red-700'}>
                Photography: {permissions?.consentToPhotography ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
            <div className="flex items-center">
              {permissions?.consentToFirstAid ? (
                <CheckIcon className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XMarkIcon className="h-4 w-4 text-red-600 mr-2" />
              )}
              <span className={permissions?.consentToFirstAid ? 'text-green-700' : 'text-red-700'}>
                First Aid: {permissions?.consentToFirstAid ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
            <div className="flex items-center">
              {permissions?.consentToEmergencyContact ? (
                <CheckIcon className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <XMarkIcon className="h-4 w-4 text-red-600 mr-2" />
              )}
              <span className={permissions?.consentToEmergencyContact ? 'text-green-700' : 'text-red-700'}>
                Emergency Contact: {permissions?.consentToEmergencyContact ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <div className="pt-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#00806a] hover:bg-[#006d5a] text-white py-3 text-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChildPermissionsPage;
