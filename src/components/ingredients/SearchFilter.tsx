import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import { Ingredient, UNITS } from '@/types/ingredient';

interface SearchFilterProps {
  ingredients: Ingredient[];
  onFilteredIngredientsChange: (ingredients: Ingredient[]) => void;
}

interface FilterState {
  searchQuery: string;
  selectedUnit: string;
  selectedAllergens: string[];
  selectedTags: string[];
  sortBy: 'name' | 'quantity' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  showNotesOnly: boolean;
}

export const SearchFilter = ({ ingredients, onFilteredIngredientsChange }: SearchFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedUnit: '',
    selectedAllergens: [],
    selectedTags: [],
    sortBy: 'name',
    sortOrder: 'asc',
    showNotesOnly: false,
  });

  // Get unique allergens and tags from all ingredients
  const availableAllergens = useMemo(() => {
    const allergens = new Set<string>();
    ingredients.forEach(ingredient => {
      ingredient.allergens.forEach(allergen => allergens.add(allergen));
    });
    return Array.from(allergens).sort();
  }, [ingredients]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    ingredients.forEach(ingredient => {
      ingredient.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [ingredients]);

  // Filter and sort ingredients based on current filters
  const filteredIngredients = useMemo(() => {
    let filtered = [...ingredients];

    // Search by name
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(ingredient =>
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.notes?.toLowerCase().includes(query)
      );
    }

    // Filter by unit
    if (filters.selectedUnit) {
      filtered = filtered.filter(ingredient => ingredient.unit === filters.selectedUnit);
    }

    // Filter by allergens
    if (filters.selectedAllergens.length > 0) {
      filtered = filtered.filter(ingredient =>
        filters.selectedAllergens.some(allergen =>
          ingredient.allergens.includes(allergen)
        )
      );
    }

    // Filter by tags
    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter(ingredient =>
        filters.selectedTags.some(tag =>
          ingredient.tags.includes(tag)
        )
      );
    }

    // Filter by notes
    if (filters.showNotesOnly) {
      filtered = filtered.filter(ingredient => ingredient.notes && ingredient.notes.length > 0);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [ingredients, filters]);

  // Update parent component when filtered ingredients change
  useEffect(() => {
    onFilteredIngredientsChange(filteredIngredients);
  }, [filteredIngredients, onFilteredIngredientsChange]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleAllergen = (allergen: string) => {
    setFilters(prev => ({
      ...prev,
      selectedAllergens: prev.selectedAllergens.includes(allergen)
        ? prev.selectedAllergens.filter(a => a !== allergen)
        : [...prev.selectedAllergens, allergen]
    }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      selectedUnit: '',
      selectedAllergens: [],
      selectedTags: [],
      sortBy: 'name',
      sortOrder: 'asc',
      showNotesOnly: false,
    });
  };

  const hasActiveFilters = filters.searchQuery || 
    filters.selectedUnit || 
    filters.selectedAllergens.length > 0 || 
    filters.selectedTags.length > 0 || 
    filters.showNotesOnly;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ingredients or notes..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={filters.selectedUnit}
            onValueChange={(value) => updateFilter('selectedUnit', value === 'all' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All units</SelectItem>
              {UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={filters.showNotesOnly ? "default" : "outline"}
            onClick={() => updateFilter('showNotesOnly', !filters.showNotesOnly)}
            className="justify-start"
          >
            <Filter className="h-4 w-4 mr-2" />
            With Notes Only
          </Button>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) => updateFilter('sortBy', value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="quantity">Sort by Quantity</SelectItem>
              <SelectItem value="createdAt">Sort by Created Date</SelectItem>
              <SelectItem value="updatedAt">Sort by Updated Date</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3"
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Allergen Filters */}
        {availableAllergens.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Filter by Allergens:</h4>
            <div className="flex flex-wrap gap-1">
              {availableAllergens.map((allergen) => (
                <Badge
                  key={allergen}
                  variant={filters.selectedAllergens.includes(allergen) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleAllergen(allergen)}
                >
                  ⚠️ {allergen}
                  {filters.selectedAllergens.includes(allergen) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Dietary Tag Filters */}
        {availableTags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Filter by Tags:</h4>
            <div className="flex flex-wrap gap-1">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {filters.selectedTags.includes(tag) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredIngredients.length} of {ingredients.length} ingredients
          </span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="text-xs">
              {Object.values(filters).filter(Boolean).length} filters active
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};