import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Languages, 
  Plus, 
  X, 
  AlertTriangle,
  Calculator,
  Info
} from 'lucide-react';
import { LabelData, ValidationResult, NutritionFact } from '@/types/label';

interface BilingualEditorProps {
  labelData: LabelData;
  onChange: (updates: Partial<LabelData>) => void;
  validation: ValidationResult;
}

const commonAllergens = [
  'Milk', 'Eggs', 'Fish', 'Shellfish', 'Tree nuts', 'Peanuts', 'Wheat', 'Soybeans'
];

const commonAllergensArabic = [
  'الحليب', 'البيض', 'السمك', 'المحار', 'المكسرات', 'الفول السوداني', 'القمح', 'فول الصويا'
];

const nutritionFacts = [
  { name: 'Total Fat', unit: 'g' },
  { name: 'Saturated Fat', unit: 'g' },
  { name: 'Trans Fat', unit: 'g' },
  { name: 'Cholesterol', unit: 'mg' },
  { name: 'Sodium', unit: 'mg' },
  { name: 'Total Carbohydrate', unit: 'g' },
  { name: 'Dietary Fiber', unit: 'g' },
  { name: 'Total Sugars', unit: 'g' },
  { name: 'Added Sugars', unit: 'g' },
  { name: 'Protein', unit: 'g' },
  { name: 'Vitamin D', unit: 'mcg' },
  { name: 'Calcium', unit: 'mg' },
  { name: 'Iron', unit: 'mg' },
  { name: 'Potassium', unit: 'mg' }
];

