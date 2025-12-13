import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Network,
  Shield,
  Database
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Button,
  Badge,
  Spinner
} from '@/components/common';

interface Node {
  id: string;
  name: string;
  type: 'peer' | 'orderer' | 'ca' | 'chaincode';
  status: 'active' | 'degraded' | 'offline';
  organization: string;
  latency: number;
  connections: number;
}

const mockNodes: Node[] = [
  { id: 'peer0.org1', name: 'Peer 0 - Org1', type: 'peer', status: 'active', organization: 'Government', latency: 12, connections: 8 },
  { id: 'peer1.org1', name: 'Peer 1 - Org1', type: 'peer', status: 'active', organization: 'Government', latency: 15, connections: 7 },
  { id: 'peer0.org2', name: 'Peer 0 - Org2', type: 'peer', status: 'active', organization: 'Employers', latency: 18, connections: 6 },
  { id: 'peer1.org2', name: 'Peer 1 - Org2', type: 'peer', status: 'degraded', organization: 'Employers', latency: 45, connections: 4 },
  { id: 'orderer', name: 'Orderer Node', type: 'orderer', status: 'active', organization: 'System', latency: 8, connections: 12 },
  { id: 'ca.org1', name: 'CA - Org1', type: 'ca', status: 'active', organization: 'Government', latency: 10, connections: 4 },
  { id: 'ca.org2', name: 'CA - Org2', type: 'ca', status: 'active', organization: 'Employers', latency: 11, connections: 4 },
  { id: 'chaincode', name: 'Tracient Chaincode', type: 'chaincode', status: 'active', organization: 'System', latency: 25, connections: 8 },
];

const NetworkTopology: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(mockNodes);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'degraded':
        return <Badge variant="warning">Degraded</Badge>;
      case 'offline':
        return <Badge variant="error">Offline</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'peer':
        return <Server className="h-5 w-5" />;
      case 'orderer':
        return <Network className="h-5 w-5" />;
      case 'ca':
        return <Shield className="h-5 w-5" />;
      case 'chaincode':
        return <Database className="h-5 w-5" />;
      default:
        return <Wifi className="h-5 w-5" />;
    }
  };

  const activeNodes = nodes.filter(n => n.status === 'active').length;
  const degradedNodes = nodes.filter(n => n.status === 'degraded').length;
  const offlineNodes = nodes.filter(n => n.status === 'offline').length;

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
          <h1 className="text-2xl font-bold text-gray-900">Network Topology</h1>
          <p className="text-gray-500 mt-1">Hyperledger Fabric blockchain network visualization</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {activeNodes} Active Nodes
          </Badge>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{activeNodes}</p>
            <p className="text-sm text-gray-500">Active Nodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{degradedNodes}</p>
            <p className="text-sm text-gray-500">Degraded</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{offlineNodes}</p>
            <p className="text-sm text-gray-500">Offline</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">18ms</p>
            <p className="text-sm text-gray-500">Avg Latency</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Node List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Network Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedNode?.id === node.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        node.status === 'active' ? 'bg-green-100 text-green-700' :
                        node.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {getNodeIcon(node.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{node.name}</p>
                        <p className="text-sm text-gray-500">{node.organization} • {node.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusIcon(node.status)}
                      {getStatusBadge(node.status)}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Latency:</span>
                      <span className="ml-2 font-medium text-gray-900">{node.latency}ms</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Connections:</span>
                      <span className="ml-2 font-medium text-gray-900">{node.connections}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Node Details */}
        <Card>
          <CardHeader>
            <CardTitle>Node Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className={`p-3 rounded-lg ${
                    selectedNode.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedNode.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedNode.name}</p>
                    <p className="text-sm text-gray-500">{selectedNode.id}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    {getStatusBadge(selectedNode.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium text-gray-900 capitalize">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Organization</span>
                    <span className="font-medium text-gray-900">{selectedNode.organization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Latency</span>
                    <span className="font-medium text-gray-900">{selectedNode.latency}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Connections</span>
                    <span className="font-medium text-gray-900">{selectedNode.connections}</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button className="w-full" variant="outline">View Logs</Button>
                  <Button className="w-full" variant="outline">Restart Node</Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Network className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Select a node to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Organizations Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-900">Government</span>
                <Badge variant="primary">3 Nodes</Badge>
              </div>
              <p className="text-sm text-blue-700">2 Peers, 1 CA</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-900">Employers</span>
                <Badge variant="success">3 Nodes</Badge>
              </div>
              <p className="text-sm text-green-700">2 Peers, 1 CA</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-purple-900">System</span>
                <Badge variant="default">2 Nodes</Badge>
              </div>
              <p className="text-sm text-purple-700">1 Orderer, 1 Chaincode</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkTopology;
