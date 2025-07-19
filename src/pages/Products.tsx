import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  MoreHorizontal,
  Pin,
  Edit,
  Copy,
  Trash2,
  Eye,
  LayoutGrid,
  AlignJustify
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterSidebar } from "@/components/products/FilterSidebar"
import { ProductCard } from "@/components/products/ProductCard"
import { ProductTable } from "@/components/products/ProductTable"
import { BulkActions } from "@/components/products/BulkActions"

// Mock data for development
const mockProducts = [
  {
    id: "1",
    name: "Organic Greek Yogurt",
    description: "Creamy organic Greek yogurt with live cultures",
    category: "Dairy",
    status: "Published" as const,
    isPinned: true,
    tags: ["Organic", "High Protein", "Gluten Free"],
    servingSize: "150g",
    servingsPerContainer: 4,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    thumbnail: "https://images.unsplash.com/photo-1571212515416-efbaeb7fb324?w=300&h=200&fit=crop"
  },
  {
    id: "2",
    name: "Gluten-Free Crackers",
    description: "Crispy whole grain crackers made without gluten",
    category: "Snacks",
    status: "Draft" as const,
    isPinned: false,
    tags: ["Gluten Free", "Whole Grain", "Vegan"],
    servingSize: "30g",
    servingsPerContainer: 8,
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-18"),
    thumbnail: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&h=200&fit=crop"
  },
  {
    id: "3",
    name: "Premium Olive Oil",
    description: "Extra virgin olive oil from Mediterranean olives",
    category: "Oils",
    status: "Published" as const,
    isPinned: false,
    tags: ["Premium", "Cold Pressed", "Mediterranean"],
    servingSize: "15ml",
    servingsPerContainer: 33,
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-15"),
    thumbnail: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=200&fit=crop"
  },
  {
    id: "4",
    name: "Almond Butter",
    description: "Natural almond butter with no added sugar",
    category: "Spreads",
    status: "Published" as const,
    isPinned: true,
    tags: ["Natural", "No Sugar", "High Protein"],
    servingSize: "32g",
    servingsPerContainer: 16,
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-22"),
    thumbnail: "https://images.unsplash.com/photo-1599398054066-846f68d42744?w=300&h=200&fit=crop"
  }
]

const categories = ["All", "Dairy", "Snacks", "Oils", "Spreads", "Beverages", "Grains"]
const statuses = ["All", "Published", "Draft"]
const sortOptions = [
  { value: "name", label: "Name" },
  { value: "created", label: "Date Created" },
  { value: "updated", label: "Last Modified" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" }
]

export default function Products() {
  const [viewMode, setViewMode] = useState<"grid" | "table" | "compact" | "masonry">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [sortBy, setSortBy] = useState("updated")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = mockProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
      const matchesStatus = selectedStatus === "All" || product.status === selectedStatus
      const matchesPinned = !showPinnedOnly || product.isPinned

      return matchesSearch && matchesCategory && matchesStatus && matchesPinned
    })

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "created":
          return b.createdAt.getTime() - a.createdAt.getTime()
        case "updated":
          return b.updatedAt.getTime() - a.updatedAt.getTime()
        case "category":
          return a.category.localeCompare(b.category)
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, selectedCategory, selectedStatus, showPinnedOnly, sortBy])

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

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage your food products and track inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/products/trash">
              <Trash2 className="w-4 h-4 mr-2" />
              Trash
            </Link>
          </Button>
          <Button variant="gradient" asChild>
            <Link to="/products/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, categories, tags..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-muted" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  Sort by {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-md border border-border overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
              title="Grid View"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "compact" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compact")}
              className="rounded-none"
              title="Compact List View"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "masonry" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("masonry")}
              className="rounded-none"
              title="Masonry View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="rounded-none"
              title="Table View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pinned"
                checked={showPinnedOnly}
                onCheckedChange={(checked) => setShowPinnedOnly(!!checked)}
              />
              <label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
                Show pinned only
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All")
                setSelectedStatus("All")
                setShowPinnedOnly(false)
              }}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <BulkActions
          selectedCount={selectedProducts.length}
          onClearSelection={() => setSelectedProducts([])}
          onBulkDelete={() => {
            // Handle bulk delete
            console.log("Bulk delete:", selectedProducts)
            setSelectedProducts([])
          }}
          onBulkPin={() => {
            // Handle bulk pin
            console.log("Bulk pin:", selectedProducts)
          }}
          onBulkUnpin={() => {
            // Handle bulk unpin
            console.log("Bulk unpin:", selectedProducts)
          }}
          onBulkStatusChange={(status) => {
            // Handle bulk status change
            console.log("Bulk status change:", selectedProducts, status)
          }}
        />
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredProducts.length} of {mockProducts.length} products
        </span>
        {selectedProducts.length > 0 && (
          <span>
            {selectedProducts.length} selected
          </span>
        )}
      </div>

      {/* Products Display */}
      {viewMode === "grid" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProducts.includes(product.id)}
              onSelect={(checked) => handleSelectProduct(product.id, checked)}
              variant="default"
            />
          ))}
        </div>
      )}

      {viewMode === "compact" && (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProducts.includes(product.id)}
              onSelect={(checked) => handleSelectProduct(product.id, checked)}
              variant="compact"
            />
          ))}
        </div>
      )}

      {viewMode === "masonry" && (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="break-inside-avoid mb-6">
              <ProductCard
                product={product}
                selected={selectedProducts.includes(product.id)}
                onSelect={(checked) => handleSelectProduct(product.id, checked)}
                variant="masonry"
              />
            </div>
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <ProductTable
          products={filteredProducts}
          selectedProducts={selectedProducts}
          onSelectProduct={handleSelectProduct}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try adjusting your search criteria" : "Get started by creating your first product"}
            </p>
            <Button asChild>
              <Link to="/products/new">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}