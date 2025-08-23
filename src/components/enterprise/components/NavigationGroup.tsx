import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Users,
  KeyRound,
  HardDriveUpload,
  Palette,
  FileCheck,
  ChartColumnIncreasing,
  Settings,
} from "lucide-react"

const iconMap = {
  LayoutDashboard,
  Users,
  KeyRound,
  HardDriveUpload,
  Palette,
  FileCheck,
  ChartColumnIncreasing,
  Settings,
}

interface NavigationItem {
  title: string
  url: string
  icon: keyof typeof iconMap
}

interface NavigationGroupProps {
  title: string
  items: NavigationItem[]
}

export function NavigationGroup({ title, items }: NavigationGroupProps) {
  const { state } = useSidebar()
  const location = useLocation()
  const isCollapsed = state === "collapsed"

  const isActive = (url: string) => location.pathname.startsWith(url)

  return (
    <SidebarGroup className="mb-6">
      {!isCollapsed && (
        <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-6">
          {title}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1 px-3">
          {items.map((item) => {
            const IconComponent = iconMap[item.icon]
            return (
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
                    <IconComponent className={cn(
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
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}