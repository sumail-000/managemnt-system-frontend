import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { 
  AlertTriangle, 
  Shield, 
  Wheat, 
  Milk, 
  Egg,
  Fish,
  TreePine,
  Nut,
  Shell,
  Bean,
  Settings,
  CheckCircle,
  X
} from "lucide-react"

interface AllergenDetectorProps {
  allergens: string[]
}

const allergenInfo = {
  gluten: {
    name: "Gluten",
    icon: Wheat,
    severity: "high",
    description: "Contains wheat, barley, rye, or oats",
    alternatives: "Use gluten-free flours, rice, quinoa"
  },
  dairy: {
    name: "Dairy",
    icon: Milk,
    severity: "high", 
    description: "Contains milk, cheese, butter, or cream",
    alternatives: "Plant-based milks, vegan cheese"
  },
  eggs: {
    name: "Eggs",
    icon: Egg,
    severity: "medium",
    description: "Contains chicken eggs or egg products",
    alternatives: "Flax eggs, aquafaba, applesauce"
  },
  fish: {
    name: "Fish",
    icon: Fish,
    severity: "high",
    description: "Contains fish or fish-derived ingredients",
    alternatives: "Plant-based proteins, tofu"
  },
  shellfish: {
    name: "Shellfish",
    icon: Shell,
    severity: "high",
    description: "Contains crustaceans or mollusks",
    alternatives: "Mushrooms, seaweed for umami"
  },
  nuts: {
    name: "Tree Nuts",
    icon: TreePine,
    severity: "high",
    description: "Contains almonds, walnuts, cashews, etc.",
    alternatives: "Seeds, coconut, seed butters"
  },
  peanuts: {
    name: "Peanuts",
    icon: Nut,
    severity: "high",
    description: "Contains peanuts or peanut products",
    alternatives: "Sunflower seed butter, tahini"
  },
  soy: {
    name: "Soy",
    icon: Bean,
    severity: "medium",
    description: "Contains soybeans or soy products",
    alternatives: "Coconut aminos, other legumes"
  }
}

export function AllergenDetector({ allergens }: AllergenDetectorProps) {
  const [customAllergens, setCustomAllergens] = useState<string[]>([])
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<"all" | "high" | "medium">("all")

  const allAllergens = [...allergens, ...customAllergens]
  
  const filteredAllergens = allAllergens.filter(allergen => {
    if (selectedSeverityFilter === "all") return true
    const info = allergenInfo[allergen as keyof typeof allergenInfo]
    return info?.severity === selectedSeverityFilter
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive text-destructive-foreground"
      case "medium": return "bg-warning text-warning-foreground"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getAllergenIcon = (allergen: string) => {
    const info = allergenInfo[allergen as keyof typeof allergenInfo]
    return info?.icon || AlertTriangle
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Allergens</p>
                <p className="text-2xl font-bold">{allAllergens.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Severity</p>
                <p className="text-2xl font-bold text-destructive">
                  {allAllergens.filter(a => allergenInfo[a as keyof typeof allergenInfo]?.severity === "high").length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Safety Status</p>
                <p className="text-2xl font-bold text-success">
                  {allAllergens.length === 0 ? "Safe" : "Review"}
                </p>
              </div>
              {allAllergens.length === 0 ? (
                <CheckCircle className="w-8 h-8 text-success" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-warning" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Detection Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-alternatives">Show Alternatives</Label>
              <p className="text-sm text-muted-foreground">Display substitute ingredients</p>
            </div>
            <Switch
              id="show-alternatives"
              checked={showAlternatives}
              onCheckedChange={setShowAlternatives}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Filter by Severity</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedSeverityFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSeverityFilter("all")}
              >
                All ({allAllergens.length})
              </Button>
              <Button
                variant={selectedSeverityFilter === "high" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSeverityFilter("high")}
              >
                High ({allAllergens.filter(a => allergenInfo[a as keyof typeof allergenInfo]?.severity === "high").length})
              </Button>
              <Button
                variant={selectedSeverityFilter === "medium" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSeverityFilter("medium")}
              >
                Medium ({allAllergens.filter(a => allergenInfo[a as keyof typeof allergenInfo]?.severity === "medium").length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allergen List */}
      {filteredAllergens.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredAllergens.map((allergen) => {
            const info = allergenInfo[allergen as keyof typeof allergenInfo]
            const Icon = getAllergenIcon(allergen)
            
            return (
              <Card key={allergen} className="dashboard-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <CardTitle className="text-lg">{info?.name || allergen}</CardTitle>
                    </div>
                    <Badge className={getSeverityColor(info?.severity || "medium")}>
                      {info?.severity || "Unknown"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {info?.description || `Contains ${allergen}-related ingredients`}
                  </p>
                  
                  {showAlternatives && info?.alternatives && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-success mb-1">Alternatives:</p>
                      <p className="text-sm text-muted-foreground">{info.alternatives}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 pt-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-xs text-muted-foreground">
                      Cross-contamination risk - check manufacturing details
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Allergens Detected</h3>
              <p className="text-muted-foreground">
                This recipe appears to be free from major allergens based on the current analysis.
                Always verify ingredient labels for complete allergen information.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Information */}
      <Card className="dashboard-card bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Regulatory Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="p-3 bg-card border border-border rounded-lg">
              <h4 className="font-medium text-sm mb-1">FDA Requirements (US)</h4>
              <p className="text-xs text-muted-foreground">
                Must declare all 9 major allergens on product labels
              </p>
            </div>
            <div className="p-3 bg-card border border-border rounded-lg">
              <h4 className="font-medium text-sm mb-1">EU Regulation</h4>
              <p className="text-xs text-muted-foreground">
                14 allergens must be highlighted in ingredient lists
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong>Disclaimer:</strong> This analysis is for informational purposes only. 
            Always consult with food safety professionals for commercial products.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}