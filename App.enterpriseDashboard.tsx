import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { EnterpriseLayout } from './src/components/enterprise/EnterpriseLayout'
import { DashboardContent } from './src/components/enterprise/components/DashboardContent'

function App() {
  const handleSearch = (query: string) => {
    console.log('Search query:', query)
  }

  const handleNotificationClick = () => {
    console.log('Notifications clicked')
  }

  const handleUserMenuAction = (action: string) => {
    console.log('User menu action:', action)
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route 
            path="/*" 
            element={
              <EnterpriseLayout
                onSearch={handleSearch}
                onNotificationClick={handleNotificationClick}
                onUserMenuAction={handleUserMenuAction}
              />
            }
          >
            <Route index element={<DashboardContent />} />
            <Route path="enterprise/dashboard" element={<DashboardContent />} />
            <Route path="enterprise/team" element={<div className="p-8"><h1 className="text-2xl font-bold">Team Management</h1><p className="text-muted-foreground">Manage your enterprise team members and permissions.</p></div>} />
            <Route path="enterprise/api" element={<div className="p-8"><h1 className="text-2xl font-bold">API Management</h1><p className="text-muted-foreground">Configure API keys and manage integrations.</p></div>} />
            <Route path="enterprise/products" element={<div className="p-8"><h1 className="text-2xl font-bold">Bulk Operations</h1><p className="text-muted-foreground">Perform bulk operations on products and data.</p></div>} />
            <Route path="enterprise/brand" element={<div className="p-8"><h1 className="text-2xl font-bold">Brand Center</h1><p className="text-muted-foreground">Customize your brand identity and styling.</p></div>} />
            <Route path="enterprise/compliance" element={<div className="p-8"><h1 className="text-2xl font-bold">Compliance Center</h1><p className="text-muted-foreground">Monitor and manage compliance requirements.</p></div>} />
            <Route path="enterprise/analytics" element={<div className="p-8"><h1 className="text-2xl font-bold">Analytics</h1><p className="text-muted-foreground">View detailed analytics and insights.</p></div>} />
            <Route path="enterprise/settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground">Configure system settings and preferences.</p></div>} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App