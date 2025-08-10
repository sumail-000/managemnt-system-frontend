import { useState, useEffect } from "react"
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
  AlignJustify,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChefHat
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterSidebar } from "@/components/products/FilterSidebar"
import { ProductCard } from "@/components/products/ProductCard"
import { ProductTable } from "@/components/products/ProductTable"

import { productsAPI } from "@/services/api"
import { useToast } from "@/hooks/use-toast"
import { usePaginatedProducts } from "@/hooks/usePaginatedProducts"
import { Product } from "@/types/product"
import CustomIngredients from "./CustomIngredients"

// Remove mock data - will be loaded from API

// Categories and statuses will be loaded from API
const sortOptions = [
  { value: "name", label: "Name" },
  { value: "created", label: "Date Created" },
  { value: "updated", label: "Last Modified" },
  { value: "category", label: "Category" },
  { value: "status", label: "Status" }
]

export default function Products() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"products" | "ingredients">("products")
  const [viewMode, setViewMode] = useState<"grid" | "table" | "compact">("grid")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    categories: [] as string[],
    statuses: [] as string[],
    tags: [] as string[],
    dateRange: {} as { from?: Date; to?: Date },
    pinnedOnly: false
  })
  
  const statuses = ["All", "published", "draft"]
  
  // Use the advanced pagination hook
  const {
    products,
    categories: availableCategories,
    tags: availableTags,
    pagination,
    filters,
    loading,
    categoriesLoading,
    tagsLoading,
    setPage,
    setItemsPerPage,
    setFilters,
    resetFilters,
    refresh,
    hasNextPage,
    hasPreviousPage,
    isEmpty
  } = usePaginatedProducts({
    initialPage: 1,
    initialItemsPerPage: 12,
    autoLoad: true
  })

  // Listen for new products
  useEffect(() => {
    const handleNewProductCreated = (event: CustomEvent) => {
      console.log('New product created event received:', event.detail)
      refresh() // Refresh the products list
      toast({
        title: "Success",
        description: "Product created successfully!"
      })
    }

    const handleStorageChange = () => {
      // Reload products when storage changes (e.g., from another tab)
      console.log('Storage change detected, reloading products...')
      refresh()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('newProductCreated', handleNewProductCreated as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('newProductCreated', handleNewProductCreated as EventListener)
    }
  }, [toast, refresh])

  // Handle search and filter changes
  const handleSearchChange = (search: string) => {
    setFilters({ search })
  }

  const handleCategoryChange = (category: string) => {
    setFilters({ category: category === "All" ? "" : category })
  }

  const handleStatusChange = (status: string) => {
    setFilters({ status: status === "All" ? "all" : status })
  }

  const handleSortChange = (sortBy: string) => {
    const sortMapping: Record<string, string> = {
      "name": "name",
      "created": "created_at",
      "updated": "updated_at",
      "category": "category",
      "status": "status"
    }
    setFilters({ sortBy: sortMapping[sortBy] || "created_at" })
  }

  const handleSortOrderToggle = () => {
    const newOrder = filters.sortOrder === 'asc' ? 'desc' : 'asc'
    setFilters({ sortOrder: newOrder })
  }

  const getSortIcon = () => {
    if (filters.sortOrder === 'asc') {
      return <ArrowUp className="h-4 w-4" />
    } else if (filters.sortOrder === 'desc') {
      return <ArrowDown className="h-4 w-4" />
    }
    return <ArrowUpDown className="h-4 w-4" />
  }

  const getSortOrderLabel = () => {
    return filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'
  }

  const handlePinnedOnlyChange = (pinnedOnly: boolean) => {
    setFilters({ isPinned: pinnedOnly ? true : undefined })
  }

  const handleAdvancedFiltersChange = (newFilters: typeof advancedFilters) => {
    setAdvancedFilters(newFilters)
    
    // Apply advanced filters to the pagination hook
    const filterUpdates: any = {}
    
    if (newFilters.categories.length > 0) {
      filterUpdates.category_id = newFilters.categories[0] // Use category_id for filtering
    }
    
    if (newFilters.statuses.length > 0) {
      filterUpdates.status = newFilters.statuses[0].toLowerCase()
    }
    
    if (newFilters.tags.length > 0) {
      filterUpdates.tags = newFilters.tags
    }
    
    if (newFilters.pinnedOnly) {
      filterUpdates.isPinned = true
    }
    
    setFilters(filterUpdates)
  }

  const handleClearFilters = () => {
    resetFilters()
    setAdvancedFilters({
      categories: [],
      statuses: [],
      tags: [],
      dateRange: {},
      pinnedOnly: false
    })
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleBulkDelete = async () => {
    try {
      await productsAPI.bulkDelete(selectedProducts.map(id => parseInt(id)));
      toast({
        title: "Products deleted",
        description: `${selectedProducts.length} product(s) have been moved to trash.`,
      });
      setSelectedProducts([]);
      refresh();
    } catch (error: any) {
      console.error('Error deleting products:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete products",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {activeTab === "products" ? "Products" : "Custom Ingredients"}
          </h1>
          <p className="text-muted-foreground">
            {activeTab === "products"
              ? "Manage your food products and track inventory"
              : "Manage your custom ingredients and track their usage in recipes"
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === "products" ? (
            <>
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
            </>
          ) : (
            <Button variant="gradient" asChild>
              <Link to="/ingredients/create">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Ingredient
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("products")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "products"
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="w-4 h-4 mr-2 inline" />
            Products
          </button>
          <button
            onClick={() => setActiveTab("ingredients")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "ingredients"
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChefHat className="w-4 h-4 mr-2 inline" />
            Custom Ingredients
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === "products" && (
        <>
          {/* Search and Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, categories, tags..."
              className="pl-10"
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filters.category || "All"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status === "all" ? "All" : filters.status || "All"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status === "All" ? "All Status" : status.charAt(0).toUpperCase() + status.slice(1)}
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
          <Select value={filters.sortBy === "created_at" ? "created" : filters.sortBy === "updated_at" ? "updated" : filters.sortBy === "category" ? "category" : filters.sortBy === "status" ? "status" : "name"} onValueChange={handleSortChange}>
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
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSortOrderToggle}
            className="flex items-center gap-2 min-w-[120px]"
            title={`Sort ${getSortOrderLabel()}`}
          >
            {getSortIcon()}
            <span className="text-xs">{getSortOrderLabel()}</span>
          </Button>

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
                checked={filters.isPinned || false}
                onCheckedChange={handlePinnedOnlyChange}
              />
              <label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
                Show pinned only
              </label>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
            >
              Clear filters
            </Button>
          </div>
        </Card>
      )}







              

              


      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {pagination.total > 0 ? (
            `Showing ${pagination.from}-${pagination.to} of ${pagination.total} products`
          ) : (
            "No products found"
          )}
        </span>
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {selectedProducts.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete All
            </Button>
          </div>
        )}
      </div>

      {/* Filter Sidebar */}
      <FilterSidebar 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={advancedFilters}
        onFiltersChange={handleAdvancedFiltersChange}
        onClearFilters={handleClearFilters}
        availableCategories={availableCategories}
        availableTags={availableTags}
        loading={loading || categoriesLoading || tagsLoading}
      />

      {/* Select All Controls */}
      {products.length > 0 && (
        <div className="flex items-center justify-between py-2 border-b border-border">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedProducts.length === products.length && products.length > 0}
              onCheckedChange={handleSelectAll}
              className="border-2"
            />
            <span className="text-sm font-medium">
              {selectedProducts.length === products.length && products.length > 0
                ? "Deselect All"
                : "Select All"}
            </span>
            {selectedProducts.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({selectedProducts.length} of {products.length} selected)
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Products Display */}
      {viewMode === "grid" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProducts.includes(product.id)}
              onSelect={(checked) => handleSelectProduct(product.id, checked)}
              variant="default"
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      {viewMode === "compact" && (
        <div className="space-y-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              selected={selectedProducts.includes(product.id)}
              onSelect={(checked) => handleSelectProduct(product.id, checked)}
              variant="compact"
              onRefresh={refresh}
            />
          ))}
        </div>
      )}



      {viewMode === "table" && (
        <ProductTable
          products={products}
          selectedProducts={selectedProducts}
          onSelectProduct={handleSelectProduct}
          onSelectAll={handleSelectAll}
          onRefresh={refresh}
        />
      )}

      {/* Pagination Controls - Moved after product display */}
      <div className="space-y-4 mt-6">
        {/* Items per page selector */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select 
            value={pagination.itemsPerPage.toString()} 
            onValueChange={(value) => setItemsPerPage(parseInt(value))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
              <SelectItem value="96">96</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
        
        {/* Centered Pagination */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (hasPreviousPage && !loading && pagination.totalPages > 1) {
                    setPage(pagination.currentPage - 1)
                  }
                }}
                className={(!hasPreviousPage || loading || pagination.totalPages <= 1) ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
              
              {(() => {
                const items = []
                const totalPages = pagination.totalPages
                const currentPage = pagination.currentPage
                
                // Always show first page
                if (totalPages > 0) {
                  items.push(
                    <PaginationItem key={1}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (!loading && totalPages > 1) setPage(1)
                        }}
                        isActive={currentPage === 1}
                        className={(loading || totalPages <= 1) ? 'pointer-events-none opacity-50' : ''}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )
                }
                
                // Show ellipsis if needed
                if (currentPage > 3) {
                  items.push(
                    <PaginationItem key="ellipsis-start">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }
                
                // Show pages around current page
                const start = Math.max(2, currentPage - 1)
                const end = Math.min(totalPages - 1, currentPage + 1)
                
                for (let i = start; i <= end; i++) {
                  if (i !== 1 && i !== totalPages) {
                    items.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (!loading && totalPages > 1) setPage(i)
                          }}
                          isActive={currentPage === i}
                          className={(loading || totalPages <= 1) ? 'pointer-events-none opacity-50' : ''}
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  }
                }
                
                // Show ellipsis if needed
                if (currentPage < totalPages - 2) {
                  items.push(
                    <PaginationItem key="ellipsis-end">
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }
                
                // Always show last page if more than 1 page
                if (totalPages > 1) {
                  items.push(
                    <PaginationItem key={totalPages}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (!loading && totalPages > 1) setPage(totalPages)
                        }}
                        isActive={currentPage === totalPages}
                        className={(loading || totalPages <= 1) ? 'pointer-events-none opacity-50' : ''}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }
                
                return items
              })()
            }
              
            <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (hasNextPage && !loading && pagination.totalPages > 1) {
                      setPage(pagination.currentPage + 1)
                    }
                  }}
                  className={(!hasNextPage || loading || pagination.totalPages <= 1) ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          {/* Page info */}
          <div className="text-center text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </div>
        </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Loading products...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your products</p>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {isEmpty && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {filters.search ? "Try adjusting your search criteria" : "Get started by creating your first product"}
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
        </>
      )}

      {/* Custom Ingredients Tab Content */}
      {activeTab === "ingredients" && (
        <div className="mt-6">
          <CustomIngredients />
        </div>
      )}
    </div>
  )
}