/**
 * BlockchainStatus Component
 * Displays the current status of blockchain connection
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertTriangle,
  Database,
  Link,
  Link2Off
} from 'lucide-react';
import { getBlockchainHealth, getBlockchainStatus, BlockchainStatus as IBlockchainStatus, SyncStatus } from '../../services/blockchainService';

interface BlockchainStatusProps {
  /** Show detailed status or compact version */
  detailed?: boolean;
  /** Auto-refresh interval in seconds (0 to disable) */
  refreshInterval?: number;
  /** Callback when status changes */
  onStatusChange?: (connected: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

interface StatusData {
  status: IBlockchainStatus;
  sync?: SyncStatus;
  loading: boolean;
  lastUpdated: Date | null;
}

const BlockchainStatus: React.FC<BlockchainStatusProps> = ({
  detailed = false,
  refreshInterval = 30,
  onStatusChange,
  className = ''
}) => {
  const [data, setData] = useState<StatusData>({
    status: {
      connected: false,
      healthy: false,
      channel: null,
      chaincode: null
    },
    loading: true,
    lastUpdated: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async (showRefreshing = true) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      if (detailed) {
        const fullStatus = await getBlockchainStatus();
        setData({
          status: fullStatus,
          sync: fullStatus.sync,
          loading: false,
          lastUpdated: new Date()
        });
        onStatusChange?.(fullStatus.connected);
      } else {
        const health = await getBlockchainHealth();
        setData(prev => ({
          ...prev,
          status: {
            ...prev.status,
            connected: health.connected,
            healthy: health.healthy
          },
          loading: false,
          lastUpdated: new Date()
        }));
        onStatusChange?.(health.connected);
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        status: {
          ...prev.status,
          connected: false,
          healthy: false,
          error: 'Failed to fetch status'
        },
        loading: false,
        lastUpdated: new Date()
      }));
      onStatusChange?.(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [detailed, onStatusChange]);

  // Initial fetch
  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchStatus(false);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchStatus]);

  const handleRefresh = () => {
    fetchStatus(true);
  };

  const { status, sync, loading, lastUpdated } = data;

  // Compact version
  if (!detailed) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {loading ? (
          <Activity className="w-4 h-4 text-gray-400 animate-pulse" />
        ) : status.connected ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm ${status.connected ? 'text-green-600' : 'text-red-600'}`}>
          Blockchain {status.connected ? 'Connected' : 'Disconnected'}
        </span>
        {isRefreshing && <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />}
      </div>
    );
  }

  // Detailed version
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${status.connected ? 'bg-green-100' : 'bg-red-100'}`}>
            <Database className={`w-5 h-5 ${status.connected ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Blockchain Status</h3>
            <p className="text-sm text-gray-500">Hyperledger Fabric Network</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Refresh status"
        >
          <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status Content */}
      <div className="p-4 space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Connection</span>
          <div className="flex items-center gap-2">
            {status.connected ? (
              <>
                <Link className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Connected</span>
              </>
            ) : (
              <>
                <Link2Off className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Health Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Health</span>
          <div className="flex items-center gap-2">
            {status.healthy ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600">Unhealthy</span>
              </>
            )}
          </div>
        </div>

        {/* Channel Info */}
        {status.channel && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Channel</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {status.channel}
            </span>
          </div>
        )}

        {/* Chaincode Info */}
        {status.chaincode && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Chaincode</span>
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {status.chaincode}
            </span>
          </div>
        )}

        {/* Sync Status */}
        {sync && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Sync Status</span>
              <span className={`text-sm font-medium ${sync.syncInProgress ? 'text-blue-600' : 'text-gray-600'}`}>
                {sync.syncInProgress ? (
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  'Idle'
                )}
              </span>
            </div>
            
            {sync.lastSyncResult && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-50 rounded p-2">
                  <span className="text-green-700">Synced: {sync.lastSyncResult.synced}</span>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <span className="text-red-700">Failed: {sync.lastSyncResult.failed}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {status.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{status.error}</p>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-gray-400 text-right">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default BlockchainStatus;
