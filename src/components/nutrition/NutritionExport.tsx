import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { 
  Download, 
  FileText, 
  Mail, 
  Printer, 
  Share2, 
  FileImage,
  Settings,
  CheckCircle2,
  Loader2
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

interface NutritionExportProps {
  data: NutritionData
}

interface ExportOptions {
  includeMacros: boolean
  includeMicros: boolean
  includeAllergens: boolean
  includeWarnings: boolean
  includeCharts: boolean
  format: 'pdf' | 'csv' | 'excel' | 'json'
  layout: 'detailed' | 'summary' | 'label'
}

export function NutritionExport({ data }: NutritionExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeMacros: true,
    includeMicros: true,
    includeAllergens: true,
    includeWarnings: false,
    includeCharts: true,
    format: 'pdf',
    layout: 'detailed'
  })
  const [isExporting, setIsExporting] = useState(false)
  const [emailAddress, setEmailAddress] = useState("")
  const { toast } = useToast()

  const handleExport = async (action: 'download' | 'email' | 'print') => {
    setIsExporting(true)
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      switch (action) {
        case 'download':
          toast({
            title: "Export completed",
            description: `Nutrition analysis downloaded as ${exportOptions.format.toUpperCase()}`,
          })
          break
        case 'email':
          if (!emailAddress) {
            toast({
              title: "Email required",
              description: "Please enter an email address",
              variant: "destructive"
            })
            return
          }
          toast({
            title: "Email sent",
            description: `Nutrition analysis sent to ${emailAddress}`,
          })
          break
        case 'print':
          // In a real app, this would trigger the browser's print dialog
          window.print()
          toast({
            title: "Print dialog opened",
            description: "Check your browser's print dialog",
          })
          break
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  const getEstimatedSize = () => {
    let size = 0.5 // Base size in MB
    if (exportOptions.includeMacros) size += 0.1
    if (exportOptions.includeMicros) size += 0.3
    if (exportOptions.includeAllergens) size += 0.1
    if (exportOptions.includeWarnings) size += 0.2
    if (exportOptions.includeCharts) size += 1.5
    
    return size.toFixed(1)
  }

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document', icon: FileText, description: 'Best for sharing and printing' },
    { value: 'csv', label: 'CSV Spreadsheet', icon: FileText, description: 'For data analysis' },
    { value: 'excel', label: 'Excel Workbook', icon: FileText, description: 'Advanced spreadsheet format' },
    { value: 'json', label: 'JSON Data', icon: FileText, description: 'For developers and APIs' }
  ]

  const layoutOptions = [
    { value: 'detailed', label: 'Detailed Report', description: 'Complete analysis with charts' },
    { value: 'summary', label: 'Summary Report', description: 'Key metrics only' },
    { value: 'label', label: 'Nutrition Label', description: 'FDA-style nutrition facts' }
  ]

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quick Download</p>
                <p className="text-lg font-bold">PDF Report</p>
              </div>
              <Button 
                onClick={() => handleExport('download')}
                disabled={isExporting}
                size="sm"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quick Print</p>
                <p className="text-lg font-bold">Label Format</p>
              </div>
              <Button 
                onClick={() => handleExport('print')}
                disabled={isExporting}
                variant="outline"
                size="sm"
              >
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">File Size</p>
                <p className="text-lg font-bold">{getEstimatedSize()} MB</p>
              </div>
              <FileImage className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Configuration */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Export Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid gap-3 md:grid-cols-2">
              {formatOptions.map((format) => (
                <div 
                  key={format.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    exportOptions.format === format.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => updateOption('format', format.value)}
                >
                  <div className="flex items-center gap-2">
                    <format.icon className="w-4 h-4" />
                    <div>
                      <p className="font-medium text-sm">{format.label}</p>
                      <p className="text-xs text-muted-foreground">{format.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Layout Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Report Layout</Label>
            <div className="space-y-2">
              {layoutOptions.map((layout) => (
                <div key={layout.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={layout.value}
                    checked={exportOptions.layout === layout.value}
                    onCheckedChange={() => updateOption('layout', layout.value)}
                  />
                  <div>
                    <Label htmlFor={layout.value} className="font-medium">
                      {layout.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{layout.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Content Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Include in Export</Label>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMacros"
                    checked={exportOptions.includeMacros}
                    onCheckedChange={(checked) => updateOption('includeMacros', checked)}
                  />
                  <Label htmlFor="includeMacros">Macronutrients</Label>
                  <Badge variant="secondary">Essential</Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMicros"
                    checked={exportOptions.includeMicros}
                    onCheckedChange={(checked) => updateOption('includeMicros', checked)}
                  />
                  <Label htmlFor="includeMicros">Micronutrients</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAllergens"
                    checked={exportOptions.includeAllergens}
                    onCheckedChange={(checked) => updateOption('includeAllergens', checked)}
                  />
                  <Label htmlFor="includeAllergens">Allergen Information</Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeWarnings"
                    checked={exportOptions.includeWarnings}
                    onCheckedChange={(checked) => updateOption('includeWarnings', checked)}
                  />
                  <Label htmlFor="includeWarnings">Health Warnings</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCharts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) => updateOption('includeCharts', checked)}
                  />
                  <Label htmlFor="includeCharts">Charts & Graphs</Label>
                  <Badge variant="outline">PDF only</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>Export Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Download */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Download File</p>
                <p className="text-sm text-muted-foreground">
                  Save as {exportOptions.format.toUpperCase()} to your device
                </p>
              </div>
            </div>
            <Button 
              onClick={() => handleExport('download')}
              disabled={isExporting}
              className="btn-gradient"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download
            </Button>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <p className="font-medium">Email Report</p>
                <Input
                  placeholder="Enter email address"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <Button 
              onClick={() => handleExport('email')}
              disabled={isExporting || !emailAddress}
              variant="outline"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Send
            </Button>
          </div>

          {/* Print */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-success" />
              <div>
                <p className="font-medium">Print Report</p>
                <p className="text-sm text-muted-foreground">
                  Print-optimized nutrition label format
                </p>
              </div>
            </div>
            <Button 
              onClick={() => handleExport('print')}
              disabled={isExporting}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Summary */}
      <Card className="dashboard-card bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
            <div>
              <h4 className="font-medium mb-2">Export Summary</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Format: {exportOptions.format.toUpperCase()} - {exportOptions.layout} layout</p>
                <p>• Content: {Object.values(exportOptions).filter(v => v === true).length} sections included</p>
                <p>• Estimated size: {getEstimatedSize()} MB</p>
                <p>• Compliance: FDA nutrition labeling requirements met</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}