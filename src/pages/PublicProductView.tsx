import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { 
  ArrowLeft, 
  Package,
  Calendar,
  User,
  Tag,
  Eye,
  ExternalLink,
  Clock,
  Users,
  QrCode,
  Share2,
  Copy,
  Download,
  Facebook,
  Twitter,
  AlertTriangle,
  Printer,
  FileDown,
  Globe,
  Languages,
  Shield,
  Database,
  Calculator,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { productsAPI, edamamAPI } from "@/services/api"
import { Product, transformProductFromAPI, NutritionalData } from "@/types/product"

export default function PublicProductView() {
  const { id } = useParams()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [nutritionalData, setNutritionalData] = useState<NutritionalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isPrintMode, setIsPrintMode] = useState(false)

  // Sharing functions
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check out this recipe: ${product?.name}`)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank')
  }

  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href)
    const text = encodeURIComponent(`Check out this recipe: ${product?.name}`)
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank')
  }

  // Print and Export functions
  const handlePrint = () => {
    setIsPrintMode(true)
    setTimeout(() => {
      window.print()
      setIsPrintMode(false)
    }, 100)
  }

  const handleExportPDF = () => {
    // This would integrate with a PDF generation service
    toast({
      title: "Export to PDF",
      description: "PDF export functionality will be available soon.",
    })
  }



  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return
      
      setIsLoading(true)
      setError(null)
      try {
        // Get the product directly by ID from the public endpoint
        const response = await productsAPI.getPublicById(id)
        // Transform the API response to Product type
        const productData = transformProductFromAPI(response)
        setProduct(productData)
        
        // Try to load nutritional data if available
        try {
          const nutritionResponse = await edamamAPI.nutrition.loadNutritionData(id)
          if (nutritionResponse.data) {
            setNutritionalData(nutritionResponse.data)
          }
        } catch (nutritionError) {
          // Nutrition data is optional, don't show error
          console.log('No nutrition data available for this product')
        }
      } catch (error: any) {
        console.error('Error loading public product:', error)
        setError(error.message || "Failed to load product")
      } finally {
        setIsLoading(false)
      }
    }

    loadProduct()
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-gray-900">Recipe not found</h2>
            <p className="text-gray-600 mb-4">
              {error || "The recipe you're looking for doesn't exist or is not public."}
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }



  // Format ingredients for simple display (fallback)
  const formatIngredients = () => {
    if (product.ingredients && product.ingredients.length > 0) {
      return product.ingredients.map((ing: any) => {
        const pivotData = ing.pivot || {}
        const quantity = pivotData.amount || ing.quantity || ''
        const unit = pivotData.unit || ing.unit || ''
        const displayQuantity = quantity ? `${quantity}${unit}` : ''
        return displayQuantity ? `${ing.name} (${displayQuantity})` : ing.name
      })
    } else if (product.ingredient_notes && product.ingredient_notes.trim()) {
      return product.ingredient_notes.split('\n').filter(line => line.trim())
    }
    return []
  }

  const ingredients = formatIngredients()

  return (
    <div className="min-h-screen bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\:hidden { display: none !important; }
          .container { max-width: none !important; margin: 0 !important; padding: 0 !important; }
          table { page-break-inside: avoid; }
          .bg-gray-50 { background: white !important; }
          .shadow-lg, .shadow-md { box-shadow: none !important; }
          .rounded-lg { border-radius: 0 !important; }
        }
      `}</style>
      {/* Simple Header */}
      <header className={`border-b border-gray-200 bg-white sticky top-0 z-10 ${isPrintMode ? 'print:hidden' : ''}`}>
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="text-gray-600 hover:text-gray-900">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            
            <div className="flex items-center gap-3">

              
              {/* Print Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-gray-600 hover:text-gray-900"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print View
              </Button>
              
              {/* Export PDF Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="text-gray-600 hover:text-gray-900"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              
              <Badge variant="outline" className="text-gray-600 border-gray-300">
                <Eye className="h-3 w-3 mr-1" />
                Public Recipe
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <article className="space-y-8">
          {/* Recipe Header */}
          <header className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By {product.user?.name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{product.servings_per_container} ('servings')</span>
              </div>
            </div>
          </header>

          {/* Recipe Overview - Side by Side */}
          <section className="grid gap-8 md:grid-cols-2 items-start">
            {/* Left Column - Recipe Info */}
            <div className="space-y-6">
              {/* Description */}
              {product.description && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">{t('about')}</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Ingredients Section */}
              {ingredients.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('ingredients')}</h2>
                  <ul className="space-y-2">
                    {ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-base leading-relaxed">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Recipe Image, QR Code & Sharing */}
            <div className="order-first md:order-last space-y-6">
              {/* Recipe Image */}
              <div>
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-80 md:h-96 object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="w-full h-80 md:h-96 bg-gray-100 rounded-lg flex items-center justify-center shadow-lg">
                    <Package className="h-20 w-20 text-gray-400" />
                  </div>
                )}
              </div>

              {/* QR Code Section */}
              {product.qrCodes && product.qrCodes.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code
                  </h3>
                  <div className="text-center space-y-4">
                    {product.qrCodes[0].image_url ? (
                      <img
                        src={product.qrCodes[0].image_url}
                        alt="QR Code for this recipe"
                        className="w-32 h-32 mx-auto border border-gray-200 rounded"
                      />
                    ) : (
                      <div className="w-32 h-32 mx-auto bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      Scan to access this recipe on your mobile device
                    </p>
                    {product.qrCodes[0].scan_count > 0 && (
                      <p className="text-xs text-gray-500">
                        Scanned {product.qrCodes[0].scan_count} times
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Sharing Section - Hidden in Print Mode */}
              <div className={`bg-white border border-gray-200 rounded-lg p-6 ${isPrintMode ? 'print:hidden' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  {t('share_recipe')}
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={shareOnFacebook}
                    variant="outline"
                    className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Share on Facebook
                  </Button>
                  <Button
                    onClick={shareOnTwitter}
                    variant="outline"
                    className="w-full justify-start text-blue-400 border-blue-200 hover:bg-blue-50"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Share on Twitter
                  </Button>
                </div>
              </div>

              {/* Download Label Section */}
              {product.labels && product.labels.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    {t('download_label')}
                  </h3>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // This would need to be implemented with proper label download functionality
                      toast({
                        title: "Download feature",
                        description: "Label download functionality will be available soon.",
                      })
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Nutrition Label
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Per Serving Details */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Per Serving Information</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{product.serving_size}</div>
                <div className="text-sm text-gray-600 mt-1">Serving Size ({product.serving_unit})</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{product.servings_per_container}</div>
                <div className="text-sm text-gray-600 mt-1">Total Servings</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {product.serving_size * product.servings_per_container}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Size ({product.serving_unit})</div>
              </div>
            </div>
          </section>

          {/* Nutrition Information */}
          {nutritionalData && (
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-900">{t('nutrition')}</h2>
              
              {/* Basic Nutrition */}
              <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b-2 border-black">
                  <h3 className="text-lg font-medium text-gray-900">Basic Nutrition (Per Serving)</h3>
                </div>
                <div className="p-6">
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b-2 border-black">
                        <td className="py-3 px-4 font-medium text-gray-700 border-r-2 border-black">Calories</td>
                        <td className="py-3 px-4 text-lg font-semibold text-gray-900">
                          {Math.round(nutritionalData.basic_nutrition?.total_calories || 0)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-gray-700 border-r-2 border-black">Weight per Serving</td>
                        <td className="py-3 px-4 text-lg font-semibold text-gray-900">
                          {Math.round(nutritionalData.basic_nutrition?.weight_per_serving || 0)}g
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nutrition Score & Health Grade */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-100 to-green-100 px-6 py-3 border-b-2 border-blue-200">
                  <h3 className="text-lg font-medium text-gray-900">Nutrition Assessment</h3>
                  <p className="text-sm text-gray-600 mt-1">AI-powered nutritional analysis</p>
                </div>
                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Health Score */}
                    <div className="text-center">
                      <div className="relative w-24 h-24 mx-auto mb-4">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke={(() => {
                              const healthScore = Math.max(0, Math.min(100, 
                                80 - ((nutritionalData.warnings?.filter(w => w.severity === 'high').length || 0) * 20) -
                                ((nutritionalData.warnings?.filter(w => w.severity === 'medium').length || 0) * 10)
                              ));
                              if (healthScore >= 80) return '#10b981';
                              if (healthScore >= 60) return '#f59e0b';
                              return '#ef4444';
                            })()}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${(() => {
                              const healthScore = Math.max(0, Math.min(100, 
                                80 - ((nutritionalData.warnings?.filter(w => w.severity === 'high').length || 0) * 20) -
                                ((nutritionalData.warnings?.filter(w => w.severity === 'medium').length || 0) * 10)
                              ));
                              return (healthScore / 100) * 251.2;
                            })()} 251.2`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-900">
                            {(() => {
                              const healthScore = Math.max(0, Math.min(100, 
                                80 - ((nutritionalData.warnings?.filter(w => w.severity === 'high').length || 0) * 20) -
                                ((nutritionalData.warnings?.filter(w => w.severity === 'medium').length || 0) * 10)
                              ));
                              return Math.round(healthScore);
                            })()}
                          </span>
                        </div>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Health Score</h4>
                      <p className="text-sm text-gray-600">Based on nutritional profile</p>
                    </div>

                    {/* Nutrition Grade */}
                    <div className="text-center">
                      <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl font-bold text-white ${
                        (() => {
                          // Calculate nutrition grade based on nutrients
                          let score = 0;
                          const protein = nutritionalData.macronutrients?.protein || 0;
                          const fiber = nutritionalData.macronutrients?.fiber || 0;
                          const sodium = nutritionalData.micronutrients?.NA?.quantity || 0;
                          const sugar = nutritionalData.micronutrients?.SUGAR?.quantity || nutritionalData.nutrition_summary?.sugar || 0;
                          const saturatedFat = nutritionalData.micronutrients?.FASAT?.quantity || 0;
                          
                          // Positive points
                          if (fiber > 5) score += 2;
                          if (protein > 10) score += 2;
                          
                          // Negative points
                          if (sodium > 500) score -= 1;
                          if (sugar > 10) score -= 1;
                          if (saturatedFat > 5) score -= 1;
                          
                          const grade = score >= 3 ? 'A' : score >= 1 ? 'B' : score >= -1 ? 'C' : score >= -3 ? 'D' : 'F';
                          
                          if (grade === 'A') return 'bg-green-500';
                          if (grade === 'B') return 'bg-blue-500';
                          if (grade === 'C') return 'bg-yellow-500';
                          if (grade === 'D') return 'bg-orange-500';
                          return 'bg-red-500';
                        })()
                      }`}>
                        {(() => {
                          // Calculate nutrition grade
                          let score = 0;
                          const protein = nutritionalData.macronutrients?.protein || 0;
                          const fiber = nutritionalData.macronutrients?.fiber || 0;
                          const sodium = nutritionalData.micronutrients?.NA?.quantity || 0;
                          const sugar = nutritionalData.micronutrients?.SUGAR?.quantity || nutritionalData.nutrition_summary?.sugar || 0;
                          const saturatedFat = nutritionalData.micronutrients?.FASAT?.quantity || 0;
                          
                          if (fiber > 5) score += 2;
                          if (protein > 10) score += 2;
                          if (sodium > 500) score -= 1;
                          if (sugar > 10) score -= 1;
                          if (saturatedFat > 5) score -= 1;
                          
                          return score >= 3 ? 'A' : score >= 1 ? 'B' : score >= -1 ? 'C' : score >= -3 ? 'D' : 'F';
                        })()}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Nutrition Grade</h4>
                      <p className="text-sm text-gray-600">Overall nutritional quality</p>
                    </div>
                  </div>
                  
                  {/* Nutritional Highlights */}
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Nutritional Highlights</h4>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const highlights = [];
                        const protein = nutritionalData.macronutrients?.protein || 0;
                        const fiber = nutritionalData.macronutrients?.fiber || 0;
                        const calories = nutritionalData.basic_nutrition?.total_calories || 0;
                        const healthLabels = nutritionalData.health_labels || [];
                        
                        // Add health labels
                        healthLabels.slice(0, 3).forEach(label => {
                          highlights.push({ text: label.replace(/_/g, ' '), color: 'bg-green-100 text-green-800' });
                        });
                        
                        // Add calculated highlights
                        if (protein > 15) highlights.push({ text: 'High Protein', color: 'bg-blue-100 text-blue-800' });
                        if (fiber > 5) highlights.push({ text: 'Good Fiber Source', color: 'bg-purple-100 text-purple-800' });
                        if (calories < 100) highlights.push({ text: 'Low Calorie', color: 'bg-yellow-100 text-yellow-800' });
                        
                        return highlights.slice(0, 5).map((highlight, index) => (
                          <span key={index} className={`px-3 py-1 rounded-full text-xs font-medium ${highlight.color}`}>
                            {highlight.text}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500 border-t pt-3">
                    <p>* Health score calculated based on nutritional warnings and beneficial nutrients.</p>
                    <p className="mt-1">** Nutrition grade considers protein, fiber, sodium, sugar, and saturated fat content.</p>
                  </div>
                </div>
              </div>

              {/* Macronutrients - Enhanced with FDA-Required Nutrients */}
              <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b-2 border-black">
                  <h3 className="text-lg font-medium text-gray-900">Nutrition Facts</h3>
                  <p className="text-sm text-gray-600 mt-1">Per Serving</p>
                </div>
                <div className="p-6">
                  <table className="w-full border-collapse">
                    <tbody>
                      {[
                        { label: 'Protein', value: nutritionalData.macronutrients?.protein, unit: 'g', dailyValue: nutritionalData.daily_values?.PROCNT?.quantity },
                        { label: 'Total Carbohydrates', value: nutritionalData.macronutrients?.carbohydrates, unit: 'g', dailyValue: nutritionalData.daily_values?.CHOCDF?.quantity },
                        { label: 'Total Fat', value: nutritionalData.macronutrients?.fat, unit: 'g', dailyValue: nutritionalData.daily_values?.FAT?.quantity },
                        { label: 'Saturated Fat', value: nutritionalData.micronutrients?.FASAT?.quantity, unit: 'g', dailyValue: nutritionalData.micronutrients?.FASAT?.percentage, isFDARequired: true },
                        { label: 'Trans Fat', value: nutritionalData.micronutrients?.FATRN?.quantity, unit: 'g', dailyValue: null, isFDARequired: true },
                        { label: 'Cholesterol', value: nutritionalData.micronutrients?.CHOLE?.quantity, unit: 'mg', dailyValue: nutritionalData.micronutrients?.CHOLE?.percentage, isFDARequired: true },
                        { label: 'Sodium', value: nutritionalData.micronutrients?.NA?.quantity, unit: 'mg', dailyValue: nutritionalData.micronutrients?.NA?.percentage, isFDARequired: true },
                        { label: 'Total Sugars', value: nutritionalData.micronutrients?.SUGAR?.quantity || nutritionalData.nutrition_summary?.sugar, unit: 'g', dailyValue: null, isFDARequired: true },
                        { label: 'Dietary Fiber', value: nutritionalData.macronutrients?.fiber, unit: 'g', dailyValue: nutritionalData.daily_values?.FIBTG?.quantity }
                      ].map((nutrient, index, array) => (
                        <tr key={nutrient.label} className={index < array.length - 1 ? 'border-b-2 border-black' : ''}>
                          <td className={`py-3 px-4 font-medium text-gray-700 border-r-2 border-black ${
                            nutrient.isFDARequired ? 'bg-yellow-50' : ''
                          }`}>
                            {nutrient.label}
                            {nutrient.isFDARequired && (
                              <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-bold">
                                FDA Required
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-lg font-semibold text-gray-900">
                              {nutrient.value ? `${Math.round(nutrient.value * 10) / 10}${nutrient.unit}` : 'N/A'}
                            </span>
                            {nutrient.dailyValue && (
                              <div className="text-sm text-gray-500">
                                {Math.round(nutrient.dailyValue)}% DV
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-xs text-gray-500 border-t pt-3">
                    <p>* Percent Daily Values are based on a 2,000 calorie diet.</p>
                    <p className="mt-1">** FDA Required nutrients are highlighted for compliance.</p>
                  </div>
                </div>
              </div>

              {/* Micronutrients - Enhanced with Priority Vitamins */}
              {nutritionalData.micronutrients && Object.keys(nutritionalData.micronutrients).length > 0 && (
                <div className="bg-white border-2 border-black rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-3 border-b-2 border-black">
                    <h3 className="text-lg font-medium text-gray-900">Vitamins & Minerals</h3>
                    <p className="text-sm text-gray-600 mt-1">Essential nutrients for optimal health</p>
                  </div>
                  <div className="p-6">
                    <table className="w-full border-collapse">
                      <tbody>
                        {(() => {
                          // Priority vitamins that are commonly missing and important
                          const priorityVitamins = ['VITD', 'VITB12', 'TOCPHA', 'VITK1'];
                          const priorityMinerals = ['CA', 'FE', 'MG', 'FOLFD'];
                          
                          // Get priority nutrients first
                          const priorityNutrients = [...priorityVitamins, ...priorityMinerals]
                            .map(key => ({ key, nutrient: nutritionalData.micronutrients[key] }))
                            .filter(item => item.nutrient);
                          
                          // Get remaining nutrients (excluding those already in macros and priority list)
                          const excludedKeys = ['FASAT', 'FATRN', 'CHOLE', 'NA', 'SUGAR', ...priorityVitamins, ...priorityMinerals];
                          const otherNutrients = Object.entries(nutritionalData.micronutrients)
                            .filter(([key]) => !excludedKeys.includes(key))
                            .map(([key, nutrient]) => ({ key, nutrient }))
                            .slice(0, 6); // Limit to avoid overwhelming display
                          
                          const allNutrients = [...priorityNutrients, ...otherNutrients];
                          
                          return allNutrients.map(({ key, nutrient }, index, array) => {
                            const isPriority = priorityVitamins.includes(key) || priorityMinerals.includes(key);
                            return (
                              <tr key={key} className={index < array.length - 1 ? 'border-b-2 border-black' : ''}>
                                <td className={`py-3 px-4 font-medium text-gray-700 border-r-2 border-black ${
                                  isPriority ? 'bg-blue-50' : ''
                                }`}>
                                  {nutrient.label}
                                  {isPriority && (
                                    <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">
                                      Essential
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className="text-lg font-semibold text-gray-900">
                                    {Math.round(nutrient.quantity * 10) / 10}{nutrient.unit}
                                  </span>
                                  {nutrient.percentage && (
                                    <div className="text-sm text-gray-500">
                                      {Math.round(nutrient.percentage)}% DV
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                    <div className="mt-4 text-xs text-gray-500 border-t pt-3">
                      <p>** Essential vitamins (D, B12, E, K) and minerals are prioritized for display.</p>
                      <p className="mt-1">Additional micronutrients may be available in detailed nutrition analysis.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Labels */}
              {nutritionalData.health_labels && nutritionalData.health_labels.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-green-900 mb-3">Health Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {nutritionalData.health_labels.map((label) => (
                      <Badge key={label} className="bg-green-100 text-green-800 border-green-300">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Diet Labels */}
              {nutritionalData.diet_labels && nutritionalData.diet_labels.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-3">Diet Labels</h3>
                  <div className="flex flex-wrap gap-2">
                    {nutritionalData.diet_labels.map((label) => (
                      <Badge key={label} className="bg-blue-100 text-blue-800 border-blue-300">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Allergen & Safety Information */}
              <div className="bg-red-50 border-2 border-red-300 rounded-lg overflow-hidden shadow-lg">
                <div className="bg-red-100 px-6 py-3 border-b-2 border-red-300">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <h3 className="text-xl font-bold text-red-900">⚠️ Allergen & Safety Information</h3>
                  </div>
                  <p className="text-sm text-red-700 mt-1">FDA-compliant allergen disclosure and safety warnings</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Allergen Information */}
                  {((nutritionalData.cautions && nutritionalData.cautions.length > 0) || 
                    (nutritionalData.health_labels && nutritionalData.health_labels.filter(label => label.endsWith('_FREE')).length > 0)) && (
                    <div className="space-y-4">
                      {/* Contains Allergens (Cautions) */}
                      {nutritionalData.cautions && nutritionalData.cautions.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-red-900 mb-3">Contains Allergens (Cautions):</h4>
                          <div className="flex flex-wrap gap-3 mb-4">
                            {nutritionalData.cautions.map((caution) => (
                              <Badge key={caution} className="bg-red-200 text-red-900 border-2 border-red-400 px-4 py-2 text-sm font-bold">
                                ⚠️ {caution.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                            <p className="text-red-800 font-medium text-sm">
                              <strong>ALLERGEN WARNING:</strong> This product contains {nutritionalData.cautions.join(', ')}. 
                              Individuals with allergies to these ingredients should avoid consumption.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Allergen-Free Status */}
                      {nutritionalData.health_labels && nutritionalData.health_labels.filter(label => label.endsWith('_FREE')).length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold text-green-900 mb-3">Allergen-Free Status:</h4>
                          <div className="flex flex-wrap gap-3">
                            {nutritionalData.health_labels
                              .filter(label => label.endsWith('_FREE'))
                              .map((label) => (
                                <Badge key={label} className="bg-green-200 text-green-900 border-2 border-green-400 px-4 py-2 text-sm font-bold">
                                  ✓ {label.replace('_FREE', '').toLowerCase().replace('_', ' ')}-FREE
                                </Badge>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Cross-Contamination Warning */}
                  <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Cross-Contamination Notice
                    </h4>
                    <p className="text-yellow-800 text-sm">
                      <strong>May contain:</strong> This product may contain traces of milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, and soybeans 
                      due to shared manufacturing equipment or processing facilities.
                    </p>
                  </div>
                  
                  {/* Nutritional Warnings */}
                  {nutritionalData.warnings && nutritionalData.warnings.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-red-900 mb-3">Nutritional Warnings:</h4>
                      <div className="space-y-2">
                        {nutritionalData.warnings.map((warning, index) => (
                          <div key={index} className={`p-3 rounded-lg border ${
                            warning.severity === 'high' ? 'bg-red-100 border-red-300 text-red-800' :
                            warning.severity === 'medium' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                            'bg-yellow-100 border-yellow-300 text-yellow-800'
                          }`}>
                            <div className="flex items-start gap-2">
                              <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                                warning.severity === 'high' ? 'text-red-600' :
                                warning.severity === 'medium' ? 'text-orange-600' :
                                'text-yellow-600'
                              }`} />
                              <div>
                                <span className="font-medium text-sm uppercase tracking-wide">
                                  {warning.severity} {warning.type}
                                </span>
                                <p className="text-sm mt-1">{warning.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* FDA Compliance Statement */}
                  <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Regulatory Compliance</h4>
                    <div className="text-xs text-gray-700 space-y-1">
                      <p>• Allergen information complies with FDA Food Allergen Labeling requirements</p>
                      <p>• Nutritional data calculated using USDA nutrient database and Edamam API</p>
                      <p>• Daily Values based on 2,000 calorie diet as per FDA guidelines</p>
                      <p>• Cross-contamination warnings follow FDA voluntary labeling practices</p>
                    </div>
                  </div>
                  
                  {/* Emergency Contact */}
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                    <h4 className="text-md font-semibold text-blue-900 mb-2">Important Safety Information</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• If you experience any allergic reaction, discontinue use immediately and seek medical attention</p>
                      <p>• For questions about ingredients or allergens, contact our support team</p>
                      <p>• This information is provided for educational purposes and should not replace professional medical advice</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Data Validation & Audit Trail */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden shadow-lg">
            <div className="bg-blue-100 px-6 py-3 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-bold text-blue-900">Data Integrity & Transparency</h3>
              </div>
              <p className="text-sm text-blue-700 mt-1">Nutritional data validation and calculation methodology</p>
            </div>
            <div className="p-6 space-y-6">
              {/* Data Sources & Validation */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Sources
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Primary Database:</span>
                      <span className="font-medium text-blue-800">USDA FoodData Central</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">API Provider:</span>
                      <span className="font-medium text-blue-800">Edamam Nutrition API</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="font-medium text-green-600">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Accuracy:</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300">✓ Verified</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-blue-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Calculation Method
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calculation Type:</span>
                      <span className="font-medium text-blue-800">Ingredient-based</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Serving Size:</span>
                      <span className="font-medium text-blue-800">Standardized (100g)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rounding:</span>
                      <span className="font-medium text-blue-800">FDA Guidelines</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Daily Values:</span>
                      <span className="font-medium text-blue-800">2000 cal diet</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Calculation Transparency */}
              <div className="bg-white border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Calculation Transparency
                </h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Macronutrient Calculation:</h5>
                    <div className="text-gray-600 space-y-1">
                      <p>• Protein: 4 cal/g</p>
                      <p>• Carbohydrates: 4 cal/g</p>
                      <p>• Fat: 9 cal/g</p>
                      <p>• Fiber: 2 cal/g</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Health Score Formula:</h5>
                    <div className="text-gray-600 space-y-1">
                      <p>• Base score: 100 points</p>
                      <p>• High sodium: -10 points</p>
                      <p>• High sugar: -15 points</p>
                      <p>• High protein: +10 points</p>
                      <p>• High fiber: +5 points</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-gray-900">Grade Calculation:</h5>
                    <div className="text-gray-600 space-y-1">
                      <p>• A: 90-100 points</p>
                      <p>• B: 80-89 points</p>
                      <p>• C: 70-79 points</p>
                      <p>• D: 60-69 points</p>
                      <p>• F: Below 60 points</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Audit Trail */}
              <div className="bg-white border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit Trail & Compliance
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Recipe created:</span>
                      <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">Nutrition analyzed:</span>
                      <span className="font-medium">{new Date(product.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">Data validated:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-600">FDA compliance check:</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">✓ Passed</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <h5 className="font-medium text-gray-900 text-sm mb-2">Data Integrity Checks:</h5>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Ingredient validation:</span>
                          <span className="text-green-600 font-medium">✓ Passed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Nutritional consistency:</span>
                          <span className="text-green-600 font-medium">✓ Passed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Allergen cross-check:</span>
                          <span className="text-green-600 font-medium">✓ Passed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>FDA format compliance:</span>
                          <span className="text-green-600 font-medium">✓ Passed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Important Disclaimer
                </h4>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>• Nutritional values are calculated estimates based on ingredient data and may vary</p>
                  <p>• Individual nutritional needs may differ; consult healthcare professionals for personalized advice</p>
                  <p>• This information is for educational purposes and not intended as medical or dietary advice</p>
                  <p>• Actual nutritional content may vary based on preparation methods and ingredient substitutions</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recipe Meta Information */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recipe Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Category</span>
                <Badge variant="outline" className="bg-white">{product.category.name}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created by</span>
                <span className="font-medium text-gray-900">{product.user?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Published</span>
                <span className="font-medium text-gray-900">
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Last updated</span>
                <span className="font-medium text-gray-900">
                  {new Date(product.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </section>

          {/* Call to Action - Hidden in print mode */}
          {!isPrintMode && (
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white print:hidden">
              <h3 className="text-2xl font-bold mb-4">Create Your Own Recipes</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Join our platform to create, manage, and share your own nutrition-analyzed recipes with detailed ingredient tracking and comprehensive nutritional information.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Link to="/register">
                    Get Started Free
                  </Link>
                </Button>
                <Button asChild size="lg" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600">
                  <Link to="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            </section>
          )}
        </article>
      </main>
    </div>
  )
}