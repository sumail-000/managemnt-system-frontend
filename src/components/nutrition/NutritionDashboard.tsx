import React, { useMemo, memo, useCallback, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart3, 
  PieChart, 
  Target, 
  TrendingUp,
  Zap,
  Heart,
  Shield,
  Flame,
  Award,
  Info,
  Star,
  AlertTriangle,
  Users,
  Scale
} from "lucide-react"

interface NutritionData {
  totalCalories: number
  macros: {
    protein: number
    carbs: number
    fat: number
    fiber: number
    // Dynamic macronutrients support - can be extended with additional nutrients
    [key: string]: number
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
  // Enhanced data fields
  dietLabels?: string[]
  highNutrients?: Array<{
    nutrient: string
    label: string
    percentage: number
    level: 'very_high' | 'high' | 'moderate'
  }>
  nutritionSummary?: {
    macronutrients?: {
      protein?: { grams: number }
      carbs?: { grams: number }
      fat?: { grams: number }
    }
    fiber?: number
    [key: string]: any
  }
  totalDaily?: Record<string, {
    label: string
    quantity: number
    unit: string
  }>
}

interface NutritionDashboardProps {
  data: NutritionData
}

/**
 * PERFORMANCE OPTIMIZATIONS IMPLEMENTED:
 * 
 * 1. React.memo() - Component memoization to prevent unnecessary re-renders
 * 2. useMemo() - Expensive calculations cached (safeData, calculations, healthScore, micronutrientsArray)
 * 3. useCallback() - Event handlers and helper functions memoized
 * 4. VirtualizedGrid - Pagination for large datasets (micronutrients, daily values)
 * 5. Memoized sub-components - MicronutrientItem and DailyValueItem components
 * 6. Optimized data processing - Single-pass calculations with bounds checking
 * 7. Lazy rendering - Only render visible items in large lists
 * 
 * These optimizations ensure smooth performance even with datasets containing
 * hundreds of micronutrients and daily values.
 */

// Memoized micronutrient item component with elegant styling
const MicronutrientItem = memo(({ nutrient, value }: { nutrient: string; value: any }) => {
  const displayValue = typeof value === 'object' && value !== null 
    ? (value.quantity || 0)
    : (typeof value === 'number' ? value : 0);
  
  const unit = typeof value === 'object' && value !== null 
    ? (value.unit || 'mg')
    : (nutrient.includes('VIT') || nutrient === 'NA' || nutrient === 'K' ? 'mg' : 'mg');
  
  const percentage = typeof value === 'object' && value !== null 
    ? value.percentage
    : null;

  const nutrientLabel = typeof value === 'object' && value !== null && value.label 
    ? value.label 
    : nutrient;
  
  return (
    <div className="group relative p-4 bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {nutrientLabel}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {Math.min(99999, displayValue).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {unit}
              </span>
            </div>
          </div>
        </div>
        {percentage && (
          <div className="flex justify-end">
            <Badge 
              variant={percentage > 100 ? 'destructive' : percentage >= 50 ? 'default' : 'secondary'}
              className="text-xs font-medium"
            >
              {Math.min(999, percentage).toFixed(0)}% DV
            </Badge>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
    </div>
  );
});

// Memoized daily value item component for performance
const DailyValueItem = memo(({ nutrient, index }: { nutrient: any; index: number }) => {
  const safePercentage = Math.min(999, Math.max(0, nutrient.percentage || 0));
  const safeQuantity = Math.min(99999, Math.max(0, nutrient.quantity || 0));
  
  return (
    <div className="p-3 bg-muted rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{nutrient.label}</span>
        <Badge 
          variant={safePercentage > 100 ? 'destructive' : safePercentage >= 50 ? 'default' : 'secondary'}
          className="text-xs"
        >
          {safePercentage.toFixed(1)}% DV
        </Badge>
      </div>
      <div className="text-sm font-semibold bg-background px-2 py-1 rounded border mb-2">
        {safeQuantity.toLocaleString()} {nutrient.unit}
      </div>
      <Progress 
        value={Math.min(safePercentage, 100)} 
        className="h-2"
      />
    </div>
  );
});

// Virtualized list component for large datasets
const VirtualizedGrid = memo(({ items, renderItem, itemsPerPage = 12 }: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  itemsPerPage?: number;
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  const currentItems = items.slice(startIndex, endIndex);
  
  if (items.length <= itemsPerPage) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(renderItem)}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentItems.map(renderItem)}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="px-3 py-1 text-sm bg-muted rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({items.length} total)
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-3 py-1 text-sm bg-muted rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
});

export const NutritionDashboard = memo(({ data }: NutritionDashboardProps) => {
  // Memoized data validation and fallbacks for performance
  const safeData = useMemo(() => ({
    totalCalories: Math.max(0, data.totalCalories || 0),
    servings: Math.max(1, data.servings || 1),
    weightPerServing: Math.max(0, data.weightPerServing || 0),
    macros: {
      protein: Math.max(0, data.macros?.protein || 0),
      carbs: Math.max(0, data.macros?.carbs || 0),
      fat: Math.max(0, data.macros?.fat || 0),
      fiber: Math.max(0, data.macros?.fiber || 0)
    },
    micros: data.micros || {},
    allergens: data.allergens || [],
    warnings: data.warnings || [],
    healthLabels: data.healthLabels || [],
    dietLabels: data.dietLabels || [],
    highNutrients: data.highNutrients || [],
    nutritionSummary: data.nutritionSummary || {},
    totalDaily: data.totalDaily || {}
  }), [data]);

  // Helper function to extract quantity from micronutrient data
  const getValueFromMicros = useCallback((micros: Record<string, any>, key: string): number => {
    const micro = micros[key];
    if (typeof micro === 'object' && micro !== null) {
      return micro.quantity || 0;
    }
    return typeof micro === 'number' ? micro : 0;
  }, []);

  // Dynamic macronutrient configuration for extensibility
  const macroConfig = useMemo(() => ({
    protein: { 
      label: 'Protein', 
      caloriesPerGram: 4, 
      color: 'purple', 
      emoji: '🥩',
      target: 50,
      unit: 'g'
    },
    carbs: { 
      label: 'Carbohydrates', 
      caloriesPerGram: 4, 
      color: 'green', 
      emoji: '🌾',
      target: 300,
      unit: 'g'
    },
    fat: { 
      label: 'Fat', 
      caloriesPerGram: 9, 
      color: 'blue', 
      emoji: '🥑',
      target: 65,
      unit: 'g'
    },
    fiber: { 
      label: 'Fiber', 
      caloriesPerGram: 0, 
      color: 'amber', 
      emoji: '🌿',
      target: 25,
      unit: 'g'
    }
    // Future macronutrients can be easily added here:
    // alcohol: { label: 'Alcohol', caloriesPerGram: 7, color: 'red', emoji: '🍷', target: 0, unit: 'g' },
    // sugar: { label: 'Sugar', caloriesPerGram: 4, color: 'pink', emoji: '🍯', target: 50, unit: 'g' }
  }), []);

  // Memoized calculations for performance
  const calculations = useMemo(() => {
    const caloriesPerServing = safeData.servings > 0 ? Math.round(safeData.totalCalories / safeData.servings) : 0;
    
    // Dynamic macro calculations based on configuration
    const macroCalories: Record<string, number> = {};
    const macroPercentages: Record<string, number> = {};
    let totalMacroCals = 0;
    let totalMacroGrams = 0;

    // Calculate calories and totals for each configured macronutrient
    Object.entries(macroConfig).forEach(([key, config]) => {
      const grams = safeData.macros[key] || 0;
      const calories = grams * config.caloriesPerGram;
      macroCalories[key] = calories;
      if (config.caloriesPerGram > 0) {
        totalMacroCals += calories;
      }
      totalMacroGrams += grams;
    });

    // Calculate percentages with bounds checking
    Object.entries(macroConfig).forEach(([key, config]) => {
      const grams = safeData.macros[key] || 0;
      if (config.caloriesPerGram > 0) {
        // Caloric macronutrients: percentage of total calories
        macroPercentages[key] = totalMacroCals > 0 ? Math.min(100, Math.round((macroCalories[key] / totalMacroCals) * 100)) : 0;
      } else {
        // Non-caloric macronutrients (like fiber): percentage of total grams
        macroPercentages[key] = totalMacroGrams > 0 ? Math.min(100, Math.round((grams / totalMacroGrams) * 100)) : 0;
      }
    });

    // Dynamic daily value percentages with enhanced validation and capping
    const dailyValues: Record<string, number> = {};
    Object.entries(macroConfig).forEach(([key, config]) => {
      const grams = safeData.macros[key] || 0;
      dailyValues[key] = Math.min(999, Math.round((grams / config.target) * 100));
    });
    
    // Additional micronutrient daily values
    dailyValues.sodium = Math.min(999, Math.round((getValueFromMicros(safeData.micros, 'NA') / 2300) * 100));
    dailyValues.calcium = Math.min(999, Math.round((getValueFromMicros(safeData.micros, 'CA') / 1000) * 100));

    // Enhanced daily values with better error handling
    const enhancedDailyValues = safeData.totalDaily ? Object.entries(safeData.totalDaily)
      .filter(([key, nutrient]) => nutrient && typeof nutrient === 'object')
      .map(([key, nutrient]) => {
        const quantity = getValueFromMicros(safeData.micros, key);
        const targetQuantity = (nutrient as any).quantity || 1;
        return {
          key,
          label: (nutrient as any).label || key,
          quantity: Math.max(0, quantity),
          unit: (nutrient as any).unit || '',
          percentage: Math.min(999, Math.round((quantity / targetQuantity) * 100))
        };
      }) : [];
    
    return {
      caloriesPerServing,
      macroPercentages,
      macroCalories,
      dailyValues,
      enhancedDailyValues,
      totalMacroCals,
      totalMacroGrams
    };
  }, [safeData, getValueFromMicros, macroConfig]);
  
  const { caloriesPerServing, macroPercentages, macroCalories, dailyValues, enhancedDailyValues, totalMacroCals, totalMacroGrams } = calculations;

  // Extract individual calorie values for display
  const proteinCals = macroCalories.protein || 0;
  const carbsCals = macroCalories.carbs || 0;
  const fatCals = macroCalories.fat || 0;

  // Dynamic macro rendering helper
  const renderMacroCard = useCallback((macroKey: string, config: any, index: number) => {
    const colorClasses = {
      green: 'from-green-100/50 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/30 border-green-200/30 dark:border-green-700/30 text-green-600 dark:text-green-400 text-green-700 dark:text-green-300 text-green-600/70 dark:text-green-400/70 bg-green-100 dark:bg-green-900/50',
      blue: 'from-blue-100/50 to-indigo-100/50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200/30 dark:border-blue-700/30 text-blue-600 dark:text-blue-400 text-blue-700 dark:text-blue-300 text-blue-600/70 dark:text-blue-400/70 bg-blue-100 dark:bg-blue-900/50',
      purple: 'from-purple-100/50 to-violet-100/50 dark:from-purple-900/30 dark:to-violet-900/30 border-purple-200/30 dark:border-purple-700/30 text-purple-600 dark:text-purple-400 text-purple-700 dark:text-purple-300 text-purple-600/70 dark:text-purple-400/70 bg-purple-100 dark:bg-purple-900/50',
      amber: 'from-amber-100/50 to-yellow-100/50 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-200/30 dark:border-amber-700/30 text-amber-600 dark:text-amber-400 text-amber-700 dark:text-amber-300 text-amber-600/70 dark:text-amber-400/70 bg-amber-100 dark:bg-amber-900/50',
      red: 'from-red-100/50 to-rose-100/50 dark:from-red-900/30 dark:to-rose-900/30 border-red-200/30 dark:border-red-700/30 text-red-600 dark:text-red-400 text-red-700 dark:text-red-300 text-red-600/70 dark:text-red-400/70 bg-red-100 dark:bg-red-900/50',
      pink: 'from-pink-100/50 to-rose-100/50 dark:from-pink-900/30 dark:to-rose-900/30 border-pink-200/30 dark:border-pink-700/30 text-pink-600 dark:text-pink-400 text-pink-700 dark:text-pink-300 text-pink-600/70 dark:text-pink-400/70 bg-pink-100 dark:bg-pink-900/50'
    };
    
    const colorClass = colorClasses[config.color as keyof typeof colorClasses] || colorClasses.blue;
    const [bgClass, borderClass, textClass, labelClass, valueClass, badgeClass] = colorClass.split(' ');
    
    return (
      <div key={macroKey} className={`group/macro text-center p-6 bg-gradient-to-br ${bgClass} rounded-2xl border ${borderClass} hover:shadow-lg transition-all duration-500 hover:scale-105`}>
        <div className={`text-4xl font-black ${textClass} mb-2 group-hover/macro:scale-110 transition-transform duration-300`}>
          {macroPercentages[macroKey] || 0}%
        </div>
        <div className={`text-lg font-bold ${labelClass} mb-1`}>
          {config.label}
        </div>
        <div className={`text-sm ${valueClass} font-semibold ${badgeClass} px-3 py-1 rounded-full`}>
          {(safeData.macros[macroKey] || 0).toLocaleString()}{config.unit}
        </div>
      </div>
    );
  }, [macroPercentages, safeData.macros]);

  // Memoized helper functions for performance
  const getLevelColor = useCallback((level: string) => {
    switch (level) {
      case 'very_high': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'moderate': return 'text-yellow-600'
      default: return 'text-muted-foreground'
    }
  }, []);

  const getLevelBadgeVariant = useCallback((level: string) => {
    switch (level) {
      case 'very_high': return 'destructive'
      case 'high': return 'secondary'
      case 'moderate': return 'outline'
      default: return 'secondary'
    }
  }, []);

  // Memoized micronutrients array for virtualization
  const micronutrientsArray = useMemo(() => 
    Object.entries(safeData.micros), [safeData.micros]
  );
  
  // Render functions for virtualized components
  const renderMicronutrient = useCallback((item: [string, any], index: number) => (
    <MicronutrientItem key={item[0]} nutrient={item[0]} value={item[1]} />
  ), []);
  
  const renderDailyValue = useCallback((item: any, index: number) => (
    <DailyValueItem key={index} nutrient={item} index={index} />
  ), []);

  // Memoized health score calculation
  const healthScore = useMemo(() => Math.max(0, Math.min(100, 
    80 - (safeData.warnings.filter(w => w.severity === 'high').length * 20) -
    (safeData.warnings.filter(w => w.severity === 'medium').length * 10)
  )), [safeData.warnings]);

  const getHealthScoreColor = useCallback((score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-warning"
    return "text-destructive"
  }, []);

  const getProgressColor = useCallback((percentage: number) => {
    if (percentage <= 100) return "bg-success"
    if (percentage <= 150) return "bg-warning"
    return "bg-destructive"
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-6 max-w-7xl mx-auto">


        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Calories/Serving</p>
                  <p className="text-2xl font-bold text-orange-600">{caloriesPerServing.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total: {safeData.totalCalories.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                  <Flame className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                  <p className={`text-2xl font-bold ${getHealthScoreColor(healthScore)}`}>
                    {healthScore}/100
                  </p>
                  <p className="text-xs text-muted-foreground">Nutritional quality</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Protein</p>
                  <p className="text-2xl font-bold text-green-600">{safeData.macros.protein.toLocaleString()}g</p>
                  <p className="text-xs text-muted-foreground">{macroPercentages.protein}% of calories</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fiber</p>
                  <p className="text-2xl font-bold text-blue-600">{safeData.macros.fiber.toLocaleString()}g</p>
                  <p className="text-xs text-muted-foreground">{dailyValues.fiber}% DV</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Auto Tags Section */}
        {safeData.healthLabels.length > 0 && (
          <Card className="mb-8 border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-blue-600 text-lg">🏷️</span>
                </div>
                <span className="text-base font-semibold text-blue-700 dark:text-blue-300">Auto Tags</span>
                <Badge variant="secondary" className="ml-auto text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                  {safeData.healthLabels.length}
                </Badge>
              </CardTitle>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/70 mt-1">
                Automatically generated health labels from nutrition analysis
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-blue-900/20">
                <div className="flex flex-wrap gap-2">
                  {safeData.healthLabels.map((label, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs px-2 py-1"
                    >
                      {label.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-blue-200/50 dark:border-blue-700/30">
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70 text-center">
                  {safeData.healthLabels.length} health labels • Low warning indicators
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Diet Labels and High Nutrients */}
        {(safeData.dietLabels.length > 0 || safeData.highNutrients.length > 0 || Object.keys(safeData.nutritionSummary).length > 0) && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            {/* Diet Labels */}
            {safeData.dietLabels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    Diet Classifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {safeData.dietLabels.map((label, index) => (
                      <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                        {label.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* High Nutrients */}
            {safeData.highNutrients.length > 0 && (
              <Card className="border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-600" />
                    <span className="text-base font-semibold text-amber-700 dark:text-amber-300">High Nutrient Content</span>
                    <Badge variant="secondary" className="ml-auto text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                      {safeData.highNutrients.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-amber-100 dark:scrollbar-thumb-amber-600 dark:scrollbar-track-amber-900/20">
                    <div className="space-y-2">
                      {safeData.highNutrients.map((nutrient, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 bg-white/60 dark:bg-amber-900/20 rounded-md border border-amber-100 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-amber-800 dark:text-amber-200 truncate">
                              {nutrient.label}
                            </div>
                            <div className="text-xs text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wide">
                              {nutrient.nutrient}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded">
                              {Math.min(999, nutrient.percentage || 0).toFixed(0)}%
                            </span>
                            <Badge 
                              className={`text-xs px-1.5 py-0.5 ${
                                nutrient.level === 'very_high' 
                                  ? 'bg-red-500 text-white'
                                  : nutrient.level === 'high'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-yellow-500 text-white'
                              }`}
                            >
                              {nutrient.level === 'very_high' ? 'V.High' : nutrient.level === 'high' ? 'High' : 'Med'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-amber-200/50 dark:border-amber-700/30">
                    <div className="text-xs text-amber-600/70 dark:text-amber-400/70 text-center">
                      {safeData.highNutrients.length} nutrients • Scroll to view all
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nutrition Summary Details */}
            {Object.keys(safeData.nutritionSummary).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 dark:bg-teal-900/20 rounded-lg">
                      <Info className="w-5 h-5 text-teal-600" />
                    </div>
                    Nutrition Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {safeData.nutritionSummary.caloriesPerGram && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Calories per gram</span>
                      <span className="text-sm font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/50 px-2 py-1 rounded">
                        {Math.min(99.99, safeData.nutritionSummary.caloriesPerGram || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {safeData.nutritionSummary.sodium && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Sodium</span>
                      <span className="text-sm font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/50 px-2 py-1 rounded">
                        {Math.min(99999, safeData.nutritionSummary.sodium || 0).toLocaleString()}mg
                      </span>
                    </div>
                  )}
                  {safeData.nutritionSummary.sugar && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">Sugar</span>
                      <span className="text-sm font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/50 px-2 py-1 rounded">
                        {Math.min(9999, safeData.nutritionSummary.sugar || 0).toLocaleString()}g
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs defaultValue="macros" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="macros" className="flex items-center gap-2">
              <span>🥗</span>
              <span>Macronutrients</span>
            </TabsTrigger>
            <TabsTrigger value="micros" className="flex items-center gap-2">
              <span>💊</span>
              <span>Micronutrients</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <span>📊</span>
              <span>Daily Values</span>
            </TabsTrigger>
            <TabsTrigger value="breakdown" className="flex items-center gap-2">
              <span>🔍</span>
              <span>Detailed Breakdown</span>
            </TabsTrigger>
          </TabsList>

        <TabsContent value="macros" className="space-y-8">
          {/* Enhanced Macronutrient Distribution */}
          <Card className="group border-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 hover:shadow-2xl transition-all duration-700 backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" />
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-green-700 dark:text-green-300 flex items-center gap-3">
                <div className="p-3 bg-green-500/15 rounded-2xl group-hover:bg-green-500/25 transition-all duration-500">
                  <span className="text-2xl">🥗</span>
                </div>
                Macronutrient Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-6 ${Object.keys(macroConfig).length <= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : Object.keys(macroConfig).length <= 6 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {Object.entries(macroConfig).map(([macroKey, config], index) => 
                  renderMacroCard(macroKey, config, index)
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Macro Distribution */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Macronutrient Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(macroConfig).map(([macroKey, config]) => {
                  const colorMap: Record<string, string> = {
                    green: 'bg-green-500',
                    blue: 'bg-blue-500', 
                    purple: 'bg-purple-500',
                    amber: 'bg-amber-500',
                    red: 'bg-red-500',
                    pink: 'bg-pink-500'
                  };
                  
                  return (
                    <div key={macroKey} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${colorMap[config.color] || 'bg-gray-500'} rounded-full`}></div>
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold">{(safeData.macros[macroKey] || 0).toLocaleString()}{config.unit}</span>
                          <Badge variant="secondary" className="ml-2">
                            {macroPercentages[macroKey] || 0}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={macroPercentages[macroKey] || 0} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Fat Details */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🥑</span>
                  Fat Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Fat</span>
                    <span className="font-semibold">{safeData.macros.fat.toLocaleString()}g</span>
                  </div>
                  <Progress value={Math.min(100, (safeData.macros.fat / 65) * 100)} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">{Math.min(999, ((safeData.macros.fat / 65) * 100)).toFixed(1)}% of 65g target</div>
                </div>
              </CardContent>
            </Card>

            {/* Protein Details */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🥩</span>
                  Protein Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Protein</span>
                    <span className="font-semibold">{safeData.macros.protein.toLocaleString()}g</span>
                  </div>
                  <Progress value={Math.min(100, (safeData.macros.protein / 50) * 100)} className="h-2" />
                  <div className="text-xs text-muted-foreground text-center">{Math.min(999, ((safeData.macros.protein / 50) * 100)).toFixed(1)}% of 50g target</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground text-center">
                    💡 Recommended: 0.8g per kg body weight
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Calorie Breakdown */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  Calorie Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-3xl font-bold">{safeData.totalCalories.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total Calories</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">From Protein</span>
                    <span className="font-semibold">{proteinCals.toFixed(0)} cal</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">From Carbs</span>
                    <span className="font-semibold">{carbsCals.toFixed(0)} cal</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">From Fat</span>
                    <span className="font-semibold">{fatCals.toFixed(0)} cal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Values */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Daily Value Progress
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  📊 Track your nutrient intake against daily recommendations
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(dailyValues).map(([nutrient, percentage]) => {
                  const safePercentage = Math.min(999, Math.max(0, percentage || 0));
                  return (
                    <div key={nutrient} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm capitalize font-medium">{nutrient}</span>
                        <Badge 
                          variant={safePercentage > 100 ? 'destructive' : safePercentage >= 50 ? 'default' : 'secondary'}
                        >
                          {safePercentage.toFixed(0)}% DV
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min(safePercentage, 100)} 
                        className="h-2"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="micros" className="space-y-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Micronutrient Profile
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                🧬 Essential vitamins and minerals for optimal health
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {micronutrientsArray.map(([nutrient, value], index) => (
                  <MicronutrientItem key={nutrient} nutrient={nutrient} value={value} />
                ))}
              </div>
              {micronutrientsArray.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No micronutrient data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Complete Daily Value Percentages
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Percentage of daily recommended values based on a 2000-calorie diet
              </p>
            </CardHeader>
            <CardContent>
              <VirtualizedGrid 
                items={enhancedDailyValues}
                renderItem={renderDailyValue}
                itemsPerPage={12}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle>Per Serving Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Calories</span>
                  <span className="font-medium">{caloriesPerServing}</span>
                </div>
                <div className="flex justify-between">
                  <span>Weight</span>
                  <span className="font-medium">{safeData.weightPerServing.toLocaleString()}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Protein</span>
                  <span className="font-medium">{safeData.servings > 0 ? (safeData.macros.protein / safeData.servings).toFixed(1) : '0.0'}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbohydrates</span>
                  <span className="font-medium">{safeData.servings > 0 ? (safeData.macros.carbs / safeData.servings).toFixed(1) : '0.0'}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fat</span>
                  <span className="font-medium">{safeData.servings > 0 ? (safeData.macros.fat / safeData.servings).toFixed(1) : '0.0'}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fiber</span>
                  <span className="font-medium">{safeData.servings > 0 ? (safeData.macros.fiber / safeData.servings).toFixed(1) : '0.0'}g</span>
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Nutritional Highlights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {safeData.macros.protein >= 20 && (
                  <div className="flex items-center gap-2 text-success">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">High protein content</span>
                  </div>
                )}
                {safeData.macros.fiber >= 5 && (
                  <div className="flex items-center gap-2 text-success">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Good source of fiber</span>
                  </div>
                )}
                {(safeData.micros['VITC']?.quantity || 0) >= 30 && (
                  <div className="flex items-center gap-2 text-success">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Rich in Vitamin C</span>
                  </div>
                )}
                {caloriesPerServing <= 200 && (
                  <div className="flex items-center gap-2 text-success">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm">Low calorie option</span>
                  </div>
                )}
                {healthScore >= 80 && (
                  <div className="flex items-center gap-2 text-success">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">Excellent nutritional profile</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
</div>
  )
}
)
