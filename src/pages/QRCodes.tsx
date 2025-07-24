import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  QrCode, 
  Download, 
  Copy, 
  Share2, 
  Eye, 
  BarChart3, 
  Settings, 
  Plus,
  Palette,
  Smartphone,
  Monitor,
  Globe,
  Crown,
  Zap,
  FileText,
  Package,
  Link,
  ChefHat,
  Calendar,
  MapPin,
  TrendingUp,
  Users
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Link as RouterLink } from "react-router-dom"

// QR Code Preview Component
interface QRCodePreviewProps {
  content: string
  size: number
  foreground: string
  background: string
  errorCorrection: string
}

function QRCodePreview({ content, size, foreground, background, errorCorrection }: QRCodePreviewProps) {
  const [qrDataURL, setQrDataURL] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateQRCode = async () => {
    if (!content) {
      setQrDataURL(null)
      return
    }

    setIsGenerating(true)
    try {
      const QRCode = (await import('qrcode')).default
      
      const dataURL = await QRCode.toDataURL(content, {
        errorCorrectionLevel: errorCorrection as any,
        margin: 2,
        color: {
          dark: foreground,
          light: background
        },
        width: Math.max(200, size * 3)
      })
      
      setQrDataURL(dataURL)
    } catch (error) {
      console.error('QR Code generation error:', error)
      setQrDataURL(null)
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    generateQRCode()
  }, [content, foreground, background, errorCorrection, size])

  return (
    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center p-4">
      {isGenerating ? (
        <div className="text-center">
          <QrCode className="w-8 h-8 text-primary mx-auto mb-2 animate-pulse" />
          <p className="text-sm text-muted-foreground">Generating...</p>
        </div>
      ) : qrDataURL ? (
        <div className="text-center">
          <img 
            src={qrDataURL} 
            alt="QR Code Preview" 
            className="max-w-full max-h-full object-contain rounded"
            style={{ maxWidth: `${size * 2}px`, maxHeight: `${size * 2}px` }}
          />
          <p className="text-xs text-muted-foreground mt-2">
            {size}×{size}mm QR Code
          </p>
        </div>
      ) : content ? (
        <div className="text-center">
          <QrCode className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Failed to generate QR code</p>
        </div>
      ) : (
        <div className="text-center">
          <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Enter content to see preview</p>
        </div>
      )}
    </div>
  )
}

