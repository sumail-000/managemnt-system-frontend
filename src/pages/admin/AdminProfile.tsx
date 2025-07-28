import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  User, 
  Shield, 
  Key, 
  Activity,
  Settings,
  Clock,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Edit,
  Save,
  Camera
} from "lucide-react"

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@company.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    role: "Super Administrator",
    department: "Platform Management",
    joinDate: "January 2023",
    lastLogin: "2 hours ago"
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: true,
    sessionTimeout: 60,
    ipRestriction: true,
    loginNotifications: true
  })

  const recentActivity = [
    {
      action: "User account suspended",
      target: "mike@freelance.com",
      timestamp: "2 hours ago",
      type: "user_action"
    },
    {
      action: "Generated monthly report",
      target: "Revenue Analytics",
      timestamp: "1 day ago",
      type: "report"
    },
    {
      action: "Product flagged for review",
      target: "Artisan Sourdough Bread",
      timestamp: "2 days ago",
      type: "moderation"
    },
    {
      action: "System settings updated",
      target: "API Rate Limits",
      timestamp: "3 days ago",
      type: "system"
    },
    {
      action: "User permissions modified",
      target: "sarah@startup.io",
      timestamp: "1 week ago",
      type: "user_action"
    }
  ]

  const permissions = [
    { module: "User Management", read: true, write: true, delete: true },
    { module: "Product Oversight", read: true, write: true, delete: true },
    { module: "Analytics", read: true, write: false, delete: false },
    { module: "System Settings", read: true, write: true, delete: false },
    { module: "Support Center", read: true, write: true, delete: false },
    { module: "Reports", read: true, write: true, delete: false }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_action":
        return <User className="h-4 w-4 text-blue-600" />
      case "report":
        return <Activity className="h-4 w-4 text-green-600" />
      case "moderation":
        return <Shield className="h-4 w-4 text-orange-600" />
      case "system":
        return <Settings className="h-4 w-4 text-purple-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information and security settings
          </p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Information */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/avatars/admin.png" alt="Admin" />
                    <AvatarFallback className="text-lg">AD</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{profile.name}</h3>
                  <p className="text-muted-foreground">{profile.role}</p>
                  <Badge className="mt-1">{profile.department}</Badge>
                </div>
              </div>

              <Separator />

              {/* Profile Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({...profile, location: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Account Information */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Joined</div>
                    <div className="text-sm text-muted-foreground">{profile.joinDate}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Last Login</div>
                    <div className="text-sm text-muted-foreground">{profile.lastLogin}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                </div>
                <Switch 
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, twoFactorEnabled: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">IP Address Restriction</div>
                  <div className="text-sm text-muted-foreground">Limit access to specific IP addresses</div>
                </div>
                <Switch 
                  checked={securitySettings.ipRestriction}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, ipRestriction: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Login Notifications</div>
                  <div className="text-sm text-muted-foreground">Get notified of new login attempts</div>
                </div>
                <Switch 
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, loginNotifications: checked})
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => 
                    setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})
                  }
                  className="w-32"
                />
              </div>

              <Button variant="outline" className="w-full">
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Module</TableHead>
                    <TableHead className="text-xs w-12">R</TableHead>
                    <TableHead className="text-xs w-12">W</TableHead>
                    <TableHead className="text-xs w-12">D</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((permission, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-xs font-medium">{permission.module}</TableCell>
                      <TableCell className="text-center">
                        {permission.read ? "✓" : "✗"}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.write ? "✓" : "✗"}
                      </TableCell>
                      <TableCell className="text-center">
                        {permission.delete ? "✓" : "✗"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.target}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}