import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { 
  ArrowLeft, 
  Edit, 
  Pin, 
  Share2,
  Download,
  Package,
  Calendar,
  User,
  Tag,
  Eye,
  EyeOff
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { productsAPI, edamamAPI, collectionsAPI } from "@/services/api"
import { Product, transformProductFromAPI } from "@/types/product"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Zap, Heart, Leaf, Shield, QrCode, BarChart3, Plus } from "lucide-react"



export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [collections, setCollections] = useState<any[]>([])
  const [productCollections, setProductCollections] = useState<any[]>([])
  const [loadingCollections, setLoadingCollections] = useState(false)
e   const [selectedCollectionId, setSelectedCollectionId] = useState<string>('')
  const [addingCollection, setAddingCollection] = useState(false)
  


  // Load collections data
  const loadCollections = async () => {
    try {
      setLoadingCollections(true);
      const response = await collectionsAPI.getAll();
      console.log('=== ALL COLLECTIONS DEBUG ===');
      console.log('Collections API response:', response);
      console.log('Collections data:', response.data);
      setCollections(response.data || []);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!product) return;
    if (!selectedCollectionId) {
      toast({ title: "Select a collection", description: "Please select a collection to add this product to." });
      return;
    }
    try {
      setAddingCollection(true);
      await collectionsAPI.addProduct(String(selectedCollectionId), String(product.id));
      const added = collections.find((c: any) => String(c.id) === String(selectedCollectionId));
      if (added && !productCollections.some((pc: any) => String(pc.id) === String(added.id))) {
        setProductCollections(prev => [...prev, added]);
      }
      setSelectedCollectionId('');
      toast({ title: "Added to collection", description: `Product added to "${added?.name || 'collection'}".` });
    } catch (error: any) {
      console.error('Error adding to collection:', error);
      toast({ title: "Error", description: error.response?.data?.message || "Failed to add to collection", variant: "destructive" });
    } finally {
      setAddingCollection(false);
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return
      
      setIsLoading(true)
      try {
        const response = await productsAPI.getById(id)
        // Unwrap API response if wrapped as { success, data }
        const rawProduct = (response && typeof response === 'object' && 'data' in (response as any) && (response as any).success !== undefined)
          ? (response as any).data
          : response
        const transformedProduct = transformProductFromAPI(rawProduct)
        setProduct(transformedProduct)
        
        // Load additional data
        await loadCollections();
        
        // Extract product collections if available
        console.log('=== PRODUCT COLLECTIONS DEBUG ===');
        console.log('Raw API response:', response);
        console.log('Transformed product:', transformedProduct);
        console.log('Product collections:', transformedProduct.collections);
        
        if (transformedProduct.collections) {
          setProductCollections(transformedProduct.collections);
          console.log('Set productCollections to:', transformedProduct.collections);
        } else {
          console.log('No collections found in transformed product');
        }
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

  const handleGenerateQRCode = () => {
    if (!product?.is_public) {
      toast({
        title: "Product is not public",
        description: "You need to make this product public before generating QR code.",
        variant: "destructive"
      })
      return
    }
    
    const publicUrl = `${window.location.origin}/public/product/${id}`
    navigate('/qr-codes', {
      state: {
        productId: product.id,
        productName: product.name,
        publicUrl: publicUrl,
        presetContent: publicUrl,
        presetType: 'url'
      }
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
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Product Image and Description Side by Side */}
          <div className="grid gap-6 md:grid-cols-2">
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
          </div>

          {/* Ingredients Section - Now prominently displayed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.ingredients && product.ingredients.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid gap-2">
                    {product.ingredients.map((ingredient: any, index: number) => (
                      <div key={ingredient.id || index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="font-medium">{ingredient.name}</span>
                        {(ingredient.pivot?.amount || ingredient.pivot?.unit) && (
                          <Badge variant="outline">
                            {ingredient.pivot.amount} {ingredient.pivot.unit}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  {product.ingredient_notes && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Ingredient Notes</h4>
                      <p className="text-blue-800 text-sm">{product.ingredient_notes}</p>
                    </div>
                  )}
                </div>
              ) : product.ingredient_notes ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Ingredient Notes</h4>
                  <p className="text-blue-800 text-sm">{product.ingredient_notes}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Leaf className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No ingredients added yet</p>
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <Link to={`/products/${product.id}/edit`}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ingredients
                    </Link>
                  </Button>
                </div>
              )}
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

          {/* Nutrition (Per Serving) */}
          {(product as any).nutrition_data && (() => {
            const nd: any = (product as any).nutrition_data
            const per = nd.per_serving_data || {}
            const nutrients: any = per.nutrients_per_serving || {}
            const calories = per.calories_per_serving ?? per.calories ?? (nd.calories && product.servings_per_container ? Math.round(nd.calories / product.servings_per_container) : null)
            const servingSizeGrams = per.serving_size_grams ?? product.serving_size ?? null
            const fat = nutrients.FAT?.quantity ?? nd.macronutrients?.total_fat ?? null
            const satFat = nutrients.FASAT?.quantity ?? nd.macronutrients?.saturated_fat ?? null
            const carbs = nutrients.CHOCDF?.quantity ?? nd.macronutrients?.total_carbohydrate ?? null
            const sugars = nutrients.SUGAR?.quantity ?? nd.macronutrients?.total_sugars ?? null
            const protein = nutrients.PROCNT?.quantity ?? nd.macronutrients?.protein ?? null
            const sodium = nutrients.NA?.quantity ?? nd.macronutrients?.sodium ?? null
            return (
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition (per serving)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Calories</Label>
                      <p className="text-lg font-semibold">{calories ?? 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Serving Size</Label>
                      <p className="text-lg font-semibold">{servingSizeGrams ? `${servingSizeGrams} g` : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 mt-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Fat</Label>
                      <p className="font-medium">{fat !== null ? `${Math.round(fat * 100) / 100} g` : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Saturated Fat</Label>
                      <p className="font-medium">{satFat !== null ? `${Math.round(satFat * 100) / 100} g` : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Carbohydrates</Label>
                      <p className="font-medium">{carbs !== null ? `${Math.round(carbs * 100) / 100} g` : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Sugars</Label>
                      <p className="font-medium">{sugars !== null ? `${Math.round(sugars * 100) / 100} g` : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Protein</Label>
                      <p className="font-medium">{protein !== null ? `${Math.round(protein * 100) / 100} g` : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Sodium</Label>
                      <p className="font-medium">{sodium !== null ? `${Math.round(sodium * 100) / 100} mg` : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

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



          {/* 3. Removed Safety & Compliance - moved to end */}

          {/* 4. Functional Integration - Removed Collections & duplicate Quick Actions */}
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
                  <span>By {product.user?.name || 'Unknown'}</span>
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
              <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Product
              </Button>

              <Button variant="outline" className="w-full justify-start" onClick={handleTogglePublic}>
                {product.is_public ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                {product.is_public ? 'Make Private' : 'Make Public'}
              </Button>
              

              
              {product.is_public && (
                <Button variant="outline" className="w-full justify-start" onClick={handleGenerateQRCode}>
                  <QrCode className="w-4 h-4 mr-2" />
                  Generate QR Code
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Collections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCollections ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : productCollections && productCollections.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {productCollections.map((collection: any) => (
                      <Badge key={collection.id} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                    >
                      <option value="">Select collection</option>
                      {collections
                        .filter((c: any) => !productCollections.some((pc: any) => String(pc.id) === String(c.id)))
                        .map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={handleAddToCollection} disabled={addingCollection || !selectedCollectionId}>
                      <Plus className="h-4 w-4 mr-2" />
                      {addingCollection ? 'Adding...' : 'Add to Collection'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-muted-foreground text-sm">Not in any collections</div>
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      value={selectedCollectionId}
                      onChange={(e) => setSelectedCollectionId(e.target.value)}
                    >
                      <option value="">Select collection</option>
                      {collections.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" className="whitespace-nowrap" onClick={handleAddToCollection} disabled={addingCollection || !selectedCollectionId}>
                      <Plus className="h-4 w-4 mr-2" />
                      {addingCollection ? 'Adding...' : 'Add to Collection'}
                    </Button>
                  </div>
                </div>
              )}
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