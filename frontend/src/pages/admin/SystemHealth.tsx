import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Globe,
  Shield,
  Zap
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  Spinner,
  Tabs,
  CustomLineChart,
  CustomAreaChart
} from '@/components/common';
import { CHART_COLORS } from '@/utils/constants';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastChecked: string;
  icon: React.ElementType;
}

interface NodeStatus {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'error';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
}

const mockServices: ServiceStatus[] = [
  { name: 'API Gateway', status: 'healthy', latency: 45, uptime: 99.99, lastChecked: '30 seconds ago', icon: Globe },
  { name: 'Database (PostgreSQL)', status: 'healthy', latency: 12, uptime: 99.98, lastChecked: '30 seconds ago', icon: Database },
  { name: 'Blockchain Network', status: 'healthy', latency: 120, uptime: 99.95, lastChecked: '30 seconds ago', icon: Server },
  { name: 'AI/ML Service', status: 'healthy', latency: 250, uptime: 99.90, lastChecked: '30 seconds ago', icon: Zap },
  { name: 'Authentication', status: 'healthy', latency: 35, uptime: 99.99, lastChecked: '30 seconds ago', icon: Shield },
  { name: 'Cache (Redis)', status: 'degraded', latency: 85, uptime: 99.80, lastChecked: '30 seconds ago', icon: HardDrive },
];

const mockNodes: NodeStatus[] = [
  { id: 'N001', name: 'Peer Node 1', type: 'Fabric Peer', status: 'running', cpu: 45, memory: 62, disk: 35, uptime: '45 days' },
  { id: 'N002', name: 'Peer Node 2', type: 'Fabric Peer', status: 'running', cpu: 52, memory: 58, disk: 38, uptime: '45 days' },
  { id: 'N003', name: 'Orderer Node', type: 'Fabric Orderer', status: 'running', cpu: 30, memory: 45, disk: 22, uptime: '45 days' },
  { id: 'N004', name: 'CA Node', type: 'Certificate Authority', status: 'running', cpu: 15, memory: 28, disk: 12, uptime: '45 days' },
  { id: 'N005', name: 'API Server 1', type: 'Application', status: 'running', cpu: 68, memory: 72, disk: 45, uptime: '30 days' },
  { id: 'N006', name: 'API Server 2', type: 'Application', status: 'running', cpu: 55, memory: 65, disk: 42, uptime: '30 days' },
];

const mockMetricsHistory = [
  { name: '00:00', time: '00:00', cpu: 45, memory: 62, requests: 1200 },
  { name: '02:00', time: '02:00', cpu: 38, memory: 58, requests: 800 },
  { name: '04:00', time: '04:00', cpu: 32, memory: 55, requests: 500 },
  { name: '06:00', time: '06:00', cpu: 40, memory: 60, requests: 1000 },
  { name: '08:00', time: '08:00', cpu: 65, memory: 72, requests: 2500 },
  { name: '10:00', time: '10:00', cpu: 78, memory: 78, requests: 3500 },
  { name: '12:00', time: '12:00', cpu: 82, memory: 80, requests: 4000 },
  { name: '14:00', time: '14:00', cpu: 75, memory: 76, requests: 3800 },
  { name: '16:00', time: '16:00', cpu: 70, memory: 74, requests: 3200 },
  { name: '18:00', time: '18:00', cpu: 60, memory: 68, requests: 2800 },
  { name: '20:00', time: '20:00', cpu: 55, memory: 65, requests: 2200 },
  { name: '22:00', time: '22:00', cpu: 48, memory: 62, requests: 1500 },
];

