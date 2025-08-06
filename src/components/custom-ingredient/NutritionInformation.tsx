import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { CustomIngredientData } from '@/types/customIngredient';

interface NutritionInformationProps {
  formData: CustomIngredientData;
  onInputChange: (field: string, value: any) => void;
  onNutritionChange: (nutrient: string, value: number) => void;
}

// Vitamins and Minerals data extracted from nutritionapiresponse.json
const VITAMINS_MINERALS_DATA = {
  vitamins: {
    'VITA_RAE': { label: 'Vitamin A, RAE', unit: 'μg', dailyValue: 900 },
    'VITC': { label: 'Vitamin C, total ascorbic acid', unit: 'mg', dailyValue: 90 },
    'THIA': { label: 'Thiamin', unit: 'mg', dailyValue: 1.2 },
    'RIBF': { label: 'Riboflavin', unit: 'mg', dailyValue: 1.3 },
    'NIA': { label: 'Niacin', unit: 'mg', dailyValue: 16 },
    'VITB6A': { label: 'Vitamin B-6', unit: 'mg', dailyValue: 1.7 },
    'FOLDFE': { label: 'Folate, DFE', unit: 'μg', dailyValue: 400 },
    'VITB12': { label: 'Vitamin B-12', unit: 'μg', dailyValue: 2.4 },
    'VITD': { label: 'Vitamin D (D2 + D3)', unit: 'μg', dailyValue: 20 },
    'TOCPHA': { label: 'Vitamin E (alpha-tocopherol)', unit: 'mg', dailyValue: 15 },
    'VITK1': { label: 'Vitamin K (phylloquinone)', unit: 'μg', dailyValue: 120 },
    'PANTAC': { label: 'Pantothenic acid', unit: 'mg', dailyValue: 5 },
    'CHOLN': { label: 'Choline, total', unit: 'mg', dailyValue: 550 },
    'BETN': { label: 'Betaine', unit: 'mg', dailyValue: null }
  },
  minerals: {
    'CA': { label: 'Calcium, Ca', unit: 'mg', dailyValue: 1300 },
    'MG': { label: 'Magnesium, Mg', unit: 'mg', dailyValue: 420 },
    'K': { label: 'Potassium, K', unit: 'mg', dailyValue: 4700 },
    'FE': { label: 'Iron, Fe', unit: 'mg', dailyValue: 18 },
    'ZN': { label: 'Zinc, Zn', unit: 'mg', dailyValue: 11 },
    'P': { label: 'Phosphorus, P', unit: 'mg', dailyValue: 1250 },
    'CU': { label: 'Copper, Cu', unit: 'mg', dailyValue: 0.9 },
    'MN': { label: 'Manganese, Mn', unit: 'mg', dailyValue: 2.3 },
    'SE': { label: 'Selenium, Se', unit: 'μg', dailyValue: 55 }
  }
};

// Additional nutrients that can be added
const ADDITIONAL_NUTRIENTS_DATA = {
  'WATER': { label: 'Water', unit: 'g' },
  'ASH': { label: 'Ash', unit: 'g' },
  'ALC': { label: 'Alcohol, ethyl', unit: 'g' },
  'CAFFN': { label: 'Caffeine', unit: 'mg' },
  'THEBRN': { label: 'Theobromine', unit: 'mg' },
  'RETOL': { label: 'Retinol', unit: 'μg' },
  'CARTB': { label: 'Carotene, beta', unit: 'μg' },
  'CARTA': { label: 'Carotene, alpha', unit: 'μg' },
  'CRYPX': { label: 'Cryptoxanthin, beta', unit: 'μg' },
  'LYCPN': { label: 'Lycopene', unit: 'μg' },
  'LUT+ZEA': { label: 'Lutein + zeaxanthin', unit: 'μg' }
};

export function NutritionInformation({
  formData,
  onInputChange,
  onNutritionChange
}: NutritionInformationProps) {

  const handleVitaminMineralChange = (key: string, value: number) => {
    const currentData = formData.vitaminsAndMinerals || { entryType: 'percentage', vitamins: {}, minerals: {} };
    const isVitamin = key in VITAMINS_MINERALS_DATA.vitamins;
    
    onInputChange('vitaminsAndMinerals', {
      ...currentData,
      [isVitamin ? 'vitamins' : 'minerals']: {
        ...currentData[isVitamin ? 'vitamins' : 'minerals'],
        [key]: value
      }
    });
  };

  const handleAdditionalNutrientChange = (key: string, value: number) => {
    const currentData = formData.additionalNutrients || {};
    onInputChange('additionalNutrients', {
      ...currentData,
      [key]: value
    });
  };
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

        {/* Vitamins Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Vitamins (% FDA)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(VITAMINS_MINERALS_DATA.vitamins).map(([key, vitaminData]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-xs font-medium text-gray-600">
                  {vitaminData.label} (% FDA)
                </Label>
                <Input
                  id={key}
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.vitaminsAndMinerals?.vitamins?.[key] || ''}
                  onChange={(e) => handleVitaminMineralChange(key, parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Minerals Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Minerals (% FDA)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(VITAMINS_MINERALS_DATA.minerals).map(([key, mineralData]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-xs font-medium text-gray-600">
                  {mineralData.label} (% FDA)
                </Label>
                <Input
                  id={key}
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.vitaminsAndMinerals?.minerals?.[key] || ''}
                  onChange={(e) => handleVitaminMineralChange(key, parseFloat(e.target.value) || 0)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Optional Nutrient Details Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Optional nutrient details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(ADDITIONAL_NUTRIENTS_DATA).map(([key, nutrientData]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-xs font-medium text-gray-600">
                  {nutrientData.label} ({nutrientData.unit})
                </Label>
                <Input
                  id={key}
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={formData.additionalNutrients?.[key] || ''}
                  onChange={(e) => handleAdditionalNutrientChange(key, parseFloat(e.target.value) || 0)}
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