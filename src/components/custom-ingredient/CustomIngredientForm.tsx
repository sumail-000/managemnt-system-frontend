import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { GeneralInformation } from './GeneralInformation';
import { RegulatoryInformation } from './RegulatoryInformation';
import { NutritionInformation } from './NutritionInformation';
import { CustomIngredientData } from '@/types/customIngredient';

interface CustomIngredientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ingredientData: CustomIngredientData) => void;
  isLoading?: boolean;
}

const initialFormData: CustomIngredientData = {
  name: '',
  brand: '',
  category: '',
  description: '',
  ingredientList: '',
  servingSize: 100,
  servingUnit: 'g',
  nutrition: {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    sodium: 0,
    fiber: 0,
    sugars: 0,
    addedSugars: 0,
    vitaminA: 0,
    vitaminC: 0,
    calcium: 0,
    iron: 0
  },
  allergens: {
    contains: [],
    mayContain: [],
    freeFrom: [],
    types: {
      gluten: { contains: false, mayContain: false, freeFrom: false, source: '' },
      dairy: { contains: false, mayContain: false, freeFrom: false, source: '' },
      eggs: { contains: false, mayContain: false, freeFrom: false, source: '' },
      fish: { contains: false, mayContain: false, freeFrom: false, source: '' },
      shellfish: { contains: false, mayContain: false, freeFrom: false, source: '' },
      treeNuts: { contains: false, mayContain: false, freeFrom: false, source: '' },
      peanuts: { contains: false, mayContain: false, freeFrom: false, source: '' },
      soy: { contains: false, mayContain: false, freeFrom: false, source: '' },
      sesame: { contains: false, mayContain: false, freeFrom: false, source: '' }
    },
    milkType: {
      cowMilk: false,
      goatMilk: false,
      sheepMilk: false,
      other: ''
    },
    eggType: {
      chickenEgg: false,
      duckEgg: false,
      quailEgg: false,
      other: ''
    },
    fishType: {
      tuna: false,
      cod: false,
      salmon: false,
      bass: false,
      other: ''
    },
    treeNutType: {
      almond: false,
      blackWalnut: false,
      brazilNut: false,
      californiaWalnut: false,
      cashew: false,
      hazelnut: false,
      heartnut: false,
      macadamiaNut: false,
      pecan: false,
      pineNut: false,
      pistachio: false,
      walnut: false,
      other: ''
    },
    glutenType: {
      barley: false,
      oats: false,
      rye: false,
      triticale: false,
      other: ''
    }
  },
  nutritionNotes: ''
};

export function CustomIngredientForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: CustomIngredientFormProps) {
  const [formData, setFormData] = useState<CustomIngredientData>(initialFormData);
  const [activeTab, setActiveTab] = useState('general');
  const [errors, setErrors] = useState<string[]>([]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleNutritionChange = (nutrient: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        [nutrient]: value
      }
    }));
  };

  const handleAllergenChange = (allergen: string, checked: boolean) => {
    setFormData(prev => {
      const newAllergens = { ...prev.allergens };
      
      if (checked) {
        // Add to contains array if not already present
        if (!newAllergens.contains.includes(allergen)) {
          newAllergens.contains = [...newAllergens.contains, allergen];
        }
        // Remove from mayContain and freeFrom if present
        newAllergens.mayContain = newAllergens.mayContain.filter(a => a !== allergen);
        newAllergens.freeFrom = newAllergens.freeFrom.filter(a => a !== allergen);
      } else {
        // Remove from contains array
        newAllergens.contains = newAllergens.contains.filter(a => a !== allergen);
      }

      return {
        ...prev,
        allergens: newAllergens
      };
    });
  };

  const handleAllergenTypeChange = (category: string, type: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      allergens: {
        ...prev.allergens,
        [category]: {
          ...prev.allergens[category as keyof typeof prev.allergens],
          [type]: value
        }
      }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push('Ingredient name is required');
    }

    if (!formData.category.trim()) {
      newErrors.push('Category is required');
    }

    if (!formData.ingredientList.trim()) {
      newErrors.push('Ingredient list is required');
    }

    if (formData.servingSize <= 0) {
      newErrors.push('Serving size must be greater than 0');
    }

    // Check if at least some nutrition data is provided
    const nutritionValues = Object.values(formData.nutrition);
    const hasNutritionData = nutritionValues.some(value => value > 0);
    
    if (!hasNutritionData) {
      newErrors.push('At least one nutrition value must be provided');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setActiveTab('general');
    setErrors([]);
    onClose();
  };

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'general':
        return formData.name && formData.category ? 'complete' : 'incomplete';
      case 'regulatory':
        return formData.ingredientList ? 'complete' : 'incomplete';
      case 'nutrition':
        const hasNutrition = Object.values(formData.nutrition).some(value => value > 0);
        return hasNutrition && formData.servingSize > 0 ? 'complete' : 'incomplete';
      default:
        return 'incomplete';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Add Custom Ingredient</DialogTitle>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="flex items-center gap-2">
                {getTabStatus('general') === 'complete' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                General
              </TabsTrigger>
              <TabsTrigger value="regulatory" className="flex items-center gap-2">
                {getTabStatus('regulatory') === 'complete' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                Regulatory
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="flex items-center gap-2">
                {getTabStatus('nutrition') === 'complete' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                )}
                Nutrition
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="general" className="mt-0">
                <GeneralInformation
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              </TabsContent>

              <TabsContent value="regulatory" className="mt-0">
                <RegulatoryInformation
                  formData={formData}
                  onInputChange={handleInputChange}
                  onAllergenChange={handleAllergenChange}
                  onAllergenTypeChange={handleAllergenTypeChange}
                />
              </TabsContent>

              <TabsContent value="nutrition" className="mt-0">
                <NutritionInformation
                  formData={formData}
                  onInputChange={handleInputChange}
                  onNutritionChange={handleNutritionChange}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {activeTab !== 'general' && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ['general', 'regulatory', 'nutrition'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) {
                    setActiveTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                Previous
              </Button>
            )}
            {activeTab !== 'nutrition' && (
              <Button
                variant="outline"
                onClick={() => {
                  const tabs = ['general', 'regulatory', 'nutrition'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                Next
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Ingredient'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}