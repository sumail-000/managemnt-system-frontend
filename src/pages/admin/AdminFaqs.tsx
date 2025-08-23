import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { adminAPI } from '@/services/api'
import { Plus, Edit, Trash2, Search } from 'lucide-react'

interface Faq {
  id: number
  question: string
  answer: string
  category?: string
  created_at?: string
  updated_at?: string
}

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Faq | null>(null)
  const [form, setForm] = useState({ question: '', answer: '', category: '' })

  const fetchFaqs = async (page = 1) => {
    try {
      setLoading(true)
      const res: any = await adminAPI.getFaqs({ search: search || undefined, category: category !== 'all' ? category : undefined, page, per_page: 10 })
      setFaqs(res.data || [])
      setPagination(res.pagination || { current_page: 1, last_page: 1, total: (res.data || []).length })
    } catch (e) {
      setFaqs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchFaqs(1), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category])

  const openCreate = () => {
    setEditing(null)
    setForm({ question: '', answer: '', category: '' })
    setDialogOpen(true)
  }

  const openEdit = (faq: Faq) => {
    setEditing(faq)
    setForm({ question: faq.question, answer: faq.answer, category: faq.category || '' })
    setDialogOpen(true)
  }

  const saveFaq = async () => {
    try {
      if (editing) {
        await adminAPI.updateFaq(editing.id, form)
      } else {
        await adminAPI.createFaq(form)
      }
      setDialogOpen(false)
      await fetchFaqs(pagination.current_page)
    } catch (e) {}
  }

  const deleteFaq = async (faq: Faq) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      await adminAPI.deleteFaq(faq.id)
      await fetchFaqs(pagination.current_page)
    } catch (e) {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions displayed to users.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> New FAQ</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>FAQs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search questions or answers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
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

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map(faq => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium max-w-md">
                      <div className="line-clamp-2">{faq.question}</div>
                    </TableCell>
                    <TableCell>
                      {faq.category ? <Badge variant="outline" className="capitalize text-xs">{faq.category}</Badge> : '-'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {faq.updated_at ? new Date(faq.updated_at).toLocaleString() : ''}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(faq)}><Edit className="h-4 w-4 mr-1" /> Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteFaq(faq)}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Question</label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Answer</label>
              <Textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="min-h-[140px]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Category</label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g., general, billing, technical" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFaq}>{editing ? 'Save Changes' : 'Create FAQ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
