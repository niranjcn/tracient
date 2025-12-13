import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Users,
  IndianRupee,
  Calendar,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
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
  StatCard
} from '@/components/common';
import { formatCurrency, formatDate, formatNumber } from '@/utils/formatters';

interface WelfareScheme {
  id: string;
  name: string;
  description: string;
  category: string;
  benefitType: 'cash' | 'subsidy' | 'service' | 'insurance';
  benefitAmount: number;
  eligibilityCriteria: string[];
  totalBudget: number;
  disbursed: number;
  beneficiariesCount: number;
  status: 'active' | 'paused' | 'upcoming' | 'expired';
  startDate: string;
  endDate: string;
  ministry: string;
}

const mockSchemes: WelfareScheme[] = [
  {
    id: 'SCH001',
    name: 'PM Kisan Samman Nidhi',
    description: 'Direct income support of ₹6,000 per year to small and marginal farmer families',
    category: 'Agriculture',
    benefitType: 'cash',
    benefitAmount: 6000,
    eligibilityCriteria: ['BPL Status', 'Land ownership < 2 hectares', 'Valid Aadhaar'],
    totalBudget: 75000000000,
    disbursed: 62500000000,
    beneficiariesCount: 12500000,
    status: 'active',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    ministry: 'Ministry of Agriculture',
  },
  {
    id: 'SCH002',
    name: 'MGNREGA',
    description: 'Guaranteed 100 days of wage employment per year to rural households',
    category: 'Employment',
    benefitType: 'cash',
    benefitAmount: 54800,
    eligibilityCriteria: ['Rural resident', 'BPL Status', 'Job card holder'],
    totalBudget: 90000000000,
    disbursed: 78000000000,
    beneficiariesCount: 8500000,
    status: 'active',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    ministry: 'Ministry of Rural Development',
  },
  {
    id: 'SCH003',
    name: 'Ayushman Bharat',
    description: 'Health insurance coverage up to ₹5 lakh per family per year',
    category: 'Health',
    benefitType: 'insurance',
    benefitAmount: 500000,
    eligibilityCriteria: ['BPL Status', 'No existing health insurance'],
    totalBudget: 65000000000,
    disbursed: 45000000000,
    beneficiariesCount: 18900000,
    status: 'active',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    ministry: 'Ministry of Health',
  },
  {
    id: 'SCH004',
    name: 'PM Awas Yojana',
    description: 'Assistance for construction of pucca houses for rural poor',
    category: 'Housing',
    benefitType: 'subsidy',
    benefitAmount: 120000,
    eligibilityCriteria: ['BPL Status', 'No pucca house', 'Rural resident'],
    totalBudget: 48000000000,
    disbursed: 32000000000,
    beneficiariesCount: 2800000,
    status: 'active',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    ministry: 'Ministry of Housing',
  },
  {
    id: 'SCH005',
    name: 'Mid-Day Meal Scheme',
    description: 'Free lunch on school days for children in government schools',
    category: 'Education',
    benefitType: 'service',
    benefitAmount: 4500,
    eligibilityCriteria: ['Enrolled in government school', 'Classes 1-8'],
    totalBudget: 12000000000,
    disbursed: 10800000000,
    beneficiariesCount: 95000000,
    status: 'active',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    ministry: 'Ministry of Education',
  },
  {
    id: 'SCH006',
    name: 'PM Ujjwala Yojana 2.0',
    description: 'Free LPG connections and subsidized refills for BPL households',
    category: 'Energy',
    benefitType: 'subsidy',
    benefitAmount: 1600,
    eligibilityCriteria: ['BPL Status', 'No existing LPG connection', 'Female head of household'],
    totalBudget: 8000000000,
    disbursed: 6500000000,
    beneficiariesCount: 4500000,
    status: 'paused',
    startDate: '2023-04-01',
    endDate: '2024-03-31',
    ministry: 'Ministry of Petroleum',
  },
];

