import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { GeneralInformation } from '@/components/custom-ingredient/GeneralInformation';
import { RegulatoryInformation } from '@/components/custom-ingredient/RegulatoryInformation';
import { NutritionInformation } from '@/components/custom-ingredient/NutritionInformation';
import { CustomIngredientData } from '@/types/customIngredient';

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
  vitaminsAndMinerals: {
    entryType: 'percentage',
    vitamins: {},
    minerals: {}
  },
  additionalNutrients: {},
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

export function CustomIngredientPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/products/create';
  
  const [formData, setFormData] = useState<CustomIngredientData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    const hasBasicNutritionData = nutritionValues.some(value => value > 0);
    
    // Check vitamins and minerals data
    const hasVitaminsData = formData.vitaminsAndMinerals?.vitamins && 
      Object.values(formData.vitaminsAndMinerals.vitamins).some(value => value > 0);
    const hasMineralsData = formData.vitaminsAndMinerals?.minerals && 
      Object.values(formData.vitaminsAndMinerals.minerals).some(value => value > 0);
    
    // Check additional nutrients data
    const hasAdditionalNutrients = formData.additionalNutrients && 
      Object.values(formData.additionalNutrients).some(value => value > 0);
    
    // At least one type of nutrition data must be provided
    if (!hasBasicNutritionData && !hasVitaminsData && !hasMineralsData && !hasAdditionalNutrients) {
      newErrors.push('At least one nutrition value must be provided (basic nutrition, vitamins/minerals, or additional nutrients)');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (saveOnly: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Here you would typically make an API call to save the ingredient
      // For now, we'll simulate the process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ingredientData = { ...formData, saveOnly };
      
      if (saveOnly) {
        // Save ingredient to database/storage
        console.log('Saving ingredient:', ingredientData);
        // Show success message or redirect to ingredients list
        navigate('/ingredients');
      } else {
        // Add to recipe - pass data back to the calling page
        console.log('Adding ingredient to recipe:', ingredientData);
        // Navigate back with the ingredient data
        navigate(returnTo, {
          state: { customIngredient: ingredientData }
        });
      }
    } catch (error) {
      console.error('Error processing ingredient:', error);
      setErrors(['Failed to process ingredient. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };


  // Check if form is ready for submission
  const isFormValid = () => {
    const hasBasicNutrition = Object.values(formData.nutrition).some(value => value > 0);
    const hasVitaminsData = formData.vitaminsAndMinerals?.vitamins && 
      Object.values(formData.vitaminsAndMinerals.vitamins).some(value => value > 0);
    const hasMineralsData = formData.vitaminsAndMinerals?.minerals && 
      Object.values(formData.vitaminsAndMinerals.minerals).some(value => value > 0);
    const hasAdditionalNutrients = formData.additionalNutrients && 
      Object.values(formData.additionalNutrients).some(value => value > 0);
    
    const hasAnyNutritionData = hasBasicNutrition || hasVitaminsData || hasMineralsData || hasAdditionalNutrients;
    
    return (
      formData.name.trim() !== '' &&
      formData.category.trim() !== '' &&
      formData.ingredientList.trim() !== '' &&
      formData.servingSize > 0 &&
      hasAnyNutritionData
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(returnTo)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Custom Ingredient</h1>
                <p className="text-sm text-gray-500">Add detailed nutrition information for your custom ingredient</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {errors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
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

        {/* Single Scrollable Form */}
        <div className="space-y-8">
          {/* General Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <GeneralInformation
                formData={formData}
                onInputChange={handleInputChange}
              />
            </CardContent>
          </Card>

          {/* Regulatory Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Regulatory Information</CardTitle>
            </CardHeader>
            <CardContent>
              <RegulatoryInformation
                formData={formData}
                onInputChange={handleInputChange}
                onAllergenChange={handleAllergenChange}
                onAllergenTypeChange={handleAllergenTypeChange}
              />
            </CardContent>
          </Card>

          {/* Nutrition Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nutrition Information</CardTitle>
            </CardHeader>
            <CardContent>
              <NutritionInformation
                formData={formData}
                onInputChange={handleInputChange}
                onNutritionChange={handleNutritionChange}
              />
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center mt-8 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(returnTo)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={isLoading || !isFormValid()}
              className={!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Ingredient'
              )}
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={isLoading || !isFormValid()}
              className={!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add to Recipe'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}