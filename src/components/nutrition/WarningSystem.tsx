import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

import { 
  AlertTriangle, 
  Shield, 
  Info, 
  X, 
  Heart,
  Zap,
  Scale,
  CheckCircle2,
  XCircle
} from "lucide-react"

interface Warning {
  type: 'warning' | 'error' | 'info'
  message: string
  severity: 'low' | 'medium' | 'high'
}

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
  servings: number
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
  healthLabels?: string[]
}

interface WarningSystemProps {
  warnings: Warning[]
  nutritionData: NutritionData
}



export function WarningSystem({ warnings, nutritionData }: WarningSystemProps) {
  const thresholds = {
    sodium: 2300, // mg per day
    sugar: 50,    // g per day
    fat: 65,      // g per day
    calories: 2000, // per day
    enabled: true
  }
  
  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium" | "low">("all")
  const [showResolved, setShowResolved] = useState(false)

  // Calculate nutrition per serving
  // Updated to use correct micronutrient keys (NA for sodium)
  const getSodiumValue = () => {
    const sodium = nutritionData.micros['NA'] || nutritionData.micros['Sodium']
    if (typeof sodium === 'object' && sodium?.quantity) return sodium.quantity
    if (typeof sodium === 'number') return sodium
    return 0
  }

  const perServing = {
    calories: Math.round(nutritionData.totalCalories / nutritionData.servings),
    sodium: Math.round(getSodiumValue() / nutritionData.servings),
    fat: Math.round(nutritionData.macros.fat / nutritionData.servings),
    carbs: Math.round(nutritionData.macros.carbs / nutritionData.servings)
  }

  // Generate threshold-based warnings
  const generateThresholdWarnings = (): Warning[] => {
    const thresholdWarnings: Warning[] = []
    
    // Enhanced sodium warning with better thresholds
    if (perServing.sodium > thresholds.sodium * 0.2) { // 20% of daily value per serving
      const severityLevel = perServing.sodium > thresholds.sodium * 0.4 ? 'high' : 'medium'
      thresholdWarnings.push({
        type: 'warning',
        message: `High sodium content: ${perServing.sodium}mg per serving (>${Math.round(thresholds.sodium * 0.2)}mg recommended per serving)`,
        severity: severityLevel
      })
    }
    
    // Enhanced calorie warning
    if (perServing.calories > thresholds.calories * 0.25) { // 25% of daily calories per serving
      const severityLevel = perServing.calories > thresholds.calories * 0.4 ? 'high' : 'medium'
      thresholdWarnings.push({
        type: 'warning', 
        message: `High calorie content: ${perServing.calories} calories per serving (>${Math.round(thresholds.calories * 0.25)} recommended per serving)`,
        severity: severityLevel
      })
    }
    
    // Enhanced fat warning
    if (perServing.fat > thresholds.fat * 0.25) { // 25% of daily fat per serving
      const severityLevel = perServing.fat > thresholds.fat * 0.4 ? 'high' : 'medium'
      thresholdWarnings.push({
        type: 'warning',
        message: `High fat content: ${perServing.fat}g per serving (>${Math.round(thresholds.fat * 0.25)}g recommended per serving)`,
        severity: severityLevel
      })
    }

    // Enhanced fiber assessment (per serving)
    const fiberPerServing = Math.round(nutritionData.macros.fiber / nutritionData.servings)
    if (fiberPerServing >= 3) {
      thresholdWarnings.push({
        type: 'info',
        message: `Good fiber content: ${fiberPerServing}g per serving (${nutritionData.macros.fiber}g total)`,
        severity: 'low'
      })
    } else if (nutritionData.macros.fiber >= 5) {
      thresholdWarnings.push({
        type: 'info',
        message: `Excellent total fiber: ${nutritionData.macros.fiber}g per recipe`,
        severity: 'low'
      })
    }

    // Additional threshold warnings based on daily value percentages
    if (nutritionData.micros['NA']?.percentage && nutritionData.micros['NA'].percentage > 50) {
      thresholdWarnings.push({
        type: 'warning',
        message: `Very high sodium: ${nutritionData.micros['NA'].percentage.toFixed(1)}% of daily value`,
        severity: nutritionData.micros['NA'].percentage > 100 ? 'high' : 'medium'
      })
    }

    return thresholdWarnings
  }

  const allWarnings = [...warnings, ...(thresholds.enabled ? generateThresholdWarnings() : [])]
  
  const filteredWarnings = allWarnings.filter(warning => 
    filterSeverity === "all" || warning.severity === filterSeverity
  )

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'error': return XCircle
      case 'warning': return AlertTriangle
      case 'info': return Info
      default: return AlertTriangle
    }
  }

  const getWarningColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-destructive bg-destructive/10'
      case 'medium': return 'border-warning bg-warning/10'
      case 'low': return 'border-primary bg-primary/10'
      default: return 'border-muted bg-muted/10'
    }
  }

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-destructive text-destructive-foreground'
      case 'medium': return 'bg-warning text-warning-foreground'
      case 'low': return 'bg-primary text-primary-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }



  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Warnings</p>
                <p className="text-2xl font-bold">{filteredWarnings.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-destructive">
                  {filteredWarnings.filter(w => w.severity === 'high').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                <p className="text-2xl font-bold text-success">
                  {Math.max(0, 100 - (filteredWarnings.filter(w => w.severity === 'high').length * 25) - 
                    (filteredWarnings.filter(w => w.severity === 'medium').length * 10))}%
                </p>
              </div>
              <Shield className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Rating</p>
                <p className="text-2xl font-bold text-primary">
                  {filteredWarnings.filter(w => w.type === 'info').length > 0 ? 'Good' : 'Fair'}
                </p>
              </div>
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="warnings" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="warnings">Active Warnings</TabsTrigger>
        </TabsList>

        <TabsContent value="warnings">
          <Card className="dashboard-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Regulatory & Health Warnings
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="severity-filter">Filter:</Label>
                  <select
                    id="severity-filter"
                    className="px-3 py-1 rounded-md border border-input bg-background text-sm"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value as any)}
                  >
                    <option value="all">All ({allWarnings.length})</option>
                    <option value="high">High ({allWarnings.filter(w => w.severity === 'high').length})</option>
                    <option value="medium">Medium ({allWarnings.filter(w => w.severity === 'medium').length})</option>
                    <option value="low">Low ({allWarnings.filter(w => w.severity === 'low').length})</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredWarnings.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {filteredWarnings.map((warning, index) => {
                    const WarningIcon = getWarningIcon(warning.type)
                    return (
                      <Alert key={index} className={getWarningColor(warning.severity)}>
                        <WarningIcon className="h-4 w-4" />
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1">
                            <AlertDescription className="text-sm">{warning.message}</AlertDescription>
                          </div>
                          <Badge className={`${getSeverityBadgeColor(warning.severity)} text-xs`}>
                            {warning.severity}
                          </Badge>
                        </div>
                      </Alert>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Warnings Found</h3>
                  <p className="text-muted-foreground mb-2">
                    This recipe meets all current regulatory and health guidelines.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ✓ No cautions or allergen warnings detected<br/>
                    ✓ Nutritional thresholds within acceptable ranges
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>
    </div>
  )
}