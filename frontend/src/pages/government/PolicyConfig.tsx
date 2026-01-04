import React, { useState, useEffect } from 'react';
import { 
  Save,
  AlertCircle,
  Users,
  Info,
  Edit2
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
  Alert,
  Tabs
} from '@/components/common';
import { formatDate } from '@/utils/formatters';

interface PolicyConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  currentValue: string;
  unit: string;
  lastUpdated: string;
  updatedBy: string;
  status: 'active' | 'pending' | 'deprecated';
}

interface PolicyHistory {
  id: string;
  policyId: string;
  policyName: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
  reason: string;
}

const mockPolicies: PolicyConfig[] = [
  {
    id: 'POL001',
    name: 'BPL Annual Income Threshold',
    description: 'Maximum annual household income to qualify for BPL status',
    category: 'BPL Eligibility',
    currentValue: '120000',
    unit: '₹/year',
    lastUpdated: '2024-01-01T00:00:00',
    updatedBy: 'Admin User',
    status: 'active',
  },
  {
    id: 'POL002',
    name: 'Minimum Wage - Unskilled',
    description: 'Minimum daily wage for unskilled workers',
    category: 'Wage Regulation',
    currentValue: '548',
    unit: '₹/day',
    lastUpdated: '2024-01-01T00:00:00',
    updatedBy: 'Admin User',
    status: 'active',
  },
  {
    id: 'POL003',
    name: 'Minimum Wage - Semi-skilled',
    description: 'Minimum daily wage for semi-skilled workers',
    category: 'Wage Regulation',
    currentValue: '659',
    unit: '₹/day',
    lastUpdated: '2024-01-01T00:00:00',
    updatedBy: 'Admin User',
    status: 'active',
  },
  {
    id: 'POL004',
    name: 'Minimum Wage - Skilled',
    description: 'Minimum daily wage for skilled workers',
    category: 'Wage Regulation',
    currentValue: '760',
    unit: '₹/day',
    lastUpdated: '2024-01-01T00:00:00',
    updatedBy: 'Admin User',
    status: 'active',
  },
  {
    id: 'POL005',
    name: 'Family Size Multiplier',
    description: 'Income adjustment factor per additional family member',
    category: 'BPL Eligibility',
    currentValue: '0.15',
    unit: 'factor',
    lastUpdated: '2023-10-15T00:00:00',
    updatedBy: 'Policy Admin',
    status: 'active',
  },
  {
    id: 'POL006',
    name: 'Anomaly Detection Threshold',
    description: 'Percentage deviation from average to trigger anomaly alert',
    category: 'System',
    currentValue: '50',
    unit: '%',
    lastUpdated: '2023-11-20T00:00:00',
    updatedBy: 'System Admin',
    status: 'active',
  },
  {
    id: 'POL007',
    name: 'Income Verification Period',
    description: 'Number of months of income history to consider for BPL calculation',
    category: 'BPL Eligibility',
    currentValue: '12',
    unit: 'months',
    lastUpdated: '2023-09-01T00:00:00',
    updatedBy: 'Policy Admin',
    status: 'active',
  },
  {
    id: 'POL008',
    name: 'Max Working Hours per Week',
    description: 'Maximum allowed working hours per week',
    category: 'Wage Regulation',
    currentValue: '48',
    unit: 'hours',
    lastUpdated: '2023-06-01T00:00:00',
    updatedBy: 'Labor Ministry',
    status: 'active',
  },
];

const mockHistory: PolicyHistory[] = [
  {
    id: 'H001',
    policyId: 'POL001',
    policyName: 'BPL Annual Income Threshold',
    oldValue: '100000',
    newValue: '120000',
    changedBy: 'Admin User',
    changedAt: '2024-01-01T00:00:00',
    reason: 'Annual revision based on inflation adjustment',
  },
  {
    id: 'H002',
    policyId: 'POL002',
    policyName: 'Minimum Wage - Unskilled',
    oldValue: '520',
    newValue: '548',
    changedBy: 'Admin User',
    changedAt: '2024-01-01T00:00:00',
    reason: 'Revised as per Minimum Wages Act notification',
  },
  {
    id: 'H003',
    policyId: 'POL006',
    policyName: 'Anomaly Detection Threshold',
    oldValue: '40',
    newValue: '50',
    changedBy: 'System Admin',
    changedAt: '2023-11-20T00:00:00',
    reason: 'Adjusted to reduce false positive alerts',
  },
];

