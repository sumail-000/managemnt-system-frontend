import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Send, User, Mail, Calendar } from 'lucide-react'
import api from '@/services/api'

interface TicketDetail {
  id: number
  ticket_number: string
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'pending' | 'resolved' | 'closed'
  last_reply_at?: string
  created_at?: string
  user?: { id: number; name: string; email: string }
}

interface AdminMessage {
  id: number
  message: string
  is_admin: boolean
  author: { type: 'admin' | 'user'; id: number | null }
  created_at: string
}

export default function AdminSupportTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [replyStatus, setReplyStatus] = useState<'open' | 'pending' | 'resolved' | 'closed' | ''>('')

  const load = async () => {
    if (!id) return
    try {
      setLoading(true)
      const res: any = await api.get(`/admin/support/tickets/${id}`)
      const data = res.data || {}
      setTicket(data.ticket || null)
      setMessages(data.messages || [])
      setReplyStatus('')
      setReplyText('')
    } catch (e) {
      // no-op
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const sendReply = async () => {
    if (!ticket || !replyText.trim()) return
    try {
      await api.post(`/admin/support/tickets/${ticket.id}/reply`, {
        message: replyText.trim(),
        status: replyStatus || undefined,
      })
      await load()
      // notify list page to refresh
      try {
        window.dispatchEvent(new CustomEvent('adminSupportTicketUpdated', { detail: { id: ticket.id } }))
      } catch {}
    } catch (e) {}
  }

  const updateStatusOnly = async (status: 'open' | 'pending' | 'resolved' | 'closed') => {
    if (!ticket) return
    try {
      await api.patch(`/admin/support/tickets/${ticket.id}/status`, { status })
      await load()
      // notify list page to refresh
      try {
        window.dispatchEvent(new CustomEvent('adminSupportTicketUpdated', { detail: { id: ticket.id } }))
      } catch {}
    } catch (e) {}
  }

  const statusBadge = (status?: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-green-100 text-green-800">Open</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'resolved': return <Badge className="bg-blue-100 text-blue-800">Resolved</Badge>
      case 'closed': return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  const priorityBadge = (priority?: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-200 text-red-900">Urgent</Badge>
      case 'high': return <Badge className="bg-red-100 text-red-800">High</Badge>
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case 'low': return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default: return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Ticket</h1>
        </div>
        {ticket && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => updateStatusOnly('resolved')}>Mark Resolved</Button>
            <Button variant="outline" onClick={() => updateStatusOnly('closed')}>Close</Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : ticket ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Thread */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">#{ticket.ticket_number}</span>
                  {statusBadge(ticket.status)}
                  <Badge variant="outline" className="capitalize">{ticket.category}</Badge>
                  {priorityBadge(ticket.priority)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold mb-2">{ticket.subject}</div>
                <Separator className="my-3" />
                <div className="space-y-3 max-h-[520px] overflow-y-auto p-1">
                  {messages.map((m) => (
                    <div key={m.id} className={`p-3 rounded-lg border ${m.is_admin ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{m.is_admin ? 'Support Team' : ticket.user?.name || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground">No messages yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reply Composer */}
            <Card>
              <CardHeader>
                <CardTitle>Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea placeholder="Type your response..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                  <div className="flex items-center justify-between gap-3">
                    <Select value={replyStatus || undefined} onValueChange={(v) => setReplyStatus(v as any)}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Keep status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline"
                        disabled={!replyStatus}
                        onClick={() => replyStatus && updateStatusOnly(replyStatus)}
                      >
                        Update Status
                      </Button>
                      <Button variant="outline" onClick={() => ticket && updateStatusOnly('resolved')}>Mark Resolved</Button>
                      <Button onClick={sendReply}><Send className="mr-2 h-4 w-4" /> Send Reply</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: User & Meta */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm font-medium">{ticket.user?.name || 'Unknown'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">{ticket.user?.email || '—'}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Created:</span><span>{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '—'}</span></div>
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Last update:</span><span>{ticket.last_reply_at ? new Date(ticket.last_reply_at).toLocaleString() : '—'}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">Ticket not found</div>
      )}
    </div>
  )
}
