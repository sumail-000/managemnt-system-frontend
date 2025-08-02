import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Palette, Upload, Image, Settings } from "lucide-react"

export function BrandCenter() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent dark:from-slate-100 dark:via-blue-200 dark:to-indigo-200">
            Brand Center
          </h1>
          <p className="text-muted-foreground">Manage your organization's branding and visual identity.</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload Assets
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Brand Guidelines</CardTitle>
            <CardDescription>Define colors, fonts, and style guidelines</CardDescription>
          </CardHeader>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Image className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Asset Library</CardTitle>
            <CardDescription>Store and organize brand assets</CardDescription>
          </CardHeader>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-border/50 bg-gradient-to-br from-background to-muted/20">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <CardTitle>Template Manager</CardTitle>
            <CardDescription>Customize label and document templates</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}