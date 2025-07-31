import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus,
  Package,
  Info,
  Settings,
  Tags,
  GripVertical,
  Copy,
  Search,
  Clock,
  Users,
  ExternalLink,
  Star,
  ChevronUp,
  ChevronDown,
  StickyNote,
  Activity,
  ChefHat
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { useToast } from "@/hooks/use-toast"
import { productsAPI, edamamAPI } from "@/services/api"
import { CategoryModal } from "@/components/common"
import { useCategories } from "@/hooks/useCategories"
import { ImageUrlExtractionResponse } from "@/types/api"
import { getStorageUrl } from "@/utils/storage"
import { Recipe, EdamamRecipe, transformRecipeFromAPI } from "@/types/recipe"
import { NutritionData } from "@/types/nutrition"
import { NutritionDisplay } from "@/components/nutrition/NutritionDisplay"

import { servingUtils, formatWeight } from "@/utils/serving"

// Import product images
import organicYogurtImage from "@/assets/organic-greek-yogurt.jpg"
import glutenFreeCrackersImage from "@/assets/gluten-free-crackers.jpg"
import premiumOliveOilImage from "@/assets/premium-olive-oil.jpg"
import almondButterImage from "@/assets/almond-butter.jpg"
import margheritaPizzaImage from "@/assets/margherita-pizza.jpg"

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Name too long"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  calories_per_serving: z.number().min(0, "Calories per serving must be positive"),
  portion_size: z.enum(["small", "medium", "large"]),
  serving_type: z.enum(["main", "side"]),
  total_servings: z.number().min(1, "Must have at least 1 serving"),
  serving_unit: z.string().optional(),
  servings_per_container: z.number().min(1, "Must have at least 1 serving per container").optional(),
  status: z.enum(["draft", "published"]),
  is_public: z.boolean(),
  is_pinned: z.boolean()
  // tags removed - will be auto-generated on backend
})

type ProductFormData = z.infer<typeof productSchema>

