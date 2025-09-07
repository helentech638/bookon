import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as ClockIconSolid,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import AdminLayout from '../../components/layout/AdminLayout';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';

interface Register {
  id: string;
  activity_id: string;
  date: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  activity_title: string;
  venue_name: string;
  start_time: string;
  attendance?: AttendanceRecord[];
}

interface AttendanceRecord {
  id: string;
  child_id: string;
  status: 'present' | 'absent' | 'late' | 'left_early';
  notes?: string;
  recorded_at: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  year_group?: string;
  allergies?: string;
  medical_info?: string;
}

interface RegisterTemplate {
  activityId: string;
  date: string;
  activityTitle: string;
  venueName: string;
  startTime: string;
  endTime: string;
  children: {
    childId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    yearGroup?: string;
    allergies?: string;
    medicalInfo?: string;
    bookingId: string;
    status: 'present' | 'absent' | 'late' | 'left_early';
    notes: string;
  }[];
}

interface Activity {
  id: string;
  title: string;
  venue_name: string;
  start_date: string;
  start_time: string;
}

const RegisterManagement: React.FC = () => {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<Register | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [registerTemplate, setRegisterTemplate] = useState<RegisterTemplate | null>(null);
  const [filterVenue, setFilterVenue] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    fetchRegisters();
    fetchActivities();
  }, [filterVenue, filterDate]);

  const fetchRegisters = async () => {
    try {
      const token = authService.getToken();
      let url = buildApiUrl('/registers');
      const params = new URLSearchParams();
      
      if (filterVenue) params.append('venueId', filterVenue);
      if (filterDate) params.append('date', filterDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRegisters(data.data);
      } else {
        toast.error('Failed to fetch registers');
      }
    } catch (error) {
      toast.error('Error fetching registers');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl('/activities'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to fetch activities');
    }
  };

  const generateTemplate = async () => {
    if (!selectedActivity || !selectedDate) {
      toast.error('Please select both activity and date');
      return;
    }

    try {
      const token = authService.getToken();
      const response = await fetch(
        buildApiUrl(`/registers/template/${selectedActivity}?date=${selectedDate}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRegisterTemplate(data.data);
        setShowCreateModal(true);
      } else {
        toast.error('Failed to generate template');
      }
    } catch (error) {
      toast.error('Error generating template');
    }
  };

  const createRegister = async () => {
    if (!registerTemplate) return;

    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl('/registers'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activityId: registerTemplate.activityId,
          date: registerTemplate.date,
          attendance: registerTemplate.children.map(child => ({
            childId: child.childId,
            status: child.status,
            notes: child.notes
          }))
        })
      });

      if (response.ok) {
        toast.success('Register created successfully');
        setShowCreateModal(false);
        setRegisterTemplate(null);
        fetchRegisters();
      } else {
        toast.error('Failed to create register');
      }
    } catch (error) {
      toast.error('Error creating register');
    }
  };

  const updateRegister = async () => {
    if (!selectedRegister || !registerTemplate) return;

    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/registers/${selectedRegister.id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attendance: registerTemplate.children.map(child => ({
            childId: child.childId,
            status: child.status,
            notes: child.notes
          }))
        })
      });

      if (response.ok) {
        toast.success('Register updated successfully');
        setShowEditModal(false);
        setSelectedRegister(null);
        setRegisterTemplate(null);
        fetchRegisters();
      } else {
        toast.error('Failed to update register');
      }
    } catch (error) {
      toast.error('Error updating register');
    }
  };

  const deleteRegister = async () => {
    if (!selectedRegister) return;

    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/registers/${selectedRegister.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Register deleted successfully');
        setShowDeleteModal(false);
        setSelectedRegister(null);
        fetchRegisters();
      } else {
        toast.error('Failed to delete register');
      }
    } catch (error) {
      toast.error('Error deleting register');
    }
  };

  const exportToCSV = async (registerId: string) => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/registers/${registerId}/export/csv`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `register-${registerId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Register exported successfully');
      } else {
        toast.error('Failed to export register');
      }
    } catch (error) {
      toast.error('Error exporting register');
    }
  };

  const openEditModal = async (register: Register) => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/registers/${register.id}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const registerWithAttendance = data.data;
        
        // Convert to template format
        const template: RegisterTemplate = {
          activityId: registerWithAttendance.activity_id,
          date: registerWithAttendance.date,
          activityTitle: registerWithAttendance.activity_title,
          venueName: registerWithAttendance.venue_name,
          startTime: registerWithAttendance.start_time,
          endTime: registerWithAttendance.start_time, // We don't have end_time in the response
          children: registerWithAttendance.attendance.map((att: any) => ({
            childId: att.child_id,
            firstName: att.first_name,
            lastName: att.last_name,
            dateOfBirth: att.date_of_birth,
            yearGroup: att.year_group,
            allergies: att.allergies,
            medicalInfo: att.medical_info,
            bookingId: '', // Not available in attendance record
            status: att.status,
            notes: att.notes || ''
          }))
        };
        
        setRegisterTemplate(template);
        setSelectedRegister(register);
        setShowEditModal(true);
      } else {
        toast.error('Failed to fetch register details');
      }
    } catch (error) {
      toast.error('Error fetching register details');
    }
  };

  const openDeleteModal = (register: Register) => {
    setSelectedRegister(register);
    setShowDeleteModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'late':
        return <ClockIconSolid className="w-5 h-5 text-yellow-500" />;
      case 'left_early':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'left_early':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registers...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Register Management">
      <div className="mb-6">
        <p className="text-gray-600">Manage digital registers and track attendance</p>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Register
          </Button>
        </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Venue</label>
              <Select
                value={filterVenue}
                onChange={(e) => setFilterVenue(e.target.value)}
              >
                <option value="">All Venues</option>
                {activities.map(activity => (
                  <option key={activity.venue_name} value={activity.venue_name}>
                    {activity.venue_name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Date</label>
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setFilterVenue(''); setFilterDate(''); }}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {registers.map((register) => (
          <Card key={register.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{register.activity_title}</CardTitle>
                  <p className="text-sm text-gray-600">{register.venue_name}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(register.id)}
                    title="Export to CSV"
                  >
                    <DocumentArrowDownIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(register)}
                    title="Edit Register"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(register)}
                    title="Delete Register"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {new Date(register.date).toLocaleDateString('en-GB')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  {register.start_time}
                </div>
                {register.attendance && register.attendance.length > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <UserGroupIcon className="w-4 h-4 mr-2" />
                    {register.attendance.length} children
                  </div>
                )}
                {register.notes && (
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Notes:</p>
                    <p>{register.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {registers.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No registers found</h3>
          <p className="text-gray-600 mb-4">Create your first register to start tracking attendance.</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Register
          </Button>
        </div>
      )}

      {/* Create/Edit Register Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
          setRegisterTemplate(null);
          setSelectedRegister(null);
        }}
        title={showEditModal ? 'Edit Register' : 'Create Register'}
      >
        {!registerTemplate ? (
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Activity</label>
                <Select
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                >
                  <option value="">Choose an activity</option>
                  {activities.map(activity => (
                    <option key={activity.id} value={activity.id}>
                      {activity.title} - {activity.venue_name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedActivity('');
                    setSelectedDate('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={generateTemplate}
                  disabled={!selectedActivity || !selectedDate}
                >
                  Generate Template
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">{registerTemplate.activityTitle}</h3>
              <p className="text-sm text-gray-600">{registerTemplate.venueName}</p>
              <p className="text-sm text-gray-600">
                {new Date(registerTemplate.date).toLocaleDateString('en-GB')} at {registerTemplate.startTime}
              </p>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {registerTemplate.children.map((child, index) => (
                <div key={child.childId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{child.firstName} {child.lastName}</h4>
                      <p className="text-sm text-gray-600">
                        {child.yearGroup && `${child.yearGroup} • `}
                        {new Date().getFullYear() - new Date(child.dateOfBirth).getFullYear()} years old
                      </p>
                    </div>
                    <Select
                      value={child.status}
                      onChange={(e) => {
                        const newTemplate = { ...registerTemplate };
                        newTemplate.children[index].status = e.target.value as any;
                        setRegisterTemplate(newTemplate);
                      }}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="left_early">Left Early</option>
                    </Select>
                  </div>
                  
                  {(child.allergies || child.medicalInfo) && (
                    <div className="text-sm text-gray-600 mb-2">
                      {child.allergies && (
                        <p><span className="font-medium">Allergies:</span> {child.allergies}</p>
                      )}
                      {child.medicalInfo && (
                        <p><span className="font-medium">Medical Info:</span> {child.medicalInfo}</p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <Textarea
                      value={child.notes}
                      onChange={(e) => {
                        const newTemplate = { ...registerTemplate };
                        newTemplate.children[index].notes = e.target.value;
                        setRegisterTemplate(newTemplate);
                      }}
                      placeholder="Add notes about this child's attendance..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setRegisterTemplate(null);
                  setSelectedRegister(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={showEditModal ? updateRegister : createRegister}
              >
                {showEditModal ? 'Update Register' : 'Create Register'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRegister(null);
        }}
        title="Delete Register"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete the register for "{selectedRegister?.activity_title}" on {selectedRegister?.date}?
            This action cannot be undone.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedRegister(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteRegister}
            >
              Delete Register
            </Button>
          </div>
        </div>
      </Modal>
      </div>
    </AdminLayout>
  );
};

export default RegisterManagement;
