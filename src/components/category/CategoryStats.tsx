import { Tag, Calendar, Search, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Category } from "@/types/category"

interface CategoryStatsProps {
  categories: Category[]
  filteredCategories: Category[]
  searchTerm: string
}

export function CategoryStats({ categories, filteredCategories, searchTerm }: CategoryStatsProps) {
  const recentCategories = categories.filter(cat => {
    const createdAt = new Date(cat.created_at)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return createdAt > dayAgo
  }).length

  const totalProducts = categories.reduce((sum, cat) => sum + (cat.products_count || 0), 0)

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="card-elevated hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Categories</CardTitle>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Tag className="h-4 w-4 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{categories.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredCategories.length !== categories.length && 
              `${filteredCategories.length} filtered`
            }
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-elevated hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Recent</CardTitle>
          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-accent" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{recentCategories}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Added in last 24h
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-elevated hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{totalProducts}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across all categories
          </p>
        </CardContent>
      </Card>
      
      <Card className="card-elevated hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Search Results</CardTitle>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{filteredCategories.length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {searchTerm ? `Matching "${searchTerm}"` : "All categories"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}