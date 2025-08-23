import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { EnterpriseSidebarNew } from "./EnterpriseSidebarNew"
import { EnterpriseHeaderNew } from "./EnterpriseHeaderNew"
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"

interface NewEnterpriseLayoutProps {
  onUserMenuAction?: (action: string) => void
}

export function NewEnterpriseLayout({
  onUserMenuAction
}: NewEnterpriseLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    return paths.slice(1).map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' '),
      href: '/enterprise/' + paths.slice(1, index + 2).join('/')
    }))
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Sidebar */}
      <EnterpriseSidebarNew 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
        sidebarCollapsed ? "ml-20" : "ml-72"
      )}>
        {/* Header */}
        <EnterpriseHeaderNew 
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <div className="enterprise-header px-6 py-4 border-b border-border/40">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/enterprise" className="text-muted-foreground hover:text-foreground transition-colors">
                    Enterprise
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <BreadcrumbItem key={crumb.href}>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="text-foreground font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <>
                        <BreadcrumbLink href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                          {crumb.label}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}