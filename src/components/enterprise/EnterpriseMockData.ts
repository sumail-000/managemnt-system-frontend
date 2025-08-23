// Mock data for enterprise dashboard
export const mockStore = {
  user: {
    name: "Enterprise Admin",
    email: "admin@company.com",
    role: "enterprise-admin" as const,
    avatar: null,
    initials: "EA"
  },
  notifications: {
    count: 3,
    unreadCount: 2
  },
  sidebar: {
    isCollapsed: false,
    defaultOpen: true
  }
};

export const mockQuery = {
  enterpriseStats: {
    totalUsers: 156,
    activeProjects: 23,
    monthlyUsage: 89.5,
    complianceScore: 94
  },
  navigationItems: [
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
};

export const mockRootProps = {
  currentPath: "/enterprise/dashboard",
  breadcrumbs: [
    { label: "Enterprise", href: "/enterprise" },
    { label: "Dashboard", href: "/enterprise/dashboard" }
  ]
};