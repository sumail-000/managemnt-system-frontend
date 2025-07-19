import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Edit3, Trash2, FileText, Save, X } from 'lucide-react';
import { Ingredient, UNITS } from '@/types/ingredient';
import { TagDisplay } from './TagDisplay';

interface IngredientCardProps {
  ingredient: Ingredient;
  isEditing: boolean;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Ingredient>) => void;
  onStartEdit: (id: string) => void;
  onStopEdit: () => void;
  onOpenNotes: (id: string) => void;
}

export const IngredientCard = ({
  ingredient,
  isEditing,
  onEdit,
  onDelete,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onOpenNotes,
}: IngredientCardProps) => {
  const [editData, setEditData] = useState({
    name: ingredient.name,
    quantity: ingredient.quantity,
    unit: ingredient.unit,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ingredient.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onUpdate(ingredient.id, editData);
    onStopEdit();
  };

  const handleCancel = () => {
    setEditData({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });
    onStopEdit();
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      } ${isEditing ? 'ring-2 ring-primary shadow-lg' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-3">
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ingredient name"
                  className="font-medium"
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editData.quantity}
                    onChange={(e) => setEditData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    placeholder="Quantity"
                    className="flex-1"
                    min="0"
                    step="0.1"
                  />
                  <Select
                    value={editData.unit}
                    onValueChange={(value) => setEditData(prev => ({ ...prev, unit: value }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {ingredient.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-semibold text-primary">{ingredient.quantity}</span>
                    <span className="text-sm text-muted-foreground">{ingredient.unit}</span>
                  </div>
                </div>
                
                {/* Tags */}
                <TagDisplay tags={ingredient.tags} allergens={ingredient.allergens} size="sm" />
                
                {/* Notes indicator */}
                {ingredient.notes && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="h-3 w-3 mr-1" />
                    Has notes
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex items-center gap-1">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={handleSave} className="h-8 w-8 p-0">
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenNotes(ingredient.id)}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Add/Edit Notes"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onStartEdit(ingredient.id)}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit Ingredient"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(ingredient.id)}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  title="Delete Ingredient"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};