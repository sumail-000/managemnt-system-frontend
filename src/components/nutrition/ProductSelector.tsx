import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { productsAPI, edamamAPI } from "@/services/api"
import { Product, transformProductFromAPI } from "@/types/product"
import { NutritionCheckResponse, NutritionLoadResponse } from "@/types/api"
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
  ChevronsRight,
  Database,
  Eye
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
  image?: string;
  image_url?: string;
  image_path?: string;
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
  const [loadingNutritionData, setLoadingNutritionData] = useState(false)
  const [showDataFoundDialog, setShowDataFoundDialog] = useState(false)
  const [nutritionDataExists, setNutritionDataExists] = useState<boolean | null>(null)

  const { toast } = useToast()

  // Function to fetch products from API
  const fetchProducts = async (page: number = 0, search: string = "") => {
    console.log('=== FETCHING PRODUCTS ===')
    console.log('Search query:', search)
    console.log('Current page:', page)
    console.log('Products per page:', productsPerPage)
    setLoading(true)
    try {
      const response: any = await productsAPI.getAll({
        search: search || undefined,
        page: page + 1, // API uses 1-based pagination
        per_page: productsPerPage
      })
      
      console.log('=== PRODUCTS API RESPONSE ===')
      console.log('Full response:', response)
      console.log('Products data:', response)
      console.log('Total products:', response.total)
      
      // Debug: Check each product for image data
      if (response.data && response.data.length > 0) {
        console.log('=== PRODUCT IMAGE DEBUG ===')
        response.data.forEach((product: any, index: number) => {
          console.log(`Product ${index + 1} (${product.name}):`, {
            id: product.id,
            name: product.name,
            image: product.image,
            image_url: product.image_url,
            image_path: product.image_path,
            status: product.status,
            ingredient_notes: product.ingredient_notes
          })
        })
      }
      
      // Transform API products to NutritionProduct format
      const transformedProducts: NutritionProduct[] = (response.data || []).map((product: any) => {
        // Format creation time
        let creationTime = "Unknown";
        if (product.created_at) {
          const createdDate = new Date(product.created_at);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            creationTime = "1 day ago";
          } else if (diffDays < 30) {
            creationTime = `${diffDays} days ago`;
          } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            creationTime = months === 1 ? "1 month ago" : `${months} months ago`;
          } else {
            const years = Math.floor(diffDays / 365);
            creationTime = years === 1 ? "1 year ago" : `${years} years ago`;
          }
        }
        
        return {
          id: product.id,
          name: product.name,
          description: product.description,
          category: product.category || { id: product.category_id, name: 'Unknown' },
          status: product.status,
          serving_size: product.serving_size,
          serving_unit: product.serving_unit,
          servings_per_container: product.servings_per_container,
          rating: undefined, // Remove hardcoded rating since not available in backend
          prep_time: creationTime, // Use actual creation time from API
          calories_per_serving: undefined, // Remove calorie display
          image: product.image,
          image_url: product.image_url,
          image_path: product.image_path
        };
      })
      
      setProducts(transformedProducts)
      setTotalPages(response.last_page || 1)
      setTotalProducts(response.total || transformedProducts.length)
      
      console.log('ProductSelector - API Response:', {
        total: response.total,
        last_page: response.last_page,
        current_page: response.current_page,
        per_page: response.per_page,
        data_length: response.data?.length
      })
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
    
    // Debug: Log the selected product
    console.log('=== PRODUCT SELECTION DEBUG ===')
    console.log('Selected product:', product)
    console.log('Product ID:', product.id)
    console.log('Product name:', product.name)
    
    // Try to fetch real ingredient data from the product
    try {
      const productDetails: any = await productsAPI.getById(product.id)
      console.log('=== PRODUCT DETAILS API RESPONSE ===')
      console.log('Full API response:', productDetails)
      console.log('Product data:', productDetails)
      
      // Debug: Check all possible ingredient-related fields
      if (productDetails) {
        console.log('=== INGREDIENT DATA CHECK ===')
        console.log('ingredient_notes:', productDetails.ingredient_notes)
        console.log('ingredients array:', productDetails.ingredients)
        console.log('ingredients length:', productDetails.ingredients ? productDetails.ingredients.length : 'undefined')
        console.log('All product fields:', Object.keys(productDetails))
        
        // Check for any serving-related data that might be interfering
        console.log('=== SERVING DATA CHECK ===')
        console.log('serving_size:', productDetails.serving_size)
        console.log('serving_unit:', productDetails.serving_unit)
        console.log('nutritional_data:', productDetails.nutritional_data)
      }
      
      // Check if product has ingredients array or ingredient notes
      let ingredientText = ""
      
      if (productDetails.ingredients && productDetails.ingredients.length > 0) {
        // Priority 1: Format ingredients array if available - Updated format for Edamam API
        ingredientText = productDetails.ingredients.map((ing: any) => {
          console.log('Processing ingredient:', ing)
          // Check if ingredient has pivot data (from many-to-many relationship)
          const pivotData = ing.pivot || {}
          const quantity = pivotData.amount || ing.quantity || ''
          const unit = pivotData.unit || ing.unit || ''
          const displayQuantity = quantity ? `${quantity}${unit}` : ''
          // Format: "ingredient quantity" (e.g., "lemon 1.10g") instead of "ingredient (quantity)"
          return displayQuantity ? `${ing.name} ${displayQuantity}` : ing.name
        }).join('\n') // Use newlines instead of commas for better readability
        console.log('✅ Using formatted ingredients array:', ingredientText)
      } else if (productDetails.ingredient_notes && productDetails.ingredient_notes.trim()) {
        // Priority 2: Use ingredient notes as fallback
        ingredientText = productDetails.ingredient_notes
        console.log('✅ Using ingredient notes as fallback:', ingredientText)
      } else {
        // Priority 3: Request user to add ingredient information
        ingredientText = `Please add ingredient information for ${product.name}.\n\nExample format:\nflour 200g\nsugar 150g\neggs 2\nmilk 250ml\nbutter 100g\nvanilla extract 5ml`
        console.log('❌ No ingredient data found, using placeholder')
        console.log('Reason: ingredients array empty or null, ingredient_notes empty or null')
      }
      
      console.log('=== FINAL INGREDIENT TEXT ===')
      console.log('Setting ingredient text:', ingredientText)
      onIngredientQueryChange(ingredientText || "No ingredient information available for this product")
    } catch (error) {
      console.error('❌ Error fetching product details:', error)
      // Fallback ingredient text
      onIngredientQueryChange(`Please add ingredient information for ${product.name}.\n\nExample format:\nflour 200g\nsugar 150g\neggs 2\nmilk 250ml\nbutter 100g\nvanilla extract 5ml`)
    }
    
    // Check if nutrition data exists for this product
    checkNutritionDataExists(product.id)
  }

  const checkNutritionDataExists = async (productId: string) => {
    try {
      const response = await edamamAPI.nutrition.checkNutritionData(productId) as unknown as NutritionCheckResponse
      // Fix: Due to axios interceptor, exists field is at response.exists, not response.data.exists
      setNutritionDataExists(response.exists)
    } catch (error) {
      console.error('Error checking nutrition data:', error)
      setNutritionDataExists(false)
    }
  }

  const handleLoadData = async () => {
    if (!selectedProduct) return
    
    setLoadingNutritionData(true)
    try {
      const response = await edamamAPI.nutrition.checkNutritionData(selectedProduct.id) as unknown as NutritionCheckResponse
      
      // Debug logging to see the actual response structure
      console.log('[PRODUCT_SELECTOR] Full API response:', response)
      console.log('[PRODUCT_SELECTOR] Response exists field:', response.exists)
      console.log('[PRODUCT_SELECTOR] Response exists type:', typeof response.exists)
      
      // Fix: Due to axios interceptor returning response.data, the exists field is at response.exists
      // The interceptor extracts the data from {success: true, exists: true, data: {...}} 
      // So response.exists contains the exists field, not response.data.exists
      if (response.exists) {
        setShowDataFoundDialog(true)
      } else {
        toast({
          title: "No Data Found",
          description: "No nutrition data found for this product in the database.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error checking nutrition data:', error)
      toast({
        title: "Error",
        description: "Failed to check nutrition data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingNutritionData(false)
    }
  }

  const handleViewNutritionData = async () => {
    if (!selectedProduct) return
    
    try {
      // Navigate to nutrition page with URL parameters for loading existing data
      // The NutritionAnalysis component will detect these parameters and load the data
      window.location.href = `/nutrition?productId=${selectedProduct.id}&loadData=true`
      
    } catch (error) {
      console.error('Error navigating to nutrition data:', error)
      toast({
        title: "Error",
        description: "Failed to navigate to nutrition data. Please try again.",
        variant: "destructive"
      })
    }
    
    setShowDataFoundDialog(false)
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
                  {/* Selection Indicator - Top Left */}
                  {selectedProduct?.id === product.id && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                     <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                       {product.image_url || product.image ? (
                         <img 
                           src={product.image_url || product.image} 
                           alt={product.name}
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             // Fallback to placeholder on image load error
                             e.currentTarget.style.display = 'none'
                             e.currentTarget.nextElementSibling?.classList.remove('hidden')
                           }}
                         />
                       ) : null}
                       <Package2 className={`w-8 h-8 text-primary/60 ${product.image_url || product.image ? 'hidden' : ''}`} />
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
                              <Clock className="w-3 h-3" />
                              Created {product.prep_time}
                            </div>
                            {product.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current text-yellow-500" />
                                {product.rating}
                              </div>
                            )}
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
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-center min-h-[120px] ml-4">
                          {/* Load Data Button - Only show when product is selected */}
                          {selectedProduct?.id === product.id && (
                            <Button
                              variant="outline"
                              size="default"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLoadData()
                              }}
                              disabled={loadingNutritionData}
                              className="h-11 px-6 font-semibold text-sm bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30 hover:border-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                            >
                              {loadingNutritionData ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <>
                                  <Database className="w-4 h-4 mr-2" />
                                  <span>Load Data</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
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

      {/* Data Found Dialog */}
      <Dialog open={showDataFoundDialog} onOpenChange={setShowDataFoundDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-green-600" />
              Data Found in Database
            </DialogTitle>
            <DialogDescription>
              Nutrition data for <strong>{selectedProduct?.name}</strong> was found in the database.
              Would you like to view the existing nutritional analysis?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDataFoundDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleViewNutritionData}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}