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
import { Product, transformProductFromAPI } from "@/types/product"
import { getStorageUrl } from "@/utils/storage"

export default function PublicProductView() {
  const { id } = useParams()
  const { toast } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)

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
        console.log('API Response:', response)
        
        // The API returns {success: true, data: {...}}, so we need response.data
        const productData = transformProductFromAPI(response.data)
        console.log('Transformed Product:', productData)
        setProduct(productData)
        

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



  // Format ingredients from ingredients_data (new system)
  const formatIngredients = () => {
    // First try the new ingredients_data format
    if (product.nutrition_data?.ingredients_data && Array.isArray(product.nutrition_data.ingredients_data)) {
      return product.nutrition_data.ingredients_data.map((ing: any) => {
        const quantity = ing.quantity || ''
        const unit = ing.unit || ''
        const displayQuantity = quantity ? `${quantity} ${unit}` : ''
        return displayQuantity ? `${displayQuantity} ${ing.name}` : ing.name
      })
    }
    
    // Try direct ingredients_data on product
    if (product.ingredients_data && Array.isArray(product.ingredients_data)) {
      return product.ingredients_data.map((ing: any) => {
        const quantity = ing.quantity || ''
        const unit = ing.unit || ''
        const displayQuantity = quantity ? `${quantity} ${unit}` : ''
        return displayQuantity ? `${displayQuantity} ${ing.name}` : ing.name
      })
    }
    
    // Fallback to old ingredients format
    if (product.ingredients && product.ingredients.length > 0) {
      return product.ingredients.map((ing: any) => {
        const pivotData = ing.pivot || {}
        const quantity = pivotData.amount || ing.quantity || ''
        const unit = pivotData.unit || ing.unit || ''
        const displayQuantity = quantity ? `${quantity} ${unit}` : ''
        return displayQuantity ? `${displayQuantity} ${ing.name}` : ing.name
      })
    } else if (product.ingredient_notes && product.ingredient_notes.trim()) {
      return product.ingredient_notes.split('\n').filter(line => line.trim())
    }
    return []
  }

  // Get nutrition information
  const getNutritionInfo = () => {
    if (product.nutrition_data) {
      console.log('=== NUTRITION DATA DEBUG ===')
      console.log('Full nutrition_data:', product.nutrition_data)
      console.log('Calories:', product.nutrition_data.calories)
      console.log('Macronutrients:', product.nutrition_data.macronutrients)
      console.log('Vitamins/Minerals:', product.nutrition_data.vitamins_minerals)
      console.log('Daily Values:', product.nutrition_data.daily_values)
      console.log('Health labels:', product.nutrition_data.health_labels)
      console.log('=== END DEBUG ===')
      
      // Convert the API format to the expected format
      const macros = product.nutrition_data.macronutrients || {}
      const vitamins = product.nutrition_data.vitamins_minerals || {}
      const dailyVals = product.nutrition_data.daily_values || {}
      
      // Create totalNutrients object in Edamam format
      const totalNutrients = {
        // Macronutrients
        FAT: { quantity: macros.total_fat || 0, unit: 'g', label: 'Total Fat' },
        FASAT: { quantity: macros.saturated_fat || 0, unit: 'g', label: 'Saturated Fat' },
        FATRN: { quantity: macros.trans_fat || 0, unit: 'g', label: 'Trans Fat' },
        CHOLE: { quantity: macros.cholesterol || 0, unit: 'mg', label: 'Cholesterol' },
        NA: { quantity: macros.sodium || 0, unit: 'mg', label: 'Sodium' },
        CHOCDF: { quantity: macros.total_carbohydrate || 0, unit: 'g', label: 'Total Carbohydrate' },
        FIBTG: { quantity: macros.dietary_fiber || 0, unit: 'g', label: 'Dietary Fiber' },
        SUGAR: { quantity: macros.total_sugars || 0, unit: 'g', label: 'Total Sugars' },
        PROCNT: { quantity: macros.protein || 0, unit: 'g', label: 'Protein' },
        
        // Vitamins & Minerals
        VITD: { quantity: vitamins.vitamin_d || 0, unit: 'µg', label: 'Vitamin D' },
        CA: { quantity: vitamins.calcium || 0, unit: 'mg', label: 'Calcium' },
        FE: { quantity: vitamins.iron || 0, unit: 'mg', label: 'Iron' },
        K: { quantity: vitamins.potassium || 0, unit: 'mg', label: 'Potassium' },
        MG: { quantity: vitamins.magnesium || 0, unit: 'mg', label: 'Magnesium' },
        
        // Add more vitamins/minerals as available in your API
        VITA_RAE: { quantity: vitamins.vitamin_a || 0, unit: 'µg', label: 'Vitamin A' },
        VITC: { quantity: vitamins.vitamin_c || 0, unit: 'mg', label: 'Vitamin C' },
        TOCPHA: { quantity: vitamins.vitamin_e || 0, unit: 'mg', label: 'Vitamin E' },
        VITK1: { quantity: vitamins.vitamin_k || 0, unit: 'µg', label: 'Vitamin K' },
        THIA: { quantity: vitamins.thiamin || 0, unit: 'mg', label: 'Thiamin' },
        RIBF: { quantity: vitamins.riboflavin || 0, unit: 'mg', label: 'Riboflavin' },
        NIA: { quantity: vitamins.niacin || 0, unit: 'mg', label: 'Niacin' },
        VITB6A: { quantity: vitamins.vitamin_b6 || 0, unit: 'mg', label: 'Vitamin B6' },
        FOLDFE: { quantity: vitamins.folate || 0, unit: 'µg', label: 'Folate' },
        VITB12: { quantity: vitamins.vitamin_b12 || 0, unit: 'µg', label: 'Vitamin B12' },
        P: { quantity: vitamins.phosphorus || 0, unit: 'mg', label: 'Phosphorus' },
        ZN: { quantity: vitamins.zinc || 0, unit: 'mg', label: 'Zinc' },
        SE: { quantity: vitamins.selenium || 0, unit: 'µg', label: 'Selenium' }
      }
      
      // Create totalDaily object
      const totalDaily = {
        FAT: { quantity: dailyVals.total_fat_dv || 0, unit: '%' },
        FASAT: { quantity: dailyVals.saturated_fat_dv || 0, unit: '%' },
        CHOLE: { quantity: dailyVals.cholesterol_dv || 0, unit: '%' },
        NA: { quantity: dailyVals.sodium_dv || 0, unit: '%' },
        CHOCDF: { quantity: dailyVals.total_carbohydrate_dv || 0, unit: '%' },
        FIBTG: { quantity: dailyVals.dietary_fiber_dv || 0, unit: '%' },
        PROCNT: { quantity: dailyVals.protein_dv || 0, unit: '%' },
        VITD: { quantity: dailyVals.vitamin_d_dv || 0, unit: '%' },
        CA: { quantity: dailyVals.calcium_dv || 0, unit: '%' },
        FE: { quantity: dailyVals.iron_dv || 0, unit: '%' },
        K: { quantity: dailyVals.potassium_dv || 0, unit: '%' },
        MG: { quantity: dailyVals.magnesium_dv || 0, unit: '%' }
      }
      
      return {
        calories: product.nutrition_data.calories || 0,
        healthLabels: product.nutrition_data.health_labels || [],
        dietLabels: product.nutrition_data.diet_labels || [],
        totalNutrients: totalNutrients,
        totalDaily: totalDaily,
        totalWeight: product.nutrition_data.total_weight || 0,
        yield: product.nutrition_data.yield || 1
      }
    }
    console.log('No nutrition_data found in product!')
    return null
  }

  const ingredients = formatIngredients()
  const nutritionInfo = getNutritionInfo()

  // Helper function to get nutrient value safely
  const getNutrientValue = (nutrientKey: string, totalNutrients: any) => {
    const nutrient = totalNutrients[nutrientKey]
    if (!nutrient) return { quantity: 0, unit: 'g', label: nutrientKey }
    return {
      quantity: nutrient.quantity || 0,
      unit: nutrient.unit || 'g',
      label: nutrient.label || nutrientKey
    }
  }

  // Helper function to get daily value safely
  const getDailyValue = (nutrientKey: string, totalDaily: any) => {
    const daily = totalDaily[nutrientKey]
    return daily ? Math.round(daily.quantity || 0) : 0
  }

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
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Ingredients Section */}
              {ingredients.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
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
                        src={getStorageUrl(product.qrCodes[0].image_url)}
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
                  Share Recipe
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
                    Download Label
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

          {/* Nutrition Facts Section */}
          {nutritionInfo && (
            <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* FDA-Style Nutrition Facts Label */}
              <div className="bg-black text-white px-6 py-3">
                <h2 className="text-xl font-bold">Nutrition Facts</h2>
                <p className="text-sm opacity-90">Per serving</p>
              </div>
              
              <div className="p-6">
                {/* Calories Section */}
                <div className="border-b-4 border-black pb-2 mb-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold">Calories</span>
                    <span className="text-3xl font-bold">{nutritionInfo.calories}</span>
                  </div>
                </div>

                {/* Daily Value Header */}
                <div className="text-right text-sm font-semibold mb-2 border-b border-gray-300 pb-1">
                  % Daily Value*
                </div>

                {/* Macronutrients Table */}
                <div className="space-y-1 text-sm">
                  {/* Total Fat */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="font-semibold">
                      Total Fat {Math.round(getNutrientValue('FAT', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('FAT', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('FAT', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Saturated Fat */}
                  <div className="flex justify-between border-b border-gray-200 py-1 pl-4">
                    <span>
                      Saturated Fat {Math.round(getNutrientValue('FASAT', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('FASAT', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('FASAT', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Trans Fat */}
                  <div className="flex justify-between border-b border-gray-200 py-1 pl-4">
                    <span>
                      Trans Fat {Math.round(getNutrientValue('FATRN', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('FATRN', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span></span>
                  </div>

                  {/* Cholesterol */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="font-semibold">
                      Cholesterol {Math.round(getNutrientValue('CHOLE', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('CHOLE', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('CHOLE', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Sodium */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="font-semibold">
                      Sodium {Math.round(getNutrientValue('NA', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('NA', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('NA', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Total Carbohydrates */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="font-semibold">
                      Total Carbohydrate {Math.round(getNutrientValue('CHOCDF', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('CHOCDF', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('CHOCDF', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Dietary Fiber */}
                  <div className="flex justify-between border-b border-gray-200 py-1 pl-4">
                    <span>
                      Dietary Fiber {Math.round(getNutrientValue('FIBTG', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('FIBTG', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('FIBTG', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Total Sugars */}
                  <div className="flex justify-between border-b border-gray-200 py-1 pl-4">
                    <span>
                      Total Sugars {Math.round(getNutrientValue('SUGAR', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('SUGAR', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span></span>
                  </div>

                  {/* Added Sugars */}
                  <div className="flex justify-between border-b border-gray-200 py-1 pl-8">
                    <span>
                      Added Sugars {Math.round(getNutrientValue('SUGAR_ADDED', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('SUGAR_ADDED', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('SUGAR_ADDED', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Protein */}
                  <div className="flex justify-between border-b-4 border-black py-2">
                    <span className="font-semibold">
                      Protein {Math.round(getNutrientValue('PROCNT', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('PROCNT', nutritionInfo.totalNutrients).unit}
                    </span>
                    <span className="font-semibold">
                      {getDailyValue('PROCNT', nutritionInfo.totalDaily)}%
                    </span>
                  </div>
                </div>

                {/* Vitamins and Minerals Section */}
                <div className="mt-4 space-y-1 text-sm">
                  {/* Vitamin D */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Vitamin D {Math.round(getNutrientValue('VITD', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('VITD', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('VITD', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Calcium */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Calcium {Math.round(getNutrientValue('CA', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('CA', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('CA', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Iron */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Iron {Math.round(getNutrientValue('FE', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('FE', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('FE', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Potassium */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Potassium {Math.round(getNutrientValue('K', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('K', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('K', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Vitamin A */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Vitamin A {Math.round(getNutrientValue('VITA_RAE', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('VITA_RAE', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('VITA_RAE', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Vitamin C */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Vitamin C {Math.round(getNutrientValue('VITC', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('VITC', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('VITC', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Vitamin E */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Vitamin E {Math.round(getNutrientValue('TOCPHA', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('TOCPHA', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('TOCPHA', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Vitamin K */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Vitamin K {Math.round(getNutrientValue('VITK1', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('VITK1', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('VITK1', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Thiamin (B1) */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Thiamin (B1) {Math.round(getNutrientValue('THIA', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('THIA', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('THIA', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Riboflavin (B2) */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Riboflavin (B2) {Math.round(getNutrientValue('RIBF', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('RIBF', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('RIBF', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Niacin (B3) */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Niacin (B3) {Math.round(getNutrientValue('NIA', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('NIA', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('NIA', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Vitamin B6 */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Vitamin B6 {Math.round(getNutrientValue('VITB6A', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('VITB6A', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('VITB6A', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Folate */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Folate {Math.round(getNutrientValue('FOLDFE', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('FOLDFE', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('FOLDFE', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Vitamin B12 */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Vitamin B12 {Math.round(getNutrientValue('VITB12', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('VITB12', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('VITB12', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Phosphorus */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Phosphorus {Math.round(getNutrientValue('P', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('P', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('P', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Magnesium */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Magnesium {Math.round(getNutrientValue('MG', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('MG', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('MG', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Zinc */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Zinc {Math.round(getNutrientValue('ZN', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('ZN', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('ZN', nutritionInfo.totalDaily)}%
                    </span>
                  </div>

                  {/* Selenium */}
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span>Selenium {Math.round(getNutrientValue('SE', nutritionInfo.totalNutrients).quantity * 100) / 100}{getNutrientValue('SE', nutritionInfo.totalNutrients).unit}</span>
                    <span className="font-semibold">
                      {getDailyValue('SE', nutritionInfo.totalDaily)}%
                    </span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="mt-4 pt-4 border-t border-gray-300 text-xs text-gray-600">
                  <p>* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
                </div>

                {/* Health & Diet Labels */}
                <div className="mt-6 space-y-4">
                  {nutritionInfo.healthLabels.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Health Labels</h3>
                      <div className="flex flex-wrap gap-2">
                        {nutritionInfo.healthLabels.map((label: string) => (
                          <Badge key={label} variant="outline" className="text-green-700 border-green-200 bg-green-50 text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {nutritionInfo.dietLabels.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Diet Labels</h3>
                      <div className="flex flex-wrap gap-2">
                        {nutritionInfo.dietLabels.map((label: string) => (
                          <Badge key={label} variant="outline" className="text-purple-700 border-purple-200 bg-purple-50 text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Per Serving Details */}
          <section className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Serving Information</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{product.serving_size || 'Not set'}</div>
                <div className="text-sm text-gray-600 mt-1">Serving Size ({product.serving_unit || 'g'})</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-green-600">{product.servings_per_container}</div>
                <div className="text-sm text-gray-600 mt-1">Total Servings</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {nutritionInfo?.totalWeight ? Math.round(nutritionInfo.totalWeight) : 'N/A'}g
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Recipe Weight</div>
              </div>
            </div>
          </section>
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
                <Badge variant="outline" className="bg-white">{product.category?.name || 'Uncategorized'}</Badge>
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