import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search,
  Download,
  RefreshCw,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Eye
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
  Table
} from '@/components/common';
import { formatDate } from '@/utils/formatters';

interface AuditLog {
  id: string;
  transactionId: string;
  blockNumber: number;
  timestamp: string;
  eventType: 'wage_recorded' | 'worker_registered' | 'employer_registered' | 'bpl_status_updated' | 'anomaly_flagged' | 'policy_updated';
  performedBy: {
    id: string;
    name: string;
    role: string;
  };
  target: {
    id: string;
    name: string;
    type: string;
  };
  details: Record<string, any>;
  status: 'success' | 'failed' | 'pending';
  ipAddress: string;
  userAgent: string;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: 'LOG001',
    transactionId: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    blockNumber: 1245678,
    timestamp: '2024-01-15T14:30:25',
    eventType: 'wage_recorded',
    performedBy: { id: 'E001', name: 'ABC Construction', role: 'Employer' },
    target: { id: 'W001', name: 'Rajesh Kumar', type: 'Worker' },
    details: { amount: 45000, wageType: 'monthly', period: 'January 2024' },
    status: 'success',
    ipAddress: '192.168.1.100',
    userAgent: 'Chrome/120.0 Windows',
  },
  {
    id: 'LOG002',
    transactionId: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a',
    blockNumber: 1245677,
    timestamp: '2024-01-15T14:15:10',
    eventType: 'worker_registered',
    performedBy: { id: 'E005', name: 'Tech Solutions', role: 'Employer' },
    target: { id: 'W156', name: 'Priya Sharma', type: 'Worker' },
    details: { aadhaar: 'XXXX-XXXX-4567', sector: 'IT Services' },
    status: 'success',
    ipAddress: '192.168.2.50',
    userAgent: 'Firefox/121.0 Windows',
  },
  {
    id: 'LOG003',
    transactionId: '0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    blockNumber: 1245676,
    timestamp: '2024-01-15T13:45:00',
    eventType: 'bpl_status_updated',
    performedBy: { id: 'SYS', name: 'Automated System', role: 'System' },
    target: { id: 'W089', name: 'Sunita Devi', type: 'Worker' },
    details: { previousStatus: 'BPL', newStatus: 'APL', reason: 'Income threshold exceeded' },
    status: 'success',
    ipAddress: 'System',
    userAgent: 'TRACIENT/1.0 Automated',
  },
  {
    id: 'LOG004',
    transactionId: '0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    blockNumber: 1245675,
    timestamp: '2024-01-15T12:30:00',
    eventType: 'anomaly_flagged',
    performedBy: { id: 'AI', name: 'AI Detection System', role: 'System' },
    target: { id: 'TXN001', name: 'Duplicate Payment Alert', type: 'Transaction' },
    details: { severity: 'critical', confidence: 98, type: 'duplicate_payment' },
    status: 'success',
    ipAddress: 'System',
    userAgent: 'TRACIENT/1.0 AI Module',
  },
  {
    id: 'LOG005',
    transactionId: '0x1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    blockNumber: 1245674,
    timestamp: '2024-01-15T11:00:00',
    eventType: 'policy_updated',
    performedBy: { id: 'G001', name: 'Admin User', role: 'Government Admin' },
    target: { id: 'POL001', name: 'BPL Threshold', type: 'Policy' },
    details: { oldValue: '100000', newValue: '120000', reason: 'Annual revision' },
    status: 'success',
    ipAddress: '10.0.0.15',
    userAgent: 'Chrome/120.0 Windows',
  },
  {
    id: 'LOG006',
    transactionId: '0x2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    blockNumber: 1245673,
    timestamp: '2024-01-15T10:15:30',
    eventType: 'employer_registered',
    performedBy: { id: 'ADM', name: 'System Admin', role: 'Admin' },
    target: { id: 'E025', name: 'Green Energy Ltd', type: 'Employer' },
    details: { gstin: '29AABCU9603R1ZX', sector: 'Energy', employeeCount: 150 },
    status: 'success',
    ipAddress: '10.0.0.10',
    userAgent: 'Edge/120.0 Windows',
  },
  {
    id: 'LOG007',
    transactionId: '0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    blockNumber: 1245672,
    timestamp: '2024-01-15T09:30:00',
    eventType: 'wage_recorded',
    performedBy: { id: 'E012', name: 'Green Farms', role: 'Employer' },
    target: { id: 'W045', name: 'Amit Singh', type: 'Worker' },
    details: { amount: 18000, wageType: 'monthly', period: 'January 2024' },
    status: 'failed',
    ipAddress: '192.168.5.200',
    userAgent: 'Chrome/120.0 Android',
  },
];

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLogs(mockAuditLogs);
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const eventTypeOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'wage_recorded', label: 'Wage Recorded' },
    { value: 'worker_registered', label: 'Worker Registered' },
    { value: 'employer_registered', label: 'Employer Registered' },
    { value: 'bpl_status_updated', label: 'BPL Status Updated' },
    { value: 'anomaly_flagged', label: 'Anomaly Flagged' },
    { value: 'policy_updated', label: 'Policy Updated' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
    { value: 'pending', label: 'Pending' },
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const getEventTypeLabel = (type: AuditLog['eventType']) => {
    const labels = {
      wage_recorded: 'Wage Recorded',
      worker_registered: 'Worker Registered',
      employer_registered: 'Employer Registered',
      bpl_status_updated: 'BPL Status Updated',
      anomaly_flagged: 'Anomaly Flagged',
      policy_updated: 'Policy Updated',
    };
    return labels[type];
  };

  const getEventTypeBadge = (type: AuditLog['eventType']) => {
    const config = {
      wage_recorded: { variant: 'success' as const, icon: IndianRupee },
      worker_registered: { variant: 'primary' as const, icon: User },
      employer_registered: { variant: 'primary' as const, icon: Building2 },
      bpl_status_updated: { variant: 'warning' as const, icon: CheckCircle2 },
      anomaly_flagged: { variant: 'error' as const, icon: XCircle },
      policy_updated: { variant: 'default' as const, icon: FileText },
    };
    return config[type];
  };

  const getStatusBadge = (status: AuditLog['status']) => {
    const config = {
      success: { variant: 'success' as const, label: 'Success' },
      failed: { variant: 'error' as const, label: 'Failed' },
      pending: { variant: 'warning' as const, label: 'Pending' },
    };
    return config[status];
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.performedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEventType = eventTypeFilter === 'all' || log.eventType === eventTypeFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesEventType && matchesStatus;
  });

  const columns = [
    {
      key: 'eventType',
      header: 'Event',
      render: (log: AuditLog) => {
        const badge = getEventTypeBadge(log.eventType);
        const Icon = badge.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <span className="font-medium">{getEventTypeLabel(log.eventType)}</span>
          </div>
        );
      },
    },
    {
      key: 'performedBy',
      header: 'Performed By',
      render: (log: AuditLog) => (
        <div>
          <p className="font-medium text-gray-900">{log.performedBy.name}</p>
          <p className="text-xs text-gray-500">{log.performedBy.role}</p>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      render: (log: AuditLog) => (
        <div>
          <p className="font-medium text-gray-900">{log.target.name}</p>
          <p className="text-xs text-gray-500">{log.target.type}</p>
        </div>
      ),
    },
    {
      key: 'blockNumber',
      header: 'Block #',
      render: (log: AuditLog) => (
        <span className="font-mono text-sm">{log.blockNumber.toLocaleString()}</span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log: AuditLog) => (
        <span className="text-sm text-gray-500">{formatDate(log.timestamp)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (log: AuditLog) => {
        const status = getStatusBadge(log.status);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (log: AuditLog) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
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
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Blockchain transaction history and system events</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
            <p className="text-sm text-gray-500">Total Events</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {logs.filter(l => l.status === 'success').length}
            </p>
            <p className="text-sm text-gray-500">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {logs.filter(l => l.status === 'failed').length}
            </p>
            <p className="text-sm text-gray-500">Failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {logs[0]?.blockNumber.toLocaleString() || 0}
            </p>
            <p className="text-sm text-gray-500">Latest Block</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by transaction ID, performer, or target..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={eventTypeOptions}
              value={eventTypeFilter}
              onChange={setEventTypeFilter}
              className="w-48"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-36"
            />
            <Select
              options={dateRangeOptions}
              value={dateRange}
              onChange={setDateRange}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredLogs}
            keyField="id"
            emptyMessage="No audit logs found matching your criteria"
          />
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Badge variant={getEventTypeBadge(selectedLog.eventType).variant}>
                {getEventTypeLabel(selectedLog.eventType)}
              </Badge>
              <Badge variant={getStatusBadge(selectedLog.status).variant}>
                {getStatusBadge(selectedLog.status).label}
              </Badge>
            </div>

            {/* Transaction Info */}
            <div className="p-4 bg-gray-900 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Transaction Hash</p>
              <p className="text-sm font-mono text-green-400 break-all">
                {selectedLog.transactionId}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Performed By</p>
                  <p className="font-medium text-gray-900">{selectedLog.performedBy.name}</p>
                  <p className="text-sm text-gray-500">{selectedLog.performedBy.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Target</p>
                  <p className="font-medium text-gray-900">{selectedLog.target.name}</p>
                  <p className="text-sm text-gray-500">{selectedLog.target.type}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Block Number</p>
                  <p className="font-medium text-gray-900">{selectedLog.blockNumber.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Timestamp</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div>
              <p className="text-sm text-gray-500 mb-2">Event Details</p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            {/* Technical Info */}
            <div className="pt-4 border-t space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>IP Address</span>
                <span className="font-mono">{selectedLog.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span>User Agent</span>
                <span className="font-mono truncate max-w-xs">{selectedLog.userAgent}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
