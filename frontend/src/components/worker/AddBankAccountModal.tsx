import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Modal, Input, Select, Button } from '@/components/common';

const bankAccountSchema = z.object({
  accountNumber: z.string().min(9, 'Account number must be at least 9 digits').max(18, 'Account number too long'),
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  bankName: z.string().min(2, 'Bank name is required'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g., HDFC0001234)'),
  country: z.string().default('IN'),
  accountType: z.enum(['savings', 'current', 'other']).default('savings'),
  isDefault: z.boolean().default(false)
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BankAccountFormData) => Promise<void>;
}

const countryOptions = [
  { value: 'IN', label: 'India 🇮🇳' },
  { value: 'US', label: 'United States 🇺🇸' },
  { value: 'GB', label: 'United Kingdom 🇬🇧' },
  { value: 'AU', label: 'Australia 🇦🇺' },
  { value: 'CA', label: 'Canada 🇨🇦' },
  { value: 'NZ', label: 'New Zealand 🇳🇿' }
];

const accountTypeOptions = [
  { value: 'savings', label: 'Savings Account' },
  { value: 'current', label: 'Current Account' },
  { value: 'other', label: 'Other' }
];

export default function AddBankAccountModal({ isOpen, onClose, onSubmit }: AddBankAccountModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      country: 'IN',
      accountType: 'savings',
      isDefault: false
    }
  });

  const handleFormSubmit = async (data: BankAccountFormData) => {
    try {
      // Convert IFSC to uppercase
      data.ifscCode = data.ifscCode.toUpperCase();
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to add account:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Bank Account</h2>
            <p className="text-sm text-gray-600 mt-1">Account will be linked to your Aadhaar automatically</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          {/* Account Holder Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name *
            </label>
            <input
              {...register('accountHolderName')}
              type="text"
              placeholder="Enter full name as per bank"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.accountHolderName && (
              <p className="text-red-500 text-sm mt-1">{errors.accountHolderName.message}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <input
              {...register('accountNumber')}
              type="text"
              placeholder="Enter bank account number"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.accountNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.accountNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.accountNumber.message}</p>
            )}
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name *
            </label>
            <input
              {...register('bankName')}
              type="text"
              placeholder="e.g., HDFC Bank, State Bank of India"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.bankName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.bankName && (
              <p className="text-red-500 text-sm mt-1">{errors.bankName.message}</p>
            )}
          </div>

          {/* IFSC Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code *
            </label>
            <input
              {...register('ifscCode')}
              type="text"
              placeholder="HDFC0001234"
              maxLength={11}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase ${
                errors.ifscCode ? 'border-red-500' : 'border-gray-300'
              }`}
              onChange={(e) => setValue('ifscCode', e.target.value.toUpperCase())}
            />
            {errors.ifscCode && (
              <p className="text-red-500 text-sm mt-1">{errors.ifscCode.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">11 characters: First 4 letters (bank code), 5th is 0, last 6 are branch code</p>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <select
              {...register('country')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {countryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              {...register('accountType')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {accountTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Set as Default */}
          <div className="flex items-center">
            <input
              {...register('isDefault')}
              type="checkbox"
              id="isDefault"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
              Set as default account for wage payments
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This account will be automatically linked to your Aadhaar number for secure verification.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
