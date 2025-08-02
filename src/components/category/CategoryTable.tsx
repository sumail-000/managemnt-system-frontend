import { useState } from "react"
import { Search, MoreHorizontal, Edit, Trash2, Tag, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Category } from "@/types/category"
import { formatDistanceToNow } from "date-fns"

interface CategoryTableProps {
  categories: Category[]
  loading: boolean
  isEmpty: boolean
  searchTerm: string
  onSearchChange: (value: string) => void
  onSearch: () => void
  onClearSearch: () => void
  onRefresh: () => void
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onCreateClick: () => void
}

export function CategoryTable({
  categories,
  loading,
  isEmpty,
  searchTerm,
  onSearchChange,
  onSearch,
  onClearSearch,
  onRefresh,
  onEdit,
  onDelete,
  onCreateClick
}: CategoryTableProps) {
  // Categories are already filtered by backend search
  const filteredCategories = categories

  if (loading) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Loading categories...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isEmpty) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Tag className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No categories found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {searchTerm 
                ? `No categories match "${searchTerm}". Try adjusting your search.`
                : "You haven't created any categories yet. Create your first category to get started."
              }
            </p>
            {!searchTerm && (
              <Button onClick={onCreateClick} className="btn-gradient">
                <Plus className="mr-2 h-4 w-4" />
                Create your first category
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">Categories</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage and organize your product categories
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSearch()
                }
              }}
              className="pl-10 bg-muted/30 border-border/50 focus:bg-background transition-colors"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              onClick={onSearch}
              disabled={loading}
              className="btn-gradient"
            >
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            {searchTerm && (
              <Button 
                variant="outline"
                onClick={onClearSearch}
                disabled={loading}
                className="border-border/50 hover:bg-muted/50"
              >
                Clear
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={loading}
              className="border-border/50 hover:bg-muted/50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/50 border-border/50">
                  <TableHead className="font-semibold text-foreground">Name</TableHead>
                  <TableHead className="font-semibold text-foreground">Created</TableHead>
                  <TableHead className="font-semibold text-foreground">Products</TableHead>
                  <TableHead className="w-[100px] font-semibold text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-muted/30 transition-colors border-border/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-foreground">{category.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(category.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                        {category.products_count || 0} products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-muted/50"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border/50">
                          <DropdownMenuItem 
                            onClick={() => onEdit(category)}
                            className="hover:bg-muted/50"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(category)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {categories.map((category) => (
            <Card key={category.id} className="border-border/50 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{category.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="bg-success/10 text-success border-success/20 text-xs">
                          {category.products_count || 0} products
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(category.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-muted/50"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border/50">
                      <DropdownMenuItem 
                        onClick={() => onEdit(category)}
                        className="hover:bg-muted/50"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(category)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}