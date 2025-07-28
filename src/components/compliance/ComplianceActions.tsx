import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Download, Wrench, Crown } from "lucide-react"

interface ComplianceActionsProps {
  userPlan?: string
}

export function ComplianceActions({ userPlan = "Basic" }: ComplianceActionsProps) {
  const isEnterprise = userPlan === "Enterprise"

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="default" className="w-full justify-start">
          <Play className="w-4 h-4 mr-2" />
          Run Compliance Check
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start"
          disabled={!isEnterprise}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Compliance Report
          {!isEnterprise && (
            <Badge variant="secondary" className="ml-auto">
              <Crown className="w-3 h-3 mr-1" />
              Enterprise
            </Badge>
          )}
        </Button>

        <Button variant="outline" className="w-full justify-start">
          <Wrench className="w-4 h-4 mr-2" />
          Fix Issues
        </Button>
      </CardContent>
    </Card>
  )
}