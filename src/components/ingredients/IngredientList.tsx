import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { List, Package } from 'lucide-react';
import { Ingredient } from '@/types/ingredient';
import { IngredientCard } from './IngredientCard';

interface IngredientListProps {
  ingredients: Ingredient[];
  isLoading: boolean;
  editingItem: string | null;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Ingredient>) => void;
  onReorder: (reorderedIngredients: Ingredient[]) => void;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
  onOpenNotes: (id: string) => void;
}

export const IngredientList = ({
  ingredients,
  isLoading,
  editingItem,
  onEdit,
  onDelete,
  onUpdate,
  onReorder,
  onStartEdit,
  onStopEdit,
  onOpenNotes,
}: IngredientListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = ingredients.findIndex((item) => item.id === active.id);
      const newIndex = ingredients.findIndex((item) => item.id === over.id);

      const reorderedIngredients = arrayMove(ingredients, oldIndex, newIndex);
      onReorder(reorderedIngredients);
    }
  };

  const totalQuantity = ingredients.length;
  const totalWeight = ingredients.reduce((sum, ingredient) => {
    // Simple weight calculation (convert everything to grams for demo)
    const grams = ingredient.unit === 'kg' ? ingredient.quantity * 1000 :
                 ingredient.unit === 'mg' ? ingredient.quantity / 1000 :
                 ingredient.unit === 'oz' ? ingredient.quantity * 28.35 :
                 ingredient.unit === 'lb' ? ingredient.quantity * 453.59 :
                 ingredient.unit === 'g' ? ingredient.quantity : 0;
    return sum + grams;
  }, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Ingredient List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <List className="h-5 w-5" />
            Ingredient List
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {totalQuantity} items
            </Badge>
            {totalWeight > 0 && (
              <Badge variant="outline" className="text-xs">
                ~{(totalWeight / 1000).toFixed(2)} kg total
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {ingredients.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No ingredients yet</h3>
            <p className="text-muted-foreground">
              Add your first ingredient using the form on the right to get started.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={ingredients.map(ingredient => ingredient.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {ingredients
                  .sort((a, b) => a.order - b.order)
                  .map((ingredient) => (
                    <IngredientCard
                      key={ingredient.id}
                      ingredient={ingredient}
                      isEditing={editingItem === ingredient.id}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onUpdate={onUpdate}
                      onStartEdit={onStartEdit}
                      onStopEdit={onStopEdit}
                      onOpenNotes={onOpenNotes}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};