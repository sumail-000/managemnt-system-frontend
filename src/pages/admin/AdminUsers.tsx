import { useState, useEffect } from "react"
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
  Ban, 
  Shield, 
  Trash2,
  Download,
  Eye
} from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { Link } from "react-router-dom"
import { usePaginatedUsers } from "@/hooks/usePaginatedUsers"
import { adminAPI } from "@/services/api"
import api from "@/services/api"
import { User } from "@/types/user"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

export default function AdminUsers() {
  const { users, pagination, filters, loading, applyFilters, refresh } = usePaginatedUsers(50); // Fetch 50 users for scrolling
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    pro_users: 0,
    enterprise_users: 0,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; userId: number | null }>({
    isOpen: false,
    userId: null,
  });
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ isOpen: boolean; userId: number | null }>({
    isOpen: false,
    userId: null,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response: any = await adminAPI.getUserStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleDeleteUser = async () => {
    if (deleteConfirmation.userId) {
      try {
        await adminAPI.deleteUser(deleteConfirmation.userId);
        toast({
          title: "Success",
          description: "User has been deleted successfully.",
        });
        refresh(); // Refresh the user list
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete user.",
          variant: "destructive",
        });
      } finally {
        setDeleteConfirmation({ isOpen: false, userId: null });
      }
    }
  };

  const handleResetPassword = async () => {
    if (resetPasswordDialog.userId) {
      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "Passwords do not match.",
          variant: "destructive",
        });
        return;
      }
      try {
        await adminAPI.resetPassword(resetPasswordDialog.userId, {
          password: newPassword,
          password_confirmation: confirmPassword,
        });
        toast({
          title: "Success",
          description: "User password has been reset successfully.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to reset user password.",
          variant: "destructive",
        });
      } finally {
        setResetPasswordDialog({ isOpen: false, userId: null });
        setNewPassword("");
        setConfirmPassword("");
      }
    }
  };

  const handleSuspendUser = async (userId: number) => {
    try {
      await adminAPI.suspendUser(userId);
      toast({
        title: "Success",
        description: "User suspension status has been updated.",
      });
      refresh(); // Refresh the user list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user suspension status.",
        variant: "destructive",
      });
    }
  };

  const getPlanBadge = (planName?: string) => {
    if (!planName) return <Badge variant="outline">N/A</Badge>;
    switch (planName) {
      case "Enterprise":
        return <Badge className="bg-purple-100 text-purple-800">Enterprise</Badge>
      case "Pro":
        return <Badge className="bg-blue-100 text-blue-800">Pro</Badge>
      case "Basic":
        return <Badge variant="secondary">Basic</Badge>
      default:
        return <Badge variant="outline">{planName}</Badge>
    }
  }

  const getStatusBadge = (user: User) => {
    if (user.is_suspended) {
      return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
    }
    switch (user.payment_status) {
      case "active":
      case "paid":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case "inactive":
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Inactive</Badge>
      default:
        return <Badge variant="outline">{user.payment_status}</Badge>
    }
  }

  const formatLastActive = (dateString?: string) => {
    if (!dateString) {
      return 'Never';
    }
    try {
      return `${formatDistanceToNow(new Date(dateString))} ago`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleExportUsers = async () => {
    try {
      setExporting(true);
      const perPage = 100;
      let page = 1;
      let allUsers: any[] = [];
      let lastPage = 1;

      do {
        const params: any = {
          page,
          per_page: perPage,
          search: filters.search || undefined,
          plan: filters.plan || undefined,
          status: filters.status || undefined,
          sort_by: filters.sortBy || 'created_at',
          sort_order: filters.sortOrder || 'desc',
        };
        const resp: any = await api.get('/admin/users', { params });
        if (!resp.success) break;
        allUsers = allUsers.concat(resp.data || []);
        lastPage = resp.pagination?.last_page || page;
        page++;
      } while (page <= lastPage);

      // Build CSV
      const headers = [
        'ID',
        'Name',
        'Email',
        'Company',
        'Plan',
        'Payment Status',
        'Suspended',
        'Products Count',
        'Last Active',
        'Created At'
      ];

      const rows = allUsers.map((u: any) => [
        u.id,
        sanitizeCsv(u.name),
        sanitizeCsv(u.email),
        sanitizeCsv(u.company || ''),
        sanitizeCsv(u.membership_plan?.name || ''),
        sanitizeCsv(u.payment_status || ''),
        u.is_suspended ? 'Yes' : 'No',
        u.products_count ?? 0,
        u.last_active_at ? new Date(u.last_active_at).toLocaleString() : 'Never',
        u.created_at ? new Date(u.created_at).toLocaleString() : ''
      ]);

      const csvContent = toCsv([headers, ...rows]);
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const ts = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const filename = `users_export_${ts.getFullYear()}-${pad(ts.getMonth()+1)}-${pad(ts.getDate())}_${pad(ts.getHours())}-${pad(ts.getMinutes())}.csv`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Export users failed', e);
      // Best-effort error toast
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (window as any)?.toast?.({ title: 'Export failed', description: e?.response?.data?.message || 'Could not export users' });
    } finally {
      setExporting(false);
    }
  };

  const sanitizeCsv = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const escaped = str.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  const toCsv = (rows: (string | number)[][]): string => rows.map(r => r.join(',')).join('\r\n');

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
          <Button variant="outline" size="sm" onClick={handleExportUsers} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export Users'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.active_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Active Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.pro_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pro Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{stats.enterprise_users.toLocaleString()}</div>
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
                value={filters.search || ''}
                onChange={(e) => applyFilters({ search: e.target.value })}
                className="pl-9"
              />
            </div>
            <Select value={filters.plan || "all"} onValueChange={(value) => applyFilters({ plan: value === 'all' ? undefined : value })}>
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
            <Select value={filters.status || "all"} onValueChange={(value) => applyFilters({ status: value === 'all' ? undefined : value })}>
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
          <CardTitle>Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] overflow-y-auto">
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : (
                  users.map((user: User) => (
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
                      <TableCell>{getPlanBadge(user.membership_plan?.name)}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>{user.products_count || 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatLastActive(user.last_active_at)}
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
                            <DropdownMenuItem asChild>
                              <Link to={`/admin-panel/users/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setResetPasswordDialog({ isOpen: true, userId: user.id })}>
                              <Shield className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleSuspendUser(user.id)}>
                              <Ban className="mr-2 h-4 w-4" />
                              {user.is_suspended ? "Unsuspend" : "Suspend"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setDeleteConfirmation({ isOpen: true, userId: user.id })}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={deleteConfirmation.isOpen} onOpenChange={(isOpen) => setDeleteConfirmation({ ...deleteConfirmation, isOpen })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user's account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation({ isOpen: false, userId: null })}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={resetPasswordDialog.isOpen} onOpenChange={(isOpen) => setResetPasswordDialog({ ...resetPasswordDialog, isOpen })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter a new password for the user.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" >
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirm-password" >
                Confirm Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
