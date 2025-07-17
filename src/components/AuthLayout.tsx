import { ReactNode } from "react"
import heroImage from "@/assets/hero-food-dashboard.jpg"

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground">FoodManager</h1>
            <p className="text-muted-foreground mt-2">Professional Food Management System</p>
          </div>

          {/* Form Header */}
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>

      {/* Right side - Hero Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <div className="relative z-10 flex items-center justify-center p-12">
          <div className="text-center text-white space-y-6">
            <img 
              src={heroImage} 
              alt="Food Management Dashboard" 
              className="rounded-2xl shadow-2xl max-w-lg w-full"
            />
            <div className="space-y-4">
              <h3 className="text-3xl font-bold">
                Streamline Your Food Management
              </h3>
              <p className="text-xl opacity-90 max-w-md mx-auto">
                Professional nutrition analysis, label generation, and compliance tracking for the food industry.
              </p>
              <div className="flex justify-center space-x-8 pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">1000+</div>
                  <div className="text-sm opacity-80">Products Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-sm opacity-80">Compliance Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">50+</div>
                  <div className="text-sm opacity-80">Countries Supported</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}