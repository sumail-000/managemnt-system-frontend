import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Shield, 
  Activity,
  Crown,
  Settings
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TeamManagement() {
  const teamMembers = [
    { id: 1, name: "Sarah Chen", email: "sarah@company.com", role: "Admin", status: "Active", lastActive: "2 hours ago" },
    { id: 2, name: "Mike Rodriguez", email: "mike@company.com", role: "Manager", status: "Active", lastActive: "5 minutes ago" },
    { id: 3, name: "Lisa Wang", email: "lisa@company.com", role: "Editor", status: "Active", lastActive: "1 day ago" },
    { id: 4, name: "David Kim", email: "david@company.com", role: "Viewer", status: "Pending", lastActive: "Never" },
    { id: 5, name: "Emma Brown", email: "emma@company.com", role: "Editor", status: "Inactive", lastActive: "1 week ago" },
  ]

  const getRoleBadge = (role: string) => {
    const colors = {
      Admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      Manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Editor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Viewer: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
    return colors[role as keyof typeof colors] || colors.Viewer
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      Inactive: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
    return colors[status as keyof typeof colors] || colors.Inactive
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Team Management
          </h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and permissions for your organization.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Members
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-muted-foreground">91% active rate</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">4% of total</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card className="border border-border/50 bg-gradient-to-br from-background to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your team members and their permissions</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search members..." className="pl-10 w-64" />
              </div>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Bulk Actions
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadge(member.role)}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(member.status)}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.lastActive}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Role</DropdownMenuItem>
                        <DropdownMenuItem>View Activity</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Remove Member</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}