import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            © {currentYear} Tracient. All rights reserved.
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link 
            to="/privacy" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Privacy Policy
          </Link>
          <Link 
            to="/terms" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Terms of Service
          </Link>
          <Link 
            to="/help" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Help Center
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            Powered by Hyperledger Fabric
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
