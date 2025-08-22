import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { X, Send, MessageCircle, Inbox, HelpCircle, ArrowLeft } from 'lucide-react'

// UI-only for now; backend wiring (tickets, messages, FAQs) will be added next.

interface Ticket {
  id: number
  ticket_number: string // 6-digit, server-generated e.g., 000001
  subject: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'pending' | 'resolved' | 'closed'
  last_reply_at?: string
}

interface Faq {
  id: number
  question: string
  answer: string
  category?: string
}

type Mode = 'home' | 'form' | 'recent'

export default function SupportCenter() {
  const navigate = useNavigate()

  // Modes & modal
  const [mode, setMode] = useState<Mode>('home')
  const [openSelectModal, setOpenSelectModal] = useState(false)

  // Preselection in modal
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('low')

  // Create ticket form state
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('low')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [faqs, setFaqs] = useState<Faq[]>([])

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'billing', label: 'Billing' },
    { value: 'technical', label: 'Technical' },
    { value: 'account', label: 'Account' },
    { value: 'api', label: 'API' }
  ]

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  useEffect(() => {
    // Simulate fetch tickets + faqs
    setLoading(true)
    setTimeout(() => {
      setTickets([
        { id: 2, ticket_number: '000122', subject: 'Payment not reflected', category: 'billing', priority: 'medium', status: 'open', last_reply_at: new Date(Date.now() - 3600 * 1000).toISOString() },
        { id: 1, ticket_number: '000121', subject: 'Cannot generate label', category: 'technical', priority: 'high', status: 'pending', last_reply_at: new Date().toISOString() },
      ])
      setFaqs([
        { id: 1, question: 'How do I create a nutrition label?', answer: 'Go to Products > select a product > Analyze nutrition > open Label Customization.' },
        { id: 2, question: 'How to upgrade my plan?', answer: 'Navigate to Billing and choose your desired plan then complete payment.' },
        { id: 3, question: 'Why can’t I generate QR codes?', answer: 'QR codes require a Pro or higher plan. Please check your current membership.' },
      ])
      setLoading(false)
    }, 300)
  }, [])

  const statusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Open</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formattedTime = (iso?: string) => {
    if (!iso) return '—'
    try {
      const d = new Date(iso)
      return d.toLocaleString()
    } catch {
      return iso
    }
  }

  const startCreateFlow = () => {
    setSelectedCategory('general')
    setSelectedPriority('low')
    setOpenSelectModal(true)
  }

  const confirmCreateFlow = () => {
    // Apply preselection into form state
    setCategory(selectedCategory)
    setPriority(selectedPriority)
    setSubject('')
    setMessage('')
    setOpenSelectModal(false)
    setMode('form')
  }

  const onSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) return
    // TODO: backend POST; after success switch to recent view or show confirmation
    setMode('recent')
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header with exit */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground text-sm">Create and manage support tickets. Browse FAQs.</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Close Support Center">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* HOME MODE: Button + FAQs only */}
      {mode === 'home' && (
        <>
          <div className="mb-6">
            <Button onClick={startCreateFlow}>
              <MessageCircle className="h-4 w-4 mr-2" /> Create Support Ticket
            </Button>
          </div>

          {/* FAQs under the button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading FAQs...</div>
              ) : faqs.length === 0 ? (
                <div className="text-sm text-muted-foreground">No FAQs available.</div>
              ) : (
                <div className="space-y-4">
                  {faqs.map((f) => (
                    <div key={f.id} className="p-3 rounded-lg border">
                      <div className="font-medium">{f.question}</div>
                      <div className="text-sm text-muted-foreground mt-1">{f.answer}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* FORM MODE: Create ticket form, with ability to view recent tickets */}
      {mode === 'form' && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Create Support Ticket</h2>
            <Button variant="ghost" size="sm" onClick={() => setMode('recent')}>
              View recent support tickets
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Category</label>
                  <Select value={category} onValueChange={(v) => setCategory(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-muted-foreground">Subject</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" />
              </div>

              <div className="mt-3">
                <label className="text-xs text-muted-foreground">Message</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue or request..." className="min-h-[160px]" />
              </div>

              <div className="flex justify-end mt-4">
                <Button onClick={onSubmitTicket}>
                  <Send className="h-4 w-4 mr-2" /> Submit Ticket
                </Button>
              </div>
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground">Ticket numbers are server-generated 6-digit IDs starting from 000001.</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* RECENT MODE: list with back to form */}
      {mode === 'recent' && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setMode('form')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to form
              </Button>
              <h2 className="text-lg font-semibold">Recent Tickets</h2>
            </div>
          </div>
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Inbox className="h-4 w-4" /> No tickets yet.
                </div>
              ) : (
                <div className="divide-y rounded-md border">
                  {tickets.map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-accent/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">#{t.ticket_number}</span>
                            {statusBadge(t.status)}
                            <Badge variant="outline" className="text-xs capitalize">{t.category}</Badge>
                            <Badge variant="secondary" className="text-xs capitalize">{t.priority}</Badge>
                          </div>
                          <div className="text-sm">{t.subject}</div>
                          <div className="text-xs text-muted-foreground">Last update: {formattedTime(t.last_reply_at)}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selection modal for category & priority */}
      <Dialog open={openSelectModal} onOpenChange={setOpenSelectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Priority</label>
              <Select value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSelectModal(false)}>Cancel</Button>
            <Button onClick={confirmCreateFlow}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
