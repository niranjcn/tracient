import { Toaster, toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

// Toast container component
export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#374151',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
        },
      }}
    />
  );
};

// Custom toast functions
export const showToast = {
  success: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-up' : 'animate-fade-out'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-success-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{message}</p>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    ));
  },

  error: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-up' : 'animate-fade-out'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircle className="h-6 w-6 text-error-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{message}</p>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    ));
  },

  warning: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-up' : 'animate-fade-out'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-warning-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{message}</p>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    ));
  },

  info: (message: string, description?: string) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-slide-up' : 'animate-fade-out'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="h-6 w-6 text-primary-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">{message}</p>
              {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    ));
  },

  promise: <T,>(
    promise: Promise<T>,
    { loading, success, error }: { loading: string; success: string; error: string }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};

export default showToast;
