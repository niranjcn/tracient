import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  MapPin,
  Shield,
  FileText,
  Settings,
  IndianRupee,
  Building2,
  BadgeCheck,
  Heart
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
  StatCard,
  CustomAreaChart,
  CustomBarChart,
  CustomPieChart
} from '@/components/common';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { CHART_COLORS } from '@/utils/constants';

const mockDashboardData = {
  totalWorkers: 542389,
  bplEligible: 189456,
  totalEmployers: 15678,
  totalWageRecords: 2456789,
  anomaliesDetected: 156,
  averageIncome: 145000,
  trends: {
    workers: 5.2,
    bpl: -2.1,
    wages: 8.5,
  },
  incomeDistribution: [
    { month: 'Jan', income: 45000000 },
    { month: 'Feb', income: 48000000 },
    { month: 'Mar', income: 52000000 },
    { month: 'Apr', income: 49000000 },
    { month: 'May', income: 55000000 },
    { month: 'Jun', income: 58000000 },
  ],
  sectorDistribution: [
    { sector: 'Agriculture', workers: 180000, amount: 15000000 },
    { sector: 'Construction', workers: 120000, amount: 18000000 },
    { sector: 'Manufacturing', workers: 95000, amount: 20000000 },
    { sector: 'Services', workers: 85000, amount: 12000000 },
    { sector: 'Others', workers: 62389, amount: 8000000 },
  ],
  bplDistribution: [
    { name: 'BPL Eligible', value: 189456 },
    { name: 'Above PL', value: 352933 },
  ],
  regionData: [
    { region: 'North', workers: 125000, bplCount: 45000 },
    { region: 'South', workers: 156000, bplCount: 52000 },
    { region: 'East', workers: 98000, bplCount: 38000 },
    { region: 'West', workers: 112000, bplCount: 35000 },
    { region: 'Central', workers: 51389, bplCount: 19456 },
  ],
  recentAnomalies: [
    { id: '1', type: 'Unusual Pattern', severity: 'high', description: 'Multiple high-value transactions from single employer', time: '2 hours ago' },
    { id: '2', type: 'Duplicate Entry', severity: 'medium', description: 'Potential duplicate wage record detected', time: '5 hours ago' },
    { id: '3', type: 'Threshold Breach', severity: 'low', description: 'Worker income approaching BPL threshold', time: '1 day ago' },
  ],
};

const GovernmentDashboard: React.FC = () => {
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
      value: formatNumber(data.totalWorkers),
      trend: data.trends.workers,
      icon: Users,
      color: 'primary' as const,
    },
    {
      title: 'BPL Eligible',
      value: formatNumber(data.bplEligible),
      trend: data.trends.bpl,
      icon: BadgeCheck,
      color: 'success' as const,
    },
    {
      title: 'Total Employers',
      value: formatNumber(data.totalEmployers),
      icon: Building2,
      color: 'accent' as const,
    },
    {
      title: 'Anomalies Detected',
      value: data.anomaliesDetected,
      icon: AlertTriangle,
      color: 'warning' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Government Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor income distribution and welfare eligibility
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/government/anomalies">
            <Button variant="outline" className="relative">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Anomaly Alerts
              {data.anomaliesDetected > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {data.anomaliesDetected}
                </span>
              )}
            </Button>
          </Link>
          <Link to="/government/analytics">
            <Button>
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/government/analytics">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-blue-100 mb-3">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-xs text-gray-500 mt-1">View detailed stats</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/government/anomalies">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full relative">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-red-100 mb-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <p className="font-medium text-gray-900">Anomalies</p>
              <p className="text-xs text-gray-500 mt-1">Review alerts</p>
              {data.anomaliesDetected > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {data.anomaliesDetected}
                </span>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link to="/government/welfare">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-purple-100 mb-3">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium text-gray-900">Welfare</p>
              <p className="text-xs text-gray-500 mt-1">Manage schemes</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/government/policy">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="p-3 rounded-xl bg-green-100 mb-3">
                <Settings className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">Policy</p>
              <p className="text-xs text-gray-500 mt-1">Configure thresholds</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Income Distribution Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomAreaChart
              data={data.incomeDistribution}
              xKey="month"
              yKey="income"
              color={CHART_COLORS.primary}
              height={250}
              formatValue={(v) => formatCurrency(v)}
            />
          </CardContent>
        </Card>

        {/* BPL Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>BPL Eligibility Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <CustomPieChart
                data={data.bplDistribution}
                height={200}
              />
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-gray-900">BPL Eligible</p>
                    <p className="text-sm text-gray-500">{formatNumber(data.bplEligible)} ({((data.bplEligible / data.totalWorkers) * 100).toFixed(1)}%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Above PL</p>
                    <p className="text-sm text-gray-500">{formatNumber(data.totalWorkers - data.bplEligible)} ({((1 - data.bplEligible / data.totalWorkers) * 100).toFixed(1)}%)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sector Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Sector-wise Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomBarChart
            data={data.sectorDistribution}
            xKey="sector"
            yKey="workers"
            color={CHART_COLORS.accent}
            height={250}
            formatValue={(v) => formatNumber(v)}
          />
        </CardContent>
      </Card>

      {/* Recent Anomalies & Regional Data */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Anomalies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Recent Anomalies
            </CardTitle>
            <Link to="/government/anomalies">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentAnomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="p-3 bg-gray-50 rounded-lg flex items-start justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      anomaly.severity === 'high' ? 'bg-red-100' :
                      anomaly.severity === 'medium' ? 'bg-amber-100' : 'bg-yellow-100'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 ${
                        anomaly.severity === 'high' ? 'text-red-600' :
                        anomaly.severity === 'medium' ? 'text-amber-600' : 'text-yellow-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{anomaly.type}</p>
                      <p className="text-sm text-gray-500">{anomaly.description}</p>
                    </div>
                  </div>
                  <Badge
                    variant={anomaly.severity === 'high' ? 'error' : anomaly.severity === 'medium' ? 'warning' : 'default'}
                  >
                    {anomaly.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-500" />
              Regional Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.regionData.map((region) => (
                <div key={region.region} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{region.region}</span>
                    <span className="text-sm text-gray-500">
                      {formatNumber(region.workers)} workers
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{ width: `${(region.workers / data.totalWorkers) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {((region.workers / data.totalWorkers) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    BPL: {formatNumber(region.bplCount)} ({((region.bplCount / region.workers) * 100).toFixed(1)}%)
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-primary-50 to-accent-50 border-primary-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Blockchain Status</p>
                <p className="text-sm text-gray-600">
                  Hyperledger Fabric Network • {formatNumber(data.totalWageRecords)} transactions recorded
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-green-600 font-medium">Network Healthy</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GovernmentDashboard;
