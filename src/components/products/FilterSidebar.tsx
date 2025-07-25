import { useState } from "react"
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronRight,
  Tag,
  Calendar,
  Package
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible"

interface Category {
  id: string
  name: string
  count?: number
}

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    categories: string[]
    statuses: string[]
    tags: string[]
    dateRange: { from?: Date; to?: Date }
    pinnedOnly: boolean
  }
  onFiltersChange: (filters: FilterSidebarProps['filters']) => void
  onClearFilters: () => void
  availableCategories?: Category[]
  availableTags?: string[]
  loading?: boolean
}

// Use provided categories and tags, fallback to mock data
const mockCategories = [
  { name: "Dairy", count: 23 },
  { name: "Snacks", count: 45 },
  { name: "Oils", count: 12 },
  { name: "Spreads", count: 18 },
  { name: "Beverages", count: 34 },
  { name: "Grains", count: 29 }
]

const mockTags = [
  { name: "Organic", count: 67 },
  { name: "Gluten Free", count: 45 },
  { name: "High Protein", count: 32 },
  { name: "Vegan", count: 28 },
  { name: "Low Sugar", count: 24 },
  { name: "Natural", count: 19 },
  { name: "Premium", count: 15 },
  { name: "Whole Grain", count: 13 }
]

export function FilterSidebar({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange, 
  onClearFilters,
  availableCategories = [],
  availableTags = [],
  loading = false
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    status: true,
    tags: true,
    date: false
  })

  // Define categories and tags inside the component to access props
  const categories = availableCategories.length > 0 
    ? availableCategories
    : mockCategories

  const tags = availableTags.length > 0
    ? availableTags.map(name => ({ name, count: 0 }))
    : mockTags

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, categoryId]
      : filters.categories.filter(c => c !== categoryId)
    
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...filters.tags, tag]
      : filters.tags.filter(t => t !== tag)
    
    onFiltersChange({ ...filters, tags: newTags })
  }

  const clearAllFilters = () => {
    onClearFilters()
  }

  const getActiveFiltersCount = () => {
    return filters.categories.length + 
           filters.statuses.length + 
           filters.tags.length + 
           (filters.pinnedOnly ? 1 : 0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-black/50 lg:hidden" 
        onClick={onClose}
      />
      
      <Card className="absolute right-0 top-0 h-full w-80 lg:relative lg:w-full lg:h-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 px-2 text-xs"
              disabled={loading}
            >
              Clear all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Pinned Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pinned"
              checked={filters.pinnedOnly}
              onCheckedChange={(checked) => 
                onFiltersChange({ ...filters, pinnedOnly: !!checked })
              }
              disabled={loading}
            />
            <Label htmlFor="pinned" className="text-sm font-medium cursor-pointer">
              Show pinned products only
            </Label>
          </div>

          <Separator />

          {/* Categories */}
          <Collapsible 
            open={expandedSections.categories}
            onOpenChange={() => toggleSection('categories')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium">Categories</span>
                {expandedSections.categories ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {categories.map((category) => (
                <div key={category.id || category.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category.id || category.name}`}
                      checked={filters.categories.includes(category.id || category.name)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category.id || category.name, !!checked)
                      }
                      disabled={loading}
                    />
                    <Label 
                      htmlFor={`category-${category.id || category.name}`}
                      className="text-sm cursor-pointer"
                    >
                      {category.name}
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {category.count || 0}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Status */}
          <Collapsible 
            open={expandedSections.status}
            onOpenChange={() => toggleSection('status')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium">Status</span>
                {expandedSections.status ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {["Published", "Draft"].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={(checked) => {
                      const newStatuses = checked
                        ? [...filters.statuses, status]
                        : filters.statuses.filter(s => s !== status)
                      onFiltersChange({ ...filters, statuses: newStatuses })
                    }}
                    disabled={loading}
                  />
                  <Label 
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer"
                  >
                    {status}
                  </Label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Tags */}
          <Collapsible 
            open={expandedSections.tags}
            onOpenChange={() => toggleSection('tags')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <span className="font-medium">Tags</span>
                {expandedSections.tags ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div className="max-h-48 overflow-y-auto space-y-2">
                {tags.map((tag) => (
                  <div key={tag.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.name}`}
                        checked={filters.tags.includes(tag.name)}
                        onCheckedChange={(checked) => 
                          handleTagChange(tag.name, !!checked)
                        }
                        disabled={loading}
                      />
                      <Label 
                        htmlFor={`tag-${tag.name}`}
                        className="text-sm cursor-pointer"
                      >
                        {tag.name}
                      </Label>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {tag.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  )
}