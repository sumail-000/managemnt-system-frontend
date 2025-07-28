import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard"

export default function AdminPanel() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          
          {/* Main Content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="flex-1 overflow-auto bg-muted/50 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </AdminAuthGuard>
  )
}