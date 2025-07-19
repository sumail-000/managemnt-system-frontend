import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  X, 
  ChefHat, 
  Loader2, 
  Scale, 
  Users, 
  Clock,
  Upload,
  Link as LinkIcon
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
  const [servings, setServings] = useState("4")
  const [prepTime, setPrepTime] = useState("")
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", quantity: "", unit: "g" }
  ])
  const [recipeUrl, setRecipeUrl] = useState("")
  const [analysisMode, setAnalysisMode] = useState<"manual" | "url">("manual")
  const { toast } = useToast()

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

    if (analysisMode === "manual") {
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
      // Simulate API call to Edamam
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock response data
      const mockData = {
        totalCalories: 420,
        macros: {
          protein: 25.3,
          carbs: 45.2,
          fat: 18.7,
          fiber: 8.1
        },
        micros: {
          'Vitamin C': 45.2,
          'Iron': 3.4,
          'Calcium': 120.5,
          'Sodium': 680.2,
          'Potassium': 890.1
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        warnings: [
          {
            type: 'warning' as const,
            message: 'High sodium content (680mg) - exceeds recommended daily intake',
            severity: 'medium' as const
          },
          {
            type: 'info' as const,
            message: 'Good source of fiber and protein',
            severity: 'low' as const
          }
        ],
        servings: parseInt(servings),
        weightPerServing: 150
      }

      console.log('Calling onAnalysisComplete with:', mockData, recipeName)
      onAnalysisComplete(mockData, recipeName)
      
      toast({
        title: "Analysis complete",
        description: `${recipeName} has been analyzed successfully`,
      })

    } catch (error) {
      onAnalysisError()
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing your recipe. Please try again.",
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
          <div className="flex gap-2 mb-4">
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

          {analysisMode === "manual" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ingredients *</Label>
                <Button onClick={addIngredient} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Ingredient
                </Button>
              </div>
              
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => updateIngredient(ingredient.id, "name", e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        placeholder="Amount"
                        value={ingredient.quantity}
                        onChange={(e) => updateIngredient(ingredient.id, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="w-20">
                      <select
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
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
                      disabled={ingredients.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
                  Analyzing Recipe...
                </>
              ) : (
                <>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Analyze Recipe
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