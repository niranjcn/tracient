import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  Upload,
  FileText,
  Plus,
  IndianRupee,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  Spinner,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart
} from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CHART_COLORS } from '@/utils/constants';

const mockDashboardData = {
  totalWorkers: 156,
  activeWorkers: 142,
  totalPayments: 4500000,
  currentMonthPayroll: 850000,
  pendingPayments: 12,
  pendingAmount: 125000,
  trend: 12.5,
  monthlyPayrollTrend: [
    { month: 'Jan', amount: 750000 },
    { month: 'Feb', amount: 820000 },
    { month: 'Mar', amount: 780000 },
    { month: 'Apr', amount: 900000 },
    { month: 'May', amount: 850000 },
    { month: 'Jun', amount: 880000 },
  ],
  paymentsByCategory: [
    { category: 'Daily Wage', amount: 2500000 },
    { category: 'Contract', amount: 1200000 },
    { category: 'Overtime', amount: 500000 },
    { category: 'Bonus', amount: 300000 },
  ],
  workerDistribution: [
    { name: 'Full-time', value: 85 },
    { name: 'Part-time', value: 45 },
    { name: 'Contract', value: 26 },
  ],
  recentPayments: [
    { id: '1', worker: 'Rajesh Kumar', amount: 12500, date: '2024-06-15', status: 'completed' },
    { id: '2', worker: 'Priya Sharma', amount: 8500, date: '2024-06-15', status: 'completed' },
    { id: '3', worker: 'Mohammed Ali', amount: 15000, date: '2024-06-14', status: 'pending' },
    { id: '4', worker: 'Lakshmi Devi', amount: 9000, date: '2024-06-14', status: 'completed' },
    { id: '5', worker: 'Suresh Babu', amount: 11000, date: '2024-06-13', status: 'pending' },
  ],
  upcomingPayments: [
    { id: '1', workers: 45, amount: 350000, dueDate: '2024-06-20' },
    { id: '2', workers: 32, amount: 280000, dueDate: '2024-06-25' },
  ],
};

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState(mockDashboardData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      title: 'Total Workers',
      value: data.totalWorkers,
      subtitle: `${data.activeWorkers} active`,
      icon: Users,
      color: 'primary',
    },
    {
      title: 'Total Payments',
      value: formatCurrency(data.totalPayments),
      trend: data.trend,
      icon: Wallet,
      color: 'accent',
    },
    {
      title: 'Monthly Payroll',
      value: formatCurrency(data.currentMonthPayroll),
      subtitle: 'This month',
      icon: IndianRupee,
      color: 'success',
    },
    {
      title: 'Pending Payments',
      value: data.pendingPayments,
      subtitle: formatCurrency(data.pendingAmount),
      icon: Clock,
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
            Manage your workforce and payments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/employer/record-wage">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Wage
            </Button>
          </Link>
          <Link to="/employer/bulk-upload">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
          </Link>
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
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          {stat.trend}%
                        </span>
                        <span className="text-xs text-gray-500">vs last month</span>
                      </div>
                    )}
                    {stat.subtitle && !stat.trend && (
                      <p className="text-sm text-gray-500 mt-2">{stat.subtitle}</p>
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
        <Link to="/employer/record-wage" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-green-100 mb-3">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">Record Wage</p>
              <p className="text-xs text-gray-500 mt-1">Add new payment</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/employer/bulk-upload" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-blue-100 mb-3">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900">Bulk Upload</p>
              <p className="text-xs text-gray-500 mt-1">CSV/Excel import</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/employer/workers" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-purple-100 mb-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium text-gray-900">Workers</p>
              <p className="text-xs text-gray-500 mt-1">Manage workforce</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/employer/reports" className="block">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-orange-100 mb-3">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <p className="font-medium text-gray-900">Reports</p>
              <p className="text-xs text-gray-500 mt-1">View analytics</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Payroll Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Payroll Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomAreaChart
              data={data.monthlyPayrollTrend.map(d => ({ name: d.month, amount: d.amount }))}
              areas={[{ dataKey: 'amount', color: CHART_COLORS.array[0], name: 'Payroll' }]}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </CardContent>
        </Card>

        {/* Payments by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Payments by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomBarChart
              data={data.paymentsByCategory.map(d => ({ name: d.category, amount: d.amount }))}
              bars={[{ dataKey: 'amount', color: CHART_COLORS.array[1], name: 'Amount' }]}
              xAxisKey="name"
              height={250}
              showLegend={false}
            />
          </CardContent>
        </Card>
      </div>

      {/* Worker Distribution & Upcoming Payments */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Worker Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Worker Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <CustomPieChart
              data={data.workerDistribution}
              height={200}
            />
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Link to="/employer/payments">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">
                        {payment.worker.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.worker}</p>
                      <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                    <Badge
                      variant={payment.status === 'completed' ? 'success' : 'warning'}
                      className="mt-1"
                    >
                      {payment.status === 'completed' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Completed</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments Alert */}
      {data.upcomingPayments.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-800">Upcoming Payment Schedule</p>
                <div className="mt-2 space-y-2">
                  {data.upcomingPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between text-sm">
                      <span className="text-blue-700">
                        {payment.workers} workers • Due {formatDate(payment.dueDate)}
                      </span>
                      <span className="font-medium text-blue-800">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Process Payments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployerDashboard;
