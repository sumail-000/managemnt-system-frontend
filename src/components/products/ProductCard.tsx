import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  MoreHorizontal, 
  Pin, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Calendar,
  Package,
  Heart
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { cn } from "@/lib/utils"
import { ProductCamelCase as Product } from "@/types/product"
import { productsAPI } from "@/services/api"

interface ProductCardProps {
  product: Product
  selected: boolean
  onSelect: (checked: boolean) => void
  variant?: "default" | "compact"
  onRefresh?: () => void
}

export function ProductCard({ product, selected, onSelect, variant = "default", onRefresh }: ProductCardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [currentTagIndex, setCurrentTagIndex] = useState(0)
  const [productTags, setProductTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const hasFetchedTags = useRef<boolean>(false)

  // Reset fetch flag when product changes
  useEffect(() => {
    hasFetchedTags.current = false
    setProductTags([])
    setCurrentTagIndex(0)
    console.log(`[ProductCard Debug] Product "${product.name}" (ID: ${product.id}) original tags:`, product.tags)
    console.log(`[ProductCard Debug] Product "${product.name}" (ID: ${product.id}) will fetch specific tags via API`)
    console.log(`[ProductCard Debug] Product "${product.name}" (ID: ${product.id}) has nutrition data:`, !!product.nutritionData)
  }, [product.id]) // Reset when product changes

  // Fetch tags for this specific product (only once per product ID)
  useEffect(() => {
    const fetchProductTags = async () => {
      // Only fetch if we haven't fetched for this product yet and not currently loading
      if (product.id && !hasFetchedTags.current && !tagsLoading) {
        hasFetchedTags.current = true
        setTagsLoading(true)
        try {
          // Get tags specific to this product
          const response = await productsAPI.getProductTags(product.id)
          console.log(`[ProductCard Debug] Raw API response for "${product.name}" (ID: ${product.id}):`, response)
          console.log(`[ProductCard Debug] API response type:`, typeof response, 'Is array:', Array.isArray(response))
          console.log(`[ProductCard Debug] API response.data:`, response?.data, 'Is array:', Array.isArray(response?.data))
          
          // Handle the API response structure - response.data contains the tags array
          let productSpecificTags = Array.isArray(response?.data) ? response.data :
                                   Array.isArray(response) ? response : []
          
          // Fallback: If API returns empty tags, try to extract from product's nutrition data
          if (productSpecificTags.length === 0 && product.nutritionData) {
            console.log(`[ProductCard Debug] API returned empty tags for "${product.name}", trying fallback from product nutrition data`)
            console.log(`[ProductCard Debug] Product nutrition data structure:`, product.nutritionData)
            const fallbackTags = []
            if (product.nutritionData.health_labels && Array.isArray(product.nutritionData.health_labels)) {
              fallbackTags.push(...product.nutritionData.health_labels)
              console.log(`[ProductCard Debug] Found health_labels:`, product.nutritionData.health_labels)
            }
            if (product.nutritionData.diet_labels && Array.isArray(product.nutritionData.diet_labels)) {
              fallbackTags.push(...product.nutritionData.diet_labels)
              console.log(`[ProductCard Debug] Found diet_labels:`, product.nutritionData.diet_labels)
            }
            productSpecificTags = [...new Set(fallbackTags)] // Remove duplicates
            console.log(`[ProductCard Debug] Fallback tags extracted for "${product.name}":`, productSpecificTags)
          }
          
          console.log(`[ProductCard Debug] FINAL: Product "${product.name}" (ID: ${product.id}) specific tags:`, productSpecificTags)
          console.log(`[ProductCard Debug] FINAL: Product "${product.name}" tags count:`, productSpecificTags.length)
          
          // Display product-specific tags from the API response
          setProductTags(productSpecificTags) // Show product-specific tags only (no test data)
        } catch (error) {
          console.error('Error fetching product tags:', error)
          setProductTags([])
          hasFetchedTags.current = false // Reset on error to allow retry
        } finally {
          setTagsLoading(false)
        }
      }
    }

    fetchProductTags()
  }, [product.id]) // Only depend on product.id

  // Rotating recipe tags effect (only for grid view)
  useEffect(() => {
    if (variant === "default" && productTags && productTags.length > 1) {
      const interval = setInterval(() => {
        setCurrentTagIndex((prevIndex) => 
          (prevIndex + 1) % productTags.length
        )
      }, 1500) // 1.5 seconds

      return () => clearInterval(interval)
    } else {
      // Reset index when tags change or variant changes
      setCurrentTagIndex(0)
    }
  }, [variant, productTags.length]) // Only depend on length, not the array itself

  const handlePin = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await productsAPI.togglePin(product.id)
      toast({
        title: product.isPinned ? "Product unpinned" : "Product pinned",
        description: `${product.name} has been ${product.isPinned ? 'unpinned' : 'pinned'}.`
      })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error toggling pin:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to toggle pin status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFavorite = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await productsAPI.toggleFavorite(product.id)
      toast({
        title: product.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `${product.name} has been ${product.isFavorite ? 'removed from' : 'added to'} favorites.`
      })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error toggling favorite:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to toggle favorite status",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    navigate(`/products/${product.id}/edit`)
  }

  const handleDuplicate = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await productsAPI.duplicate(product.id)
      toast({
        title: "Product duplicated",
        description: `${product.name} has been duplicated successfully.`
      })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error duplicating product:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to duplicate product",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      await productsAPI.delete(product.id)
      toast({
        title: "Product deleted",
        description: "The product has been moved to trash."
      })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete product",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Compact List View
  if (variant === "compact") {
    return (
      <Card className={cn(
        "group hover:shadow-md transition-all duration-200 relative overflow-hidden",
        selected && "ring-2 ring-primary"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Selection Checkbox */}
            <div className={cn(
              "transition-opacity",
              selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
                className="bg-background border-2"
              />
            </div>

            {/* Product Image */}
            <div className="relative h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {product.name}
                </h3>

              </div>
              <p className="text-sm text-muted-foreground truncate">
                {product.description}
              </p>
            </div>

            {/* Category & Status */}
            <div className="hidden sm:flex flex-col items-end gap-1">
              <Badge 
                variant={product.status === "Published" ? "default" : "secondary"}
                className="text-xs"
              >
                {product.status}
              </Badge>
              <span className="text-xs text-muted-foreground">{product.category?.name || 'No Category'}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Link to={`/products/${product.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/products/${product.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/products/${product.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Product
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} disabled={isLoading}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePin} disabled={isLoading}>
                    <Pin className="h-4 w-4 mr-2" />
                    {product.isPinned ? "Unpin" : "Pin"} Product
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFavorite} disabled={isLoading}>
                    <Heart className={cn("h-4 w-4 mr-2", product.isFavorite && "fill-current text-red-500")} />
                    {product.isFavorite ? "Remove from" : "Add to"} Favorites
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" disabled={isLoading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will move "{product.name}" to trash. You can restore it later from the trash.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default variant (grid view)
  return (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-300 relative overflow-hidden border-border/50 hover:border-primary/20",
      selected && "ring-2 ring-primary shadow-glow"
    )}>
      {/* Selection Checkbox */}
      <div className={cn(
        "absolute top-3 left-3 z-10 transition-opacity",
        selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className="bg-background/90 backdrop-blur-sm border-2"
        />
      </div>

      {/* Auto-Rotating Recipe Tags - Top Right */}
      {productTags && productTags.length > 0 && (
        <div className="absolute top-1 right-1 z-10">
          <div className="relative bg-green-700 text-white px-2 py-0.5 min-w-0 max-w-[120px] shadow-md flex items-center justify-center" style={{
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)'
          }}>
            <Badge 
              variant="secondary" 
              className="text-xs font-medium text-white bg-transparent border-0 p-0 pl-1 h-auto truncate w-full justify-center flex items-center"
              title={productTags[currentTagIndex]}
            >
              {productTags[currentTagIndex]}
            </Badge>
            {/* Small circle hole for tag effect */}
            <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-90 mr-0.5"></div>
          </div>
        </div>
      )}



      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              console.log('Image failed to load:', product.image)
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <div className={`flex items-center justify-center h-full ${product.image ? 'hidden' : ''}`}>
          <Package className="h-12 w-12 text-muted-foreground/60" />
        </div>
        
        {/* Status Indicators - Bottom Right of Image */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          {product.isFavorite && (
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md">
              <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
            </div>
          )}
          {product.isPinned && (
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md">
              <Pin className="h-3.5 w-3.5 text-accent fill-current" />
            </div>
          )}
        </div>
        
        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
            >
              <Link to={`/products/${product.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              className="bg-background/90 backdrop-blur-sm hover:bg-background shadow-lg"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        {/* Status Badge and Actions */}
        <div className="flex items-center justify-between mb-3">
          <Badge 
            variant={product.status === "Published" ? "default" : "secondary"}
            className="text-xs shadow-sm"
          >
            {product.status}
          </Badge>
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-sm">
              <DropdownMenuItem asChild>
                <Link to={`/products/${product.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/products/${product.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Product
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate} disabled={isLoading}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handlePin} disabled={isLoading}>
                <Pin className="h-4 w-4 mr-2" />
                {product.isPinned ? "Unpin" : "Pin"} Product
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFavorite} disabled={isLoading}>
                <Heart className={cn("h-4 w-4 mr-2", product.isFavorite && "fill-current text-red-500")} />
                {product.isFavorite ? "Remove from" : "Add to"} Favorites
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive" disabled={isLoading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will move "{product.name}" to trash. You can restore it later from the trash.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Product Info */}
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Category */}
          <div className="flex items-center text-xs">
            <span className="font-medium text-primary">{product.category?.name || 'No Category'}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-muted-foreground">{product.servingSize}</span>
          </div>

          {/* Tags */}
          {productTags && productTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {productTags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-primary/20 text-primary/80">
                  {tag}
                </Badge>
              ))}
              {productTags.length > 2 && (
                <Badge variant="outline" className="text-xs border-primary/20 text-primary/80">
                  +{productTags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{product.updatedAt ? product.updatedAt.toLocaleDateString() : 'N/A'}</span>
            </div>
            <span className="font-medium">{product.servingsPerContainer} servings</span>
          </div>
        </CardContent>
      </Card>
    )
  }