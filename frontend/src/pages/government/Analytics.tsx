import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  IndianRupee,
  Building2,
  MapPin,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Button,
  Select,
  Spinner,
  Tabs,
  CustomAreaChart,
  CustomBarChart,
  CustomLineChart,
  CustomPieChart,
  StatCard
} from '@/components/common';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { CHART_COLORS } from '@/utils/constants';

const mockAnalyticsData = {
  overview: {
    totalTransactions: 2456789,
    totalAmount: 45678900000,
    averageWage: 18500,
    growthRate: 12.5,
  },
  monthlyTrend: [
    { month: 'Jan', transactions: 180000, amount: 3500000000 },
    { month: 'Feb', transactions: 195000, amount: 3800000000 },
    { month: 'Mar', transactions: 210000, amount: 4100000000 },
    { month: 'Apr', transactions: 205000, amount: 4000000000 },
    { month: 'May', transactions: 225000, amount: 4400000000 },
    { month: 'Jun', transactions: 240000, amount: 4700000000 },
  ],
  sectorData: [
    { name: 'Agriculture', transactions: 450000, amount: 8500000000, workers: 180000 },
    { name: 'Construction', transactions: 380000, amount: 9200000000, workers: 120000 },
    { name: 'Manufacturing', transactions: 320000, amount: 10500000000, workers: 95000 },
    { name: 'Services', transactions: 280000, amount: 7800000000, workers: 85000 },
    { name: 'Retail', transactions: 220000, amount: 5500000000, workers: 62389 },
  ],
  regionData: [
    { name: 'North', transactions: 520000, amount: 10200000000, bplCount: 45000 },
    { name: 'South', transactions: 680000, amount: 13500000000, bplCount: 52000 },
    { name: 'East', transactions: 420000, amount: 8200000000, bplCount: 38000 },
    { name: 'West', transactions: 580000, amount: 11400000000, bplCount: 35000 },
    { name: 'Central', transactions: 256789, amount: 5078900000, bplCount: 19456 },
  ],
  incomeDistribution: [
    { range: '< ₹50K', count: 125000 },
    { range: '₹50K-1L', count: 185000 },
    { range: '₹1L-1.5L', count: 145000 },
    { range: '₹1.5L-2L', count: 52389 },
    { range: '> ₹2L', count: 35000 },
  ],
  wageTypeDistribution: [
    { name: 'Daily Wage', value: 45 },
    { name: 'Monthly', value: 30 },
    { name: 'Contract', value: 15 },
    { name: 'Overtime', value: 10 },
  ],
  employerSize: [
    { name: 'Large (100+)', value: 2500 },
    { name: 'Medium (50-100)', value: 4500 },
    { name: 'Small (10-50)', value: 5678 },
    { name: 'Micro (<10)', value: 3000 },
  ],
};

const Analytics: React.FC = () => {
  const [data, setData] = useState(mockAnalyticsData);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(mockAnalyticsData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const timeRangeOptions = [
    { value: '1m', label: 'Last Month' },
    { value: '3m', label: 'Last 3 Months' },
    { value: '6m', label: 'Last 6 Months' },
    { value: '1y', label: 'Last Year' },
    { value: 'all', label: 'All Time' },
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sectors', label: 'Sectors' },
    { id: 'regions', label: 'Regions' },
    { id: 'demographics', label: 'Demographics' },
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500 mt-1">Comprehensive income and wage analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={timeRangeOptions}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-40"
          />
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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={formatNumber(data.overview.totalTransactions)}
          trend={data.overview.growthRate}
          icon={BarChart3}
          color="primary"
        />
        <StatCard
          title="Total Amount"
          value={formatCurrency(data.overview.totalAmount)}
          icon={IndianRupee}
          color="success"
        />
        <StatCard
          title="Average Wage"
          value={formatCurrency(data.overview.averageWage)}
          icon={TrendingUp}
          color="accent"
        />
        <StatCard
          title="Active Employers"
          value={formatNumber(15678)}
          icon={Building2}
          color="warning"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Transaction Trend</CardTitle>
              <CardDescription>Transactions and amount over time</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomAreaChart
                data={data.monthlyTrend}
                xKey="month"
                yKey="amount"
                color={CHART_COLORS.primary}
                height={300}
                formatValue={(v) => formatCurrency(v)}
              />
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Wage Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Wage Type Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <CustomPieChart
                  data={data.wageTypeDistribution}
                  height={250}
                />
              </CardContent>
            </Card>

            {/* Employer Size Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Employer Size Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <CustomPieChart
                  data={data.employerSize}
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Sectors Tab */}
      {activeTab === 'sectors' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sector-wise Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomBarChart
                data={data.sectorData}
                xKey="name"
                yKey="transactions"
                color={CHART_COLORS.accent}
                height={300}
                formatValue={(v) => formatNumber(v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sector-wise Amount Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomBarChart
                data={data.sectorData}
                xKey="name"
                yKey="amount"
                color={CHART_COLORS.success}
                height={300}
                formatValue={(v) => formatCurrency(v)}
              />
            </CardContent>
          </Card>

          {/* Sector Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sector Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Sector</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Workers</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Transactions</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Total Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500">Avg per Worker</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sectorData.map((sector) => (
                      <tr key={sector.name} className="border-b last:border-0">
                        <td className="py-3 px-4 font-medium text-gray-900">{sector.name}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(sector.workers)}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(sector.transactions)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(sector.amount)}</td>
                        <td className="py-3 px-4 text-right">{formatCurrency(sector.amount / sector.workers)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === 'regions' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Transaction Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomBarChart
                data={data.regionData}
                xKey="name"
                yKey="transactions"
                color={CHART_COLORS.primary}
                height={300}
                formatValue={(v) => formatNumber(v)}
              />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {data.regionData.map((region) => (
              <Card key={region.name}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-primary-500" />
                    <h3 className="font-semibold text-gray-900">{region.name}</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transactions</span>
                      <span className="font-medium">{formatNumber(region.transactions)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-medium">{formatCurrency(region.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">BPL Count</span>
                      <span className="font-medium text-green-600">{formatNumber(region.bplCount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Demographics Tab */}
      {activeTab === 'demographics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Income Distribution</CardTitle>
              <CardDescription>Number of workers by annual income range</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomBarChart
                data={data.incomeDistribution}
                xKey="range"
                yKey="count"
                color={CHART_COLORS.warning}
                height={300}
                formatValue={(v) => formatNumber(v)}
              />
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income Range Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.incomeDistribution.map((range, index) => {
                    const total = data.incomeDistribution.reduce((sum, r) => sum + r.count, 0);
                    const percentage = (range.count / total) * 100;
                    return (
                      <div key={range.range} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-900">{range.range}</span>
                          <span className="text-gray-500">{formatNumber(range.count)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>57%</strong> of workers fall under the BPL threshold and are eligible for welfare benefits.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      Average income has increased by <strong>12.5%</strong> compared to last year.
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Agriculture</strong> sector has the highest number of BPL eligible workers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
