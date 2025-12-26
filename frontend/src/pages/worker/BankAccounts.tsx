import React, { useState } from 'react';
import { Plus, CreditCard, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { useWorkerBankAccounts } from '@/hooks/useWorkerBankAccounts';
import BankAccountCard from '@/components/worker/BankAccountCard';
import AddBankAccountModal from '@/components/worker/AddBankAccountModal';
import { Card, Button, Spinner, EmptyState } from '@/components/common';

export default function BankAccountsPage() {
  const {
    accounts,
    totalBalance,
    totalMonthlyIncome,
    loading,
    error,
    addAccount,
    setAsDefault,
    deleteAccount,
    refetch
  } = useWorkerBankAccounts();

  const [showAddModal, setShowAddModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Bank Accounts</h1>
            <p className="text-gray-600">
              Manage your bank accounts linked to Aadhaar for wage payments
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            <Plus size={20} />
            Add Bank Account
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Balance */}
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <Wallet size={32} />
              <span className="text-sm font-medium bg-blue-400 bg-opacity-30 px-3 py-1 rounded-full">
                Total Balance
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-1">{formatCurrency(totalBalance)}</h2>
            <p className="text-blue-100 text-sm">Across all accounts</p>
          </Card>

          {/* Monthly Income */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp size={32} />
              <span className="text-sm font-medium bg-green-400 bg-opacity-30 px-3 py-1 rounded-full">
                Monthly Income
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-1">{formatCurrency(totalMonthlyIncome)}</h2>
            <p className="text-green-100 text-sm">Average monthly earnings</p>
          </Card>

          {/* Total Accounts */}
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <CreditCard size={32} />
              <span className="text-sm font-medium bg-purple-400 bg-opacity-30 px-3 py-1 rounded-full">
                Active Accounts
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-1">{accounts.length}</h2>
            <p className="text-purple-100 text-sm">
              {accounts.filter(acc => acc.isVerified).length} verified
            </p>
          </Card>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-600" size={20} />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Bank Accounts Grid */}
      {accounts.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Bank Accounts"
          description="Add a bank account to start receiving wage payments securely"
          action={
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Your First Account
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <BankAccountCard
              key={account._id}
              account={account}
              onSetDefault={setAsDefault}
              onDelete={deleteAccount}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📌 Important Information
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>All bank accounts are automatically linked to your Aadhaar number for secure verification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>Set a default account to receive wage payments automatically</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>Balance and monthly income are updated from blockchain transactions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">•</span>
            <span>AI-powered anomaly detection helps identify suspicious transaction patterns</span>
          </li>
        </ul>
      </div>

      {/* Add Account Modal */}
      <AddBankAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={addAccount}
      />
    </div>
  );
}
