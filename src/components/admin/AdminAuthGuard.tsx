import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, AlertTriangle, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const { user, admin, isLoading } = useAuth()
  const navigate = useNavigate()
  const [ipRestricted, setIpRestricted] = useState(false)

  useEffect(() => {
    // Check for IP restriction error in URL params
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('ip_restricted') === 'true') {
      setIpRestricted(true)
      return
    }

    // If not loading and no user or admin, redirect to login
    if (!isLoading && !user && !admin) {
      navigate('/login?redirect=admin-panel&message=admin_access_required')
    }
  }, [user, admin, isLoading, navigate])

  // If IP restricted, redirect to IP restriction error page
  if (ipRestricted) {
    navigate('/admin/ip-restricted')
    return null
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If no user or admin, show access denied (shouldn't reach here due to redirect)
  if (!user && !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <p className="text-muted-foreground">
              Please log in to access the admin panel
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/login?redirect=admin-panel')}
              className="w-full"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user is an admin (must be logged in as admin, not regular user)
  if (!admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive text-destructive-foreground">
                <Shield className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Access Required</CardTitle>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel. Only administrators can access this area.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Current User:</strong> {user?.name || 'Unknown'} ({user?.email || 'Unknown'})
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Account Type:</strong> Regular User
                </p>
              </div>
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
                variant="outline"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin is authenticated
  return <>{children}</>
}