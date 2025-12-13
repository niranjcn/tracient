import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search,
  Plus,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MoreVertical,
  Download,
  Filter
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
  Alert
} from '@/components/common';
import { formatDate, formatNumber } from '@/utils/formatters';

interface Organization {
  id: string;
  name: string;
  type: 'employer' | 'government' | 'ngo';
  registrationNumber: string;
  gstin?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  sector: string;
  employeeCount: number;
  workerCount: number;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  verificationStatus: 'verified' | 'unverified' | 'pending';
  createdAt: string;
  lastActivity: string;
}

const mockOrganizations: Organization[] = [
  {
    id: 'ORG001',
    name: 'ABC Construction Pvt Ltd',
    type: 'employer',
    registrationNumber: 'CIN1234567890',
    gstin: '29AABCU9603R1ZM',
    email: 'admin@abcconstruction.com',
    phone: '+91 11 2345 6789',
    address: '123, Industrial Area, Phase 2',
    city: 'Mumbai',
    state: 'Maharashtra',
    sector: 'Construction',
    employeeCount: 45,
    workerCount: 1250,
    status: 'active',
    verificationStatus: 'verified',
    createdAt: '2023-04-10',
    lastActivity: '2024-01-15T14:30:00',
  },
  {
    id: 'ORG002',
    name: 'Tech Solutions Ltd',
    type: 'employer',
    registrationNumber: 'CIN9876543210',
    gstin: '29AABCU9603R1ZX',
    email: 'contact@techsolutions.com',
    phone: '+91 80 4567 8901',
    address: '456, IT Park, Whitefield',
    city: 'Bangalore',
    state: 'Karnataka',
    sector: 'IT Services',
    employeeCount: 120,
    workerCount: 850,
    status: 'active',
    verificationStatus: 'verified',
    createdAt: '2023-06-15',
    lastActivity: '2024-01-15T10:00:00',
  },
  {
    id: 'ORG003',
    name: 'Green Farms Agricultural Co.',
    type: 'employer',
    registrationNumber: 'CIN5555555555',
    email: 'info@greenfarms.com',
    phone: '+91 40 9876 5432',
    address: '789, Agricultural Zone',
    city: 'Hyderabad',
    state: 'Telangana',
    sector: 'Agriculture',
    employeeCount: 25,
    workerCount: 2500,
    status: 'active',
    verificationStatus: 'verified',
    createdAt: '2023-02-20',
    lastActivity: '2024-01-14T16:00:00',
  },
  {
    id: 'ORG004',
    name: 'Ministry of Labour & Employment',
    type: 'government',
    registrationNumber: 'GOV-MOLE-001',
    email: 'contact@labour.gov.in',
    phone: '+91 11 1234 5678',
    address: 'Shram Shakti Bhawan',
    city: 'New Delhi',
    state: 'Delhi',
    sector: 'Government',
    employeeCount: 500,
    workerCount: 0,
    status: 'active',
    verificationStatus: 'verified',
    createdAt: '2023-01-01',
    lastActivity: '2024-01-15T09:00:00',
  },
  {
    id: 'ORG005',
    name: 'Green Energy Ltd',
    type: 'employer',
    registrationNumber: 'CIN7777777777',
    gstin: '29AABCU9603R1ZY',
    email: 'hr@greenenergy.com',
    phone: '+91 22 8765 4321',
    address: '321, Energy Park',
    city: 'Pune',
    state: 'Maharashtra',
    sector: 'Energy',
    employeeCount: 80,
    workerCount: 450,
    status: 'pending',
    verificationStatus: 'pending',
    createdAt: '2024-01-10',
    lastActivity: '2024-01-10T11:00:00',
  },
  {
    id: 'ORG006',
    name: 'Rural Development Foundation',
    type: 'ngo',
    registrationNumber: 'NGO-RDF-001',
    email: 'contact@rdf.org',
    phone: '+91 33 2222 3333',
    address: '55, NGO Complex',
    city: 'Kolkata',
    state: 'West Bengal',
    sector: 'Social Welfare',
    employeeCount: 30,
    workerCount: 0,
    status: 'active',
    verificationStatus: 'verified',
    createdAt: '2023-08-15',
    lastActivity: '2024-01-12T15:30:00',
  },
];

const Organizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchOrganizations = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setOrganizations(mockOrganizations);
      setIsLoading(false);
    };
    fetchOrganizations();
  }, []);

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'employer', label: 'Employer' },
    { value: 'government', label: 'Government' },
    { value: 'ngo', label: 'NGO' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const tabs = [
    { id: 'all', label: 'All Organizations' },
    { id: 'employer', label: 'Employers' },
    { id: 'government', label: 'Government' },
    { id: 'ngo', label: 'NGOs' },
  ];

  const getTypeBadge = (type: Organization['type']) => {
    const config = {
      employer: { variant: 'primary' as const, label: 'Employer' },
      government: { variant: 'accent' as const, label: 'Government' },
      ngo: { variant: 'success' as const, label: 'NGO' },
    };
    return config[type];
  };

  const getStatusBadge = (status: Organization['status']) => {
    const config = {
      active: { variant: 'success' as const, label: 'Active' },
      pending: { variant: 'warning' as const, label: 'Pending' },
      suspended: { variant: 'error' as const, label: 'Suspended' },
      inactive: { variant: 'default' as const, label: 'Inactive' },
    };
    return config[status];
  };

  const handleDeleteOrg = (orgId: string) => {
    setOrganizations(prev => prev.filter(o => o.id !== orgId));
    setIsDeleteModalOpen(false);
    setSelectedOrg(null);
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.sector.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || org.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
    const matchesTab = activeTab === 'all' || org.type === activeTab;
    return matchesSearch && matchesType && matchesStatus && matchesTab;
  });

  const columns = [
    {
      key: 'org',
      header: 'Organization',
      render: (org: Organization) => (
        <div>
          <p className="font-medium text-gray-900">{org.name}</p>
          <p className="text-xs text-gray-500">{org.registrationNumber}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (org: Organization) => {
        const type = getTypeBadge(org.type);
        return <Badge variant={type.variant}>{type.label}</Badge>;
      },
    },
    {
      key: 'location',
      header: 'Location',
      render: (org: Organization) => (
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3 w-3" />
          {org.city}, {org.state}
        </div>
      ),
    },
    {
      key: 'workers',
      header: 'Workers',
      render: (org: Organization) => (
        <span className="font-medium">{formatNumber(org.workerCount)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (org: Organization) => {
        const status = getStatusBadge(org.status);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (org: Organization) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedOrg(org)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedOrg(org);
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
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-500 mt-1">Manage registered organizations and employers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
            <p className="text-sm text-gray-500">Total Organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {organizations.filter(o => o.type === 'employer').length}
            </p>
            <p className="text-sm text-gray-500">Employers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {organizations.filter(o => o.status === 'active').length}
            </p>
            <p className="text-sm text-gray-500">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">
              {organizations.filter(o => o.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-500">Pending Approval</p>
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
                placeholder="Search by name, city, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={typeOptions}
              value={typeFilter}
              onChange={setTypeFilter}
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

      {/* Organizations Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredOrgs}
            emptyMessage="No organizations found matching your criteria"
          />
        </CardContent>
      </Card>

      {/* Organization Detail Modal */}
      <Modal
        isOpen={!!selectedOrg && !isDeleteModalOpen}
        onClose={() => setSelectedOrg(null)}
        title="Organization Details"
        size="lg"
      >
        {selectedOrg && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedOrg.name}</h3>
                <p className="text-sm text-gray-500">{selectedOrg.registrationNumber}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={getTypeBadge(selectedOrg.type).variant}>
                  {getTypeBadge(selectedOrg.type).label}
                </Badge>
                <Badge variant={getStatusBadge(selectedOrg.status).variant}>
                  {getStatusBadge(selectedOrg.status).label}
                </Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrg.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{selectedOrg.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                  <span>{selectedOrg.address}, {selectedOrg.city}, {selectedOrg.state}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span>Sector: {selectedOrg.sector}</span>
                </div>
                {selectedOrg.gstin && (
                  <div className="text-sm">
                    <span className="text-gray-500">GSTIN:</span> {selectedOrg.gstin}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{selectedOrg.employeeCount}</p>
                <p className="text-sm text-blue-600">Employees</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{formatNumber(selectedOrg.workerCount)}</p>
                <p className="text-sm text-green-600">Registered Workers</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Registered On</p>
                <p className="font-medium">{formatDate(selectedOrg.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Activity</p>
                <p className="font-medium">{formatDate(selectedOrg.lastActivity)}</p>
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
                Delete
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedOrg(null)}>
                  Close
                </Button>
                <Button variant="primary">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
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
          setSelectedOrg(null);
        }}
        title="Delete Organization"
      >
        {selectedOrg && (
          <div className="space-y-4">
            <Alert variant="error">
              <p>
                Are you sure you want to delete <strong>{selectedOrg.name}</strong>?
                This will remove all associated data including worker records.
              </p>
            </Alert>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedOrg(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="error"
                onClick={() => handleDeleteOrg(selectedOrg.id)}
              >
                Delete Organization
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Organization Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Organization"
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Organization Name" placeholder="Enter organization name" />
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Type"
              options={typeOptions.filter(t => t.value !== 'all')}
            />
            <Input label="Registration Number" placeholder="CIN/GSTIN/Registration" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Email" type="email" placeholder="Enter email" />
            <Input label="Phone" placeholder="Enter phone number" />
          </div>
          <Input label="Address" placeholder="Enter full address" />
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="City" placeholder="Enter city" />
            <Input label="State" placeholder="Enter state" />
            <Input label="Sector" placeholder="Enter business sector" />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Organizations;
