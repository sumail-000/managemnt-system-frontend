import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
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
  Copy,
  Trash2,
  Download,
  Share2,
  Folder,
  Calendar,
  TrendingUp,
  Package,
  FileText,
  BarChart3,
  Clock,
  Users,
  Archive,
  BookmarkPlus,
  Crown,
  ChefHat,
  Tag
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Link as RouterLink } from "react-router-dom"

interface FavoriteProduct {
  id: number
  name: string
  category: string
  type: string
  dateAdded: string
  lastModified: string
  isFavorited: boolean
  accessCount: number
  tags: string[]
  status: "published" | "draft" | "archived"
  thumbnailUrl?: string
}

interface Collection {
  id: number
  name: string
  description: string
  itemCount: number
  created: string
  color: string
}

export default function Favorites() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("dateAdded")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null)

  // Mock favorites data - in real app this would come from API
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([
    {
      id: 1,
      name: "Organic Almond Butter",
      category: "Spreads",
      type: "product",
      dateAdded: "2024-01-20",
      lastModified: "2024-01-22",
      isFavorited: true,
      accessCount: 15,
      tags: ["organic", "premium", "bestseller"],
      status: "published"
    },
    {
      id: 2,
      name: "Quinoa Energy Bar",
      category: "Snacks",
      type: "product", 
      dateAdded: "2024-01-18",
      lastModified: "2024-01-21",
      isFavorited: true,
      accessCount: 8,
      tags: ["healthy", "protein", "gluten-free"],
      status: "published"
    },
    {
      id: 3,
      name: "Cold Brew Coffee",
      category: "Beverages",
      type: "product",
      dateAdded: "2024-01-15",
      lastModified: "2024-01-20",
      isFavorited: true,
      accessCount: 23,
      tags: ["organic", "fair-trade", "caffeine"],
      status: "draft"
    },
    {
      id: 4,
      name: "Mediterranean Pasta Sauce",
      category: "Sauces",
      type: "product",
      dateAdded: "2024-01-12",
      lastModified: "2024-01-19",
      isFavorited: true,
      accessCount: 12,
      tags: ["mediterranean", "herbs", "vegan"],
      status: "published"
    }
  ])

  // Mock collections
  const [collections] = useState<Collection[]>([
    {
      id: 1,
      name: "Top Sellers",
      description: "Best performing products",
      itemCount: 8,
      created: "2024-01-10",
      color: "#10b981"
    },
    {
      id: 2,
      name: "New Launches",
      description: "Recently released products",
      itemCount: 5,
      created: "2024-01-15",
      color: "#3b82f6"
    },
    {
      id: 3,
      name: "Organic Line",
      description: "All organic certified products",
      itemCount: 12,
      created: "2024-01-05",
      color: "#8b5cf6"
    }
  ])

  // Favorites analytics
  const favoritesStats = {
    totalFavorites: favorites.length,
    thisWeekAdded: 3,
    mostAccessed: "Cold Brew Coffee",
    averageAccess: Math.round(favorites.reduce((acc, fav) => acc + fav.accessCount, 0) / favorites.length),
    categories: {
      "Spreads": 1,
      "Snacks": 1,
      "Beverages": 1,
      "Sauces": 1
    }
  }

  // Filter and sort favorites
  const filteredFavorites = favorites
    .filter(fav => {
      const matchesSearch = fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           fav.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           fav.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = filterCategory === "all" || fav.category === filterCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "dateAdded":
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
        case "lastModified":
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
        case "accessCount":
          return b.accessCount - a.accessCount
        default:
          return 0
      }
    })

  const handleToggleFavorite = (productId: number) => {
    setFavorites(prev =>
      prev.map(fav =>
        fav.id === productId
          ? { ...fav, isFavorited: !fav.isFavorited }
          : fav
      )
    )

    toast({
      title: "Updated!",
      description: "Product favorite status updated."
    })
  }

  const handleBulkAction = (action: string, selectedIds: number[]) => {
    switch (action) {
      case "remove":
        setFavorites(prev => prev.filter(fav => !selectedIds.includes(fav.id)))
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

  const handleCreateCollection = () => {
    toast({
      title: "Collection Created",
      description: "New collection has been created successfully."
    })
  }

  const handleExportFavorites = () => {
    toast({
      title: "Export Started",
      description: "Your favorites list is being exported."
    })
  }

  return (
    <div className="flex-1">
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
            <Button variant="gradient" onClick={handleCreateCollection}>
              <Plus className="w-4 h-4 mr-2" />
              New Collection
            </Button>
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
                {Math.max(...favorites.map(f => f.accessCount))} views
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
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="Spreads">Spreads</SelectItem>
                        <SelectItem value="Snacks">Snacks</SelectItem>
                        <SelectItem value="Beverages">Beverages</SelectItem>
                        <SelectItem value="Sauces">Sauces</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dateAdded">Date Added</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="lastModified">Last Modified</SelectItem>
                        <SelectItem value="accessCount">Most Accessed</SelectItem>
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

            {/* Favorites Grid/List */}
            {filteredFavorites.length > 0 ? (
              <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
                {filteredFavorites.map((favorite) => (
                  <Card key={favorite.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{favorite.name}</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFavorite(favorite.id)}
                              className="text-danger hover:text-danger"
                            >
                              <Heart className={`w-4 h-4 ${favorite.isFavorited ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{favorite.category}</Badge>
                            <Badge 
                              variant={favorite.status === "published" ? "default" : "secondary"}
                            >
                              {favorite.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {favorite.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Added: {new Date(favorite.dateAdded).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Modified: {new Date(favorite.lastModified).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {favorite.accessCount} views
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
                        <Button variant="outline" size="sm">
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-3 h-3 mr-1" />
                          Label
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
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: collection.color }}
                      />
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{collection.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{collection.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{collection.itemCount} products</span>
                      <span className="text-xs text-muted-foreground">
                        Created: {new Date(collection.created).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Create New Collection Card */}
              <Card className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <Plus className="w-12 h-12 text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-2">Create Collection</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Organize your favorites into custom collections
                  </p>
                  <Button onClick={handleCreateCollection}>
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    New Collection
                  </Button>
                </CardContent>
              </Card>
            </div>
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
                              Added to favorites • {new Date(favorite.dateAdded).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{favorite.accessCount} views</Badge>
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