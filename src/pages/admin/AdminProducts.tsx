import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Flag, 
  Eye, 
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle,
  Package
} from "lucide-react"
import { adminAPI } from "@/services/api"
import { useToast } from "@/hooks/use-toast"

interface AdminProduct {
  id: number;
  name: string;
  status: 'draft' | 'published';
  is_public: boolean;
  created_at: string;
  is_flagged?: boolean;
  category?: { name: string } | null;
  user?: { name: string } | null;
}

export default function AdminProducts() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'public' | 'flagged'>("all")
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [pagination, setPagination] = useState({ total: 0 })
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ total: 0, public: 0, published: 0, draft: 0, flagged: 0 })
  const { toast } = useToast()

  const fetchMetrics = async () => {
    try {
      const res: any = await adminAPI.getProductMetrics()
      if (res.success) setMetrics(res.data)
    } catch (e) {
      console.error('Failed to fetch product metrics', e)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params: any = {
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        sort_by: 'created_at',
        sort_order: 'desc',
        page: 1,
        per_page: 50,
      }
      const res: any = await adminAPI.getProducts(params)
      if (res.success) {
        setProducts(res.data)
        setPagination({ total: res.pagination?.total || res.data.length })
      }
    } catch (e: any) {
      console.error('Failed to fetch products', e)
      toast({ title: 'Error', description: e.response?.data?.message || 'Failed to load products', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [searchTerm, categoryFilter, statusFilter])

  const getStatusBadge = (status: 'draft' | 'published', isPublic: boolean, isFlagged?: boolean) => {
    if (isFlagged) return <Badge className="bg-red-100 text-red-800">Flagged</Badge>
    if (isPublic) return <Badge className="bg-blue-100 text-blue-800">Public</Badge>
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Oversight</h1>
          <p className="text-muted-foreground">
            Monitor and moderate products across the platform
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Products
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStatusFilter('flagged')}>
            <Flag className="mr-2 h-4 w-4" />
            Flagged Products
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.total.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.public.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Public</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{(metrics.published + metrics.draft).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Publish/Draft</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{metrics.flagged.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
              <Flag className="h-8 w-8 text-red-600" />
            </div>
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
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Dairy">Dairy</SelectItem>
                <SelectItem value="Bakery">Bakery</SelectItem>
                <SelectItem value="Oils">Oils</SelectItem>
                <SelectItem value="Snacks">Snacks</SelectItem>
                <SelectItem value="Spreads">Spreads</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[520px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No products found</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="font-medium">{product.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{product.user?.name || 'Unknown'}</TableCell>
                    <TableCell>{product.category?.name || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(product.status, product.is_public, product.is_flagged)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const resp: any = await adminAPI.toggleProductFlag(product.id)
                              if (resp.success) {
                                await Promise.all([fetchProducts(), fetchMetrics()])
                                toast({ title: resp.message || 'Flag status updated' })
                              }
                            } catch (e: any) {
                              toast({ title: 'Error', description: e.response?.data?.message || 'Failed to update flag', variant: 'destructive' })
                            }
                          }}>
                            <Flag className="mr-2 h-4 w-4" />
                            {product.is_flagged ? 'Unflag' : 'Flag'} Product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Product
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
    </div>
  )
}
