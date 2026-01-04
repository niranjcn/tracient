import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  Link2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { 
  Card, 
  CardContent,
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
import { iamService, IAMUser } from '@/services/iamService';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'worker' | 'employer' | 'government' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
  organization?: string;
  idHash?: string;
  blockchainRegistered: boolean;
  blockchainIdentity?: {
    permissions: string[];
    status: string;
    clearanceLevel?: number;
    registeredAt?: string;
  };
}

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
  const [page] = useState(1);
  const [_totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: Record<string, any> = {
        page,
        limit: 20,
      };
      
      if (roleFilter !== 'all') params.role = roleFilter;
      
      const response = await iamService.getIAMUsers(params);
      
      if (response && response.users) {
        const mappedUsers: User[] = response.users.map((u: IAMUser) => ({
          id: u.id || u._id,
          name: u.name,
          email: u.email,
          role: u.role as User['role'],
          status: u.blockchainIdentity?.status === 'suspended' ? 'suspended' : 
                  u.blockchainIdentity?.status === 'active' ? 'active' : 'pending',
          createdAt: u.createdAt,
          idHash: u.idHash,
          blockchainRegistered: u.blockchainRegistered,
          blockchainIdentity: u.blockchainIdentity,
        }));
        
        setUsers(mappedUsers);
        setTotalPages(response.pagination?.pages || 1);
        setTotalUsers(response.pagination?.total || mappedUsers.length);
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to fetch users');
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, roleFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  const handleRegisterOnBlockchain = async (user: User) => {
    try {
      setProcessingUserId(user.id);
      const response = await iamService.registerUserOnBlockchain(user.id);
      
      if (response.success) {
        toast.success(`${user.name} registered on blockchain`);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(response.error || 'Failed to register on blockchain');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to register on blockchain');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      setProcessingUserId(userId);
      const response = await iamService.updateUserBlockchainStatus(userId, { status: newStatus });
      
      if (response.success) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, status: newStatus } : u))
        );
        toast.success(`User status updated to ${newStatus}`);
      } else {
        toast.error('Failed to update status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeleteUser = (_userId: string) => {
    // For now, just close the modal - implement actual delete via admin service
    toast('User deletion requires additional confirmation');
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

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
    { id: 'pending', label: 'Pending' },
    { id: 'suspended', label: 'Suspended' },
  ];

  const getRoleBadge = (role: User['role']) => {
    const config = {
      worker: { variant: 'primary' as const, label: 'Worker' },
      employer: { variant: 'success' as const, label: 'Employer' },
      government: { variant: 'primary' as const, label: 'Government' },
      admin: { variant: 'error' as const, label: 'Admin' },
    };
    return config[role] || config.worker;
  };

  const getStatusBadge = (status: User['status']) => {
    const config = {
      active: { variant: 'success' as const, label: 'Active' },
      inactive: { variant: 'default' as const, label: 'Inactive' },
      suspended: { variant: 'error' as const, label: 'Suspended' },
      pending: { variant: 'warning' as const, label: 'Pending' },
    };
    return config[status] || config.pending;
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
      key: 'blockchain',
      header: 'Blockchain',
      render: (user: User) => (
        <div className="flex items-center gap-1">
          {user.blockchainRegistered ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Registered</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-amber-600">Not Registered</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user: User) => (
        <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          {!user.blockchainRegistered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRegisterOnBlockchain(user)}
              disabled={processingUserId === user.id}
              title="Register on Blockchain"
            >
              {processingUserId === user.id ? (
                <Spinner size="sm" />
              ) : (
                <Link2 className="h-4 w-4 text-blue-500" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedUser(user)}
            title="Edit User"
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
            title="Delete User"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading && users.length === 0) {
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
          <p className="text-gray-500 mt-1">Manage system users and blockchain identities</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          <p>{error}</p>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
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
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.blockchainRegistered).length}
            </p>
            <p className="text-sm text-gray-500">On Blockchain</p>
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
                leftIcon={<Search className="h-4 w-4" />}
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
            keyField="id"
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
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                value={selectedUser.status}
                onChange={(value) => handleStatusChange(selectedUser.id, value as 'active' | 'suspended')}
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
              {selectedUser.lastLogin && (
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium">{formatDate(selectedUser.lastLogin)}</p>
                </div>
              )}
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
                variant="danger"
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
