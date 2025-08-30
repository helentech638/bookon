import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import ChildForm from '../../components/children/ChildForm';
import { authService } from '../../services/authService';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup?: string;
  allergies?: string;
  medicalInfo?: string;
  emergencyContacts?: string;
  createdAt: string;
  updatedAt: string;
}

const ChildrenPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      
      const response = await fetch('http://localhost:3000/api/v1/children', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChildren(data.data);
      } else {
        toast.error('Failed to fetch children');
      }
    } catch (error) {
      toast.error('Error fetching children');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async (childData: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const token = authService.getToken();
      
      const response = await fetch('http://localhost:3000/api/v1/children', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(childData)
      });

      if (response.ok) {
        const data = await response.json();
        setChildren(prev => [...prev, data.data]);
        setShowAddModal(false);
        toast.success('Child added successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to add child');
      }
    } catch (error) {
      toast.error('Error adding child');
    }
  };

  const handleEditChild = async (childData: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedChild) return;

    try {
      const token = authService.getToken();
      
      const response = await fetch(`http://localhost:3000/api/v1/children/${selectedChild.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(childData)
      });

      if (response.ok) {
        const data = await response.json();
        setChildren(prev => prev.map(child => 
          child.id === selectedChild.id ? data.data : child
        ));
        setShowEditModal(false);
        setSelectedChild(null);
        toast.success('Child updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error?.message || 'Failed to update child');
      }
    } catch (error) {
      toast.error('Error updating child');
    }
  };

  const handleDeleteChild = async () => {
    if (!selectedChild) return;

    try {
      const token = authService.getToken();
      
      const response = await fetch(`http://localhost:3000/api/v1/children/${selectedChild.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setChildren(prev => prev.filter(child => child.id !== selectedChild.id));
        setShowDeleteModal(false);
        setSelectedChild(null);
        toast.success('Child deleted successfully');
      } else {
        toast.error('Failed to delete child');
      }
    } catch (error) {
      toast.error('Error deleting child');
    }
  };

  const openEditModal = (child: Child) => {
    setSelectedChild(child);
    setShowEditModal(true);
  };

  const openDeleteModal = (child: Child) => {
    setSelectedChild(child);
    setShowDeleteModal(true);
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
          <p className="text-gray-600 mt-2">Manage your children's information and preferences</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Child
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {children.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No children added yet</h3>
            <p className="text-gray-600 mb-6">Add your children to start booking activities for them.</p>
            <Button onClick={() => setShowAddModal(true)}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Card key={child.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{child.firstName} {child.lastName}</CardTitle>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {calculateAge(child.dateOfBirth)} years old
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(child)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(child)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {child.yearGroup && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Year Group:</span>
                      <p className="text-sm text-gray-600">{child.yearGroup}</p>
                    </div>
                  )}
                  
                  {child.allergies && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Allergies:</span>
                      <p className="text-sm text-gray-600">{child.allergies}</p>
                    </div>
                  )}
                  
                  {child.medicalInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Medical Info:</span>
                      <p className="text-sm text-gray-600">{child.medicalInfo}</p>
                    </div>
                  )}
                  
                  {child.emergencyContacts && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Emergency Contacts:</span>
                      <p className="text-sm text-gray-600">{child.emergencyContacts}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Child Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Child"
      >
        <ChildForm
          onSubmit={handleAddChild}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Child Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedChild(null);
        }}
        title="Edit Child"
      >
        {selectedChild && (
          <ChildForm
            child={selectedChild}
            onSubmit={handleEditChild}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedChild(null);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedChild(null);
        }}
        title="Delete Child"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete {selectedChild?.firstName} {selectedChild?.lastName}? 
            This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedChild(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteChild}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChildrenPage;
