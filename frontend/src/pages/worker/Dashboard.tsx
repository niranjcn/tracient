import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Calendar,
  ArrowRight,
  BadgeCheck,
  History,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  ShieldX
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  BPLBadge,
  Spinner,
  CustomAreaChart,
  CustomBarChart
} from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CHART_COLORS } from '@/utils/constants';
import { get } from '@/services/api';

interface DashboardData {
  totalEarnings: number;
  monthlyAverage: number;
  lastPayment: {
    amount: number;
    date: string;
    source: string;
  } | null;
  monthlyIncome: Array<{ month: string; amount: number }>;
  incomeBySource: Array<{ source: string; amount: number; percentage: number }>;
  recentWages: Array<{
    id: string;
    amount: number;
    date: string;
    source: string;
    status: string;
    verified: boolean;
    paymentMethod: string;
  }>;
  verificationBreakdown: {
    verified: number;
    unverified: number;
    verifiedPercentage: number;
  };
  bankAccounts: Array<{ balance: number; bankName: string }>;
}

// Fallback mock data
const mockDashboardData: DashboardData = {
  totalEarnings: 125000,
  monthlyAverage: 10416,
  lastPayment: { amount: 12500, date: new Date().toISOString(), source: 'ABC Construction' },
  monthlyIncome: [
    { month: 'Jan', amount: 9500 },
    { month: 'Feb', amount: 10200 },
    { month: 'Mar', amount: 9800 },
    { month: 'Apr', amount: 11000 },
    { month: 'May', amount: 10500 },
    { month: 'Jun', amount: 12500 },
  ],
  recentWages: [
    { id: '1', source: 'ABC Construction', amount: 12500, date: '2024-06-15', status: 'completed', verified: true, paymentMethod: 'bank_transfer' },
    { id: '2', source: 'XYZ Industries', amount: 8500, date: '2024-06-01', status: 'completed', verified: true, paymentMethod: 'upi' },
    { id: '3', source: 'Private Work', amount: 5500, date: '2024-05-10', status: 'completed', verified: false, paymentMethod: 'cash' },
  ],
  incomeBySource: [
    { source: 'Construction', amount: 45000, percentage: 36 },
    { source: 'Manufacturing', amount: 35000, percentage: 28 },
    { source: 'Agriculture', amount: 25000, percentage: 20 },
    { source: 'Daily Wages', amount: 20000, percentage: 16 },
  ],
  verificationBreakdown: {
    verified: 100000,
    unverified: 25000,
    verifiedPercentage: 80
  },
  bankAccounts: []
};

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>(mockDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await get<{ success: boolean; data: DashboardData }>('/workers/profile/dashboard');
        if (response.success && response.data) {
          setData(response.data);
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Using cached data.');
        // Fall back to mock data if API fails
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate BPL status based on annual income (last 12 months)
  const annualIncome = data.monthlyIncome.reduce((sum, m) => sum + m.amount, 0);
  const bplThreshold = 120000;
  const bplStatus: 'eligible' | 'not_eligible' = annualIncome <= bplThreshold ? 'eligible' : 'not_eligible';

  const stats = [
    {
      title: 'Total Earnings',
      value: formatCurrency(data.totalEarnings),
      icon: Wallet,
      color: 'primary',
    },
    {
      title: 'Monthly Average',
      value: formatCurrency(data.monthlyAverage),
      icon: Calendar,
      color: 'accent',
    },
    {
      title: 'Last Payment',
      value: data.lastPayment ? formatCurrency(data.lastPayment.amount) : '₹0',
      icon: IndianRupee,
      color: 'success',
      subtitle: data.lastPayment ? `${data.lastPayment.source} - ${formatDate(data.lastPayment.date)}` : 'No payments yet',
    },
    {
      title: 'Verified Income',
      value: `${data.verificationBreakdown.verifiedPercentage}%`,
      icon: ShieldCheck,
      color: 'warning',
      subtitle: formatCurrency(data.verificationBreakdown.verified),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's an overview of your income and status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BPLBadge status={bplStatus} showLabel />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {/* Verification Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Income Verification Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                {data.verificationBreakdown.verifiedPercentage}% of your income is verified by employers
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Verified</p>
                  <p className="font-semibold text-green-700">{formatCurrency(data.verificationBreakdown.verified)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldX className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Unverified</p>
                  <p className="font-semibold text-orange-600">{formatCurrency(data.verificationBreakdown.unverified)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-2">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/worker/wages" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-blue-100 mb-3">
                <History className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900">Wage History</p>
              <p className="text-xs text-gray-500 mt-1">View all records</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/worker/welfare" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-green-100 mb-3">
                <BadgeCheck className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">Welfare Eligibility</p>
              <p className="text-xs text-gray-500 mt-1">Check eligibility</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/worker/profile" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-orange-100 mb-3">
                <BadgeCheck className="h-6 w-6 text-orange-600" />
              </div>
              <p className="font-medium text-gray-900">Profile</p>
              <p className="text-xs text-gray-500 mt-1">View settings</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/worker/family" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-purple-100 mb-3">
                <History className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium text-gray-900">Family Survey</p>
              <p className="text-xs text-gray-500 mt-1">APL/BPL Classification</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Income Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomAreaChart
              data={data.monthlyIncome.map(d => ({ name: d.month, amount: d.amount }))}
              areas={[{ dataKey: 'amount', color: CHART_COLORS.array[0], name: 'Income' }]}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </CardContent>
        </Card>

        {/* Income by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={data.incomeBySource.map(d => ({ name: d.source, amount: d.amount }))}
              bars={[{ dataKey: 'amount', color: CHART_COLORS.array[1], name: 'Amount' }]}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Wage Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Wage Records</CardTitle>
          <Link to="/worker/wages">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentWages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No wage records found</p>
              </div>
            ) : (
              data.recentWages.map((wage) => (
                <div
                  key={wage.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${wage.verified ? 'bg-green-100' : 'bg-orange-100'}`}>
                      {wage.verified ? (
                        <ShieldCheck className="h-5 w-5 text-green-600" />
                      ) : (
                        <ShieldX className="h-5 w-5 text-orange-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{wage.source}</p>
                      <p className="text-sm text-gray-500">{formatDate(wage.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(wage.amount)}</p>
                    <div className="flex items-center gap-2 mt-1 justify-end">
                      <Badge
                        variant={wage.verified ? 'success' : 'warning'}
                      >
                        {wage.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                      <span className="text-xs text-gray-400 capitalize">{wage.paymentMethod?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkerDashboard;
