import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AllergenManagement } from './AllergenManagement';
import { CustomIngredientData } from '@/types/customIngredient';

interface RegulatoryInformationProps {
  formData: CustomIngredientData;
  onInputChange: (field: string, value: any) => void;
  onAllergenChange: (allergen: string, checked: boolean) => void;
  onAllergenTypeChange: (category: string, type: string, value: any) => void;
}

export function RegulatoryInformation({ 
  formData, 
  onInputChange, 
  onAllergenChange, 
  onAllergenTypeChange 
}: RegulatoryInformationProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Regulatory Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ingredient List */}
        <div className="space-y-2">
          <Label htmlFor="ingredientList" className="text-sm font-medium">Ingredient List</Label>
          <Textarea
            id="ingredientList"
            placeholder="Rice Flour (Brown Rice, White Rice)"
            value={formData.ingredientList}
            onChange={(e) => onInputChange('ingredientList', e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>

        {/* Allergens */}
        <AllergenManagement
          formData={formData}
          onAllergenChange={onAllergenChange}
          onAllergenTypeChange={onAllergenTypeChange}
        />
      </CardContent>
    </Card>
  );
}