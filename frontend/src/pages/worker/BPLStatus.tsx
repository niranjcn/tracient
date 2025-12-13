import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  Calendar,
  Heart
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Button,
  Badge,
  BPLBadge,
  Spinner,
  Alert,
  CustomPieChart
} from '@/components/common';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { CHART_COLORS, WELFARE_SCHEMES, BPL_THRESHOLD } from '@/utils/constants';

interface BPLStatusData {
  status: 'eligible' | 'not_eligible' | 'pending';
  annualIncome: number;
  threshold: number;
  lastVerified: string;
  certificateId?: string;
  eligibleSchemes: typeof WELFARE_SCHEMES;
  incomeBreakdown: {
    source: string;
    amount: number;
    percentage: number;
  }[];
  verificationHistory: {
    date: string;
    status: 'eligible' | 'not_eligible';
    income: number;
  }[];
}

const mockBPLData: BPLStatusData = {
  status: 'eligible',
  annualIncome: 125000,
  threshold: BPL_THRESHOLD,
  lastVerified: new Date().toISOString(),
  certificateId: 'BPL-2024-123456',
  eligibleSchemes: WELFARE_SCHEMES.map((name, index) => ({
    id: `scheme-${index + 1}`,
    name: name,
    description: `Government welfare scheme for BPL families`
  })),
  incomeBreakdown: [
    { source: 'Construction Work', amount: 50000, percentage: 40 },
    { source: 'Agricultural Labor', amount: 35000, percentage: 28 },
    { source: 'Daily Wages', amount: 25000, percentage: 20 },
    { source: 'Other', amount: 15000, percentage: 12 },
  ],
  verificationHistory: [
    { date: '2024-06-01', status: 'eligible', income: 125000 },
    { date: '2024-03-01', status: 'eligible', income: 118000 },
    { date: '2023-12-01', status: 'eligible', income: 95000 },
    { date: '2023-09-01', status: 'not_eligible', income: 165000 },
  ],
};

const BPLStatus: React.FC = () => {
  const [data, setData] = useState<BPLStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(mockBPLData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  const incomePercentage = (data.annualIncome / data.threshold) * 100;
  const remainingBuffer = data.threshold - data.annualIncome;

  const pieChartData = data.incomeBreakdown.map(item => ({
    name: item.source,
    value: item.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BPL Status</h1>
          <p className="text-gray-500 mt-1">Below Poverty Line eligibility verification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          {data.certificateId && (
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`border-l-4 ${data.status === 'eligible' ? 'border-l-green-500 bg-green-50' : data.status === 'not_eligible' ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${data.status === 'eligible' ? 'bg-green-100' : data.status === 'not_eligible' ? 'bg-red-100' : 'bg-amber-100'}`}>
                {data.status === 'eligible' ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : data.status === 'not_eligible' ? (
                  <XCircle className="h-8 w-8 text-red-600" />
                ) : (
                  <Clock className="h-8 w-8 text-amber-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {data.status === 'eligible' ? 'BPL Eligible' : data.status === 'not_eligible' ? 'Not BPL Eligible' : 'Verification Pending'}
                  </h2>
                  <BPLBadge status={data.status} />
                </div>
                <p className="text-gray-600 mt-1">
                  {data.status === 'eligible' 
                    ? 'You are eligible for welfare benefits under BPL category'
                    : data.status === 'not_eligible'
                    ? 'Your income exceeds the BPL threshold'
                    : 'Your status is being verified'}
                </p>
                {data.certificateId && (
                  <p className="text-sm text-gray-500 mt-2">
                    Certificate ID: <span className="font-mono">{data.certificateId}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Verified</p>
              <p className="font-medium text-gray-900">{formatDate(data.lastVerified)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Income Stats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">Your Annual Income</p>
              <IndianRupee className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.annualIncome)}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Threshold: {formatCurrency(data.threshold)}</span>
                <span className={`font-medium ${data.status === 'eligible' ? 'text-green-600' : 'text-red-600'}`}>
                  {incomePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${data.status === 'eligible' ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(incomePercentage, 100)}%` }}
                />
              </div>
              {data.status === 'eligible' && (
                <p className="text-sm text-gray-500 mt-2">
                  Buffer remaining: <span className="font-medium text-green-600">{formatCurrency(remainingBuffer)}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
            <CardDescription>Distribution of your income by source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-48 h-48">
                <CustomPieChart
                  data={pieChartData}
                  height={180}
                />
              </div>
              <div className="flex-1 space-y-3">
                {data.incomeBreakdown.map((item, index) => (
                  <div key={item.source} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.source}</span>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eligible Welfare Schemes */}
      {data.status === 'eligible' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Eligible Welfare Schemes
            </CardTitle>
            <CardDescription>
              Based on your BPL status, you are eligible for the following government schemes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.eligibleSchemes.map((scheme) => (
                <div 
                  key={scheme.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{scheme.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{scheme.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="success" className="text-xs">Eligible</Badge>
                    <Button variant="ghost" size="sm" className="text-primary-600">
                      Apply →
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            Verification History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.verificationHistory.map((record, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${record.status === 'eligible' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {record.status === 'eligible' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {record.status === 'eligible' ? 'BPL Eligible' : 'Not Eligible'}
                    </p>
                    <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(record.income)}</p>
                  <p className="text-sm text-gray-500">Annual Income</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Information Alert */}
      <Alert variant="info">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-800">Blockchain Verified</p>
            <p className="text-sm text-blue-700 mt-1">
              Your BPL status is calculated based on immutable wage records stored on the Hyperledger Fabric blockchain. 
              This ensures transparent and tamper-proof verification of your income.
            </p>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default BPLStatus;
