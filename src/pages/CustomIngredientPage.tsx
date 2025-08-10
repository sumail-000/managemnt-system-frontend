import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { GeneralInformation } from '@/components/custom-ingredient/GeneralInformation';
import { RegulatoryInformation } from '@/components/custom-ingredient/RegulatoryInformation';
import { NutritionInformation } from '@/components/custom-ingredient/NutritionInformation';
import { CustomIngredientData } from '@/types/customIngredient';
import { CustomIngredientApi } from '@/services/customIngredientApi';
import { useToast } from '@/hooks/use-toast';

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
  const returnTo = searchParams.get('returnTo') || '/custom-ingredients';
  const { toast } = useToast();
  
  // Check if we're in edit mode
  const isEditMode = location.pathname.includes('/edit/');
  const ingredientId = isEditMode ? location.pathname.split('/').pop() : null;
  
  const [formData, setFormData] = useState<CustomIngredientData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIngredient, setIsLoadingIngredient] = useState(isEditMode);

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

    // Only require ingredient name - remove all other validations
    if (!formData.name.trim()) {
      newErrors.push('Ingredient name is required');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Load ingredient data for edit mode
  useEffect(() => {
    const loadIngredient = async () => {
      if (isEditMode && ingredientId) {
        setIsLoadingIngredient(true);
        try {
          const response = await CustomIngredientApi.getCustomIngredient(parseInt(ingredientId));
          
          // Handle both wrapped format {success: true, data: ...} and direct data format
          let ingredient;
          if (response && typeof response === 'object') {
            if (response.success && response.data) {
              // Wrapped format
              ingredient = Array.isArray(response.data) ? response.data[0] : response.data;
            } else if ((response as any).name || (response as any).id) {
              // Direct data format (from API interceptor)
              ingredient = response as any;
            } else {
              throw new Error('Invalid response format');
            }
          } else {
            throw new Error('No data received');
          }
          
          if (ingredient) {
            
            // Transform API data back to form format
            setFormData({
              name: ingredient.name || '',
              brand: ingredient.brand || '',
              category: ingredient.category || '',
              description: ingredient.description || '',
              ingredientList: ingredient.ingredient_list || '',
              servingSize: ingredient.serving_size || 100,
              servingUnit: ingredient.serving_unit || 'g',
              nutrition: ingredient.nutrition_data || initialFormData.nutrition,
              vitaminsAndMinerals: ingredient.vitamins_minerals || initialFormData.vitaminsAndMinerals,
              additionalNutrients: ingredient.additional_nutrients || initialFormData.additionalNutrients,
              allergens: ingredient.allergens_data || initialFormData.allergens,
              nutritionNotes: ingredient.nutrition_notes || ''
            });
          }
        } catch (error: any) {
          console.error('Error loading ingredient:', error);
          toast({
            title: "Error",
            description: "Failed to load ingredient data",
            variant: "destructive"
          });
          navigate('/custom-ingredients');
        } finally {
          setIsLoadingIngredient(false);
        }
      }
    };

    loadIngredient();
  }, [isEditMode, ingredientId, navigate, toast]);

  const handleSubmit = async (saveOnly: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Processing custom ingredient:', formData);
      
      // Prepare API data for saving to database
      const apiData = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        ingredient_list: formData.ingredientList,
        serving_size: formData.servingSize,
        serving_unit: formData.servingUnit,
        nutrition_data: formData.nutrition,
        vitamins_minerals: formData.vitaminsAndMinerals,
        additional_nutrients: formData.additionalNutrients,
        allergens_data: formData.allergens,
        nutrition_notes: formData.nutritionNotes,
        is_public: false, // Default to private
      };
      
      console.log('🔄 API data being sent:', apiData);
      
      let response;
      if (isEditMode && ingredientId) {
        // Update existing ingredient
        response = await CustomIngredientApi.updateCustomIngredient(parseInt(ingredientId), apiData);
      } else {
        // Create new ingredient - ALWAYS save to database first (for both "Save Ingredient" and "Add to Recipe")
        response = await CustomIngredientApi.createCustomIngredient(apiData);
      }
      
      console.log('📡 Full API response:', response);

      // Check if response has success property (wrapped format) or is direct data
      const isSuccess = response?.success === true ||
                       (response && typeof response === 'object' && (response as any).user_id);

      if (isSuccess) {
        const ingredientData = response.success ? response.data : response;
        console.log('✅ Ingredient processed successfully:', ingredientData);
        setErrors([]);
        
        if (isEditMode) {
          // Edit mode: Show success and navigate back
          toast({
            title: "✅ Updated!",
            description: "Custom ingredient updated successfully!",
          });
          navigate(returnTo);
        } else if (saveOnly) {
          // Create mode - Save Only: Show success message and reset form
          toast({
            title: "✅ Success!",
            description: "Custom ingredient saved successfully!",
          });
          
          // Reset form
          setFormData(initialFormData);
          
          // Navigate back to ingredients list
          navigate('/custom-ingredients');
        } else {
          // Create mode - Add to Recipe: Save ingredient AND add it to recipe automatically
          toast({
            title: "✅ Ingredient Created & Added!",
            description: `"${formData.name}" has been saved and added to your recipe!`,
          });
          
          console.log('➕ Adding ingredient to recipe with saved data:', {
            formData,
            savedIngredientData: ingredientData
          });
          
          // Pass both the form data AND the saved ingredient data back to recipe form
          navigate(returnTo, {
            state: {
              customIngredient: formData,
              savedIngredientData: ingredientData // Include the saved data with ID
            }
          });
        }
      } else {
        console.error('❌ API response indicates failure:', response);
        throw new Error(response?.message || 'Failed to save ingredient - API returned unsuccessful response');
      }
    } catch (error: any) {
      console.error('❌ Error processing ingredient:', error);
      const errorMessage = error.message || 'Failed to process ingredient. Please try again.';
      setErrors([errorMessage]);
      
      toast({
        title: "❌ Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Check if form is ready for submission - only require name
  const isFormValid = () => {
    return formData.name.trim() !== '';
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
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Custom Ingredient' : 'Create Custom Ingredient'}
                </h1>
                <p className="text-sm text-gray-500">
                  {isEditMode
                    ? 'Update the nutrition information for your custom ingredient'
                    : 'Add detailed nutrition information for your custom ingredient'
                  }
                </p>
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

        {/* Loading State for Edit Mode */}
        {isLoadingIngredient && (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Loading ingredient...</h3>
              <p className="text-muted-foreground">Please wait while we fetch the ingredient data</p>
            </div>
          </Card>
        )}

        {/* Single Scrollable Form */}
        {!isLoadingIngredient && (
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
        )}

        {/* Action Buttons */}
        {!isLoadingIngredient && (
        <div className="flex justify-end items-center mt-8 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(returnTo)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {isEditMode ? (
              // Edit mode: Only show Update button
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isLoading || !isFormValid()}
                className={!isFormValid() ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Ingredient'
                )}
              </Button>
            ) : (
              // Create mode: Show both Save and Add to Recipe buttons
              <>
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
              </>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}