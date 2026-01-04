import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft, LogIn } from 'lucide-react';
import { Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

const Unauthorized: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <ShieldX className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-8">
          You don't have permission to access this page. Please contact your 
          administrator if you believe this is a mistake.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button onClick={() => window.history.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          {isAuthenticated ? (
            <Button variant="danger" onClick={handleLogout}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          ) : (
            <Link to={ROUTES.LOGIN}>
              <Button>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
        <Link 
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 mt-6 text-sm text-gray-500 hover:text-gray-700"
        >
          <Home className="h-4 w-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
