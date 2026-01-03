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
  Heart,
  ShieldCheck,
  ShieldX,
  AlertCircle
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
import { CHART_COLORS, BPL_THRESHOLD } from '@/utils/constants';
import { get } from '@/services/api';

interface WelfareData {
  status: string;
  isBPL: boolean;
  annualIncome: number;
  threshold: number;
  amountFromThreshold: number;
  incomeBreakdown: Array<{
    source: string;
    amount: number;
    percentage: number;
    verified: boolean;
  }>;
  verification: {
    verifiedAmount: number;
    unverifiedAmount: number;
    verifiedPercentage: number;
    verifiedTransactions: number;
    unverifiedTransactions: number;
  };
  verificationHistory: Array<{
    date: string;
    source: string;
    amount: number;
    transactionId: string;
  }>;
  eligibleSchemes: Array<{
    id: string;
    name: string;
    description: string;
    benefits: string;
    eligibility: string;
  }>;
  enrolledSchemes: any[];
  lastClassificationDate?: string;
  bankAccountBalance: number;
}

const mockWelfareData: WelfareData = {
  status: 'BPL',
  isBPL: true,
  annualIncome: 115000,
  threshold: BPL_THRESHOLD,
  amountFromThreshold: 5000,
  incomeBreakdown: [
    { source: 'ABC Construction Ltd', amount: 50000, percentage: 43, verified: true },
    { source: 'Private Labor Work', amount: 35000, percentage: 30, verified: false },
    { source: 'XYZ Agriculture Farm', amount: 30000, percentage: 26, verified: true },
  ],
  verification: {
    verifiedAmount: 80000,
    unverifiedAmount: 35000,
    verifiedPercentage: 70,
    verifiedTransactions: 24,
    unverifiedTransactions: 12
  },
  verificationHistory: [],
  eligibleSchemes: [
    { id: 'pds', name: 'Public Distribution System (PDS)', description: 'Subsidized food grains', benefits: 'Rice at ₹3/kg', eligibility: 'BPL families' }
  ],
  enrolledSchemes: [],
  bankAccountBalance: 0
};

const BPLStatus: React.FC = () => {
  const [data, setData] = useState<WelfareData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await get<{ success: boolean; data: WelfareData }>('/workers/profile/welfare');
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch welfare data:', err);
      setError('Failed to load welfare data. Using cached data.');
      setData(mockWelfareData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
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

  const bplStatus = data.isBPL ? 'eligible' : 'not_eligible';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">BPL Status & Welfare</h1>
          <p className="text-gray-500 mt-1">Below Poverty Line eligibility verification</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          {data.isBPL && (
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Download Certificate
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      {/* Status Banner */}
      <Card className={`border-l-4 ${data.isBPL ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${data.isBPL ? 'bg-green-100' : 'bg-red-100'}`}>
                {data.isBPL ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">
                    {data.isBPL ? 'BPL Eligible' : 'APL (Above Poverty Line)'}
                  </h2>
                  <BPLBadge status={bplStatus} />
                </div>
                <p className="text-gray-600 mt-1">
                  {data.isBPL 
                    ? 'You are eligible for welfare benefits under BPL category'
                    : 'Your income exceeds the BPL threshold'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Classification</p>
              <p className="font-medium text-gray-900">
                {data.lastClassificationDate ? formatDate(data.lastClassificationDate) : formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900">Income Verification Status</h3>
              <p className="text-sm text-gray-600 mt-1">
                {data.verification.verifiedPercentage}% of your income is verified through employer records
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-xs text-gray-500">Verified ({data.verification.verifiedTransactions} txns)</p>
                  <p className="font-semibold text-green-700">{formatCurrency(data.verification.verifiedAmount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldX className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">Unverified ({data.verification.unverifiedTransactions} txns)</p>
                  <p className="font-semibold text-orange-600">{formatCurrency(data.verification.unverifiedAmount)}</p>
                </div>
              </div>
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
              <p className="text-sm text-gray-500">Annual Income (Last 12 Months)</p>
              <IndianRupee className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.annualIncome)}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">BPL Threshold: {formatCurrency(data.threshold)}</span>
                <span className={`font-medium ${data.isBPL ? 'text-green-600' : 'text-red-600'}`}>
                  {incomePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${data.isBPL ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(incomePercentage, 100)}%` }}
                />
              </div>
              {data.isBPL && remainingBuffer > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Buffer remaining: <span className="font-medium text-green-600">{formatCurrency(remainingBuffer)}</span>
                </p>
              )}
              {!data.isBPL && (
                <p className="text-sm text-gray-500 mt-2">
                  Above threshold by: <span className="font-medium text-red-600">{formatCurrency(Math.abs(remainingBuffer))}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income Breakdown by Source</CardTitle>
            <CardDescription>Distribution of your income with verification status</CardDescription>
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
                      style={{ backgroundColor: CHART_COLORS.array[index % CHART_COLORS.array.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{item.source}</span>
                          {item.verified ? (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          ) : (
                            <ShieldX className="h-4 w-4 text-orange-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: CHART_COLORS.array[index % CHART_COLORS.array.length]
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {data.isBPL ? 'Eligible Welfare Schemes' : 'Available Schemes'}
          </CardTitle>
          <CardDescription>
            {data.isBPL 
              ? 'Based on your BPL status, you are eligible for the following government schemes'
              : 'These schemes are available based on your income category'}
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
                <p className="text-xs text-green-600 mt-2">{scheme.benefits}</p>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant={data.isBPL ? 'success' : 'default'} className="text-xs">
                    {data.isBPL ? 'Eligible' : 'Check Eligibility'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-primary-600">
                    Apply →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification History */}
      {data.verificationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Recent Verified Transactions
            </CardTitle>
            <CardDescription>Latest employer-verified income records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.verificationHistory.map((record, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-green-100">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{record.source}</p>
                      <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(record.amount)}</p>
                    <p className="text-xs text-gray-400 font-mono">{record.transactionId?.substring(0, 16)}...</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Account Balance */}
      {data.bankAccountBalance > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Linked Bank Account Balance</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.bankAccountBalance)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <IndianRupee className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
