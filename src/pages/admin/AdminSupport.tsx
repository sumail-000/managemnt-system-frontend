import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Search, 
  MessageCircle, 
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  User,
  Calendar,
  Filter
} from "lucide-react"

export default function AdminSupport() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedTicket, setSelectedTicket] = useState<any>(null)

  const supportTickets = [
    {
      id: "TK-2024-001",
      user: "John Doe",
      email: "john@company.com",
      subject: "Unable to generate nutrition labels",
      status: "open",
      priority: "high",
      category: "Technical",
      createdAt: "2024-01-25 10:30",
      lastReply: "2 hours ago",
      assignee: "Support Team",
      messages: 3
    },
    {
      id: "TK-2024-002",
      user: "Sarah Wilson",
      email: "sarah@startup.io",
      subject: "Billing question about Pro plan",
      status: "pending",
      priority: "medium",
      category: "Billing",
      createdAt: "2024-01-24 14:15",
      lastReply: "1 day ago",
      assignee: "Finance Team",
      messages: 5
    },
    {
      id: "TK-2024-003",
      user: "Mike Johnson",
      email: "mike@freelance.com",
      subject: "Account suspended - need assistance",
      status: "resolved",
      priority: "high",
      category: "Account",
      createdAt: "2024-01-23 09:45",
      lastReply: "3 days ago",
      assignee: "Admin Team",
      messages: 8
    },
    {
      id: "TK-2024-004",
      user: "Lisa Chen",
      email: "lisa@enterprise.com",
      subject: "Feature request: Bulk export functionality",
      status: "open",
      priority: "low",
      category: "Feature Request",
      createdAt: "2024-01-22 16:20",
      lastReply: "5 hours ago",
      assignee: "Product Team",
      messages: 2
    },
    {
      id: "TK-2024-005",
      user: "David Brown",
      email: "david@smallbiz.com",
      subject: "API integration help needed",
      status: "pending",
      priority: "medium",
      category: "Technical",
      createdAt: "2024-01-21 11:30",
      lastReply: "6 hours ago",
      assignee: "Dev Team",
      messages: 4
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-100 text-green-800">Open</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "resolved":
        return <Badge className="bg-blue-100 text-blue-800">Resolved</Badge>
      case "closed":
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case "low":
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const filteredTickets = supportTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const supportStats = [
    { label: "Open Tickets", value: "23", icon: MessageCircle, color: "text-blue-600" },
    { label: "Pending Response", value: "8", icon: Clock, color: "text-yellow-600" },
    { label: "Resolved Today", value: "15", icon: CheckCircle, color: "text-green-600" },
    { label: "High Priority", value: "4", icon: AlertCircle, color: "text-red-600" }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground">
            Manage customer support tickets and inquiries
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Advanced Filters
          </Button>
          <Button size="sm">
            <Send className="mr-2 h-4 w-4" />
            Send Announcement
          </Button>
        </div>
      </div>

      {/* Support Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {supportStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Support Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Last Reply</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">{ticket.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{ticket.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{ticket.user}</div>
                        <div className="text-xs text-muted-foreground">{ticket.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium text-sm truncate">{ticket.subject}</div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <MessageCircle className="h-3 w-3" />
                        <span>{ticket.messages} messages</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{ticket.assignee}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ticket.lastReply}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Ticket {ticket.id}</DialogTitle>
                          <DialogDescription>
                            {ticket.subject}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{ticket.user.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{ticket.user}</div>
                                <div className="text-sm text-muted-foreground">{ticket.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{ticket.user}</span>
                                <span className="text-xs text-muted-foreground">{ticket.createdAt}</span>
                              </div>
                              <p className="text-sm">
                                Hi support team, I'm having trouble generating nutrition labels for my products. 
                                The system seems to be stuck on the loading screen. Can you please help?
                              </p>
                            </div>
                            
                            <div className="p-3 rounded-lg border bg-blue-50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">Support Team</span>
                                <span className="text-xs text-muted-foreground">2 hours ago</span>
                              </div>
                              <p className="text-sm">
                                Thank you for reaching out. We've identified the issue and our team is working on a fix. 
                                We'll update you as soon as it's resolved.
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Textarea placeholder="Type your response..." />
                            <div className="flex items-center justify-between">
                              <Select defaultValue="pending">
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="open">Open</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button>
                                <Send className="mr-2 h-4 w-4" />
                                Send Reply
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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