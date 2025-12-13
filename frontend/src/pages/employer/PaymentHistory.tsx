import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download,
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  User,
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

interface PaymentRecord {
  id: string;
  worker: {
    id: string;
    name: string;
  };
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  workType: string;
  transactionHash: string;
  blockNumber: number;
}

const mockPayments: PaymentRecord[] = [
  {
    id: 'PAY001',
    worker: { id: 'W001', name: 'Rajesh Kumar' },
    amount: 12500,
    date: '2024-06-15T10:30:00Z',
    status: 'completed',
    paymentMethod: 'Bank Transfer',
    workType: 'Daily Wage',
    transactionHash: '0x1234567890abcdef',
    blockNumber: 12345,
  },
  {
    id: 'PAY002',
    worker: { id: 'W002', name: 'Priya Sharma' },
    amount: 8500,
    date: '2024-06-15T11:00:00Z',
    status: 'completed',
    paymentMethod: 'UPI',
    workType: 'Contract',
    transactionHash: '0xabcdef1234567890',
    blockNumber: 12346,
  },
  {
    id: 'PAY003',
    worker: { id: 'W003', name: 'Mohammed Ali' },
    amount: 15000,
    date: '2024-06-14T14:00:00Z',
    status: 'pending',
    paymentMethod: 'Bank Transfer',
    workType: 'Monthly',
    transactionHash: '0x9876543210fedcba',
    blockNumber: 12340,
  },
  {
    id: 'PAY004',
    worker: { id: 'W004', name: 'Lakshmi Devi' },
    amount: 9000,
    date: '2024-06-14T09:00:00Z',
    status: 'completed',
    paymentMethod: 'Cash',
    workType: 'Daily Wage',
    transactionHash: '0xfedcba9876543210',
    blockNumber: 12338,
  },
];

const monthlyPayments = [
  { month: 'Jan', amount: 750000 },
  { month: 'Feb', amount: 820000 },
  { month: 'Mar', amount: 780000 },
  { month: 'Apr', amount: 900000 },
  { month: 'May', amount: 850000 },
  { month: 'Jun', amount: 450000 },
];

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchPayments = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPayments(mockPayments);
      setIsLoading(false);
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.worker.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = filteredPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const completedCount = filteredPayments.filter(p => p.status === 'completed').length;
  const pendingCount = filteredPayments.filter(p => p.status === 'pending').length;

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  const columns: Column<PaymentRecord>[] = [
    {
      key: 'id',
      header: 'Payment ID',
      render: (payment) => (
        <span className="font-mono text-sm">{payment.id}</span>
      ),
    },
    {
      key: 'worker',
      header: 'Worker',
      render: (payment) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{payment.worker.name}</p>
            <p className="text-xs text-gray-500">{payment.worker.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (payment) => (
        <span className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (payment) => formatDate(payment.date),
    },
    {
      key: 'paymentMethod',
      header: 'Method',
      render: (payment) => payment.paymentMethod,
    },
    {
      key: 'status',
      header: 'Status',
      render: (payment) => (
        <Badge
          variant={payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'}
          className="flex items-center gap-1 w-fit"
        >
          {payment.status === 'completed' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {payment.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (payment) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedPayment(payment)}
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
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-500 mt-1">View all wage payments made to workers</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Payment Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomAreaChart
            data={monthlyPayments}
            xKey="month"
            yKey="amount"
            color={CHART_COLORS.primary}
            height={200}
            formatValue={(v) => formatCurrency(v)}
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by worker name..."
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
            <Select
              options={dateRangeOptions}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full md:w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No payments found"
              description="Adjust your filters or record a new payment"
            />
          ) : (
            <Table
              data={filteredPayments}
              columns={columns}
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredPayments.length}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedPayment.worker.name}</p>
                  <p className="text-sm text-gray-500">{selectedPayment.worker.id}</p>
                </div>
              </div>
              <Badge
                variant={selectedPayment.status === 'completed' ? 'success' : 'warning'}
                className="text-sm"
              >
                {selectedPayment.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Payment Date</p>
                <p className="text-lg font-medium text-gray-900">{formatDateTime(selectedPayment.date)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="text-lg font-medium text-gray-900">{selectedPayment.paymentMethod}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Work Type</p>
                <p className="text-lg font-medium text-gray-900">{selectedPayment.workType}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Blockchain Details</h4>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg text-sm">
                <div>
                  <p className="text-gray-500">Transaction Hash</p>
                  <p className="font-mono text-gray-900 break-all">{selectedPayment.transactionHash}</p>
                </div>
                <div>
                  <p className="text-gray-500">Block Number</p>
                  <p className="font-mono text-gray-900">{selectedPayment.blockNumber}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PaymentHistory;
