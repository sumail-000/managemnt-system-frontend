import { useState, useEffect } from "react"
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
  FileText
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
import { useToast } from "@/hooks/use-toast"
import { productsAPI } from "@/services/api"
import { CategoryModal } from "@/components/common"
import { useCategories } from "@/hooks/useCategories"

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
  serving_size: z.number().min(0, "Serving size must be positive"),
  serving_unit: z.string().min(1, "Serving unit is required"),
  servings_per_container: z.number().min(1, "Must have at least 1 serving"),
  status: z.enum(["draft", "published"]),
  is_public: z.boolean(),
  is_pinned: z.boolean()
  // tags removed - will be auto-generated on backend
})

type ProductFormData = z.infer<typeof productSchema>

// Sortable Ingredient Item Component
function SortableIngredientItem({ ingredient, onRemove }: { ingredient: {id: string, name: string, quantity: number, unit: string}, onRemove: (id: string) => void }) {
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
        <span className="text-sm font-medium">{ingredient.name} {ingredient.quantity} {ingredient.unit}</span>
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

const servingUnits = [
  "g", "kg", "ml", "l", "cups", "tbsp", "tsp", "pieces", "slices", "oz", "lb"
]

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
  const [currentTab, setCurrentTab] = useState("basic")
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  
  // Ingredients state
  const [manualIngredients, setManualIngredients] = useState<{id: string, name: string, quantity: number, unit: string}[]>([])
  const [newIngredient, setNewIngredient] = useState("")
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [newUnit, setNewUnit] = useState("g")
  const [ingredientNotes, setIngredientNotes] = useState("")

  
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
  const addManualIngredient = () => {
    if (newIngredient.trim() && newQuantity > 0 && !manualIngredients.some(item => item.name === newIngredient.trim())) {
      const newIngredientItem = {
        id: `ingredient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newIngredient.trim(),
        quantity: newQuantity,
        unit: newUnit
      }
      setManualIngredients([...manualIngredients, newIngredientItem])
      setNewIngredient("")
      setNewQuantity(0)
      setNewUnit("g")
      toast({
        title: "Ingredient added",
        description: `"${newIngredient.trim()}" has been added to the ingredients list.`
      })
    }
  }

  const removeManualIngredient = (ingredientId: string) => {
    const ingredient = manualIngredients.find(item => item.id === ingredientId)
    setManualIngredients(manualIngredients.filter(item => item.id !== ingredientId))
    if (ingredient) {
      toast({
        title: "Ingredient removed",
        description: `"${ingredient.name}" has been removed from the ingredients list.`
      })
    }
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setManualIngredients((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        
        const newOrder = arrayMove(items, oldIndex, newIndex)
        toast({
          title: "Ingredients reordered",
          description: "The ingredient order has been updated."
        })
        return newOrder
      })
    }
  }



  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: "",
      serving_size: 0,
      serving_unit: "g",
      servings_per_container: 1,
      status: "draft",
      is_public: false,
      is_pinned: false
      // tags removed - will be auto-generated
    }
  })

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
            category_id: product.category_id || '',
            serving_size: parseFloat(product.serving_size) || 0,
            serving_unit: product.serving_unit || 'g',
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
              imageUrl = `http://localhost:8000/storage/${product.image_path}`
            }
            
            if (imageUrl) {
              setImageUrl(imageUrl)
              setImagePreview(imageUrl)
              setUploadMethod(product.image_path ? "upload" : "url")
            }
          }
          
          // Load existing ingredients if available
          if (product.ingredients && Array.isArray(product.ingredients)) {
            const existingIngredients = product.ingredients.map((ingredient: any, index: number) => ({
              id: ingredient.id ? ingredient.id.toString() : `ingredient-${Date.now()}-${index}`,
              name: ingredient.name || '',
              quantity: parseFloat(ingredient.quantity) || 0,
              unit: ingredient.unit || 'g'
            }))
            setManualIngredients(existingIngredients)
          }
          
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

  // Use only manual ingredients
  const ingredients = manualIngredients

  const onSubmit = async (data: ProductFormData) => {
    console.log('Form data received:', data)
    console.log('Selected tags:', selectedTags)
    console.log('Upload method:', uploadMethod)
    console.log('Selected file:', selectedFile)
    console.log('Selected file type:', typeof selectedFile)
    console.log('Selected file instanceof File:', selectedFile instanceof File)
    
    setIsLoading(true)
    
    try {
      // Determine if we need to use FormData for file upload
      const hasFile = selectedFile && uploadMethod === "upload"
      console.log('hasFile condition result:', hasFile)
      console.log('selectedFile truthy:', !!selectedFile)
      console.log('uploadMethod === "upload":', uploadMethod === "upload")
      
      let productData: any
      let headers: any = {}
      
      if (hasFile) {
        // Use FormData for file upload
        productData = new FormData()
        productData.append('name', data.name)
        productData.append('description', data.description || '')
        productData.append('category_id', data.category_id)
        productData.append('serving_size', data.serving_size.toString())
        productData.append('serving_unit', data.serving_unit)
        productData.append('servings_per_container', data.servings_per_container.toString())
        productData.append('status', data.status)
        productData.append('is_public', data.is_public ? '1' : '0')
        productData.append('is_pinned', data.is_pinned ? '1' : '0')
        
        // Add ingredients to FormData as array
        if (ingredients.length > 0) {
          ingredients.forEach((ingredient, index) => {
            productData.append(`ingredients[${index}][id]`, ingredient.id.toString())
            productData.append(`ingredients[${index}][name]`, ingredient.name)
            productData.append(`ingredients[${index}][quantity]`, ingredient.quantity.toString())
            productData.append(`ingredients[${index}][unit]`, ingredient.unit)
            productData.append(`ingredients[${index}][order]`, (index + 1).toString())
          })
        } else {
          // Send empty array indicator
          productData.append('ingredients', '[]')
        }
        
        // Add ingredient notes
        productData.append('ingredient_notes', ingredientNotes)
        
        // Tags will be auto-generated on backend, no need to send them
        // Append the image file - we know it exists because hasFile is true
        console.log('Appending file to FormData:', selectedFile)
        console.log('File details:', {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          lastModified: selectedFile.lastModified
        })
        productData.append('image_file', selectedFile)
        
        // Log FormData contents
        console.log('FormData contents:')
        for (let [key, value] of productData.entries()) {
          console.log(`${key}:`, value)
        }
        
        // Don't set Content-Type for FormData - let browser set it with boundary
      } else {
        // Use regular JSON for URL or no image
        productData = {
          name: data.name,
          description: data.description,
          category_id: data.category_id,
          serving_size: data.serving_size,
          serving_unit: data.serving_unit,
          servings_per_container: data.servings_per_container,
          status: data.status,
          is_public: data.is_public,
          is_pinned: data.is_pinned,
          // tags removed - will be auto-generated on backend
          
          // Add ingredients to JSON data
          ingredients: ingredients.length > 0 ? ingredients.map((ingredient, index) => ({
            id: ingredient.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            order: index + 1
          })) : [],
          
          // Add ingredient notes
          ingredient_notes: ingredientNotes
        }
        
        // Add image URL if provided
        if (imageUrl && uploadMethod === "url") {
          productData.image_url = imageUrl
        }
        
        headers['Content-Type'] = 'application/json'
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

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url)
    setImagePreview(url)
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
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-muted-foreground">
              {isEdit ? "Update product information" : "Create a new food product"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            type="submit" 
            form="product-form"
            disabled={isLoading}
            className="bg-gradient-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="product-form" onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="serving" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Serving Info
              </TabsTrigger>
              <TabsTrigger value="ingredients" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Ingredients
              </TabsTrigger>
              <TabsTrigger value="categorization" className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Categorization
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Name *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., Organic Greek Yogurt" 
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
                          <FormItem>
                            <FormLabel>Description *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your product..."
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/500 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Image</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                            <Input
                              placeholder="https://example.com/image.jpg"
                              value={imageUrl}
                              onChange={(e) => handleImageUrlChange(e.target.value)}
                            />
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
            </TabsContent>

            {/* Serving Information */}
            <TabsContent value="serving" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Serving Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="serving_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serving Size *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="150" 
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serving_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {servingUnits.map(unit => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                            placeholder="4" 
                            {...field} 
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
              <div className="grid gap-6 md:grid-cols-2">
                {/* Manual Ingredients Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Add Ingredients
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter ingredient name..."
                          value={newIngredient}
                          onChange={(e) => setNewIngredient(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addManualIngredient()
                            }
                          }}
                          className="flex-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Quantity"
                          value={newQuantity || ''}
                          onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                          className="flex-1"
                          min="0"
                          step="0.1"
                        />
                        <Select value={newUnit} onValueChange={setNewUnit}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {servingUnits.map(unit => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={addManualIngredient}
                          disabled={!newIngredient.trim() || newQuantity <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Manual Ingredients List */}
                    {manualIngredients.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Added Ingredients:</Label>
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={manualIngredients.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className={`space-y-2 ${manualIngredients.length > 5 ? 'max-h-80 overflow-y-auto pr-2' : ''}`}>
                              {manualIngredients.map((ingredient) => (
                                <SortableIngredientItem
                                  key={ingredient.id}
                                  ingredient={ingredient}
                                  onRemove={removeManualIngredient}
                                />
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{manualIngredients.length} ingredient(s) added</span>
                            <span className="flex items-center gap-1">
                              <GripVertical className="h-3 w-3" />
                              Drag to reorder
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {manualIngredients.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No ingredients added yet</p>
                        <p className="text-xs">Add ingredients manually using the input above</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Ingredient Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Additional Notes</Label>
                      <Textarea
                        placeholder="Add any notes about ingredients, preparation, special instructions, allergen information, or cooking tips..."
                        value={ingredientNotes}
                        onChange={(e) => setIngredientNotes(e.target.value)}
                        className="min-h-[120px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        These notes will be included with your product information and can help with preparation or allergen warnings.
                      </p>
                    </div>
                    
                    {ingredientNotes && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <Label className="text-xs font-medium text-muted-foreground">Preview:</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{ingredientNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                                <SelectItem key={category.id} value={category.id}>
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
              form.setValue('category_id', category.id)
              setIsCategoryModalOpen(false)
            }}
          />
          
          {/* Tab Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                const tabs = ["basic", "serving", "ingredients", "categorization", "settings"]
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
                const tabs = ["basic", "serving", "ingredients", "categorization", "settings"]
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
              {currentTab === "settings" 
                ? <Plus className="w-4 h-4 ml-2" />
                : <ArrowRight className="w-4 h-4 ml-2" />
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}