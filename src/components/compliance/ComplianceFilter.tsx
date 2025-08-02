import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter, Search } from "lucide-react"

interface ComplianceFilterProps {
  onFilter: (filters: {
    status?: string
    type?: string
    search?: string
  }) => void
}

export function ComplianceFilter({ onFilter }: ComplianceFilterProps) {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          Compliance Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Compliance Status</label>
          <Select onValueChange={(value) => onFilter({ status: value })}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="violation">Violation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Compliance Type</label>
          <Select onValueChange={(value) => onFilter({ type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="nutritional">Nutritional</SelectItem>
              <SelectItem value="allergen">Allergen</SelectItem>
              <SelectItem value="labeling">Labeling</SelectItem>
              <SelectItem value="health-claims">Health Claims</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div>
          <label className="text-sm font-medium mb-2 block">Search Issues</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input 
              placeholder="Search compliance issues..."
              className="pl-10"
              onChange={(e) => onFilter({ search: e.target.value })}
            />
          </div>
        </div>

        {/* Reset Filter */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => onFilter({})}
        >
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  )
}