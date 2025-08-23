import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  LayoutDashboard,
  Users,
  KeyRound,
  HardDriveUpload,
  Palette,
  FileCheck,
  ChartColumnIncreasing,
  Settings,
  ChevronDown,
  Building2,
  Zap,
  Menu
} from "lucide-react"

interface EnterpriseSidebarNewProps {
  collapsed: boolean
  onToggle: () => void
}

const iconMap = {
  LayoutDashboard,
  Users,
  KeyRound,
  HardDriveUpload,
  Palette,
  FileCheck,
  ChartColumnIncreasing,
  Settings,
  Building2,
  Zap
}

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", url: "/enterprise/dashboard", icon: "LayoutDashboard" }
    ]
  },
  {
    title: "Team & Access", 
    items: [
      { title: "Team Management", url: "/enterprise/team", icon: "Users" },
      { title: "API Management", url: "/enterprise/api", icon: "KeyRound" }
    ]
  },
  {
    title: "Content & Products",
    items: [
      { title: "Bulk Operations", url: "/enterprise/products", icon: "HardDriveUpload" },
      { title: "Brand Center", url: "/enterprise/brand", icon: "Palette" },
      { title: "Compliance Center", url: "/enterprise/compliance", icon: "FileCheck" }
    ]
  },
  {
    title: "Insights",
    items: [
      { title: "Analytics", url: "/enterprise/analytics", icon: "ChartColumnIncreasing" }
    ]
  },
  {
    title: "System", 
    items: [
      { title: "Settings", url: "/enterprise/settings", icon: "Settings" }
    ]
  }
]

export function EnterpriseSidebarNew({ collapsed, onToggle }: EnterpriseSidebarNewProps) {
  const location = useLocation()
  const [openGroups, setOpenGroups] = useState<string[]>(["Overview", "Team & Access", "Content & Products"])

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    )
  }

  const isActive = (url: string) => location.pathname === url

  return (
    <div className={cn(
      "fixed left-0 top-0 h-full enterprise-sidebar z-50 transition-all duration-300 ease-in-out",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                FoodSaaS
              </span>
              <span className="text-xs text-sidebar-foreground/70">
                Enterprise
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="p-4 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Collapse Menu</span>}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-2">
          {navigationGroups.map((group) => {
            const isGroupOpen = openGroups.includes(group.title)
            const hasActiveItem = group.items.some(item => isActive(item.url))

            return (
              <Collapsible
                key={group.title}
                open={isGroupOpen}
                onOpenChange={() => toggleGroup(group.title)}
              >
                {!collapsed && (
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-8 px-3 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                      <span className="font-medium uppercase tracking-wider">
                        {group.title}
                      </span>
                      <ChevronDown className={cn(
                        "w-3 h-3 transition-transform",
                        isGroupOpen ? "transform rotate-180" : ""
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                )}
                
                <CollapsibleContent className="space-y-1 mt-1">
                  {group.items.map((item) => {
                    const IconComponent = iconMap[item.icon as keyof typeof iconMap]
                    const itemIsActive = isActive(item.url)
                    
                    return (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        className={cn(
                          "enterprise-sidebar-item flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground",
                          itemIsActive && "active",
                          collapsed ? "justify-center" : "justify-start"
                        )}
                      >
                        <IconComponent className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && (
                          <span className="font-medium">
                            {item.title}
                          </span>
                        )}
                        {!collapsed && itemIsActive && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-sidebar-primary-foreground" />
                        )}
                      </NavLink>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center gap-3",
          collapsed ? "justify-center" : "justify-start"
        )}>
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400">
                Enterprise Plan
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}