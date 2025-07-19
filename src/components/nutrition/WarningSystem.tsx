import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  AlertTriangle, 
  Shield, 
  Info, 
  X, 
  Settings, 
  Heart,
  Zap,
  Scale,
  TrendingUp,
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
  micros: Record<string, number>
  servings: number
}

interface WarningSystemProps {
  warnings: Warning[]
  nutritionData: NutritionData
}

interface ThresholdSettings {
  sodium: number
  sugar: number
  fat: number
  calories: number
  enabled: boolean
}

export function WarningSystem({ warnings, nutritionData }: WarningSystemProps) {
  const [thresholds, setThresholds] = useState<ThresholdSettings>({
    sodium: 2300, // mg per day
    sugar: 50,    // g per day
    fat: 65,      // g per day
    calories: 2000, // per day
    enabled: true
  })
  
  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium" | "low">("all")
  const [showResolved, setShowResolved] = useState(false)

  // Calculate nutrition per serving
  const perServing = {
    calories: Math.round(nutritionData.totalCalories / nutritionData.servings),
    sodium: Math.round((nutritionData.micros['Sodium'] || 0) / nutritionData.servings),
    fat: Math.round(nutritionData.macros.fat / nutritionData.servings),
    carbs: Math.round(nutritionData.macros.carbs / nutritionData.servings)
  }

  // Generate threshold-based warnings
  const generateThresholdWarnings = (): Warning[] => {
    const thresholdWarnings: Warning[] = []
    
    if (perServing.sodium > thresholds.sodium * 0.3) { // 30% of daily value per serving
      thresholdWarnings.push({
        type: 'warning',
        message: `High sodium content: ${perServing.sodium}mg per serving (>${Math.round(thresholds.sodium * 0.3)}mg recommended)`,
        severity: perServing.sodium > thresholds.sodium * 0.5 ? 'high' : 'medium'
      })
    }
    
    if (perServing.calories > thresholds.calories * 0.4) { // 40% of daily calories
      thresholdWarnings.push({
        type: 'warning', 
        message: `High calorie content: ${perServing.calories} calories per serving`,
        severity: perServing.calories > thresholds.calories * 0.6 ? 'high' : 'medium'
      })
    }
    
    if (perServing.fat > thresholds.fat * 0.4) { // 40% of daily fat
      thresholdWarnings.push({
        type: 'warning',
        message: `High fat content: ${perServing.fat}g per serving`,
        severity: perServing.fat > thresholds.fat * 0.6 ? 'high' : 'medium'
      })
    }

    // Positive warnings (good nutrition)
    if (nutritionData.macros.fiber >= 5) {
      thresholdWarnings.push({
        type: 'info',
        message: `Excellent fiber content: ${nutritionData.macros.fiber}g per recipe`,
        severity: 'low'
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

  // Traffic light system
  const getTrafficLightColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.3) return 'bg-success'
    if (value <= threshold * 0.6) return 'bg-warning'
    return 'bg-destructive'
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="warnings">Active Warnings</TabsTrigger>
          <TabsTrigger value="traffic-light">Traffic Light</TabsTrigger>
          <TabsTrigger value="settings">Threshold Settings</TabsTrigger>
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
                <div className="space-y-3">
                  {filteredWarnings.map((warning, index) => {
                    const WarningIcon = getWarningIcon(warning.type)
                    return (
                      <Alert key={index} className={getWarningColor(warning.severity)}>
                        <WarningIcon className="h-4 w-4" />
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1">
                            <AlertDescription>{warning.message}</AlertDescription>
                          </div>
                          <Badge className={getSeverityBadgeColor(warning.severity)}>
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
                  <p className="text-muted-foreground">
                    This recipe meets all current regulatory and health guidelines.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="traffic-light">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Traffic Light Nutrition Labeling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <span className="font-medium">Calories per serving</span>
                      <p className="text-sm text-muted-foreground">{perServing.calories} kcal</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(perServing.calories, thresholds.calories * 0.25)}`}></div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <span className="font-medium">Sodium per serving</span>
                      <p className="text-sm text-muted-foreground">{perServing.sodium}mg</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(perServing.sodium, thresholds.sodium * 0.25)}`}></div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <span className="font-medium">Fat per serving</span>
                      <p className="text-sm text-muted-foreground">{perServing.fat}g</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(perServing.fat, thresholds.fat * 0.25)}`}></div>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-3">Traffic Light Guide</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-success rounded-full"></div>
                      <span>Green: Low - Healthier choice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-warning rounded-full"></div>
                      <span>Amber: Medium - Okay in moderation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-destructive rounded-full"></div>
                      <span>Red: High - Limit consumption</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Custom Threshold Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-thresholds">Enable Custom Thresholds</Label>
                  <p className="text-sm text-muted-foreground">Use custom limits for warnings</p>
                </div>
                <Switch
                  id="enable-thresholds"
                  checked={thresholds.enabled}
                  onCheckedChange={(enabled) => setThresholds(prev => ({ ...prev, enabled }))}
                />
              </div>

              {thresholds.enabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sodium-threshold">Sodium Limit (mg/day)</Label>
                    <Input
                      id="sodium-threshold"
                      type="number"
                      value={thresholds.sodium}
                      onChange={(e) => setThresholds(prev => ({ ...prev, sodium: parseInt(e.target.value) || 2300 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat-threshold">Fat Limit (g/day)</Label>
                    <Input
                      id="fat-threshold"
                      type="number"
                      value={thresholds.fat}
                      onChange={(e) => setThresholds(prev => ({ ...prev, fat: parseInt(e.target.value) || 65 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="calories-threshold">Calorie Limit (kcal/day)</Label>
                    <Input
                      id="calories-threshold"
                      type="number"
                      value={thresholds.calories}
                      onChange={(e) => setThresholds(prev => ({ ...prev, calories: parseInt(e.target.value) || 2000 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sugar-threshold">Sugar Limit (g/day)</Label>
                    <Input
                      id="sugar-threshold"
                      type="number"
                      value={thresholds.sugar}
                      onChange={(e) => setThresholds(prev => ({ ...prev, sugar: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> These thresholds are based on general dietary guidelines. 
                  Consult with nutrition professionals for personalized recommendations.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}