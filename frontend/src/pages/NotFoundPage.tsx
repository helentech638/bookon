import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-[#041c30] to-[#00806a] rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-6xl font-bold text-[#041c30] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md bg-[#00806a] hover:bg-[#006d5a] text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <Link
            to="/activities"
            className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00806a]"
          >
            <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
            Browse Activities
          </Link>
        </div>

        {/* Additional Help */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Need help? Try these options:
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to="/contact"
              className="text-sm text-[#00806a] hover:text-[#006d5a] font-medium"
            >
              Contact Support
            </Link>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <Link
              to="/help"
              className="text-sm text-[#00806a] hover:text-[#006d5a] font-medium"
            >
              Help Center
            </Link>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <button
              onClick={() => window.history.back()}
              className="text-sm text-[#00806a] hover:text-[#006d5a] font-medium flex items-center justify-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-1" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
