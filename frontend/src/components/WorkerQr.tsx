import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { issueQRToken, fetchWorkerAccount } from '@/services/qrService';
import toast from 'react-hot-toast';
import { Loader, Copy, Check } from 'lucide-react';

interface WorkerQrProps {
  workerHash: string;
  workerName?: string;
}

/**
 * WorkerQr Component
 * Displays a personalized QR code for a worker that can be scanned by a fake UPI payer
 * The QR encodes a signed JWT token valid for 5 minutes
 */
export default function WorkerQr({ workerHash, workerName }: WorkerQrProps) {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);
  const [workerDetails, setWorkerDetails] = useState<any>(null);

  const STORAGE_KEY = `qr_token_${workerHash}`;
  const STORAGE_URL_KEY = `qr_url_${workerHash}`;
  const STORAGE_PERMANENT_KEY = `qr_permanent_${workerHash}`;

  // Load existing token from localStorage on mount
  useEffect(() => {
    const loadWorkerDetails = async () => {
      try {
        const details = await fetchWorkerAccount(workerHash);
        setWorkerDetails(details);
      } catch (error) {
        console.warn('Could not fetch worker details:', error);
      }
    };

    const storedToken = localStorage.getItem(STORAGE_KEY);
    const storedUrl = localStorage.getItem(STORAGE_URL_KEY);
    const storedPermanent = localStorage.getItem(STORAGE_PERMANENT_KEY) === 'true';

    if (storedToken && storedUrl) {
      setQrToken(storedToken);
      setVerifyUrl(storedUrl);
      setIsPermanent(storedPermanent);
    }

    loadWorkerDetails();
  }, [workerHash, STORAGE_KEY, STORAGE_URL_KEY, STORAGE_PERMANENT_KEY]);


  const handleGenerateQR = async () => {
    setLoading(true);
    try {
      const response = await issueQRToken(workerHash, true); // true = permanent
      setQrToken(response.token);
      setVerifyUrl(response.verifyUrl);
      setIsPermanent(response.permanent);
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, response.token);
      localStorage.setItem(STORAGE_URL_KEY, response.verifyUrl);
      localStorage.setItem(STORAGE_PERMANENT_KEY, String(response.permanent));
      
      toast.success(`QR code generated successfully${response.permanent ? ' (permanent)' : ''}!`);
    } catch (error: any) {
      console.error('Error generating QR:', error);
      
      // Check if worker is not registered
      if (error.response?.status === 404 || error.message?.includes('not registered')) {
        toast.error('Worker account not registered. Please contact administrator.');
      } else {
        toast.error('Failed to generate QR code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQR = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_PERMANENT_KEY);
    setQrToken(null);
    setVerifyUrl(null);
    setIsPermanent(false);
    toast.success('QR code deleted');
  };

  const handleCopyToken = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Token copied to clipboard');
    }
  };

  const handleCopyVerifyUrl = () => {
    if (verifyUrl) {
      navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Verification URL copied to clipboard');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My UPI QR Code</h2>
        <p className="text-sm text-gray-600 mt-1">
          Share this QR code to receive payments via the mock UPI system
        </p>
      </div>

      {/* Worker Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 font-medium uppercase">Name</p>
            <p className="text-sm font-semibold text-gray-900">{workerName || 'Worker'}</p>
          </div>
          {workerDetails && (
            <>
              <div>
                <p className="text-xs text-gray-600 font-medium uppercase">Bank Account</p>
                <p className="text-sm font-mono text-gray-900">{workerDetails.bankAccount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium uppercase">Balance</p>
                <p className="text-sm font-semibold text-green-600">₹{workerDetails.balance.toFixed(2)}</p>
              </div>
              {workerDetails.phone && (
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase">Phone</p>
                  <p className="text-sm text-gray-900">{workerDetails.phone}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Generate Button */}
      {!qrToken ? (
        <button
          onClick={handleGenerateQR}
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition flex items-center justify-center gap-2"
        >
          {loading && <Loader size={18} className="animate-spin" />}
          {loading ? 'Generating...' : 'Generate QR Code'}
        </button>
      ) : (
        <>
          {/* QR Display */}
          <div className="mb-6 p-6 bg-gray-50 rounded-lg flex flex-col items-center">
            <QRCode
              value={qrToken}
              size={256}
              level="H"
              className="mb-4"
            />
            <p className="text-xs text-gray-600 text-center mb-2">
              Scan this code with a mock UPI app to send money
            </p>

            {/* Status Badge */}
            <div className="mt-4 text-center">
              {isPermanent ? (
                <p className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Permanent QR Code
                </p>
              ) : (
                <p className="text-sm font-semibold text-yellow-600">
                  ⚠ Temporary QR Code
                </p>
              )}
            </div>
          </div>

          {/* Token Display */}
          <div className="mb-4 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-2">Token (for testing)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrToken}
                readOnly
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded text-gray-700"
              />
              <button
                onClick={handleCopyToken}
                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 rounded transition"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Verification URL Display */}
          <div className="mb-6 p-3 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600 font-medium mb-2">Verification URL</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={verifyUrl || ''}
                readOnly
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-gray-300 rounded text-gray-700 overflow-x-auto"
              />
              <button
                onClick={handleCopyVerifyUrl}
                className="px-3 py-2 bg-gray-300 hover:bg-gray-400 rounded transition flex-shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">How to use:</span> Share the QR code with payers. They can scan it with a 
              mock UPI app. The verification URL shows worker details and simulates payment receipt. This QR code is saved and will persist across sessions.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleGenerateQR}
              className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Regenerate QR
            </button>
            <button
              onClick={handleDeleteQR}
              className="flex-1 py-2 px-4 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition"
            >
              Delete QR
            </button>
          </div>
        </>
      )}
    </div>
  );
}