// Sortable Ingredient Item Component
function SortableIngredientItem({ ingredient, onRemove }: { ingredient: {id: string, text: string}, onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 bg-secondary rounded-md border ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium">{ingredient.text}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => onRemove(ingredient.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Categories are now loaded dynamically from the API

// Serving units array removed - no longer needed with new serving fields

// Mock tags removed - users can add custom tags

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEdit = !!id
  
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("url")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isGoogleUrl, setIsGoogleUrl] = useState(false)
  const [extractedUrl, setExtractedUrl] = useState<string | null>(null)
  const [isProcessingUrl, setIsProcessingUrl] = useState(false)
  const [currentTab, setCurrentTab] = useState("basic")
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  
  // Recipe search state
  const [recipeSearchQuery, setRecipeSearchQuery] = useState("")
  const [recipeSearchResults, setRecipeSearchResults] = useState<Recipe[]>([])
  const [originalRecipeData, setOriginalRecipeData] = useState<EdamamRecipe[]>([])
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false)
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  
  // Image error tracking state
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  
  // Ingredients state
  const [recipeIngredients, setRecipeIngredients] = useState<{id: string, text: string, image?: string, foodCategory?: string, isMainIngredient?: boolean, quantity?: number, measure?: string, weight?: number}[]>([])
  const [ingredientNotes, setIngredientNotes] = useState("")
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false)
  const [isAnalyzingNutrition, setIsAnalyzingNutrition] = useState(false)
  const [nutritionAnalysisComplete, setNutritionAnalysisComplete] = useState(false)
  

  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Category management
  const {
    categories,
    loading: categoriesLoading,
    createCategory,
    refresh: refreshCategories
  } = useCategories()
  


  // Ingredient management functions

  // Recipe search function
  const searchRecipes = async (query: string) => {
    if (!query.trim()) {
      setRecipeSearchResults([])
      setOriginalRecipeData([])
      setSearchErrorMessage(null)
      return
    }

    setIsSearchingRecipes(true)
    setSearchErrorMessage(null)
    try {
      const response = await edamamAPI.recipe.search(query.trim(), {
        limit: 10
      })
      console.log('API Response:', response)
      console.log('Response data:', response.data)
      console.log('Recipe data path:', response.data?.data)
      
      // Store original EdamamRecipe data and transform to Recipe objects
      const recipeData = response.data?.data || []
      console.log('Recipe data array:', recipeData)
      const transformedRecipes = recipeData.map(transformRecipeFromAPI)
      console.log('Transformed recipes:', transformedRecipes)
      
      // Store both original and transformed data
      setOriginalRecipeData(recipeData)
      
      if (transformedRecipes.length === 0) {
        // No results found - show user-friendly message
        const errorMessages = [
          "No recipes found. Check your spelling and try again.",
          "Recipe not found. Try using different keywords.",
          "No matches found. Consider using more common recipe names.",
          "Nothing found for that search. Try a different recipe name."
        ]
        setSearchErrorMessage(errorMessages[Math.floor(Math.random() * errorMessages.length)])
      }
      
      setRecipeSearchResults(transformedRecipes)
    } catch (error) {
      console.error('Recipe search error:', error)
      // Set user-friendly error message
      const networkErrorMessages = [
        "Connection error. Please check your internet and try again.",
        "Search service temporarily unavailable. Please try again later.",
        "Unable to search recipes right now. Please try again."
      ]
      setSearchErrorMessage(networkErrorMessages[Math.floor(Math.random() * networkErrorMessages.length)])
      setRecipeSearchResults([])
      setOriginalRecipeData([])
    } finally {
      setIsSearchingRecipes(false)
    }
  }

  // Automatic nutrition analysis function
  const triggerNutritionAnalysis = async (ingredients: typeof recipeIngredients, productName: string) => {
    console.log('🔬 [DEBUG] Starting nutrition analysis...')
    console.log('🔬 [DEBUG] Product name:', productName)
    console.log('🔬 [DEBUG] Raw ingredients:', ingredients)
    
    if (ingredients.length === 0 || !productName.trim()) {
      console.log('🔬 [DEBUG] Skipping analysis - no ingredients or product name')
      return
    }

    setIsAnalyzingNutrition(true)
    setNutritionAnalysisComplete(false)
    setNutritionData(null)

    try {
      // Prepare ingredients for nutrition analysis - use only text to avoid "low_quality" error
      const ingredientLines = ingredients.map(ingredient => {
        // Extract only the text property to avoid sending rich data that causes API errors
        return ingredient.text || ingredient.toString()
      })

      console.log('🔬 [DEBUG] Processed ingredient lines:', ingredientLines)
      console.log('🔬 [DEBUG] Available edamamAPI methods:', Object.keys(edamamAPI))
      console.log('🔬 [DEBUG] Available nutrition methods:', Object.keys(edamamAPI.nutrition))

      // Call nutrition analysis API (using correct method name)
       console.log('🔬 [DEBUG] Calling edamamAPI.nutrition.analyze...')
       const apiResponse = await edamamAPI.nutrition.analyze(ingredientLines)
       
       console.log('🔬 [DEBUG] Raw API response:', apiResponse)
       console.log('🔬 [DEBUG] Response type:', typeof apiResponse)
       console.log('🔬 [DEBUG] Response keys:', apiResponse ? Object.keys(apiResponse) : 'No keys')
       console.log('🔬 [DEBUG] Response data:', apiResponse?.data)
       console.log('🔬 [DEBUG] Response data type:', typeof apiResponse?.data)
       
       // Extract the actual data from the AxiosResponse
       const responseData = apiResponse?.data
       
       if (responseData) {
         console.log('🔬 [DEBUG] Response data keys:', Object.keys(responseData))
         
         // Check if we have a success response with data
         if (responseData.success && responseData.data) {
           console.log('🔬 [DEBUG] Using response.data.data (transformed nutrition data)')
           setNutritionData(responseData.data)
         } else if (responseData.data) {
           console.log('🔬 [DEBUG] Using response.data (raw nutrition data)')
           // If we have raw Edamam data, we might need to transform it
           setNutritionData(responseData.data)
         } else {
           console.log('🔬 [DEBUG] Using entire response data')
           setNutritionData(responseData)
         }
         
         setNutritionAnalysisComplete(true)
         toast({
           title: "Nutrition Analysis Complete",
           description: `Nutritional data has been automatically analyzed for "${productName}" with ${ingredientLines.length} ingredients.`,
           duration: 5000
         })
         
         console.log('✅ [DEBUG] Nutrition analysis completed successfully')
       } else {
         console.log('⚠️ [DEBUG] No data returned from API')
         throw new Error('No data returned from nutrition analysis API')
       }
    } catch (error) {
      console.error('❌ [DEBUG] Nutrition analysis failed:', error)
      console.error('❌ [DEBUG] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        response: error.response?.data,
        status: error.response?.status
      })
      toast({
        title: "Nutrition Analysis Failed",
        description: `Error: ${error.message || 'Unable to analyze nutrition data automatically. You can try again later.'}`,
        variant: "destructive",
        duration: 5000
      })
    } finally {
      setIsAnalyzingNutrition(false)
      console.log('🔬 [DEBUG] Nutrition analysis process completed')
    }
  }

  // Handle recipe search on Enter key
  const handleRecipeSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      searchRecipes(recipeSearchQuery)
    }
  }

  // Handle recipe selection
  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
    
    // Reset nutrition analysis state when selecting a new recipe
    setNutritionAnalysisComplete(false)
    setNutritionData(null)
    
    // Auto-populate form fields
    form.setValue('name', recipe.name)
    if (recipe.description) {
      form.setValue('description', recipe.description)
    }
    
    // Auto-populate serving information from recipe
    if (recipe.servingInfo) {
      // Set calories per serving
      if (recipe.servingInfo.caloriesPerServing) {
        form.setValue('calories_per_serving', recipe.servingInfo.caloriesPerServing)
      }
      
      // Set portion size
      if (recipe.servingInfo.portionSize) {
        form.setValue('portion_size', recipe.servingInfo.portionSize as "small" | "medium" | "large")
      }
      
      // Set serving type
      if (recipe.servingInfo.servingType) {
        form.setValue('serving_type', recipe.servingInfo.servingType as "main" | "side")
      }
      
      // Set total servings
      if (recipe.servingInfo.servings) {
        form.setValue('total_servings', recipe.servingInfo.servings)
      }
    }
    
    // Auto-populate ingredients from recipe
    // Find the original EdamamRecipe data to get detailed ingredient information
    const recipeIndex = recipeSearchResults.findIndex(r => r.id === recipe.id)
    const originalRecipe = originalRecipeData[recipeIndex]
    
    if (originalRecipe && originalRecipe.ingredients && originalRecipe.ingredients.length > 0) {
      // Debug: Log the original recipe data
      console.log('Original EdamamRecipe ingredients:', originalRecipe.ingredients)
      
      // Transform detailed ingredients from API response
      const transformedIngredients = originalRecipe.ingredients.map((ingredient, index) => {
        const transformed = {
          id: `recipe-ingredient-${Date.now()}-${index}`,
          text: typeof ingredient === 'string' ? ingredient : ingredient.text,
          image: typeof ingredient === 'object' ? ingredient.image : undefined,
          foodCategory: typeof ingredient === 'object' ? ingredient.foodCategory : undefined,
          isMainIngredient: typeof ingredient === 'object' ? (ingredient.weight && ingredient.weight > 100) : false,
          quantity: typeof ingredient === 'object' ? ingredient.quantity : undefined,
          measure: typeof ingredient === 'object' ? ingredient.measure : undefined,
          weight: typeof ingredient === 'object' ? ingredient.weight : undefined
        }
        
        // Debug: Log each transformed ingredient
        console.log(`Ingredient ${index}:`, {
          original: ingredient,
          transformed: transformed,
          hasImage: !!transformed.image
        })
        
        return transformed
      })
      
      setRecipeIngredients(transformedIngredients)
      
      toast({
        title: "Recipe Selected",
        description: `"${recipe.name}" has been selected. ${transformedIngredients.length} ingredients have been auto-loaded.`
      })
    } else {
      toast({
        title: "Recipe Selected",
        description: `"${recipe.name}" has been selected. Form fields have been auto-populated.`
      })
    }
    
    // Don't auto-set image from recipe due to Edamam URL expiration issues
    // Users can upload their own image using the file upload functionality
  }

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      calories_per_serving: 0,
      portion_size: "medium",
      serving_type: "main",
      total_servings: 1,
      serving_size: 0,
      serving_unit: "",
      servings_per_container: 1,
      status: "draft",
      is_public: false,
      is_pinned: false
      // tags removed - will be auto-generated
    }
  })

  // Auto-trigger nutrition analysis when ingredients are populated
  useEffect(() => {
    const productName = form.watch("name")
    // Only trigger if we have ingredients from a recipe and a product name
    if (recipeIngredients.length > 0 && productName?.trim() && !isAnalyzingNutrition && !nutritionAnalysisComplete) {
      // Add a small delay to ensure ingredients are fully populated
      const timer = setTimeout(() => {
        triggerNutritionAnalysis(recipeIngredients, productName)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [recipeIngredients, form.watch("name"), isAnalyzingNutrition, nutritionAnalysisComplete])

  // Reset nutrition analysis when ingredients change (new recipe selected)
  useEffect(() => {
    // Reset nutrition state when ingredients change to allow re-analysis
    if (recipeIngredients.length > 0) {
      setNutritionAnalysisComplete(false)
      setNutritionData(null)
    }
  }, [recipeIngredients.length, recipeIngredients.map(ing => ing.id).join(',')])

  // Load product data if editing
  useEffect(() => {
    const loadProduct = async () => {
      if (isEdit && id) {
        setIsLoading(true)
        try {
          const response = await productsAPI.getById(id)
          console.log('[ProductForm] API Response:', response)
          
          // Extract product data from response
          const product = response.data || response
          console.log('[ProductForm] Product data:', product)
          
          if (!product || typeof product !== 'object') {
            throw new Error('Invalid product data received - no product object')
          }
          
          if (!product.name || typeof product.name !== 'string' || product.name.trim() === '') {
            console.error('[ProductForm] Invalid product name:', product.name)
            throw new Error('Invalid product data received - missing or invalid name')
          }
          
          // Log the structure for debugging
          console.log('[ProductForm] Product structure:', {
            id: product.id,
            name: product.name,
            category: product.category,
            status: product.status,
            hasUser: !!product.user,
            hasIngredients: !!product.ingredients,
            hasNutritionalData: !!product.nutritional_data
          })
          
          const formData = {
            name: product.name || '',
            description: product.description || "",
            category_id: product.category_id ? product.category_id.toString() : '',
            calories_per_serving: parseFloat(product.calories_per_serving) || parseFloat(product.serving_size) || 0,
            portion_size: (product.portion_size as "small" | "medium" | "large") || "medium",
            serving_type: (product.serving_type as "main" | "side") || "main",
            total_servings: parseInt(product.total_servings) || parseInt(product.servings_per_container) || 1,
            serving_size: parseFloat(product.serving_size) || 0,
            serving_unit: product.serving_unit || "",
            servings_per_container: parseInt(product.servings_per_container) || 1,
            status: (product.status as "draft" | "published") || 'draft',
            is_public: Boolean(product.is_public),
            is_pinned: Boolean(product.is_pinned)
            // tags removed from form data - will be auto-generated
          }
          
          console.log('[ProductForm] Mapped form data:', formData)
          
          form.reset(formData)
          // Keep existing tags for display purposes only
          setSelectedTags(Array.isArray(product.tags) ? product.tags : [])
          
          // Handle image preview if product has an image
          if (product.image_url || product.image_path || product.image) {
            let imageUrl = product.image_url || product.image
            
            // If we have an image_path, construct the full URL
            if (product.image_path && !imageUrl) {
              imageUrl = getStorageUrl(product.image_path)
            }
            
            if (imageUrl) {
              setImageUrl(imageUrl)
              setImagePreview(imageUrl)
              setUploadMethod(product.image_path ? "upload" : "url")
            }
          }
          
          // Note: Existing ingredients will be loaded through recipe search functionality
          
          // Load existing ingredient notes if available
          if (product.ingredient_notes) {
            setIngredientNotes(product.ingredient_notes)
          }
          
          toast({
            title: "Product loaded",
            description: "Product data has been loaded successfully."
          })
        } catch (error: any) {
          console.error('Error loading product:', error)
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to load product data.",
            variant: "destructive"
          })
          navigate("/products")
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    loadProduct()
  }, [isEdit, id, form, navigate, toast])

  // Use recipe ingredients
  const ingredients = recipeIngredients

  const onSubmit = async (data: ProductFormData) => {
    console.log('Form data received:', data)
    console.log('Selected recipe:', selectedRecipe)
    console.log('Recipe ingredients:', recipeIngredients)
    console.log('Nutrition data:', nutritionData)
    console.log('Upload method:', uploadMethod)
    console.log('Selected file:', selectedFile)
    
    setIsLoading(true)
    
    try {
      // Determine if we need to use FormData for file upload
      const hasFile = selectedFile && uploadMethod === "upload"
      console.log('hasFile condition result:', hasFile)
      
      let productData: any
      let headers: any = {}
      
      // Prepare rich ingredients data
      const richIngredientsData = recipeIngredients.map((ingredient, index) => ({
        text: ingredient.text,
        quantity: ingredient.quantity || null,
        measure: ingredient.measure || null,
        weight: ingredient.weight || null,
        foodCategory: ingredient.foodCategory || null,
        foodId: ingredient.id || null,
        image: ingredient.image || null,
        isMainIngredient: ingredient.isMainIngredient || false,
        order: index + 1
      }))
      
      // Prepare recipe metadata from selectedRecipe
      const recipeMetadata = selectedRecipe ? {
        recipe_uri: selectedRecipe.uri || null,
        recipe_source: selectedRecipe.source || null,
        recipe_url: selectedRecipe.url || null,
        prep_time: selectedRecipe.estimatedPrepTime || null,
        cook_time: selectedRecipe.estimatedCookTime || null,
        total_time: selectedRecipe.totalTime || null,
        skill_level: selectedRecipe.skillLevel || null,
        time_category: selectedRecipe.timeCategory || null,
        cuisine_type: selectedRecipe.cuisineType?.[0] || null,
        difficulty: selectedRecipe.difficulty || null,
        total_co2_emissions: selectedRecipe.totalCO2Emissions || null,
        co2_emissions_class: selectedRecipe.co2EmissionsClass || null,
        recipe_yield: selectedRecipe.servings || null,
        total_weight: nutritionData?.totalWeight || null,
        weight_per_serving: nutritionData?.weightPerServing || null,
        // Key nutritional information per serving
        calories_per_serving_recipe: selectedRecipe.totalNutrients?.ENERC_KCAL ? Math.round(selectedRecipe.totalNutrients.ENERC_KCAL.quantity / selectedRecipe.servings) : null,
        fat_per_serving: selectedRecipe.totalNutrients?.FAT ? Math.round(selectedRecipe.totalNutrients.FAT.quantity / selectedRecipe.servings) : null,
        carbs_per_serving: selectedRecipe.totalNutrients?.CHOCDF ? Math.round(selectedRecipe.totalNutrients.CHOCDF.quantity / selectedRecipe.servings) : null,
        protein_per_serving: selectedRecipe.totalNutrients?.PROCNT ? Math.round(selectedRecipe.totalNutrients.PROCNT.quantity / selectedRecipe.servings) : null,
        // Total recipe information
        total_recipe_calories: selectedRecipe.totalNutrients?.ENERC_KCAL ? Math.round(selectedRecipe.totalNutrients.ENERC_KCAL.quantity) : null,
        total_recipe_weight: nutritionData?.totalWeight || null,
        // Per serving breakdown
        serving_weight: nutritionData?.weightPerServing || null,
        serving_calories: nutritionData?.caloriesPerServing || null,
        total_servings_count: selectedRecipe.servings || null
      } : {}
      
      // Prepare labels and tags from selectedRecipe
      const labelsAndTags = selectedRecipe ? {
        diet_labels: JSON.stringify(selectedRecipe.dietLabels || []),
        health_labels: JSON.stringify(selectedRecipe.healthLabels || []),
        caution_labels: JSON.stringify(selectedRecipe.cautions || []),
        meal_types: JSON.stringify(selectedRecipe.mealType || []),
        dish_types: JSON.stringify(selectedRecipe.dishType || []),
        recipe_tags: JSON.stringify(selectedRecipe.tags || [])
      } : {
        diet_labels: JSON.stringify([]),
        health_labels: JSON.stringify([]),
        caution_labels: JSON.stringify([]),
        meal_types: JSON.stringify([]),
        dish_types: JSON.stringify([]),
        recipe_tags: JSON.stringify([])
      }
      
      if (hasFile) {
        // Use FormData for file upload
        productData = new FormData()
        productData.append('name', data.name)
        productData.append('description', data.description || '')
        productData.append('category_id', parseInt(data.category_id).toString())
        productData.append('calories_per_serving', data.calories_per_serving.toString())
        productData.append('portion_size', data.portion_size)
        productData.append('serving_type', data.serving_type)
        productData.append('total_servings', data.total_servings.toString())
        
        // Add additional serving fields
        if (data.serving_size !== undefined && data.serving_size > 0) {
          productData.append('serving_size', data.serving_size.toString())
        }
        if (data.serving_unit) {
          productData.append('serving_unit', data.serving_unit)
        }
        if (data.servings_per_container !== undefined && data.servings_per_container > 0) {
          productData.append('servings_per_container', data.servings_per_container.toString())
        }
        productData.append('status', data.status)
        productData.append('is_public', data.is_public ? '1' : '0')
        productData.append('is_pinned', data.is_pinned ? '1' : '0')
        
        // Add recipe metadata
        Object.entries(recipeMetadata).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            productData.append(key, value.toString())
          }
        })
        
        // Add labels and tags
        Object.entries(labelsAndTags).forEach(([key, value]) => {
          productData.append(key, value)
        })
        
        // Add rich ingredients data
        productData.append('rich_ingredients', JSON.stringify(richIngredientsData))
        
        // Add nutrition data
        if (nutritionData) {
          productData.append('nutrition_data', JSON.stringify(nutritionData))
        }
        
        // Add basic ingredients for backward compatibility
        if (ingredients.length > 0) {
          ingredients.forEach((ingredient, index) => {
            productData.append(`ingredients[${index}][id]`, ingredient.id.toString())
            productData.append(`ingredients[${index}][text]`, ingredient.text)
            productData.append(`ingredients[${index}][order]`, (index + 1).toString())
          })
        } else {
          productData.append('ingredients', '[]')
        }
        
        // Add ingredient notes
        productData.append('ingredient_notes', ingredientNotes)
        
        // Append the image file
        productData.append('image_file', selectedFile)
        
        console.log('FormData with rich data prepared')
      } else {
        // Use regular JSON for URL or no image
        productData = {
          name: data.name,
          description: data.description,
          category_id: parseInt(data.category_id),
          calories_per_serving: data.calories_per_serving,
          portion_size: data.portion_size,
          serving_type: data.serving_type,
          total_servings: data.total_servings,
          
          // Add additional serving fields
          ...(data.serving_size !== undefined && data.serving_size > 0 && { serving_size: data.serving_size }),
          ...(data.serving_unit && { serving_unit: data.serving_unit }),
          ...(data.servings_per_container !== undefined && data.servings_per_container > 0 && { servings_per_container: data.servings_per_container }),
          status: data.status,
          is_public: data.is_public,
          is_pinned: data.is_pinned,
          
          // Add recipe metadata
          ...recipeMetadata,
          
          // Add labels and tags
          ...labelsAndTags,
          
          // Add rich ingredients data
          rich_ingredients: JSON.stringify(richIngredientsData),
          
          // Add nutrition data
          nutrition_data: nutritionData ? JSON.stringify(nutritionData) : null,
          
          // Add basic ingredients for backward compatibility
          ingredients: ingredients.length > 0 ? ingredients.map((ingredient, index) => ({
            id: ingredient.id,
            text: ingredient.text,
            order: index + 1
          })) : [],
          
          // Add ingredient notes
          ingredient_notes: ingredientNotes
        }
        
        // Add image URL if provided
        if (imageUrl && uploadMethod === "url") {
          productData.image_url = extractedUrl || imageUrl
        }
        
        headers['Content-Type'] = 'application/json'
        console.log('JSON data with rich recipe information prepared:', productData)
      }
      
      let response
      if (isEdit && id) {
        response = await productsAPI.update(id, productData)
      } else {
        response = await productsAPI.create(productData)
      }
      
      console.log('Product operation successful:', response.data)
      
      toast({
        title: isEdit ? "Product updated" : "Product created",
        description: isEdit 
          ? "Your product has been updated successfully." 
          : "Your product has been created successfully."
      })
      
      // Show additional info popup for new products
      if (!isEdit) {
        setTimeout(() => {
          toast({
            title: "Next Step: Complete Recipe Details",
            description: "Head over to the Nutritional Analysis tab to complete your recipe details and nutritional information.",
            duration: 8000, // Show for 8 seconds
          })
        }, 1500) // Show after 1.5 seconds
      }
      
      // Navigate back to products list
      navigate("/products")
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Tags will be auto-generated, no manual tag management needed

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    console.log('File selected:', file?.name, 'File object:', file)
    if (file) {
      console.log('Setting selectedFile state to:', file)
      setSelectedFile(file)
      // Automatically switch to upload method when file is selected
      setUploadMethod("upload")
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        console.log('File read complete, setting preview')
        setImagePreview(result)
        setImageUrl("")
      }
      reader.onerror = (e) => {
        console.error('Error reading file:', e)
      }
      reader.readAsDataURL(file)
    } else {
      console.log('No file selected')
    }
  }

  const handleImageUrlChange = async (url: string) => {
    setImageUrl(url)
    
    if (url.trim()) {
      setIsProcessingUrl(true)
      try {
        // Call the backend API to extract and validate the image URL
        const response = await productsAPI.extractImageUrl(url)
        // The API interceptor already extracts response.data, so response is the actual data
        const data: ImageUrlExtractionResponse = response as any
        
        // Check if the API call was successful (no error)
        if (!data.error) {
          setIsGoogleUrl(data.is_google_url)
          setExtractedUrl(data.extracted_url !== url ? data.extracted_url : null)
          
          if (data.is_valid_image && data.extracted_url) {
            // Use the extracted URL for preview
            setImagePreview(data.extracted_url)
          } else {
            // Try to load the original URL anyway, but show a warning
            setImagePreview(url)
          }
        } else {
          // If API call fails, fall back to direct URL
          setImagePreview(url)
          setIsGoogleUrl(false)
          setExtractedUrl(null)
        }
      } catch (error) {
        console.error('Error extracting image URL:', error)
        // Fall back to direct URL on error
        setImagePreview(url)
        setIsGoogleUrl(false)
        setExtractedUrl(null)
      } finally {
        setIsProcessingUrl(false)
      }
    } else {
      setImagePreview(null)
      setIsGoogleUrl(false)
      setExtractedUrl(null)
      setIsProcessingUrl(false)
    }
    
    setSelectedFile(null) // Clear file when using URL
  }

  const clearImage = () => {
    setImagePreview(null)
    setImageUrl("")
    setSelectedFile(null)
    // Reset to URL method when clearing
    setUploadMethod("url")
  }

  return (
    <div className="flex-1 space-y-8 p-6 bg-gradient-subtle min-h-screen">
      {/* Enhanced Header with Glass Effect */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary/10 rounded-3xl -z-10" />
        <div className="backdrop-blur-sm bg-card/90 border border-border/50 rounded-3xl p-8 shadow-elegant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild
                className="group hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105"
              >
                <Link to="/products">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                  Back to Products
                </Link>
              </Button>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-text bg-clip-text text-transparent">
                  {isEdit ? "Edit Product" : "Add New Product"}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {isEdit ? "Update product information" : "Fill in the product details below"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                type="submit" 
                form="product-form"
                disabled={isLoading}
                className="bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300 text-white px-8 py-3 text-lg"
              >
                <Save className="w-5 h-5 mr-3" />
                {isLoading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form id="product-form" onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-card/50 backdrop-blur-sm border border-border/50 p-2 rounded-2xl shadow-lg">
              <TabsTrigger 
                value="basic" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <Info className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger 
                value="ingredients" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <Package className="h-4 w-4" />
                Ingredients
              </TabsTrigger>
              <TabsTrigger 
                value="serving" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <Package className="h-4 w-4" />
                Serving Info
              </TabsTrigger>
              <TabsTrigger 
                value="categorization" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <Tags className="h-4 w-4" />
                Categorization
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300 hover:scale-105 rounded-xl"
              >
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>

            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              {/* Enhanced Recipe Search Section */}
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant hover:shadow-glow transition-all duration-500 group">
                <CardHeader className="bg-gradient-primary/5 rounded-t-lg">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform duration-300">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    Recipe Search
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Search for recipes to auto-populate product details. Type a recipe name and press Enter.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                      <Input
                        placeholder="e.g., Chicken Alfredo, Chocolate Cake..."
                        value={recipeSearchQuery}
                        onChange={(e) => {
                          setRecipeSearchQuery(e.target.value)
                          if (searchErrorMessage) {
                            setSearchErrorMessage(null)
                          }
                        }}
                        onKeyPress={handleRecipeSearchKeyPress}
                        className="pl-11 h-12 text-lg border-2 focus:border-primary/50 rounded-xl bg-background/50 backdrop-blur-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => searchRecipes(recipeSearchQuery)}
                      disabled={isSearchingRecipes || !recipeSearchQuery.trim()}
                      className="bg-gradient-primary hover:shadow-glow transition-all duration-300 hover:scale-105 px-8 h-12 rounded-xl"
                    >
                      {isSearchingRecipes ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5 mr-3" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Search Results */}
                  {recipeSearchResults.length > 0 && !selectedRecipe && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Search Results:</h4>
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {recipeSearchResults.map((recipe, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleRecipeSelect(recipe)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                {recipe.image && recipe.image !== 'null' && !imageErrors.has(recipe.image) ? (
                                  <img 
                                    src={recipe.image} 
                                    alt={recipe.name}
                                    className="w-full h-full object-cover"
                                    onError={() => {
                                      console.log('Image failed to load:', recipe.image)
                                      setImageErrors(prev => new Set([...prev, recipe.image!]))
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ChefHat className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm truncate">{recipe.name}</span>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                  {recipe.cookTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {recipe.cookTime}m
                                    </span>
                                  )}
                                  {recipe.cuisine && (
                                    <span>
                                      {recipe.cuisine}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error Message Display */}
                  {searchErrorMessage && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-400 rounded-full flex-shrink-0"></div>
                        <p className="text-sm text-orange-800">{searchErrorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Selected Recipe Display */}
                  {selectedRecipe && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {selectedRecipe.image && selectedRecipe.image !== 'null' && !imageErrors.has(selectedRecipe.image) ? (
                              <img 
                                src={selectedRecipe.image} 
                                alt={selectedRecipe.name}
                                className="w-full h-full object-cover"
                                onError={() => {
                                  console.log('Selected recipe image failed to load:', selectedRecipe.image)
                                  setImageErrors(prev => new Set([...prev, selectedRecipe.image!]))
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ChefHat className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-green-900">{selectedRecipe.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-green-700 mt-1">
                              {selectedRecipe.cookTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {selectedRecipe.cookTime}m
                                </span>
                              )}
                              {selectedRecipe.source && (
                                <span className="flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  {selectedRecipe.source}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecipe(null)
                            setRecipeIngredients([])
                          }}
                          className="text-green-700 hover:text-green-900 hover:bg-green-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Product Details Section */}
              <div className="grid gap-8 md:grid-cols-2 items-stretch">
                {/* Left Column - Product Details */}
                <div className="space-y-6">
                  <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant hover:shadow-glow transition-all duration-500 group">
                    <CardHeader className="bg-gradient-primary/5 rounded-t-lg">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform duration-300">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        Product Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1 p-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-semibold text-foreground">Product Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Organic Greek Yogurt" 
                                className="h-12 text-lg border-2 focus:border-primary/50 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-lg font-semibold text-foreground">Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your product..."
                                className="min-h-[120px] text-lg border-2 focus:border-primary/50 rounded-xl bg-background/50 backdrop-blur-sm transition-all duration-300 hover:shadow-md resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">
                              {field.value?.length || 0}/500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                  {/* Enhanced Right Column - Product Image */}
                  <div className="space-y-6">
                    <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50 shadow-elegant hover:shadow-glow transition-all duration-500 group">
                      <CardHeader className="bg-gradient-primary/5 rounded-t-lg">
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-5 w-5 text-white" />
                          </div>
                          Product Image
                          {imageUrl && (
                            <Badge variant="secondary" className="ml-auto bg-gradient-primary/20 text-primary border-primary/30">
                              Added
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                      <div className="space-y-4">
                        {/* Upload Method Selection */}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={uploadMethod === "url" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUploadMethod("url")}
                          >
                            Image URL
                          </Button>
                          <Button
                            type="button"
                            variant={uploadMethod === "upload" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setUploadMethod("upload")}
                          >
                            Upload File
                          </Button>
                        </div>

                        {/* Image Preview */}
                        {imagePreview && (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  if (uploadMethod === "upload") {
                                    document.getElementById('image-upload')?.click()
                                  }
                                }}
                              >
                                Change Image
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={clearImage}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* URL Input */}
                        {uploadMethod === "url" && (
                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <div className="relative">
                              <Input
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(e) => handleImageUrlChange(e.target.value)}
                                disabled={isProcessingUrl}
                              />
                              {isProcessingUrl && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                </div>
                              )}
                            </div>
                            
                            {/* Processing indicator */}
                            {isProcessingUrl && (
                              <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                                  <p className="text-xs text-gray-600">Processing URL...</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Google URL Detection Feedback */}
                            {isGoogleUrl && extractedUrl && (
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <div className="text-blue-600 mt-0.5">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">Google Search URL Detected</p>
                                    <p className="text-xs text-blue-600 mt-1">We've extracted the direct image URL for you:</p>
                                    <p className="text-xs text-blue-700 mt-1 font-mono bg-blue-100 p-1 rounded break-all">{extractedUrl}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {isGoogleUrl && !extractedUrl && (
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <div className="flex items-start gap-2">
                                  <div className="text-yellow-600 mt-0.5">
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-800">Google Search URL Detected</p>
                                    <p className="text-xs text-yellow-600 mt-1">For better results, right-click on the image in Google and select "Copy image address" instead of copying the search result URL.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {imageUrl && !imagePreview && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setImagePreview(imageUrl)}
                              >
                                Preview Image
                              </Button>
                            )}
                          </div>
                        )}

                        {/* File Upload */}
                        {uploadMethod === "upload" && !imagePreview && (
                          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Upload product image
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById('image-upload')?.click()}
                            >
                              Choose File
                            </Button>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Comprehensive Recipe Details Section */}
              {selectedRecipe && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Recipe Information
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Detailed nutritional and preparation information.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Basic Recipe Metrics */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {selectedRecipe.calories && (
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-orange-900">Total Calories</span>
                          </div>
                          <p className="text-3xl font-bold text-orange-800">
                            {Math.round(selectedRecipe.calories)}
                          </p>
                          <p className="text-xs text-orange-600 mt-1">kcal total recipe</p>
                        </div>
                      )}
                      
                      {selectedRecipe.totalTime !== undefined && selectedRecipe.totalTime !== null && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-900">Total Time</span>
                          </div>
                          <p className="text-3xl font-bold text-blue-800">
                            {selectedRecipe.totalTime}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">minutes</p>
                        </div>
                      )}
                      

                      
                      {selectedRecipe.rating && (
                         <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                           <div className="flex items-center gap-2 mb-2">
                             <Star className="h-4 w-4 text-yellow-600 fill-current" />
                             <span className="text-sm font-semibold text-yellow-900">Rating</span>
                           </div>
                           <div className="flex items-center gap-2">
                             <p className="text-3xl font-bold text-yellow-800">
                               {Math.round(selectedRecipe.rating * 10) / 10}
                             </p>
                             <div className="flex">
                               {[...Array(5)].map((_, i) => (
                                 <Star 
                                   key={i} 
                                   className={`h-3 w-3 ${
                                     i < Math.round(selectedRecipe.rating!) ? 'text-yellow-500 fill-current' : 'text-yellow-300'
                                   }`} 
                                 />
                               ))}
                             </div>
                           </div>
                           <p className="text-xs text-yellow-600 mt-1">out of 5</p>
                         </div>
                       )}
                       
                       {/* Nutrition Score Card */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-green-900">Nutrition Score</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-2xl font-bold text-green-800">
                              {selectedRecipe.diversityScore || 50}/100
                            </p>
                            <p className="text-xs text-green-600 mt-1">diversity score</p>
                          </div>
                        </div>
                    </div>

                    {/* Recipe Classification & Details */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Left Column */}
                      <div className="space-y-6">
                        {/* Preparation Section */}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-3">Preparation</h4>
                          <div className="space-y-3">
                            {selectedRecipe.estimatedPrepTime && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Prep Time</Label>
                                <div className="mt-1">
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                                    {selectedRecipe.estimatedPrepTime} min
                                  </Badge>
                                </div>
                              </div>
                            )}
                            
                            {selectedRecipe.estimatedCookTime !== undefined && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Cook Time</Label>
                                <div className="mt-1">
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium">
                                    {selectedRecipe.estimatedCookTime === 0 || selectedRecipe.estimatedCookTime === null ? 'Not found' : `${selectedRecipe.estimatedCookTime} min`}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            
                            {selectedRecipe.totalTime && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Time</Label>
                                <div className="mt-1">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
                                    {selectedRecipe.totalTime} min
                                  </Badge>
                                </div>
                              </div>
                            )}
                            
                            {selectedRecipe.skillLevel && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Skill Level</Label>
                                <div className="mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`font-medium ${
                                      selectedRecipe.skillLevel === 'easy' ? 'bg-green-50 text-green-700 border-green-200' :
                                      selectedRecipe.skillLevel === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                      'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    {selectedRecipe.skillLevel.charAt(0).toUpperCase() + selectedRecipe.skillLevel.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            
                            {selectedRecipe.timeCategory && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Time Category</Label>
                                <div className="mt-1">
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                                    {selectedRecipe.timeCategory.charAt(0).toUpperCase() + selectedRecipe.timeCategory.slice(1)}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Recipe Classification */}
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="font-semibold text-gray-900 mb-3">Recipe Classification</h4>
                          <div className="space-y-3">
                            {selectedRecipe.cuisine && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Cuisine Type</Label>
                                <div className="mt-1">
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                                    {selectedRecipe.cuisine}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            
                            {selectedRecipe.difficulty && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Difficulty Level</Label>
                                <div className="mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`font-medium ${
                                      selectedRecipe.difficulty.toLowerCase() === 'easy' ? 'bg-green-50 text-green-700 border-green-200' :
                                      selectedRecipe.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                      'bg-red-50 text-red-700 border-red-200'
                                    }`}
                                  >
                                    {selectedRecipe.difficulty}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            
                            {selectedRecipe.mealType && selectedRecipe.mealType.length > 0 && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Meal Type</Label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {selectedRecipe.mealType.map((meal, index) => (
                                    <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                                      {meal}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {selectedRecipe.dishType && selectedRecipe.dishType.length > 0 && (
                              <div>
                                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Dish Type</Label>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {selectedRecipe.dishType.map((dish, index) => (
                                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                      {dish}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>


                      </div>

                      {/* Right Column */}
                      <div className="space-y-6">
                        {/* Tags */}
                        {selectedRecipe.apiTags && selectedRecipe.apiTags.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-900 mb-3">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedRecipe.apiTags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}



                        {/* Health Labels */}
                        {selectedRecipe.healthLabels && selectedRecipe.healthLabels.length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-900 mb-3">Health Labels</h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedRecipe.healthLabels.slice(0, 8).map((label, index) => (
                                <Badge key={index} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                  {label}
                                </Badge>
                              ))}
                              {selectedRecipe.healthLabels.length > 8 && (
                                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">
                                  +{selectedRecipe.healthLabels.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}


                        {/* Nutritional Highlights */}
                        {selectedRecipe.totalNutrients && Object.keys(selectedRecipe.totalNutrients).length > 0 && (
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-900 mb-3">Key Nutritional Information</h4>
                            <p className="text-xs text-gray-500 mb-3">Major nutrients per serving</p>
                            <div className="grid grid-cols-2 gap-3">
                              {selectedRecipe.totalNutrients.ENERC_KCAL && (
                                <div className="text-center p-2 bg-white rounded border">
                                  <p className="text-lg font-bold text-gray-800">{Math.round(selectedRecipe.totalNutrients.ENERC_KCAL.quantity / selectedRecipe.servings)}</p>
                                  <p className="text-xs text-gray-600">Calories</p>
                                </div>
                              )}
                              {selectedRecipe.totalNutrients.PROCNT && (
                                <div className="text-center p-2 bg-white rounded border">
                                  <p className="text-lg font-bold text-blue-600">{Math.round(selectedRecipe.totalNutrients.PROCNT.quantity / selectedRecipe.servings)}g</p>
                                  <p className="text-xs text-gray-600">Protein</p>
                                </div>
                              )}
                              {selectedRecipe.totalNutrients.CHOCDF && (
                                <div className="text-center p-2 bg-white rounded border">
                                  <p className="text-lg font-bold text-green-600">{Math.round(selectedRecipe.totalNutrients.CHOCDF.quantity / selectedRecipe.servings)}g</p>
                                  <p className="text-xs text-gray-600">Carbs</p>
                                </div>
                              )}
                              {selectedRecipe.totalNutrients.FAT && (
                                <div className="text-center p-2 bg-white rounded border">
                                  <p className="text-lg font-bold text-yellow-600">{Math.round(selectedRecipe.totalNutrients.FAT.quantity / selectedRecipe.servings)}g</p>
                                  <p className="text-xs text-gray-600">Fat</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Environmental Impact */}
                        {selectedRecipe.totalCO2Emissions > 0 && (
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-900 mb-3">Environmental Impact</h4>
                            <p className="text-xs text-gray-500 mb-2">Carbon footprint information</p>
                            <div className="flex items-center gap-3">
                              <div className="text-center">
                                <p className="text-lg font-bold text-green-700">{Math.round(selectedRecipe.totalCO2Emissions)}g</p>
                                <p className="text-xs text-gray-600">CO₂ Emissions</p>
                              </div>
                              {selectedRecipe.co2EmissionsClass && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    selectedRecipe.co2EmissionsClass.toLowerCase() === 'a+' ? 'bg-green-50 text-green-700 border-green-200' :
                                    selectedRecipe.co2EmissionsClass.toLowerCase() === 'a' ? 'bg-green-50 text-green-700 border-green-200' :
                                    selectedRecipe.co2EmissionsClass.toLowerCase() === 'b' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    selectedRecipe.co2EmissionsClass.toLowerCase() === 'c' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                    'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                >
                                  Class {selectedRecipe.co2EmissionsClass}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Cautions & Allergens */}
                        {selectedRecipe.cautions && selectedRecipe.cautions.length > 0 && (
                          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <h4 className="font-semibold text-red-900 mb-3">⚠️ Cautions & Allergens</h4>
                            <p className="text-xs text-red-600 mb-2">Important dietary considerations</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedRecipe.cautions.map((caution, index) => (
                                <Badge key={index} variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs">
                                  {caution}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Serving Information */}
            <TabsContent value="serving" className="space-y-6">
              {/* Per-Serving Display Section */}
              {(selectedRecipe?.servingInfo || nutritionData) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      Per-Serving Information
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Calculated serving information from recipe and nutrition analysis
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Servings Per Container */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-700 mb-1">Servings Per Container</p>
                          <p className="text-lg font-bold text-green-900">
                            {form.watch('total_servings') || selectedRecipe?.servingInfo?.servings || nutritionData?.servings || 1}
                          </p>
                        </div>
                      </div>

                      {/* Calories per Serving */}
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="text-center">
                          <p className="text-sm font-medium text-orange-700 mb-1">Calories per Serving</p>
                          <p className="text-lg font-bold text-orange-900">
                            {(() => {
                              const formCalories = form.watch('calories_per_serving')
                              const recipeCalories = selectedRecipe?.servingInfo?.caloriesPerServing
                              const nutritionCalories = nutritionData?.calories && nutritionData?.servings 
                                ? Math.round(nutritionData.calories / nutritionData.servings)
                                : null
                              
                              const calories = formCalories || recipeCalories || nutritionCalories || 0
                              return `${calories} kcal`
                            })()} 
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    {nutritionData && (() => {
                      const servingInfo = servingUtils.calculateServingInfo(
                        {
                          calories_per_serving: form.watch('calories_per_serving'),
                          total_servings: form.watch('total_servings'),
                          portion_size: form.watch('portion_size'),
                          serving_type: form.watch('serving_type')
                        },
                        selectedRecipe,
                        nutritionData
                      );
                      
                      return (
                        <div className="mt-4 space-y-3">
                          {/* Total Recipe Information */}
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Total Recipe Information</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Total Recipe Calories:</span>
                                <span className="font-medium text-gray-900">{nutritionData.calories} kcal</span>
                              </div>
                              {nutritionData.totalWeight && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">Total Weight:</span>
                                  <span className="font-medium text-gray-900">{formatWeight(nutritionData.totalWeight)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Per Serving Breakdown */}
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-700 mb-2">Per Serving Breakdown</h4>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-600">Weight per Serving:</span>
                                <span className="font-medium text-blue-900">{formatWeight(servingInfo.weightPerServing)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-600">Calories per Serving:</span>
                                <span className="font-medium text-blue-900">{servingInfo.caloriesPerServing} kcal</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-600">Total Servings:</span>
                                <span className="font-medium text-blue-900">{servingInfo.servingsCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Show basic breakdown even without nutrition data */}
                    {!nutritionData && (selectedRecipe?.servingInfo || form.watch('total_servings')) && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Serving Information</h4>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600">Total Servings:</span>
                            <span className="font-medium text-blue-900">
                              {form.watch('total_servings') || selectedRecipe?.servingInfo?.servings || 1}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600">Portion Size:</span>
                            <span className="font-medium text-blue-900 capitalize">
                              {form.watch('portion_size') || selectedRecipe?.servingInfo?.portionSize || 'medium'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-600">Serving Type:</span>
                            <span className="font-medium text-blue-900 capitalize">
                              {form.watch('serving_type') || selectedRecipe?.servingInfo?.servingType || 'main'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Form Fields */}
              <Card>
                <CardHeader>
                  <CardTitle>Serving Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Enter serving information for your product
                  </p>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="calories_per_serving"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories per Serving *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="250" 
                            type="number"
                            {...field}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            onFocus={(e) => {
                              if (field.value === 0) {
                                field.onChange('')
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="portion_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portion Size *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select portion size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serving_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serving Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select serving type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="main">Main</SelectItem>
                            <SelectItem value="side">Side</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="total_servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Servings</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="4" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />



                  <FormField
                    control={form.control}
                    name="servings_per_container"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servings per Container</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1" 
                            {...field}
                            value={field.value === 0 ? '' : field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Ingredients */}
            <TabsContent value="ingredients" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Ingredients
                      {recipeIngredients.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {recipeIngredients.length} items
                          </Badge>
                          {recipeIngredients.filter(ing => ing.image).length > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                              {recipeIngredients.filter(ing => ing.image).length} with images
                            </Badge>
                          )}
                          {isAnalyzingNutrition && (
                            <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700 animate-pulse">
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600 mr-1"></div>
                              Analyzing nutrition...
                            </Badge>
                          )}
                          {nutritionAnalysisComplete && (
                            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Nutrition analyzed
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardTitle>
                    <Button
                      type="button"
                      onClick={() => setIsNotesModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <StickyNote className="h-4 w-4" />
                      Add Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* All Ingredients List */}
                  <div className="space-y-4">
                    {/* Main Ingredients from Recipe */}
                    {recipeIngredients.filter(ing => ing.isMainIngredient).length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Main Ingredients</h3>
                          <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                            {recipeIngredients.filter(ing => ing.isMainIngredient).length} items
                          </Badge>
                          <div className="flex-1 h-px bg-border"></div>
                        </div>
                        <div className="space-y-2">
                          {recipeIngredients.filter(ing => ing.isMainIngredient).map((ingredient) => (
                            <div key={ingredient.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors border-orange-200 bg-orange-50/30">
                              {ingredient.image ? (
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={ingredient.image}
                                    alt={ingredient.text}
                                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                      if (fallback) fallback.classList.remove('hidden')
                                    }}
                                  />
                                  <div className="hidden w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200">
                                    <div className="flex items-center justify-center w-full h-full">
                                      <Package className="h-6 w-6 text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight">{ingredient.text}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {ingredient.quantity && ingredient.measure && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                                      {ingredient.quantity} {ingredient.measure}
                                    </span>
                                  )}
                                  {ingredient.weight && (
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                      {Math.round(ingredient.weight)}g
                                    </span>
                                  )}
                                  {ingredient.foodCategory && (
                                    <span className="text-xs text-muted-foreground capitalize bg-muted/50 px-2 py-0.5 rounded">
                                      {ingredient.foodCategory}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-xs h-5 border-orange-200 text-orange-700">
                                    Main
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Side Ingredients from Recipe */}
                    {recipeIngredients.filter(ing => !ing.isMainIngredient).length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-muted-foreground">Side Ingredients</h3>
                          <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                            {recipeIngredients.filter(ing => !ing.isMainIngredient).length} items
                          </Badge>
                          <div className="flex-1 h-px bg-border"></div>
                        </div>
                        <div className="space-y-2">
                          {recipeIngredients.filter(ing => !ing.isMainIngredient).map((ingredient) => (
                            <div key={ingredient.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors border-blue-200 bg-blue-50/30">
                              {ingredient.image ? (
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={ingredient.image}
                                    alt={ingredient.text}
                                    className="w-14 h-14 rounded-lg object-cover border border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                      if (fallback) fallback.classList.remove('hidden')
                                    }}
                                  />
                                  <div className="hidden w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200">
                                    <div className="flex items-center justify-center w-full h-full">
                                      <Package className="h-6 w-6 text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                                  <Package className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight">{ingredient.text}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {ingredient.quantity && ingredient.measure && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                                      {ingredient.quantity} {ingredient.measure}
                                    </span>
                                  )}
                                  {ingredient.weight && (
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                      {Math.round(ingredient.weight)}g
                                    </span>
                                  )}
                                  {ingredient.foodCategory && (
                                    <span className="text-xs text-muted-foreground capitalize bg-muted/50 px-2 py-0.5 rounded">
                                      {ingredient.foodCategory}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-xs h-5 border-blue-200 text-blue-700">
                                    Side
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}





                    {/* Empty State */}
                    {recipeIngredients.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-sm font-medium mb-1">No ingredients added yet</p>
                        <p className="text-xs">Select a recipe to add ingredients</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Nutrition Analysis Section */}
              {recipeIngredients.length > 0 && nutritionData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      Nutritional Analysis
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete nutritional breakdown based on selected ingredients
                    </p>
                  </CardHeader>
                  <CardContent>
                    <NutritionDisplay nutritionData={nutritionData} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Categorization */}
            <TabsContent value="categorization" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Select Existing Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Category count info */}
                    {categories.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {categories.length} categories available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Create New Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Don't see the category you need? Create a new one.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCategoryModalOpen(true)}
                        disabled={categoriesLoading}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Category
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Auto-generated Tags Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1">
                          <Tags className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Auto-Generated Tags
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Tags will be automatically generated based on your product's nutritional analysis, 
                            ingredients, and category. This helps with product discovery and filtering.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Show current tags if editing */}
                    {selectedTags.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Current Tags:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          These tags were auto-generated. New tags will be generated when you save the product.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Draft products are not visible to the public
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                      control={form.control}
                      name="is_public"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Public Visibility</FormLabel>
                            <FormDescription>
                              Allow this product to be visible to other users
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                  <FormField
                      control={form.control}
                      name="is_pinned"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel>Pin Product</FormLabel>
                            <FormDescription>
                              Pin this product to the top of your product list
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
          
          {/* Category Modal */}
          <CategoryModal
            isOpen={isCategoryModalOpen}
            onClose={() => setIsCategoryModalOpen(false)}
            existingCategories={categories}
            onCategoryCreated={(category) => {
              // Refresh categories and select the new one
              refreshCategories()
              form.setValue('category_id', category.id.toString())
              setIsCategoryModalOpen(false)
            }}
          />
          

          
          {/* Tab Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                const tabs = ["basic", "ingredients", "serving", "categorization", "settings"]
                const currentIndex = tabs.indexOf(currentTab)
                if (currentIndex > 0) {
                  setCurrentTab(tabs[currentIndex - 1])
                }
              }}
              disabled={currentTab === "basic"}
              className="min-w-[120px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                const tabs = ["basic", "ingredients", "serving", "categorization", "settings"]
                const currentIndex = tabs.indexOf(currentTab)
                if (currentIndex < tabs.length - 1) {
                  setCurrentTab(tabs[currentIndex + 1])
                } else {
                  // On last tab, navigate based on context
                  if (isEdit) {
                    navigate("/products")
                  } else {
                    navigate("/products/new")
                  }
                }
              }}
              className="min-w-[120px]"
            >
              {currentTab === "settings" 
                ? (isEdit ? "Back to Products" : "Create Another")
                : "Next"
              }
              {currentTab === "label" 
                ? <Plus className="w-4 h-4 ml-2" />
                : <ArrowRight className="w-4 h-4 ml-2" />
              }
            </Button>
          </div>
        </form>
      </Form>

      {/* Notes Modal */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Ingredient Notes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="notes-textarea">Notes</Label>
              <Textarea
                id="notes-textarea"
                placeholder="Add any notes about ingredients, preparation, special instructions, allergen information, or cooking tips..."
                value={ingredientNotes}
                onChange={(e) => setIngredientNotes(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                These notes will be included with your product information and can help with preparation or allergen warnings.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNotesModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsNotesModalOpen(false)
                }}
              >
                Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}