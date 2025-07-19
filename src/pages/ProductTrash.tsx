import { useState } from "react"
import { Link } from "react-router-dom"
import { 
  ArrowLeft, 
  RotateCcw, 
  Trash2, 
  Search,
  AlertTriangle,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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

interface TrashedProduct {
  id: string
  name: string
  description: string
  category: string
  deletedAt: Date
  deletedBy: string
  thumbnail?: string
}

// Mock trashed products
const mockTrashedProducts: TrashedProduct[] = [
  {
    id: "trash-1",
    name: "Expired Milk Product",
    description: "Old dairy product that was removed",
    category: "Dairy",
    deletedAt: new Date("2024-01-18"),
    deletedBy: "John Doe",
    thumbnail: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=200&fit=crop"
  },
  {
    id: "trash-2",
    name: "Discontinued Snack",
    description: "Snack product that's no longer available",
    category: "Snacks",
    deletedAt: new Date("2024-01-15"),
    deletedBy: "Jane Smith"
  },
  {
    id: "trash-3",
    name: "Test Product",
    description: "Product created for testing purposes",
    category: "Other",
    deletedAt: new Date("2024-01-10"),
    deletedBy: "Admin"
  }
]

export default function ProductTrash() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [trashedProducts, setTrashedProducts] = useState(mockTrashedProducts)

  const filteredProducts = trashedProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleRestore = (productId: string) => {
    const product = trashedProducts.find(p => p.id === productId)
    if (product) {
      setTrashedProducts(prev => prev.filter(p => p.id !== productId))
      setSelectedProducts(prev => prev.filter(id => id !== productId))
      toast({
        title: "Product restored",
        description: `${product.name} has been restored successfully.`
      })
    }
  }

  const handleBulkRestore = () => {
    const restoredCount = selectedProducts.length
    setTrashedProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)))
    setSelectedProducts([])
    toast({
      title: "Products restored",
      description: `${restoredCount} product(s) have been restored successfully.`
    })
  }

  const handlePermanentDelete = (productId: string) => {
    const product = trashedProducts.find(p => p.id === productId)
    if (product) {
      setTrashedProducts(prev => prev.filter(p => p.id !== productId))
      setSelectedProducts(prev => prev.filter(id => id !== productId))
      toast({
        title: "Product permanently deleted",
        description: `${product.name} has been permanently deleted.`,
        variant: "destructive"
      })
    }
  }

  const handleBulkPermanentDelete = () => {
    const deletedCount = selectedProducts.length
    setTrashedProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)))
    setSelectedProducts([])
    toast({
      title: "Products permanently deleted",
      description: `${deletedCount} product(s) have been permanently deleted.`,
      variant: "destructive"
    })
  }

  const allSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < filteredProducts.length

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
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trash2 className="h-8 w-8" />
              Trash
            </h1>
            <p className="text-muted-foreground">
              Manage deleted products • {trashedProducts.length} item(s) in trash
            </p>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium text-warning-foreground">
              Items in trash will be permanently deleted after 30 days
            </p>
            <p className="text-sm text-muted-foreground">
              Restore important items before they're permanently removed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search and Bulk Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search trashed products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedProducts.length} selected
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkRestore}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Restore
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Forever
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently Delete Products</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete {selectedProducts.length} product(s)? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkPermanentDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Products List */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center space-x-2 px-4">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <label className="text-sm font-medium cursor-pointer">
              Select all ({filteredProducts.length})
            </label>
          </div>

          {/* Product Cards */}
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                    />

                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Deleted {product.deletedAt.toLocaleDateString()} by {product.deletedBy}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(product.id)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete Forever
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to permanently delete "{product.name}"? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handlePermanentDelete(product.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? "No matching items in trash" : "Trash is empty"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "Deleted products will appear here"
              }
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}