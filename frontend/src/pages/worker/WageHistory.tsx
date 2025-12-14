import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Building2,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye
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
  Spinner,
  EmptyState,
  CustomAreaChart
} from '@/components/common';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { CHART_COLORS } from '@/utils/constants';
import type { Column } from '@/components/common/Table';

interface WageRecord {
  id: string;
  employer: string;
  employerId: string;
  amount: number;
  date: string;
  status: 'verified' | 'pending' | 'disputed';
  paymentMethod: string;
  workType: string;
  hours?: number;
  transactionHash: string;
  blockNumber: number;
}

// Mock data
const mockWageRecords: WageRecord[] = [
  {
    id: '1',
    employer: 'ABC Construction Pvt Ltd',
    employerId: 'EMP001',
    amount: 12500,
    date: '2024-06-15T10:30:00Z',
    status: 'verified',
    paymentMethod: 'Bank Transfer',
    workType: 'Daily Wage',
    hours: 8,
    transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
    blockNumber: 12345,
  },
  {
    id: '2',
    employer: 'XYZ Industries',
    employerId: 'EMP002',
    amount: 8500,
    date: '2024-06-01T14:00:00Z',
    status: 'verified',
    paymentMethod: 'Cash',
    workType: 'Contract',
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef12',
    blockNumber: 12340,
  },
  {
    id: '3',
    employer: 'ABC Construction Pvt Ltd',
    employerId: 'EMP001',
    amount: 11000,
    date: '2024-05-15T09:00:00Z',
    status: 'verified',
    paymentMethod: 'Bank Transfer',
    workType: 'Daily Wage',
    hours: 8,
    transactionHash: '0x9876543210fedcba9876543210fedcba98765432',
    blockNumber: 12300,
  },
  {
    id: '4',
    employer: 'Daily Labor Pool',
    employerId: 'EMP003',
    amount: 5500,
    date: '2024-05-10T08:00:00Z',
    status: 'pending',
    paymentMethod: 'Cash',
    workType: 'Daily Wage',
    hours: 6,
    transactionHash: '0xfedcba9876543210fedcba9876543210fedcba98',
    blockNumber: 12290,
  },
  {
    id: '5',
    employer: 'Green Farms',
    employerId: 'EMP004',
    amount: 7000,
    date: '2024-05-01T07:00:00Z',
    status: 'disputed',
    paymentMethod: 'UPI',
    workType: 'Seasonal',
    transactionHash: '0x1111222233334444555566667777888899990000',
    blockNumber: 12280,
  },
];

const monthlyData = [
  { month: 'Jan', amount: 35000 },
  { month: 'Feb', amount: 42000 },
  { month: 'Mar', amount: 38000 },
  { month: 'Apr', amount: 45000 },
  { month: 'May', amount: 41500 },
  { month: 'Jun', amount: 21000 },
];

const WageHistory: React.FC = () => {
  const [records, setRecords] = useState<WageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<WageRecord | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecords(mockWageRecords);
      setIsLoading(false);
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.employer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalEarnings = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  const verifiedCount = filteredRecords.filter(r => r.status === 'verified').length;
  const pendingCount = filteredRecords.filter(r => r.status === 'pending').length;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'verified', label: 'Verified' },
    { value: 'pending', label: 'Pending' },
    { value: 'disputed', label: 'Disputed' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' },
  ];

  const columns: Column<WageRecord>[] = [
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (record) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>{formatDate(record.date)}</span>
        </div>
      ),
    },
    {
      key: 'employer',
      header: 'Employer',
      sortable: true,
      render: (record) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{record.employer}</p>
            <p className="text-xs text-gray-500">{record.workType}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (record) => (
        <div className="flex items-center gap-1">
          <IndianRupee className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{formatCurrency(record.amount)}</span>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (record) => <span className="text-gray-600">{record.paymentMethod}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (record) => {
        const statusConfig = {
          verified: { icon: CheckCircle, color: 'success' as const, label: 'Verified' },
          pending: { icon: Clock, color: 'warning' as const, label: 'Pending' },
          disputed: { icon: AlertTriangle, color: 'error' as const, label: 'Disputed' },
        };
        const config = statusConfig[record.status];
        const Icon = config.icon;
        return (
          <Badge variant={config.color} className="flex items-center gap-1 w-fit">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (record) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedRecord(record)}
        >
          <Eye className="h-4 w-4" />
        </Button>
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
          <h1 className="text-2xl font-bold text-gray-900">Wage History</h1>
          <p className="text-gray-500 mt-1">View and track all your wage records</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Records
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEarnings)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary-100">
                <IndianRupee className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Verified Records</p>
                <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Verification</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Earnings Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomAreaChart
            data={monthlyData.map(d => ({ name: d.month, amount: d.amount }))}
            areas={[{ dataKey: 'amount', color: CHART_COLORS.array[0], name: 'Earnings' }]}
            xAxisKey="name"
            height={200}
            showLegend={false}
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by employer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              className="w-full md:w-40"
            />
            <Select
              options={dateRangeOptions}
              value={dateRange}
              onChange={(value) => setDateRange(value)}
              className="w-full md:w-40"
            />
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No wage records found"
              description="Try adjusting your filters or search query"
            />
          ) : (
            <Table
              data={filteredRecords}
              columns={columns}
              keyField="id"
            />
          )}
        </CardContent>
      </Card>

      {/* Record Detail Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Wage Record Details"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Employer</p>
                <p className="font-medium text-gray-900">{selectedRecord.employer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-gray-900">{formatCurrency(selectedRecord.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium text-gray-900">{formatDateTime(selectedRecord.date)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900">{selectedRecord.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Work Type</p>
                <p className="font-medium text-gray-900">{selectedRecord.workType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={selectedRecord.status === 'verified' ? 'success' : selectedRecord.status === 'pending' ? 'warning' : 'error'}>
                  {selectedRecord.status}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Blockchain Details</h4>
              <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Transaction Hash</p>
                  <p className="text-sm font-mono text-gray-700 break-all">{selectedRecord.transactionHash}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Block Number</p>
                  <p className="text-sm font-mono text-gray-700">{selectedRecord.blockNumber}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                Close
              </Button>
              {selectedRecord.status === 'disputed' && (
                <Button variant="danger">
                  Raise Dispute
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WageHistory;
