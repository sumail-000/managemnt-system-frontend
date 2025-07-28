import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Calendar,
  MapPin,
  TrendingUp,
  Users,
  Trash2,
  ExternalLink,
  X
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Link as RouterLink, useLocation } from "react-router-dom"
import qrCodeService, { QrCodeData, QrCodeGenerationResponse, QrCodeAnalytics } from "@/services/qrCodeService"
import { getStorageUrl } from "@/utils/storage"

// QR Code Preview Component
interface QRCodePreviewProps {
  content: string
  size: number
  foreground: string
  background: string
  errorCorrection: 'L' | 'M' | 'Q' | 'H'
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
  const location = useLocation()
  const [selectedQRType, setSelectedQRType] = useState("url")
  const [qrContent, setQrContent] = useState("")
  const [qrSize, setQrSize] = useState(50)
  const [qrForeground, setQrForeground] = useState("#000000")
  const [qrBackground, setQrBackground] = useState("#ffffff")
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>("M")
  const [position, setPosition] = useState("center")
  const [qrCodes, setQrCodes] = useState<QrCodeData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [analytics, setAnalytics] = useState<QrCodeAnalytics | null>(null)
  const [generatedQR, setGeneratedQR] = useState<any>(null)
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'jpg'>('png')
  const [downloadSize, setDownloadSize] = useState(300)
  
  // Handle preset data from navigation state
  useEffect(() => {
    if (location.state) {
      const { presetContent, presetType } = location.state
      if (presetContent) {
        setQrContent(presetContent)
      }
      if (presetType) {
        setSelectedQRType(presetType)
      }
    }
  }, [location.state])
  
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

  // Load QR codes on component mount
  useEffect(() => {
    loadQRCodes()
    if (membershipInfo.can_generate_qr) {
      loadAnalytics()
    }
  }, [])

