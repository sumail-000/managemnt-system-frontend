import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  Calendar,
  Filter,
  Megaphone,
} from "lucide-react"
import api from "@/services/api"
import { useNavigate } from "react-router-dom"

interface AdminTicket {
  id: number
  ticket_number: string
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  created_at: string
  updated_at: string
  last_reply_at?: string
  messages_count?: number
  user?: { id: number; name: string; email: string }
}

interface AdminMessage {
  id: number
  message: string
  is_admin: boolean
  author: { type: 'admin' | 'user'; id: number | null }
  created_at: string
}

export default function AdminSupport() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  const [viewOpen, setViewOpen] = useState(false)
  const [activeTicket, setActiveTicket] = useState<AdminTicket | null>(null)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [replyText, setReplyText] = useState("")
  const [replyStatus, setReplyStatus] = useState<'open' | 'pending' | 'resolved' | 'closed' | ''>('')
  const navigate = useNavigate()

  // Announcement modal state
  const [announceOpen, setAnnounceOpen] = useState(false)
  const [announceTitle, setAnnounceTitle] = useState("")
  const [announceMessage, setAnnounceMessage] = useState("")
  const [announceSending, setAnnounceSending] = useState(false)

  // Fetch tickets with filters
  const fetchTickets = async (page: number = 1) => {
    try {
      setLoading(true)
      const params: any = { page, per_page: 25 }
      if (searchTerm.trim()) params.search = searchTerm.trim()
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      if (categoryFilter !== 'all') params.category = categoryFilter
      const res: any = await api.get('/admin/support/tickets', { params })
      setTickets(res.data || [])
      setPagination(res.pagination || { current_page: 1, last_page: 1, total: (res.data || []).length })
    } catch (e) {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchTickets(1), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter])

  const loadTicketDetail = async (ticket: AdminTicket) => {
    try {
      const res: any = await api.get(`/admin/support/tickets/${ticket.id}`)
      const data = res.data || {}
      setActiveTicket(data.ticket || ticket)
      setMessages(data.messages || [])
      setReplyStatus('')
      setReplyText("")
      setViewOpen(true)
    } catch (e) {}
  }

  const sendReply = async () => {
    if (!activeTicket || !replyText.trim()) return
    try {
      await api.post(`/admin/support/tickets/${activeTicket.id}/reply`, {
        message: replyText.trim(),
        status: replyStatus || undefined,
      })
      // Reload thread
      await loadTicketDetail(activeTicket)
      // Refresh list for last_reply_at/status changes
      await fetchTickets(pagination.current_page)
    } catch (e) {}
  }

  const updateStatusOnly = async (status: 'open' | 'pending' | 'resolved' | 'closed') => {
    if (!activeTicket) return
    try {
      await api.patch(`/admin/support/tickets/${activeTicket.id}/status`, { status })
      await loadTicketDetail(activeTicket)
      await fetchTickets(pagination.current_page)
    } catch (e) {}
  }

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
      case "urgent":
        return <Badge className="bg-red-200 text-red-900">Urgent</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const supportStats = useMemo(() => {
    const counts = { open: 0, pending: 0, resolved: 0, high: 0 }
    tickets.forEach(t => {
      // @ts-ignore
      counts[t.status] = (counts as any)[t.status] + 1 || 1
      if (t.priority === 'high' || t.priority === 'urgent') counts.high += 1
    })
    return [
      { label: "Open Tickets", value: String(counts.open), icon: MessageCircle, color: "text-blue-600" },
      { label: "Pending Response", value: String(counts.pending), icon: Clock, color: "text-yellow-600" },
      { label: "Resolved (page)", value: String(counts.resolved), icon: CheckCircle, color: "text-green-600" },
      { label: "High/Urgent", value: String(counts.high), icon: AlertCircle, color: "text-red-600" }
    ]
  }, [tickets])

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
          <Button variant="default" size="sm" onClick={() => setAnnounceOpen(true)}>
            <Megaphone className="mr-2 h-4 w-4" />
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
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Support Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Last Reply</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">{ticket.ticket_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{ticket.user?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{ticket.user?.name || 'Unknown'}</div>
                          <div className="text-xs text-muted-foreground">{ticket.user?.email || ''}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium text-sm truncate">{ticket.subject}</div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <MessageCircle className="h-3 w-3" />
                          <span>{ticket.messages_count ?? 0} messages</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ticket.last_reply_at ? new Date(ticket.last_reply_at).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin-panel/support/${ticket.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    {/* Announcement Dialog */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Title</label>
              <Input
                placeholder="Announcement title"
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Message</label>
              <Textarea
                placeholder="Write the announcement message..."
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
                className="min-h-[140px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnounceOpen(false)} disabled={announceSending}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!announceTitle.trim() || !announceMessage.trim()) return;
                try {
                  setAnnounceSending(true)
                  await api.post('/admin/announcements', {
                    title: announceTitle.trim(),
                    message: announceMessage.trim(),
                    type: 'announcement',
                  })
                  // Reset form and close
                  setAnnounceTitle("")
                  setAnnounceMessage("")
                  setAnnounceOpen(false)
                } catch (e) {
                  // Optionally show a toast
                } finally {
                  setAnnounceSending(false)
                }
              }}
              disabled={announceSending}
            >
              {announceSending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
