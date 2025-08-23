import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Send } from 'lucide-react'
import { supportAPI } from '@/services/supportApi'

export default function SupportTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const canReply = ticket && (ticket.status === 'open' || ticket.status === 'pending')

  const load = async () => {
    if (!id) return
    try {
      setLoading(true)
      const res: any = await supportAPI.getTicket(id)
      setTicket(res.data?.ticket)
      setMessages(res.data?.messages || [])
    } catch (e) {
      // handle
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const send = async () => {
    if (!id || !text.trim() || !canReply) return
    try {
      await supportAPI.addMessage(id, text.trim())
      setText('')
      await load()
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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Support Ticket</h1>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : ticket ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="font-mono">#{ticket.ticket_number}</span>
                  {statusBadge(ticket.status)}
                  <Badge variant="outline" className="capitalize">{ticket.category}</Badge>
                  <Badge variant="secondary" className="capitalize">{ticket.priority}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold mb-2">{ticket.subject}</div>
                <Separator className="my-3" />
                <div className="space-y-3 max-h-[460px] overflow-y-auto p-1">
                  {messages.map((m) => (
                    <div key={m.id} className={`p-3 rounded-lg border ${m.is_admin ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{m.is_admin ? 'Support Team' : 'You'}</span>
                        <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-sm text-muted-foreground">No messages yet.</div>
                  )}
                </div>
                {canReply ? (
                  <div className="mt-4 space-y-2">
                    <Textarea placeholder="Type your message..." value={text} onChange={(e) => setText(e.target.value)} />
                    <div className="flex justify-end">
                      <Button onClick={send}><Send className="h-4 w-4 mr-2" /> Send</Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-muted-foreground">
                    This ticket is {ticket?.status}. Replies are disabled.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm mb-3">{ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '—'}</div>
                <div className="text-sm text-muted-foreground">Last update</div>
                <div className="text-sm">{ticket.last_reply_at ? new Date(ticket.last_reply_at).toLocaleString() : '—'}</div>
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
