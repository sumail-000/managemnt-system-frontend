import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Clock, ChefHat, AlertTriangle, Download, Save, Database, X } from "lucide-react"
import ProductSelector from "./ProductSelector"
import { NutritionDashboard } from "./NutritionDashboard"
import { AllergenDetector } from "./AllergenDetector"
import { WarningSystem } from "./WarningSystem"
import { NutritionExport } from "./NutritionExport"
import { edamamAPI } from "@/services/api"
import { toast } from "@/hooks/use-toast"
import { NutritionAnalysisResponse, NutritionLoadResponse } from "@/types/api"

interface NutritionData {
  totalCalories: number
  macros: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  micros: Record<string, {
    label: string
    quantity: number
    unit: string
    percentage: number
  }>
  allergens: string[]
  warnings: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    severity: 'low' | 'medium' | 'high'
  }>
  servings: number
  weightPerServing: number
  healthLabels?: string[]
  totalDaily?: Record<string, {
    label: string
    quantity: number
    unit: string
  }>
  dietLabels?: string[]
  nutritionSummary?: {
    macronutrients?: {
      protein?: { grams: number }
      carbs?: { grams: number }
      fat?: { grams: number }
    }
    fiber?: number
    [key: string]: any
  }
  // Additional properties for saved data transformation
  autoTags?: string[]
  dietClassification?: string[]
  highNutrients?: Array<{
    nutrient: string
    label: string
    percentage: number
    level: 'very_high' | 'high' | 'moderate'
  }>
  microProfileNutrients?: Array<{
    name: string
    amount: number
    unit: string
    dailyValue: number
  }>
  regulatoryWarnings?: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    severity: 'low' | 'medium' | 'high'
  }>
  allergenDetection?: string[]
}

