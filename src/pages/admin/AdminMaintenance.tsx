import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Settings, 
  Plus, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Database,
  Server,
  Shield,
  Zap
} from "lucide-react"

export default function AdminMaintenance() {
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  
  const maintenanceTasks = [
    {
      id: 1,
      title: "Database Optimization",
      description: "Optimize database indexes and clean up old data",
      type: "database",
      status: "completed",
      scheduledAt: "2024-01-15 02:00 AM",
      duration: "45 minutes",
      lastRun: "2024-01-15 02:45 AM"
    },
    {
      id: 2,
      title: "Security Updates",
      description: "Apply latest security patches and updates",
      type: "security",
      status: "scheduled",
      scheduledAt: "2024-01-20 03:00 AM",
      duration: "30 minutes",
      lastRun: "2024-01-08 03:30 AM"
    },
    {
      id: 3,
      title: "Server Cleanup",
      description: "Clean temporary files and optimize server performance",
      type: "server",
      status: "running",
      scheduledAt: "2024-01-16 01:00 AM",
      duration: "20 minutes",
      lastRun: "2024-01-09 01:20 AM"
    },
    {
      id: 4,
      title: "API Performance Tuning",
      description: "Optimize API endpoints and improve response times",
      type: "performance",
      status: "failed",
      scheduledAt: "2024-01-14 04:00 AM",
      duration: "60 minutes",
      lastRun: "2024-01-14 04:15 AM"
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'server': return <Server className="h-4 w-4" />
      case 'performance': return <Zap className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'running': return <Play className="h-4 w-4 text-blue-600" />
      case 'scheduled': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Pause className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Maintenance</h1>
          <p className="text-muted-foreground">
            Manage system maintenance tasks and schedules
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
            <Switch 
              id="maintenance-mode" 
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>
          <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Maintenance Task</DialogTitle>
                <DialogDescription>
                  Schedule a new maintenance task for your system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input id="task-title" placeholder="Enter task title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-type">Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="database">Database</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe the maintenance task..."
                    rows={3}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="scheduled-date">Scheduled Date</Label>
                    <Input id="scheduled-date" type="datetime-local" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input id="duration" placeholder="e.g., 30 minutes" />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsScheduleOpen(false)}>
                    Schedule Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {maintenanceMode && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Maintenance Mode Active</p>
                <p className="text-sm text-yellow-700">
                  The system is currently in maintenance mode. Users may experience limited functionality.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center space-x-2">
                        {getTypeIcon(task.type)}
                        <span>{task.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {task.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {task.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(task.status)}
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{task.scheduledAt}</TableCell>
                  <TableCell>{task.duration}</TableCell>
                  <TableCell>{task.lastRun}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {task.status === 'running' ? (
                        <Button variant="ghost" size="sm">
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm text-muted-foreground">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-muted-foreground">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm text-muted-foreground">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}