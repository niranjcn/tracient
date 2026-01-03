import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  Database,
  Cpu
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Button,
  Badge,
  Spinner,
  StatCard,
  CustomLineChart
} from '@/components/common';
import { formatNumber } from '@/utils/formatters';
import { CHART_COLORS } from '@/utils/constants';

const mockDashboardData = {
  stats: {
    totalUsers: 558756,
    activeUsers: 245890,
    totalOrganizations: 15678,
    systemUptime: 99.98,
  },
  usersByRole: [
    { role: 'Workers', count: 542389 },
    { role: 'Employers', count: 15678 },
    { role: 'Government', count: 156 },
    { role: 'Admins', count: 45 },
  ],
  systemHealth: {
    apiLatency: 45,
    blockchainLatency: 120,
    databaseLatency: 12,
    errorRate: 0.02,
  },
  recentActivity: [
    { id: '1', action: 'New employer registered', user: 'Green Energy Ltd', time: '2 minutes ago', type: 'success' },
    { id: '2', action: 'System backup completed', user: 'Automated System', time: '15 minutes ago', type: 'success' },
    { id: '3', action: 'User role updated', user: 'Admin User', time: '1 hour ago', type: 'info' },
    { id: '4', action: 'Failed login attempt detected', user: 'Unknown', time: '2 hours ago', type: 'warning' },
    { id: '5', action: 'Database maintenance scheduled', user: 'System Admin', time: '3 hours ago', type: 'info' },
  ],
  serverMetrics: [
    { name: '00:00', time: '00:00', cpu: 45, memory: 62, disk: 35 },
    { name: '04:00', time: '04:00', cpu: 38, memory: 58, disk: 35 },
    { name: '08:00', time: '08:00', cpu: 65, memory: 72, disk: 36 },
    { name: '12:00', time: '12:00', cpu: 82, memory: 78, disk: 36 },
    { name: '16:00', time: '16:00', cpu: 75, memory: 75, disk: 37 },
    { name: '20:00', time: '20:00', cpu: 55, memory: 68, disk: 37 },
  ],
  alerts: [
    { id: '1', type: 'warning', message: 'High CPU usage detected on Node 2', time: '10 minutes ago' },
    { id: '2', type: 'info', message: 'Scheduled maintenance in 24 hours', time: '1 hour ago' },
    { id: '3', type: 'success', message: 'All blockchain nodes synchronized', time: '2 hours ago' },
  ],
};

const AdminDashboard: React.FC = () => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">System administration and monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            All Systems Operational
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={formatNumber(data.stats.totalUsers)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Active Users"
          value={formatNumber(data.stats.activeUsers)}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Organizations"
          value={formatNumber(data.stats.totalOrganizations)}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="System Uptime"
          value={`${data.stats.systemUptime}%`}
          icon={<Server className="h-5 w-5" />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Health Metrics</CardTitle>
            <CardDescription>Real-time server performance monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <Cpu className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{data.systemHealth.apiLatency}ms</p>
                <p className="text-xs text-green-600">API Latency</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Database className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{data.systemHealth.databaseLatency}ms</p>
                <p className="text-xs text-blue-600">DB Latency</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <Server className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">{data.systemHealth.blockchainLatency}ms</p>
                <p className="text-xs text-purple-600">Blockchain</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700">{data.systemHealth.errorRate}%</p>
                <p className="text-xs text-amber-600">Error Rate</p>
              </div>
            </div>
            <CustomLineChart
              data={data.serverMetrics}
              lines={[{ dataKey: 'cpu', color: CHART_COLORS.primary, name: 'CPU' }]}
              xAxisKey="name"
              height={200}
            />
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.usersByRole.map((item) => (
                <div key={item.role} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.role === 'Workers' ? 'bg-blue-500' :
                      item.role === 'Employers' ? 'bg-green-500' :
                      item.role === 'Government' ? 'bg-purple-500' :
                      'bg-amber-500'
                    }`} />
                    <span className="text-gray-700">{item.role}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatNumber(item.count)}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Users</span>
                <span className="font-semibold text-gray-900">
                  {formatNumber(data.usersByRole.reduce((sum, r) => sum + r.count, 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'success' ? 'bg-green-100' :
                    activity.type === 'warning' ? 'bg-amber-100' :
                    'bg-blue-100'
                  }`}>
                    {activity.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : activity.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>System Alerts</CardTitle>
            <CardDescription>Active notifications and warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    alert.type === 'success' ? 'bg-green-50 border-green-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    ) : alert.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        alert.type === 'warning' ? 'text-amber-800' :
                        alert.type === 'success' ? 'text-green-800' :
                        'text-blue-800'
                      }`}>
                        {alert.message}
                      </p>
                      <p className={`text-xs mt-1 ${
                        alert.type === 'warning' ? 'text-amber-600' :
                        alert.type === 'success' ? 'text-green-600' :
                        'text-blue-600'
                      }`}>
                        {alert.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span>Organizations</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Server className="h-5 w-5" />
              <span>System Health</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
