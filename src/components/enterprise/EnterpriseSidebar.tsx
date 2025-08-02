import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  Package,
  Shield,
  Palette,
  Key,
  BarChart3,
  Settings,
  Building2,
  FileCheck,
  Upload,
  UserPlus,
  Workflow
} from "lucide-react"

const enterpriseNavigation = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/enterprise/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    title: "Team & Access",
    items: [
      { title: "Team Management", url: "/enterprise/team", icon: Users },
      { title: "API Management", url: "/enterprise/api", icon: Key },
    ]
  },
  {
    title: "Content & Products", 
    items: [
      { title: "Bulk Operations", url: "/enterprise/products", icon: Upload },
      { title: "Brand Center", url: "/enterprise/brand", icon: Palette },
      { title: "Compliance Center", url: "/enterprise/compliance", icon: FileCheck },
    ]
  },
  {
    title: "Insights",
    items: [
      { title: "Analytics", url: "/enterprise/analytics", icon: BarChart3 },
    ]
  },
  {
    title: "System",
    items: [
      { title: "Settings", url: "/enterprise/settings", icon: Settings },
    ]
  }
]

export function EnterpriseSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const isCollapsed = state === "collapsed"

  const isActive = (url: string) => location.pathname.startsWith(url)

  return (
    <Sidebar className={cn(
      "border-r-2 border-primary/10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
      isCollapsed ? "w-16" : "w-72"
    )}>
      <SidebarContent>
        {/* Enterprise Brand Header */}
        <div className={cn(
          "border-b border-primary/20 transition-all duration-300",
          isCollapsed ? "p-3 flex justify-center" : "p-6"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                  Enterprise
                </h2>
                <p className="text-xs text-slate-400">Admin Center</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4">
          {enterpriseNavigation.map((group) => (
            <SidebarGroup key={group.title} className="mb-6">
              {!isCollapsed && (
                <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-6">
                  {group.title}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1 px-3">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={({ isActive: linkIsActive }) =>
                            cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                              "hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20",
                              linkIsActive || isActive(item.url)
                                ? "bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 text-blue-200 border border-blue-400/30 shadow-lg shadow-blue-500/20"
                                : "text-slate-300 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-slate-600/50 hover:text-white border border-transparent",
                              isCollapsed && "justify-center px-2"
                            )
                          }
                        >
                          <item.icon className={cn(
                            "transition-all duration-200",
                            "group-hover:scale-110",
                            isActive(item.url) ? "text-blue-300 h-5 w-5" : "h-4 w-4"
                          )} />
                          {!isCollapsed && (
                            <span className="truncate">{item.title}</span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}