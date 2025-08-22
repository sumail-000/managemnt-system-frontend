import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Settings,
  User,
  AlertTriangle,
  FileText,
  Activity,
  ChevronLeft,
  Shield,
  Bell,
  HelpCircle
} from "lucide-react"
import { adminAPI } from "@/services/api"
import { useEffect, useState } from "react"

interface AdminSidebarProps {
  open: boolean
  onToggle: () => void
}

export function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const location = useLocation()
  const [userCount, setUserCount] = useState(0)
  const [productCount, setProductCount] = useState(0)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [userRes, productMetrics]: [any, any] = await Promise.all([
          adminAPI.getUserStats(),
          adminAPI.getProductMetrics()
        ]);
        if (userRes?.success) setUserCount(userRes.data.total_users || 0);
        if (productMetrics?.success) setProductCount(productMetrics.data.total || 0);
      } catch (error) {
        console.error("Failed to fetch sidebar counts:", error);
      }
    };
    fetchCounts();
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin-panel",
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: "Users",
      href: "/admin-panel/users",
      icon: Users,
      badge: userCount.toLocaleString()
    },
    {
      name: "Products",
      href: "/admin-panel/products",
      icon: Package,
      badge: productCount > 0 ? productCount.toLocaleString() : undefined
    },
    {
      name: "Analytics",
      href: "/admin-panel/analytics",
      icon: BarChart3
    },
    {
      name: "Reports",
      href: "/admin-panel/reports",
      icon: FileText
    },
    {
      name: "System",
      href: "/admin-panel/system",
      icon: Settings,
      children: [
        { name: "Settings", href: "/admin-panel/system/settings" },
        { name: "Notifications", href: "/admin-panel/system/notifications" },
        { name: "Maintenance", href: "/admin-panel/system/maintenance" }
      ]
    },
    {
      name: "Support",
      href: "/admin-panel/support",
      icon: HelpCircle,
      badge: "12"
    }
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className={cn(
      "flex flex-col bg-card border-r border-border transition-all duration-300",
      open ? "w-64" : "w-16"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <div className={cn("flex items-center space-x-2", !open && "justify-center")}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          {open && (
            <div>
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", !open && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {navigation.map((item) => (
            <div key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive: navIsActive }) =>
                  cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href, item.exact) || navIsActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    !open && "justify-center"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {open && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
              
              {/* Sub-navigation */}
              {item.children && open && isActive(item.href) && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.name}
                      to={child.href}
                      className={({ isActive: navIsActive }) =>
                        cn(
                          "block rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                          navIsActive && "bg-accent text-accent-foreground"
                        )
                      }
                    >
                      {child.name}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <NavLink
          to="/admin-panel/profile"
          className={({ isActive }) =>
            cn(
              "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              !open && "justify-center"
            )
          }
        >
          <User className="h-4 w-4" />
          {open && <span>Profile</span>}
        </NavLink>
      </div>
    </div>
  )
}
