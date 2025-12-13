import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/common';
import { ROUTES } from '@/utils/constants';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <FileQuestion className="h-12 w-12 text-gray-400" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been 
          moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Link to={ROUTES.HOME}>
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Home Page
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
