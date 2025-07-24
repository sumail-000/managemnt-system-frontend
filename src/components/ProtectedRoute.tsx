import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Crown, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPlan?: 'basic' | 'pro' | 'enterprise';
  requiredFeature?: string;
}

const planHierarchy = {
  basic: 1,
  pro: 2,
  enterprise: 3,
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPlan = 'basic',
  requiredFeature 
}) => {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check membership plan access
  const userPlan = user.membership_plan?.name?.toLowerCase() || 'basic';
  const userPlanLevel = planHierarchy[userPlan as keyof typeof planHierarchy] || 1;
  const requiredPlanLevel = planHierarchy[requiredPlan];

  if (userPlanLevel < requiredPlanLevel) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Upgrade Required</h2>
              <p className="text-muted-foreground mb-4">
                This feature requires a {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan or higher.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Your current plan: {user.membership_plan?.name || 'Basic'}
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full"
                variant="gradient"
              >
                Upgrade Now
              </Button>
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check specific feature access
  if (requiredFeature && user.membership_plan?.features) {
      const hasFeature = user.membership_plan.features.includes(requiredFeature);
    if (!hasFeature) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Feature Not Available</h2>
                <p className="text-muted-foreground mb-4">
                  The feature "{requiredFeature}" is not included in your current plan.
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Your current plan: {user.membership_plan?.name || 'Basic'}
                </p>
              </div>
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/pricing'}
                  className="w-full"
                  variant="gradient"
                >
                  Upgrade Plan
                </Button>
                <Button 
                  onClick={() => window.history.back()}
                  variant="outline"
                  className="w-full"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // User has access, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;