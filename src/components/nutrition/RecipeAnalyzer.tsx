import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { productsAPI } from "@/services/api"
import { Product } from "@/types/product"
import { 
  Plus, 
  X, 
  ChefHat, 
  Loader2, 
  Scale, 
  Users, 
  Clock,
  Link as LinkIcon,
  Package,
  Search,
  Check
} from "lucide-react"

interface Ingredient {
  id: string
  name: string
  quantity: string
  unit: string
}

interface RecipeAnalyzerProps {
  onAnalysisStart: () => void
  onAnalysisComplete: (data: any, recipeName: string) => void
  onAnalysisError: () => void
  isAnalyzing: boolean
}

export function RecipeAnalyzer({ 
  onAnalysisStart, 
  onAnalysisComplete, 
  onAnalysisError, 
  isAnalyzing 
}: RecipeAnalyzerProps) {
  const [recipeName, setRecipeName] = useState("")
  // NULLED: No default servings - user must specify
  const [servings, setServings] = useState("")
  const [prepTime, setPrepTime] = useState("")
  // NULLED: No default ingredients - user must add manually
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [recipeUrl, setRecipeUrl] = useState("")
  const [analysisMode, setAnalysisMode] = useState<"product" | "manual" | "url">("product")
  
  // Product selection state
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [productSearch, setProductSearch] = useState("")
  const [ingredientQuery, setIngredientQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [hasMoreProducts, setHasMoreProducts] = useState(false)
  
  const { toast } = useToast()

  // Fetch user products with pagination
  const fetchProducts = async (page = 1, search = "") => {
    setLoadingProducts(true);
    try {
      const params = {
        page,
        per_page: 6, // Show 6 products per page
        search: search || undefined,
        status: 'published' // Only show published products
      };
      
      const response = await productsAPI.getAll(params);
      
      if (response && response.data) {
        // Handle Laravel pagination response
        setProducts(prevProducts => {
          return page === 1 ? response.data : [...prevProducts, ...response.data];
        });
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.last_page || 1);
        setTotalProducts(response.data.total || 0);
        setHasMoreProducts((response.data.current_page || 1) < (response.data.last_page || 1));
      } else if (response && Array.isArray(response)) {
        // Handle direct array response
        setProducts(prevProducts => {
          return page === 1 ? response : [...prevProducts, ...response];
        });
        setHasMoreProducts(false);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch products on component mount
  useEffect(() => {
    if (analysisMode === 'product') {
      fetchProducts(1, '');
    }
  }, [analysisMode]);

  // Handle search with debouncing
  useEffect(() => {
    if (analysisMode === 'product') {
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchProducts(1, productSearch);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [productSearch, analysisMode]);

  // Load more products
  const handleLoadMore = () => {
    if (hasMoreProducts && !loadingProducts) {
      fetchProducts(currentPage + 1, productSearch);
    }
  };

  // Handle product selection
  const handleProductSelect = async (product: Product) => {
    setSelectedProduct(product)
    setRecipeName(product.name)
    
    // Fetch product details to get ingredients
    try {
      const productDetails = await productsAPI.getById(product.id)
      if (productDetails && productDetails.data && productDetails.data.ingredients && productDetails.data.ingredients.length > 0) {
        // Format ingredients into a query string
        const ingredientsText = productDetails.data.ingredients
          .map((ing: any) => {
            const amount = ing.pivot?.amount || ing.amount || ''
            const unit = ing.pivot?.unit || ing.unit || ''
            const name = ing.name || ''
            
            if (amount && unit) {
              return `${amount} ${unit} ${name}`.trim()
            } else if (amount) {
              return `${amount} ${name}`.trim()
            } else {
              return name
            }
          })
          .filter(ingredient => ingredient.length > 0)
          .join(', ')
        
        setIngredientQuery(ingredientsText)
      } else {
        // If no ingredients found, set a placeholder
        setIngredientQuery(`Main ingredient: ${product.name}`)
        toast({
          title: "No ingredients found",
          description: "This product doesn't have detailed ingredients. You can edit the ingredients manually.",
          variant: "default"
        })
      }
    } catch (error) {
      console.error('Error fetching product details:', error)
      setIngredientQuery(`Main ingredient: ${product.name}`)
      toast({
        title: "Error",
        description: "Failed to load product ingredients. You can edit them manually.",
        variant: "destructive"
      })
    }
  }

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { 
        id: Date.now().toString(), 
        name: "", 
        quantity: "", 
        unit: "g" 
      }
    ])
  }



  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ingredient => ingredient.id !== id))
    }
  }

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(ingredients.map(ingredient =>
      ingredient.id === id ? { ...ingredient, [field]: value } : ingredient
    ))
  }

  const validateForm = () => {
    if (!recipeName.trim()) {
      toast({
        title: "Recipe name required",
        description: "Please enter a name for your recipe",
        variant: "destructive"
      })
      return false
    }

    if (analysisMode === "product") {
      if (!selectedProduct) {
        toast({
          title: "Product selection required",
          description: "Please select a product to analyze",
          variant: "destructive"
        })
        return false
      }
      if (!ingredientQuery.trim()) {
        toast({
          title: "Ingredients required",
          description: "No ingredients found for the selected product",
          variant: "destructive"
        })
        return false
      }
    } else if (analysisMode === "manual") {
      const validIngredients = ingredients.filter(ing => 
        ing.name.trim() && ing.quantity.trim()
      )
      
      if (validIngredients.length === 0) {
        toast({
          title: "Ingredients required",
          description: "Please add at least one ingredient with quantity",
          variant: "destructive"
        })
        return false
      }
    } else {
      if (!recipeUrl.trim()) {
        toast({
          title: "Recipe URL required",
          description: "Please enter a valid recipe URL",
          variant: "destructive"
        })
        return false
      }
    }

    return true
  }

  const analyzeRecipe = async () => {
    if (!validateForm()) return

    onAnalysisStart()

    try {
      // Prepare ingredients for API call
      let ingredientLines: string[] = []
      
      if (analysisMode === "product" && selectedProduct) {
        // Use product ingredients
        ingredientLines = ingredientQuery.split('\n').filter(line => line.trim())
      } else if (analysisMode === "manual") {
        // Use manual ingredients
        const validIngredients = ingredients.filter(ing => 
          ing.name.trim() && ing.quantity.trim()
        )
        ingredientLines = validIngredients.map(ing => 
          `${ing.quantity} ${ing.unit} ${ing.name}`
        )
      } else if (analysisMode === "url") {
        // For URL mode, we would need to extract ingredients from the URL
        // For now, use a placeholder
        ingredientLines = [`Recipe from ${recipeUrl}`]
      }

      console.log('Analyzing ingredients:', ingredientLines)
      
      // Make actual API call to nutrition analysis
      const response = await fetch('/api/edamam/nutrition/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: recipeName,
          ingr: ingredientLines,
          yield: parseInt(servings)
        })
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const apiData = await response.json()
      console.log('=== COMPREHENSIVE NUTRITION API RESPONSE DEBUG ===', {
        fullResponse: apiData,
        responseType: typeof apiData,
        hasSuccess: 'success' in apiData,
        hasData: 'data' in apiData,
        keys: Object.keys(apiData || {})
      })
      
      // Enhanced response format handling with debugging
      let nutritionData
      if (apiData.success !== undefined) {
        console.log('🔍 Detected wrapped response format')
        if (!apiData.success) {
          console.error('❌ API returned success: false', apiData)
          throw new Error(apiData.message || 'Nutrition analysis failed')
        }
        nutritionData = apiData.data
        console.log('✅ Extracted data from wrapped response:', nutritionData)
      } else {
        console.log('🔍 Detected direct response format')
        nutritionData = apiData
      }

      // Validate essential data structure
      if (!nutritionData) {
        console.error('❌ No nutrition data found in response')
        throw new Error('No nutrition data received from API')
      }

      console.log('=== NUTRITION DATA STRUCTURE ANALYSIS ===', {
        hasCalories: 'calories' in nutritionData,
        hasTotalNutrients: 'totalNutrients' in nutritionData,
        hasNutritionSummary: 'nutritionSummary' in nutritionData,
        hasTotalDaily: 'totalDaily' in nutritionData,
        hasHealthLabels: 'healthLabels' in nutritionData,
        hasCautions: 'cautions' in nutritionData,
        hasDietLabels: 'dietLabels' in nutritionData,
        hasYield: 'yield' in nutritionData,
        hasTotalWeight: 'totalWeight' in nutritionData,
        totalNutrientsKeys: nutritionData.totalNutrients ? Object.keys(nutritionData.totalNutrients) : [],
        nutritionSummaryStructure: nutritionData.nutritionSummary || null
      })

      // Enhanced macro extraction with multiple fallback paths
      const extractMacroValue = (paths: string[], fallback = 0) => {
        for (const path of paths) {
          try {
            const value = path.split('.').reduce((obj, key) => obj?.[key], nutritionData)
            if (typeof value === 'number' && !isNaN(value)) {
              console.log(`✅ Found macro value for path ${path}:`, value)
              return Math.round(value * 100) / 100 // Round to 2 decimal places
            }
          } catch (e) {
            console.log(`❌ Failed to extract from path ${path}:`, e)
          }
        }
        console.log(`⚠️ Using fallback value ${fallback} for paths:`, paths)
        return fallback
      }

      // Enhanced micronutrient extraction with comprehensive mapping
      // Fixed to return proper format: {label, quantity, unit, percentage}
      const extractMicronutrients = () => {
        const microMap = {
          'VITC': 'Vitamin C',
          'FE': 'Iron',
          'CA': 'Calcium',
          'NA': 'Sodium',
          'K': 'Potassium',
          'MG': 'Magnesium',
          'P': 'Phosphorus',
          'ZN': 'Zinc',
          'VITA_RAE': 'Vitamin A',
          'VITB6A': 'Vitamin B6',
          'VITB12': 'Vitamin B12',
          'VITD': 'Vitamin D',
          'TOCPHA': 'Vitamin E',
          'VITK1': 'Vitamin K',
          'FOLDFE': 'Folate',
          'NIA': 'Niacin',
          'RIBF': 'Riboflavin',
          'THIA': 'Thiamin'
        }

        const micros: Record<string, {label: string, quantity: number, unit: string, percentage: number}> = {}
        
        // Extract from totalNutrients if available
        if (nutritionData.totalNutrients) {
          for (const [key, nutrient] of Object.entries(nutritionData.totalNutrients)) {
            if (typeof nutrient === 'object' && nutrient !== null) {
              micros[key] = {
                label: (nutrient as any).label || microMap[key] || key,
                quantity: (nutrient as any).quantity || 0,
                unit: (nutrient as any).unit || '',
                percentage: (nutrient as any).percentage || 0
              }
            }
          }
        } else {
          // Fallback: create entries for known micronutrients with zero values
          for (const [key, label] of Object.entries(microMap)) {
            micros[key] = {
              label,
              quantity: 0,
              unit: 'mg',
              percentage: 0
            }
          }
        }

        console.log('🔬 Extracted micronutrients (fixed format):', micros)
        return micros
      }

      // Enhanced allergen detection
      const extractAllergens = () => {
        const healthLabels = nutritionData.healthLabels || []
        console.log('🔍 Processing health labels for allergens:', healthLabels)
        
        const allergenMap = {
          'gluten': ['gluten', 'wheat'],
          'dairy': ['dairy', 'milk'],
          'eggs': ['egg'],
          'peanuts': ['peanut'],
          'tree nuts': ['tree_nut', 'tree nut'],
          'soy': ['soy'],
          'fish': ['fish'],
          'shellfish': ['shellfish', 'crustacean']
        }

        const detectedAllergens = new Set<string>()
        
        for (const label of healthLabels) {
          const lowerLabel = label.toLowerCase().replace(/[-_]/g, ' ')
          for (const [allergen, keywords] of Object.entries(allergenMap)) {
            if (keywords.some(keyword => lowerLabel.includes(keyword))) {
              detectedAllergens.add(allergen)
              console.log(`✅ Detected allergen '${allergen}' from label '${label}'`)
            }
          }
        }

        return Array.from(detectedAllergens)
      }

      // Enhanced warning system
      const generateWarnings = () => {
        const warnings = []
        
        // Process cautions
        if (nutritionData.cautions && Array.isArray(nutritionData.cautions)) {
          warnings.push(...nutritionData.cautions.map((caution: string) => ({
            type: 'warning' as const,
            message: caution,
            severity: 'medium' as const
          })))
          console.log('⚠️ Added caution warnings:', nutritionData.cautions)
        }

        // Process diet labels as info
        if (nutritionData.dietLabels && Array.isArray(nutritionData.dietLabels)) {
          warnings.push(...nutritionData.dietLabels.map((label: string) => ({
            type: 'info' as const,
            message: `Diet compatible: ${label.replace(/[-_]/g, ' ').toLowerCase()}`,
            severity: 'low' as const
          })))
          console.log('ℹ️ Added diet label info:', nutritionData.dietLabels)
        }

        // Process high daily value warnings
        if (nutritionData.totalDaily) {
          const highNutrients = Object.entries(nutritionData.totalDaily)
            .filter(([key, nutrient]: [string, any]) => nutrient?.quantity > 50)
            .map(([key, nutrient]: [string, any]) => {
              const severity = nutrient.quantity > 100 ? 'high' : 'medium'
              return {
                type: 'warning' as const,
                message: `High ${nutrient.label || key}: ${nutrient.quantity.toFixed(1)}% daily value`,
                severity: severity as 'high' | 'medium'
              }
            })
          
          warnings.push(...highNutrients)
          console.log('📊 Added high nutrient warnings:', highNutrients)
        }

        return warnings
      }

      // Comprehensive data transformation with debugging
      const transformedData = {
        totalCalories: Math.round(nutritionData.calories || 0),
        macros: {
          protein: extractMacroValue([
            'nutritionSummary.macronutrients.protein.grams',
            'totalNutrients.PROCNT.quantity'
          ]),
          carbs: extractMacroValue([
            'nutritionSummary.macronutrients.carbs.grams',
            'totalNutrients.CHOCDF.quantity'
          ]),
          fat: extractMacroValue([
            'nutritionSummary.macronutrients.fat.grams',
            'totalNutrients.FAT.quantity'
          ]),
          fiber: extractMacroValue([
            'nutritionSummary.fiber',
            'totalNutrients.FIBTG.quantity'
          ])
        },
        micros: extractMicronutrients(),
        allergens: extractAllergens(),
        warnings: generateWarnings(),
        servings: parseInt(servings) || 1,
        weightPerServing: Math.round(nutritionData.totalWeight || 100)
      }

      console.log('=== TRANSFORMED DATA ===', transformedData)
      console.log('Calling onAnalysisComplete with:', transformedData, recipeName)
      onAnalysisComplete(transformedData, recipeName)
      
      toast({
        title: "Analysis complete",
        description: `${recipeName} has been analyzed successfully`,
      })

    } catch (error) {
      console.error('❌ Recipe analysis error:', error)
      onAnalysisError()
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze recipe'
      toast({
        title: "Analysis failed",
        description: `There was an error analyzing your recipe: ${errorMessage}`,
        variant: "destructive"
      })
    }
  }

  const unitOptions = ["g", "kg", "ml", "l", "cup", "tbsp", "tsp", "piece", "slice"]

  return (
    <div className="space-y-6">
      {/* Recipe Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            Recipe Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recipeName">Recipe Name *</Label>
              <Input
                id="recipeName"
                placeholder="e.g., Mediterranean Pasta Salad"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Servings *</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                max="20"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prepTime">Prep Time (optional)</Label>
            <Input
              id="prepTime"
              placeholder="e.g., 30 minutes"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Button
              variant={analysisMode === "product" ? "default" : "outline"}
              onClick={() => setAnalysisMode("product")}
              className="flex-1"
            >
              <Package className="w-4 h-4 mr-2" />
              Select Product
            </Button>
            <Button
              variant={analysisMode === "manual" ? "default" : "outline"}
              onClick={() => setAnalysisMode("manual")}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Manual Entry
            </Button>
            <Button
              variant={analysisMode === "url" ? "default" : "outline"}
              onClick={() => setAnalysisMode("url")}
              className="flex-1"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Import from URL
            </Button>
          </div>

          {analysisMode === "product" ? (
            <div className="space-y-4">
              {/* Product Search */}
              <div className="space-y-2">
                <Label htmlFor="productSearch">Search Your Products</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="productSearch"
                    placeholder="Search by product name or description..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Product Selection Grid */}
              <div className="space-y-2">
                <Label>Select Product *</Label>
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Loading your products...</span>
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {productSearch ? 'No products found matching your search.' : 'No products found. Create some products first.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 max-h-64 overflow-y-auto">
                      {products.map((product) => (
                      <div
                        key={product.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedProduct?.id === product.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleProductSelect(product)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Product Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {product.image || product.image_url ? (
                              <img
                                src={product.image || product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${product.image || product.image_url ? 'hidden' : ''}`}>
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {product.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {product.category?.name || 'No Category'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {product.status}
                                  </Badge>
                                </div>
                              </div>
                              {selectedProduct?.id === product.id && (
                                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                    
                    {/* Load More Button */}
                    {hasMoreProducts && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={handleLoadMore}
                          disabled={loadingProducts}
                          className="w-full"
                        >
                          {loadingProducts ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Loading more...
                            </>
                          ) : (
                            `Load More Products (${totalProducts - products.length} remaining)`
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ingredient Query Box */}
              {selectedProduct && (
                <div className="space-y-2">
                  <Label htmlFor="ingredientQuery">Ingredients Data</Label>
                  <Textarea
                    id="ingredientQuery"
                    placeholder="Ingredients will be loaded automatically when you select a product..."
                    value={ingredientQuery}
                    onChange={(e) => setIngredientQuery(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can edit the ingredients data before analysis if needed.
                  </p>
                </div>
              )}
            </div>
          ) : analysisMode === "manual" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ingredients *</Label>
                <Button onClick={addIngredient} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              

              
              {/* Individual Ingredients */}
              {ingredients.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Individual Ingredients ({ingredients.length})</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ingredients.map((ingredient, index) => (
                      <div key={ingredient.id} className="flex gap-2 items-end p-3 bg-muted/20 rounded-lg">
                        <div className="flex-1">
                          <Input
                            placeholder="Ingredient name"
                            value={ingredient.name}
                            onChange={(e) => updateIngredient(ingredient.id, "name", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            placeholder="Amount"
                            value={ingredient.quantity}
                            onChange={(e) => updateIngredient(ingredient.id, "quantity", e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="w-20">
                          <select
                            className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                            value={ingredient.unit}
                            onChange={(e) => updateIngredient(ingredient.id, "unit", e.target.value)}
                          >
                            {unitOptions.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => removeIngredient(ingredient.id)}
                          className="h-9 w-9"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {ingredients.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No ingredients added yet</p>
                  <p className="text-xs">Add ingredients individually</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipeUrl">Recipe URL *</Label>
                <Input
                  id="recipeUrl"
                  placeholder="https://example.com/recipe"
                  value={recipeUrl}
                  onChange={(e) => setRecipeUrl(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Supported sites: AllRecipes, Food Network, BBC Good Food, and more
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Scale className="w-4 h-4" />
                Portion analysis
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Per serving calculation
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Real-time validation
              </div>
            </div>
            <Button 
              onClick={analyzeRecipe}
              disabled={isAnalyzing}
              size="lg"
              className="btn-gradient"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {analysisMode === "product" ? "Analyzing Product..." : "Analyzing Recipe..."}
                </>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 mr-2" />
                  {analysisMode === "product" ? "Analyze Product Nutrition" : "Analyze Recipe"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-medium mb-2">Tips for better analysis:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be specific with ingredient names (e.g., "extra virgin olive oil" vs "oil")</li>
            <li>• Include cooking methods that affect nutrition (e.g., "grilled chicken breast")</li>
            <li>• Specify brands for processed foods when possible</li>
            <li>• Use weight measurements (grams) for most accurate results</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}