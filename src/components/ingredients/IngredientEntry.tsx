import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ChefHat, Lightbulb, BarChart3, Upload, Search } from 'lucide-react';
import { useIngredients } from '@/hooks/useIngredients';
import { IngredientForm } from './IngredientForm';
import { IngredientList } from './IngredientList';
import { NotesModal } from './NotesModal';
import { BulkActions } from './BulkActions';
import { SearchFilter } from './SearchFilter';
import { Ingredient } from '@/types/ingredient';

export const IngredientEntry = () => {
  const [filteredIngredients, setFilteredIngredients] = useState<Ingredient[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'search' | 'bulk'>('list');
  
  const {
    ingredients,
    isLoading,
    editingItem,
    showNotesModal,
    selectedIngredient,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    reorderIngredients,
    openNotesModal,
    closeNotesModal,
    startEditing,
    stopEditing,
    addBulkIngredients,
  } = useIngredients();

  // Ensure ingredients is always an array to prevent filter errors
  const safeIngredients = Array.isArray(ingredients) ? ingredients : [];
  const safeFilteredIngredients = Array.isArray(filteredIngredients) ? filteredIngredients : [];

  const selectedIngredientData = selectedIngredient 
    ? safeIngredients.find(ing => ing.id === selectedIngredient) 
    : null;

  const handleFormSubmit = async (data: { name: string; quantity: number; unit: string }) => {
    await addIngredient(data);
  };

  const handleBulkImport = (newIngredients: Ingredient[]) => {
    addBulkIngredients(newIngredients);
  };
  
  const displayIngredients = currentView === 'search' && safeFilteredIngredients.length >= 0 
    ? safeFilteredIngredients 
    : safeIngredients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ingredient Management</h1>
            <p className="text-muted-foreground">
              Add, organize, and manage your product ingredients with automatic tagging and nutritional analysis.
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Auto-Tagging Enabled
          </Badge>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50 text-blue-900">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <strong>Smart Features:</strong> Ingredients are automatically analyzed for allergens and dietary tags. 
            Drag and drop to reorder, add internal notes, and use unit conversions for precise measurements.
          </AlertDescription>
        </Alert>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ChefHat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ingredients</p>
                <p className="text-2xl font-bold">{safeIngredients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auto-Tagged</p>
                <p className="text-2xl font-bold">
                  {safeIngredients.filter(ing => ing.tags && ing.tags.length > 0 || ing.allergens && ing.allergens.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With Notes</p>
                <p className="text-2xl font-bold">
                  {safeIngredients.filter(ing => ing.notes && ing.notes.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Allergens Found</p>
                <p className="text-2xl font-bold">
                  {new Set(safeIngredients.flatMap(ing => ing.allergens || [])).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Ingredient List
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search & Filter
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Actions
          </TabsTrigger>
        </TabsList>

        {/* Ingredient List Tab */}
        <TabsContent value="list" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ingredient List - Takes up 2 columns */}
            <div className="lg:col-span-2">
              <IngredientList
                ingredients={displayIngredients}
                isLoading={isLoading}
                editingItem={editingItem}
                onEdit={() => {}}
                onDelete={deleteIngredient}
                onUpdate={updateIngredient}
                onReorder={reorderIngredients}
                onStartEdit={startEditing}
                onStopEdit={stopEditing}
                onOpenNotes={openNotesModal}
              />
            </div>

            {/* Add Form - Takes up 1 column */}
            <div className="lg:col-span-1">
              <IngredientForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
              />
            </div>
          </div>
        </TabsContent>

        {/* Search & Filter Tab */}
        <TabsContent value="search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Search Controls */}
            <div className="lg:col-span-1">
              <SearchFilter
                ingredients={safeIngredients}
                onFilteredIngredientsChange={setFilteredIngredients}
              />
            </div>
            
            {/* Filtered Results */}
            <div className="lg:col-span-3">
              <IngredientList
                ingredients={filteredIngredients}
                isLoading={isLoading}
                editingItem={editingItem}
                onEdit={() => {}}
                onDelete={deleteIngredient}
                onUpdate={updateIngredient}
                onReorder={reorderIngredients}
                onStartEdit={startEditing}
                onStopEdit={stopEditing}
                onOpenNotes={openNotesModal}
              />
            </div>
          </div>
        </TabsContent>

        {/* Bulk Actions Tab */}
        <TabsContent value="bulk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BulkActions
              onImportComplete={handleBulkImport}
              totalIngredients={safeIngredients.length}
            />
            
            {/* Recent Imports Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Import Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">CSV Format Requirements:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Header row: name, quantity, unit, notes</li>
                      <li>• Name: Required text field</li>
                      <li>• Quantity: Required number (decimal allowed)</li>
                      <li>• Unit: Must match supported units (g, kg, oz, etc.)</li>
                      <li>• Notes: Optional text field</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Auto-Processing Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Automatic allergen detection</li>
                      <li>• Dietary tag assignment</li>
                      <li>• Nutritional analysis (when available)</li>
                      <li>• Duplicate detection and merging</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Notes Modal */}
      <NotesModal
        isOpen={showNotesModal}
        onClose={closeNotesModal}
        ingredient={selectedIngredientData}
        onSave={(id, updates) => updateIngredient(id, updates)}
      />
    </div>
  );
};