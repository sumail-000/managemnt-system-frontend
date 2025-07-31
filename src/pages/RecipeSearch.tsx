import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  ChefHat,
  Heart,
  Star,
  Utensils,
  Flame,
  Leaf,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  RefreshCw,
  Copy,
  Download
} from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { edamamAPI } from '../services/api'
import { 
  Recipe, 
  RecipeSearchResponse, 
  transformRecipeFromAPI, 
  transformSearchParamsToAPI,
  RecipeFiltersResponse 
} from '../types/recipe'



const dietTypes = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo']
const cuisineTypes = ['All', 'Mediterranean', 'Thai', 'Italian', 'American', 'Mexican', 'Fusion']
const difficultyLevels = ['All', 'Easy', 'Medium', 'Hard']
const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Rating' },
  { value: 'calories', label: 'Calories' },
  { value: 'cookTime', label: 'Cook Time' },
  { value: 'name', label: 'Name' }
]

export default function RecipeSearch() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDiet, setSelectedDiet] = useState('All')
  const [selectedCuisine, setSelectedCuisine] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [sortBy, setSortBy] = useState('relevance')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null)
  const recipesPerPage = 20

  // Search recipes from API
   const searchRecipes = async (query: string = searchQuery, page: number = 1) => {
     if (!query.trim()) {
       setRecipes([])
       setFilteredRecipes([])
       setTotalResults(0)
       return
     }

     setLoading(true)
     setError(null)

     try {
       const searchParams = transformSearchParamsToAPI({
          query: query,
          diet: selectedDiet !== 'All' ? selectedDiet : undefined,
          cuisine: selectedCuisine !== 'All' ? selectedCuisine : undefined,
          difficulty: selectedDifficulty !== 'All' ? selectedDifficulty : undefined,
          limit: recipesPerPage,
          page: page
        })

        const axiosResponse = await edamamAPI.recipe.search(query, searchParams)
        const response = axiosResponse.data as RecipeSearchResponse
       
       // Handle the nested response structure from backend
       const recipes = response.data?.data || response.recipes || []
       const transformedRecipes = recipes.map(recipe => transformRecipeFromAPI(recipe))
       
       if (page === 1) {
         setRecipes(transformedRecipes)
         setFilteredRecipes(transformedRecipes)
       } else {
         setRecipes(prev => [...prev, ...transformedRecipes])
         setFilteredRecipes(prev => [...prev, ...transformedRecipes])
       }
       
       // Handle different response structures for pagination
       const totalResults = response.data?.meta?.total || response.pagination?.total || 0
       const hasMore = response.data?.pagination?.has_more || response.pagination?.has_more || false
       
       setTotalResults(totalResults)
       setNextPageUrl(hasMore ? 'next' : null)
       
       toast({
         title: "Search completed",
         description: `Found ${totalResults} recipes matching your criteria.`
       })
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'Failed to search recipes'
       setError(errorMessage)
       toast({
         title: "Search failed",
         description: errorMessage,
         variant: "destructive"
       })
     } finally {
       setLoading(false)
     }
   }

  // Filter and sort logic for client-side filtering
  useEffect(() => {
    let filtered = [...recipes]

    // Apply client-side sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'calories':
          return (a.calories || 0) - (b.calories || 0)
        case 'cookTime':
          return (a.cookTime || 0) - (b.cookTime || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    setFilteredRecipes(filtered)
  }, [sortBy, recipes])

  // Pagination
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage)
  const startIndex = (currentPage - 1) * recipesPerPage
  const endIndex = startIndex + recipesPerPage
  const currentRecipes = filteredRecipes.slice(startIndex, endIndex)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    searchRecipes(searchQuery, 1)
  }

  const loadMoreRecipes = () => {
    if (nextPageUrl && !loading) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      searchRecipes(searchQuery, nextPage)
    }
  }

  // Trigger search when filters change
  useEffect(() => {
    if (searchQuery.trim()) {
      setCurrentPage(1)
      searchRecipes(searchQuery, 1)
    }
  }, [selectedDiet, selectedCuisine])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedDiet('All')
    setSelectedCuisine('All')
    setSelectedDifficulty('All')
    setSortBy('relevance')
    setRecipes([])
    setFilteredRecipes([])
    setError(null)
    setTotalResults(0)
    setNextPageUrl(null)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Copy ingredients to clipboard
  const copyIngredients = async (ingredients: string[], recipeName: string) => {
    try {
      const ingredientText = ingredients.join('\n')
      await navigator.clipboard.writeText(ingredientText)
      toast({
        title: "Ingredients copied!",
        description: `Ingredients for ${recipeName} copied to clipboard.`
      })
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Failed to copy ingredients to clipboard.",
        variant: "destructive"
      })
    }
  }

  // Download ingredients as JSON
  const downloadIngredients = (ingredients: string[], recipeName: string) => {
    try {
      const data = {
        recipeName,
        ingredients,
        downloadedAt: new Date().toISOString()
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${recipeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ingredients.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({
        title: "Download started!",
        description: `Ingredients for ${recipeName} downloaded as JSON.`
      })
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Failed to download ingredients.",
        variant: "destructive"
      })
    }
  }

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
        <div className="relative overflow-hidden rounded-t-lg">
          {recipe.image ? (
            <img 
              src={recipe.image} 
              alt={recipe.name}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${recipe.image ? 'hidden' : ''}`}>
            <ChefHat className="w-12 h-12 text-gray-400" />
          </div>
          <div className="absolute top-2 right-2 flex gap-1">
            <Badge className={getDifficultyColor(recipe.difficulty)}>
              {recipe.difficulty}
            </Badge>
          </div>
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {recipe.rating}
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {recipe.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {recipe.description}
              </p>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {recipe.calories} cal
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {recipe.cookTime} min
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {recipe.servings} servings
              </div>
            </div>
            
            {recipe.diet.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.diet.map((dietType) => (
                  <Badge key={dietType} variant="outline" className="text-xs">
                    <Leaf className="w-3 h-3 mr-1" />
                    {dietType}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <ChefHat className="w-4 h-4" />
                  Ingredients ({recipe.ingredients.length})
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      copyIngredients(recipe.ingredients, recipe.name)
                    }}
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadIngredients(recipe.ingredients, recipe.name)
                    }}
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {recipe.ingredients.join(', ')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const RecipeListItem = ({ recipe }: { recipe: Recipe }) => {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {recipe.image ? (
                <img 
                  src={recipe.image} 
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full flex items-center justify-center ${recipe.image ? 'hidden' : ''}`}>
                <ChefHat className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                    {recipe.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {recipe.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {recipe.rating}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {recipe.calories} cal
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {recipe.cookTime} min
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {recipe.servings} servings
                </div>
                <Badge className={getDifficultyColor(recipe.difficulty)}>
                  {recipe.difficulty}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {recipe.diet.map((dietType) => (
                  <Badge key={dietType} variant="outline" className="text-xs">
                    <Leaf className="w-3 h-3 mr-1" />
                    {dietType}
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <ChefHat className="w-4 h-4" />
                    Ingredients ({recipe.ingredients.length})
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyIngredients(recipe.ingredients, recipe.name)
                      }}
                      className="h-6 w-6 p-0 hover:bg-primary/10"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadIngredients(recipe.ingredients, recipe.name)
                      }}
                      className="h-6 w-6 p-0 hover:bg-primary/10"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {recipe.ingredients.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex-1">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-primary" />
              Recipe Search
            </h1>
            <p className="text-muted-foreground">
              Discover delicious recipes with comprehensive nutritional information and ingredient details.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search recipes by name, ingredients, or dietary preferences"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Search
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error loading recipes</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => searchRecipes()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : loading && filteredRecipes.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredRecipes.length === 0 && searchQuery.trim() ? (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters to find more recipes.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : filteredRecipes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start your recipe search</h3>
              <p className="text-muted-foreground mb-4">
                Enter ingredients, recipe names, or dietary preferences to discover delicious recipes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecipes.map((recipe) => (
                  <RecipeListItem key={recipe.id} recipe={recipe} />
                ))}
              </div>
            )}
            
            {/* Load More Button */}
            {nextPageUrl && (
              <div className="flex justify-center pt-6">
                <Button 
                  onClick={loadMoreRecipes} 
                  disabled={loading}
                  variant="outline"
                  size="lg"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Load More Recipes
                </Button>
              </div>
            )}
            
            {/* Results Summary */}
            <div className="text-center text-sm text-muted-foreground pt-4">
              Showing {filteredRecipes.length} of {totalResults} recipes
            </div>
          </>
        )}
      </div>
    </div>
  )
}