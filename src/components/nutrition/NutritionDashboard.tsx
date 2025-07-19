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
  Flame
} from "lucide-react"

interface NutritionData {
  totalCalories: number
  macros: {
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  micros: Record<string, number>
  allergens: string[]
  warnings: Array<{
    type: 'warning' | 'error' | 'info'
    message: string
    severity: 'low' | 'medium' | 'high'
  }>
  servings: number
  weightPerServing: number
}

interface NutritionDashboardProps {
  data: NutritionData
}

export function NutritionDashboard({ data }: NutritionDashboardProps) {
  const caloriesPerServing = Math.round(data.totalCalories / data.servings)
  
  // Calculate macro percentages
  const proteinCals = data.macros.protein * 4
  const carbsCals = data.macros.carbs * 4
  const fatCals = data.macros.fat * 9
  const totalMacroCals = proteinCals + carbsCals + fatCals

  const macroPercentages = {
    protein: Math.round((proteinCals / totalMacroCals) * 100),
    carbs: Math.round((carbsCals / totalMacroCals) * 100),
    fat: Math.round((fatCals / totalMacroCals) * 100)
  }

  // Daily value percentages (based on 2000 calorie diet)
  const dailyValues = {
    protein: Math.round((data.macros.protein / 50) * 100),
    carbs: Math.round((data.macros.carbs / 300) * 100),
    fat: Math.round((data.macros.fat / 65) * 100),
    fiber: Math.round((data.macros.fiber / 25) * 100),
    sodium: Math.round((data.micros['Sodium'] / 2300) * 100),
    calcium: Math.round((data.micros['Calcium'] / 1000) * 100)
  }

  const healthScore = Math.max(0, Math.min(100, 
    80 - (data.warnings.filter(w => w.severity === 'high').length * 20) -
    (data.warnings.filter(w => w.severity === 'medium').length * 10)
  ))

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-warning"
    return "text-destructive"
  }

  const getProgressColor = (percentage: number) => {
    if (percentage <= 100) return "bg-success"
    if (percentage <= 150) return "bg-warning"
    return "bg-destructive"
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Calories/Serving</p>
                <p className="text-2xl font-bold">{caloriesPerServing}</p>
                <p className="text-xs text-muted-foreground">Total: {data.totalCalories}</p>
              </div>
              <Flame className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Score</p>
                <p className={`text-2xl font-bold ${getHealthScoreColor(healthScore)}`}>
                  {healthScore}/100
                </p>
                <p className="text-xs text-muted-foreground">Nutritional quality</p>
              </div>
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Protein</p>
                <p className="text-2xl font-bold">{data.macros.protein}g</p>
                <p className="text-xs text-muted-foreground">{macroPercentages.protein}% of calories</p>
              </div>
              <Zap className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fiber</p>
                <p className="text-2xl font-bold">{data.macros.fiber}g</p>
                <p className="text-xs text-muted-foreground">{dailyValues.fiber}% DV</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="macros" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="macros">Macronutrients</TabsTrigger>
          <TabsTrigger value="micros">Micronutrients</TabsTrigger>
          <TabsTrigger value="breakdown">Detailed Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="macros">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Macro Distribution */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Macronutrient Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-success rounded-full"></div>
                      <span className="text-sm">Protein</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{data.macros.protein}g</span>
                      <Badge variant="secondary" className="ml-2">
                        {macroPercentages.protein}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={macroPercentages.protein} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm">Carbohydrates</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{data.macros.carbs}g</span>
                      <Badge variant="secondary" className="ml-2">
                        {macroPercentages.carbs}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={macroPercentages.carbs} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                      <span className="text-sm">Fat</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{data.macros.fat}g</span>
                      <Badge variant="secondary" className="ml-2">
                        {macroPercentages.fat}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={macroPercentages.fat} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Daily Values */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Daily Value Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(dailyValues).map(([nutrient, percentage]) => (
                  <div key={nutrient} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">{nutrient}</span>
                      <Badge 
                        variant={percentage > 100 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {percentage}% DV
                      </Badge>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${getProgressColor(percentage)}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="micros">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Micronutrient Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(data.micros).map(([nutrient, value]) => (
                  <div key={nutrient} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{nutrient}</span>
                      <span className="text-sm text-muted-foreground">
                        {value.toFixed(1)}
                        {nutrient.includes('Vitamin') ? 'mg' : 
                         nutrient === 'Sodium' || nutrient === 'Potassium' ? 'mg' : 'mg'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
                  <span className="font-medium">{data.weightPerServing}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Protein</span>
                  <span className="font-medium">{(data.macros.protein / data.servings).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbohydrates</span>
                  <span className="font-medium">{(data.macros.carbs / data.servings).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fat</span>
                  <span className="font-medium">{(data.macros.fat / data.servings).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Fiber</span>
                  <span className="font-medium">{(data.macros.fiber / data.servings).toFixed(1)}g</span>
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
                {data.macros.protein >= 20 && (
                  <div className="flex items-center gap-2 text-success">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">High protein content</span>
                  </div>
                )}
                {data.macros.fiber >= 5 && (
                  <div className="flex items-center gap-2 text-success">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">Good source of fiber</span>
                  </div>
                )}
                {data.micros['Vitamin C'] >= 30 && (
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
  )
}