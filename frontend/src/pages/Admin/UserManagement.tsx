import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  EyeIcon, 
  PencilIcon,
  UserIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import ResponsiveTable from '../../components/ui/ResponsiveTable';
import MobileFilters from '../../components/ui/MobileFilters';
import MobileModal from '../../components/ui/MobileModal';
import { authService } from '../../services/authService';
import { buildApiUrl } from '../../config/api';
import AdminLayout from '../../components/layout/AdminLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = authService.getToken();
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(buildApiUrl(`/admin/users?${queryParams}`), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    try {
      const token = authService.getToken();
      const response = await fetch(buildApiUrl(`/admin/users/${userId}`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success('User updated successfully');
        fetchUsers(); // Refresh the list
        setShowEditModal(false);
        setEditingUser(null);
      } else {
        toast.error('Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      isActive: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldCheckIcon className="w-4 h-4" />;
      case 'venue_owner':
        return <BuildingOfficeIcon className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'venue_owner':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filterFields = [
    {
      key: 'role',
      label: 'Role',
      type: 'select' as const,
      options: [
        { value: 'user', label: 'User' },
        { value: 'venue_owner', label: 'Venue Owner' },
        { value: 'admin', label: 'Admin' }
      ]
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  const tableColumns = [
    {
      key: 'user',
      label: 'User',
      mobileLabel: 'User',
      render: (value: any, row: User) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-sm text-gray-500">
              {row.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Role',
      mobileLabel: 'Role',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(value)}`}>
          {getRoleIcon(value)}
          <span className="ml-1 capitalize">{value.replace('_', ' ')}</span>
        </span>
      )
    },
    {
      key: 'isActive',
      label: 'Status',
      mobileLabel: 'Status',
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Member Since',
      mobileLabel: 'Member Since',
      render: (value: string) => (
        <div className="text-sm text-gray-500">
          {formatDate(value)}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      mobileLabel: 'Actions',
      render: (value: any, row: User) => (
        <Button
          onClick={() => openEditModal(row)}
          size="sm"
          variant="outline"
          className="text-green-600 border-green-600 hover:bg-green-50"
        >
          <PencilIcon className="w-4 h-4 mr-1" />
          Edit
        </Button>
      )
    }
  ];

  return (
    <AdminLayout title="User Management">
      <div className="space-y-6">
        <div>
          <p className="text-gray-600">Manage user accounts, roles, and permissions</p>
        </div>

        {/* Search Bar */}
        <Card>
          <div className="p-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </Card>

        {/* Mobile Filters */}
        <MobileFilters
          filters={filterFields}
          values={filters}
          onChange={handleFilterChange}
          onReset={clearFilters}
          onApply={() => {}}
        />

        {/* Users Table */}
        <ResponsiveTable
          columns={tableColumns}
          data={users}
          loading={loading}
          emptyMessage="No users found"
          emptyIcon={UserIcon}
        />

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Card>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.pages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Edit User Modal */}
      <MobileModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        title="Edit User"
        size="md"
      >
        {editingUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <div className="text-sm text-gray-900">
                {editingUser.firstName} {editingUser.lastName}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="text-sm text-gray-900">{editingUser.email}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value } : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="venue_owner">Venue Owner</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-900">Account is active</span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateUser(editingUser.id, {
                  role: editingUser.role,
                  isActive: editingUser.isActive
                })}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </MobileModal>
    </AdminLayout>
  );
};

export default UserManagement;
