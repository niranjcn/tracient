import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  Key,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Search,
  UserPlus,
  Settings,
  Lock,
  Unlock,
  FileText,
  Link2
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
  Tabs,
  Alert
} from '@/components/common';
import { formatDate } from '@/utils/formatters';
import {
  iamService,
  IAMUser,
  IAMRole,
  IAMPermission,
  FileIdentity,
  BlockchainIdentity
} from '@/services/iamService';
import { getBlockchainStatus, BlockchainStatus } from '@/services/blockchainService';

interface PermissionSelectProps {
  permissions: string[];
  availablePermissions: IAMPermission[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}

const PermissionSelect: React.FC<PermissionSelectProps> = ({
  permissions,
  availablePermissions,
  onChange,
  disabled
}) => {
  const togglePermission = (permId: string) => {
    if (permissions.includes(permId)) {
      onChange(permissions.filter(p => p !== permId));
    } else {
      onChange([...permissions, permId]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
        {availablePermissions.map(perm => (
          <label
            key={perm.id}
            className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <input
              type="checkbox"
              checked={permissions.includes(perm.id)}
              onChange={() => !disabled && togglePermission(perm.id)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">{perm.name}</span>
              <p className="text-xs text-gray-500">{perm.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

const IdentityManagement: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus | null>(null);
  
  // Users state
  const [users, setUsers] = useState<IAMUser[]>([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [registeredFilter, setRegisteredFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // File identities state
  const [fileIdentities, setFileIdentities] = useState<FileIdentity[]>([]);
  const [currentIdentity, setCurrentIdentity] = useState('');
  
  // Roles and permissions
  const [roles, setRoles] = useState<IAMRole[]>([]);
  const [permissions, setPermissions] = useState<IAMPermission[]>([]);
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<IAMUser | null>(null);
  const [userIdentityDetails, setUserIdentityDetails] = useState<{
    localIdentity: BlockchainIdentity | null;
    chainIdentity: any | null;
  } | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isBatchRegisterModalOpen, setIsBatchRegisterModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  // Form state
  const [registerForm, setRegisterForm] = useState<{
    permissions: string[];
    clearanceLevel: number;
  }>({ permissions: [], clearanceLevel: 1 });
  const [statusForm, setStatusForm] = useState<{
    status: 'active' | 'suspended' | 'revoked';
    reason: string;
  }>({ status: 'active', reason: '' });
  
  // Operation state
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationResult, setOperationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch blockchain status
  const fetchBlockchainStatus = useCallback(async () => {
    const status = await getBlockchainStatus();
    setBlockchainStatus(status);
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const params: any = {
        page: usersPagination.page,
        limit: usersPagination.limit
      };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (registeredFilter !== 'all') params.blockchainRegistered = registeredFilter === 'registered';
      
      const data = await iamService.getIAMUsers(params);
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [usersPagination.page, usersPagination.limit, roleFilter, registeredFilter]);

  // Fetch file identities
  const fetchFileIdentities = useCallback(async () => {
    try {
      const data = await iamService.getFileIdentities();
      setFileIdentities(data.identities);
      setCurrentIdentity(data.currentIdentity);
    } catch (error) {
      console.error('Error fetching file identities:', error);
    }
  }, []);

  // Fetch roles and permissions
  const fetchRolesAndPermissions = useCallback(async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        iamService.getIAMRoles(),
        iamService.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (error) {
      console.error('Error fetching roles/permissions:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchBlockchainStatus(),
        fetchUsers(),
        fetchFileIdentities(),
        fetchRolesAndPermissions()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // Reload users when filters change
  useEffect(() => {
    if (!isLoading) {
      fetchUsers();
    }
  }, [roleFilter, registeredFilter, usersPagination.page]);

  // Open user details modal
  const openUserDetails = async (user: IAMUser) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
    
    try {
      const details = await iamService.getUserIdentity(user._id);
      setUserIdentityDetails({
        localIdentity: details.localIdentity,
        chainIdentity: details.chainIdentity
      });
    } catch (error) {
      console.error('Error fetching user identity:', error);
    }
  };

  // Register user on blockchain
  const handleRegisterUser = async () => {
    if (!selectedUser) return;
    
    setOperationLoading(true);
    try {
      const result = await iamService.registerUserOnBlockchain(selectedUser._id, registerForm);
      setOperationResult({ success: result.success, message: result.message });
      if (result.success) {
        await fetchUsers();
        setIsRegisterModalOpen(false);
      }
    } catch (error: any) {
      setOperationResult({ success: false, message: error.message });
    } finally {
      setOperationLoading(false);
    }
  };

  // Batch register users
  const handleBatchRegister = async () => {
    if (selectedUsers.length === 0) return;
    
    setOperationLoading(true);
    try {
      const result = await iamService.batchRegisterUsers(selectedUsers);
      setOperationResult({
        success: true,
        message: `Registered ${result.data.successful.length} users, ${result.data.failed.length} failed`
      });
      await fetchUsers();
      setSelectedUsers([]);
      setIsBatchRegisterModalOpen(false);
    } catch (error: any) {
      setOperationResult({ success: false, message: error.message });
    } finally {
      setOperationLoading(false);
    }
  };

  // Update permissions
  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;
    
    setOperationLoading(true);
    try {
      const result = await iamService.updateUserPermissions(selectedUser._id, {
        permissions: registerForm.permissions,
        clearanceLevel: registerForm.clearanceLevel
      });
      setOperationResult({ success: result.success, message: result.message });
      if (result.success) {
        await fetchUsers();
        setIsPermissionsModalOpen(false);
      }
    } catch (error: any) {
      setOperationResult({ success: false, message: error.message });
    } finally {
      setOperationLoading(false);
    }
  };

  // Update user status
  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    
    setOperationLoading(true);
    try {
      const result = await iamService.updateUserBlockchainStatus(selectedUser._id, statusForm);
      setOperationResult({ success: result.success, message: result.message });
      if (result.success) {
        await fetchUsers();
        setIsStatusModalOpen(false);
      }
    } catch (error: any) {
      setOperationResult({ success: false, message: error.message });
    } finally {
      setOperationLoading(false);
    }
  };

  // Set default permissions based on role
  const setDefaultPermissions = (role: string) => {
    const roleData = roles.find(r => r.name === role);
    if (roleData) {
      setRegisterForm({
        permissions: roleData.permissions,
        clearanceLevel: roleData.clearanceLevel
      });
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'User Identities' },
    { id: 'file-identities', label: 'File-Based Identities' },
    { id: 'roles', label: 'Roles & Permissions' }
  ];

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'government', label: 'Government' },
    { value: 'employer', label: 'Employer' },
    { value: 'worker', label: 'Worker' }
  ];

  const registeredOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'registered', label: 'Blockchain Registered' },
    { value: 'unregistered', label: 'Not Registered' }
  ];

  const getRoleBadge = (role: string) => {
    const config: Record<string, { variant: 'primary' | 'success' | 'warning' | 'error'; label: string }> = {
      admin: { variant: 'error', label: 'Admin' },
      government: { variant: 'primary', label: 'Government' },
      employer: { variant: 'success', label: 'Employer' },
      worker: { variant: 'warning', label: 'Worker' }
    };
    return config[role] || { variant: 'primary', label: role };
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Identity & Access Management</h1>
          <p className="text-gray-500 mt-1">Manage blockchain identities and permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${blockchainStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {blockchainStatus?.connected ? 'Blockchain Connected' : 'Blockchain Disconnected'}
            </span>
          </div>
          <Button variant="outline" onClick={() => Promise.all([fetchUsers(), fetchFileIdentities()])}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Blockchain Status Alert */}
      {!blockchainStatus?.connected && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <span>Blockchain is not connected. Identity management features may be limited.</span>
        </Alert>
      )}

      {/* Operation Result Alert */}
      {operationResult && (
        <Alert variant={operationResult.success ? 'success' : 'error'} onClose={() => setOperationResult(null)}>
          {operationResult.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          <span>{operationResult.message}</span>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-gray-900">{usersPagination.total}</p>
            <p className="text-sm text-gray-500">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Link2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-600">
              {users.filter(u => u.blockchainRegistered).length}
            </p>
            <p className="text-sm text-gray-500">Blockchain Registered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Key className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-gray-900">{fileIdentities.length}</p>
            <p className="text-sm text-gray-500">File Identities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
            <p className="text-sm text-gray-500">IAM Roles</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
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
                  options={registeredOptions}
                  value={registeredFilter}
                  onChange={setRegisteredFilter}
                  className="w-48"
                />
                {selectedUsers.length > 0 && (
                  <Button onClick={() => setIsBatchRegisterModalOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register Selected ({selectedUsers.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.filter(u => !u.blockchainRegistered).length && selectedUsers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.filter(u => !u.blockchainRegistered).map(u => u._id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blockchain Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clearance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => {
                      const roleBadge = getRoleBadge(user.role);
                      return (
                        <tr key={user._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {!user.blockchainRegistered && (
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user._id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {user.blockchainRegistered ? (
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-600">Registered</span>
                                {user.blockchainIdentity?.status && (
                                  <Badge variant={user.blockchainIdentity.status === 'active' ? 'success' : 'error'}>
                                    {user.blockchainIdentity.status}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <X className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">Not Registered</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600">
                              {user.blockchainIdentity?.clearanceLevel ?? '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-500">{formatDate(user.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openUserDetails(user)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {!user.blockchainRegistered ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDefaultPermissions(user.role);
                                    setIsRegisterModalOpen(true);
                                  }}
                                  disabled={!blockchainStatus?.connected}
                                >
                                  <UserPlus className="h-4 w-4 text-blue-500" />
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setRegisterForm({
                                        permissions: user.blockchainIdentity?.permissions || [],
                                        clearanceLevel: user.blockchainIdentity?.clearanceLevel || 1
                                      });
                                      setIsPermissionsModalOpen(true);
                                    }}
                                    disabled={!blockchainStatus?.connected}
                                  >
                                    <Settings className="h-4 w-4 text-purple-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setStatusForm({
                                        status: user.blockchainIdentity?.status || 'active',
                                        reason: ''
                                      });
                                      setIsStatusModalOpen(true);
                                    }}
                                    disabled={!blockchainStatus?.connected}
                                  >
                                    {user.blockchainIdentity?.status === 'active' ? (
                                      <Lock className="h-4 w-4 text-amber-500" />
                                    ) : (
                                      <Unlock className="h-4 w-4 text-green-500" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {usersPagination.pages > 1 && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {(usersPagination.page - 1) * usersPagination.limit + 1} to{' '}
                    {Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)} of{' '}
                    {usersPagination.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPagination.page === 1}
                      onClick={() => setUsersPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={usersPagination.page === usersPagination.pages}
                      onClick={() => setUsersPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Identities Tab */}
      {activeTab === 'file-identities' && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">File-Based Blockchain Identities</h3>
                  <p className="text-sm text-gray-500">
                    Current Active: <span className="font-medium">{currentIdentity}</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fileIdentities.map(identity => (
                    <tr key={identity.username} className={`hover:bg-gray-50 ${
                      identity.username === currentIdentity ? 'bg-blue-50' : ''
                    }`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{identity.username}</span>
                          {identity.username === currentIdentity && (
                            <Badge variant="primary">Active</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm capitalize">{identity.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 font-mono">{identity.location}</span>
                      </td>
                      <td className="px-4 py-3">
                        {identity.certDetails ? (
                          <div>
                            <p className="text-xs text-gray-600">Expires: {identity.certDetails.expiresAt}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {identity.hasValidCert ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Valid</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <X className="h-4 w-4" />
                            <span className="text-sm">Invalid</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <Card key={role.name}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 capitalize">{role.name.replace('_', ' ')}</h3>
                  <Badge variant="primary">Level {role.clearanceLevel}</Badge>
                </div>
                <p className="text-sm text-gray-500 mb-3">{role.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600 uppercase">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.length > 0 ? (
                      role.permissions.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {perm.replace('can', '')}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No special permissions</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
          setUserIdentityDetails(null);
        }}
        title="User Identity Details"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
              </div>
              <Badge variant={getRoleBadge(selectedUser.role).variant} className="ml-auto">
                {getRoleBadge(selectedUser.role).label}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID Hash</p>
                <p className="font-mono text-xs break-all">{selectedUser.idHash || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-sm">{formatDate(selectedUser.createdAt)}</p>
              </div>
            </div>

            {selectedUser.blockchainRegistered && userIdentityDetails?.localIdentity && (
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-900">Blockchain Identity</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Role</p>
                    <p className="capitalize">{userIdentityDetails.localIdentity.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Clearance Level</p>
                    <p>{userIdentityDetails.localIdentity.clearanceLevel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge variant={userIdentityDetails.localIdentity.status === 'active' ? 'success' : 'error'}>
                      {userIdentityDetails.localIdentity.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {userIdentityDetails.localIdentity.permissions?.length > 0 ? (
                      userIdentityDetails.localIdentity.permissions.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {perm}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No permissions</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!selectedUser.blockchainRegistered && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <span>This user is not registered on the blockchain.</span>
              </Alert>
            )}
          </div>
        )}
      </Modal>

      {/* Register User Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          setIsRegisterModalOpen(false);
          setSelectedUser(null);
        }}
        title="Register User on Blockchain"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Alert variant="info">
              <Shield className="h-4 w-4" />
              <span>
                Registering <strong>{selectedUser.name}</strong> with role <strong>{selectedUser.role}</strong>
              </span>
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clearance Level
              </label>
              <Select
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({
                  value: n.toString(),
                  label: `Level ${n}`
                }))}
                value={registerForm.clearanceLevel.toString()}
                onChange={(v) => setRegisterForm(f => ({ ...f, clearanceLevel: parseInt(v) }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permissions
              </label>
              <PermissionSelect
                permissions={registerForm.permissions}
                availablePermissions={permissions}
                onChange={(p) => setRegisterForm(f => ({ ...f, permissions: p }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsRegisterModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegisterUser} disabled={operationLoading}>
                {operationLoading ? <Spinner size="sm" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Register on Blockchain
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Batch Register Modal */}
      <Modal
        isOpen={isBatchRegisterModalOpen}
        onClose={() => setIsBatchRegisterModalOpen(false)}
        title="Batch Register Users"
      >
        <div className="space-y-4">
          <Alert variant="info">
            <Users className="h-4 w-4" />
            <span>
              You are about to register <strong>{selectedUsers.length}</strong> users on the blockchain
              with their default role-based permissions.
            </span>
          </Alert>

          <p className="text-sm text-gray-600">
            Each user will be registered with the default permissions for their role.
            You can modify individual permissions after registration.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsBatchRegisterModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBatchRegister} disabled={operationLoading}>
              {operationLoading ? <Spinner size="sm" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Register All
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Permissions Modal */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          setSelectedUser(null);
        }}
        title="Update Blockchain Permissions"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Alert variant="info">
              <Settings className="h-4 w-4" />
              <span>
                Updating permissions for <strong>{selectedUser.name}</strong>
              </span>
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clearance Level
              </label>
              <Select
                options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ({
                  value: n.toString(),
                  label: `Level ${n}`
                }))}
                value={registerForm.clearanceLevel.toString()}
                onChange={(v) => setRegisterForm(f => ({ ...f, clearanceLevel: parseInt(v) }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permissions
              </label>
              <PermissionSelect
                permissions={registerForm.permissions}
                availablePermissions={permissions}
                onChange={(p) => setRegisterForm(f => ({ ...f, permissions: p }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsPermissionsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdatePermissions} disabled={operationLoading}>
                {operationLoading ? <Spinner size="sm" /> : <Check className="h-4 w-4 mr-2" />}
                Update Permissions
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedUser(null);
        }}
        title="Update Blockchain Status"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Alert variant={statusForm.status === 'active' ? 'success' : 'warning'}>
              {statusForm.status === 'active' ? (
                <Unlock className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              <span>
                Setting status for <strong>{selectedUser.name}</strong>
              </span>
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <Select
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'revoked', label: 'Revoked' }
                ]}
                value={statusForm.status}
                onChange={(v) => setStatusForm(f => ({ ...f, status: v as any }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (Optional)
              </label>
              <Input
                value={statusForm.reason}
                onChange={(e) => setStatusForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Enter reason for status change..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={statusForm.status === 'active' ? 'primary' : 'danger'}
                onClick={handleUpdateStatus}
                disabled={operationLoading}
              >
                {operationLoading ? <Spinner size="sm" /> : <Check className="h-4 w-4 mr-2" />}
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IdentityManagement;
