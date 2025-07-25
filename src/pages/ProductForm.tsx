import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  X, 
  Plus,
  Package,
  Info,
  Settings,
  Tags,
  ChevronRight
} from "lucide-react"
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
  is_pinned: z.boolean(),
  tags: z.array(z.string()).optional()
})

type ProductFormData = z.infer<typeof productSchema>

// Categories are now loaded dynamically from the API

const servingUnits = [
  "g", "kg", "ml", "l", "cups", "tbsp", "tsp", "pieces", "slices", "oz", "lb"
]

const mockTags = [
  "Organic", "Gluten Free", "High Protein", "Vegan", "Low Sugar", 
  "Natural", "Premium", "Whole Grain", "Low Fat", "No Additives"
]

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEdit = !!id
  
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [uploadMethod, setUploadMethod] = useState<"upload" | "url">("url")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentTab, setCurrentTab] = useState("basic")
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  
  // Category management
  const {
    categories,
    loading: categoriesLoading,
    createCategory,
    refresh: refreshCategories
  } = useCategories()

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
      is_pinned: false,
      tags: []
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
            is_pinned: Boolean(product.is_pinned),
            tags: Array.isArray(product.tags) ? product.tags : []
          }
          
          console.log('[ProductForm] Mapped form data:', formData)
          
          form.reset(formData)
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
        // Append tags as individual array items
        selectedTags.forEach((tag, index) => {
          productData.append(`tags[${index}]`, tag)
        })
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
          tags: selectedTags
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

  const handleAddTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags(prev => [...prev, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

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
          <Button variant="outline" type="button">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="serving" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Serving Info
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

            {/* Categorization */}
            <TabsContent value="categorization" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Category *</FormLabel>
                          <div className="flex gap-2">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="flex-1">
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
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsCategoryModalOpen(true)}
                              disabled={categoriesLoading}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Category
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Category count info */}
                    {categories.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {categories.length} categories available
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <Button type="button" onClick={handleAddTag} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Suggested Tags */}
                    <div>
                      <Label className="text-xs text-muted-foreground">Suggested:</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {mockTags.filter(tag => !selectedTags.includes(tag)).map(tag => (
                          <Button
                            key={tag}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTags(prev => [...prev, tag])}
                            className="h-7 text-xs"
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Tags */}
                    {selectedTags.length > 0 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Selected:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                const tabs = ["basic", "serving", "categorization", "settings"]
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
                const tabs = ["basic", "serving", "categorization", "settings"]
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
                : <ChevronRight className="w-4 h-4 ml-2" />
              }
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}