export default function QRCodes() {
  const { user, usage } = useAuth()
  const { toast } = useToast()
  const [selectedQRType, setSelectedQRType] = useState("url")
  const [qrContent, setQrContent] = useState("")
  const [qrSize, setQrSize] = useState(50)
  const [qrForeground, setQrForeground] = useState("#000000")
  const [qrBackground, setQrBackground] = useState("#ffffff")
  const [errorCorrection, setErrorCorrection] = useState("M")
  const [position, setPosition] = useState("center")
  
  // Get membership plan features
  const getMembershipFeatures = () => {
    if (!user?.membership_plan) {
      return { 
        name: 'Basic', 
        qr_limit: 0,
        features: [],
        can_generate_qr: false
      }
    }
    
    const plan = user.membership_plan
    return {
      name: plan.name,
      qr_limit: plan.name === 'Basic' ? 0 : plan.name === 'Pro' ? 20 : 999,
      features: plan.features || [],
      can_generate_qr: plan.name !== 'Basic'
    }
  }

  const membershipInfo = getMembershipFeatures()
  const currentQRUsage = usage?.qr_codes?.current_month || 0
  const qrUsagePercentage = membershipInfo.qr_limit > 0 ? (currentQRUsage / membershipInfo.qr_limit) * 100 : 0

  // Mock QR code data - in real app this would come from API
  const [qrCodes] = useState([
    {
      id: 1,
      name: "Product A Nutrition Facts",
      type: "nutrition",
      content: "https://app.com/nutrition/product-a",
      scans: 127,
      created: "2024-01-15",
      status: "active"
    },
    {
      id: 2,
      name: "Product B Ingredients",
      type: "ingredients", 
      content: "https://app.com/ingredients/product-b",
      scans: 89,
      created: "2024-01-10",
      status: "active"
    },
    {
      id: 3,
      name: "Company Website",
      type: "url",
      content: "https://company.com",
      scans: 234,
      created: "2024-01-05",
      status: "active"
    }
  ])

  // Mock analytics data
  const analyticsData = {
    totalScans: 450,
    todayScans: 23,
    weeklyGrowth: 12.5,
    topPerformer: "Product A Nutrition Facts",
    deviceBreakdown: {
      mobile: 78,
      desktop: 22
    },
    geographicData: [
      { country: "United States", scans: 180 },
      { country: "Canada", scans: 95 },
      { country: "United Kingdom", scans: 67 },
      { country: "Germany", scans: 45 },
      { country: "Other", scans: 63 }
    ]
  }

  const handleGenerateQR = async () => {
    if (!membershipInfo.can_generate_qr) {
      toast({
        title: "Upgrade Required",
        description: "QR code generation is available for Pro and Enterprise plans only.",
        variant: "destructive"
      })
      return
    }

    if (currentQRUsage >= membershipInfo.qr_limit) {
      toast({
        title: "Limit Reached",
        description: `You've reached your monthly limit of ${membershipInfo.qr_limit} QR codes.`,
        variant: "destructive"
      })
      return
    }

    if (!qrContent) {
      toast({
        title: "Missing Content",
        description: "Please enter content for your QR code.",
        variant: "destructive"
      })
      return
    }

    try {
      // Generate and download the QR code
      const QRCode = (await import('qrcode')).default
      
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, qrContent, {
        errorCorrectionLevel: errorCorrection as any,
        margin: 2,
        color: {
          dark: qrForeground,
          light: qrBackground
        },
        width: qrSize * 10 // High resolution for download
      })
      
      // Download the QR code
      const link = document.createElement('a')
      link.download = `qr-code-${Date.now()}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      toast({
        title: "QR Code Generated!",
        description: "Your QR code has been created and downloaded successfully."
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied!",
      description: "QR code content copied to clipboard."
    })
  }

  return (
    <div className="flex-1">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">QR Code Dashboard</h1>
            <p className="text-muted-foreground">
              Generate and manage QR codes for your products
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={membershipInfo.can_generate_qr ? "default" : "secondary"}>
              {membershipInfo.name} Plan
            </Badge>
            {!membershipInfo.can_generate_qr && (
              <Button variant="gradient" asChild>
                <RouterLink to="/billing">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </RouterLink>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Usage Stats */}
        {membershipInfo.can_generate_qr && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">QR Codes Created</CardTitle>
                <QrCode className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentQRUsage}</div>
                <p className="text-xs text-muted-foreground">
                  {membershipInfo.qr_limit - currentQRUsage} remaining this month
                </p>
                <Progress value={qrUsagePercentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
                <Eye className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.totalScans}</div>
                <p className="text-xs text-muted-foreground">
                  +{analyticsData.todayScans} today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{analyticsData.weeklyGrowth}%</div>
                <p className="text-xs text-muted-foreground">vs last week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mobile Usage</CardTitle>
                <Smartphone className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.deviceBreakdown.mobile}%</div>
                <p className="text-xs text-muted-foreground">of all scans</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">QR Generator</TabsTrigger>
            <TabsTrigger value="manage">Manage QR Codes</TabsTrigger>
            <TabsTrigger value="analytics" disabled={membershipInfo.name === 'Basic'}>
              Analytics
              {membershipInfo.name === 'Basic' && <Crown className="w-3 h-3 ml-1" />}
            </TabsTrigger>
          </TabsList>

          {/* QR Generator Tab */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Generator Panel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    QR Code Generator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Type Selector */}
                  <div className="space-y-2">
                    <Label>QR Code Type</Label>
                    <Select value={selectedQRType} onValueChange={setSelectedQRType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="url">
                          <div className="flex items-center gap-2">
                            <Link className="w-4 h-4" />
                            Website URL
                          </div>
                        </SelectItem>
                        <SelectItem value="nutrition" disabled={membershipInfo.name === 'Basic'}>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Nutrition Facts
                            {membershipInfo.name === 'Basic' && <Crown className="w-3 h-3" />}
                          </div>
                        </SelectItem>
                        <SelectItem value="ingredients" disabled={membershipInfo.name === 'Basic'}>
                          <div className="flex items-center gap-2">
                            <ChefHat className="w-4 h-4" />
                            Ingredients List
                            {membershipInfo.name === 'Basic' && <Crown className="w-3 h-3" />}
                          </div>
                        </SelectItem>
                        <SelectItem value="custom" disabled={membershipInfo.name === 'Basic'}>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Custom Content
                            {membershipInfo.name === 'Basic' && <Crown className="w-3 h-3" />}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content Input */}
                  <div className="space-y-2">
                    <Label>Content</Label>
                    {selectedQRType === "url" ? (
                      <Input
                        placeholder="https://example.com"
                        value={qrContent}
                        onChange={(e) => setQrContent(e.target.value)}
                      />
                    ) : (
                      <Textarea
                        placeholder="Enter your content here..."
                        value={qrContent}
                        onChange={(e) => setQrContent(e.target.value)}
                        rows={3}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Customization Options */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Customization</h4>
                    
                    {/* Size */}
                    <div className="space-y-2">
                      <Label>Size: {qrSize}mm</Label>
                      <div className="px-2">
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={qrSize}
                          onChange={(e) => setQrSize(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Foreground</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={qrForeground}
                            onChange={(e) => setQrForeground(e.target.value)}
                            className="w-10 h-10 rounded border"
                          />
                          <Input value={qrForeground} onChange={(e) => setQrForeground(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Background</Label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={qrBackground}
                            onChange={(e) => setQrBackground(e.target.value)}
                            className="w-10 h-10 rounded border"
                          />
                          <Input value={qrBackground} onChange={(e) => setQrBackground(e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Error Correction */}
                    <div className="space-y-2">
                      <Label>Error Correction Level</Label>
                      <Select value={errorCorrection} onValueChange={setErrorCorrection}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L">Low (7%)</SelectItem>
                          <SelectItem value="M">Medium (15%)</SelectItem>
                          <SelectItem value="Q">Quartile (25%)</SelectItem>
                          <SelectItem value="H">High (30%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <Label>Label Position</Label>
                      <Select value={position} onValueChange={setPosition}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="custom">Custom Position</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateQR} 
                    className="w-full"
                    disabled={!qrContent || !membershipInfo.can_generate_qr}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <QRCodePreview 
                    content={qrContent}
                    size={qrSize}
                    foreground={qrForeground}
                    background={qrBackground}
                    errorCorrection={errorCorrection}
                  />
                  
                  {qrContent && (
                    <div className="mt-4 space-y-2">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleCopyContent(qrContent)}>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground break-all">{qrContent}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Manage QR Codes Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your QR Codes</CardTitle>
              </CardHeader>
              <CardContent>
                {qrCodes.length > 0 ? (
                  <div className="space-y-4">
                    {qrCodes.map((qr) => (
                      <div key={qr.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <QrCode className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-medium">{qr.name}</h4>
                            <p className="text-sm text-muted-foreground">{qr.content}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {qr.scans} scans
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Created: {qr.created}
                              </span>
                              <Badge variant="outline">{qr.type}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCopyContent(qr.content)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-medium text-foreground mb-2">No QR codes yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate your first QR code to get started
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create QR Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Scan Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Scan Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Top Performer</span>
                      <span className="font-medium">{analyticsData.topPerformer}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly Growth</span>
                      <span className="font-medium text-success">+{analyticsData.weeklyGrowth}%</span>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm">Device Breakdown</span>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs">Mobile</span>
                          <span className="text-xs">{analyticsData.deviceBreakdown.mobile}%</span>
                        </div>
                        <Progress value={analyticsData.deviceBreakdown.mobile} />
                        <div className="flex justify-between">
                          <span className="text-xs">Desktop</span>
                          <span className="text-xs">{analyticsData.deviceBreakdown.desktop}%</span>
                        </div>
                        <Progress value={analyticsData.deviceBreakdown.desktop} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.geographicData.map((location, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{location.country}</span>
                        </div>
                        <span className="font-medium">{location.scans}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}