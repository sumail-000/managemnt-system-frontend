import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertTriangle, XCircle, Shield } from "lucide-react"

interface ComplianceWidgetProps {
  overallScore: number
  nutritional: "compliant" | "warning" | "violation"
  allergen: "compliant" | "warning" | "violation"
  labeling: "compliant" | "warning" | "violation"
  healthClaims: "compliant" | "warning" | "violation"
}

export function ComplianceWidget({
  overallScore,
  nutritional,
  allergen,
  labeling,
  healthClaims
}: ComplianceWidgetProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="w-4 h-4 text-success" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />
      case "violation":
        return <XCircle className="w-4 h-4 text-destructive" />
      default:
        return <CheckCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "compliant":
        return "default"
      case "warning":
        return "secondary"
      case "violation":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Compliance Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="text-center">
            <div className="text-3xl font-bold text-foreground">{overallScore}%</div>
            <div className="text-sm text-muted-foreground">Overall Compliant</div>
          </div>

          {/* Status Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Nutritional</span>
              <Badge variant={getStatusVariant(nutritional)} className="flex items-center gap-1">
                {getStatusIcon(nutritional)}
                {nutritional}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Allergen</span>
              <Badge variant={getStatusVariant(allergen)} className="flex items-center gap-1">
                {getStatusIcon(allergen)}
                {allergen}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Labeling</span>
              <Badge variant={getStatusVariant(labeling)} className="flex items-center gap-1">
                {getStatusIcon(labeling)}
                {labeling}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">Health Claims</span>
              <Badge variant={getStatusVariant(healthClaims)} className="flex items-center gap-1">
                {getStatusIcon(healthClaims)}
                {healthClaims}
              </Badge>
            </div>
          </div>

          {/* View Details Button */}
          <Button variant="outline" className="w-full">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}