export function NutritionAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [activeTab, setActiveTab] = useState("analyzer")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [ingredientQuery, setIngredientQuery] = useState("")
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    id: string
    recipeName: string
    analyzedAt: Date
    calories: number
    nutritionData: NutritionData
    productId?: string
  }>>([])  
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [loadedFromDatabase, setLoadedFromDatabase] = useState(false)

  // Check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const loadData = urlParams.get('loadData')
    const productId = urlParams.get('productId')
    
    if (loadData === 'true' && productId) {
      loadExistingNutritionData(productId)
    }
  }, [])

  // Function to load existing nutrition data from database
  const loadExistingNutritionData = async (productId: string) => {
    setIsLoadingData(true)
    try {
      const response: NutritionLoadResponse = await edamamAPI.nutrition.loadNutritionData(productId)
      // Fix: Due to axios interceptor, data is at response.data, not response.data.data
      const savedData = response.data
      
      console.log('=== LOADED NUTRITION DATA FROM DATABASE ===', savedData)
      
      // Transform saved data back to NutritionData interface
      const transformedData: NutritionData = {
        totalCalories: savedData.basic_nutrition?.total_calories || 0,
        macros: {
          protein: savedData.macronutrients?.protein || 0,
          carbs: savedData.macronutrients?.carbohydrates || 0,
          fat: savedData.macronutrients?.fat || 0,
          fiber: savedData.macronutrients?.fiber || 0
        },
        micros: savedData.micronutrients || {},
        allergens: savedData.allergens || [],
        warnings: savedData.warnings || [],
        servings: savedData.basic_nutrition?.servings || 1,
        weightPerServing: savedData.basic_nutrition?.weight_per_serving || 100,
        healthLabels: savedData.health_labels || [],
        dietLabels: savedData.diet_labels || [],
        highNutrients: savedData.high_nutrients || [],
        nutritionSummary: savedData.nutrition_summary || {},
        totalDaily: savedData.daily_values || {}
      }
      
      setNutritionData(transformedData)
      setLoadedFromDatabase(true)
      setActiveTab("dashboard")
      
      // Add to history with loaded indicator (handle duplicates)
      const newHistoryItem = {
        id: `${productId}-${Date.now()}`,
        recipeName: `${savedData.analysis_metadata?.product_name || 'Unknown Product'} (Loaded)`,
        analyzedAt: new Date(savedData.analysis_metadata?.analyzed_at || new Date()),
        calories: transformedData.totalCalories,
        nutritionData: transformedData,
        productId: productId
      }
      
      setAnalysisHistory(prev => {
        // Remove any existing entry for the same product
        const filteredHistory = prev.filter(item => item.productId !== productId)
        return [newHistoryItem, ...filteredHistory.slice(0, 9)]
      })
      
      toast({
        title: "Data Loaded Successfully",
        description: `Nutrition data for ${savedData.analysis_metadata?.product_name || 'the product'} has been loaded from the database.`,
      })
      
    } catch (error) {
      console.error('Error loading nutrition data:', error)
      toast({
        title: "Error Loading Data",
        description: "Failed to load nutrition data from the database. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleAnalysisComplete = (data: NutritionData, recipeName: string) => {
    console.log('Analysis complete called with data:', data)
    console.log('Setting nutritionData to:', data)
    setNutritionData(data)
    setIsAnalyzing(false)
    setLoadedFromDatabase(false)
    setActiveTab("dashboard")
    
    // Add to history (handle duplicates)
    const newHistoryItem = {
      id: `new-${Date.now()}`,
      recipeName,
      analyzedAt: new Date(),
      calories: data.totalCalories,
      nutritionData: data,
      productId: selectedProduct?.id
    }
    
    setAnalysisHistory(prev => {
      // Remove any existing entry for the same product if it exists
      const filteredHistory = selectedProduct?.id 
        ? prev.filter(item => item.productId !== selectedProduct.id)
        : prev.filter(item => item.recipeName !== recipeName)
      return [newHistoryItem, ...filteredHistory.slice(0, 9)] // Keep last 10
    })
    console.log('nutritionData should now be set')
  }

  // Helper function to categorize and format cautions professionally
  const processCautions = (cautions: string[] = []) => {
    if (!cautions || cautions.length === 0) {
      console.log('✅ No cautions found in product - clean ingredient profile')
      return []
    }

    console.log(`⚠️ Processing ${cautions.length} caution(s):`, cautions)
    
    return cautions.map((caution: string) => {
      const formattedCaution = caution.toUpperCase().trim()
      
      // Categorize cautions by risk level and regulatory importance
      const cautionCategories = {
        high: {
          items: ['SULFITES', 'NITRATES', 'NITRITES', 'MSG', 'ARTIFICIAL_COLORS', 'BHA', 'BHT'],
          description: 'High priority - May cause adverse reactions in sensitive individuals'
        },
        medium: {
          items: ['SODIUM_BENZOATE', 'POTASSIUM_SORBATE', 'CARRAGEENAN'],
          description: 'Medium priority - Generally recognized as safe but worth noting'
        },
        low: {
          items: ['NATURAL_FLAVORS', 'CITRIC_ACID', 'ASCORBIC_ACID'],
          description: 'Low priority - Common food additives'
        }
      }
      
      let severity: 'low' | 'medium' | 'high' = 'medium'
      let description = 'Please review ingredient list for dietary restrictions'
      
      // Determine severity and provide specific guidance
      if (cautionCategories.high.items.includes(formattedCaution)) {
        severity = 'high'
        description = `${cautionCategories.high.description}. Consider alternative products for sensitive consumers.`
      } else if (cautionCategories.low.items.includes(formattedCaution)) {
        severity = 'low'
        description = `${cautionCategories.low.description}. Generally safe for consumption.`
      } else {
        description = `${cautionCategories.medium.description}. Review with dietary requirements.`
      }
      
      return {
        type: 'warning' as const,
        message: `Contains ${formattedCaution}: ${description}`,
        severity
      }
    })
  }

  const handleAnalyze = async () => {
    if (!selectedProduct || !ingredientQuery.trim()) return

    setIsAnalyzing(true)
    
    try {
      // Parse ingredients from the ingredient query
      // Handle both newline-separated and comma-separated formats
      let ingredientLines = ingredientQuery
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('Please add') && !line.startsWith('Example format'))
      
      // If we only have one line, try splitting by commas (legacy format)
      if (ingredientLines.length === 1 && ingredientLines[0].includes(',')) {
        ingredientLines = ingredientLines[0]
          .split(',')
          .map(ingredient => {
            // Convert from "lemon (1.10g)" to "lemon 1.10g" format
            const match = ingredient.trim().match(/^(.+?)\s*\((.+?)\)$/)
            if (match) {
              return `${match[1].trim()} ${match[2].trim()}`
            }
            return ingredient.trim()
          })
          .filter(line => line.length > 0)
      }
      
      if (ingredientLines.length === 0) {
        throw new Error('No valid ingredients found. Please add ingredient information.')
      }

      console.log('=== NUTRITION ANALYSIS REQUEST ===')
      console.log('Selected product:', selectedProduct.name)
      console.log('Selected product ID:', selectedProduct.id)
      console.log('Ingredient lines:', ingredientLines)
      
      // Call the real Edamam nutrition analysis API with product_id
      const response: NutritionAnalysisResponse = await edamamAPI.nutrition.analyze(ingredientLines, selectedProduct.id)
      
      console.log('=== NUTRITION ANALYSIS RESPONSE ===')
      console.log('Full API response:', response)
      console.log('Response data:', response.data)
      
      if (!response.data) {
        throw new Error('No response data received')
      }
      
      // Check if the response has a success field and handle accordingly
      let nutritionData;
      if (response.success !== undefined) {
        // New API format with success wrapper
        if (!response.success) {
          throw new Error(response.message || 'Nutrition analysis failed')
        }
        nutritionData = response.data
      } else {
        // Direct data format (current responsedata.txt format)
        nutritionData = response.data || response
      }
      
      // Transform API response to match our NutritionData interface
      // Updated to properly map responsedata.txt structure
      const transformedData = {
        totalCalories: nutritionData.calories || 0,
        macros: {
          protein: nutritionData.nutritionSummary?.macronutrients?.protein?.grams || 0,
          carbs: nutritionData.nutritionSummary?.macronutrients?.carbs?.grams || 0,
          fat: nutritionData.nutritionSummary?.macronutrients?.fat?.grams || 0,
          fiber: nutritionData.nutritionSummary?.fiber || 0
        },
        micros: Object.fromEntries(
          Object.entries(nutritionData.totalNutrients || {}).map(([key, nutrient]: [string, any]) => [
            key,
            {
              label: nutrient.label,
              quantity: nutrient.quantity,
              unit: nutrient.unit,
              percentage: nutrient.percentage
            }
          ])
        ),
        allergens: nutritionData.healthLabels?.filter((label: string) => 
          ['gluten', 'dairy', 'eggs', 'nuts', 'soy', 'shellfish', 'fish'].some(allergen => 
            label.toLowerCase().includes(allergen)
          )
        ) || [],
        warnings: [
          // Process cautions array using the helper function
          ...processCautions(nutritionData.cautions),
          ...(nutritionData.healthLabels || []).map((label: string) => ({
            type: 'info' as const,
            message: `Health label: ${label}`,
            severity: 'low' as const
          }))
        ],
        servings: nutritionData.yield || selectedProduct.servings_per_container || 1,
        weightPerServing: nutritionData.totalWeight || selectedProduct.serving_size || 100,
        healthLabels: nutritionData.healthLabels || [],
        // Enhanced API data
        dietLabels: nutritionData.dietLabels || [],
        highNutrients: nutritionData.highNutrients || [],
        nutritionSummary: nutritionData.nutritionSummary ? {
          caloriesPerGram: nutritionData.nutritionSummary.caloriesPerGram,
          sodium: nutritionData.nutritionSummary.sodium,
          sugar: nutritionData.nutritionSummary.sugar
        } : undefined,
        totalDaily: nutritionData.totalDaily || {}
      }
      
      console.log('=== TRANSFORMED NUTRITION DATA ===')
      console.log('Transformed data:', transformedData)

      handleAnalysisComplete(transformedData, selectedProduct.name)
      
    } catch (error) {
      console.error('❌ Nutrition analysis error:', error)
      setIsAnalyzing(false)
      
      // Show error message to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze nutrition data'
      // You might want to add a toast notification here
      alert(`Nutrition Analysis Error: ${errorMessage}`)
    }
  }

  const handleStartNewAnalysis = () => {
    setNutritionData(null)
    setActiveTab("analyzer")
  }

  const handleSwitchToAnalysis = (historyItem: any) => {
    setNutritionData(historyItem.nutritionData)
    setLoadedFromDatabase(historyItem.recipeName.includes('(Loaded)'))
    setActiveTab("dashboard")
    
    toast({
      title: "Analysis Loaded",
      description: `Switched to ${historyItem.recipeName.replace(' (Loaded)', '')}`
    })
  }

  const handleRemoveFromHistory = (itemId: string) => {
    setAnalysisHistory(prev => prev.filter(item => item.id !== itemId))
    
    toast({
      title: "Removed from History",
      description: "Analysis has been removed from recent history."
    })
  }

  const handleSaveData = async () => {
    if (!nutritionData || !selectedProduct) {
      toast({
        title: "No Data to Save",
        description: "Please complete a nutritional analysis first before saving.",
        variant: "destructive"
      })
      return
    }

    try {
      // Prepare raw nutrition data for backend storage
      // Only send data that backend needs to store, not processed display values
      const saveData = {
        product_id: selectedProduct.id.toString(),
        
        // Basic nutrition facts (raw values)
        basic_nutrition: {
          total_calories: nutritionData.totalCalories,
          servings: nutritionData.servings,
          weight_per_serving: nutritionData.weightPerServing
        },
        
        // Raw macronutrient data (grams)
        macronutrients: {
          protein: nutritionData.macros.protein,
          carbohydrates: nutritionData.macros.carbs,
          fat: nutritionData.macros.fat,
          fiber: nutritionData.macros.fiber
        },
        
        // Raw micronutrient data (quantities and units)
        micronutrients: nutritionData.micros,
        
        // Raw daily values data
        daily_values: nutritionData.totalDaily || {},
        
        // Health and diet labels (raw from API)
        health_labels: nutritionData.healthLabels || [],
        diet_labels: nutritionData.dietLabels || [],
        
        // Raw allergen data
        allergens: nutritionData.allergens || [],
        
        // Raw warning data
        warnings: nutritionData.warnings || [],
        
        // High nutrient data (raw from API)
        high_nutrients: nutritionData.highNutrients || [],
        
        // Raw nutrition summary data
        nutrition_summary: nutritionData.nutritionSummary || {},
        
        // Analysis metadata
        analysis_metadata: {
          analyzed_at: new Date().toISOString(),
          ingredient_query: ingredientQuery,
          product_name: selectedProduct.name
        }
      };

      // Call the comprehensive save API
      await edamamAPI.nutrition.saveNutritionData(saveData);
      
      toast({
        title: "✅ Data Saved Successfully!",
        description: `Nutritional analysis for "${selectedProduct.name}" has been saved to your database. You can now access this data anytime from the product selector.`,
      })
      
    } catch (error) {
      console.error('Error saving nutrition data:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save nutrition data. Please check your connection and try again.",
        variant: "destructive"
      })
    }
  }





  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nutrition Analysis</h1>
          <p className="text-muted-foreground">
            {isLoadingData 
              ? "Loading nutrition data from database..."
              : loadedFromDatabase 
                ? "Viewing saved nutritional data from database"
                : "Analyze your recipes for complete nutritional information and compliance"
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          {loadedFromDatabase ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              Loaded from Database
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              Edamam API
            </Badge>
          )}
          {nutritionData && (
            <>
              <Button onClick={handleStartNewAnalysis} variant="outline">
                {loadedFromDatabase ? "Analyze Another Recipe" : "Analyze Another Recipe"}
              </Button>
              {!loadedFromDatabase && (
                <Button onClick={handleSaveData} variant="default">
                  <Save className="w-4 h-4 mr-2" />
                  Save Data
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Analysis History Quick Access */}
      {analysisHistory.length > 0 && (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {analysisHistory.slice(0, 5).map((analysis) => (
                <div key={analysis.id} className="relative group flex-shrink-0">
                  <Button
                    variant={nutritionData && analysis.nutritionData === nutritionData ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap pr-8 transition-all duration-200 hover:shadow-md"
                    onClick={() => handleSwitchToAnalysis(analysis)}
                  >
                    <ChefHat className="w-3 h-3 mr-2" />
                    {analysis.recipeName} ({analysis.calories} cal)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFromHistory(analysis.id)
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            {analysisHistory.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing 5 of {analysisHistory.length} recent analyses
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Interface */}
      <Card className="dashboard-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="analyzer">Product Selection</TabsTrigger>
              <TabsTrigger value="dashboard">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="allergens">
                Allergens
              </TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings
              </TabsTrigger>
              <TabsTrigger value="export">
                Export
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="analyzer" className="mt-0">
              <ProductSelector
                onProductSelect={setSelectedProduct}
                onAnalyze={handleAnalyze}
                selectedProduct={selectedProduct}
                ingredientQuery={ingredientQuery}
                onIngredientQueryChange={setIngredientQuery}
                isAnalyzing={isAnalyzing}
              />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0">
              {nutritionData ? (
                <NutritionDashboard data={nutritionData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analysis data available. Please analyze a recipe first.
                </div>
              )}
            </TabsContent>

            <TabsContent value="allergens" className="mt-0">
              {nutritionData ? (
                <AllergenDetector allergens={nutritionData.allergens} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No allergen data available. Please analyze a recipe first.
                </div>
              )}
            </TabsContent>

            <TabsContent value="warnings" className="mt-0">
              {nutritionData ? (
                <WarningSystem 
                  warnings={nutritionData.warnings}
                  nutritionData={nutritionData}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No warning data available. Please analyze a recipe first.
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              {nutritionData ? (
                <NutritionExport data={nutritionData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data to export. Please analyze a recipe first.
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Quick Stats */}
      {nutritionData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="dashboard-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Calories</p>
                  <p className="text-2xl font-bold">{nutritionData.totalCalories}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Allergens Found</p>
                  <p className="text-2xl font-bold">{nutritionData.allergens.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="dashboard-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Servings</p>
                  <p className="text-2xl font-bold">{nutritionData.servings}</p>
                </div>
                <ChefHat className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}