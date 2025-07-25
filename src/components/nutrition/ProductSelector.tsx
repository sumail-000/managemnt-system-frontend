import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { productsAPI } from "@/services/api"
import { Product, transformProductFromAPI } from "@/types/product"
import { 
  ChevronLeft, 
  ChevronRight, 
  Package2, 
  Search, 
  Check,
  Loader2,
  ShoppingCart,
  Star,
  Clock,
  BarChart3,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"

// Interface for product display in nutrition analysis
interface NutritionProduct {
  id: string;
  name: string;
  description?: string;
  category: { id: string; name: string };
  status: "published" | "draft";
  serving_size: number;
  serving_unit: string;
  servings_per_container: number;
  rating?: number;
  prep_time?: string;
  calories_per_serving?: number;
}

interface ProductSelectorProps {
  onProductSelect: (product: any) => void
  onAnalyze: () => void
  selectedProduct: any
  ingredientQuery: string
  onIngredientQueryChange: (value: string) => void
  isAnalyzing: boolean
}

export default function ProductSelector({ 
  onProductSelect, 
  onAnalyze, 
  selectedProduct, 
  ingredientQuery,
  onIngredientQueryChange,
  isAnalyzing 
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const [products, setProducts] = useState<NutritionProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [productsPerPage, setProductsPerPage] = useState(5)
  const { toast } = useToast()

  // Function to fetch products from API
  const fetchProducts = async (page: number = 0, search: string = "") => {
    setLoading(true)
    try {
      const response = await productsAPI.getAll({
        search: search || undefined,
        status: 'published', // Only show published products for nutrition analysis
        page: page + 1, // API uses 1-based pagination
        per_page: productsPerPage
      })
      
      // Transform API products to NutritionProduct format
      const transformedProducts: NutritionProduct[] = response.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category || { id: product.category_id, name: 'Unknown' },
        status: product.status,
        serving_size: product.serving_size,
        serving_unit: product.serving_unit,
        servings_per_container: product.servings_per_container,
        rating: 4.5, // Default rating since not in API
        prep_time: "0 min", // Default prep time
        calories_per_serving: 120 // Default calories
      }))
      
      setProducts(transformedProducts)
      setTotalPages(response.data.last_page || 1)
      setTotalProducts(response.data.total || transformedProducts.length)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      })
      setProducts([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  // Load products on component mount and when search/page/perPage changes
  useEffect(() => {
    fetchProducts(currentPage, searchQuery)
  }, [currentPage, searchQuery, productsPerPage])

  // Reset page when search changes
  useEffect(() => {
    if (currentPage !== 0) {
      setCurrentPage(0)
    }
  }, [searchQuery])

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleFirstPage = () => {
    setCurrentPage(0)
  }

  const handleLastPage = () => {
    setCurrentPage(totalPages - 1)
  }

  const handlePageSizeChange = (newSize: string) => {
    setProductsPerPage(parseInt(newSize))
    setCurrentPage(0) // Reset to first page when changing page size
  }

  const handleProductSelect = async (product: NutritionProduct) => {
    onProductSelect(product)
    
    // Try to fetch real ingredient data from the product
    try {
      const productDetails = await productsAPI.getById(product.id)
      
      // Check if product has ingredient notes or ingredients
      let ingredientText = ""
      
      if (productDetails.data && productDetails.data.ingredient_notes) {
        ingredientText = productDetails.data.ingredient_notes
      } else if (productDetails.data && productDetails.data.ingredients && productDetails.data.ingredients.length > 0) {
        // Format ingredients list
        ingredientText = productDetails.data.ingredients.map((ing: any) => {
          const quantity = ing.quantity ? `${ing.quantity}${ing.unit || ''}` : ''
          return quantity ? `${ing.name} ${quantity}` : ing.name
        }).join(', ')
      } else {
        // Fallback to basic product info
        ingredientText = `${product.name} - ${product.serving_size}${product.serving_unit} per serving`
      }
      
      onIngredientQueryChange(ingredientText || "No ingredient information available for this product")
    } catch (error) {
      console.error('Error fetching product details:', error)
      // Fallback ingredient text
      onIngredientQueryChange(`${product.name} - ${product.serving_size}${product.serving_unit} per serving`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="w-5 h-5 text-primary" />
            Product Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShoppingCart className="w-4 h-4" />
                Total Products: {totalProducts}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs">Show:</span>
                  <Select value={productsPerPage.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-16 h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="15">15</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {totalPages > 1 && (
                  <span>
                    Page {currentPage + 1} of {totalPages}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Select a Product</h3>
              {totalProducts > 0 && (
                <span className="text-sm text-muted-foreground">
                  Showing {currentPage * productsPerPage + 1}-{Math.min((currentPage + 1) * productsPerPage, totalProducts)} of {totalProducts}
                </span>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFirstPage}
                  disabled={currentPage === 0}
                  className="w-8 h-8 p-0"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                  className="w-8 h-8 p-0"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center px-3 py-1 text-sm font-medium bg-muted rounded">
                  {currentPage + 1} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  className="w-8 h-8 p-0"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLastPage}
                  disabled={currentPage >= totalPages - 1}
                  className="w-8 h-8 p-0"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No products found</h4>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search terms' : 'Create some products to get started'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">Loading products...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? `No products found for "${searchQuery}"` : "No products available"}
                </div>
              ) : (
                products.map((product) => (
                  <div
                  key={product.id}
                  className={`group relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedProduct?.id === product.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-start gap-4">
                    {/* Product Image Placeholder */}
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Package2 className="w-8 h-8 text-primary/60" />
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          
                          {/* Product Stats */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {product.calories_per_serving} cal
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {product.prep_time}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current text-yellow-500" />
                              {product.rating}
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {product.category.name}
                            </Badge>
                            <Badge 
                              variant={product.status === 'published' ? 'default' : 'outline'} 
                              className="text-xs"
                            >
                              {product.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {product.serving_size}{product.serving_unit}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Selection Indicator */}
                        {selectedProduct?.id === product.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ingredients Section */}
      {selectedProduct && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingredients Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                <Label className="text-sm font-medium">Selected Product</Label>
                <p className="text-base font-semibold mt-1">{selectedProduct.name}</p>
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ingredients" className="text-sm font-medium">
                  Ingredients Data
                </Label>
                <Textarea
                  id="ingredients"
                  placeholder="Ingredients will be loaded automatically..."
                  value={ingredientQuery}
                  onChange={(e) => onIngredientQueryChange(e.target.value)}
                  rows={6}
                  className="resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Review and edit the ingredients data as needed before analysis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Button 
              onClick={onAnalyze}
              disabled={!selectedProduct || !ingredientQuery.trim() || isAnalyzing}
              size="lg"
              className="w-full max-w-md h-12 text-base font-medium"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Nutrition...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Start Nutritional Analysis
                </>
              )}
            </Button>
          </div>
          {!selectedProduct && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Please select a product to continue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}