import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Users,
  User,
  Mail,
  Phone,
  CreditCard,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Input,
  Select,
  Table,
  Badge,
  Modal,
  Avatar,
  Spinner,
  EmptyState,
  ConfirmDialog
} from '@/components/common';
import { showToast } from '@/components/common';
import { formatCurrency, formatDate, maskAadhaar } from '@/utils/formatters';
import type { Column } from '@/components/common/Table';

interface Worker {
  id: string;
  name: string;
  email: string;
  phone: string;
  aadhaarNumber: string;
  status: 'active' | 'inactive';
  joinDate: string;
  totalPaid: number;
  lastPayment: string;
  workType: string;
}

const mockWorkers: Worker[] = [
  {
    id: 'W001',
    name: 'Rajesh Kumar',
    email: 'rajesh@email.com',
    phone: '9876543210',
    aadhaarNumber: '123456789012',
    status: 'active',
    joinDate: '2023-01-15',
    totalPaid: 150000,
    lastPayment: '2024-06-15',
    workType: 'Full-time',
  },
  {
    id: 'W002',
    name: 'Priya Sharma',
    email: 'priya@email.com',
    phone: '9876543211',
    aadhaarNumber: '234567890123',
    status: 'active',
    joinDate: '2023-03-20',
    totalPaid: 120000,
    lastPayment: '2024-06-15',
    workType: 'Part-time',
  },
  {
    id: 'W003',
    name: 'Mohammed Ali',
    email: 'ali@email.com',
    phone: '9876543212',
    aadhaarNumber: '345678901234',
    status: 'inactive',
    joinDate: '2022-11-10',
    totalPaid: 85000,
    lastPayment: '2024-05-20',
    workType: 'Contract',
  },
  {
    id: 'W004',
    name: 'Lakshmi Devi',
    email: 'lakshmi@email.com',
    phone: '9876543213',
    aadhaarNumber: '456789012345',
    status: 'active',
    joinDate: '2023-06-01',
    totalPaid: 95000,
    lastPayment: '2024-06-14',
    workType: 'Daily Wage',
  },
];

const Workers: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchWorkers = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWorkers(mockWorkers);
      setIsLoading(false);
    };
    fetchWorkers();
  }, []);

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || worker.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteWorker = async () => {
    if (!workerToDelete) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWorkers(workers.filter(w => w.id !== workerToDelete.id));
      showToast.success('Worker removed successfully');
    } catch (error) {
      showToast.error('Failed to remove worker');
    } finally {
      setShowDeleteConfirm(false);
      setWorkerToDelete(null);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  const columns: Column<Worker>[] = [
    {
      key: 'name',
      header: 'Worker',
      sortable: true,
      render: (worker) => (
        <div className="flex items-center gap-3">
          <Avatar name={worker.name} size="sm" />
          <div>
            <p className="font-medium text-gray-900">{worker.name}</p>
            <p className="text-xs text-gray-500">{worker.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (worker) => (
        <div className="text-sm">
          <p className="text-gray-900">{worker.email}</p>
          <p className="text-gray-500">{worker.phone}</p>
        </div>
      ),
    },
    {
      key: 'workType',
      header: 'Type',
      render: (worker) => (
        <Badge variant="outline">{worker.workType}</Badge>
      ),
    },
    {
      key: 'totalPaid',
      header: 'Total Paid',
      sortable: true,
      render: (worker) => (
        <span className="font-medium text-gray-900">{formatCurrency(worker.totalPaid)}</span>
      ),
    },
    {
      key: 'lastPayment',
      header: 'Last Payment',
      render: (worker) => formatDate(worker.lastPayment),
    },
    {
      key: 'status',
      header: 'Status',
      render: (worker) => (
        <Badge variant={worker.status === 'active' ? 'success' : 'default'}>
          {worker.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (worker) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedWorker(worker)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setWorkerToDelete(worker);
              setShowDeleteConfirm(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Workers</h1>
          <p className="text-gray-500 mt-1">Manage your workforce</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Worker
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Workers</p>
                <p className="text-2xl font-bold text-gray-900">{workers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {workers.filter(w => w.status === 'active').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">
                  {workers.filter(w => w.status === 'inactive').length}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(workers.reduce((sum, w) => sum + w.totalPaid, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-40"
            />
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workers Table */}
      <Card>
        <CardContent className="p-0">
          {filteredWorkers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No workers found"
              description="Add workers or adjust your filters"
              action={
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Worker
                </Button>
              }
            />
          ) : (
            <Table
              data={filteredWorkers}
              columns={columns}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredWorkers.length}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Worker Detail Modal */}
      <Modal
        isOpen={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
        title="Worker Details"
        size="lg"
      >
        {selectedWorker && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedWorker.name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedWorker.name}</h3>
                <p className="text-gray-500">{selectedWorker.id}</p>
                <Badge variant={selectedWorker.status === 'active' ? 'success' : 'default'} className="mt-1">
                  {selectedWorker.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{selectedWorker.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{selectedWorker.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Aadhaar</p>
                  <p className="text-sm font-medium text-gray-900">{maskAadhaar(selectedWorker.aadhaarNumber)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Work Type</p>
                  <p className="text-sm font-medium text-gray-900">{selectedWorker.workType}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary-600">{formatCurrency(selectedWorker.totalPaid)}</p>
                  <p className="text-sm text-gray-500">Total Paid</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{formatDate(selectedWorker.joinDate)}</p>
                  <p className="text-sm text-gray-500">Join Date</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">{formatDate(selectedWorker.lastPayment)}</p>
                  <p className="text-sm text-gray-500">Last Payment</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedWorker(null)}>
                Close
              </Button>
              <Button>
                Record Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Worker Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Worker"
      >
        <form className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter worker's full name"
            leftIcon={<User className="h-5 w-5" />}
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            leftIcon={<Mail className="h-5 w-5" />}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="Enter phone number"
            leftIcon={<Phone className="h-5 w-5" />}
          />
          <Input
            label="Aadhaar Number"
            placeholder="XXXX XXXX XXXX"
            leftIcon={<CreditCard className="h-5 w-5" />}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Worker
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorker}
        title="Remove Worker"
        message={`Are you sure you want to remove ${workerToDelete?.name}? This action cannot be undone.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
};

export default Workers;
