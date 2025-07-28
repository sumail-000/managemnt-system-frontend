import { useState } from "react"
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Settings, 
  QrCode,
  FileText,
  BarChart3,
  Shield,
  Heart,
  Search,
  Plus,
  ChefHat,
  Tag
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Products", url: "/products", icon: Package },
  { title: "Add Product", url: "/products/new", icon: Plus },

]

const managementItems = [
  { title: "Recipe Search", url: "/recipe-search", icon: ChefHat },
  { title: "Category Management", url: "/categories", icon: Tag },
  { title: "Nutrition Analysis", url: "/nutrition", icon: BarChart3 },
  { title: "Label Generator", url: "/labels", icon: FileText },
  { title: "QR Codes", url: "/qr-codes", icon: QrCode },
  { title: "Favorites", url: "/favorites", icon: Heart },
]

const systemItems = [
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Admin Panel", url: "/admin", icon: Shield },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = isActive 
      ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm" 
      : "transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
    
    const hoverClasses = isCollapsed 
      ? "hover:bg-green-500/10 hover:text-green-600" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
    
    return `${baseClasses} ${!isActive ? hoverClasses : ""}`
  }

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar
      className={`${isCollapsed ? "w-14" : "w-64"} transition-all duration-300 ease-in-out hover:shadow-lg border-r border-sidebar-border/50`}
      collapsible="icon"
    >
      <SidebarContent>
        {/* Logo Section */}
        <div className={`border-b border-sidebar-border transition-all duration-200 hover:bg-sidebar-accent/20 ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-2 transition-all duration-200 hover:scale-105">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center hover:shadow-md transition-all duration-200 hover:scale-110">
                <Package className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground hover:text-sidebar-primary transition-colors duration-200">FoodManager</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center hover:shadow-md transition-all duration-200 hover:scale-110">
              <Package className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management Tools */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Management</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System */}
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>System</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}