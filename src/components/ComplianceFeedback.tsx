import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Flame, Heart, Scale, Award, TrendingUp, AlertTriangle, Zap, BarChart3, Star } from "lucide-react"
import { Product, NutritionalData } from "@/types/product"

interface ComplianceFeedbackProps {
  product: Product | null
}

// Function to extract nutrition data from the product's nutritional_data
const getNutritionDataFromProduct = (product: Product) => {
  // Get the latest nutritional data entry
  const nutritionalData = product.nutritional_data?.[0]
  
  if (!nutritionalData) {
    return null
  }

  // Extract values from the nutritional data structure
  const calories = nutritionalData.basic_nutrition?.total_calories || 0
  const protein = nutritionalData.macronutrients?.protein || 0
  const carbs = nutritionalData.macronutrients?.carbohydrates || 0
  const fat = nutritionalData.macronutrients?.fat || 0
  const fiber = nutritionalData.macronutrients?.fiber || 0
  const servings = nutritionalData.basic_nutrition?.servings || 1
  
  // Extract sodium using correct micronutrient key 'NA' (as used in NutritionDashboard)
  const sodium = nutritionalData.micronutrients?.NA?.quantity || 
                nutritionalData.micronutrients?.Sodium?.quantity ||
                nutritionalData.daily_values?.NA?.quantity || 0
  
  // Extract sugar from nutrition_summary (as used in NutritionDashboard)
  const sugar = nutritionalData.nutrition_summary?.sugar || 
               nutritionalData.micronutrients?.sugar?.quantity || 0
  
  // Extract vitamin C using correct key 'VITC'
  const vitaminC = nutritionalData.micronutrients?.VITC?.percentage || 
                  nutritionalData.micronutrients?.vitaminC?.percentage || 
                  nutritionalData.micronutrients?.["vitamin-c"]?.percentage || 0
  
  // Get diet labels
  const dietLabels = nutritionalData.diet_labels || []
  const micronutrients = nutritionalData.micronutrients || {}
  const dailyValues = nutritionalData.daily_values || {}
  
  // Get warnings for health score calculation (matching NutritionDashboard approach)
  let warnings = nutritionalData.warnings || []
  
  // If no warnings are saved, generate them dynamically like NutritionDashboard
  if (warnings.length === 0) {
    warnings = generateWarnings({
      sodium,
      calories,
      fat,
      servings,
      micronutrients,
      dailyValues
    })
  }
  
  return {
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sodium,
    sugar,
    vitaminC,
    dietLabels,
    cautions: nutritionalData.cautions || [],
    healthLabels: nutritionalData.health_labels || [],
    highNutrients: nutritionalData.high_nutrients || [],
    warnings,
    servings
  }
}

// Generate warnings dynamically when not available in saved data
const generateWarnings = (data: {
  sodium: number
  calories: number
  fat: number
  servings: number
  micronutrients: any
  dailyValues: any
}) => {
  const warnings: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    severity: 'low' | 'medium' | 'high'
  }> = []
  
  // Calculate per serving values
  const perServing = {
    calories: Math.round(data.calories / data.servings),
    sodium: Math.round(data.sodium / data.servings),
    fat: Math.round(data.fat / data.servings)
  }
  
  // Sodium warnings (per serving)
  const sodiumDailyLimit = 2300 // mg
  if (perServing.sodium > sodiumDailyLimit * 0.2) { // 20% of daily value per serving
    const severityLevel = perServing.sodium > sodiumDailyLimit * 0.4 ? 'high' : 'medium'
    warnings.push({
      type: 'warning',
      message: `High sodium content: ${perServing.sodium}mg per serving`,
      severity: severityLevel
    })
  }
  
  // Calorie warnings (per serving)
  const caloriesDailyLimit = 2000
  if (perServing.calories > caloriesDailyLimit * 0.25) { // 25% of daily calories per serving
    const severityLevel = perServing.calories > caloriesDailyLimit * 0.4 ? 'high' : 'medium'
    warnings.push({
      type: 'warning',
      message: `High calorie content: ${perServing.calories} calories per serving`,
      severity: severityLevel
    })
  }
  
  // Fat warnings (per serving)
  const fatDailyLimit = 65 // g
  if (perServing.fat > fatDailyLimit * 0.25) { // 25% of daily fat per serving
    const severityLevel = perServing.fat > fatDailyLimit * 0.4 ? 'high' : 'medium'
    warnings.push({
      type: 'warning',
      message: `High fat content: ${perServing.fat}g per serving`,
      severity: severityLevel
    })
  }
  
  // High daily value warnings from micronutrients
  if (data.dailyValues) {
    Object.entries(data.dailyValues).forEach(([key, nutrient]: [string, any]) => {
      if (nutrient?.quantity > 50) {
        const severity = nutrient.quantity > 100 ? 'high' : 'medium'
        warnings.push({
          type: 'warning',
          message: `High ${nutrient.label || key}: ${nutrient.quantity.toFixed(1)}% daily value`,
          severity: severity as 'high' | 'medium'
        })
      }
    })
  }
  
  return warnings
}

