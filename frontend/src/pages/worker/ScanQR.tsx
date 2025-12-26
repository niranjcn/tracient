import React, { useState, useRef } from 'react';
import { Smartphone, QrCode, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Card, Alert, Input } from '@/components/common';
import { toast } from 'react-hot-toast';
import api from '@/services/api';

interface PaymentDetails {
  workerHash: string;
  accountId: string;
  bankName: string;
  accountHolderName: string;
  accountNumberMasked: string;
}

interface DepositResponse {
  success: boolean;
  message: string;
  transactionId: string;
  amount: number;
  bankName: string;
  accountHolderName: string;
  newBalance: number;
}

export default function ScanQRPage() {
  const [step, setStep] = useState<'input' | 'payment'>('input');
  const [qrToken, setQrToken] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositResult, setDepositResult] = useState<DepositResponse | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  const handleVerifyQR = async () => {
    if (!qrToken.trim()) {
      toast.error('Please enter a QR token');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/workers/qr/verify', {
        token: qrToken.trim()
      });

      setPaymentDetails(response.data);
      setStep('payment');
      setAmount('');
      toast.success('QR code verified successfully!');
      
      // Focus amount input
      setTimeout(() => amountInputRef.current?.focus(), 100);
    } catch (error: any) {
      console.error('Error verifying QR:', error);
      toast.error(error.message || 'Invalid QR token');
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!paymentDetails) {
      toast.error('Payment details missing');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/workers/qr/deposit', {
        token: qrToken.trim(),
        amount: parseFloat(amount)
      });

      setDepositResult(response.data);
      toast.success('Payment successful!');
    } catch (error: any) {
      console.error('Error making payment:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNewPayment = () => {
    setStep('input');
    setQrToken('');
    setAmount('');
    setPaymentDetails(null);
    setDepositResult(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Send Payment via QR Code</h1>
        <p className="text-gray-600">
          Scan or enter a QR token and make a payment to a worker's bank account
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          {/* Step 1: QR Input */}
          {step === 'input' && !depositResult && (
            <Card className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Enter QR Token</h2>
                <p className="text-gray-600">
                  Paste the QR token from the worker's QR code
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    QR Token
                  </label>
                  <textarea
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    placeholder="Paste the QR token here..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <Button
                  onClick={handleVerifyQR}
                  isLoading={loading}
                  disabled={!qrToken.trim() || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center gap-2"
                >
                  <QrCode size={20} />
                  Verify QR Code
                  <ArrowRight size={20} />
                </Button>
              </div>

              {/* Info */}
              <Alert variant="info">
                <AlertCircle size={20} />
                <div>
                  <strong>How to use:</strong>
                  <ul className="mt-2 ml-4 space-y-1 text-sm list-disc">
                    <li>Ask the worker to scan their QR code</li>
                    <li>Copy the QR token from their page</li>
                    <li>Paste it here and verify</li>
                    <li>Enter the payment amount</li>
                    <li>Complete the payment</li>
                  </ul>
                </div>
              </Alert>
            </Card>
          )}

          {/* Step 2: Payment Confirmation */}
          {step === 'payment' && paymentDetails && !depositResult && (
            <Card className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Confirm Payment</h2>
                <p className="text-gray-600">
                  Review the details and enter the payment amount
                </p>
              </div>

              {/* Recipient Info */}
              <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={20} />
                  QR Code Verified
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-green-700 font-medium uppercase">Recipient Name</p>
                    <p className="text-lg font-semibold text-green-900">{paymentDetails.accountHolderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium uppercase">Bank</p>
                    <p className="text-lg font-semibold text-green-900">{paymentDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 font-medium uppercase">Account Number</p>
                    <p className="text-lg font-mono text-green-900">{paymentDetails.accountNumberMasked}</p>
                  </div>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹)
                </label>
                <Input
                  ref={amountInputRef}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="1"
                  className="w-full text-lg font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum ₹1</p>
              </div>

              {/* Payment Methods Info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Payment Method:</strong> Mock UPI Transfer
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  This simulates a UPI payment. All transactions are recorded on the blockchain.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleNewPayment}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleMakePayment}
                  isLoading={loading}
                  disabled={!amount || parseFloat(amount) <= 0 || loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                >
                  Send ₹{amount || '0'}
                </Button>
              </div>
            </Card>
          )}

          {/* Success State */}
          {depositResult && (
            <Card className="p-8 space-y-6">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-600">Your payment has been processed</p>
              </div>

              {/* Receipt */}
              <div className="p-6 bg-gray-50 rounded-lg space-y-4 border-2 border-gray-200">
                <h3 className="font-semibold text-gray-900 text-lg">Transaction Receipt</h3>
                
                <div className="space-y-3 divide-y divide-gray-300">
                  <div className="flex justify-between pt-3">
                    <span className="text-gray-600">Transaction ID</span>
                    <span className="font-mono text-sm text-gray-900">{depositResult.transactionId}</span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-gray-600">Recipient</span>
                    <span className="font-semibold text-gray-900">{depositResult.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-gray-600">Bank Account</span>
                    <span className="font-semibold text-gray-900">{depositResult.bankName}</span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-gray-600">Amount Sent</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(depositResult.amount)}</span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-gray-600">New Account Balance</span>
                    <span className="font-bold text-lg text-green-600">{formatCurrency(depositResult.newBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <Alert variant="success">
                <CheckCircle size={20} />
                <span>Payment recorded on blockchain. The worker can view this transaction in their history.</span>
              </Alert>

              {/* Button */}
              <Button
                onClick={handleNewPayment}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Send Another Payment
              </Button>
            </Card>
          )}
        </div>

        {/* Sidebar: Steps */}
        <div>
          <Card className="p-6 sticky top-6">
            <h3 className="font-bold text-gray-900 mb-4">Payment Steps</h3>
            <div className="space-y-4">
              {[
                { num: 1, label: 'Enter QR Token', active: step === 'input' && !depositResult },
                { num: 2, label: 'Confirm Details', active: step === 'payment' && !depositResult },
                { num: 3, label: 'Payment Complete', active: !!depositResult }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 pb-4 ${
                    idx < 2 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      item.active
                        ? 'bg-blue-600 text-white'
                        : depositResult && idx < 2
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {item.num}
                  </div>
                  <div>
                    <p
                      className={`font-medium ${
                        item.active ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex gap-2 mb-2">
                <Smartphone size={20} className="text-blue-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-blue-900">Mock UPI System</p>
              </div>
              <p className="text-xs text-blue-800">
                This demonstrates a UPI payment flow. All transactions are securely recorded.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