export function BilingualEditor({ labelData, onChange, validation }: BilingualEditorProps) {
  
  const handleProductNameChange = (language: 'english' | 'arabic', value: string) => {
    onChange({
      productName: {
        ...labelData.productName,
        [language]: value
      }
    });
  };

  const handleIngredientsChange = (language: 'english' | 'arabic', value: string) => {
    onChange({
      ingredients: {
        ...labelData.ingredients,
        [language]: value
      }
    });
  };

  const handleAllergenAdd = (language: 'english' | 'arabic', allergen: string) => {
    const currentAllergens = labelData.allergens[language];
    if (!currentAllergens.includes(allergen)) {
      onChange({
        allergens: {
          ...labelData.allergens,
          [language]: [...currentAllergens, allergen]
        }
      });
    }
  };

  const handleAllergenRemove = (language: 'english' | 'arabic', allergen: string) => {
    onChange({
      allergens: {
        ...labelData.allergens,
        [language]: labelData.allergens[language].filter(a => a !== allergen)
      }
    });
  };

  const handleNutritionAdd = () => {
    const newNutrient: NutritionFact = {
      name: '',
      amount: 0,
      unit: 'g',
      dailyValue: 0
    };
    
    onChange({
      nutrition: [...labelData.nutrition, newNutrient]
    });
  };

  const handleNutritionChange = (index: number, updates: Partial<NutritionFact>) => {
    const newNutrition = [...labelData.nutrition];
    newNutrition[index] = { ...newNutrition[index], ...updates };
    
    onChange({
      nutrition: newNutrition
    });
  };

  const handleNutritionRemove = (index: number) => {
    onChange({
      nutrition: labelData.nutrition.filter((_, i) => i !== index)
    });
  };

  const getValidationError = (field: string) => {
    return validation.errors.find(error => error.field === field);
  };

  const getValidationWarning = (field: string) => {
    return validation.warnings.find(warning => warning.field === field);
  };

  return (
    <div className="space-y-6">
      
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Product Name */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Product Name *</Label>
            
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">English</Label>
                <Input
                  placeholder="Enter product name in English"
                  value={labelData.productName.english}
                  onChange={(e) => handleProductNameChange('english', e.target.value)}
                  className={`h-8 ${getValidationError('productName') ? 'border-destructive' : ''}`}
                />
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Arabic</Label>
                <Input
                  placeholder="أدخل اسم المنتج بالعربية"
                  value={labelData.productName.arabic}
                  onChange={(e) => handleProductNameChange('arabic', e.target.value)}
                  className="h-8"
                  dir="rtl"
                />
              </div>
            </div>
            
            {getValidationError('productName') && (
              <Alert className="py-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {getValidationError('productName')?.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Brand Name</Label>
            <Input
              placeholder="Enter brand name"
              value={labelData.brandName}
              onChange={(e) => onChange({ brandName: e.target.value })}
              className="h-8"
            />
            {getValidationWarning('brandName') && (
              <div className="flex items-center gap-1 text-xs text-warning">
                <Info className="h-3 w-3" />
                {getValidationWarning('brandName')?.message}
              </div>
            )}
          </div>

          {/* Net Weight */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Net Weight</Label>
            <Input
              placeholder="e.g., 500g, 1.5L"
              value={labelData.netWeight}
              onChange={(e) => onChange({ netWeight: e.target.value })}
              className="h-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Facts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Nutrition Facts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Serving Information */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Serving Size</Label>
              <Input
                placeholder="e.g., 100g"
                value={labelData.servingSize}
                onChange={(e) => onChange({ servingSize: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Servings Per Container</Label>
              <Input
                placeholder="e.g., 5"
                value={labelData.servingsPerContainer}
                onChange={(e) => onChange({ servingsPerContainer: e.target.value })}
                className="h-8"
              />
            </div>
          </div>

          {/* Calories */}
          <div className="space-y-1">
            <Label className="text-xs font-medium">Calories</Label>
            <Input
              type="number"
              placeholder="0"
              value={labelData.calories}
              onChange={(e) => onChange({ calories: Number(e.target.value) })}
              className="h-8"
            />
          </div>

          <Separator />

          {/* Nutrition Facts List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Nutrients</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNutritionAdd}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>

            {labelData.nutrition.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No nutrition facts added</p>
                <p className="text-xs">Click "Add" to include nutrition information</p>
              </div>
            )}

            {labelData.nutrition.map((nutrient, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Label className="text-xs">Nutrient</Label>
                  <Input
                    placeholder="Name"
                    value={nutrient.name}
                    onChange={(e) => handleNutritionChange(index, { name: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={nutrient.amount}
                    onChange={(e) => handleNutritionChange(index, { amount: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Unit</Label>
                  <Input
                    placeholder="g"
                    value={nutrient.unit}
                    onChange={(e) => handleNutritionChange(index, { unit: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">DV%</Label>
                  <Input
                    type="number"
                    value={nutrient.dailyValue || ''}
                    onChange={(e) => handleNutritionChange(index, { dailyValue: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNutritionRemove(index)}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Quick Add Common Nutrients */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Quick Add Common Nutrients</Label>
              <div className="flex flex-wrap gap-1">
                {nutritionFacts.map(fact => (
                  <Button
                    key={fact.name}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => {
                      if (!labelData.nutrition.find(n => n.name === fact.name)) {
                        handleNutritionChange(labelData.nutrition.length, {
                          name: fact.name,
                          amount: 0,
                          unit: fact.unit,
                          dailyValue: 0
                        });
                        handleNutritionAdd();
                      }
                    }}
                    disabled={labelData.nutrition.some(n => n.name === fact.name)}
                  >
                    {fact.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Ingredients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">English</Label>
            <Textarea
              placeholder="List ingredients in descending order by weight..."
              value={labelData.ingredients.english}
              onChange={(e) => handleIngredientsChange('english', e.target.value)}
              className="min-h-[80px] text-xs"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Arabic</Label>
            <Textarea
              placeholder="اذكر المكونات بترتيب تنازلي حسب الوزن..."
              value={labelData.ingredients.arabic}
              onChange={(e) => handleIngredientsChange('arabic', e.target.value)}
              className="min-h-[80px] text-xs"
              dir="rtl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Allergens */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Allergens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* English Allergens */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">English</Label>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {labelData.allergens.english.map(allergen => (
                <Badge
                  key={allergen}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/10"
                  onClick={() => handleAllergenRemove('english', allergen)}
                >
                  {allergen}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {commonAllergens
                .filter(allergen => !labelData.allergens.english.includes(allergen))
                .map(allergen => (
                <Button
                  key={allergen}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => handleAllergenAdd('english', allergen)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {allergen}
                </Button>
              ))}
            </div>
          </div>

          {/* Arabic Allergens */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Arabic</Label>
            
            <div className="flex flex-wrap gap-1 mb-2">
              {labelData.allergens.arabic.map(allergen => (
                <Badge
                  key={allergen}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:bg-destructive/10"
                  onClick={() => handleAllergenRemove('arabic', allergen)}
                >
                  {allergen}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-1">
              {commonAllergensArabic
                .filter(allergen => !labelData.allergens.arabic.includes(allergen))
                .map(allergen => (
                <Button
                  key={allergen}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => handleAllergenAdd('arabic', allergen)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {allergen}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}