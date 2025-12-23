import { useAuth } from '@/hooks/useAuth';
import WorkerQr from '@/components/WorkerQr';
import { useEffect, useState } from 'react';

export default function WorkerQRPage() {
  const { user } = useAuth();
  const [workerHash, setWorkerHash] = useState<string>('');

  useEffect(() => {
    // Use the user's idHash (Aadhaar hash) as the worker identifier
    // This is assigned at registration time and is pre-registered in the system
    if (user && user.idHash) {
      setWorkerHash(user.idHash);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">My UPI QR Code</h1>
          <p className="text-lg text-gray-600 mt-2">
            Generate and share your personalized QR code to receive payments
          </p>
        </div>

        {/* QR Component */}
        <div className="mb-8">
          <WorkerQr workerHash={workerHash} workerName={user.name} />
        </div>

        {/* Info Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* How It Works */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>Click "Generate QR Code" to create your personalized UPI QR</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <span>Share the QR code with payers (family, employers, friends)</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>They scan it with a mock UPI app to send you money</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>Payments are recorded on the blockchain for proof of income</span>
              </li>
            </ol>
          </div>

          {/* Security & Privacy */}
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Security & Privacy</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>QR tokens expire after 5 minutes for security</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Your Aadhaar/PAN is never exposed in the QR</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>All transactions are digitally signed and immutable</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Payment history is encrypted on the blockchain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Only government authorities can view aggregated data</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Test Instructions */}
        <div className="mt-8 p-6 bg-indigo-50 rounded-lg border border-indigo-200">
          <h2 className="text-xl font-bold text-indigo-900 mb-3">Testing the Mock UPI System</h2>
          <p className="text-sm text-indigo-800 mb-4">
            To test payments in this demo environment:
          </p>
          <ol className="space-y-2 text-sm text-indigo-800">
            <li>1. Generate a QR code above</li>
            <li>2. Copy the verification URL or use a QR scanner to see worker details</li>
            <li>3. Use the backend API or a test client to POST to <code className="bg-white px-2 py-1 rounded">/api/upi/receive</code></li>
            <li>4. Payments will be recorded and your balance will update (integration stage: on blockchain)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
