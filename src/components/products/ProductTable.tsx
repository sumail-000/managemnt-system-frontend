import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { 
  MoreHorizontal, 
  Pin, 
  Edit, 
  Copy, 
  Trash2, 
  Eye,
  ArrowUpDown,
  Clock,
  Tag
} from "lucide-react"
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
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ProductCamelCase as Product } from "@/types/product"
import { productsAPI } from "@/services/api"

interface ProductTableProps {
  products: Product[]
  selectedProducts: string[]
  onSelectProduct: (productId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onRefresh?: () => void
}

export function ProductTable({ 
  products, 
  selectedProducts, 
  onSelectProduct, 
  onSelectAll,
  onRefresh 
}: ProductTableProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loadingProducts, setLoadingProducts] = useState<Set<string>>(new Set())
  
  const allSelected = products.length > 0 && selectedProducts.length === products.length
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < products.length

  const handlePin = async (productId: string, isPinned: boolean) => {
    if (loadingProducts.has(productId)) return
    
    setLoadingProducts(prev => new Set(prev).add(productId))
    try {
      await productsAPI.togglePin(productId)
      toast({
        title: isPinned ? "Product unpinned" : "Product pinned",
        description: "Pin status updated successfully."
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
      setLoadingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleDuplicate = async (productId: string) => {
    if (loadingProducts.has(productId)) return
    
    setLoadingProducts(prev => new Set(prev).add(productId))
    try {
      await productsAPI.duplicate(productId)
      toast({
        title: "Product duplicated",
        description: "Product has been duplicated successfully."
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
      setLoadingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleDelete = async (productId: string) => {
    if (loadingProducts.has(productId)) return
    
    setLoadingProducts(prev => new Set(prev).add(productId))
    try {
      await productsAPI.delete(productId)
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
      setLoadingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const handleEdit = (productId: string) => {
    navigate(`/products/${productId}/edit`)
  }

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Table Header */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-muted/40 to-muted/20 backdrop-blur-sm">
        <div className="p-6">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-1">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onSelectAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4"
              />
            </div>
            <div className="col-span-5 lg:col-span-4">
              <Button variant="ghost" className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors">
                Product
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </div>
            <div className="hidden lg:block lg:col-span-2">
              <Button variant="ghost" className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors">
                Category
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <Button variant="ghost" className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors">
                Status
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </div>
            <div className="hidden lg:block lg:col-span-2">
              <span className="font-semibold text-foreground">Tags</span>
            </div>
            <div className="col-span-2 lg:col-span-2">
              <Button variant="ghost" className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors">
                <Clock className="mr-1 h-3 w-3" />
                Updated
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <span className="font-semibold text-foreground">Actions</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Enhanced Product Cards */}
      <div className="space-y-3">
        {products.map((product, index) => (
          <Card 
            key={product.id} 
            className="group hover:shadow-lg transition-all duration-300 border border-border/30 hover:border-primary/20 animate-fade-in backdrop-blur-sm bg-card/50 hover:bg-card/80"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="p-6">
              <div className="grid grid-cols-12 gap-6 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => onSelectProduct(product.id, !!checked)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-4 w-4 rounded-md"
                  />
                </div>

                {/* Product Info */}
                <div className="col-span-5 lg:col-span-4">
                  <div className="flex items-center space-x-4">
                    {/* Pin Icon */}
                    <div className="w-5 flex-shrink-0">
                      {product.isPinned && (
                        <div className="relative">
                          <Pin className="h-4 w-4 text-primary fill-current animate-pulse" />
                          <div className="absolute inset-0 h-4 w-4 text-primary/20 fill-current animate-ping" />
                        </div>
                      )}
                    </div>
                    
                    {/* Enhanced Thumbnail */}
                    <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-border/20 group-hover:ring-primary/30 transition-all duration-300">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover rounded-xl"
                          onError={(e) => {
                            console.log('Image failed to load:', product.image)
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`text-base font-bold text-primary ${product.image ? 'hidden' : ''}`}>
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-xl" />
                    </div>
                    
                    {/* Enhanced Name and Description */}
                    <div className="min-w-0 flex-1">
                      <Link 
                        to={`/products/${product.id}`}
                        className="font-semibold text-lg text-foreground hover:text-primary transition-colors block truncate group-hover:text-primary duration-300"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground truncate mt-1 group-hover:text-muted-foreground/80 transition-colors">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Category - Hidden on mobile */}
                <div className="hidden lg:block lg:col-span-2">
                  <Badge 
                    variant="outline" 
                    className="font-medium border-primary/30 text-primary bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1 text-sm hover:bg-primary/15 transition-colors"
                  >
                    {product.category?.name || 'No Category'}
                  </Badge>
                </div>

                {/* Enhanced Status */}
                <div className="col-span-2 lg:col-span-1">
                  <Badge 
                    variant={product.status === "Published" ? "default" : "secondary"}
                    className={`text-sm font-medium px-3 py-1 ${
                      product.status === "Published" 
                        ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" 
                        : "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                    } transition-colors`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      product.status === "Published" ? "bg-green-500" : "bg-yellow-500"
                    }`} />
                    {product.status}
                  </Badge>
                  {/* Enhanced Mobile category */}
                  <div className="lg:hidden mt-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                      {product.category?.name || 'No Category'}
                    </span>
                  </div>
                </div>

                {/* Enhanced Tags - Hidden on mobile */}
                <div className="hidden lg:block lg:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {product.tags && product.tags.slice(0, 2).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs border-muted-foreground/30 bg-background/80 hover:bg-background transition-colors px-2 py-1"
                      >
                        <Tag className="h-2 w-2 mr-1.5 text-primary" />
                        {tag}
                      </Badge>
                    ))}
                    {product.tags && product.tags.length > 2 && (
                      <Badge 
                        variant="outline" 
                        className="text-xs border-muted-foreground/30 bg-muted/50 px-2 py-1"
                      >
                        +{product.tags.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Enhanced Updated Date */}
                <div className="col-span-2 lg:col-span-2">
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold text-sm text-foreground">
                          {product.updatedAt ? product.updatedAt.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.updatedAt ? product.updatedAt.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="col-span-2 lg:col-span-1">
                  <div className="flex items-center justify-end gap-2">
                    {/* Enhanced Quick actions for larger screens */}
                    <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg"
                      >
                        <Link to={`/products/${product.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product.id)}
                        disabled={loadingProducts.has(product.id)}
                        className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 rounded-lg"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Enhanced Dropdown menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0 hover:bg-muted/80 rounded-lg transition-all duration-200 hover:scale-105"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-background/95 backdrop-blur-sm border border-border/50">
                        <DropdownMenuItem asChild>
                          <Link to={`/products/${product.id}`} className="cursor-pointer hover:bg-primary/10">
                            <Eye className="h-4 w-4 mr-3 text-primary" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/products/${product.id}/edit`} className="cursor-pointer hover:bg-primary/10">
                            <Edit className="h-4 w-4 mr-3 text-primary" />
                            Edit Product
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDuplicate(product.id)} 
                          disabled={loadingProducts.has(product.id)}
                          className="hover:bg-primary/10"
                        >
                          <Copy className="h-4 w-4 mr-3 text-primary" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handlePin(product.id, product.isPinned)} 
                          disabled={loadingProducts.has(product.id)}
                          className="hover:bg-primary/10"
                        >
                          <Pin className="h-4 w-4 mr-3 text-primary" />
                          {product.isPinned ? "Unpin" : "Pin"} Product
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              disabled={loadingProducts.has(product.id)}
                              className="text-destructive focus:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
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
                              <AlertDialogAction 
                                onClick={() => handleDelete(product.id)} 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}