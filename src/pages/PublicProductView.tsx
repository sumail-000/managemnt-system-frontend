import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { 
  ArrowLeft, 
  Package,
  Calendar,
  User,
  Tag,
  Eye,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { productsAPI } from "@/services/api"
import { Product, transformProductFromAPI } from "@/types/product"

export default function PublicProductView() {
  const { id } = useParams()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return
      
      setIsLoading(true)
      setError(null)
      try {
        // Get the product directly by ID from the public endpoint
        const response = await productsAPI.getPublicById(id)
        // Transform the API response to Product type
        setProduct(transformProductFromAPI(response.data))
      } catch (error: any) {
        console.error('Error loading public product:', error)
        setError(error.message || "Failed to load product")
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
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
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product not found</h2>
            <p className="text-muted-foreground mb-4">
              {error || "The product you're looking for doesn't exist or is not public."}
            </p>
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Public View</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <ExternalLink className="h-3 w-3" />
                Public Product
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Product Title */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">{product.name}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>By {product.user?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
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
                    <label className="text-sm font-medium text-muted-foreground">Serving Size</label>
                    <p className="text-lg font-semibold">
                      {product.serving_size} {product.serving_unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Servings per Container</label>
                    <p className="text-lg font-semibold">{product.servings_per_container}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Size</label>
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
                          <Tag className="h-3 w-3 mr-1" />
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
              {/* Product Information */}
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
                    <Badge variant={product.status === "published" ? "default" : "secondary"}>
                      {product.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Visibility</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Public</span>
                    </div>
                  </div>

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
                      <span>By {product.user?.name || 'Unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Call to Action */}
              <Card>
                <CardHeader>
                  <CardTitle>Interested in creating your own?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Create and manage your own nutrition labels with our platform.
                  </p>
                  <Button asChild className="w-full">
                    <Link to="/register">
                      Get Started
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link to="/login">
                      Sign In
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}