import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { EnterpriseSidebar } from "./EnterpriseSidebar"
import { EnterpriseHeader } from "./EnterpriseHeader"
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"

export function EnterpriseLayout() {
  const location = useLocation()
  
  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    return paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' '),
      href: '/' + paths.slice(0, index + 1).join('/')
    }))
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <SidebarProvider defaultOpen>
      <EnterpriseSidebar />
      <SidebarInset>
        <div className="flex flex-col min-h-svh overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <EnterpriseHeader />

          {/* Breadcrumb Navigation */}
          <div className="border-b border-border/40 bg-background/60 backdrop-blur-sm px-6 py-3">
            <Breadcrumb>
              <BreadcrumbList>
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

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}