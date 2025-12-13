import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  Modal,
  Table,
  Tabs,
  Avatar,
  Alert
} from '@/components/common';
import { formatDate } from '@/utils/formatters';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'worker' | 'employer' | 'government' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin: string;
  avatar?: string;
  organization?: string;
  verificationStatus: 'verified' | 'unverified' | 'pending';
}

const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    role: 'worker',
    status: 'active',
    createdAt: '2023-06-15',
    lastLogin: '2024-01-15T10:30:00',
    verificationStatus: 'verified',
  },
  {
    id: 'U002',
    name: 'ABC Construction Pvt Ltd',
    email: 'admin@abcconstruction.com',
    phone: '+91 11 2345 6789',
    role: 'employer',
    status: 'active',
    createdAt: '2023-04-10',
    lastLogin: '2024-01-15T09:00:00',
    organization: 'ABC Construction Pvt Ltd',
    verificationStatus: 'verified',
  },
  {
    id: 'U003',
    name: 'Priya Sharma',
    email: 'priya.sharma@gov.in',
    phone: '+91 11 9876 5432',
    role: 'government',
    status: 'active',
    createdAt: '2023-08-20',
    lastLogin: '2024-01-14T16:45:00',
    organization: 'Ministry of Labour',
    verificationStatus: 'verified',
  },
  {
    id: 'U004',
    name: 'Admin User',
    email: 'admin@tracient.gov.in',
    phone: '+91 11 1234 5678',
    role: 'admin',
    status: 'active',
    createdAt: '2023-01-01',
    lastLogin: '2024-01-15T14:30:00',
    verificationStatus: 'verified',
  },
  {
    id: 'U005',
    name: 'Tech Solutions Ltd',
    email: 'contact@techsolutions.com',
    phone: '+91 80 4567 8901',
    role: 'employer',
    status: 'pending',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-10T11:00:00',
    organization: 'Tech Solutions Ltd',
    verificationStatus: 'pending',
  },
  {
    id: 'U006',
    name: 'Amit Singh',
    email: 'amit.singh@email.com',
    phone: '+91 77889 90011',
    role: 'worker',
    status: 'suspended',
    createdAt: '2023-09-05',
    lastLogin: '2024-01-05T08:30:00',
    verificationStatus: 'unverified',
  },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUsers(mockUsers);
      setIsLoading(false);
    };
    fetchUsers();
  }, []);

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'worker', label: 'Worker' },
    { value: 'employer', label: 'Employer' },
    { value: 'government', label: 'Government' },
    { value: 'admin', label: 'Admin' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' },
  ];

  const tabs = [
    { id: 'all', label: 'All Users' },
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'suspended', label: 'Suspended' },
  ];

  const getRoleBadge = (role: User['role']) => {
    const config = {
      worker: { variant: 'primary' as const, label: 'Worker' },
      employer: { variant: 'success' as const, label: 'Employer' },
      government: { variant: 'accent' as const, label: 'Government' },
      admin: { variant: 'error' as const, label: 'Admin' },
    };
    return config[role];
  };

  const getStatusBadge = (status: User['status']) => {
    const config = {
      active: { variant: 'success' as const, label: 'Active' },
      inactive: { variant: 'default' as const, label: 'Inactive' },
      suspended: { variant: 'error' as const, label: 'Suspended' },
      pending: { variant: 'warning' as const, label: 'Pending' },
    };
    return config[status];
  };

  const handleStatusChange = (userId: string, newStatus: User['status']) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, status: newStatus } : u))
    );
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesTab = activeTab === 'all' || user.status === activeTab;
    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => {
        const role = getRoleBadge(user.role);
        return <Badge variant={role.variant}>{role.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => {
        const status = getStatusBadge(user.status);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (user: User) => (
        <div className="flex items-center gap-1">
          {user.verificationStatus === 'verified' ? (
            <UserCheck className="h-4 w-4 text-green-500" />
          ) : user.verificationStatus === 'pending' ? (
            <Shield className="h-4 w-4 text-amber-500" />
          ) : (
            <UserX className="h-4 w-4 text-gray-400" />
          )}
          <span className="text-sm capitalize">{user.verificationStatus}</span>
        </div>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user: User) => (
        <span className="text-sm text-gray-500">{formatDate(user.lastLogin)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUser(user)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setIsDeleteModalOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users and access permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.status === 'active').length}
            </p>
            <p className="text-sm text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {users.filter(u => u.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {users.filter(u => u.status === 'suspended').length}
            </p>
            <p className="text-sm text-gray-500">Suspended</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              className="w-40"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredUsers}
            emptyMessage="No users found matching your criteria"
          />
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!selectedUser && !isDeleteModalOpen}
        onClose={() => setSelectedUser(null)}
        title="Edit User"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              <Avatar name={selectedUser.name} size="lg" />
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                defaultValue={selectedUser.name}
              />
              <Input
                label="Email"
                type="email"
                defaultValue={selectedUser.email}
              />
              <Input
                label="Phone"
                defaultValue={selectedUser.phone}
              />
              <Select
                label="Role"
                options={roleOptions.filter(r => r.value !== 'all')}
                value={selectedUser.role}
              />
              <Select
                label="Status"
                options={statusOptions.filter(s => s.value !== 'all')}
                value={selectedUser.status}
                onChange={(value) => handleStatusChange(selectedUser.id, value as User['status'])}
              />
              {selectedUser.organization && (
                <Input
                  label="Organization"
                  defaultValue={selectedUser.organization}
                />
              )}
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="font-medium">{formatDate(selectedUser.lastLogin)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Cancel
                </Button>
                <Button variant="primary">
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Delete User"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Alert variant="error">
              <p>
                Are you sure you want to delete <strong>{selectedUser.name}</strong>?
                This action cannot be undone.
              </p>
            </Alert>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="error"
                onClick={() => handleDeleteUser(selectedUser.id)}
              >
                Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="Enter full name" />
            <Input label="Email" type="email" placeholder="Enter email" />
            <Input label="Phone" placeholder="Enter phone number" />
            <Select
              label="Role"
              options={roleOptions.filter(r => r.value !== 'all')}
            />
          </div>
          <Input label="Organization (Optional)" placeholder="Enter organization name" />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