const PolicyConfiguration: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyConfig[]>([]);
  const [history, setHistory] = useState<PolicyHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('policies');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyConfig | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPolicies(mockPolicies);
      setHistory(mockHistory);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleEditPolicy = (policy: PolicyConfig) => {
    setSelectedPolicy(policy);
    setEditValue(policy.currentValue);
    setEditReason('');
  };

  const handleSavePolicy = async () => {
    if (!selectedPolicy || !editReason.trim()) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update policy
    setPolicies(prev =>
      prev.map(p =>
        p.id === selectedPolicy.id
          ? { ...p, currentValue: editValue, lastUpdated: new Date().toISOString(), updatedBy: 'Current User' }
          : p
      )
    );

    // Add to history
    setHistory(prev => [
      {
        id: `H${Date.now()}`,
        policyId: selectedPolicy.id,
        policyName: selectedPolicy.name,
        oldValue: selectedPolicy.currentValue,
        newValue: editValue,
        changedBy: 'Current User',
        changedAt: new Date().toISOString(),
        reason: editReason,
      },
      ...prev,
    ]);

    setIsSubmitting(false);
    setSelectedPolicy(null);
  };

  const categories = ['all', ...new Set(policies.map(p => p.category))];
  const categoryOptions = categories.map(c => ({
    value: c,
    label: c === 'all' ? 'All Categories' : c,
  }));

  const filteredPolicies = policies.filter(
    p => categoryFilter === 'all' || p.category === categoryFilter
  );

  const tabs = [
    { id: 'policies', label: 'Policy Settings' },
    { id: 'history', label: 'Change History' },
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
          <h1 className="text-2xl font-bold text-gray-900">Policy Configuration</h1>
          <p className="text-gray-500 mt-1">Manage BPL thresholds and system parameters</p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert variant="info">
        <Info className="h-4 w-4" />
        <span>
          Changes to policy configurations will affect BPL eligibility calculations across the system.
          All changes are recorded in the blockchain for audit purposes.
        </span>
      </Alert>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex justify-end">
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={setCategoryFilter}
              className="w-48"
            />
          </div>

          {/* Policy Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {filteredPolicies.map((policy) => (
              <Card key={policy.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{policy.description}</p>
                    </div>
                    <Badge variant={policy.status === 'active' ? 'success' : 'warning'}>
                      {policy.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-primary-50 rounded-lg">
                      <p className="text-2xl font-bold text-primary-700">
                        {policy.unit.includes('₹') ? '₹' : ''}{Number(policy.currentValue).toLocaleString()}
                        <span className="text-sm font-normal ml-1">
                          {policy.unit.replace('₹', '')}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPolicy(policy)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Category: {policy.category}</span>
                    <span>Updated: {formatDate(policy.lastUpdated)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle>Policy Change History</CardTitle>
            <CardDescription>Track all modifications to policy configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{record.policyName}</h4>
                    <span className="text-sm text-gray-500">
                      {formatDate(record.changedAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                        {record.oldValue}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        {record.newValue}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{record.reason}</p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="h-3 w-3" />
                    <span>Changed by: {record.changedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Policy Modal */}
      <Modal
        isOpen={!!selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
        title="Edit Policy Configuration"
      >
        {selectedPolicy && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">{selectedPolicy.name}</h3>
              <p className="text-sm text-gray-500">{selectedPolicy.description}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Current Value</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedPolicy.currentValue} {selectedPolicy.unit}
              </p>
            </div>

            <Input
              label="New Value"
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter new value"
              helperText={`Unit: ${selectedPolicy.unit}`}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Change *
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Provide justification for this change"
              />
            </div>

            <Alert variant="warning">
              <AlertCircle className="h-4 w-4" />
              <span>This change will be recorded on the blockchain and cannot be undone.</span>
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSelectedPolicy(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSavePolicy}
                disabled={!editReason.trim() || isSubmitting}
                isLoading={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PolicyConfiguration;
