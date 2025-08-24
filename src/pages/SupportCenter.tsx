import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { useAuth } from '@/contexts/AuthContext'
import { X, Send, MessageCircle, Inbox, HelpCircle, ArrowLeft } from 'lucide-react'
import { useNotifications } from '@/contexts/NotificationsContext'

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

type Mode = 'home' | 'form'

export default function SupportCenter() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const planName = (user?.membership_plan?.name || 'Basic').toLowerCase()
  const canAccess = planName === 'pro' || planName === 'enterprise'

  if (!canAccess) {
    return (
      <Dialog open onOpenChange={() => navigate(-1)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Support Access Restricted</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            The Support Center is available for Pro and Enterprise plans. Your current plan is {user?.membership_plan?.name || 'Basic'}.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => navigate(-1)}>Go Back</Button>
            <Button onClick={() => navigate('/pricing')}>View Plans</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

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
  const [tempTicketId, setTempTicketId] = useState<number | null>(null)
  const cancelGuardRef = useRef(false)

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
    // Load tickets + faqs from API
    (async () => {
      try {
        setLoading(true)
        const [faqsRes, ticketsRes]: any = await Promise.all([
          (await import('@/services/supportApi')).supportAPI.listFaqs(),
          (await import('@/services/supportApi')).supportAPI.listTickets(25)
        ])
        setFaqs(faqsRes.data || [])
        setTickets(ticketsRes.data || [])
      } catch (e) {
        // Silent fail for now
      } finally {
        setLoading(false)
      }
    })()
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

  const startCreateFlow = async () => {
    setSelectedCategory('general')
    setSelectedPriority('low')
    setOpenSelectModal(true)
  }

  const confirmCreateFlow = async () => {
    try {
      // Create temporary ticket on server
      const { supportAPI } = await import('@/services/supportApi')
      const res: any = await supportAPI.startTicket({ category: selectedCategory, priority: selectedPriority as any })
      const id = res?.data?.id
      if (id) setTempTicketId(id)
      // Apply selection into form state
      setCategory(selectedCategory)
      setPriority(selectedPriority)
      setSubject('')
      setMessage('')
      setOpenSelectModal(false)
      setMode('form')
    } catch (e) {
      setOpenSelectModal(false)
    }
  }

  const onSubmitTicket = async () => {
    if (!subject.trim() || !message.trim() || !tempTicketId) return
    try {
      const { supportAPI } = await import('@/services/supportApi')
      await supportAPI.finalizeTicket(tempTicketId, { subject, message })
      cancelGuardRef.current = true // prevent cancel on unmount

      // Optimistically add a notification to the bell
      try {
        await addNotification({
          type: 'support_ticket_created',
          title: 'Support ticket created',
          message: `Your ticket has been created: ${subject}`,
          metadata: {
            temp_ticket_id: tempTicketId,
            category,
            priority,
          },
          link: '/support',
        })
      } catch {}

      setTempTicketId(null)
      // Reload recent tickets
      const ticketsRes: any = await supportAPI.listTickets(25)
      setTickets(ticketsRes.data || [])
      setMode('home')
    } catch (e) {}
  }

  // Cancel temporary ticket if user leaves without submission
  useEffect(() => {
    return () => {
      if (tempTicketId && !cancelGuardRef.current) {
        (async () => {
          try {
            const { supportAPI } = await import('@/services/supportApi')
            await supportAPI.cancelTicket(tempTicketId)
          } catch {}
        })()
      }
    }
  }, [tempTicketId])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page header with exit */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground text-sm">Create and manage support tickets. Browse FAQs.</p>
        </div>
        <Button variant="ghost" size="icon" allowWhenSuspended onClick={() => navigate(-1)} aria-label="Close Support Center">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* HOME MODE: Button + FAQs only */}
      {mode === 'home' && (
        <>
          <div className="mb-6">
            <Button allowWhenSuspended onClick={startCreateFlow}>
              <MessageCircle className="h-4 w-4 mr-2" /> Create Support Ticket
            </Button>
          </div>

          {/* My Tickets */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Inbox className="h-4 w-4" /> My Tickets</CardTitle>
            </CardHeader>
            <CardContent>
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
                      <Button variant="outline" size="sm" allowWhenSuspended onClick={() => navigate(`/support/tickets/${t.id}`)}>View</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((f) => (
                    <AccordionItem key={f.id} value={`faq-${f.id}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{f.question}</span>
                          {f.category ? (
                            <span className="ml-2 rounded bg-accent px-2 py-0.5 text-xs capitalize text-accent-foreground">{f.category}</span>
                          ) : null}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{f.answer}</div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" allowWhenSuspended onClick={async () => {
                // cancel temporary ticket
                if (tempTicketId) {
                  try {
                    const { supportAPI } = await import('@/services/supportApi')
                    await supportAPI.cancelTicket(tempTicketId)
                  } catch {}
                  setTempTicketId(null)
                }
                setMode('home')
              }}>Cancel</Button>
                          </div>
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
                <Button allowWhenSuspended onClick={onSubmitTicket}>
                  <Send className="h-4 w-4 mr-2" /> Submit Ticket
                </Button>
              </div>
              <Separator className="my-4" />
              <div className="text-xs text-muted-foreground">Ticket numbers are server-generated 6-digit IDs starting from 000001.</div>
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
            <Button variant="outline" allowWhenSuspended onClick={() => setOpenSelectModal(false)}>Cancel</Button>
            <Button allowWhenSuspended onClick={confirmCreateFlow}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
