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
import { productsAPI } from "@/services/api"
import { Product, transformProductFromAPI } from "@/types/product"



export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return
      
      setIsLoading(true)
      try {
        const response = await productsAPI.getById(id)
        setProduct(transformProductFromAPI(response))
      } catch (error: any) {
        console.error('Error loading product:', error)
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to load product details",
          variant: "destructive"
        })
        navigate("/products")
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id, toast, navigate])

  const handleTogglePin = async () => {
    if (!product || !id) return
    
    try {
      await productsAPI.togglePin(id)
      setProduct(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : null)
      toast({
        title: product.is_pinned ? "Product unpinned" : "Product pinned",
        description: `${product.name} has been ${product.is_pinned ? 'unpinned' : 'pinned'}.`
      })
    } catch (error: any) {
      console.error('Error toggling pin:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to toggle pin status",
        variant: "destructive"
      })
    }
  }

  const handleDuplicate = async () => {
    if (!product || !id) return
    
    try {
      await productsAPI.duplicate(id)
      toast({
        title: "Product duplicated",
        description: "A copy of this product has been created."
      })
      navigate("/products")
    } catch (error: any) {
      console.error('Error duplicating product:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to duplicate product",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!product || !id) return
    
    try {
      await productsAPI.delete(id)
      toast({
        title: "Product deleted",
        description: "The product has been moved to trash."
      })
      navigate("/products")
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete product",
        variant: "destructive"
      })
    }
  }

  const handleTogglePublic = async () => {
    if (!product) return
    
    try {
      const response = await productsAPI.update(product.id, {
        is_public: !product.is_public
      })
      
      setProduct(prev => prev ? { ...prev, is_public: !prev.is_public } : null)
      
      toast({
        title: product.is_public ? "Product made private" : "Product made public",
        description: product.is_public 
          ? "This product is no longer publicly accessible." 
          : "This product can now be shared publicly."
      })
    } catch (error: any) {
      console.error('Error toggling product visibility:', error)
      toast({
        title: "Error",
        description: "Failed to update product visibility. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleShare = () => {
    if (!product?.is_public) {
      toast({
        title: "Product is not public",
        description: "You need to make this product public before sharing it.",
        variant: "destructive"
      })
      return
    }
    
    const url = `${window.location.origin}/public/product/${id}`
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
            {product.is_pinned && (
              <Pin className="h-5 w-5 text-accent fill-current" />
            )}
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={product.status === "published" ? "default" : "secondary"}
          >
            {product.status === "published" ? "Published" : "Draft"}
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
                {product.is_pinned ? "Unpin" : "Pin"} Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTogglePublic}>
                {product.is_public ? (
                  <EyeOff className="h-4 w-4 mr-2" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {product.is_public ? "Make Private" : "Make Public"}
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
              {product.image ? (
                <img
                  src={product.image}
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
                  {product.serving_size} {product.serving_unit}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Servings per Container</Label>
                <p className="text-lg font-semibold">{product.servings_per_container}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total Size</Label>
                <p className="text-lg font-semibold">
                  {product.serving_size * product.servings_per_container} {product.serving_unit}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
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
                <Badge variant="secondary">{product.category?.name || 'No Category'}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={product.status === "published" ? "default" : "secondary"}>
                  {product.status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Visibility</span>
                <div className="flex items-center gap-1">
                  {product.is_public ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">{product.is_public ? "Public" : "Private"}</span>
                </div>
              </div>
              
              {!product.is_public && (
                <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Product is private</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleTogglePublic}
                      className="h-7 text-xs"
                    >
                      Make Public
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Make this product public to generate shareable links
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {new Date(product.updated_at).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>By {product.user.name}</span>
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
                {product.is_pinned ? "Unpin Product" : "Pin Product"}
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