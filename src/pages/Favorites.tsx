import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { productsAPI, collectionsAPI } from "@/services/api"
import { Product, transformProductFromAPI } from "@/types/product"
import { 
  Heart, 
  Star, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  Folder,
  Calendar,
  TrendingUp,
  Package,
  BarChart3,
  Clock,
  Users,
  Archive,
  BookmarkPlus,
  Crown,
  ChefHat,
  Tag,
  Palette
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Link as RouterLink } from "react-router-dom"

// Collection interface
interface Collection {
  id: string | number;
  name: string;
  description?: string;
  color: string;
  itemCount?: number;
  products_count?: number;
  created?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Favorites() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("updated_at")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  })

  // Fetch favorites from API
  const fetchFavorites = async (page = 1) => {
    try {
      setLoading(true)
      const params = {
        page,
        per_page: pagination.per_page,
        search: searchQuery || undefined,
        category: filterCategory !== 'all' ? filterCategory : undefined,
        sort_by: sortBy,
        sort_order: 'desc'
      }
      
      const response = await productsAPI.getFavorites(params)
      
      if (response && response.data) {
        const transformedProducts = response.data.map(transformProductFromAPI)
        setFavorites(transformedProducts)
        
        // Handle pagination data - check if it's in response.data or response directly
        const paginationData = response.data.current_page ? response.data : response
        setPagination({
          current_page: Number(paginationData.current_page || 1),
          last_page: Number(paginationData.last_page || 1),
          per_page: Number(paginationData.per_page || 10),
          total: Number(paginationData.total || 0)
        })
        
        // Extract unique categories from favorites
        const uniqueCategories = [...new Set(transformedProducts.map(p => p.category?.name).filter(Boolean))] as string[]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
      toast({
        title: "Error",
        description: "Failed to load favorites. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Load favorites on component mount and when filters change
  useEffect(() => {
    fetchFavorites(1)
  }, [searchQuery, filterCategory, sortBy])
  
  // Load favorites on page change
  useEffect(() => {
    if (pagination.current_page > 1) {
      fetchFavorites(pagination.current_page)
    }
  }, [pagination.current_page])

  // Collections state
  const [collections, setCollections] = useState<Collection[]>([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    color: '#10b981'
  })
  const [selectedFavorites, setSelectedFavorites] = useState<number[]>([])
  const [showAddToCollectionDialog, setShowAddToCollectionDialog] = useState(false)

  // Fetch collections from API
   const fetchCollections = async () => {
     try {
       setLoadingCollections(true)
       const response = await collectionsAPI.getAll()
       if (response && Array.isArray(response)) {
         setCollections(response)
       } else if (response && response.data && Array.isArray(response.data)) {
         setCollections(response.data)
       }
     } catch (error) {
       console.error('Error fetching collections:', error)
       toast({
         title: "Error",
         description: "Failed to load collections. Please try again.",
         variant: "destructive"
       })
     } finally {
       setLoadingCollections(false)
     }
   }

  // Load collections on component mount
  useEffect(() => {
    fetchCollections()
  }, [])

  // Favorites analytics
  const favoritesStats = {
    totalFavorites: pagination.total,
    thisWeekAdded: 0, // Could be calculated from created_at dates
    mostAccessed: favorites.length > 0 ? favorites[0]?.name : "None",
    averageAccess: 0, // Not available in current data structure
    categories: categories.reduce((acc, cat) => {
      acc[cat] = favorites.filter(f => f.category?.name === cat).length
      return acc
    }, {} as Record<string, number>)
  }

  // Since filtering and sorting is now handled by the API, we use favorites directly
  const filteredFavorites = favorites

  const handleToggleFavorite = async (productId: number) => {
    try {
      await productsAPI.toggleFavorite(productId)
      
      // Remove from local state since we're on favorites page
      setFavorites(prev => prev.filter(fav => Number(fav.id) !== productId))
      
      // Update pagination total
      setPagination(prev => ({
        ...prev,
        total: prev.total - 1
      }))
      
      toast({
        title: "Removed from favorites",
        description: "Product has been removed from your favorites."
      })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleBulkAction = (action: string, selectedIds: number[]) => {
    switch (action) {
      case "remove":
        setFavorites(prev => prev.filter(fav => !selectedIds.includes(Number(fav.id))))
        toast({
          title: "Removed from Favorites",
          description: `${selectedIds.length} products removed from favorites.`
        })
        break
      case "collection":
        // Add to collection logic
        toast({
          title: "Added to Collection",
          description: `${selectedIds.length} products added to collection.`
        })
        break
      default:
        break
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollection.name.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required.",
        variant: "destructive"
      })
      return
    }

    try {
       const response = await collectionsAPI.create({
         name: newCollection.name,
         description: newCollection.description,
         color: newCollection.color
       })
      
      if (response) {
        // Refresh collections to get updated data from server
        await fetchCollections()
        setNewCollection({ name: '', description: '', color: '#10b981' })
        setShowCreateDialog(false)
        toast({
          title: "Collection Created",
          description: "New collection has been created successfully."
        })
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection)
    setNewCollection({
      name: collection.name,
      description: collection.description || '',
      color: collection.color
    })
    setShowEditDialog(true)
  }

  const handleUpdateCollection = async () => {
    if (!editingCollection || !newCollection.name.trim()) {
      toast({
        title: "Error",
        description: "Collection name is required.",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await collectionsAPI.update(editingCollection.id.toString(), {
        name: newCollection.name,
        description: newCollection.description,
        color: newCollection.color
      })
      
      if (response) {
        // Refresh collections to get updated data from server
        await fetchCollections()
        setNewCollection({ name: '', description: '', color: '#10b981' })
        setEditingCollection(null)
        setShowEditDialog(false)
        toast({
          title: "Collection Updated",
          description: "Collection has been updated successfully."
        })
      }
    } catch (error) {
      console.error('Error updating collection:', error)
      toast({
        title: "Error",
        description: "Failed to update collection. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteCollection = async (collectionId: string | number) => {
     try {
       await collectionsAPI.delete(collectionId.toString())
       // Refresh collections to get updated data from server
       await fetchCollections()
       toast({
         title: "Collection Deleted",
         description: "Collection has been deleted successfully."
       })
     } catch (error) {
       console.error('Error deleting collection:', error)
       toast({
         title: "Error",
         description: "Failed to delete collection. Please try again.",
         variant: "destructive"
       })
     }
   }

  const handleAddToCollection = async (collectionId: string) => {
    if (selectedFavorites.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one favorite to add to collection.",
        variant: "destructive"
      })
      return
    }

    try {
      const promises = selectedFavorites.map(productId => 
        collectionsAPI.addProduct(collectionId, productId.toString())
      )
      
      await Promise.all(promises)
      
      // Refresh collections to update product counts
      await fetchCollections()
      
      setSelectedFavorites([])
      setShowAddToCollectionDialog(false)
      toast({
        title: "Added to Collection",
        description: `${selectedFavorites.length} product${selectedFavorites.length > 1 ? 's' : ''} added to collection successfully.`
      })
    } catch (error: any) {
      console.error('Error adding to collection:', error)
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to add products to collection. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const toggleFavoriteSelection = (productId: number) => {
    setSelectedFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const selectAllFavorites = () => {
    if (selectedFavorites.length === favorites.length) {
      setSelectedFavorites([])
    } else {
      setSelectedFavorites(favorites.map(f => Number(f.id)))
    }
  }

  const handleExportFavorites = () => {
    toast({
      title: "Export Started",
      description: "Your favorites list is being exported."
    })
  }

  return (
    <div className="flex-1">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Favorites Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and organize your favorite products
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleExportFavorites}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>
                    Create a new collection to organize your favorite products.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Collection Name</Label>
                    <Input
                      id="name"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter collection name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCollection.description}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter collection description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={newCollection.color}
                        onChange={(e) => setNewCollection(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <span className="text-sm text-muted-foreground">{newCollection.color}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateCollection}>
                      Create Collection
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

        <div className="space-y-6 p-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Favorites</CardTitle>
              <Heart className="h-4 w-4 text-danger" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoritesStats.totalFavorites}</div>
              <p className="text-xs text-muted-foreground">
                +{favoritesStats.thisWeekAdded} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Accessed</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{favoritesStats.mostAccessed}</div>
              <p className="text-xs text-muted-foreground">
                {favorites.length > 0 ? Math.max(...favorites.map(f => Number(f.id))) : 0} views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Access</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{favoritesStats.averageAccess}</div>
              <p className="text-xs text-muted-foreground">views per product</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collections</CardTitle>
              <Folder className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collections.length}</div>
              <p className="text-xs text-muted-foreground">organized groups</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="favorites" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="favorites">My Favorites</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            {/* Filters and Controls */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex gap-4 items-center flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search favorites..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updated_at">Last Modified</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="created_at">Date Created</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 items-center">
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedFavorites.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">
                        {selectedFavorites.length} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllFavorites}
                      >
                        {selectedFavorites.length === favorites.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddToCollectionDialog(true)}
                      >
                        <Folder className="w-4 h-4 mr-2" />
                        Add to Collection
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          selectedFavorites.forEach(id => handleToggleFavorite(id))
                          setSelectedFavorites([])
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Favorites Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading favorites...</p>
                </div>
              </div>
            ) : filteredFavorites.length > 0 ? (
              <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                {filteredFavorites.map((favorite) => (
                  <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedFavorites.includes(Number(favorite.id))}
                            onChange={() => toggleFavoriteSelection(Number(favorite.id))}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{favorite.name}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleFavorite(Number(favorite.id))}
                                className="text-danger hover:text-danger"
                              >
                                <Heart className="w-4 h-4 fill-current" />
                              </Button>
                            </div>
                          <div className="flex items-center gap-2 mb-3">
                            {favorite.category && (
                              <Badge variant="outline">{favorite.category.name}</Badge>
                            )}
                            <Badge 
                              variant={favorite.status === "published" ? "default" : "secondary"}
                            >
                              {favorite.status}
                            </Badge>
                          </div>
                          {favorite.tags && favorite.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {favorite.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Created: {new Date(favorite.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Modified: {new Date(favorite.updated_at).toLocaleDateString()}
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <RouterLink to={`/products/${favorite.id}`}>
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </RouterLink>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <RouterLink to={`/products/${favorite.id}/edit`}>
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </RouterLink>
                        </Button>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium text-foreground mb-2">No favorites found</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || filterCategory !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Start favoriting products to see them here"
                    }
                  </p>
                  <Button asChild>
                    <RouterLink to="/products">
                      <Package className="w-4 h-4 mr-2" />
                      Browse Products
                    </RouterLink>
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Pagination */}
            {!loading && filteredFavorites.length > 0 && pagination.last_page > 1 && (
              <div className="flex items-center justify-between mt-8">
                <div className="text-sm text-muted-foreground">
                  Showing {((Number(pagination.current_page) - 1) * Number(pagination.per_page)) + 1} to {Math.min(Number(pagination.current_page) * Number(pagination.per_page), Number(pagination.total))} of {Number(pagination.total)} favorites
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                    disabled={pagination.current_page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {pagination.current_page} of {pagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                    disabled={pagination.current_page >= pagination.last_page}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            {loadingCollections ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading collections...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection: Collection) => (
                  <Card key={collection.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: collection.color }}
                        />
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCollection(collection)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCollection(collection.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{collection.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{collection.itemCount || collection.products_count || 0} products</span>
                        <span className="text-xs text-muted-foreground">
                          Created: {new Date(collection.created || collection.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Create New Collection Card */}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Card className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                        <Plus className="w-12 h-12 text-muted-foreground mb-4" />
                        <h4 className="font-medium mb-2">Create Collection</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Organize your favorites into custom collections
                        </p>
                        <Button>
                          <BookmarkPlus className="w-4 h-4 mr-2" />
                          New Collection
                        </Button>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Collection</DialogTitle>
                      <DialogDescription>
                        Create a new collection to organize your favorite products.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Collection Name</Label>
                        <Input
                          id="name"
                          value={newCollection.name}
                          onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter collection name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newCollection.description}
                          onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter collection description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="color">Color</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="color"
                            type="color"
                            value={newCollection.color}
                            onChange={(e) => setNewCollection(prev => ({ ...prev, color: e.target.value }))}
                            className="w-16 h-10"
                          />
                          <Palette className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{newCollection.color}</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCollection}>
                          Create Collection
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Edit Collection Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Collection</DialogTitle>
                  <DialogDescription>
                    Update the details of your collection.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Collection Name</Label>
                    <Input
                      id="edit-name"
                      value={newCollection.name}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter collection name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={newCollection.description}
                      onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter collection description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-color">Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="edit-color"
                        type="color"
                        value={newCollection.color}
                        onChange={(e) => setNewCollection(prev => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{newCollection.color}</span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowEditDialog(false)
                      setEditingCollection(null)
                      setNewCollection({ name: '', description: '', color: '#10b981' })
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateCollection}>
                      Update Collection
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>


          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(favoritesStats.categories).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{count}</span>
                          <div className="w-16 h-2 bg-muted rounded-full">
                            <div 
                              className="h-2 bg-primary rounded-full" 
                              style={{ width: `${(count / favoritesStats.totalFavorites) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Access Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle>Access Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Most Active Product</span>
                      <span className="font-medium">{favoritesStats.mostAccessed}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Access</span>
                      <span className="font-medium">{favoritesStats.averageAccess} views</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">This Week</span>
                      <span className="font-medium text-success">+{favoritesStats.thisWeekAdded} favorites</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {favorites.slice(0, 5).map((favorite) => (
                      <div key={favorite.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-danger" />
                          <div>
                            <span className="font-medium">{favorite.name}</span>
                            <p className="text-sm text-muted-foreground">
                              Added to favorites • {new Date(favorite.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{favorite.id} views</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add to Collection Dialog - Moved outside tabs */}
         <Dialog open={showAddToCollectionDialog} onOpenChange={setShowAddToCollectionDialog}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Add to Collection</DialogTitle>
               <DialogDescription>
                 Choose a collection to organize your selected favorites.
               </DialogDescription>
             </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select a collection to add {selectedFavorites.length} selected favorite{selectedFavorites.length > 1 ? 's' : ''}.
              </p>
              {collections.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No collections available. Create a collection first.
                  </p>
                  <Button onClick={() => {
                    setShowAddToCollectionDialog(false)
                    setShowCreateDialog(true)
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Collection
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {collections.map((collection) => (
                    <Button
                      key={collection.id}
                      variant="outline"
                      className="justify-start h-auto p-4 hover:bg-accent"
                      onClick={() => handleAddToCollection(collection.id.toString())}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: collection.color }}
                        />
                        <div className="text-left flex-1">
                          <div className="font-medium">{collection.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {collection.itemCount || collection.products_count || 0} products
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddToCollectionDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  )
}