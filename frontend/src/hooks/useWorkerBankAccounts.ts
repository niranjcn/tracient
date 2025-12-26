import { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

export interface BankAccount {
  _id: string;
  accountNumber: string;
  accountNumberMasked: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  country: string;
  accountType: 'savings' | 'current' | 'other';
  balance: number;
  monthlyIncome: number;
  balanceLastUpdated?: Date;
  isDefault: boolean;
  isVerified: boolean;
  blockchainMetadata?: {
    totalTransactionCount: number;
    lastSyncedAt?: Date;
  };
  anomalyDetection?: {
    isAnomaly: boolean;
    anomalyProbability: number;
    lastChecked?: Date;
  };
  createdAt: Date;
}

export interface BankAccountsResponse {
  success: boolean;
  message: string;
  data: {
    bankAccounts: BankAccount[];
    defaultAccount: BankAccount | null;
    totalBalance: number;
    totalMonthlyIncome: number;
    accountCount: number;
  };
}

export interface AddBankAccountData {
  accountNumber: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  country?: string;
  accountType?: 'savings' | 'current' | 'other';
  isDefault?: boolean;
}

export const useWorkerBankAccounts = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [defaultAccount, setDefaultAccount] = useState<BankAccount | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalMonthlyIncome, setTotalMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/workers/profile/bank-accounts') as any;
      
      if (response && response.data) {
        setAccounts(response.data.bankAccounts || []);
        setDefaultAccount(response.data.defaultAccount || null);
        setTotalBalance(response.data.totalBalance || 0);
        setTotalMonthlyIncome(response.data.totalMonthlyIncome || 0);
      } else {
        setAccounts([]);
        setDefaultAccount(null);
        setTotalBalance(0);
        setTotalMonthlyIncome(0);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch bank accounts';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (data: AddBankAccountData) => {
    try {
      await api.post('/workers/profile/bank-accounts', data);
      toast.success('Bank account added successfully');
      await fetchAccounts();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add bank account';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateAccount = async (accountId: string, data: Partial<AddBankAccountData>) => {
    try {
      await api.put(`/workers/profile/bank-accounts/${accountId}`, data);
      toast.success('Bank account updated successfully');
      await fetchAccounts();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update bank account';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteAccount = async (accountId: string) => {
    try {
      await api.delete(`/workers/profile/bank-accounts/${accountId}`);
      toast.success('Bank account deleted successfully');
      await fetchAccounts();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete bank account';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const setAsDefault = async (accountId: string) => {
    try {
      await api.put(`/workers/profile/bank-accounts/${accountId}/default`);
      toast.success('Default account updated');
      await fetchAccounts();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to set default account';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    defaultAccount,
    totalBalance,
    totalMonthlyIncome,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    setAsDefault,
    refetch: fetchAccounts
  };
};
