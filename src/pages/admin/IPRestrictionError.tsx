import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

const IPRestrictionError: React.FC = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h1>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center space-x-2 text-amber-600 bg-amber-50 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">IP Address Not Authorized</span>
            </div>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              Your IP address is not authorized to access the admin panel. This security measure helps protect sensitive administrative functions.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-gray-900 text-sm mb-2">What you can do:</h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Verify you're connecting from an authorized network</li>
                <li>• Check if your IP address has changed</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Return to Login
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Security incident logged • {new Date().toLocaleString()}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default IPRestrictionError;