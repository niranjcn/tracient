import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  ArrowRight,
  BadgeCheck,
  Heart,
  History,
  AlertCircle,
  IndianRupee
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

// Mock data - replace with actual API calls
const mockDashboardData = {
  totalEarnings: 125000,
  monthlyAverage: 10416,
  lastPayment: 12500,
  lastPaymentDate: new Date().toISOString(),
  bplStatus: 'eligible' as const,
  annualIncome: 125000,
  pendingBenefits: 3,
  trend: 8.5,
  monthlyIncome: [
    { month: 'Jan', amount: 9500 },
    { month: 'Feb', amount: 10200 },
    { month: 'Mar', amount: 9800 },
    { month: 'Apr', amount: 11000 },
    { month: 'May', amount: 10500 },
    { month: 'Jun', amount: 12500 },
  ],
  recentWages: [
    { id: '1', employer: 'ABC Construction', amount: 12500, date: '2024-06-15', status: 'verified' },
    { id: '2', employer: 'XYZ Industries', amount: 8500, date: '2024-06-01', status: 'verified' },
    { id: '3', employer: 'ABC Construction', amount: 11000, date: '2024-05-15', status: 'verified' },
    { id: '4', employer: 'Daily Labor Pool', amount: 5500, date: '2024-05-10', status: 'pending' },
  ],
  incomeBySource: [
    { source: 'Construction', amount: 45000 },
    { source: 'Manufacturing', amount: 35000 },
    { source: 'Agriculture', amount: 25000 },
    { source: 'Daily Wages', amount: 20000 },
  ],
};

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState(mockDashboardData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(mockDashboardData);
      setIsLoading(false);
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

  const stats = [
    {
      title: 'Total Earnings',
      value: formatCurrency(data.totalEarnings),
      icon: Wallet,
      color: 'primary',
      trend: data.trend,
      trendLabel: 'vs last period',
    },
    {
      title: 'Monthly Average',
      value: formatCurrency(data.monthlyAverage),
      icon: Calendar,
      color: 'accent',
    },
    {
      title: 'Last Payment',
      value: formatCurrency(data.lastPayment),
      icon: IndianRupee,
      color: 'success',
      subtitle: formatDate(data.lastPaymentDate),
    },
    {
      title: 'Annual Income',
      value: formatCurrency(data.annualIncome),
      icon: TrendingUp,
      color: 'warning',
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
            Here's an overview of your income and benefits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BPLBadge status={data.bplStatus} showLabel />
        </div>
      </div>

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
                    {stat.trend && (
                      <div className="flex items-center gap-1 mt-2">
                        {stat.trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Math.abs(stat.trend)}%
                        </span>
                        <span className="text-xs text-gray-500">{stat.trendLabel}</span>
                      </div>
                    )}
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
        <Link to="/worker/bpl-status" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-green-100 mb-3">
                <BadgeCheck className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">BPL Status</p>
              <p className="text-xs text-gray-500 mt-1">Check eligibility</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/worker/benefits" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center relative">
              <div className="p-3 rounded-xl bg-purple-100 mb-3">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium text-gray-900">Benefits</p>
              <p className="text-xs text-gray-500 mt-1">View schemes</p>
              {data.pendingBenefits > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {data.pendingBenefits}
                </span>
              )}
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
            {data.recentWages.map((wage) => (
              <div
                key={wage.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{wage.employer}</p>
                    <p className="text-sm text-gray-500">{formatDate(wage.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(wage.amount)}</p>
                  <Badge
                    variant={wage.status === 'verified' ? 'success' : 'warning'}
                    className="mt-1"
                  >
                    {wage.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benefits Alert */}
      {data.pendingBenefits > 0 && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800">
                  You have {data.pendingBenefits} pending welfare benefits
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Review and claim your eligible benefits before they expire.
                </p>
              </div>
              <Link to="/worker/benefits">
                <Button size="sm" variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-100">
                  View Benefits
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkerDashboard;
