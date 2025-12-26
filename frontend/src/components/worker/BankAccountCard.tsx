import React from 'react';
import { CreditCard, TrendingUp, Calendar, MapPin, CheckCircle, AlertTriangle, Star, Trash2 } from 'lucide-react';
import { BankAccount } from '@/hooks/useWorkerBankAccounts';
import { Card, Badge } from '@/components/common';

interface BankAccountCardProps {
  account: BankAccount;
  onSetDefault?: (accountId: string) => void;
  onDelete?: (accountId: string) => void;
}

export default function BankAccountCard({ account, onSetDefault, onDelete }: BankAccountCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'IN': '🇮🇳',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'AU': '🇦🇺',
      'CA': '🇨🇦',
      'NZ': '🇳🇿'
    };
    return flags[countryCode] || '🌍';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <CreditCard size={24} />
            <div>
              <h3 className="text-xl font-bold">{account.bankName}</h3>
              <p className="text-blue-100 text-sm">{account.accountNumberMasked}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {account.isDefault && (
              <Badge className="bg-yellow-400 text-yellow-900 border-0">
                <Star size={12} className="mr-1" fill="currentColor" />
                Default
              </Badge>
            )}
            {account.isVerified && (
              <Badge className="bg-green-400 text-green-900 border-0">
                <CheckCircle size={12} className="mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Balance Display */}
        <div className="mt-4">
          <p className="text-blue-100 text-sm mb-1">Total Balance</p>
          <p className="text-3xl font-bold">{formatCurrency(account.balance)}</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-6 space-y-4">
        {/* Monthly Income */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <TrendingUp size={20} />
              <span className="text-sm font-medium">Monthly Income</span>
            </div>
            <span className="text-lg font-bold text-green-700">
              {formatCurrency(account.monthlyIncome)}
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">Average over last 3 months</p>
        </div>

        {/* Account Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Account Holder</p>
            <p className="font-medium text-gray-900">{account.accountHolderName}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">IFSC Code</p>
            <p className="font-medium text-gray-900 font-mono">{account.ifscCode}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Account Type</p>
            <p className="font-medium text-gray-900 capitalize">{account.accountType}</p>
          </div>
          <div className="flex items-center gap-1">
            <MapPin size={14} className="text-gray-500" />
            <span className="font-medium text-gray-900">{getCountryFlag(account.country)} {account.country}</span>
          </div>
        </div>

        {/* Blockchain Status */}
        {account.blockchainMetadata && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Blockchain Transactions</span>
              <span className="font-semibold text-gray-900">
                {account.blockchainMetadata.totalTransactionCount || 0}
              </span>
            </div>
            {account.blockchainMetadata.lastSyncedAt && (
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Calendar size={12} />
                <span>Last synced: {formatDate(account.blockchainMetadata.lastSyncedAt)}</span>
              </div>
            )}
          </div>
        )}

        {/* Anomaly Detection Status */}
        {account.anomalyDetection && account.anomalyDetection.isAnomaly && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-600" />
              <div>
                <p className="text-sm font-semibold text-red-800">Anomaly Detected</p>
                <p className="text-xs text-red-600">
                  Confidence: {account.anomalyDetection.anomalyProbability.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {!account.isDefault && onSetDefault && (
            <button
              onClick={() => onSetDefault(account._id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
            >
              <Star size={16} />
              Set as Default
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this bank account?')) {
                  onDelete(account._id);
                }
              }}
              className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>

        {/* Added Date */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
          Added on {formatDate(account.createdAt)}
        </div>
      </div>
    </div>
  );
}
