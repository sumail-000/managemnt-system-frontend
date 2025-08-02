import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Heart, Shield, AlertTriangle, BarChart3, PieChart, Target, Zap } from 'lucide-react'
import { NutritionData, nutritionUtils, NUTRIENT_CATEGORIES } from '@/types/nutrition'

interface NutritionDisplayProps {
  nutritionData: NutritionData
  showDetailed?: boolean
  compact?: boolean
}

const getLevelColor = (level: string) => {
  switch (level) {
    case 'very_high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const formatNumber = (num: number, decimals: number = 1) => {
  return Number(num.toFixed(decimals))
}

const getCategoryIcon = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case 'macronutrients':
      return <Activity className="h-4 w-4" />
    case 'vitamins':
      return <Heart className="h-4 w-4" />
    case 'minerals':
      return <Shield className="h-4 w-4" />
    case 'fats':
      return <Zap className="h-4 w-4" />
    case 'carbohydrates':
      return <BarChart3 className="h-4 w-4" />
    default:
      return <Target className="h-4 w-4" />
  }
}

const getCategoryColor = (categoryName: string) => {
  switch (categoryName.toLowerCase()) {
    case 'macronutrients':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'vitamins':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'minerals':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'fats':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'carbohydrates':
      return 'text-orange-600 bg-orange-50 border-orange-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function NutritionDisplay({ nutritionData, showDetailed = true, compact = false }: NutritionDisplayProps) {
  // Add null checks and default values to prevent errors
  if (!nutritionData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No nutrition data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const {
    calories = 0,
    totalWeight = 0,
    servings = 1,
    weightPerServing = totalWeight / servings,
    totalNutrients = {},
    totalDaily = {},
    highNutrients = [],
    nutritionSummary = { 
      macronutrients: {
        protein: { grams: 0, calories: 0, percentage: 0 },
        carbs: { grams: 0, calories: 0, percentage: 0 },
        fat: { grams: 0, calories: 0, percentage: 0 }
      }, 
      caloriesPerGram: 0 
    },
    dietLabels = [],
    healthLabels = [],
    cautions = [],
    allergens = [],
    warnings = []
  } = nutritionData

  // Extract allergen information
  const allergenPresent = cautions || []
  const allergenFreeLabels = (healthLabels || []).filter(label => label.endsWith('_FREE'))

  // Extract key macronutrients from nutritionSummary or totalNutrients
  const macros = nutritionSummary.macronutrients || {}
  const protein = macros.protein || { grams: 0, calories: 0, percentage: 0 }
  const carbs = macros.carbs || { grams: 0, calories: 0, percentage: 0 }
  const fat = macros.fat || { grams: 0, calories: 0, percentage: 0 }

  // Get key nutrients from totalNutrients
  const fiber = nutritionUtils.getNutrient(totalNutrients, 'FIBTG')
  const sugar = nutritionUtils.getNutrient(totalNutrients, 'SUGAR')
  const sodium = nutritionUtils.getNutrient(totalNutrients, 'NA')

  // Calculate calories per serving
  const caloriesPerServing = servings > 0 ? calories / servings : calories

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Nutrition Summary</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(caloriesPerServing, 0)} cal
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-2 bg-blue-50 rounded border">
              <div className="text-lg font-bold text-blue-600">{formatNumber(protein.grams)}g</div>
              <div className="text-xs text-gray-600">Protein</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded border">
              <div className="text-lg font-bold text-green-600">{formatNumber(carbs.grams)}g</div>
              <div className="text-xs text-gray-600">Carbs</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded border">
              <div className="text-lg font-bold text-yellow-600">{formatNumber(fat.grams)}g</div>
              <div className="text-xs text-gray-600">Fat</div>
            </div>
          </div>

          {highNutrients.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">High Nutrients</div>
              <div className="flex flex-wrap gap-1">
                {highNutrients.slice(0, 3).map((nutrient, index) => (
                  <Badge key={index} variant="outline" className={getLevelColor(nutrient.level)}>
                    {nutrient.label}
                  </Badge>
                ))}
                {highNutrients.length > 3 && (
                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                    +{highNutrients.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Nutrition Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Nutritional Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calories Overview */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {formatNumber(caloriesPerServing, 0)}
            </div>
            <div className="text-sm text-gray-600 mb-1">Calories per Serving</div>
            <div className="text-xs text-gray-500">
              {formatNumber(weightPerServing, 0)}g per serving • {servings} serving{servings !== 1 ? 's' : ''} total
            </div>
            {nutritionSummary.caloriesPerGram && (
              <div className="text-xs text-gray-500 mt-1">
                {formatNumber(nutritionSummary.caloriesPerGram, 2)} cal/g
              </div>
            )}
          </div>

          {/* Macronutrients Breakdown */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Macronutrient Distribution
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(protein.grams)}g
                </div>
                <div className="text-sm text-gray-600 mb-1">Protein</div>
                <div className="text-xs text-blue-600 font-medium">
                  {protein.percentage}% • {formatNumber(protein.calories)} cal
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(carbs.grams)}g
                </div>
                <div className="text-sm text-gray-600 mb-1">Carbs</div>
                <div className="text-xs text-green-600 font-medium">
                  {carbs.percentage}% • {formatNumber(carbs.calories)} cal
                </div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">
                  {formatNumber(fat.grams)}g
                </div>
                <div className="text-sm text-gray-600 mb-1">Fat</div>
                <div className="text-xs text-yellow-600 font-medium">
                  {fat.percentage}% • {formatNumber(fat.calories)} cal
                </div>
              </div>
            </div>
          </div>

          {/* Key Additional Nutrients */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Key Nutrients</h4>
            <div className="grid grid-cols-2 gap-4">
              {fiber && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">Fiber</span>
                    <span className="text-sm font-bold text-purple-600">
                      {nutritionUtils.formatNutrientValue(fiber)}
                    </span>
                  </div>
                  {totalDaily['FIBTG'] && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Daily Value</span>
                        <span>{nutritionUtils.getDailyValuePercentage(totalDaily, 'FIBTG')}%</span>
                      </div>
                      <Progress 
                        value={Math.min(nutritionUtils.getDailyValuePercentage(totalDaily, 'FIBTG'), 100)} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {sugar && (
                <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">Sugar</span>
                    <span className="text-sm font-bold text-pink-600">
                      {nutritionUtils.formatNutrientValue(sugar)}
                    </span>
                  </div>
                </div>
              )}
              
              {sodium && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900">Sodium</span>
                    <span className="text-sm font-bold text-red-600">
                      {nutritionUtils.formatNutrientValue(sodium)}
                    </span>
                  </div>
                  {totalDaily['NA'] && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Daily Value</span>
                        <span>{nutritionUtils.getDailyValuePercentage(totalDaily, 'NA')}%</span>
                      </div>
                      <Progress 
                        value={Math.min(nutritionUtils.getDailyValuePercentage(totalDaily, 'NA'), 100)} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetailed && (
        <Tabs defaultValue="nutrients" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="nutrients">All Nutrients</TabsTrigger>
            <TabsTrigger value="daily">Daily Values</TabsTrigger>
            <TabsTrigger value="health">Health Info</TabsTrigger>
            <TabsTrigger value="warnings">Highlights</TabsTrigger>
          </TabsList>

          <TabsContent value="nutrients" className="space-y-6">
            {NUTRIENT_CATEGORIES.map((category) => {
              const categoryNutrients = category.nutrients
                .map(key => ({ key, nutrient: totalNutrients[key] }))
                .filter(item => item.nutrient)
              
              if (categoryNutrients.length === 0) return null
              
              return (
                <Card key={category.name}>
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${getCategoryColor(category.name)}`}>
                      {getCategoryIcon(category.name)}
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryNutrients.map(({ key, nutrient }) => (
                        <div key={key} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {nutrient.label}
                            </span>
                            <span className="text-sm font-bold text-gray-700 ml-2">
                              {nutritionUtils.formatNutrientValue(nutrient)}
                            </span>
                          </div>
                          {totalDaily[key] && (
                            <div className="text-xs text-gray-500">
                              {nutritionUtils.getDailyValuePercentage(totalDaily, key)}% DV
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="daily" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Daily Value Percentages
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Based on a 2000-calorie diet
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(totalDaily).map(([key, dailyValue]) => {
                    const nutrient = totalNutrients[key]
                    const percentage = Math.round(dailyValue.quantity)
                    
                    return (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {dailyValue.label}
                          </span>
                          <span className="text-sm font-bold text-blue-600 ml-2">
                            {percentage}%
                          </span>
                        </div>
                        {nutrient && (
                          <div className="text-xs text-gray-500 mb-2">
                            {nutritionUtils.formatNutrientValue(nutrient)}
                          </div>
                        )}
                        <Progress value={Math.min(percentage, 100)} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Diet & Health Labels */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-green-600" />
                    Health Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dietLabels.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Diet Labels</h5>
                      <div className="flex flex-wrap gap-2">
                        {dietLabels.map((label) => (
                          <Badge key={label} variant="outline" className="bg-green-50 border-green-200 text-green-700">
                            {label.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {healthLabels.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Health Labels</h5>
                      <div className="flex flex-wrap gap-2">
                        {healthLabels.map((label) => (
                          <Badge key={label} variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                            {label.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {cautions.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Cautions</h5>
                      <div className="flex flex-wrap gap-2">
                        {cautions.map((caution) => (
                          <Badge key={caution} variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
                            {caution.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Allergen Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    Allergen Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Allergens Present (from cautions) */}
                  {allergenPresent && allergenPresent.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        Contains Allergens (Cautions)
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {allergenPresent.map((allergen) => (
                          <Badge key={allergen} variant="outline" className="bg-red-50 border-red-200 text-red-700">
                            ⚠️ {allergen.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-red-600 mt-2">
                        These allergens are present and may cause reactions in sensitive individuals.
                      </p>
                    </div>
                  )}

                  {/* Allergen-Free Status (from health labels) */}
                  {allergenFreeLabels && allergenFreeLabels.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        Allergen-Free Status
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {allergenFreeLabels.map((label) => (
                          <Badge key={label} variant="outline" className="bg-green-50 border-green-200 text-green-700">
                            ✓ {label.replace('_FREE', '').replace('_', ' ')} Free
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        This recipe is free from the allergens listed above.
                      </p>
                    </div>
                  )}

                  {/* No allergen information available */}
                  {(!allergenPresent || allergenPresent.length === 0) && (!allergenFreeLabels || allergenFreeLabels.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No specific allergen information available</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Please check ingredient labels for complete allergen information
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="warnings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-600" />
                  Nutrient Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {highNutrients.length > 0 ? (
                  <div className="space-y-3">
                    {highNutrients.map((nutrient, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${getLevelColor(nutrient.level)}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{nutrient.label}</div>
                            <div className="text-sm opacity-75">{nutrient.nutrient}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatNumber(nutrient.percentage)}%</div>
                            <div className="text-xs capitalize">{nutrient.level.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No high nutrient levels detected</p>
                )}
                
                {warnings && warnings.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-medium text-gray-900 mb-3">Warnings</h5>
                    <div className="space-y-2">
                      {warnings.map((warning, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-yellow-800">{warning.message}</div>
                              {warning.nutrient && (
                                <div className="text-xs text-yellow-600 mt-1">Related to: {warning.nutrient}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

export default NutritionDisplay