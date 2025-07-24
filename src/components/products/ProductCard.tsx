import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  MoreHorizontal, 
  Pin, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  Calendar,
  Package
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
  variant?: "default" | "compact" | "masonry"
  onRefresh?: () => void
}

export function ProductCard({ product, selected, onSelect, variant = "default", onRefresh }: ProductCardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

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
                {product.isPinned && (
                  <Pin className="h-3 w-3 text-accent fill-current flex-shrink-0" />
                )}
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
              <span className="text-xs text-muted-foreground">{product.category}</span>
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

  // Masonry View
  if (variant === "masonry") {
    return (
      <Card className={cn(
        "group hover:shadow-lg transition-all duration-200 relative overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/30",
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
            className="bg-background/80 backdrop-blur-sm border-2"
          />
        </div>

        {/* Pin Indicator */}
        {product.isPinned && (
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-accent/20 backdrop-blur-sm rounded-full p-1">
              <Pin className="h-4 w-4 text-accent fill-current" />
            </div>
          </div>
        )}

        {/* Product Image */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onError={(e) => {
              console.log('Image failed to load:', product.image)
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}
        <div className={`flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50 ${product.image ? 'hidden' : ''}`}>
          <Package className="h-16 w-16 text-muted-foreground/60" />
        </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Actions Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-background/90 backdrop-blur-sm hover:bg-background"
              >
                <Link to={`/products/${product.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleEdit}
                className="bg-background/90 backdrop-blur-sm hover:bg-background"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={product.status === "Published" ? "default" : "secondary"}
              className="text-xs shadow-sm"
            >
              {product.status}
            </Badge>
            
            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-60 hover:opacity-100">
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
            <span className="font-medium text-primary">{product.category}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-muted-foreground">{product.servingSize}</span>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-primary/20 text-primary/80">
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 2 && (
                <Badge variant="outline" className="text-xs border-primary/20 text-primary/80">
                  +{product.tags.length - 2}
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

  // Default Grid View (Enhanced)
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

      {/* Pin Indicator */}
      {product.isPinned && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-accent/10 backdrop-blur-sm rounded-full p-1.5">
            <Pin className="h-4 w-4 text-accent fill-current" />
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
        
        {/* Quick Actions Overlay */}
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
        {/* Status Badge */}
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
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {product.description}
            </p>
          </div>

          {/* Category */}
          <div className="flex items-center text-xs">
            <span className="font-medium text-primary">{product.category}</span>
            <span className="mx-2 text-muted-foreground">•</span>
            <span className="text-muted-foreground">{product.servingSize} per serving</span>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs border-primary/20 text-primary/80 hover:bg-primary/5">
                  {tag}
                </Badge>
              ))}
              {product.tags.length > 3 && (
                <Badge variant="outline" className="text-xs border-primary/20 text-primary/80">
                  +{product.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{product.updatedAt ? product.updatedAt.toLocaleDateString() : 'N/A'}</span>
            </div>
            <span className="font-medium text-primary/80">{product.servingsPerContainer} servings</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}