  const loadQRCodes = async () => {
    try {
      setIsLoading(true)
      const response = await qrCodeService.getUserQRCodes()
      setQrCodes(response.data || [])
    } catch (error) {
      console.error('Failed to load QR codes:', error)
      setQrCodes([])
      toast({
        title: "Error",
        description: "Failed to load QR codes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const response = await qrCodeService.getAnalytics()
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
  }



  const handleGenerateQR = async () => {
    console.log('🔥 Generate QR button clicked!')
    console.log('📊 Current state:', {
      membershipInfo,
      currentQRUsage,
      qrContent,
      locationState: location.state,
      productId: location.state?.productId
    })
    
    if (!membershipInfo.can_generate_qr) {
      console.log('❌ Membership check failed')
      toast({
        title: "Upgrade Required",
        description: "QR code generation is available for Pro and Enterprise plans only.",
        variant: "destructive"
      })
      return
    }

    if (currentQRUsage >= membershipInfo.qr_limit) {
      console.log('❌ Usage limit reached')
      toast({
        title: "Limit Reached",
        description: `You've reached your monthly limit of ${membershipInfo.qr_limit} QR codes.`,
        variant: "destructive"
      })
      return
    }

    if (!qrContent) {
      console.log('❌ No QR content provided')
      toast({
        title: "Missing Content",
        description: "Please enter content for your QR code.",
        variant: "destructive"
      })
      return
    }

    // Check if we have a product ID from navigation state
    const productId = location.state?.productId
    console.log('🎯 Product ID check:', { productId, locationState: location.state })
    
    if (!productId) {
      console.log('❌ No product ID found in navigation state')
      toast({
        title: "Missing Product",
        description: "Please select a product to generate QR code for. Navigate from a product page or select a product from the list.",
        variant: "destructive"
      })
      return
    }

    try {
      console.log('🚀 Starting QR generation process...')
      setIsGenerating(true)
      
      const options = {
        size: qrSize * 10, // High resolution
        format: 'svg' as const, // Use SVG to avoid Imagick dependency
        error_correction: errorCorrection as 'L' | 'M' | 'Q' | 'H',
        margin: 2,
        color: qrForeground,
        background_color: qrBackground
      }
      
      console.log('⚙️ Generation options:', options)
      console.log('🎯 Using product ID:', productId)
      
      const response = await qrCodeService.generateQrCode(productId, options)
      console.log('✅ QR generation response:', response)
      console.log('📊 Response structure:', {
        success: response.success,
        message: response.message,
        data: response.data,
        upgrade_required: response.upgrade_required
      })
      
      // Reload QR codes list
      console.log('🔄 Reloading QR codes list...')
      await loadQRCodes()
      
      // Store generated QR data for preview
      console.log('💾 Setting generated QR data:', response.data)
      console.log('🔍 Full response object:', response)
      setGeneratedQR(response.data || response)
      setShowGeneratedPreview(true)
      console.log('👁️ showGeneratedPreview set to true')
      
      toast({
        title: "QR Code Generated!",
        description: "Your QR code has been created and saved successfully. You can now download, share, or copy the URL."
      })
      
    } catch (error: any) {
      console.error('QR generation error:', error)
      toast({
        title: "Generation Failed",
        description: error.response?.data?.message || "Failed to generate QR code. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteQR = async (qrCodeId: number) => {
    try {
      await qrCodeService.deleteQrCode(qrCodeId)
      await loadQRCodes()
      toast({
        title: "QR Code Deleted",
        description: "QR code has been deleted successfully."
      })
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDownloadQR = async (qrCodeId: number) => {
    try {
      const blob = await qrCodeService.downloadQrCode(qrCodeId)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qr-code-${qrCodeId}.png`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    })
  }

  const handleShareQR = async (qrData: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'QR Code',
          text: `Check out this QR code for ${qrData.qr_code?.product?.name || 'product'}`,
          url: qrData.public_url
        })
      } catch (error) {
        // User cancelled sharing or error occurred
        handleCopyContent(qrData.public_url)
      }
    } else {
      // Fallback to copying URL
      handleCopyContent(qrData.public_url)
      toast({
        title: "Share URL Copied!",
        description: "Share URL has been copied to clipboard",
      })
    }
  }

  const handleDownloadGenerated = async (qrData: any) => {
    console.log('🔥 Download button clicked!')
    console.log('📊 Download parameters:', {
      downloadFormat,
      downloadSize,
      qrForeground,
      qrBackground,
      errorCorrection,
      qrData
    })
    
    try {
      console.log('🚀 Starting QR code generation...')
      
      const generationOptions = {
        size: downloadSize,
        format: downloadFormat,
        color: qrForeground,
        background_color: qrBackground,
        error_correction: errorCorrection
      }
      
      console.log('⚙️ Generation options:', generationOptions)
      console.log('🎯 Product ID:', qrData.qr_code?.product_id)
      
      // Generate QR code with user's preferred format and size
      const response = await qrCodeService.generateQrCode(
        qrData.qr_code?.product_id,
        generationOptions
      )
      
      console.log('✅ QR generation response:', response)
      console.log('🔍 Response structure check:', {
        hasData: !!response.data,
        hasQrCode: !!response.data?.qr_code,
        dataQrCode: response.data?.qr_code
      })

      // Use the correct response structure - handle both nested and flat structures
      const qrCodeData = response.data?.qr_code || response.qr_code
      const qrCodeId = qrCodeData?.id
      
      if (qrCodeId) {
        console.log('📥 Starting blob download for QR ID:', qrCodeId)
        
        // Use the blob download method like handleDownloadQR
        const blob = await qrCodeService.downloadQrCode(qrCodeId)
        console.log('📦 Blob received:', { size: blob.size, type: blob.type })
        
        const url = window.URL.createObjectURL(blob)
        console.log('🔗 Blob URL created:', url)
        
        // Get the actual file extension from the stored image path
        const actualFormat = qrCodeData?.image_path ? 
          qrCodeData.image_path.split('.').pop()?.toLowerCase() || downloadFormat : 
          downloadFormat
        
        const filename = `qr-code-${qrCodeData?.product_id || qrData.qr_code?.product_id || 'generated'}-${downloadSize}px.${actualFormat}`
        console.log('📁 Download filename:', filename)
        console.log('🔍 Format details:', {
          requested: downloadFormat,
          actual: actualFormat,
          imagePath: qrCodeData?.image_path
        })
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        console.log('🖱️ Triggering download click...')
        link.click()
        
        window.URL.revokeObjectURL(url)
        console.log('🧹 Blob URL cleaned up')
        
        toast({
          title: "Download Started",
          description: `QR code downloaded as ${actualFormat.toUpperCase()} (${downloadSize}px)${actualFormat !== downloadFormat ? ` - Note: Converted from ${downloadFormat.toUpperCase()} due to server limitations` : ''}`,
        })
        
        console.log('✨ Download process completed successfully!')
      } else {
        console.error('❌ No QR code ID in response:', response)
        throw new Error('No QR code ID returned from generation')
      }
    } catch (error) {
      console.error('💥 Download failed with error:', error)
      console.error('📋 Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      })
      
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive"
      })
    }
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
                <div className="text-2xl font-bold">{analytics?.overview?.total_scans || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all QR codes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview?.avg_scans_per_qr || 0}</div>
                <p className="text-xs text-muted-foreground">avg scans per QR</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Max Scans</CardTitle>
                <TrendingUp className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview?.max_scans || 0}</div>
                <p className="text-xs text-muted-foreground">highest performing QR</p>
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
                      <Select value={errorCorrection} onValueChange={(value: 'L' | 'M' | 'Q' | 'H') => setErrorCorrection(value)}>
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

                    {/* Download Options */}
                    <div className="space-y-4">
                      <h5 className="font-medium text-sm">Download Options</h5>
                      
                      {/* Download Format */}
                      <div className="space-y-2">
                        <Label>Format</Label>
                        <Select value={downloadFormat} onValueChange={(value: 'png' | 'svg' | 'jpg') => setDownloadFormat(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="png">PNG (Recommended for web)</SelectItem>
                            <SelectItem value="jpg">JPG (Smaller file size)</SelectItem>
                            <SelectItem value="svg">SVG (Vector, scalable)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Download Size */}
                      <div className="space-y-2">
                        <Label>Download Size: {downloadSize}px</Label>
                        <div className="px-2">
                          <input
                            type="range"
                            min="100"
                            max="1000"
                            step="50"
                            value={downloadSize}
                            onChange={(e) => setDownloadSize(Number(e.target.value))}
                            className="w-full"
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Recommended: 300px for web, 600px+ for print
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleGenerateQR} 
                    className="w-full"
                    disabled={!qrContent || !membershipInfo.can_generate_qr || isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {showGeneratedPreview && generatedQR ? "Generated QR Code" : "Preview"}
                  </CardTitle>
                  {showGeneratedPreview && generatedQR && (
                    <CardDescription>
                      Your QR code has been generated successfully. You can download it below.
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {showGeneratedPreview && generatedQR ? (
                    /* Show actual generated QR code */
                    <div className="space-y-4">
                      {/* QR Code Image */}
                      <div className="flex justify-center">
                        {generatedQR.image_url && (
                          <div className="border rounded-lg p-4 bg-white">
                            <img 
                              src={getStorageUrl(generatedQR.image_url) || generatedQR.image_url} 
                              alt="Generated QR Code" 
                              className="w-48 h-48 object-contain"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* QR Code Details */}
                      <div className="text-center space-y-2">
                        {generatedQR.qr_code?.product?.name && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Product:</span> {generatedQR.qr_code.product.name}
                          </p>
                        )}
                        {generatedQR.public_url && (
                          <p className="text-xs text-muted-foreground break-all">
                            <span className="font-medium">URL:</span> {generatedQR.public_url}
                          </p>
                        )}
                      </div>
                      
                      {/* Action Buttons - Only Download */}
                      <div className="flex justify-center gap-3">
                        <Button 
                          onClick={() => handleDownloadGenerated(generatedQR)}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download QR Code
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={() => handleCopyContent(generatedQR.public_url)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy URL
                        </Button>
                        
                        <Button 
                          variant="ghost"
                          onClick={() => {
                            setShowGeneratedPreview(false)
                            setGeneratedQR(null)
                            setQrContent("")
                            setSelectedQRType("url")
                          }}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Show preview only */
                    <div className="space-y-4">
                      <QRCodePreview 
                        content={qrContent}
                        size={qrSize}
                        foreground={qrForeground}
                        background={qrBackground}
                        errorCorrection={errorCorrection}
                      />
                      
                      {qrContent && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground break-all">{qrContent}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Click "Generate QR Code" to create a downloadable version
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Generated QR Code Preview section is now integrated into the Preview Panel above */}
          </TabsContent>

          {/* Manage QR Codes Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your QR Codes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading QR codes...</p>
                  </div>
                ) : qrCodes.length > 0 ? (
                  <div className="space-y-4">
                    {qrCodes.map((qr) => (
                      <div key={qr.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <QrCode className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-medium">{qr.product_name || 'QR Code'}</h4>
                            <p className="text-sm text-muted-foreground truncate max-w-xs">{qr.url_slug}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {qr.scan_count || 0} scans
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Created: {new Date(qr.created_at).toLocaleDateString()}
                              </span>
                              <Badge variant="outline">Product QR</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(getStorageUrl(qr.image_url) || qr.image_url || '#', '_blank')}
                            title="View QR Code"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCopyContent(qr.url_slug)}
                            title="Copy Content"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadQR(qr.id)}
                            title="Download QR Code"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteQR(qr.id)}
                            title="Delete QR Code"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Loading analytics...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Top Performer</span>
                        <span className="font-medium">{analytics?.top_performing?.[0]?.product_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Avg Scans per QR</span>
                        <span className="font-medium">
                          {analytics?.overview?.avg_scans_per_qr || 0}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm">Performance</span>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-xs">Total QR Codes</span>
                            <span className="text-xs">{analytics?.overview?.total_qr_codes || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-xs">Max Scans</span>
                            <span className="text-xs">{analytics?.overview?.max_scans || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Performing QR Codes */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing QR Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="w-6 h-6 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Loading performance data...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analytics?.top_performing?.slice(0, 3).map((qr, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <QrCode className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{qr.product_name}</span>
                          </div>
                          <span className="font-medium">{qr.scan_count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}