const WelfareSchemes: React.FC = () => {
  const [schemes, setSchemes] = useState<WelfareScheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedScheme, setSelectedScheme] = useState<WelfareScheme | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchSchemes = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSchemes(mockSchemes);
      setIsLoading(false);
    };
    fetchSchemes();
  }, []);

  const categories = ['all', ...new Set(schemes.map(s => s.category))];
  const categoryOptions = categories.map(c => ({
    value: c,
    label: c === 'all' ? 'All Categories' : c,
  }));

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'expired', label: 'Expired' },
  ];

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = 
      scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || scheme.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || scheme.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: WelfareScheme['status']) => {
    const config = {
      active: { variant: 'success' as const, icon: CheckCircle2 },
      paused: { variant: 'warning' as const, icon: Clock },
      upcoming: { variant: 'accent' as const, icon: Calendar },
      expired: { variant: 'error' as const, icon: XCircle },
    };
    return config[status];
  };

  const getBenefitTypeBadge = (type: WelfareScheme['benefitType']) => {
    const labels = {
      cash: 'Cash Transfer',
      subsidy: 'Subsidy',
      service: 'Service',
      insurance: 'Insurance',
    };
    return labels[type];
  };

  const stats = {
    totalSchemes: schemes.length,
    activeSchemes: schemes.filter(s => s.status === 'active').length,
    totalBeneficiaries: schemes.reduce((sum, s) => sum + s.beneficiariesCount, 0),
    totalDisbursed: schemes.reduce((sum, s) => sum + s.disbursed, 0),
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
          <h1 className="text-2xl font-bold text-gray-900">Welfare Schemes</h1>
          <p className="text-gray-500 mt-1">Manage government welfare programs and benefits</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Scheme
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Schemes"
          value={stats.totalSchemes.toString()}
          icon={Heart}
          color="primary"
        />
        <StatCard
          title="Active Schemes"
          value={stats.activeSchemes.toString()}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Total Beneficiaries"
          value={formatNumber(stats.totalBeneficiaries)}
          icon={Users}
          color="accent"
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(stats.totalDisbursed)}
          icon={IndianRupee}
          color="warning"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search schemes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={categoryOptions}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-40"
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schemes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchemes.map((scheme) => {
          const status = getStatusBadge(scheme.status);
          const StatusIcon = status.icon;
          const utilizationRate = (scheme.disbursed / scheme.totalBudget) * 100;

          return (
            <Card key={scheme.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="primary">{scheme.category}</Badge>
                  <Badge variant={status.variant}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {scheme.status}
                  </Badge>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{scheme.name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{scheme.description}</p>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Benefit</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(scheme.benefitAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Beneficiaries</span>
                    <span className="font-medium">{formatNumber(scheme.beneficiariesCount)}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Budget Utilized</span>
                      <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          utilizationRate > 90 ? 'bg-red-500' :
                          utilizationRate > 70 ? 'bg-amber-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${utilizationRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedScheme(scheme)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scheme Detail Modal */}
      <Modal
        isOpen={!!selectedScheme}
        onClose={() => setSelectedScheme(null)}
        title="Scheme Details"
        size="lg"
      >
        {selectedScheme && (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="primary">{selectedScheme.category}</Badge>
                <Badge variant={getStatusBadge(selectedScheme.status).variant}>
                  {selectedScheme.status}
                </Badge>
                <Badge variant="default">{getBenefitTypeBadge(selectedScheme.benefitType)}</Badge>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{selectedScheme.name}</h3>
              <p className="text-gray-500 mt-1">{selectedScheme.description}</p>
            </div>

            {/* Key Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Benefit Amount</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(selectedScheme.benefitAmount)}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Total Beneficiaries</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatNumber(selectedScheme.beneficiariesCount)}
                </p>
              </div>
            </div>

            {/* Budget */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Budget Allocation</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Budget</span>
                  <span className="font-medium">{formatCurrency(selectedScheme.totalBudget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Disbursed</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedScheme.disbursed)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-medium">{formatCurrency(selectedScheme.totalBudget - selectedScheme.disbursed)}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(selectedScheme.disbursed / selectedScheme.totalBudget) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Eligibility Criteria */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Eligibility Criteria</h4>
              <ul className="space-y-2">
                {selectedScheme.eligibilityCriteria.map((criteria, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>

            {/* Period */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Start: {formatDate(selectedScheme.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>End: {formatDate(selectedScheme.endDate)}</span>
              </div>
            </div>

            {/* Ministry */}
            <div className="pt-4 border-t text-sm text-gray-500">
              Administered by: <span className="font-medium text-gray-700">{selectedScheme.ministry}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Scheme Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Welfare Scheme"
        size="lg"
      >
        <div className="space-y-4">
          <Input label="Scheme Name" placeholder="Enter scheme name" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
              placeholder="Enter scheme description"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Select
              label="Category"
              options={categoryOptions.filter(c => c.value !== 'all')}
            />
            <Select
              label="Benefit Type"
              options={[
                { value: 'cash', label: 'Cash Transfer' },
                { value: 'subsidy', label: 'Subsidy' },
                { value: 'service', label: 'Service' },
                { value: 'insurance', label: 'Insurance' },
              ]}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Benefit Amount (₹)" type="number" placeholder="Enter amount" />
            <Input label="Total Budget (₹)" type="number" placeholder="Enter budget" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" />
            <Input label="End Date" type="date" />
          </div>
          <Input label="Ministry" placeholder="Enter administering ministry" />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Scheme
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WelfareSchemes;
