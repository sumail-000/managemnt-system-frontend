import React, { useState, useEffect } from 'react';
import { TokenManager } from '../../utils/tokenManager';
import { useAuth } from '../../contexts/AuthContext';

interface SessionDebuggerProps {
  show?: boolean;
}

export const SessionDebugger: React.FC<SessionDebuggerProps> = ({ show = false }) => {
  const { user, admin, userType, token } = useAuth();
  const [sessionInfo, setSessionInfo] = useState(TokenManager.getSessionInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionInfo(TokenManager.getSessionInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Session Debug Info</h3>
      
      <div className="mb-2">
        <strong>Current Context:</strong> {sessionInfo.currentContext}
      </div>
      
      <div className="mb-2">
        <strong>Auth Context:</strong>
        <div className="ml-2">
          <div>User Type: {userType || 'none'}</div>
          <div>User ID: {user?.id || admin?.id || 'none'}</div>
          <div>Email: {user?.email || admin?.email || 'none'}</div>
          <div>Has Token: {!!token}</div>
        </div>
      </div>

      <div className="mb-2">
        <strong>Admin Session:</strong>
        <div className="ml-2">
          <div>Has Token: {sessionInfo.admin.hasToken ? '✅' : '❌'}</div>
          <div>Is Expired: {sessionInfo.admin.isExpired ? '❌' : '✅'}</div>
          <div>Expires At: {sessionInfo.admin.expiresAt || 'N/A'}</div>
        </div>
      </div>

      <div className="mb-2">
        <strong>User Session:</strong>
        <div className="ml-2">
          <div>Has Token: {sessionInfo.user.hasToken ? '✅' : '❌'}</div>
          <div>Is Expired: {sessionInfo.user.isExpired ? '❌' : '✅'}</div>
          <div>Expires At: {sessionInfo.user.expiresAt || 'N/A'}</div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-600">
        <button
          onClick={() => {
            console.log('Full session info:', sessionInfo);
            console.log('Auth context:', { user, admin, userType, token });
          }}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Log to Console
        </button>
        
        <button
          onClick={() => {
            TokenManager.clearAllTokens();
            window.location.reload();
          }}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs ml-2"
        >
          Clear All Sessions
        </button>
      </div>
    </div>
  );
};