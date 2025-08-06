import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CustomIngredientData } from '@/types/customIngredient';

interface NutritionInformationProps {
  formData: CustomIngredientData;
  onInputChange: (field: string, value: any) => void;
  onNutritionChange: (nutrient: string, value: number) => void;
}

export function NutritionInformation({ 
  formData, 
  onInputChange, 
  onNutritionChange 
}: NutritionInformationProps) {
  const nutritionFields = [
    { key: 'calories', label: 'Calories', unit: 'kcal' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'carbohydrates', label: 'Carbohydrates', unit: 'g' },
    { key: 'fat', label: 'Total Fat', unit: 'g' },
    { key: 'saturatedFat', label: 'Saturated Fat', unit: 'g' },
    { key: 'transFat', label: 'Trans Fat', unit: 'g' },
    { key: 'cholesterol', label: 'Cholesterol', unit: 'mg' },
    { key: 'sodium', label: 'Sodium', unit: 'mg' },
    { key: 'fiber', label: 'Dietary Fiber', unit: 'g' },
    { key: 'sugars', label: 'Total Sugars', unit: 'g' },
    { key: 'addedSugars', label: 'Added Sugars', unit: 'g' },
    { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
    { key: 'vitaminC', label: 'Vitamin C', unit: 'mg' },
    { key: 'calcium', label: 'Calcium', unit: 'mg' },
    { key: 'iron', label: 'Iron', unit: 'mg' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Nutrition Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Serving Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="servingSize" className="text-sm font-medium">Serving Size</Label>
            <Input
              id="servingSize"
              type="number"
              step="0.1"
              placeholder="100"
              value={formData.servingSize || ''}
              onChange={(e) => onInputChange('servingSize', parseFloat(e.target.value) || 0)}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="servingUnit" className="text-sm font-medium">Serving Unit</Label>
            <Select 
              value={formData.servingUnit || 'g'} 
              onValueChange={(value) => onInputChange('servingUnit', value)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">Grams (g)</SelectItem>
                <SelectItem value="ml">Milliliters (ml)</SelectItem>
                <SelectItem value="oz">Ounces (oz)</SelectItem>
                <SelectItem value="cup">Cup</SelectItem>
                <SelectItem value="tbsp">Tablespoon</SelectItem>
                <SelectItem value="tsp">Teaspoon</SelectItem>
                <SelectItem value="piece">Piece</SelectItem>
                <SelectItem value="slice">Slice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nutrition Facts Grid */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Nutrition Facts (per serving)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nutritionFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-xs font-medium text-gray-600">
                  {field.label} ({field.unit})
                </Label>
                <Input
                  id={field.key}
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.nutrition[field.key] || ''}
                  onChange={(e) => onNutritionChange(field.key, parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <Label htmlFor="nutritionNotes" className="text-sm font-medium">Additional Nutrition Notes</Label>
          <Input
            id="nutritionNotes"
            placeholder="e.g., Values may vary based on preparation method"
            value={formData.nutritionNotes || ''}
            onChange={(e) => onInputChange('nutritionNotes', e.target.value)}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}