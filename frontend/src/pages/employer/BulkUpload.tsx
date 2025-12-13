import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Eye
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Button,
  FileUpload,
  Table,
  Badge,
  Alert,
  Modal,
  Spinner
} from '@/components/common';
import { showToast } from '@/components/common';
import { formatCurrency } from '@/utils/formatters';
import type { Column } from '@/components/common/Table';

interface UploadRecord {
  id: string;
  workerName: string;
  workerId: string;
  amount: number;
  date: string;
  status: 'valid' | 'error' | 'warning';
  error?: string;
}

const BulkUpload: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const mockRecords: UploadRecord[] = [
    { id: '1', workerName: 'Rajesh Kumar', workerId: 'W001', amount: 12500, date: '2024-06-15', status: 'valid' },
    { id: '2', workerName: 'Priya Sharma', workerId: 'W002', amount: 8500, date: '2024-06-15', status: 'valid' },
    { id: '3', workerName: 'Unknown Worker', workerId: 'W999', amount: 15000, date: '2024-06-15', status: 'error', error: 'Worker not found' },
    { id: '4', workerName: 'Lakshmi Devi', workerId: 'W004', amount: -1000, date: '2024-06-15', status: 'error', error: 'Invalid amount' },
    { id: '5', workerName: 'Suresh Babu', workerId: 'W005', amount: 95000, date: '2024-06-15', status: 'warning', error: 'Amount unusually high' },
    { id: '6', workerName: 'Anita Roy', workerId: 'W006', amount: 11000, date: '2024-06-15', status: 'valid' },
  ];

  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        showToast.error('Please upload a CSV or Excel file');
        return;
      }
      
      setFile(selectedFile);
      setRecords([]);
      setShowPreview(false);
    }
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setRecords(mockRecords);
      setShowPreview(true);
      showToast.success('File processed successfully');
    } catch (error) {
      showToast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    const validRecords = records.filter(r => r.status !== 'error');
    if (validRecords.length === 0) {
      showToast.error('No valid records to submit');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setUploadComplete(true);
      showToast.success(`${validRecords.length} wage records submitted to blockchain`);
    } catch (error) {
      showToast.error('Failed to submit records');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setRecords([]);
    setShowPreview(false);
    setUploadComplete(false);
  };

  const validCount = records.filter(r => r.status === 'valid').length;
  const warningCount = records.filter(r => r.status === 'warning').length;
  const errorCount = records.filter(r => r.status === 'error').length;
  const totalAmount = records.filter(r => r.status !== 'error').reduce((sum, r) => sum + r.amount, 0);

  const columns: Column<UploadRecord>[] = [
    {
      key: 'workerName',
      header: 'Worker Name',
      render: (record) => (
        <div>
          <p className="font-medium text-gray-900">{record.workerName}</p>
          <p className="text-xs text-gray-500">{record.workerId}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (record) => formatCurrency(record.amount),
    },
    {
      key: 'date',
      header: 'Date',
    },
    {
      key: 'status',
      header: 'Status',
      render: (record) => (
        <div className="flex items-center gap-2">
          <Badge
            variant={record.status === 'valid' ? 'success' : record.status === 'warning' ? 'warning' : 'error'}
          >
            {record.status === 'valid' && <CheckCircle className="h-3 w-3 mr-1" />}
            {record.status === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {record.status === 'error' && <XCircle className="h-3 w-3 mr-1" />}
            {record.status}
          </Badge>
          {record.error && (
            <span className="text-xs text-gray-500">{record.error}</span>
          )}
        </div>
      ),
    },
  ];

  if (uploadComplete) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bulk Upload Complete!
            </h2>
            <p className="text-gray-500 mb-6">
              {validCount + warningCount} wage records have been submitted to the blockchain.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                </div>
                <div>
                  <p className="text-gray-500">With Warnings</p>
                  <p className="text-2xl font-bold text-amber-600">{warningCount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{errorCount}</p>
                </div>
              </div>
              <div className="border-t mt-4 pt-4">
                <p className="text-gray-500">Total Amount Recorded</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/employer/payments')}>
                View Payments
              </Button>
              <Button onClick={handleReset}>
                Upload More
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Wages</h1>
          <p className="text-gray-500 mt-1">Upload multiple wage records at once</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>
                Upload a CSV or Excel file containing wage records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                accept={{
                  'text/csv': ['.csv'],
                  'application/vnd.ms-excel': ['.xls'],
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                }}
                maxSize={5 * 1024 * 1024}
                onFilesSelected={handleFileSelect}
              />

              {file && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        Remove
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleProcess}
                        isLoading={isProcessing}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Section */}
          {showPreview && records.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview Records</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="success">{validCount} valid</Badge>
                    <Badge variant="warning">{warningCount} warnings</Badge>
                    <Badge variant="error">{errorCount} errors</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table
                  data={records}
                  columns={columns}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          {showPreview && records.length > 0 && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
              <Button
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={validCount + warningCount === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit {validCount + warningCount} Records
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Format</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Your file should contain the following columns:
              </p>
              <ul className="space-y-2 text-sm">
                {[
                  { name: 'worker_id', desc: 'Worker ID (required)' },
                  { name: 'amount', desc: 'Payment amount (required)' },
                  { name: 'date', desc: 'Payment date (YYYY-MM-DD)' },
                  { name: 'payment_method', desc: 'bank_transfer, upi, cash' },
                  { name: 'work_type', desc: 'daily_wage, monthly, etc.' },
                  { name: 'hours', desc: 'Hours worked (optional)' },
                ].map((col) => (
                  <li key={col.name} className="flex items-start gap-2">
                    <code className="px-2 py-0.5 bg-gray-100 rounded text-xs">{col.name}</code>
                    <span className="text-gray-500">{col.desc}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Ensure worker IDs are registered in the system</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Amounts should be positive numbers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Dates should be in YYYY-MM-DD format</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Maximum 1000 records per upload</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Records</span>
                    <span className="font-medium">{records.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Valid Records</span>
                    <span className="font-medium text-green-600">{validCount + warningCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
