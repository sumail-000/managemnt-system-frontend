import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

interface UserAuthGuardProps {
  children: React.ReactNode
}

export function UserAuthGuard({ children }: UserAuthGuardProps) {
  const { user, admin, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // If admin is logged in (not regular user), redirect to admin panel
    if (!isLoading && admin && !user) {
      console.log('[USER_AUTH_GUARD] Admin user detected, redirecting to admin panel')
      navigate('/admin-panel')
    }
  }, [user, admin, isLoading, navigate])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If admin is logged in (not regular user), don't render user content (redirect will happen)
  if (admin && !user) {
    return null
  }

  // Regular user, render content
  return <>{children}</>
}