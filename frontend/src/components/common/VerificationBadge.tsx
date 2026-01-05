/**
 * VerificationBadge Component
 * Displays blockchain verification status for transactions
 */
import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldX, 
  ShieldAlert,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';
import { verifyTransaction, TransactionDetails } from '../../services/blockchainService';

interface VerificationBadgeProps {
  /** Transaction ID to verify */
  transactionId?: string;
  /** Pre-loaded verification status (if already fetched) */
  verified?: boolean;
  /** Transaction hash from blockchain */
  txHash?: string;
  /** Show verification timestamp */
  timestamp?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show detailed info on hover/click */
  showDetails?: boolean;
  /** Whether to allow clicking to verify */
  clickToVerify?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  transactionId,
  verified: initialVerified,
  txHash,
  timestamp,
  size = 'md',
  showDetails = true,
  clickToVerify = true,
  className = ''
}) => {
  const [verified, setVerified] = useState<boolean | null>(initialVerified ?? null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!transactionId || !clickToVerify || isVerifying) return;

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyTransaction(transactionId);
      setVerified(result.verified);
      setDetails(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'px-2 py-0.5 text-xs',
      icon: 'w-3 h-3',
      gap: 'gap-1'
    },
    md: {
      container: 'px-3 py-1 text-sm',
      icon: 'w-4 h-4',
      gap: 'gap-1.5'
    },
    lg: {
      container: 'px-4 py-1.5 text-base',
      icon: 'w-5 h-5',
      gap: 'gap-2'
    }
  };

  const config = sizeConfig[size];

  // Status configurations
  const getStatusConfig = () => {
    if (isVerifying) {
      return {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-700',
        icon: <Loader2 className={`${config.icon} animate-spin`} />,
        label: 'Verifying...'
      };
    }

    if (verified === null && transactionId) {
      return {
        bg: 'bg-gray-50 border-gray-200 hover:bg-gray-100 cursor-pointer',
        text: 'text-gray-600',
        icon: <ShieldAlert className={config.icon} />,
        label: 'Click to verify'
      };
    }

    if (verified === true) {
      return {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-700',
        icon: <ShieldCheck className={config.icon} />,
        label: 'Verified'
      };
    }

    if (verified === false) {
      return {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-700',
        icon: <ShieldX className={config.icon} />,
        label: error || 'Not Verified'
      };
    }

    // No transaction ID provided
    return {
      bg: 'bg-gray-50 border-gray-200',
      text: 'text-gray-500',
      icon: <ShieldAlert className={config.icon} />,
      label: 'Pending'
    };
  };

  const statusConfig = getStatusConfig();

  // Tooltip content
  const renderTooltip = () => {
    if (!showDetails || !showTooltip) return null;

    return (
      <div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64">
        <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 text-xs">
          <div className="space-y-2">
            {/* Status */}
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span>Status: {verified ? 'Blockchain Verified' : 'Not Verified'}</span>
            </div>

            {/* Transaction ID */}
            {transactionId && (
              <div className="flex items-start gap-2">
                <Info className="w-3 h-3 text-blue-400 mt-0.5" />
                <div className="break-all">
                  <span className="text-gray-400">ID: </span>
                  <span className="font-mono">{transactionId.substring(0, 20)}...</span>
                </div>
              </div>
            )}

            {/* TX Hash */}
            {(txHash || details?.data?.txHash) && (
              <div className="flex items-start gap-2">
                <ExternalLink className="w-3 h-3 text-purple-400 mt-0.5" />
                <div className="break-all">
                  <span className="text-gray-400">Hash: </span>
                  <span className="font-mono">{(txHash || details?.data?.txHash)?.substring(0, 16)}...</span>
                </div>
              </div>
            )}

            {/* Timestamp */}
            {(timestamp || details?.timestamp) && (
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span className="text-gray-400">
                  {new Date(timestamp || details?.timestamp || '').toLocaleString()}
                </span>
              </div>
            )}

            {/* Mock indicator */}
            {details?.mock && (
              <div className="text-yellow-400 italic">
                * Simulated verification (blockchain offline)
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={handleVerify}
        disabled={isVerifying || !transactionId || !clickToVerify}
        className={`
          inline-flex items-center ${config.gap} ${config.container}
          rounded-full border font-medium transition-colors
          ${statusConfig.bg} ${statusConfig.text}
          disabled:cursor-default
        `}
      >
        {statusConfig.icon}
        <span>{statusConfig.label}</span>
      </button>

      {renderTooltip()}
    </div>
  );
};

// Compact inline version for tables
export const VerificationIcon: React.FC<{
  verified?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ verified, loading, size = 'md', className = '' }) => {
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  if (loading) {
    return (
      <span title="Verifying...">
        <Loader2 className={`${iconSize} text-blue-500 animate-spin ${className}`} />
      </span>
    );
  }

  if (verified === true) {
    return (
      <span title="Blockchain Verified">
        <ShieldCheck className={`${iconSize} text-green-500 ${className}`} />
      </span>
    );
  }

  if (verified === false) {
    return (
      <span title="Not Verified">
        <ShieldX className={`${iconSize} text-red-500 ${className}`} />
      </span>
    );
  }

  return (
    <span title="Pending Verification">
      <ShieldAlert className={`${iconSize} text-gray-400 ${className}`} />
    </span>
  );
};

export default VerificationBadge;
