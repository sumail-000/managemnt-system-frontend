import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  Trash2, 
  Pin, 
  Share2,
  Download,
  Package,
  Calendar,
  User,
  Tag,
  Eye,
  EyeOff,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  category: string
  status: "Published" | "Draft"
  isPinned: boolean
  isPublic: boolean
  tags: string[]
  servingSize: string
  servingUnit: string
  servingsPerContainer: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  thumbnail?: string
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - replace with actual API call
  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const mockProduct: Product = {
          id: id || "1",
          name: "Organic Greek Yogurt",
          description: "Creamy organic Greek yogurt made from grass-fed cow's milk with live and active cultures. Rich in protein and probiotics, this yogurt supports digestive health while providing a delicious, satisfying taste.",
          category: "Dairy",
          status: "Published",
          isPinned: true,
          isPublic: true,
          tags: ["Organic", "High Protein", "Gluten Free", "Probiotic", "Grass Fed"],
          servingSize: "150",
          servingUnit: "g",
          servingsPerContainer: 4,
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-20"),
          createdBy: "John Doe",
          thumbnail: "https://images.unsplash.com/photo-1571212515416-efbaeb7fb324?w=600&h=400&fit=crop"
        }
        
        setProduct(mockProduct)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadProduct()
    }
  }, [id, toast])

  const handleTogglePin = () => {
    if (product) {
      setProduct(prev => prev ? { ...prev, isPinned: !prev.isPinned } : null)
      toast({
        title: product.isPinned ? "Product unpinned" : "Product pinned",
        description: `${product.name} has been ${product.isPinned ? 'unpinned' : 'pinned'}.`
      })
    }
  }

  const handleDuplicate = () => {
    toast({
      title: "Product duplicated",
      description: "A copy of this product has been created."
    })
  }

  const handleDelete = () => {
    toast({
      title: "Product deleted",
      description: "The product has been moved to trash."
    })
    navigate("/products")
  }

  const handleShare = () => {
    const url = `${window.location.origin}/products/${id}/public`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link copied",
      description: "Public link has been copied to clipboard."
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <p className="text-muted-foreground mb-4">
            The product you're looking for doesn't exist or has been deleted.
          </p>
          <Button asChild>
            <Link to="/products">Back to Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {product.isPinned && (
              <Pin className="h-5 w-5 text-accent fill-current" />
            )}
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={product.status === "Published" ? "default" : "secondary"}
          >
            {product.status}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/products/${product.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleTogglePin}>
                <Pin className="h-4 w-4 mr-2" />
                {product.isPinned ? "Unpin" : "Pin"} Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Product
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{product.name}"? This action will move the product to trash.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild>
            <Link to={`/products/${product.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Product Image */}
          <Card>
            <CardContent className="p-0">
              {product.thumbnail ? (
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </CardContent>
          </Card>

          {/* Serving Information */}
          <Card>
            <CardHeader>
              <CardTitle>Serving Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Serving Size</Label>
                <p className="text-lg font-semibold">
                  {product.servingSize} {product.servingUnit}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Servings per Container</Label>
                <p className="text-lg font-semibold">{product.servingsPerContainer}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Size</Label>
                <p className="text-lg font-semibold">
                  {parseInt(product.servingSize) * product.servingsPerContainer} {product.servingUnit}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <Badge variant="secondary">{product.category}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={product.status === "Published" ? "default" : "secondary"}>
                  {product.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visibility</span>
                <div className="flex items-center gap-1">
                  {product.isPublic ? (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{product.isPublic ? "Public" : "Private"}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created {product.createdAt.toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {product.updatedAt.toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>By {product.createdBy}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleTogglePin}>
                <Pin className="w-4 h-4 mr-2" />
                {product.isPinned ? "Unpin Product" : "Pin Product"}
              </Button>
              
              <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Product
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              
              <Separator />
              
              <Button variant="outline" className="w-full justify-start" onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate Product
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}