import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/utils/helpers';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/utils/formatters';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  accept = {
    'text/csv': ['.csv'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
  },
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  disabled = false,
  className,
  label,
  helperText,
  error,
}) => {
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { file: File; errors: { message: string }[] }[]) => {
      setUploadError(null);

      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((f) => f.errors[0]?.message).join(', ');
        setUploadError(errors);
        return;
      }

      const newFiles = multiple ? [...files, ...acceptedFiles].slice(0, maxFiles) : acceptedFiles;
      setFiles(newFiles);
      onFilesSelected(newFiles);
    },
    [files, multiple, maxFiles, onFilesSelected]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    maxSize,
    multiple,
    disabled,
  });

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}

      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && !isDragReject && 'border-primary-500 bg-primary-50',
          isDragReject && 'border-error-500 bg-error-50',
          !isDragActive && !isDragReject && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          (error || uploadError) && 'border-error-500'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div
            className={cn(
              'p-3 rounded-full',
              isDragActive ? 'bg-primary-100 text-primary-500' : 'bg-gray-100 text-gray-400'
            )}
          >
            <Upload className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? (
                'Drop files here'
              ) : (
                <>
                  <span className="text-primary-500">Click to upload</span> or drag and drop
                </>
              )}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {Object.values(accept)
                .flat()
                .map((ext) => ext.toUpperCase())
                .join(', ')}{' '}
              up to {formatFileSize(maxSize)}
            </p>
          </div>
        </div>
      </div>

      {/* Selected files */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {(error || uploadError) && (
        <p className="mt-2 flex items-center gap-1 text-sm text-error-500">
          <AlertCircle className="h-4 w-4" />
          {error || uploadError}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && !uploadError && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default FileUpload;
