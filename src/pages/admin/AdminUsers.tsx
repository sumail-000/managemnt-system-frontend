import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  MoreHorizontal, 
  UserPlus, 
  Ban, 
  Shield, 
  Trash2,
  Download,
  Filter,
  Eye
} from "lucide-react"

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState("")
  const [planFilter, setPlanFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@company.com",
      company: "Tech Corp",
      plan: "Enterprise",
      status: "active",
      registeredAt: "2024-01-15",
      lastActive: "2 hours ago",
      products: 45,
      avatar: "/avatars/01.png"
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah@startup.io",
      company: "Startup Inc",
      plan: "Pro",
      status: "active",
      registeredAt: "2024-02-20",
      lastActive: "1 day ago",
      products: 23,
      avatar: "/avatars/02.png"
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike@freelance.com",
      company: "Freelancer",
      plan: "Basic",
      status: "suspended",
      registeredAt: "2024-03-10",
      lastActive: "1 week ago",
      products: 8,
      avatar: "/avatars/03.png"
    },
    {
      id: 4,
      name: "Lisa Chen",
      email: "lisa@enterprise.com",
      company: "Enterprise Co",
      plan: "Enterprise",
      status: "active",
      registeredAt: "2024-01-05",
      lastActive: "30 minutes ago",
      products: 67,
      avatar: "/avatars/04.png"
    },
    {
      id: 5,
      name: "David Brown",
      email: "david@smallbiz.com",
      company: "Small Business",
      plan: "Pro",
      status: "inactive",
      registeredAt: "2023-12-15",
      lastActive: "2 weeks ago",
      products: 12,
      avatar: "/avatars/05.png"
    }
  ]

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "Enterprise":
        return <Badge className="bg-purple-100 text-purple-800">Enterprise</Badge>
      case "Pro":
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>
      case "Basic":
        return <Badge variant="secondary">Basic</Badge>
      default:
        return <Badge variant="outline">{plan}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>
      case "inactive":
        return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlan = planFilter === "all" || user.plan.toLowerCase() === planFilter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesPlan && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, subscriptions, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Users
          </Button>
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">2,456</div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-muted-foreground">Pro Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">708</div>
            <p className="text-xs text-muted-foreground">Enterprise Users</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Plan Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.company}</TableCell>
                  <TableCell>{getPlanBadge(user.plan)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{user.products}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.lastActive}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Ban className="mr-2 h-4 w-4" />
                          {user.status === "suspended" ? "Unsuspend" : "Suspend"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
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