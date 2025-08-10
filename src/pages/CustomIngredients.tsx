import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  MoreHorizontal,
  Package,
  Loader2,
  AlertCircle,
  ChefHat
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CustomIngredientApi, CustomIngredientData } from '@/services/customIngredientApi';
import { useToast } from '@/hooks/use-toast';

export default function CustomIngredients() {
  console.log('🔍 [CustomIngredients] Component rendering/re-rendering');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [ingredients, setIngredients] = useState<CustomIngredientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState<CustomIngredientData | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load ingredients function
  const loadIngredients = async () => {
    try {
      console.log('🔍 [CustomIngredients] Starting loadIngredients...');
      setLoading(true);
      const response = await CustomIngredientApi.getCustomIngredients({
        search: searchQuery || undefined,
        per_page: 100 // Load all for now
      });

      console.log('🔍 [CustomIngredients] Full API response:', response);
      console.log('🔍 [CustomIngredients] Array.isArray(response):', Array.isArray(response));

      // The API interceptor returns response.data directly, so response is already the data array
      if (Array.isArray(response) && response.length > 0) {
        console.log('🔍 [CustomIngredients] Response is array with length:', response.length);
        setIngredients(response);
      } else if (Array.isArray(response)) {
        console.log('🔍 [CustomIngredients] Response is empty array');
        setIngredients([]);
      } else {
        console.log('🔍 [CustomIngredients] Response is not an array, setting empty array');
        setIngredients([]);
      }
    } catch (error: any) {
      console.error('Error loading ingredients:', error);
      toast({
        title: "Error",
        description: "Failed to load custom ingredients",
        variant: "destructive"
      });
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  };

  // Component mount/unmount debugging and prevent duplicate calls
  useEffect(() => {
    console.log('🔍 [CustomIngredients] Component mounted');
    let isMounted = true;

    const loadData = async () => {
      if (isMounted) {
        console.log('🔍 [CustomIngredients] useEffect triggered with searchQuery:', searchQuery);
        await loadIngredients();
      }
    };

    loadData();

    return () => {
      console.log('🔍 [CustomIngredients] Component unmounting');
      isMounted = false;
    };
  }, [searchQuery]);

  const handleEdit = (ingredient: CustomIngredientData) => {
    navigate(`/ingredients/edit/${ingredient.id}`);
  };

  const handleDelete = async () => {
    if (!ingredientToDelete) return;

    setDeleting(true);
    try {
      await CustomIngredientApi.deleteCustomIngredient(ingredientToDelete.id!);
      
      toast({
        title: "✅ Deleted",
        description: `"${ingredientToDelete.name}" has been deleted successfully`,
      });

      // Refresh the list
      await loadIngredients();
      
      setDeleteDialogOpen(false);
      setIngredientToDelete(null);
    } catch (error: any) {
      console.error('Error deleting ingredient:', error);
      toast({
        title: "Error",
        description: "Failed to delete ingredient",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsageColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 text-gray-600';
    if (count <= 2) return 'bg-blue-100 text-blue-700';
    if (count <= 5) return 'bg-green-100 text-green-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients by name or brand..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {(() => {
            console.log('🔍 [CustomIngredients] Rendering results summary - ingredients.length:', ingredients.length);
            console.log('🔍 [CustomIngredients] Rendering results summary - ingredients:', ingredients);
            console.log('🔍 [CustomIngredients] Rendering results summary - loading:', loading);
            return ingredients.length > 0 ? (
              `Showing ${ingredients.length} custom ingredient${ingredients.length !== 1 ? 's' : ''}`
            ) : (
              "No custom ingredients found"
            );
          })()}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading ingredients...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your custom ingredients</p>
          </div>
        </Card>
      )}

      {/* Ingredients Grid */}
      {!loading && ingredients.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ingredients.map((ingredient) => (
            <Card key={ingredient.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{ingredient.name}</CardTitle>
                    {ingredient.brand && (
                      <p className="text-sm text-muted-foreground truncate">{ingredient.brand}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(ingredient)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setIngredientToDelete(ingredient);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Description */}
                  {ingredient.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ingredient.description}
                    </p>
                  )}

                  {/* Serving Size */}
                  <div className="text-xs text-muted-foreground">
                    Serving: {ingredient.serving_size}{ingredient.serving_unit}
                  </div>

                  {/* Usage Count */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Used in recipes:</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getUsageColor(ingredient.usage_count || 0)}`}
                    >
                      {ingredient.usage_count || 0}
                    </Badge>
                  </div>

                  {/* Created Date */}
                  {ingredient.created_at && (
                    <div className="text-xs text-muted-foreground">
                      Created: {formatDate(ingredient.created_at)}
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={ingredient.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ingredient.status || 'active'}
                    </Badge>
                    {ingredient.is_public && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && ingredients.length === 0 && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No custom ingredients found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by creating your first custom ingredient"
              }
            </p>
            <Button onClick={() => navigate('/ingredients/create')} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Ingredient
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete Custom Ingredient
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{ingredientToDelete?.name}"</strong>?
              {ingredientToDelete?.usage_count && ingredientToDelete.usage_count > 0 && (
                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
                  ⚠️ This ingredient is currently used in {ingredientToDelete.usage_count} recipe{ingredientToDelete.usage_count !== 1 ? 's' : ''}. 
                  Deleting it may affect those recipes.
                </div>
              )}
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}