const SystemHealth: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>(mockServices);
  const [nodes, setNodes] = useState<NodeStatus[]>(mockNodes);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setServices(mockServices);
      setNodes(mockNodes);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'nodes', label: 'Nodes' },
    { id: 'metrics', label: 'Metrics' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'down':
      case 'stopped':
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <Badge variant="success">{status}</Badge>;
      case 'degraded':
        return <Badge variant="warning">{status}</Badge>;
      case 'down':
      case 'stopped':
      case 'error':
        return <Badge variant="error">{status}</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const healthyServices = services.filter(s => s.status === 'healthy').length;
  const totalServices = services.length;
  const runningNodes = nodes.filter(n => n.status === 'running').length;
  const totalNodes = nodes.length;

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
          <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-500 mt-1">Monitor system performance and service status</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {healthyServices}/{totalServices} Services Healthy
          </Badge>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{healthyServices}/{totalServices}</p>
                <p className="text-sm text-gray-500">Services Healthy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Server className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{runningNodes}/{totalNodes}</p>
                <p className="text-sm text-gray-500">Nodes Running</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">99.95%</p>
                <p className="text-sm text-gray-500">Overall Uptime</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">45ms</p>
                <p className="text-sm text-gray-500">Avg Latency</p>
              </CardContent>
            </Card>
          </div>

          {/* Service Quick Status */}
          <Card>
            <CardHeader>
              <CardTitle>Service Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => {
                  const Icon = service.icon;
                  return (
                    <div
                      key={service.name}
                      className={`p-4 rounded-lg border ${
                        service.status === 'healthy' ? 'border-green-200 bg-green-50' :
                        service.status === 'degraded' ? 'border-amber-200 bg-amber-50' :
                        'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${
                            service.status === 'healthy' ? 'text-green-600' :
                            service.status === 'degraded' ? 'text-amber-600' :
                            'text-red-600'
                          }`} />
                          <span className="font-medium text-gray-900">{service.name}</span>
                        </div>
                        {getStatusIcon(service.status)}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Latency: {service.latency}ms</span>
                        <span className="text-gray-500">Uptime: {service.uptime}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Resource Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomAreaChart
                data={mockMetricsHistory}
                areas={[{ dataKey: 'cpu', color: CHART_COLORS.primary, name: 'CPU' }]}
                height={250}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        service.status === 'healthy' ? 'bg-green-100' :
                        service.status === 'degraded' ? 'bg-amber-100' :
                        'bg-red-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          service.status === 'healthy' ? 'text-green-600' :
                          service.status === 'degraded' ? 'text-amber-600' :
                          'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-gray-500">Last checked: {service.lastChecked}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Latency</p>
                        <p className="font-semibold text-gray-900">{service.latency}ms</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Uptime</p>
                        <p className="font-semibold text-gray-900">{service.uptime}%</p>
                      </div>
                      {getStatusBadge(service.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Nodes Tab */}
      {activeTab === 'nodes' && (
        <div className="grid md:grid-cols-2 gap-4">
          {nodes.map((node) => (
            <Card key={node.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{node.name}</h3>
                    <p className="text-sm text-gray-500">{node.type}</p>
                  </div>
                  {getStatusBadge(node.status)}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Cpu className="h-3 w-3" /> CPU
                      </span>
                      <span className="font-medium">{node.cpu}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          node.cpu > 80 ? 'bg-red-500' :
                          node.cpu > 60 ? 'bg-amber-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${node.cpu}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 flex items-center gap-1">
                        <MemoryStick className="h-3 w-3" /> Memory
                      </span>
                      <span className="font-medium">{node.memory}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          node.memory > 80 ? 'bg-red-500' :
                          node.memory > 60 ? 'bg-amber-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${node.memory}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500 flex items-center gap-1">
                        <HardDrive className="h-3 w-3" /> Disk
                      </span>
                      <span className="font-medium">{node.disk}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          node.disk > 80 ? 'bg-red-500' :
                          node.disk > 60 ? 'bg-amber-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${node.disk}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t text-sm text-gray-500">
                  Uptime: {node.uptime}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CPU Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomLineChart
                data={mockMetricsHistory}
                lines={[{ dataKey: 'cpu', color: CHART_COLORS.primary, name: 'CPU' }]}
                height={250}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Memory Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomLineChart
                data={mockMetricsHistory}
                lines={[{ dataKey: 'memory', color: CHART_COLORS.accent, name: 'Memory' }]}
                height={250}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Request Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomAreaChart
                data={mockMetricsHistory}
                areas={[{ dataKey: 'requests', color: CHART_COLORS.success, name: 'Requests' }]}
                height={250}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
