import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
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
  X,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Link as RouterLink, useLocation } from "react-router-dom"
import qrCodeService, { QrCodeData, QrCodeGenerationResponse, QrCodeAnalytics, QrCodeUrlGenerationOptions } from "@/services/qrCodeService"
import { getStorageUrl } from "@/utils/storage"
import { productsAPI } from "@/services/api"
import { Product } from "@/types/product"

// QR Code Preview Component
interface QRCodePreviewProps {
  content: string
  size: number
  foreground: string
  background: string
}

function QRCodePreview({ content, size, foreground, background }: QRCodePreviewProps) {
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
        errorCorrectionLevel: 'H', // High error correction to ensure all corners are present
        type: 'image/png',
        quality: 0.95,
        margin: 2, // Reduced margin to ensure corners are visible
        color: {
          dark: foreground,
          light: background
        },
        width: Math.max(256, size * 4),
        scale: 4, // Reduced scale for better rendering
        rendererOpts: {
          quality: 0.95
        }
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
  }, [content, foreground, background, size])

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
  const [qrContent, setQrContent] = useState("")
  const [qrSize, setQrSize] = useState(50)
  const [qrForeground, setQrForeground] = useState("#000000")
  const [qrBackground, setQrBackground] = useState("#ffffff")
  const [qrCodes, setQrCodes] = useState<QrCodeData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [analytics, setAnalytics] = useState<QrCodeAnalytics | null>(null)
  const [generatedQR, setGeneratedQR] = useState<any>(null)
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg' | 'jpg'>('png')
  const [downloadSize, setDownloadSize] = useState(300)
  const [selectedQRs, setSelectedQRs] = useState<number[]>([])
  const [bulkAction, setBulkAction] = useState<'download' | 'delete' | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'scan_count' | 'product_name'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const [imageReloadKey, setImageReloadKey] = useState(0)
  const [isReloadingImage, setIsReloadingImage] = useState(false)
  
  // Handle preset data from navigation state
  useEffect(() => {
    if (location.state) {
      const { presetContent, publicUrl } = location.state
      if (presetContent) {
        setQrContent(presetContent)
      } else if (publicUrl) {
        setQrContent(publicUrl)
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
        can_generate_qr: false,
        has_analytics: false
      }
    }
    
    const plan = user.membership_plan
    return {
      name: plan.name,
      qr_limit: plan.name === 'Basic' ? 0 : plan.name === 'Pro' ? 20 : 999,
      features: plan.features || [],
      can_generate_qr: plan.name !== 'Basic',
      has_analytics: plan.name !== 'Basic' // Analytics requires premium (Pro/Enterprise)
    }
  }

  const membershipInfo = getMembershipFeatures()
  const currentQRUsage = usage?.qr_codes?.current_month || 0
  const qrUsagePercentage = membershipInfo.qr_limit > 0 ? (currentQRUsage / membershipInfo.qr_limit) * 100 : 0

  // Load QR codes and products on component mount and when user changes
  useEffect(() => {
    console.log('🚀 [QR_MANAGEMENT] useEffect triggered with user dependency:', {
      user: user?.id,
      userEmail: user?.email,
      isAuthenticated: !!user,
      membershipInfo: {
        name: membershipInfo.name,
        can_generate_qr: membershipInfo.can_generate_qr,
        has_analytics: membershipInfo.has_analytics
      }
    })
    
    if (!user) {
      console.log('⚠️ [QR_MANAGEMENT] No user found, skipping data loading')
      return
    }
    
    console.log('📋 [QR_MANAGEMENT] User authenticated, starting data loading...')
    loadQRCodes()
    loadProducts()
    
    // Only load analytics for premium users to avoid 403 errors
    if (user && membershipInfo.has_analytics) {
      console.log('📊 [QR_MANAGEMENT] Loading analytics for premium user')
      loadAnalytics()
    } else {
      console.log('📊 [QR_MANAGEMENT] Skipping analytics - not premium user')
    }
  }, [user]) // Add user as dependency so effect re-runs when user loads

  const loadQRCodes = async () => {
    console.log('🔄 [QR_MANAGEMENT] Starting loadQRCodes function...')
    console.log('🔍 [QR_MANAGEMENT] User state:', { user: user?.id, isAuthenticated: !!user })
    
    try {
      setIsLoading(true)
      console.log('⏳ [QR_MANAGEMENT] Set loading state to true')
      
      console.log('📡 [QR_MANAGEMENT] Calling qrCodeService.getUserQRCodes()...')
      const response = await qrCodeService.getUserQRCodes()
      
      console.log('📥 [QR_MANAGEMENT] API Response received:', {
        success: response?.success,
        dataLength: response?.data?.length || 0,
        fullResponse: response
      })
      
      const qrCodesData = response.data || []
      console.log('💾 [QR_MANAGEMENT] Setting QR codes data:', {
        count: qrCodesData.length,
        qrCodes: qrCodesData.map(qr => ({
          id: qr.id,
          product_id: qr.product_id,
          product_name: qr.product_name,
          url_slug: qr.url_slug,
          image_url: qr.image_url,
          scan_count: qr.scan_count,
          created_at: qr.created_at
        }))
      })
      
      setQrCodes(qrCodesData)
      console.log('✅ [QR_MANAGEMENT] QR codes state updated successfully')
      
    } catch (error) {
      console.error('❌ [QR_MANAGEMENT] Failed to load QR codes:', {
        error: error,
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data
      })
      
      setQrCodes([])
      toast({
        title: "Error",
        description: "Failed to load QR codes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      console.log('🏁 [QR_MANAGEMENT] Loading completed, isLoading set to false')
    }
  }

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await productsAPI.getAll({ 
        per_page: 100, 
        sort_by: 'updated_at', 
        sort_order: 'desc' 
      })
      setProducts(response.data || [])
      
      // Auto-select product from navigation state if available
      if (location.state?.productId && response.data) {
        const product = response.data.find((p: Product) => p.id === location.state.productId)
        if (product) {
          setSelectedProduct(product)
        }
      }
    } catch (error) {
      console.error('Failed to load products:', error)
      setProducts([])
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      })
    } finally {
      setLoadingProducts(false)
    }
  }

  const loadAnalytics = async () => {
    // Get fresh membership info and double-check before making API call
    const currentMembershipInfo = getMembershipFeatures()
    if (!user || !currentMembershipInfo.has_analytics) {
      setAnalytics(null)
      return
    }

    try {
      const response = await qrCodeService.getAnalytics()
      setAnalytics(response.data)
    } catch (error: any) {
      if (error.response?.status === 403) {
        // Analytics requires premium membership - silently handle this
        setAnalytics(null)
      } else {
        console.error('Failed to load analytics:', error)
        setAnalytics(null)
      }
    }
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

    // Use selected product ID if available
    const productId = selectedProduct?.id

    try {
      console.log('🚀 [DEBUG] Starting QR code generation...')
      
      // Auto-reset previous QR code when generating new one
      setShowGeneratedPreview(false)
      setGeneratedQR(null)
      setImageLoadError(false)
      setImageReloadKey(0)
      console.log('🔄 [DEBUG] Reset previous QR code preview and image states')
      
      setIsGenerating(true)
      console.log('⏳ [DEBUG] Set isGenerating to true')
      
      const options = {
        size: qrSize * 10, // High resolution
        format: 'png' as const, // Use PNG format for better compatibility
        margin: 2,
        color: qrForeground,
        background_color: qrBackground
      }
      
      console.log('📋 [DEBUG] Generation options:', options)
      console.log('🎯 [DEBUG] Product ID:', productId)
      
      let response: QrCodeGenerationResponse;
      
      if (productId && typeof productId === 'number') {
        // Generate QR code for existing product
        response = await qrCodeService.generateQrCode(productId, options)
      } else {
        // Generate QR code from URL content directly
        const urlOptions = {
          ...options,
          content: qrContent,
          type: 'url' as const
        }
        response = await qrCodeService.generateQrCodeFromUrl(urlOptions)
      }
      
      console.log('📡 [DEBUG] Raw API response:', response)
      console.log('✅ [DEBUG] Response success status:', response.success)
      console.log('🔍 [DEBUG] Response type:', typeof response)
      console.log('🔍 [DEBUG] Response keys:', Object.keys(response || {}))
      
      // Check if the response indicates success
      if (response.success === false) {
        console.error('❌ [DEBUG] Response indicates failure:', response.message)
        throw new Error(response.message || "QR code generation failed")
      }
      
      console.log('🔍 [DEBUG] QR code data from response:', response.qr_code)
      console.log('🖼️ [DEBUG] Image URL:', response.image_url)
      console.log('🔗 [DEBUG] Public URL:', response.public_url)
      console.log('📥 [DEBUG] Download URL:', response.download_url)
      
      // Reload QR codes list
      console.log('🔄 [DEBUG] Reloading QR codes list...')
      await loadQRCodes()
      console.log('✅ [DEBUG] QR codes list reloaded successfully')
      
      // Store generated QR data for preview - response.qr_code contains the QR code data
      if (response.qr_code) {
        console.log('💾 [DEBUG] Setting generated QR data for preview:', response.qr_code)
        console.log('🔍 [DEBUG] API response image_url:', response.image_url)
        console.log('🔍 [DEBUG] API response public_url:', response.public_url)
        console.log('🔍 [DEBUG] API response download_url:', response.download_url)
        
        // Merge the QR code data with the image_url from the root response
        const qrCodeWithImage = {
          ...response.qr_code,
          image_url: response.image_url, // Use image_url from root response
          public_url: response.public_url || response.qr_code.public_url,
          download_url: response.download_url || response.qr_code.download_url
        }
        
        console.log('🔍 [DEBUG] Final QR code data structure:', {
          id: qrCodeWithImage.id,
          product_id: qrCodeWithImage.product_id,
          image_url: qrCodeWithImage.image_url,
          image_path: qrCodeWithImage.image_path,
          public_url: qrCodeWithImage.public_url,
          download_url: qrCodeWithImage.download_url,
          product: qrCodeWithImage.product
        })
        
        setGeneratedQR(qrCodeWithImage)
        console.log('📊 [DEBUG] generatedQR state updated with image_url:', qrCodeWithImage.image_url)
        
        setShowGeneratedPreview(true)
        console.log('👁️ [DEBUG] showGeneratedPreview set to true')
        
        // Additional verification
        setTimeout(() => {
          console.log('🔍 [DEBUG] State verification after 100ms:', {
            generatedQRExists: !!generatedQR,
            showGeneratedPreview: showGeneratedPreview,
            generatedQRImageUrl: generatedQR?.image_url
          })
        }, 100)
        
        console.log('✅ [DEBUG] Generated QR data set successfully, preview shown')
      } else {
        console.warn('⚠️ [DEBUG] No QR code data in response, checking alternative paths...')
        console.log('🔍 [DEBUG] Full response structure:', JSON.stringify(response, null, 2))
      }
      
      console.log('🎉 [DEBUG] QR code generation completed successfully!')
      toast({
        title: "QR Code Generated!",
        description: "Your QR code has been created and saved successfully. You can now download, share, or copy the URL."
      })
      
    } catch (error: any) {
      console.error('💥 [DEBUG] QR code generation failed:')
      console.error('📄 [DEBUG] Error object:', error)
      console.error('📝 [DEBUG] Error message:', error.message)
      console.error('🌐 [DEBUG] Error response:', error.response)
      console.error('📊 [DEBUG] Error response data:', error.response?.data)
      console.error('🔢 [DEBUG] Error response status:', error.response?.status)
      console.error('📋 [DEBUG] Error stack:', error.stack)
      
      toast({
        title: "Generation Failed",
        description: error.response?.data?.message || error.message || "Failed to generate QR code. Please try again.",
        variant: "destructive"
      })
    } finally {
      console.log('🏁 [DEBUG] Setting isGenerating to false')
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

  const handleReloadImage = async () => {
    if (!generatedQR) {
      console.error('[QR_RELOAD] No QR code data available to reload')
      toast({
        title: "Reload Failed",
        description: "No QR code data available to reload.",
        variant: "destructive"
      })
      return
    }

    setIsReloadingImage(true)
    setImageLoadError(false)
    
    try {
      console.log('[QR_RELOAD] Starting preview reload process...', {
        hasImageUrl: !!generatedQR.image_url,
        imageUrl: generatedQR.image_url,
        fullUrl: generatedQR.image_url ? (getStorageUrl(generatedQR.image_url) || generatedQR.image_url) : 'N/A',
        timestamp: new Date().toISOString()
      })
      
      // Force reload by incrementing the key
      setImageReloadKey(prev => prev + 1)
      
      console.log('[QR_RELOAD] Preview reload key incremented:', imageReloadKey + 1)
      
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Preview Reloaded",
        description: "QR code preview has been refreshed successfully."
      })
      
      console.log('[QR_RELOAD] Preview reload completed successfully')
    } catch (error) {
      console.error('[QR_RELOAD] Reload failed:', error)
      setImageLoadError(true)
      toast({
        title: "Reload Failed",
        description: "Failed to reload QR code preview. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsReloadingImage(false)
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
          text: `Check out this QR code for ${qrData.product?.name || 'product'}`,
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
    try {
      // Check if we already have a QR code ID, if so, use direct download
      if (qrData.id) {
        console.log('🔍 [DEBUG] Direct download for existing QR code ID:', qrData.id)
        // Use the blob download method like handleDownloadQR
        const blob = await qrCodeService.downloadQrCode(qrData.id)
        const url = window.URL.createObjectURL(blob)
        
        // Get the actual file extension from the stored image path
        const actualFormat = qrData?.image_path ? 
          qrData.image_path.split('.').pop()?.toLowerCase() || downloadFormat : 
          downloadFormat
        
        const filename = `qr-code-${qrData?.product_id || 'custom'}-${downloadSize}px.${actualFormat}`
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Download Started",
          description: `QR code downloaded as ${actualFormat.toUpperCase()}`,
        })
        return
      }

      // If no ID, regenerate with custom options
      console.log('🔍 [DEBUG] Regenerating QR code for download with custom options')
      const generationOptions = {
        size: downloadSize,
        format: downloadFormat,
        color: qrForeground,
        background_color: qrBackground
      }
      
      let response: QrCodeGenerationResponse;
      
      if (qrData.product_id && typeof qrData.product_id === 'number') {
        // Generate QR code for existing product
        console.log('🔍 [DEBUG] Regenerating product-based QR code')
        response = await qrCodeService.generateQrCode(qrData.product_id, generationOptions)
      } else {
        // Generate QR code from URL content directly
        console.log('🔍 [DEBUG] Regenerating URL-based QR code')
        const urlOptions = {
          ...generationOptions,
          content: qrData.content || qrData.public_url, // Use stored content or public URL
          type: 'url' as const
        }
        response = await qrCodeService.generateQrCodeFromUrl(urlOptions)
      }

      // Check if the response indicates success
      if (response.success === false) {
        throw new Error(response.message || "QR code generation failed")
      }

      // Use the correct response structure - response.qr_code contains the QR code data
      const qrCodeData = response.qr_code
      const qrCodeId = qrCodeData?.id
      
      if (qrCodeId) {
        // Use the blob download method like handleDownloadQR
        const blob = await qrCodeService.downloadQrCode(qrCodeId)
        const url = window.URL.createObjectURL(blob)
        
        // Get the actual file extension from the stored image path
        const actualFormat = qrCodeData?.image_path ? 
          qrCodeData.image_path.split('.').pop()?.toLowerCase() || downloadFormat : 
          downloadFormat
        
        const filename = `qr-code-${qrCodeData?.product_id || 'custom'}-${downloadSize}px.${actualFormat}`
        
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        
        window.URL.revokeObjectURL(url)
        
        toast({
          title: "Download Started",
          description: `QR code downloaded as ${actualFormat.toUpperCase()} (${downloadSize}px)${actualFormat !== downloadFormat ? ` - Note: Converted from ${downloadFormat.toUpperCase()} due to server limitations` : ''}`,
        })
      } else {
        throw new Error('No QR code ID returned from generation')
      }
    } catch (error: any) {
      console.error('🚨 [DEBUG] Download failed:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedQRs.length === filteredQRCodes.length) {
      setSelectedQRs([])
    } else {
      setSelectedQRs(filteredQRCodes.map(qr => qr.id))
    }
  }

  const handleSelectQR = (qrId: number) => {
    setSelectedQRs(prev => 
      prev.includes(qrId) 
        ? prev.filter(id => id !== qrId)
        : [...prev, qrId]
    )
  }

  const handleBulkDownload = async () => {
    try {
      for (const qrId of selectedQRs) {
        await handleDownloadQR(qrId)
        // Add small delay to prevent overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      toast({
        title: "Bulk Download Complete",
        description: `Downloaded ${selectedQRs.length} QR codes successfully.`
      })
      setSelectedQRs([])
    } catch (error) {
      toast({
        title: "Bulk Download Failed",
        description: "Some QR codes failed to download. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleBulkDelete = async () => {
    const totalSelected = selectedQRs.length
    const failedDeletes: number[] = []
    
    try {
      for (const qrId of selectedQRs) {
        try {
          await qrCodeService.deleteQrCode(qrId)
        } catch (error) {
          console.error(`Failed to delete QR code ${qrId}:`, error)
          failedDeletes.push(qrId)
        }
      }
      
      await loadQRCodes()
      
      const successCount = totalSelected - failedDeletes.length
      
      if (failedDeletes.length === 0) {
        toast({
          title: totalSelected === 1 ? "QR Code Deleted" : "QR Codes Deleted",
          description: totalSelected === 1 
            ? "QR code has been deleted successfully."
            : `Deleted ${successCount} QR codes successfully.`
        })
      } else if (successCount > 0) {
        toast({
          title: "Partial Delete Complete",
          description: `Deleted ${successCount} of ${totalSelected} QR codes. ${failedDeletes.length} failed.`,
          variant: "destructive"
        })
      } else {
        toast({
          title: totalSelected === 1 ? "Delete Failed" : "Bulk Delete Failed",
          description: totalSelected === 1 
            ? "Failed to delete QR code. Please try again."
            : "All QR codes failed to delete. Please try again.",
          variant: "destructive"
        })
      }
      
      setSelectedQRs([])
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast({
        title: totalSelected === 1 ? "Delete Failed" : "Bulk Delete Failed",
        description: totalSelected === 1 
          ? "Failed to delete QR code. Please try again."
          : "Some QR codes failed to delete. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Filter and sort QR codes
  console.log('[QRCodes] Filtering QR codes:', {
    totalQRCodes: qrCodes.length,
    searchTerm,
    sortBy,
    sortOrder,
    qrCodesData: qrCodes.map(qr => ({
      id: qr.id,
      productName: qr.product?.name,
      urlSlug: qr.url_slug,
      isPremium: qr.is_premium,
      scanCount: qr.scan_count,
      createdAt: qr.created_at
    }))
  });

  const filteredQRCodes = qrCodes
    .filter(qr => {
      const matchesSearch = !searchTerm || 
        qr.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qr.url_slug?.toLowerCase().includes(searchTerm.toLowerCase())
      
      console.log('[QRCodes] Filter check for QR:', {
        qrId: qr.id,
        productName: qr.product?.name,
        urlSlug: qr.url_slug,
        isPremium: qr.is_premium,
        searchTerm,
        matchesSearch,
        finalMatch: matchesSearch
      });
      
      return matchesSearch
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'scan_count':
          aValue = a.scan_count || 0
          bValue = b.scan_count || 0
          break
        case 'product_name':
          aValue = a.product?.name || ''
          bValue = b.product?.name || ''
          break
        default:
          aValue = new Date(a.created_at || 0).getTime()
          bValue = new Date(b.created_at || 0).getTime()
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    });

  console.log('[QRCodes] Filtered QR codes result:', {
    originalCount: qrCodes.length,
    filteredCount: filteredQRCodes.length,
    filteredQRCodes: filteredQRCodes.map(qr => ({
      id: qr.id,
      productName: qr.product?.name,
      urlSlug: qr.url_slug,
      isPremium: qr.is_premium,
      scanCount: qr.scan_count
    }))
  });

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
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Select Product
                    </Label>
                    <Select 
                      value={selectedProduct?.id?.toString() || ""} 
                      onValueChange={(value) => {
                        if (value === "none") {
                          setSelectedProduct(null)
                        } else {
                          const product = products.find(p => p.id?.toString() === value)
                          if (product) {
                            setSelectedProduct(product)
                            // Auto-fill content with product's public URL if available
                            if (product.is_public) {
                              const publicUrl = `${window.location.origin}/public/product/${product.id}`
                              setQrContent(publicUrl)
                            }
                          }
                        }
                      }}
                      disabled={loadingProducts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Product (Custom QR Code)</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id?.toString() || ""}>
                            <div className="flex items-center gap-2">
                              <span>{product.name}</span>
                              {product.is_public && (
                                <Badge variant="secondary" className="text-xs">
                                  Public
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedProduct && (
                      <p className="text-sm text-muted-foreground">
                        Selected: <span className="font-medium">{selectedProduct.name}</span>
                        {selectedProduct.is_public && (
                          <span className="text-green-600 ml-2">• Public product</span>
                        )}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      URL
                    </Label>
                    <Input
                      type="url"
                      placeholder="Make sure your recipe is public to get its URL for QR code generation..."
                      value={qrContent}
                      onChange={(e) => setQrContent(e.target.value)}
                    />
                  </div>

                  <Separator />

                  {/* QR Code Options */}
                  <div className="space-y-4">
                    
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
                  {(() => {
                    console.log('🎭 [DEBUG] Preview Panel Render Check:', {
                      showGeneratedPreview,
                      generatedQRExists: !!generatedQR,
                      generatedQRImageUrl: generatedQR?.image_url,
                      condition: showGeneratedPreview && generatedQR,
                      timestamp: new Date().toISOString()
                    })
                    return showGeneratedPreview && generatedQR
                  })() ? (
                    /* Show actual generated QR code */
                    <div className="space-y-4">
                      {/* QR Code Display */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-8">
                        <div className="flex flex-col items-center space-y-6">
                          {/* QR Code Image */}
                          <div className="relative">
                            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-white">
                              {generatedQR.image_url ? (
                                imageLoadError ? (
                                  <div className="w-56 h-56 flex items-center justify-center text-muted-foreground border-2 border-dashed border-red-300 rounded-lg">
                                    <div className="text-center">
                                      <QrCode className="w-16 h-16 mx-auto mb-3 opacity-50 text-red-400" />
                                      <p className="text-sm font-medium text-red-600">Image Load Failed</p>
                                      <p className="text-xs mt-1 text-red-500">Click reload to try again</p>
                                    </div>
                                  </div>
                                ) : (
                                  <img 
                                    key={`qr-image-${imageReloadKey}`}
                                    src={getStorageUrl(generatedQR.image_url) || generatedQR.image_url} 
                                    alt="Generated QR Code" 
                                    className="w-56 h-56 object-contain"
                                    onLoad={() => {
                                      console.log('[QR_IMAGE] QR Code image loaded successfully:', {
                                        imageUrl: generatedQR.image_url,
                                        fullUrl: getStorageUrl(generatedQR.image_url) || generatedQR.image_url,
                                        reloadKey: imageReloadKey,
                                        timestamp: new Date().toISOString()
                                      });
                                      setImageLoadError(false);
                                    }}
                                    onError={(e) => {
                                      console.error('[QR_IMAGE] QR Code image failed to load:', {
                                        imageUrl: generatedQR.image_url,
                                        fullUrl: getStorageUrl(generatedQR.image_url) || generatedQR.image_url,
                                        reloadKey: imageReloadKey,
                                        error: e,
                                        errorType: e.type,
                                        target: e.target,
                                        timestamp: new Date().toISOString()
                                      });
                                      setImageLoadError(true);
                                    }}
                                  />
                                )
                              ) : (
                                <div className="w-56 h-56 flex items-center justify-center text-muted-foreground">
                                  <div className="text-center">
                                    <QrCode className="w-16 h-16 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-medium">QR Code Generated Successfully</p>
                                    <p className="text-xs mt-1">Image URL not available</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Success Badge */}
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-2 shadow-lg">
                              <QrCode className="w-4 h-4" />
                            </div>
                          </div>
                          
                          {/* Reload Button - Show for both success and failure */}
                          {generatedQR && (
                            <div className="flex justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleReloadImage}
                                disabled={isReloadingImage}
                                className="bg-white hover:bg-gray-50 border-gray-300 shadow-md px-4 py-2 h-9"
                                title="Reload Preview Image"
                              >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isReloadingImage ? 'animate-spin' : ''}`} />
                                {isReloadingImage ? 'Reloading...' : 'Reload Preview'}
                              </Button>
                            </div>
                          )}
                          
                          {/* QR Code Info */}
                          <div className="text-center space-y-3">
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg px-4 py-3">
                              {generatedQR.qr_code?.product?.name && (
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1">
                                  {generatedQR.qr_code.product.name}
                                </h3>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                QR Code generated successfully
                              </p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap justify-center gap-3">
                            <Button 
                              onClick={() => handleDownloadGenerated(generatedQR)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download QR Code
                            </Button>
                            
                            <Button 
                              variant="outline"
                              onClick={() => handleCopyContent(generatedQR.public_url)}
                              className="border-2 border-gray-300 hover:border-gray-400 px-6 py-2 rounded-lg transition-all duration-200"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copy URL
                            </Button>
                            
                            <Button 
                              variant="outline"
                              onClick={() => handleShareQR(generatedQR)}
                              className="border-2 border-gray-300 hover:border-gray-400 px-6 py-2 rounded-lg transition-all duration-200"
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </Button>
                          </div>
                        </div>
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
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Manage QR Codes
                </CardTitle>
                <CardDescription>
                  View, download, and manage your generated QR codes with advanced filtering and bulk operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search QR codes by product name or URL..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    

                    
                    {/* Sort */}
                    <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                      const [field, order] = value.split('-')
                      setSortBy(field as 'created_at' | 'scan_count' | 'product_name')
                      setSortOrder(order as 'asc' | 'desc')
                    }}>
                      <SelectTrigger className="w-full sm:w-48">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at-desc">Newest First</SelectItem>
                        <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        <SelectItem value="scan_count-desc">Most Scanned</SelectItem>
                        <SelectItem value="scan_count-asc">Least Scanned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Bulk Actions */}
                  {filteredQRCodes.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedQRs.length === filteredQRCodes.length && filteredQRCodes.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm font-medium">
                          {selectedQRs.length > 0 ? `${selectedQRs.length} selected` : 'Select all'}
                        </span>
                      </div>
                      
                      {selectedQRs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDownload}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download ({selectedQRs.length})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDelete}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete ({selectedQRs.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              

                {(() => {
                  console.log('[QRCodes] Display logic check:', {
                    isLoading,
                    filteredQRCodesLength: filteredQRCodes.length,
                    searchTerm,
                    displayState: isLoading ? 'loading' : 
                      filteredQRCodes.length > 0 ? 'showing_qr_codes' : 
                      searchTerm ? 'no_match_found' : 'empty_state'
                  });
                  
                  if (isLoading) {
                    console.log('[QRCodes] Displaying loading state');
                    return (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 mx-auto mb-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-sm text-muted-foreground">Loading QR codes...</p>
                      </div>
                    );
                  }
                  
                  if (filteredQRCodes.length > 0) {
                    console.log('[QRCodes] Displaying QR codes grid:', filteredQRCodes.length, 'items');
                    return (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredQRCodes.map((qr) => (
                          <Card key={qr.id} className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                            <CardContent className="p-4">
                              {/* Header with checkbox and premium badge */}
                              <div className="flex items-center justify-between mb-3">
                                <Checkbox
                                  checked={selectedQRs.includes(qr.id)}
                                  onCheckedChange={() => handleSelectQR(qr.id)}
                                />
                                {qr.is_premium && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </div>

                              {/* QR Code Image - Large Preview */}
                              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                                {qr.image_url ? (
                                  <img 
                                    src={getStorageUrl(qr.image_url) || qr.image_url} 
                                    alt="QR Code" 
                                    className="w-full h-full object-contain rounded-lg hover:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <QrCode className="w-16 h-16 text-muted-foreground" />
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="space-y-2 mb-4">
                                <h3 className="font-semibold text-sm truncate" title={qr.product_name || qr.product?.name || 'Unknown Product'}>
                                  {qr.product_name || qr.product?.name || 'Unknown Product'}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate" title={qr.url_slug}>
                                  {qr.url_slug}
                                </p>
                              </div>

                              {/* Stats */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <BarChart3 className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {qr.scan_count || 0} scans
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {new Date(qr.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                {qr.last_scanned_at && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Eye className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Last: {new Date(qr.last_scanned_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                               <div className="flex gap-2">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleCopyContent(qr.url_slug)}
                                   title="Copy URL"
                                   className="text-xs flex-1"
                                 >
                                   <Copy className="w-3 h-3 mr-1" />
                                   Copy
                                 </Button>
                                 {qr.is_premium && (
                                   <Button
                                     variant="outline"
                                     size="sm"
                                     onClick={() => handleShareQR(qr)}
                                     title="Share QR Code"
                                     className="text-xs flex-1"
                                   >
                                     <Share2 className="w-3 h-3 mr-1" />
                                     Share
                                   </Button>
                                 )}
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => handleDeleteQR(qr.id)}
                                   title="Delete QR Code"
                                   className="text-xs text-destructive hover:text-destructive"
                                 >
                                   <Trash2 className="w-3 h-3" />
                                 </Button>
                               </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    );
                  }
                  
                  return searchTerm ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No QR codes match your search criteria</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Try adjusting your search terms or filters
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No QR codes generated yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Generate your first QR code using the generator above
                      </p>
                    </div>
                  );                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {!membershipInfo.has_analytics ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Crown className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Premium Analytics</h3>
                  <p className="text-muted-foreground mb-6">
                    Unlock detailed QR code analytics with scan tracking, performance insights, and trend analysis.
                  </p>
                  <Button variant="gradient" asChild>
                    <RouterLink to="/billing">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Pro
                    </RouterLink>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>

                {/* Scan Trends Chart */}
                {analytics?.scan_trends && analytics.scan_trends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Scan Trends (Last 30 Days)
                      </CardTitle>
                      <CardDescription>
                        Daily scan activity for your QR codes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-end justify-between gap-2">
                        {analytics.scan_trends.map((trend: any, index: number) => {
                          const maxScans = Math.max(...analytics.scan_trends.map((t: any) => t.scans))
                          const height = maxScans > 0 ? (trend.scans / maxScans) * 100 : 0
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                              <div 
                                className="w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-t"
                                style={{ height: `${Math.max(height, 2)}%` }}
                                title={`${trend.date}: ${trend.scans} scans`}
                              />
                              <span className="text-xs text-muted-foreground mt-2 rotate-45 origin-left">
                                {new Date(trend.date).getDate()}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Top Performing QR Codes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Top Performing QR Codes
                    </CardTitle>
                    <CardDescription>
                      Your most scanned QR codes with detailed performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.top_qr_codes && analytics.top_qr_codes.length > 0 ? (
                      <div className="space-y-4">
                        {analytics.top_qr_codes.map((qr: any, index: number) => {
                          const maxScans = Math.max(...analytics.top_qr_codes.map((q: any) => q.scan_count))
                          const percentage = maxScans > 0 ? (qr.scan_count / maxScans) * 100 : 0
                          
                          return (
                            <div key={qr.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-sm font-bold text-primary">#{index + 1}</span>
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{qr.product?.name || 'Unknown Product'}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      Created {new Date(qr.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {qr.is_premium && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Crown className="w-3 h-3 mr-1" />
                                      Premium
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold">{qr.scan_count}</div>
                                  <p className="text-xs text-muted-foreground">scans</p>
                                </div>
                              </div>
                              
                              {/* Performance Bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Performance</span>
                                  <span className="font-medium">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div 
                                    className="bg-primary rounded-full h-2 transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Additional Metrics */}
                              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border">
                                <div className="text-center">
                                  <div className="text-sm font-medium">{qr.scan_count || 0}</div>
                                  <div className="text-xs text-muted-foreground">Total Scans</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-medium">
                                    {qr.last_scanned_at ? new Date(qr.last_scanned_at).toLocaleDateString() : 'Never'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Last Scan</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm font-medium">
                                    {Math.round((Date.now() - new Date(qr.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                                  </div>
                                  <div className="text-xs text-muted-foreground">Age</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No scan data available yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Analytics will appear once your QR codes start getting scanned
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                {analytics?.recent_scans && analytics.recent_scans.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Recent Scan Activity
                      </CardTitle>
                      <CardDescription>
                        Latest scans across all your QR codes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.recent_scans.slice(0, 10).map((scan: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <div>
                                <p className="font-medium">{scan.product_name || 'Unknown Product'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {scan.device_type || 'Unknown Device'} • {scan.location || 'Unknown Location'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {new Date(scan.scanned_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(scan.scanned_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}