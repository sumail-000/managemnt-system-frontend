import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Clock, ChefHat, AlertTriangle, Download } from "lucide-react"
import { RecipeAnalyzer } from "./RecipeAnalyzer"
import { NutritionDashboard } from "./NutritionDashboard"
import { AllergenDetector } from "./AllergenDetector"
import { WarningSystem } from "./WarningSystem"
import { NutritionExport } from "./NutritionExport"

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

export function NutritionAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [activeTab, setActiveTab] = useState("analyzer")
  const [analysisHistory, setAnalysisHistory] = useState<Array<{
    id: string
    recipeName: string
    analyzedAt: Date
    calories: number
  }>>([])

  const handleAnalysisComplete = (data: NutritionData, recipeName: string) => {
    console.log('Analysis complete called with data:', data)
    console.log('Setting nutritionData to:', data)
    setNutritionData(data)
    setIsAnalyzing(false)
    setActiveTab("dashboard")
    
    // Add to history
    setAnalysisHistory(prev => [
      {
        id: Date.now().toString(),
        recipeName,
        analyzedAt: new Date(),
        calories: data.totalCalories
      },
      ...prev.slice(0, 9) // Keep last 10
    ])
    console.log('nutritionData should now be set')
  }

  const handleStartNewAnalysis = () => {
    setNutritionData(null)
    setActiveTab("analyzer")
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nutrition Analysis</h1>
          <p className="text-muted-foreground">
            Analyze your recipes for complete nutritional information and compliance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            Edamam API
          </Badge>
          {nutritionData && (
            <Button onClick={handleStartNewAnalysis} variant="outline">
              New Analysis
            </Button>
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
            <div className="flex gap-2 overflow-x-auto">
              {analysisHistory.slice(0, 5).map((analysis) => (
                <Button
                  key={analysis.id}
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <ChefHat className="w-3 h-3 mr-1" />
                  {analysis.recipeName} ({analysis.calories} cal)
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Interface */}
      <Card className="dashboard-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="analyzer">Recipe Analyzer</TabsTrigger>
              <TabsTrigger value="dashboard" disabled={!nutritionData}>
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="allergens" disabled={!nutritionData}>
                Allergens
              </TabsTrigger>
              <TabsTrigger value="warnings" disabled={!nutritionData}>
                Warnings
              </TabsTrigger>
              <TabsTrigger value="export" disabled={!nutritionData}>
                Export
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="analyzer" className="mt-0">
              <RecipeAnalyzer
                onAnalysisStart={() => setIsAnalyzing(true)}
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisError={() => setIsAnalyzing(false)}
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