export function ComplianceFeedback({ product }: ComplianceFeedbackProps) {

  const metrics = useMemo(() => {
    if (!product) return null

    const nutritionData = getNutritionDataFromProduct(product)
    
    // If no nutritional data is available, return null
    if (!nutritionData) return null

    // Calculate health score using EXACT same logic as NutritionDashboard
    const healthScore = Math.max(0, Math.min(100, 
      80 - (nutritionData.warnings.filter(w => w.severity === 'high').length * 20) -
      (nutritionData.warnings.filter(w => w.severity === 'medium').length * 10)
    ))

    // Calculate nutritional highlights based on real data
    const highlights = []
    
    // Add highlights from health labels (primary source)
    if (nutritionData.healthLabels && nutritionData.healthLabels.length > 0) {
      nutritionData.healthLabels.forEach(label => {
        // Clean up label formatting
        const cleanLabel = label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        if (!highlights.includes(cleanLabel)) {
          highlights.push(cleanLabel)
        }
      })
    }
    
    // Add highlights from high nutrients (secondary source)
    if (nutritionData.highNutrients && nutritionData.highNutrients.length > 0) {
      nutritionData.highNutrients.forEach(nutrient => {
        const highlight = `High ${nutrient.label || nutrient.nutrient}`
        if (!highlights.includes(highlight) && highlights.length < 5) {
          highlights.push(highlight)
        }
      })
    }
    
    // Add basic nutritional highlights if space available
    if (highlights.length < 5) {
      if (nutritionData.protein > 15) highlights.push('High Protein')
      if (nutritionData.fiber > 5) highlights.push('Good Fiber Source')
      if (nutritionData.vitaminC > 50) highlights.push('Rich in Vitamin C')
      if (nutritionData.calories < 100) highlights.push('Low Calorie')
      if (healthScore > 85) highlights.push('Excellent Nutritional Profile')
    }

    return {
      caloriesPerServing: Math.round(nutritionData.calories),
      healthScore,
      perServingAnalysis: {
        protein: Math.round(nutritionData.protein * 10) / 10,
        carbs: Math.round(nutritionData.carbs * 10) / 10,
        fat: Math.round(nutritionData.fat * 10) / 10
      },
      nutritionalHighlights: highlights.slice(0, 5), // Limit to 5 highlights
      nutritionData
    }
  }, [product])

  if (!product) return null
  
  if (!metrics) {
    return (
      <div className="space-y-6">
        <Card className="dashboard-card">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-2">No Nutritional Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Compliance feedback requires nutritional analysis data for this product.
                </p>
                <Badge variant="outline" className="text-xs">
                  Analyze nutrition to view compliance metrics
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="space-y-8">
      {/* Advanced Infographic-Style Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-purple-500/10 rounded-2xl p-8 border border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" />
        <div className="relative grid gap-6 md:grid-cols-3">
          {/* Main Health Score - Center Piece */}
          <div className="md:col-span-1 flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-card to-card/80 shadow-2xl flex items-center justify-center border border-border/30">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getHealthScoreColor(metrics.healthScore)}`}>
                    {metrics.healthScore}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">Health Score</div>
                </div>
              </div>
              <div className="absolute -inset-2">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-purple-500/20 animate-pulse" />
              </div>
            </div>
            <Progress value={metrics.healthScore} className="h-3 w-24 mt-4 bg-muted/50" />
            <span className="text-sm font-medium text-foreground mt-2">{getHealthScoreLabel(metrics.healthScore)} Quality</span>
          </div>

          {/* Key Metrics Grid */}
          <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
            <div className="bg-gradient-to-br from-card to-card/60 rounded-xl p-4 border border-border/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20">
                  <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metrics.caloriesPerServing}</div>
                  <div className="text-sm text-muted-foreground">Calories per serving</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card to-card/60 rounded-xl p-4 border border-border/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metrics.perServingAnalysis.protein}g</div>
                  <div className="text-sm text-muted-foreground">Protein content</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card to-card/60 rounded-xl p-4 border border-border/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20">
                  <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metrics.nutritionalHighlights.length}</div>
                  <div className="text-sm text-muted-foreground">Nutritional benefits</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card to-card/60 rounded-xl p-4 border border-border/30 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                  <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metrics.nutritionData.dietLabels?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Diet classifications</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Macronutrient Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Macronutrient Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="relative pt-6">
            <div className="space-y-4">
              {/* Protein */}
              <div className="group/macro">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Protein</span>
                  <span className="text-sm font-bold text-blue-600">{metrics.perServingAnalysis.protein}g</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (metrics.perServingAnalysis.protein / 50) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Carbohydrates */}
              <div className="group/macro">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Carbohydrates</span>
                  <span className="text-sm font-bold text-green-600">{metrics.perServingAnalysis.carbs}g</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (metrics.perServingAnalysis.carbs / 100) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="group/macro">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Fat</span>
                  <span className="text-sm font-bold text-orange-600">{metrics.perServingAnalysis.fat}g</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, (metrics.perServingAnalysis.fat / 30) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutritional Highlights & Classifications */}
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/80 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="relative border-b border-border/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Nutritional Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="relative pt-6">
            <div className="space-y-6">
              {/* Highlights */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Key Benefits</h4>
                <div className="grid gap-2">
                  {metrics.nutritionalHighlights.length > 0 ? (
                    metrics.nutritionalHighlights.map((highlight, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200/50 dark:border-green-800/30">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">{highlight}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 rounded-full bg-muted/50 mx-auto mb-2 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground">No nutritional highlights identified</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Diet Classifications */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Diet Compatibility</h4>
                <div className="grid gap-2">
                  {metrics.nutritionData.dietLabels && metrics.nutritionData.dietLabels.length > 0 ? (
                    metrics.nutritionData.dietLabels.map((label, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200/50 dark:border-purple-800/30">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{label.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-8 h-8 rounded-full bg-muted/50 mx-auto mb-2 flex items-center justify-center">
                        <Star className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-xs text-muted-foreground">No specific diet classifications</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}