import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Trash2, 
  Search, 
  Filter,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Info,
  CheckCircle
} from "lucide-react"
import { useNotifications } from "@/contexts/NotificationsContext"
import api from "@/services/api"

interface NotificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Map backend notification type => UI category and icon color
function mapTypeToCategory(type?: string) {
  const t = type || "system.info"
  if (t.endsWith(".created")) return "success" as const
  if (t.startsWith("security.")) return "warning" as const
  if (t === "system.info") return "info" as const
  return "info" as const
}

function getTypeIcon(category: "success" | "warning" | "info") {
  switch (category) {
    case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    case 'info': default: return <Info className="h-4 w-4 text-blue-500" />
  }
}

function getTypeBadgeClass(category: "success" | "warning" | "info") {
  const colors = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    info: "bg-blue-100 text-blue-800",
  }
  return colors[category]
}

export function NotificationModal({ open, onOpenChange }: NotificationModalProps) {
  const { notifications, markAsRead, markAllAsRead, refresh } = useNotifications()
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredNotifications = notifications.filter((n) => {
    const category = mapTypeToCategory(n.type)
    const matchesFilter = filter === "all" ||
      (filter === "unread" && !n.read_at) ||
      (filter === "read" && !!n.read_at) ||
      (filter === category)

    const q = searchQuery.trim().toLowerCase()
    const matchesSearch = !q ||
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q)

    return matchesFilter && matchesSearch
  })

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
    } catch {
      // ignore UI errors; context handles API fallback
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/user/notifications/${id}`)
      await refresh()
    } catch {
      // noop; could add toast in future
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications
          </DialogTitle>
          <DialogDescription>
            Manage your notification history and settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={async () => { await markAllAsRead() }} variant="outline" size="sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          </div>

          {/* Notifications Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.map((n) => {
                    const category = mapTypeToCategory(n.type)
                    return (
                      <TableRow 
                        key={n.id}
                        className={`${!n.read_at ? 'bg-accent/20' : ''}`}
                      >
                        <TableCell>
                          {!n.read_at && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(category)}
                            <Badge className={getTypeBadgeClass(category)}>
                              {category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{n.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {n.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {!n.read_at && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(String(n.id))}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(String(n.id))}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
