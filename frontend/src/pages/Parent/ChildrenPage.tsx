import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { authService } from '../../services/authService';
import { childrenService } from '../../services/childrenService';

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup: string;
  school: string;
  allergies: string | null;
  medicalInfo: string | null;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  } | null;
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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    yearGroup: '',
    school: '',
    allergies: '',
    medicalInfo: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  });

  const yearGroups = [
    'Reception', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6',
    'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12', 'Year 13'
  ];

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await childrenService.getChildren();
      if (response.success) {
        setChildren(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to fetch children');
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChild = async () => {
    try {
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        yearGroup: formData.yearGroup,
        school: formData.school,
        allergies: formData.allergies || null,
        medicalInfo: formData.medicalInfo || null,
        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        } : null
      };

      const response = await childrenService.createChild(childData);
      if (response.success) {
        toast.success('Child added successfully');
        setShowAddModal(false);
        resetForm();
        fetchChildren();
      }
    } catch (error) {
      toast.error('Failed to add child');
      console.error('Error adding child:', error);
    }
  };

  const handleEditChild = async () => {
    if (!selectedChild) return;

    try {
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        yearGroup: formData.yearGroup,
        school: formData.school,
        allergies: formData.allergies || null,
        medicalInfo: formData.medicalInfo || null,
        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship
        } : null
      };

      const response = await childrenService.updateChild(selectedChild.id, childData);
      if (response.success) {
        toast.success('Child updated successfully');
        setShowEditModal(false);
        resetForm();
        fetchChildren();
      }
    } catch (error) {
      toast.error('Failed to update child');
      console.error('Error updating child:', error);
    }
  };

  const handleDeleteChild = async () => {
    if (!selectedChild) return;

    try {
      const response = await childrenService.deleteChild(selectedChild.id);
      if (response.success) {
        toast.success('Child deleted successfully');
        setShowDeleteModal(false);
        fetchChildren();
      }
    } catch (error) {
      toast.error('Failed to delete child');
      console.error('Error deleting child:', error);
    }
  };

  const openEditModal = (child: Child) => {
    setSelectedChild(child);
    setFormData({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      yearGroup: child.yearGroup,
      school: child.school || '',
      allergies: child.allergies || '',
      medicalInfo: child.medicalInfo || '',
      emergencyContactName: child.emergencyContact?.name || '',
      emergencyContactPhone: child.emergencyContact?.phone || '',
      emergencyContactRelationship: child.emergencyContact?.relationship || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (child: Child) => {
    setSelectedChild(child);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      yearGroup: '',
      school: '',
      allergies: '',
      medicalInfo: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: ''
    });
    setSelectedChild(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00806a]"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <UserGroupIcon className="h-8 w-8 text-[#00806a] mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">My Children</h1>
        </div>
        <p className="text-gray-600">Manage your children's profiles for activity bookings</p>
      </div>

      {/* Add Child Button */}
      <div className="mb-6">
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#00806a] hover:bg-[#006d5a] text-white"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Child
        </Button>
      </div>

      {/* Children Grid */}
      {children.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No children added yet</h3>
            <p className="text-gray-500 mb-4">Add your children to start booking activities</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-[#00806a] hover:bg-[#006d5a] text-white"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Child
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <Card key={child.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      {child.firstName} {child.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{child.yearGroup}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(child)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteModal(child)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Date of Birth:</span>
                    <p className="text-sm text-gray-900">
                      {new Date(child.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {child.allergies && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Allergies:</span>
                      <p className="text-sm text-gray-900">{child.allergies}</p>
                    </div>
                  )}
                  
                  {child.medicalInfo && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Medical Info:</span>
                      <p className="text-sm text-gray-900">{child.medicalInfo}</p>
                    </div>
                  )}
                  
                  {child.emergencyContact && (
                    <div>
                      <span className="text-sm font-medium text-gray-700">Emergency Contact:</span>
                      <p className="text-sm text-gray-900">
                        {child.emergencyContact.name} ({child.emergencyContact.relationship})
                      </p>
                      <p className="text-sm text-gray-600">{child.emergencyContact.phone}</p>
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
        title="Add New Child"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
            <Select
              label="Year Group"
              value={formData.yearGroup}
              onChange={(e) => setFormData({ ...formData, yearGroup: e.target.value })}
              required
            >
              <option value="">Select Year Group</option>
              {yearGroups.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
            <Input
              label="School *"
              type="text"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              placeholder="Enter school name"
              required
            />
          </div>
          
          <Textarea
            label="Allergies (optional)"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="Any allergies or dietary restrictions..."
          />
          
          <Textarea
            label="Medical Information (optional)"
            value={formData.medicalInfo}
            onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
            placeholder="Any medical conditions or special needs..."
          />
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Name"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
              <Input
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                placeholder="e.g., Parent, Guardian"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowAddModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddChild}
            className="bg-[#00806a] hover:bg-[#006d5a] text-white"
          >
            Add Child
          </Button>
        </div>
      </Modal>

      {/* Edit Child Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Child"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
            <Select
              label="Year Group"
              value={formData.yearGroup}
              onChange={(e) => setFormData({ ...formData, yearGroup: e.target.value })}
              required
            >
              <option value="">Select Year Group</option>
              {yearGroups.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
            <Input
              label="School *"
              type="text"
              value={formData.school}
              onChange={(e) => setFormData({ ...formData, school: e.target.value })}
              placeholder="Enter school name"
              required
            />
          </div>
          
          <Textarea
            label="Allergies (optional)"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="Any allergies or dietary restrictions..."
          />
          
          <Textarea
            label="Medical Information (optional)"
            value={formData.medicalInfo}
            onChange={(e) => setFormData({ ...formData, medicalInfo: e.target.value })}
            placeholder="Any medical conditions or special needs..."
          />
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Name"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
              <Input
                label="Phone"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
              <Input
                label="Relationship"
                value={formData.emergencyContactRelationship}
                onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                placeholder="e.g., Parent, Guardian"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditChild}
            className="bg-[#00806a] hover:bg-[#006d5a] text-white"
          >
            Update Child
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Child"
      >
        <div className="text-center">
          <TrashIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete {selectedChild?.firstName} {selectedChild?.lastName}?
          </h3>
          <p className="text-gray-500 mb-6">
            This action cannot be undone. All associated data will be permanently removed.
          </p>
        </div>
        
        <div className="flex justify-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowDeleteModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteChild}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Child
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ChildrenPage;
