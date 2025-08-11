import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, X, Loader2, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FDANutritionLabel } from '@/components/previewlabel/FDANutritionLabel';
import { ProgressiveRecipeApi, ProgressiveRecipeData, RecipeProgress, Category } from '@/services/progressiveRecipeApi';
import { processSearchResults, SimpleIngredient } from '@/utils/recipeIngredientExtractor';
import { performEnhancedSearch, performProgressiveEnhancedSearch, ProgressiveSearchCallback } from '@/utils/enhancedSearchProcessor';
import { CustomIngredientApi } from '@/services/customIngredientApi';
import {
  mapNutritionDataToFDAFormat,
  getEmptyNutritionData,
  getEmptyFDANutritionData,
  extractNutritionData,
  calculatePerServingNutrition,
  getEmptyPerServingNutritionData,
  mapPerServingDataToFDAFormat,
  FDANutritionData,
  NutritionData,
  PerServingNutritionData,
  extractAllergenData,
  getEmptyAllergenData,
  AllergenData
} from '@/utils/nutritionDataMapper';
import AllergenManagement from '@/components/allergens/AllergenManagement';
import { CustomIngredientData } from '@/types/customIngredient';
import { useToast } from '@/hooks/use-toast';

// Import extracted utilities and hooks
import {
  AddedIngredient,
  calculateNutritionProportions,
  recalculateNutritionLocally,
  analyzeNutrition,
  calculateNutritionFromCustomIngredients
} from '@/utils/nutritionCalculations';
import {
  processSearchIngredient,
  processCustomIngredient,
  processCustomIngredientFromDB,
  updateIngredientProperty,
  calculateIngredientTotals
} from '@/utils/ingredientProcessing';
import {
  transformFlatToCategories,
  generateAllergenStatement,
  hasAllergens,
  getActiveAllergenCategories
} from '@/utils/allergenManagement';
import {
  ProductDetails,
  ProductImage,
  getEmptyProductDetails,
  validateProductDetails,
  calculateTotalWeight,
  generateSKU,
  validateBarcode,
  formatBarcode
} from '@/utils/productDetailsManagement';
import {
  getDefaultCategories,
  findCategoryById,
  getCategoryOptions,
  validateCategorySelection
} from '@/utils/categoryManagement';
import {
  validateImageFile,
  createImagePreview,
  getImageDimensions,
  resizeImage,
  formatFileSize,
  processImageFiles
} from '@/utils/imageProcessing';
import {
  saveIngredientsToBackend,
  clearAllIngredientsFromBackend
} from '@/utils/backendSync';

 // AddedIngredient interface is now imported from @/utils/nutritionCalculations
import { useNotifications } from '@/contexts/NotificationsContext'

export default function ProductForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { id: productId } = useParams();
  const { addNotification } = useNotifications();
  const isEditMode = Boolean(productId);
  
  // Progressive recipe state
  const [currentRecipe, setCurrentRecipe] = useState<ProgressiveRecipeData | null>(null);
  const [recipeProgress, setRecipeProgress] = useState<RecipeProgress | null>(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [isLoadingExistingRecipe, setIsLoadingExistingRecipe] = useState(false);
  
  // Force re-render state for progress indicators
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const forceProgressUpdate = () => setProgressUpdateTrigger(prev => prev + 1);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [activeTab, setActiveTab] = useState('recipe');
  const [isRecipeCreated, setIsRecipeCreated] = useState(true);
  const [searchResults, setSearchResults] = useState<SimpleIngredient[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingIngredientName, setLoadingIngredientName] = useState<string | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateIngredient, setDuplicateIngredient] = useState<SimpleIngredient | null>(null);
  const [addedIngredientNames, setAddedIngredientNames] = useState<Set<string>>(new Set());
  const [customIngredients, setCustomIngredients] = useState<any[]>([]);
  const [isLoadingCustomIngredients, setIsLoadingCustomIngredients] = useState(false);
  const resultsPerPage = 20;
  const displayedResultsPerPage = 20; // Show 20 results at a time with scrolling
  
  // Real nutrition data states
  const [nutritionData, setNutritionData] = useState<FDANutritionData | null>(null);
  const [rawNutritionData, setRawNutritionData] = useState<NutritionData | null>(null);
  const [perServingData, setPerServingData] = useState<PerServingNutritionData | null>(null);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);
  const [servingsPerContainer, setServingsPerContainer] = useState<number>(1);
  const [totalGramsAtLastAnalysis, setTotalGramsAtLastAnalysis] = useState<number>(0);
  
  // Package configuration states
  const [labelSetupMode, setLabelSetupMode] = useState<'package' | 'serving'>('package');
  const [netWeightPerPackage, setNetWeightPerPackage] = useState<number>(100);
  const [servingsPerPackage, setServingsPerPackage] = useState<number>(1);
  const [packagesFromRecipe, setPackagesFromRecipe] = useState<number>(1.42);
  const [servingSizeWeight, setServingSizeWeight] = useState<number>(224);
  const [servingSizeNumber, setServingSizeNumber] = useState<number>(1);

  // Product Details states
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [isExtractingImageUrl, setIsExtractingImageUrl] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [imageUrlError, setImageUrlError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);

  // Ingredient Statement states
  const [ingredientStatements, setIngredientStatements] = useState<{[key: string]: string}>({});
  const [ingredientStatementPreview, setIngredientStatementPreview] = useState<string>('');
  const [isSavingStatements, setIsSavingStatements] = useState(false);
  const ingredientStatementSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Allergen states
  const [allergenData, setAllergenData] = useState<AllergenData>(getEmptyAllergenData());
  const [isSavingAllergens, setIsSavingAllergens] = useState(false);
  const allergenSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Allergen functions are now imported from @/utils/allergenManagement

  // Function to update ingredient statement preview
  const updateIngredientStatementPreview = React.useCallback(() => {
    if (addedIngredients.length === 0) {
      setIngredientStatementPreview('No ingredients added');
      return;
    }

    console.log('🔍 DEBUG: updateIngredientStatementPreview called with:', {
      addedIngredients: addedIngredients.map(ing => ({ id: ing.id, name: ing.name })),
      ingredientStatements,
      statementsCount: Object.keys(ingredientStatements).length
    });

    const preview = addedIngredients.map((ingredient) => {
      const customStatement = ingredientStatements[ingredient.id];
      const willUseCustom = customStatement && customStatement.trim();
      const finalText = willUseCustom ? customStatement.trim() : ingredient.name;
      
      console.log(`🔍 DEBUG: Ingredient ${ingredient.name} (${ingredient.id}):`, {
        hasCustomStatement: !!customStatement,
        customStatementValue: customStatement,
        customStatementTrimmed: customStatement?.trim(),
        willUseCustom,
        finalText
      });
      
      return finalText;
    }).join(', ');

    console.log('🔍 DEBUG: Final preview:', preview);
    setIngredientStatementPreview(preview);
  }, [addedIngredients, ingredientStatements]);

  // Auto-update preview when dependencies change
  React.useEffect(() => {
    updateIngredientStatementPreview();
  }, [updateIngredientStatementPreview]);

  // Function to save recipe description to backend
  const saveRecipeDescriptionToBackend = async (description: string) => {
    if (!currentRecipe?.id) {
      console.warn('⚠️ No current recipe ID, skipping description save');
      return;
    }
    
    try {
      console.log('🔄 Saving recipe description to backend:', {
        recipeId: currentRecipe.id,
        description: description.substring(0, 50) + (description.length > 50 ? '...' : '')
      });
      
      const response = await ProgressiveRecipeApi.updateRecipe(currentRecipe.id, {
        description: description
      });
      
      console.log('📡 Description save API response:', response);
      
      // Handle both wrapped response format and direct response format
      const isSuccess = response && (
        response.success === true ||
        (typeof response === 'object' && !response.hasOwnProperty('success') && (response as any).id)
      );
      
      if (isSuccess) {
        console.log('✅ Description saved successfully');
        // Update current recipe with new description
        setCurrentRecipe(prev => prev ? { ...prev, description: description } : null);
      } else {
        console.error('❌ Description save failed:', response);
        const errorMessage = response?.message || (response as any)?.error || 'Unknown error';
        toast({
          title: "Sync Error",
          description: 'Failed to save description: ' + errorMessage,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Description save error:', error);
      let errorMessage = 'Network error';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Sync Error",
        description: 'Failed to save description: ' + errorMessage,
        variant: "destructive"
      });
    }
  };

  // Function to save ingredient statements to backend
  const saveIngredientStatementsToBackend = async (statements: {[key: string]: string}) => {
    if (!currentRecipe?.id) {
      return;
    }
    
    setIsSavingStatements(true);
    
    try {
      const response = await ProgressiveRecipeApi.saveIngredientStatements(currentRecipe.id, statements);
      
      if (response.success) {
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('Live sync progress error:', progressError);
        }
      } else {
        toast({
          title: "Sync Error",
          description: 'Live sync failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: 'Live sync error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    } finally {
      setIsSavingStatements(false);
    }
  };

  // Function to save allergen data to backend
  const saveAllergensToBackend = async (allergenData: AllergenData) => {
    if (!currentRecipe?.id) {
      return;
    }
    
    setIsSavingAllergens(true);
    
    try {
      const response = await ProgressiveRecipeApi.saveAllergens(currentRecipe.id, allergenData);
      
      if (response.success) {
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('Live sync progress error:', progressError);
        }
      } else {
        toast({
          title: "Sync Error",
          description: 'Live sync failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: 'Live sync error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    } finally {
      setIsSavingAllergens(false);
    }
  };

  // Cache key for localStorage (legacy, kept for compatibility)
  const RECIPE_STATE_CACHE_KEY = 'recipe_state_cache';
  // Namespaced cache key per product or new recipe
  const getRecipeCacheKey = () => {
    const base = 'recipe_state_v2';
    return isEditMode && productId ? `${base}_${productId}` : `${base}_new`;
  };
  

  // Cache functions for state preservation
  const saveStateToCache = () => {
    const currentState = {
      recipeName,
      addedIngredients,
      isRecipeCreated,
      searchQuery,
      hasSearched,
      searchResults,
      totalResults,
      currentPage,
      servingsPerContainer,
      servingSizeWeight,
      servingSizeNumber,
      labelSetupMode,
      netWeightPerPackage,
      servingsPerPackage,
      // Additional persisted fields
      recipeDescription,
      productImageUrl,
      selectedCategoryId,
      ingredientStatements,
      allergenData,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(getRecipeCacheKey(), JSON.stringify(currentState));
    } catch (error) {
      console.warn('Failed to save recipe state to cache:', error);
    }
  };

  const loadStateFromCache = () => {
    try {
      const cachedState = localStorage.getItem(getRecipeCacheKey());
      if (cachedState) {
        const parsedState = JSON.parse(cachedState);
        
        // Check if cache is not too old (1 hour max)
        const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
        if (Date.now() - parsedState.timestamp < maxAge) {
          return parsedState;
        } else {
          // Clear old cache
          localStorage.removeItem(getRecipeCacheKey());
        }
      }
    } catch (error) {
      console.warn('Failed to load recipe state from cache:', error);
      localStorage.removeItem(getRecipeCacheKey());
    }
    return null;
  };

  const clearStateCache = () => {
    try {
      localStorage.removeItem(getRecipeCacheKey());
    } catch (error) {
      console.warn('Failed to clear recipe state cache:', error);
    }
  };

  // Autosave to localStorage (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      saveStateToCache();
    }, 300);
    return () => clearTimeout(t);
  }, [
    recipeName,
    recipeDescription,
    addedIngredients,
    isRecipeCreated,
    searchQuery,
    hasSearched,
    searchResults,
    totalResults,
    currentPage,
    servingsPerContainer,
    servingSizeWeight,
    servingSizeNumber,
    labelSetupMode,
    netWeightPerPackage,
    servingsPerPackage,
    productImageUrl,
    selectedCategoryId,
    ingredientStatements,
    allergenData
  ]);

  // Persist on page exit/refresh
  useEffect(() => {
    const onBeforeUnload = () => {
      saveStateToCache();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Initialize state from cache on component mount and handle direct navigation
  useEffect(() => {
    const loadExistingRecipe = async () => {
        if (isEditMode && productId) {
          try {
            setIsLoadingExistingRecipe(true);
            
            // Load recipe data from API
            const response = await ProgressiveRecipeApi.getRecipe(productId);
            
            if (response.success && response.data) {
              const recipeData = response.data;
              
              // Set recipe basic info
              setRecipeName(recipeData.name || '');
              setRecipeDescription(recipeData.description || '');
              setCurrentRecipe(recipeData);
              setIsRecipeCreated(true);
              
              // Load ingredients if available
              if (recipeData.ingredients_data && Array.isArray(recipeData.ingredients_data)) {
                const ingredients = recipeData.ingredients_data.map((ing: any, index: number) => ({
                  id: ing.id || `ingredient-${index}`,
                  name: ing.name || '',
                  quantity: ing.quantity || 0,
                  unit: ing.unit || 'g',
                  waste: ing.waste_percentage || ing.waste || 0,
                  grams: ing.grams || 0,
                  availableMeasures: ing.available_measures || ing.availableMeasures || [],
                  allergens: ing.allergens || [],
                  nutritionProportion: ing.nutrition_proportion || ing.nutritionProportion || null
                }));
                setAddedIngredients(ingredients);
                
                // Update ingredient names tracking set
                const ingredientNames = new Set<string>(
                  ingredients.map((ing: AddedIngredient) => ing.name.toLowerCase().trim())
                );
                setAddedIngredientNames(ingredientNames);
              }
              
              // Load product details
              if (recipeData.image_url) {
                setProductImageUrl(recipeData.image_url);
              }
              
              if (recipeData.category_id) {
                setSelectedCategoryId(recipeData.category_id);
              }
              
              // Load ingredient statements if available
              if (recipeData.ingredient_statements) {
                setIngredientStatements(recipeData.ingredient_statements);
              }
              
              // Load allergen data if available
              if (recipeData.allergens_data) {
                // Transform flat array structure back to category-based structure
                const transformedAllergenData = transformFlatToCategories(recipeData.allergens_data);
                setAllergenData(transformedAllergenData);
              } else {
                setAllergenData(getEmptyAllergenData());
              }
              
              // Load publication settings if available
              if (recipeData.status) {
                setPublicationStatus(recipeData.status);
              }
              if (recipeData.is_public !== undefined) {
                setIsPublic(recipeData.is_public);
              }
              
              // Load serving configuration
              if (recipeData.serving_configuration) {
                const servingConfig = recipeData.serving_configuration;
                setServingsPerContainer(servingConfig.servings_per_container || 1);
                setServingSizeWeight(servingConfig.serving_size_grams || 224);
                setServingSizeNumber(servingConfig.serving_size_number || 1);
                setNetWeightPerPackage(servingConfig.net_weight_per_package || servingConfig.net_weight || 100);
                setServingsPerPackage(servingConfig.servings_per_package || servingConfig.servings_per_container || 1);
                setLabelSetupMode(servingConfig.mode || 'package');
              }
              
              // Load existing nutrition data if available
              if (recipeData.nutrition_data) {
                
                // Create raw nutrition data from database for local recalculation
                const rawNutritionFromDB: NutritionData = {
                  yield: recipeData.nutrition_data.yield || 1,
                  calories: recipeData.nutrition_data.calories || 0,
                  totalWeight: recipeData.nutrition_data.total_weight || 0,
                  totalNutrients: {
                    // Macronutrients
                    FAT: { label: 'Total lipid (fat)', quantity: recipeData.nutrition_data.macronutrients?.total_fat || 0, unit: 'g' },
                    FASAT: { label: 'Fatty acids, total saturated', quantity: recipeData.nutrition_data.macronutrients?.saturated_fat || 0, unit: 'g' },
                    FATRN: { label: 'Fatty acids, total trans', quantity: recipeData.nutrition_data.macronutrients?.trans_fat || 0, unit: 'g' },
                    FAMS: { label: 'Fatty acids, total monounsaturated', quantity: 0, unit: 'g' },
                    FAPU: { label: 'Fatty acids, total polyunsaturated', quantity: 0, unit: 'g' },
                    CHOCDF: { label: 'Carbohydrate, by difference', quantity: recipeData.nutrition_data.macronutrients?.total_carbohydrate || 0, unit: 'g' },
                    FIBTG: { label: 'Fiber, total dietary', quantity: recipeData.nutrition_data.macronutrients?.dietary_fiber || 0, unit: 'g' },
                    SUGAR: { label: 'Sugars, total', quantity: recipeData.nutrition_data.macronutrients?.total_sugars || 0, unit: 'g' },
                    PROCNT: { label: 'Protein', quantity: recipeData.nutrition_data.macronutrients?.protein || 0, unit: 'g' },
                    CHOLE: { label: 'Cholesterol', quantity: recipeData.nutrition_data.macronutrients?.cholesterol || 0, unit: 'mg' },
                    NA: { label: 'Sodium, Na', quantity: recipeData.nutrition_data.macronutrients?.sodium || 0, unit: 'mg' },
                    
                    // Vitamins & Minerals
                    VITA_RAE: { label: 'Vitamin A, RAE', quantity: 0, unit: 'µg' },
                    VITC: { label: 'Vitamin C, total ascorbic acid', quantity: 0, unit: 'mg' },
                    VITD: { label: 'Vitamin D (D2 + D3)', quantity: recipeData.nutrition_data.vitamins_minerals?.vitamin_d || 0, unit: 'µg' },
                    TOCPHA: { label: 'Vitamin E (alpha-tocopherol)', quantity: 0, unit: 'mg' },
                    VITK1: { label: 'Vitamin K (phylloquinone)', quantity: 0, unit: 'µg' },
                    THIA: { label: 'Thiamin', quantity: 0, unit: 'mg' },
                    RIBF: { label: 'Riboflavin', quantity: 0, unit: 'mg' },
                    NIA: { label: 'Niacin', quantity: 0, unit: 'mg' },
                    VITB6A: { label: 'Vitamin B-6', quantity: 0, unit: 'mg' },
                    FOLDFE: { label: 'Folate, DFE', quantity: 0, unit: 'µg' },
                    VITB12: { label: 'Vitamin B-12', quantity: 0, unit: 'µg' },
                    PANTAC: { label: 'Pantothenic acid', quantity: 0, unit: 'mg' },
                    
                    CA: { label: 'Calcium, Ca', quantity: recipeData.nutrition_data.vitamins_minerals?.calcium || 0, unit: 'mg' },
                    FE: { label: 'Iron, Fe', quantity: recipeData.nutrition_data.vitamins_minerals?.iron || 0, unit: 'mg' },
                    K: { label: 'Potassium, K', quantity: recipeData.nutrition_data.vitamins_minerals?.potassium || 0, unit: 'mg' },
                    P: { label: 'Phosphorus, P', quantity: 0, unit: 'mg' },
                    MG: { label: 'Magnesium, Mg', quantity: recipeData.nutrition_data.vitamins_minerals?.magnesium || 0, unit: 'mg' },
                    ZN: { label: 'Zinc, Zn', quantity: 0, unit: 'mg' },
                    SE: { label: 'Selenium, Se', quantity: 0, unit: 'µg' },
                    CU: { label: 'Copper, Cu', quantity: 0, unit: 'mg' },
                    MN: { label: 'Manganese, Mn', quantity: 0, unit: 'mg' }
                  },
                  totalDaily: {
                    FAT: { label: 'Total lipid (fat)', quantity: recipeData.nutrition_data.daily_values?.total_fat_dv || 0, unit: '%' },
                    FASAT: { label: 'Fatty acids, total saturated', quantity: recipeData.nutrition_data.daily_values?.saturated_fat_dv || 0, unit: '%' },
                    CHOCDF: { label: 'Carbohydrate, by difference', quantity: recipeData.nutrition_data.daily_values?.total_carbohydrate_dv || 0, unit: '%' },
                    FIBTG: { label: 'Fiber, total dietary', quantity: recipeData.nutrition_data.daily_values?.dietary_fiber_dv || 0, unit: '%' },
                    PROCNT: { label: 'Protein', quantity: recipeData.nutrition_data.daily_values?.protein_dv || 0, unit: '%' },
                    CHOLE: { label: 'Cholesterol', quantity: recipeData.nutrition_data.daily_values?.cholesterol_dv || 0, unit: '%' },
                    NA: { label: 'Sodium, Na', quantity: recipeData.nutrition_data.daily_values?.sodium_dv || 0, unit: '%' },
                    CA: { label: 'Calcium, Ca', quantity: recipeData.nutrition_data.daily_values?.calcium_dv || 0, unit: '%' },
                    MG: { label: 'Magnesium, Mg', quantity: recipeData.nutrition_data.daily_values?.magnesium_dv || 0, unit: '%' },
                    K: { label: 'Potassium, K', quantity: recipeData.nutrition_data.daily_values?.potassium_dv || 0, unit: '%' },
                    FE: { label: 'Iron, Fe', quantity: recipeData.nutrition_data.daily_values?.iron_dv || 0, unit: '%' },
                    VITD: { label: 'Vitamin D', quantity: recipeData.nutrition_data.daily_values?.vitamin_d_dv || 0, unit: '%' }
                  }
                };
                
                // Set raw nutrition data for local recalculation
                setRawNutritionData(rawNutritionFromDB);
                
                // Load per-serving data if available
                if (recipeData.nutrition_data.per_serving_data) {
                  const dbPerServingData = recipeData.nutrition_data.per_serving_data;
                  
                  // Convert database format to expected PerServingNutritionData format
                  const perServingData: PerServingNutritionData = {
                    servingsPerContainer: recipeData.nutrition_data.servings_per_container || 1,
                    servingSize: dbPerServingData.serving_size || '1 serving',
                    servingSizeGrams: dbPerServingData.serving_size_grams || 0,
                    calories: dbPerServingData.calories_per_serving || 0,
                    
                    // Map nutrients_per_serving to nutrients
                    nutrients: dbPerServingData.nutrients_per_serving || {
                      FAT: { label: "Fat", quantity: 0, unit: "g" },
                      FASAT: { label: "Saturated Fat", quantity: 0, unit: "g" },
                      FATRN: { label: "Trans Fat", quantity: 0, unit: "g" },
                      CHOCDF: { label: "Total Carbohydrate", quantity: 0, unit: "g" },
                      FIBTG: { label: "Dietary Fiber", quantity: 0, unit: "g" },
                      SUGAR: { label: "Total Sugars", quantity: 0, unit: "g" },
                      PROCNT: { label: "Protein", quantity: 0, unit: "g" },
                      CHOLE: { label: "Cholesterol", quantity: 0, unit: "mg" },
                      NA: { label: "Sodium", quantity: 0, unit: "mg" },
                      CA: { label: "Calcium", quantity: 0, unit: "mg" },
                      MG: { label: "Magnesium", quantity: 0, unit: "mg" },
                      K: { label: "Potassium", quantity: 0, unit: "mg" },
                      FE: { label: "Iron", quantity: 0, unit: "mg" },
                      VITD: { label: "Vitamin D", quantity: 0, unit: "µg" },
                    },
                    
                    // Map daily_values_per_serving to dailyValues
                    dailyValues: dbPerServingData.daily_values_per_serving || {
                      FAT: { label: "Fat", quantity: 0, unit: "%" },
                      FASAT: { label: "Saturated Fat", quantity: 0, unit: "%" },
                      CHOCDF: { label: "Total Carbohydrate", quantity: 0, unit: "%" },
                      FIBTG: { label: "Dietary Fiber", quantity: 0, unit: "%" },
                      PROCNT: { label: "Protein", quantity: 0, unit: "%" },
                      CHOLE: { label: "Cholesterol", quantity: 0, unit: "%" },
                      NA: { label: "Sodium", quantity: 0, unit: "%" },
                      CA: { label: "Calcium", quantity: 0, unit: "%" },
                      MG: { label: "Magnesium", quantity: 0, unit: "%" },
                      K: { label: "Potassium", quantity: 0, unit: "%" },
                      FE: { label: "Iron", quantity: 0, unit: "%" },
                      VITD: { label: "Vitamin D", quantity: 0, unit: "%" },
                    }
                  };
                  
                  setPerServingData(perServingData);
                  
                  // Map to FDA format for display
                  const fdaNutritionData = mapPerServingDataToFDAFormat(perServingData);
                  setNutritionData(fdaNutritionData);
                } else if (recipeData.nutrition_data.macronutrients) {
                  // Handle case where we have nutrition data but no per_serving_data
                  // This can happen if the recipe was created before per_serving_data was added
                  
                  // Create a basic per-serving data structure from the available data
                  const basicPerServingData: PerServingNutritionData = {
                    servingsPerContainer: recipeData.nutrition_data.servings_per_container || 1,
                    servingSize: '1 serving',
                    servingSizeGrams: recipeData.nutrition_data.total_weight || 0,
                    calories: recipeData.nutrition_data.calories || 0,
                    
                    nutrients: {
                      FAT: { label: "Fat", quantity: recipeData.nutrition_data.macronutrients.total_fat || 0, unit: "g" },
                      FASAT: { label: "Saturated Fat", quantity: recipeData.nutrition_data.macronutrients.saturated_fat || 0, unit: "g" },
                      FATRN: { label: "Trans Fat", quantity: recipeData.nutrition_data.macronutrients.trans_fat || 0, unit: "g" },
                      CHOCDF: { label: "Total Carbohydrate", quantity: recipeData.nutrition_data.macronutrients.total_carbohydrate || 0, unit: "g" },
                      FIBTG: { label: "Dietary Fiber", quantity: recipeData.nutrition_data.macronutrients.dietary_fiber || 0, unit: "g" },
                      SUGAR: { label: "Total Sugars", quantity: recipeData.nutrition_data.macronutrients.total_sugars || 0, unit: "g" },
                      PROCNT: { label: "Protein", quantity: recipeData.nutrition_data.macronutrients.protein || 0, unit: "g" },
                      CHOLE: { label: "Cholesterol", quantity: recipeData.nutrition_data.macronutrients.cholesterol || 0, unit: "mg" },
                      NA: { label: "Sodium", quantity: recipeData.nutrition_data.macronutrients.sodium || 0, unit: "mg" },
                      CA: { label: "Calcium", quantity: recipeData.nutrition_data.vitamins_minerals?.calcium || 0, unit: "mg" },
                      MG: { label: "Magnesium", quantity: recipeData.nutrition_data.vitamins_minerals?.magnesium || 0, unit: "mg" },
                      K: { label: "Potassium", quantity: recipeData.nutrition_data.vitamins_minerals?.potassium || 0, unit: "mg" },
                      FE: { label: "Iron", quantity: recipeData.nutrition_data.vitamins_minerals?.iron || 0, unit: "mg" },
                      VITD: { label: "Vitamin D", quantity: recipeData.nutrition_data.vitamins_minerals?.vitamin_d || 0, unit: "µg" },
                    },
                    
                    dailyValues: {
                      FAT: { label: "Fat", quantity: recipeData.nutrition_data.daily_values?.total_fat_dv || 0, unit: "%" },
                      FASAT: { label: "Saturated Fat", quantity: recipeData.nutrition_data.daily_values?.saturated_fat_dv || 0, unit: "%" },
                      CHOCDF: { label: "Total Carbohydrate", quantity: recipeData.nutrition_data.daily_values?.total_carbohydrate_dv || 0, unit: "%" },
                      FIBTG: { label: "Dietary Fiber", quantity: recipeData.nutrition_data.daily_values?.dietary_fiber_dv || 0, unit: "%" },
                      PROCNT: { label: "Protein", quantity: recipeData.nutrition_data.daily_values?.protein_dv || 0, unit: "%" },
                      CHOLE: { label: "Cholesterol", quantity: recipeData.nutrition_data.daily_values?.cholesterol_dv || 0, unit: "%" },
                      NA: { label: "Sodium", quantity: recipeData.nutrition_data.daily_values?.sodium_dv || 0, unit: "%" },
                      CA: { label: "Calcium", quantity: recipeData.nutrition_data.daily_values?.calcium_dv || 0, unit: "%" },
                      MG: { label: "Magnesium", quantity: recipeData.nutrition_data.daily_values?.magnesium_dv || 0, unit: "%" },
                      K: { label: "Potassium", quantity: recipeData.nutrition_data.daily_values?.potassium_dv || 0, unit: "%" },
                      FE: { label: "Iron", quantity: recipeData.nutrition_data.daily_values?.iron_dv || 0, unit: "%" },
                      VITD: { label: "Vitamin D", quantity: recipeData.nutrition_data.daily_values?.vitamin_d_dv || 0, unit: "%" },
                    }
                  };
                  
                  setPerServingData(basicPerServingData);
                  const fdaNutritionData = mapPerServingDataToFDAFormat(basicPerServingData);
                  setNutritionData(fdaNutritionData);
                }
                
                // Set total grams from last analysis to enable local recalculation
                if (recipeData.nutrition_data.total_weight) {
                  setTotalGramsAtLastAnalysis(recipeData.nutrition_data.total_weight);
                }
                
                // Calculate nutrition proportions for ingredients if we have both ingredients and nutrition data
                if (recipeData.ingredients_data && Array.isArray(recipeData.ingredients_data) && rawNutritionFromDB) {
                  const ingredientsWithProportions = calculateNutritionProportions(
                    recipeData.ingredients_data.map((ing: any, index: number) => ({
                      id: ing.id || `ingredient-${index}`,
                      name: ing.name || '',
                      quantity: ing.quantity || 0,
                      unit: ing.unit || 'g',
                      waste: ing.waste_percentage || ing.waste || 0,
                      grams: ing.grams || 0,
                      availableMeasures: ing.available_measures || ing.availableMeasures || [],
                      allergens: ing.allergens || [],
                      nutritionProportion: ing.nutrition_proportion || ing.nutritionProportion || null
                    })),
                    rawNutritionFromDB
                  );
                  
                  // Update ingredients with calculated proportions
                  setAddedIngredients(ingredientsWithProportions);
                }
                
                // CRITICAL FIX: Trigger per-serving recalculation after loading nutrition data
                // This ensures that per-serving nutrition is displayed correctly in edit mode
                setTimeout(() => {
                  if (rawNutritionFromDB && perServingData) {
                    // Get the loaded serving configuration
                    const loadedServings = recipeData.serving_configuration?.servings_per_container || 1;
                    const loadedServingWeight = recipeData.serving_configuration?.serving_size_grams || 224;
                    const loadedServingNumber = recipeData.serving_configuration?.serving_size_number || 1;
                    const loadedMode = recipeData.serving_configuration?.mode || 'package';
                    const loadedNetWeight = recipeData.serving_configuration?.net_weight_per_package || 100;
                    const loadedServingsPerPkg = recipeData.serving_configuration?.servings_per_package || 1;
                    
                    // Recalculate based on the loaded configuration
                    if (loadedMode === 'package') {
                      // Use package-based calculation
                      const packageScalingFactor = loadedNetWeight / rawNutritionFromDB.totalWeight;
                      const servingSizeGrams = loadedNetWeight / loadedServingsPerPkg;
                      
                      const packagePerServingData: PerServingNutritionData = {
                        servingsPerContainer: loadedServingsPerPkg,
                        servingSize: `${Math.round(servingSizeGrams)}g`,
                        servingSizeGrams: Math.round(servingSizeGrams),
                        calories: Math.round((rawNutritionFromDB.calories * packageScalingFactor) / loadedServingsPerPkg),
                        nutrients: {
                          FAT: { label: rawNutritionFromDB.totalNutrients.FAT.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FAT.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FAT.unit },
                          FASAT: { label: rawNutritionFromDB.totalNutrients.FASAT.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FASAT.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FASAT.unit },
                          FATRN: { label: rawNutritionFromDB.totalNutrients.FATRN.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FATRN.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FATRN.unit },
                          CHOCDF: { label: rawNutritionFromDB.totalNutrients.CHOCDF.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.CHOCDF.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.CHOCDF.unit },
                          FIBTG: { label: rawNutritionFromDB.totalNutrients.FIBTG.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FIBTG.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FIBTG.unit },
                          SUGAR: { label: rawNutritionFromDB.totalNutrients.SUGAR.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.SUGAR.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.SUGAR.unit },
                          PROCNT: { label: rawNutritionFromDB.totalNutrients.PROCNT.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.PROCNT.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.PROCNT.unit },
                          CHOLE: { label: rawNutritionFromDB.totalNutrients.CHOLE.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.CHOLE.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.CHOLE.unit },
                          NA: { label: rawNutritionFromDB.totalNutrients.NA.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.NA.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.NA.unit },
                          CA: { label: rawNutritionFromDB.totalNutrients.CA.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.CA.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.CA.unit },
                          MG: { label: rawNutritionFromDB.totalNutrients.MG.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.MG.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.MG.unit },
                          K: { label: rawNutritionFromDB.totalNutrients.K.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.K.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.K.unit },
                          FE: { label: rawNutritionFromDB.totalNutrients.FE.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FE.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FE.unit },
                          VITD: { label: rawNutritionFromDB.totalNutrients.VITD.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.VITD.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalNutrients.VITD.unit }
                        },
                        dailyValues: {
                          FAT: { label: rawNutritionFromDB.totalDaily.FAT.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FAT.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.FAT.unit },
                          FASAT: { label: rawNutritionFromDB.totalDaily.FASAT.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FASAT.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.FASAT.unit },
                          CHOCDF: { label: rawNutritionFromDB.totalDaily.CHOCDF.label, quantity: Math.round((rawNutritionFromDB.totalDaily.CHOCDF.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.CHOCDF.unit },
                          FIBTG: { label: rawNutritionFromDB.totalDaily.FIBTG.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FIBTG.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.FIBTG.unit },
                          PROCNT: { label: rawNutritionFromDB.totalDaily.PROCNT.label, quantity: Math.round((rawNutritionFromDB.totalDaily.PROCNT.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.PROCNT.unit },
                          CHOLE: { label: rawNutritionFromDB.totalDaily.CHOLE.label, quantity: Math.round((rawNutritionFromDB.totalDaily.CHOLE.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.CHOLE.unit },
                          NA: { label: rawNutritionFromDB.totalDaily.NA.label, quantity: Math.round((rawNutritionFromDB.totalDaily.NA.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.NA.unit },
                          CA: { label: rawNutritionFromDB.totalDaily.CA.label, quantity: Math.round((rawNutritionFromDB.totalDaily.CA.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.CA.unit },
                          MG: { label: rawNutritionFromDB.totalDaily.MG.label, quantity: Math.round((rawNutritionFromDB.totalDaily.MG.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.MG.unit },
                          K: { label: rawNutritionFromDB.totalDaily.K.label, quantity: Math.round((rawNutritionFromDB.totalDaily.K.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.K.unit },
                          FE: { label: rawNutritionFromDB.totalDaily.FE.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FE.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.FE.unit },
                          VITD: { label: rawNutritionFromDB.totalDaily.VITD.label, quantity: Math.round((rawNutritionFromDB.totalDaily.VITD.quantity * packageScalingFactor / loadedServingsPerPkg) * 100) / 100, unit: rawNutritionFromDB.totalDaily.VITD.unit }
                        }
                      };
                      
                      setPerServingData(packagePerServingData);
                      const fdaNutritionData = mapPerServingDataToFDAFormat(packagePerServingData);
                      setNutritionData(fdaNutritionData);
                    } else {
                      // Use serving-based calculation
                      const scalingFactor = loadedServingNumber;
                      const customPerServingData: PerServingNutritionData = {
                        servingsPerContainer: 1,
                        servingSize: `${Math.round(loadedServingWeight)}g`,
                        servingSizeGrams: Math.round(loadedServingWeight),
                        calories: Math.round((rawNutritionFromDB.calories / (rawNutritionFromDB.yield || 1)) * scalingFactor),
                        nutrients: {
                          FAT: { label: rawNutritionFromDB.totalNutrients.FAT.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FAT.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FAT.unit },
                          FASAT: { label: rawNutritionFromDB.totalNutrients.FASAT.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FASAT.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FASAT.unit },
                          FATRN: { label: rawNutritionFromDB.totalNutrients.FATRN.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FATRN.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FATRN.unit },
                          CHOCDF: { label: rawNutritionFromDB.totalNutrients.CHOCDF.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.CHOCDF.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.CHOCDF.unit },
                          FIBTG: { label: rawNutritionFromDB.totalNutrients.FIBTG.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FIBTG.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FIBTG.unit },
                          SUGAR: { label: rawNutritionFromDB.totalNutrients.SUGAR.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.SUGAR.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.SUGAR.unit },
                          PROCNT: { label: rawNutritionFromDB.totalNutrients.PROCNT.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.PROCNT.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.PROCNT.unit },
                          CHOLE: { label: rawNutritionFromDB.totalNutrients.CHOLE.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.CHOLE.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.CHOLE.unit },
                          NA: { label: rawNutritionFromDB.totalNutrients.NA.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.NA.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.NA.unit },
                          CA: { label: rawNutritionFromDB.totalNutrients.CA.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.CA.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.CA.unit },
                          MG: { label: rawNutritionFromDB.totalNutrients.MG.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.MG.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.MG.unit },
                          K: { label: rawNutritionFromDB.totalNutrients.K.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.K.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.K.unit },
                          FE: { label: rawNutritionFromDB.totalNutrients.FE.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.FE.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.FE.unit },
                          VITD: { label: rawNutritionFromDB.totalNutrients.VITD.label, quantity: Math.round((rawNutritionFromDB.totalNutrients.VITD.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalNutrients.VITD.unit }
                        },
                        dailyValues: {
                          FAT: { label: rawNutritionFromDB.totalDaily.FAT.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FAT.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.FAT.unit },
                          FASAT: { label: rawNutritionFromDB.totalDaily.FASAT.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FASAT.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.FASAT.unit },
                          CHOCDF: { label: rawNutritionFromDB.totalDaily.CHOCDF.label, quantity: Math.round((rawNutritionFromDB.totalDaily.CHOCDF.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.CHOCDF.unit },
                          FIBTG: { label: rawNutritionFromDB.totalDaily.FIBTG.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FIBTG.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.FIBTG.unit },
                          PROCNT: { label: rawNutritionFromDB.totalDaily.PROCNT.label, quantity: Math.round((rawNutritionFromDB.totalDaily.PROCNT.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.PROCNT.unit },
                          CHOLE: { label: rawNutritionFromDB.totalDaily.CHOLE.label, quantity: Math.round((rawNutritionFromDB.totalDaily.CHOLE.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.CHOLE.unit },
                          NA: { label: rawNutritionFromDB.totalDaily.NA.label, quantity: Math.round((rawNutritionFromDB.totalDaily.NA.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.NA.unit },
                          CA: { label: rawNutritionFromDB.totalDaily.CA.label, quantity: Math.round((rawNutritionFromDB.totalDaily.CA.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.CA.unit },
                          MG: { label: rawNutritionFromDB.totalDaily.MG.label, quantity: Math.round((rawNutritionFromDB.totalDaily.MG.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.MG.unit },
                          K: { label: rawNutritionFromDB.totalDaily.K.label, quantity: Math.round((rawNutritionFromDB.totalDaily.K.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.K.unit },
                          FE: { label: rawNutritionFromDB.totalDaily.FE.label, quantity: Math.round((rawNutritionFromDB.totalDaily.FE.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.FE.unit },
                          VITD: { label: rawNutritionFromDB.totalDaily.VITD.label, quantity: Math.round((rawNutritionFromDB.totalDaily.VITD.quantity / (rawNutritionFromDB.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionFromDB.totalDaily.VITD.unit }
                        }
                      };
                      
                      setPerServingData(customPerServingData);
                      const fdaNutritionData = mapPerServingDataToFDAFormat(customPerServingData);
                      setNutritionData(fdaNutritionData);
                    }
                  }
                }, 100); // Small delay to ensure all state is set
              }

              // Load recipe progress
              try {
                const progressResponse = await ProgressiveRecipeApi.getProgress(productId);
                if (progressResponse && progressResponse.success) {
                  setRecipeProgress(progressResponse.data.progress);
                }
              } catch (progressError) {
                console.warn('⚠️ Failed to load progress, but recipe was loaded:', progressError);
              }
              
            } else {
              console.error('❌ Failed to load recipe data - Invalid response format:', response);
              toast({
                title: "Error",
                description: "Failed to load recipe data. Please try again.",
                variant: "destructive"
              });
              navigate('/products');
            }
          } catch (error: any) {
            console.error('❌ Failed to load recipe data', error);
            toast({
              title: "Error",
              description: 'Failed to load recipe: ' + (error.message || 'Unknown error'),
              variant: "destructive"
            });
            navigate('/products');
          } finally {
            setIsLoadingExistingRecipe(false);
          }
        }
      };

    if (isEditMode) {
      loadExistingRecipe();
    } else {
      // Load cached state for new recipes
      const cachedState = loadStateFromCache();
      if (cachedState) {
        // Restore all the cached state
        setRecipeName(cachedState.recipeName || '');
        setAddedIngredients(cachedState.addedIngredients || []);
        setIsRecipeCreated(cachedState.isRecipeCreated || false);
        setSearchQuery(cachedState.searchQuery || '');
        setHasSearched(cachedState.hasSearched || false);
        setSearchResults(cachedState.searchResults || []);
        setTotalResults(cachedState.totalResults || 0);
        setCurrentPage(cachedState.currentPage || 1);
        setServingsPerContainer(cachedState.servingsPerContainer || 1);
        setServingSizeWeight(cachedState.servingSizeWeight || 224);
        setServingSizeNumber(cachedState.servingSizeNumber || 1);
        setLabelSetupMode(cachedState.labelSetupMode || 'package');
        setNetWeightPerPackage(cachedState.netWeightPerPackage || 100);
        setServingsPerPackage(cachedState.servingsPerPackage || 1);
        
        // Restore additional persisted fields
        if (cachedState.recipeDescription !== undefined) setRecipeDescription(cachedState.recipeDescription || '');
        if (cachedState.productImageUrl !== undefined) setProductImageUrl(cachedState.productImageUrl || '');
        if (cachedState.selectedCategoryId !== undefined) setSelectedCategoryId(cachedState.selectedCategoryId || null);
        if (cachedState.ingredientStatements) setIngredientStatements(cachedState.ingredientStatements);
        if (cachedState.allergenData) setAllergenData(cachedState.allergenData);
        
        // Restore ingredient names tracking set
        if (cachedState.addedIngredients) {
          const ingredientNames = new Set<string>(
            cachedState.addedIngredients.map((ing: AddedIngredient) => ing.name.toLowerCase().trim())
          );
          setAddedIngredientNames(ingredientNames);
        }
        
        // Keep cache after successful restoration to persist across refresh
        // clearStateCache();
      } else {
        // For new recipes, automatically create recipe when user starts entering name
        if (location.pathname === '/products/new' && !isRecipeCreated) {
          setIsRecipeCreated(true);
        }
      }
    }
  }, [isEditMode, productId, location.pathname, navigate]); // Remove dependencies that cause loops

  // Handle custom ingredient data returned from the custom ingredient page
  useEffect(() => {
    if (location.state?.customIngredient) {
      const customIngredientData = location.state.customIngredient as CustomIngredientData;
      handleCustomIngredientSubmit(customIngredientData);
      
      // Clear the state to prevent re-processing on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Handle returning from custom label page
  useEffect(() => {
    if (location.state?.returnFromCustomLabel) {
      console.log('🔍 Navigation Debug - Handling return from custom label page');
      console.log('🔍 Navigation Debug - Location state:', location.state);
      
      // Restore recipe name if provided
      if (location.state.recipeName && !recipeName) {
        console.log('🔍 Navigation Debug - Restoring recipe name:', location.state.recipeName);
        setRecipeName(location.state.recipeName);
      }
      
      // Ensure recipe is marked as created if we have recipe data
      if (location.state.recipeName && !isRecipeCreated) {
        console.log('🔍 Navigation Debug - Marking recipe as created');
        setIsRecipeCreated(true);
      }
      
      // Clear the navigation state to prevent issues with future navigation
      setTimeout(() => {
        console.log('🔍 Navigation Debug - Clearing navigation state');
        window.history.replaceState(null, '', window.location.pathname);
      }, 100);
    }
  }, [location.state, recipeName, isRecipeCreated]);
  
  // Smart nutrition analysis - only call API when needed
  useEffect(() => {
    // Don't trigger during existing recipe loading
    if (isLoadingExistingRecipe) {
      console.log('🔄 Skipping nutrition analysis during recipe loading');
      return;
    }

    if (addedIngredients.length === 0) {
      initializeEmptyNutrition();
      return;
    }

    // Check if we can recalculate locally (all ingredients have nutrition proportions)
    const canRecalculateLocally = addedIngredients.every(ing => ing.nutritionProportion) && totalGramsAtLastAnalysis > 0;
    
    // In edit mode, only skip if we can recalculate locally OR if we're currently loading
    if (isEditMode && nutritionData && !isLoadingNutrition && canRecalculateLocally) {
      console.log('🔄 Edit mode: Using local recalculation, skipping API call');
      // Trigger local recalculation to ensure display is updated
      const recalculatedNutrition = recalculateNutritionLocally(addedIngredients, totalGramsAtLastAnalysis);
      if (recalculatedNutrition) {
        setRawNutritionData(recalculatedNutrition);
        const perServingNutrition = calculatePerServingNutrition(recalculatedNutrition, servingsPerContainer);
        setPerServingData(perServingNutrition);
        const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
        setNutritionData(mappedData);
        setNutritionError(null);
      }
      return;
    }
    
    if (!canRecalculateLocally) {
      // Check if we have any search-based ingredients that need nutrition analysis
      const hasSearchBasedIngredients = addedIngredients.some(ing => !ing.id.startsWith('custom-'));
      
      if (hasSearchBasedIngredients) {
        // Need to make API call for new nutrition analysis (only for search-based ingredients)
        console.log('🔄 Making nutrition API call for search-based ingredients');
        performNutritionAnalysisLocal();
      } else {
        // All ingredients are custom - calculate nutrition from their existing data
        console.log('🔄 All ingredients are custom, calculating nutrition from existing data');
        performCustomNutritionCalculationLocal();
      }
    } else {
      // Can recalculate locally - do it now to ensure nutrition is displayed
      console.log('🔄 Recalculating nutrition locally');
      const recalculatedNutrition = recalculateNutritionLocally(addedIngredients, totalGramsAtLastAnalysis);
      if (recalculatedNutrition) {
        setRawNutritionData(recalculatedNutrition);
        const perServingNutrition = calculatePerServingNutrition(recalculatedNutrition, servingsPerContainer);
        setPerServingData(perServingNutrition);
        const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
        setNutritionData(mappedData);
        setNutritionError(null);
      }
    }
  }, [addedIngredients, totalGramsAtLastAnalysis, isEditMode, isLoadingNutrition, isLoadingExistingRecipe, servingsPerContainer]);

  // Auto-recalculate per-serving nutrition when serving configuration changes
  useEffect(() => {
    // Prevent infinite loops by checking if we have valid data and aren't in loading states
    if (!rawNutritionData || isLoadingNutrition || isLoadingExistingRecipe) {
      return;
    }

    console.log('🔄 Serving configuration changed, recalculating per-serving nutrition', {
      mode: labelSetupMode,
      servingSizeNumber,
      servingSizeWeight,
      netWeightPerPackage,
      servingsPerPackage
    });
    
    // Use a timeout to debounce rapid changes and prevent infinite loops
    const timeoutId = setTimeout(() => {
      if (labelSetupMode === 'package') {
        // Use package-based calculation - but don't call handlePackageConfigChange as it triggers backend save
        // Instead, calculate directly to avoid infinite loops
        if (netWeightPerPackage > 0 && servingsPerPackage > 0) {
          const servingSizeGrams = netWeightPerPackage / servingsPerPackage;
          const packageScalingFactor = netWeightPerPackage / rawNutritionData.totalWeight;
          
          const packagePerServingData: PerServingNutritionData = {
            servingsPerContainer: servingsPerPackage,
            servingSize: `${Math.round(servingSizeGrams)}g`,
            servingSizeGrams: Math.round(servingSizeGrams),
            calories: Math.round((rawNutritionData.calories * packageScalingFactor) / servingsPerPackage),
            nutrients: {
              FAT: { label: rawNutritionData.totalNutrients.FAT.label, quantity: Math.round((rawNutritionData.totalNutrients.FAT.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.FAT.unit },
              FASAT: { label: rawNutritionData.totalNutrients.FASAT.label, quantity: Math.round((rawNutritionData.totalNutrients.FASAT.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.FASAT.unit },
              FATRN: { label: rawNutritionData.totalNutrients.FATRN.label, quantity: Math.round((rawNutritionData.totalNutrients.FATRN.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.FATRN.unit },
              CHOCDF: { label: rawNutritionData.totalNutrients.CHOCDF.label, quantity: Math.round((rawNutritionData.totalNutrients.CHOCDF.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.CHOCDF.unit },
              FIBTG: { label: rawNutritionData.totalNutrients.FIBTG.label, quantity: Math.round((rawNutritionData.totalNutrients.FIBTG.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.FIBTG.unit },
              SUGAR: { label: rawNutritionData.totalNutrients.SUGAR.label, quantity: Math.round((rawNutritionData.totalNutrients.SUGAR.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.SUGAR.unit },
              PROCNT: { label: rawNutritionData.totalNutrients.PROCNT.label, quantity: Math.round((rawNutritionData.totalNutrients.PROCNT.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.PROCNT.unit },
              CHOLE: { label: rawNutritionData.totalNutrients.CHOLE.label, quantity: Math.round((rawNutritionData.totalNutrients.CHOLE.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.CHOLE.unit },
              NA: { label: rawNutritionData.totalNutrients.NA.label, quantity: Math.round((rawNutritionData.totalNutrients.NA.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.NA.unit },
              CA: { label: rawNutritionData.totalNutrients.CA.label, quantity: Math.round((rawNutritionData.totalNutrients.CA.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.CA.unit },
              MG: { label: rawNutritionData.totalNutrients.MG.label, quantity: Math.round((rawNutritionData.totalNutrients.MG.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.MG.unit },
              K: { label: rawNutritionData.totalNutrients.K.label, quantity: Math.round((rawNutritionData.totalNutrients.K.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.K.unit },
              FE: { label: rawNutritionData.totalNutrients.FE.label, quantity: Math.round((rawNutritionData.totalNutrients.FE.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.FE.unit },
              VITD: { label: rawNutritionData.totalNutrients.VITD.label, quantity: Math.round((rawNutritionData.totalNutrients.VITD.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalNutrients.VITD.unit }
            },
            dailyValues: {
              FAT: { label: rawNutritionData.totalDaily.FAT.label, quantity: Math.round((rawNutritionData.totalDaily.FAT.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.FAT.unit },
              FASAT: { label: rawNutritionData.totalDaily.FASAT.label, quantity: Math.round((rawNutritionData.totalDaily.FASAT.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.FASAT.unit },
              CHOCDF: { label: rawNutritionData.totalDaily.CHOCDF.label, quantity: Math.round((rawNutritionData.totalDaily.CHOCDF.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.CHOCDF.unit },
              FIBTG: { label: rawNutritionData.totalDaily.FIBTG.label, quantity: Math.round((rawNutritionData.totalDaily.FIBTG.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.FIBTG.unit },
              PROCNT: { label: rawNutritionData.totalDaily.PROCNT.label, quantity: Math.round((rawNutritionData.totalDaily.PROCNT.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.PROCNT.unit },
              CHOLE: { label: rawNutritionData.totalDaily.CHOLE.label, quantity: Math.round((rawNutritionData.totalDaily.CHOLE.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.CHOLE.unit },
              NA: { label: rawNutritionData.totalDaily.NA.label, quantity: Math.round((rawNutritionData.totalDaily.NA.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.NA.unit },
              CA: { label: rawNutritionData.totalDaily.CA.label, quantity: Math.round((rawNutritionData.totalDaily.CA.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.CA.unit },
              MG: { label: rawNutritionData.totalDaily.MG.label, quantity: Math.round((rawNutritionData.totalDaily.MG.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.MG.unit },
              K: { label: rawNutritionData.totalDaily.K.label, quantity: Math.round((rawNutritionData.totalDaily.K.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.K.unit },
              FE: { label: rawNutritionData.totalDaily.FE.label, quantity: Math.round((rawNutritionData.totalDaily.FE.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.FE.unit },
              VITD: { label: rawNutritionData.totalDaily.VITD.label, quantity: Math.round((rawNutritionData.totalDaily.VITD.quantity * packageScalingFactor / servingsPerPackage) * 100) / 100, unit: rawNutritionData.totalDaily.VITD.unit }
            }
          };
          
          setPerServingData(packagePerServingData);
          const fdaNutritionData = mapPerServingDataToFDAFormat(packagePerServingData);
          setNutritionData(fdaNutritionData);
        }
      } else if (labelSetupMode === 'serving') {
        // Use serving-based calculation - but don't call updateNutritionForServingSize as it triggers backend save
        // Instead, calculate directly to avoid infinite loops
        if (servingSizeNumber > 0 && servingSizeWeight > 0) {
          const scalingFactor = servingSizeNumber;
          const customPerServingData: PerServingNutritionData = {
            servingsPerContainer: 1,
            servingSize: `${Math.round(servingSizeWeight)}g`,
            servingSizeGrams: Math.round(servingSizeWeight),
            calories: Math.round((rawNutritionData.calories / (rawNutritionData.yield || 1)) * scalingFactor),
            nutrients: {
              FAT: { label: rawNutritionData.totalNutrients.FAT.label, quantity: Math.round((rawNutritionData.totalNutrients.FAT.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.FAT.unit },
              FASAT: { label: rawNutritionData.totalNutrients.FASAT.label, quantity: Math.round((rawNutritionData.totalNutrients.FASAT.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.FASAT.unit },
              FATRN: { label: rawNutritionData.totalNutrients.FATRN.label, quantity: Math.round((rawNutritionData.totalNutrients.FATRN.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.FATRN.unit },
              CHOCDF: { label: rawNutritionData.totalNutrients.CHOCDF.label, quantity: Math.round((rawNutritionData.totalNutrients.CHOCDF.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.CHOCDF.unit },
              FIBTG: { label: rawNutritionData.totalNutrients.FIBTG.label, quantity: Math.round((rawNutritionData.totalNutrients.FIBTG.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.FIBTG.unit },
              SUGAR: { label: rawNutritionData.totalNutrients.SUGAR.label, quantity: Math.round((rawNutritionData.totalNutrients.SUGAR.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.SUGAR.unit },
              PROCNT: { label: rawNutritionData.totalNutrients.PROCNT.label, quantity: Math.round((rawNutritionData.totalNutrients.PROCNT.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.PROCNT.unit },
              CHOLE: { label: rawNutritionData.totalNutrients.CHOLE.label, quantity: Math.round((rawNutritionData.totalNutrients.CHOLE.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.CHOLE.unit },
              NA: { label: rawNutritionData.totalNutrients.NA.label, quantity: Math.round((rawNutritionData.totalNutrients.NA.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.NA.unit },
              CA: { label: rawNutritionData.totalNutrients.CA.label, quantity: Math.round((rawNutritionData.totalNutrients.CA.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.CA.unit },
              MG: { label: rawNutritionData.totalNutrients.MG.label, quantity: Math.round((rawNutritionData.totalNutrients.MG.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.MG.unit },
              K: { label: rawNutritionData.totalNutrients.K.label, quantity: Math.round((rawNutritionData.totalNutrients.K.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.K.unit },
              FE: { label: rawNutritionData.totalNutrients.FE.label, quantity: Math.round((rawNutritionData.totalNutrients.FE.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.FE.unit },
              VITD: { label: rawNutritionData.totalNutrients.VITD.label, quantity: Math.round((rawNutritionData.totalNutrients.VITD.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalNutrients.VITD.unit }
            },
            dailyValues: {
              FAT: { label: rawNutritionData.totalDaily.FAT.label, quantity: Math.round((rawNutritionData.totalDaily.FAT.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.FAT.unit },
              FASAT: { label: rawNutritionData.totalDaily.FASAT.label, quantity: Math.round((rawNutritionData.totalDaily.FASAT.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.FASAT.unit },
              CHOCDF: { label: rawNutritionData.totalDaily.CHOCDF.label, quantity: Math.round((rawNutritionData.totalDaily.CHOCDF.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.CHOCDF.unit },
              FIBTG: { label: rawNutritionData.totalDaily.FIBTG.label, quantity: Math.round((rawNutritionData.totalDaily.FIBTG.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.FIBTG.unit },
              PROCNT: { label: rawNutritionData.totalDaily.PROCNT.label, quantity: Math.round((rawNutritionData.totalDaily.PROCNT.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.PROCNT.unit },
              CHOLE: { label: rawNutritionData.totalDaily.CHOLE.label, quantity: Math.round((rawNutritionData.totalDaily.CHOLE.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.CHOLE.unit },
              NA: { label: rawNutritionData.totalDaily.NA.label, quantity: Math.round((rawNutritionData.totalDaily.NA.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.NA.unit },
              CA: { label: rawNutritionData.totalDaily.CA.label, quantity: Math.round((rawNutritionData.totalDaily.CA.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.CA.unit },
              MG: { label: rawNutritionData.totalDaily.MG.label, quantity: Math.round((rawNutritionData.totalDaily.MG.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.MG.unit },
              K: { label: rawNutritionData.totalDaily.K.label, quantity: Math.round((rawNutritionData.totalDaily.K.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.K.unit },
              FE: { label: rawNutritionData.totalDaily.FE.label, quantity: Math.round((rawNutritionData.totalDaily.FE.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.FE.unit },
              VITD: { label: rawNutritionData.totalDaily.VITD.label, quantity: Math.round((rawNutritionData.totalDaily.VITD.quantity / (rawNutritionData.yield || 1)) * scalingFactor * 100) / 100, unit: rawNutritionData.totalDaily.VITD.unit }
            }
          };
          
          setPerServingData(customPerServingData);
          const fdaNutritionData = mapPerServingDataToFDAFormat(customPerServingData);
          setNutritionData(fdaNutritionData);
          
          console.log('✅ Custom serving nutrition calculated:', customPerServingData);
        }
      }
    }, 100); // Small debounce delay

    return () => clearTimeout(timeoutId);
  }, [rawNutritionData, labelSetupMode, netWeightPerPackage, servingsPerPackage, servingSizeNumber, servingSizeWeight, isLoadingNutrition, isLoadingExistingRecipe]);
  
  // Local nutrition analysis functions using extracted utilities
  const performNutritionAnalysisLocal = async () => {
    if (addedIngredients.length === 0) return;
    
    setIsLoadingNutrition(true);
    setNutritionError(null);
    
    // Show user feedback for nutrition analysis start
    toast({
      title: "⚗️ Analyzing Nutrition...",
      description: `Processing ${addedIngredients.length} ingredients for nutrition data`,
    });
    
    try {
      const result = await analyzeNutrition(addedIngredients, recipeName || 'Custom Recipe');
      
      // Update states with results
      setRawNutritionData(result.nutritionData);
      setAddedIngredients(result.ingredientsWithProportions);
      setTotalGramsAtLastAnalysis(result.nutritionData.totalWeight);
      
      // Calculate per-serving nutrition
      const perServingNutrition = calculatePerServingNutrition(result.nutritionData, servingsPerContainer);
      setPerServingData(perServingNutrition);
      
      // Map to FDA format for display
      const fdaNutritionData = mapPerServingDataToFDAFormat(perServingNutrition);
      setNutritionData(fdaNutritionData);
      
      // Update allergen data from nutrition API response
      // This should replace any existing allergen data with fresh data from the API
      if (result.allergenData) {
        setAllergenData(result.allergenData);
        
        // Save the updated allergen data to backend
        if (currentRecipe?.id) {
          try {
            await ProgressiveRecipeApi.saveAllergens(currentRecipe.id, result.allergenData);
          } catch (error) {
            console.error('Failed to save allergen data:', error);
          }
        }
      }
      
      // Force progress update after nutrition analysis
      forceProgressUpdate();
      
      // Show success feedback
      toast({
        title: "✅ Nutrition Analysis Complete",
        description: `Successfully analyzed ${addedIngredients.length} ingredients`,
      });
      
      // Save to backend if recipe exists
      if (currentRecipe?.id) {
        await saveNutritionToBackendLocal(result.nutritionData, servingsPerContainer, perServingNutrition);
      }
      
    } catch (error: any) {
      console.error('❌ Nutrition analysis failed:', error);
      setNutritionError(error.message || 'Failed to analyze nutrition');
      
      // Show error feedback
      toast({
        title: "❌ Nutrition Analysis Failed",
        description: error.message || 'Failed to analyze nutrition data',
        variant: "destructive"
      });
    } finally {
      setIsLoadingNutrition(false);
    }
  };
  
  const performCustomNutritionCalculationLocal = () => {
    try {
      // Show user feedback for custom nutrition calculation
      toast({
        title: "🧮 Calculating Nutrition...",
        description: "Processing custom ingredient nutrition data",
      });
      
      const customNutritionData = calculateNutritionFromCustomIngredients(addedIngredients);
      
      // Update states with calculated data
      setRawNutritionData(customNutritionData);
      setTotalGramsAtLastAnalysis(customNutritionData.totalWeight);
      
      // Calculate per-serving nutrition
      const perServingNutrition = calculatePerServingNutrition(customNutritionData, servingsPerContainer);
      setPerServingData(perServingNutrition);
      
      // Map to FDA format for display
      const fdaNutritionData = mapPerServingDataToFDAFormat(perServingNutrition);
      setNutritionData(fdaNutritionData);
      
      // Clear any previous errors
      setNutritionError(null);
      
      // Force progress update after calculation
      forceProgressUpdate();
      
      // Show success feedback
      toast({
        title: "✅ Nutrition Calculated",
        description: "Custom ingredient nutrition data processed successfully",
      });
      
      // Save to backend if recipe exists
      if (currentRecipe?.id) {
        saveNutritionToBackendLocal(customNutritionData, servingsPerContainer, perServingNutrition);
      }
      
    } catch (error: any) {
      console.error('❌ Custom nutrition calculation failed:', error);
      setNutritionError(error.message || 'Failed to calculate nutrition from custom ingredients');
      
      // Show error feedback
      toast({
        title: "❌ Calculation Failed",
        description: error.message || 'Failed to calculate nutrition from custom ingredients',
        variant: "destructive"
      });
    }
  };
  
  const saveNutritionToBackendLocal = async (nutritionData: NutritionData, servingsPerContainer: number, perServingData?: PerServingNutritionData) => {
    if (!currentRecipe?.id) return;
    
    try {
      // Transform nutrition data to processed display format (what user sees)
      const processedNutritionData = {
        // Basic nutrition info
        calories: nutritionData.calories,
        total_weight: nutritionData.totalWeight,
        yield: nutritionData.yield,
        servings_per_container: servingsPerContainer,
        
        // Processed macronutrients (display values)
        macronutrients: {
          total_fat: nutritionData.totalNutrients.FAT.quantity,
          saturated_fat: nutritionData.totalNutrients.FASAT.quantity,
          trans_fat: nutritionData.totalNutrients.FATRN.quantity,
          cholesterol: nutritionData.totalNutrients.CHOLE.quantity,
          sodium: nutritionData.totalNutrients.NA.quantity,
          total_carbohydrate: nutritionData.totalNutrients.CHOCDF.quantity,
          dietary_fiber: nutritionData.totalNutrients.FIBTG.quantity,
          total_sugars: nutritionData.totalNutrients.SUGAR.quantity,
          protein: nutritionData.totalNutrients.PROCNT.quantity
        },
        
        // Processed vitamins & minerals (display values)
        vitamins_minerals: {
          vitamin_d: nutritionData.totalNutrients.VITD.quantity,
          calcium: nutritionData.totalNutrients.CA.quantity,
          iron: nutritionData.totalNutrients.FE.quantity,
          potassium: nutritionData.totalNutrients.K.quantity,
          magnesium: nutritionData.totalNutrients.MG.quantity
        },
        
        // Processed daily values (display percentages)
        daily_values: {
          total_fat_dv: nutritionData.totalDaily.FAT.quantity,
          saturated_fat_dv: nutritionData.totalDaily.FASAT.quantity,
          cholesterol_dv: nutritionData.totalDaily.CHOLE.quantity,
          sodium_dv: nutritionData.totalDaily.NA.quantity,
          total_carbohydrate_dv: nutritionData.totalDaily.CHOCDF.quantity,
          dietary_fiber_dv: nutritionData.totalDaily.FIBTG.quantity,
          protein_dv: nutritionData.totalDaily.PROCNT.quantity,
          vitamin_d_dv: nutritionData.totalDaily.VITD.quantity,
          calcium_dv: nutritionData.totalDaily.CA.quantity,
          iron_dv: nutritionData.totalDaily.FE.quantity,
          potassium_dv: nutritionData.totalDaily.K.quantity
        },
        
        // Health labels as tags
        health_labels: nutritionData.healthLabels || [],
        
        // Per-serving processed data (what displays on label)
        per_serving_data: perServingData ? {
          serving_size: perServingData.servingSize,
          serving_size_grams: perServingData.servingSizeGrams,
          calories_per_serving: perServingData.calories,
          nutrients_per_serving: perServingData.nutrients,
          daily_values_per_serving: perServingData.dailyValues
        } : null
      };
      
      const response = await ProgressiveRecipeApi.saveNutritionData(
        currentRecipe.id,
        processedNutritionData,
        servingsPerContainer,
        perServingData
      );
      
      if (response.success) {
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('Live sync nutrition progress error:', progressError);
        }
      } else {
        toast({
          title: "Sync Error",
          description: 'Live sync nutrition failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: 'Live sync nutrition error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    }
  };
  
  // Pagination logic for display (client-side pagination for already loaded results)
  const startIndex = (currentPage - 1) * displayedResultsPerPage;
  const endIndex = startIndex + displayedResultsPerPage;
  const currentResults = searchResults.slice(startIndex, endIndex);
  const totalDisplayPages = Math.ceil(searchResults.length / displayedResultsPerPage);
  
  const handleAddIngredient = async (ingredient: SimpleIngredient, forceAdd: boolean = false) => {
    try {
      setLoadingIngredientName(ingredient.name);
      
      const ingredientKey = ingredient.name.toLowerCase().trim();
      
      // Check for duplicate ingredients using tracking set
      if (!forceAdd) {
        const isDuplicate = addedIngredientNames.has(ingredientKey);
        
        if (isDuplicate) {
          setDuplicateIngredient(ingredient);
          setIsDuplicateDialogOpen(true);
          setLoadingIngredientName(null);
          return;
        }
      }
      
      // Add ingredient name to tracking set after duplicate check passes
      setAddedIngredientNames(prev => {
        const newSet = new Set(prev);
        newSet.add(ingredientKey);
        return newSet;
      });
      
      // Use extracted utility to process the ingredient
      const newIngredient = await processSearchIngredient(ingredient.name);
      
      if (!newIngredient) {
        console.error('❌ Failed to process ingredient:', ingredient.name);
        // Remove from tracking set since addition failed
        setAddedIngredientNames(prev => {
          const newSet = new Set(prev);
          newSet.delete(ingredientKey);
          return newSet;
        });
        return;
      }
      
      // Add to local state first
      setAddedIngredients(prev => {
        const updated = [...prev, newIngredient];
        
        console.log('🔍 Progress Debug - Ingredient added:', newIngredient.name);
        console.log('🔍 Progress Debug - Total ingredients now:', updated.length);
        forceProgressUpdate();
        
        // Step 2: Save ingredients to backend progressively
        if (currentRecipe?.id) {
          saveIngredientsToBackend(updated, currentRecipe, setRecipeProgress, toast);
        }
        
        return updated;
      });
      
      // Show success message
      toast({
        title: "✅ Ingredient Added",
        description: `"${newIngredient.name}" has been added to your recipe`,
      });
      
    } catch (error: any) {
      console.error('💥 Error adding ingredient:', error);
      
      // Remove from tracking set since addition failed
      const ingredientKey = ingredient.name.toLowerCase().trim();
      setAddedIngredientNames(prev => {
        const newSet = new Set(prev);
        newSet.delete(ingredientKey);
        return newSet;
      });
      
      // Handle specific error types with user-friendly messages
      if (error.message === 'EDAMAM_NO_DATA') {
        toast({
          title: "❌ Ingredient Not Found",
          description: `Edamam database doesn't have nutrition data for "${ingredient.name}". Try a simpler ingredient name or create a custom ingredient instead.`,
          variant: "destructive"
        });
      } else if (error.message === 'NETWORK_ERROR') {
        toast({
          title: "❌ Network Error",
          description: "Unable to connect to nutrition database. Please check your internet connection and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "❌ Failed to Add Ingredient",
          description: `Unable to add "${ingredient.name}" to your recipe. Please try again or create a custom ingredient.`,
          variant: "destructive"
        });
      }
    } finally {
      setLoadingIngredientName(null);
    }
  };

  
  const handleRemoveIngredient = (id: string) => {
    setAddedIngredients(prev => {
      const ingredientToRemove = prev.find(ing => ing.id === id);
      if (ingredientToRemove) {
        const ingredientKey = ingredientToRemove.name.toLowerCase().trim();
        setAddedIngredientNames(prevNames => {
          const newSet = new Set(prevNames);
          newSet.delete(ingredientKey);
          return newSet;
        });
      }
      
      const updated = prev.filter(ingredient => ingredient.id !== id);
      
      // Try to recalculate nutrition locally after removal
      if (updated.length > 0) {
        const recalculatedNutrition = recalculateNutritionLocally(updated, totalGramsAtLastAnalysis);
        if (recalculatedNutrition) {
          // Update nutrition data with locally recalculated values
          setRawNutritionData(recalculatedNutrition);
          
          // Recalculate per-serving nutrition
          const perServingNutrition = calculatePerServingNutrition(recalculatedNutrition, servingsPerContainer);
          setPerServingData(perServingNutrition);
          
          // Update FDA nutrition data
          const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
          setNutritionData(mappedData);
          
          // Clear any previous nutrition errors
          setNutritionError(null);
        }
        // If local recalculation fails, the useEffect will trigger API call
      } else {
        // No ingredients left, initialize empty nutrition
        initializeEmptyNutrition();
      }
      
      // Live sync: Immediately sync ingredient removal to backend
      if (currentRecipe?.id) {
        console.log('🔄 Live sync: Ingredient removed, syncing changes to backend...');
        saveIngredientsToBackend(updated, currentRecipe, setRecipeProgress, toast);
      }
      
      return updated;
    });
    
    // Force progress indicator update after ingredient removal
    forceProgressUpdate();
    setTimeout(() => {
      console.log('🔍 Progress Debug - After ingredient removal:', {
        remainingIngredients: addedIngredients.length - 1,
        nutritionDataExists: !!nutritionData
      });
      forceProgressUpdate();
    }, 100);
  };
  
  const handleUpdateIngredient = (id: string, field: keyof AddedIngredient, value: any) => {
    setAddedIngredients(prev => {
      const updated = prev.map(ingredient => {
        if (ingredient.id === id) {
          // Use extracted utility for updating ingredient properties
          return updateIngredientProperty(ingredient, field, value);
        }
        return ingredient;
      });
      
      // Try to recalculate nutrition locally instead of making API call
      const recalculatedNutrition = recalculateNutritionLocally(updated, totalGramsAtLastAnalysis);
      if (recalculatedNutrition) {
        // Update nutrition data with locally recalculated values
        setRawNutritionData(recalculatedNutrition);
        
        // Recalculate per-serving nutrition
        const perServingNutrition = calculatePerServingNutrition(recalculatedNutrition, servingsPerContainer);
        setPerServingData(perServingNutrition);
        
        // Update FDA nutrition data
        const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
        setNutritionData(mappedData);
        
        // Clear any previous nutrition errors since we successfully recalculated
        setNutritionError(null);
      }
      // If local recalculation fails, the useEffect will trigger API call
      
      // Live sync: Immediately sync ingredient update to backend
      if (currentRecipe?.id) {
        console.log('🔄 Live sync: Ingredient updated, syncing changes to backend...');
        saveIngredientsToBackend(updated, currentRecipe, setRecipeProgress, toast);
      }
      
      return updated;
    });
    
    // Force progress indicator update after ingredient update
    setTimeout(() => {
      console.log('🔍 Progress Debug - After ingredient update:', {
        totalIngredients: addedIngredients.length,
        nutritionDataExists: !!nutritionData
      });
    }, 100);
  };

  // Initialize nutrition data with empty values when no real data is available
  const initializeEmptyNutrition = () => {
    setNutritionData(getEmptyFDANutritionData());
    setRawNutritionData(null);
    setPerServingData(getEmptyPerServingNutritionData());
    setServingsPerContainer(1);
    setTotalGramsAtLastAnalysis(0);
  };

  // Function to handle serving size weight changes
  const handleServingSizeWeightChange = async (newWeight: number) => {
    console.log('🔄 Serving size weight change:', { newWeight, mode: labelSetupMode });
    setServingSizeWeight(newWeight);
    
    if (rawNutritionData && newWeight > 0) {
      // Calculate new serving size number based on weight
      const defaultServingWeight = rawNutritionData.totalWeight / (rawNutritionData.yield || 1);
      const newServingNumber = newWeight / defaultServingWeight;
      setServingSizeNumber(newServingNumber);
      
      // Update nutrition data based on new serving size
      await updateNutritionForServingSize(newServingNumber, newWeight, rawNutritionData);
    }
  };

  // Function to handle serving size number changes
  const handleServingSizeNumberChange = async (newNumber: number) => {
    console.log('🔄 Serving size number change:', { newNumber, mode: labelSetupMode });
    setServingSizeNumber(newNumber);
    
    if (rawNutritionData && newNumber > 0) {
      // Calculate new serving weight based on number
      const defaultServingWeight = rawNutritionData.totalWeight / (rawNutritionData.yield || 1);
      const newWeight = defaultServingWeight * newNumber;
      setServingSizeWeight(newWeight);
      
      // Update nutrition data based on new serving size
      await updateNutritionForServingSize(newNumber, newWeight, rawNutritionData);
    }
   };

  // Function to handle package configuration changes - simplified version using nutrition hook
  const handlePackageConfigChange = async (netWeight: number, servingsPerPkg: number) => {
    if (!rawNutritionData || netWeight <= 0 || servingsPerPkg <= 0) return;
    
    // This function is now handled by the useEffect that watches serving configuration changes
    // The actual calculation logic has been moved to the useEffect to avoid duplication
  };

  // Step 4: Save serving configuration to backend
  const saveServingConfigToBackend = async (servingConfig: any) => {
    if (!currentRecipe?.id) {
      console.warn('⚠️ No current recipe ID, skipping serving config save');
      return;
    }
    
    try {
      console.log('🔄 Saving serving configuration to backend:', {
        recipeId: currentRecipe.id,
        servingConfig
      });
      
      const response = await ProgressiveRecipeApi.configureServing(currentRecipe.id, servingConfig);
      
      console.log('📡 Serving config API response:', response);
      
      // Check if response has success property (wrapped format) or is direct data
      const isSuccess = response && (
        response.success === true ||
        (typeof response === 'object' && !response.hasOwnProperty('success') && (response as any).id)
      );
      
      if (isSuccess) {
        console.log('✅ Serving configuration saved to backend successfully:', response.success ? response.data : response);
        
        // Update progress - Fix the response validation issue
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          console.log('📡 Progress API response:', progressResponse);
          
          // Fix: Check for both success format and direct data format
          if (progressResponse && (progressResponse.success === true || progressResponse.data)) {
            const progressData = progressResponse.success ? progressResponse.data.progress : progressResponse.data.progress;
            console.log('📊 Progress updated after serving config save:', progressData);
            setRecipeProgress(progressData);
            
            // Step 5: Complete recipe if all steps are done
            if (progressData.current_step === 'serving_configured') {
              console.log('🎯 All steps completed, finalizing recipe...');
              await completeRecipe();
            }
          } else {
            console.warn('⚠️ Progress response format not recognized:', progressResponse);
          }
        } catch (progressError) {
          console.error('❌ Error getting progress after serving config save:', progressError);
        }
      } else {
        console.error('❌ Serving config save failed:', response);
        toast({
          title: "Save Error",
          description: 'Failed to save serving configuration: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Error saving serving configuration to backend:', error);
      toast({
        title: "Save Error",
        description: 'Failed to save serving configuration: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    }
  };

  // Publication status states
  const [publicationStatus, setPublicationStatus] = useState<'draft' | 'published'>('draft');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [showPublicationSettings, setShowPublicationSettings] = useState<boolean>(false);
  const [isUpdatingPublicationStatus, setIsUpdatingPublicationStatus] = useState<boolean>(false);

  // Step 5: Complete recipe creation with publication settings
  const completeRecipe = async (publishSettings?: { status: 'draft' | 'published', is_public: boolean }) => {
    if (!currentRecipe?.id) return;
    
    try {
      // Use provided settings or current state
      const finalStatus = publishSettings?.status || publicationStatus;
      const finalIsPublic = publishSettings?.is_public !== undefined ? publishSettings.is_public : isPublic;
      
      console.log('🔄 Completing recipe with publication settings:', {
        status: finalStatus,
        is_public: finalIsPublic
      });
      
      // Ensure we have basic serving configuration before completing
      if (!currentRecipe.serving_configuration && rawNutritionData) {
        console.log('🔧 Creating default serving configuration before completion...');
        const defaultServingConfig = {
          mode: 'serving' as const,
          servings_per_container: 1,
          serving_size_grams: Math.round(rawNutritionData.totalWeight / (rawNutritionData.yield || 1)),
          serving_size_number: 1
        };
        
        // Save serving configuration first
        await saveServingConfigToBackend(defaultServingConfig);
        
        // Update local state
        setCurrentRecipe(prev => prev ? {
          ...prev,
          serving_configuration: defaultServingConfig
        } : null);
      }
      
      const response = await ProgressiveRecipeApi.completeRecipe(currentRecipe.id, finalIsPublic, finalStatus);
      
      if (response.success) {
        console.log('✅ Recipe completed successfully:', response.data);
        
        // Update current recipe with new publication status
        setCurrentRecipe(prev => prev ? {
          ...prev,
          status: finalStatus,
          is_public: finalIsPublic,
          creation_step: 'completed'
        } : null);
        
        // Update progress to show completion
        const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
        if (progressResponse.success) {
          setRecipeProgress(progressResponse.data.progress);
        }
        
        // Show success message with publication status
        const statusMessage = finalStatus === 'published'
          ? (finalIsPublic ? 'published and made public' : 'published as private')
          : 'saved as draft';
        
        toast({
          title: "🎉 Recipe Complete!",
          description: `Your nutrition label is ready and recipe has been ${statusMessage}.`,
        });
        
        // Hide publication settings after completion
        setShowPublicationSettings(false);
      }
    } catch (error: any) {
      console.error('❌ Error completing recipe:', error);
      toast({
        title: "Error",
        description: 'Failed to complete recipe: ' + error.message,
        variant: "destructive"
      });
    }
  };

  // Handle publication settings change (local state only)
  const handlePublicationSettingsChange = (status: 'draft' | 'published', isPublicFlag: boolean) => {
    // Update local state only - no API call
    setPublicationStatus(status);
    setIsPublic(isPublicFlag);
  };

  // Handle saving as draft
  const handleSaveAsDraft = async () => {
    console.log('🔍 DEBUG: handleSaveAsDraft called');
    console.log('🔍 DEBUG: currentRecipe?.id:', currentRecipe?.id);
    console.log('🔍 DEBUG: isPublic:', isPublic);
    
    if (!currentRecipe?.id) {
      console.log('❌ DEBUG: No currentRecipe.id, returning early');
      toast({
        title: "Error",
        description: "No recipe found. Please create a recipe first.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 DEBUG: Setting loading state...');
    setIsUpdatingPublicationStatus(true);
    
    toast({
      title: "Saving Draft...",
      description: `Saving recipe as draft ${isPublic ? 'and making public' : 'as private'}...`,
    });
    
    try {
      console.log('🔄 Saving as draft:', { status: 'draft', is_public: isPublic });
      
      const response = await ProgressiveRecipeApi.updateRecipe(currentRecipe.id, {
        status: 'draft',
        is_public: isPublic
      });
      
      console.log('📡 DEBUG: API response:', response);
      
      // Handle both wrapped and direct response formats
      const isSuccess = response && (
        response.success === true ||
        (typeof response === 'object' && (response as any).id)
      );
      
      if (isSuccess) {
        console.log('✅ Draft saved successfully');
        setCurrentRecipe(prev => prev ? {
          ...prev,
          status: 'draft',
          is_public: isPublic
        } : null);
        setPublicationStatus('draft');
        
        toast({
          title: "✅ Draft Saved",
          description: `Recipe saved as draft ${isPublic ? 'and made public' : 'as private'}.`,
        });
      } else {
        console.log('❌ DEBUG: API response not successful:', response);
        toast({
          title: "Save Failed",
          description: (response as any)?.message || 'Failed to save draft',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Error saving draft:', error);
      toast({
        title: "Save Error",
        description: 'Failed to save draft: ' + error.message,
        variant: "destructive"
      });
    } finally {
      console.log('🔄 DEBUG: Clearing loading state...');
      setIsUpdatingPublicationStatus(false);
    }
  };

  // Handle publishing recipe
  const handlePublishRecipe = async () => {
    console.log('🔍 DEBUG: handlePublishRecipe called');
    console.log('🔍 DEBUG: currentRecipe?.id:', currentRecipe?.id);
    console.log('🔍 DEBUG: isPublic:', isPublic);
    
    if (!currentRecipe?.id) {
      console.log('❌ DEBUG: No currentRecipe.id, returning early');
      toast({
        title: "Error",
        description: "No recipe found. Please create a recipe first.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔄 DEBUG: Setting loading state...');
    setIsUpdatingPublicationStatus(true);
    
    toast({
      title: "Publishing Recipe...",
      description: `Publishing recipe ${isPublic ? 'and making public' : 'as private'}...`,
    });
    
    try {
      console.log('🔄 Publishing recipe:', { status: 'published', is_public: isPublic });
      
      const response = await ProgressiveRecipeApi.updateRecipe(currentRecipe.id, {
        status: 'published',
        is_public: isPublic
      });
      
      console.log('📡 DEBUG: API response:', response);
      
      // Handle both wrapped and direct response formats
      const isSuccess = response && (
        response.success === true ||
        (typeof response === 'object' && (response as any).id)
      );
      
      if (isSuccess) {
        console.log('✅ Recipe published successfully');
        setCurrentRecipe(prev => prev ? {
          ...prev,
          status: 'published',
          is_public: isPublic
        } : null);
        setPublicationStatus('published');
        
        toast({
          title: "✅ Recipe Published",
          description: `Recipe published ${isPublic ? 'and made public' : 'as private'}.`,
        });
      } else {
        console.log('❌ DEBUG: API response not successful:', response);
        toast({
          title: "Publish Failed",
          description: (response as any)?.message || 'Failed to publish recipe',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Error publishing recipe:', error);
      toast({
        title: "Publish Error",
        description: 'Failed to publish recipe: ' + error.message,
        variant: "destructive"
      });
    } finally {
      console.log('🔄 DEBUG: Clearing loading state...');
      setIsUpdatingPublicationStatus(false);
    }
  };

  // Function to update nutrition data based on serving size
  const updateNutritionForServingSize = async (servingNumber: number, servingWeight: number, nutritionData?: NutritionData) => {
    const dataToUse = nutritionData || rawNutritionData;
    if (!dataToUse) return;
    
    console.log('🔄 Updating nutrition for serving size:', { servingNumber, servingWeight, mode: labelSetupMode });
    
    // Calculate nutrition data for the custom serving size
    const scalingFactor = servingNumber; // This represents how many default servings we want
    
    // Create custom per-serving nutrition data
    const customPerServingData: PerServingNutritionData = {
      servingsPerContainer: 1, // Always 1 for custom serving size
      servingSize: `${Math.round(servingWeight)}g`,
      servingSizeGrams: Math.round(servingWeight),
      calories: Math.round((dataToUse.calories / (dataToUse.yield || 1)) * scalingFactor),
      
      nutrients: {
        FAT: {
          label: dataToUse.totalNutrients.FAT.label,
          quantity: Math.round((dataToUse.totalNutrients.FAT.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.FAT.unit
        },
        FASAT: {
          label: dataToUse.totalNutrients.FASAT.label,
          quantity: Math.round((dataToUse.totalNutrients.FASAT.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.FASAT.unit
        },
        FATRN: {
          label: dataToUse.totalNutrients.FATRN.label,
          quantity: Math.round((dataToUse.totalNutrients.FATRN.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.FATRN.unit
        },
        CHOCDF: {
          label: dataToUse.totalNutrients.CHOCDF.label,
          quantity: Math.round((dataToUse.totalNutrients.CHOCDF.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.CHOCDF.unit
        },
        FIBTG: {
          label: dataToUse.totalNutrients.FIBTG.label,
          quantity: Math.round((dataToUse.totalNutrients.FIBTG.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.FIBTG.unit
        },
        SUGAR: {
          label: dataToUse.totalNutrients.SUGAR.label,
          quantity: Math.round((dataToUse.totalNutrients.SUGAR.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.SUGAR.unit
        },
        PROCNT: {
          label: dataToUse.totalNutrients.PROCNT.label,
          quantity: Math.round((dataToUse.totalNutrients.PROCNT.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.PROCNT.unit
        },
        CHOLE: {
          label: dataToUse.totalNutrients.CHOLE.label,
          quantity: Math.round((dataToUse.totalNutrients.CHOLE.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.CHOLE.unit
        },
        NA: {
          label: dataToUse.totalNutrients.NA.label,
          quantity: Math.round((dataToUse.totalNutrients.NA.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.NA.unit
        },
        CA: {
          label: dataToUse.totalNutrients.CA.label,
          quantity: Math.round((dataToUse.totalNutrients.CA.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.CA.unit
        },
        MG: {
          label: dataToUse.totalNutrients.MG.label,
          quantity: Math.round((dataToUse.totalNutrients.MG.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.MG.unit
        },
        K: {
          label: dataToUse.totalNutrients.K.label,
          quantity: Math.round((dataToUse.totalNutrients.K.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.K.unit
        },
        FE: {
          label: dataToUse.totalNutrients.FE.label,
          quantity: Math.round((dataToUse.totalNutrients.FE.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.FE.unit
        },
        VITD: {
          label: dataToUse.totalNutrients.VITD.label,
          quantity: Math.round((dataToUse.totalNutrients.VITD.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalNutrients.VITD.unit
        }
      },
      
      dailyValues: {
        FAT: {
          label: dataToUse.totalDaily.FAT.label,
          quantity: Math.round((dataToUse.totalDaily.FAT.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.FAT.unit
        },
        FASAT: {
          label: dataToUse.totalDaily.FASAT.label,
          quantity: Math.round((dataToUse.totalDaily.FASAT.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.FASAT.unit
        },
        CHOCDF: {
          label: dataToUse.totalDaily.CHOCDF.label,
          quantity: Math.round((dataToUse.totalDaily.CHOCDF.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.CHOCDF.unit
        },
        FIBTG: {
          label: dataToUse.totalDaily.FIBTG.label,
          quantity: Math.round((dataToUse.totalDaily.FIBTG.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.FIBTG.unit
        },
        PROCNT: {
          label: dataToUse.totalDaily.PROCNT.label,
          quantity: Math.round((dataToUse.totalDaily.PROCNT.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.PROCNT.unit
        },
        CHOLE: {
          label: dataToUse.totalDaily.CHOLE.label,
          quantity: Math.round((dataToUse.totalDaily.CHOLE.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.CHOLE.unit
        },
        NA: {
          label: dataToUse.totalDaily.NA.label,
          quantity: Math.round((dataToUse.totalDaily.NA.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.NA.unit
        },
        CA: {
          label: dataToUse.totalDaily.CA.label,
          quantity: Math.round((dataToUse.totalDaily.CA.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.CA.unit
        },
        MG: {
          label: dataToUse.totalDaily.MG.label,
          quantity: Math.round((dataToUse.totalDaily.MG.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.MG.unit
        },
        K: {
          label: dataToUse.totalDaily.K.label,
          quantity: Math.round((dataToUse.totalDaily.K.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.K.unit
        },
        FE: {
          label: dataToUse.totalDaily.FE.label,
          quantity: Math.round((dataToUse.totalDaily.FE.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.FE.unit
        },
        VITD: {
          label: dataToUse.totalDaily.VITD.label,
          quantity: Math.round((dataToUse.totalDaily.VITD.quantity / (dataToUse.yield || 1)) * scalingFactor * 100) / 100,
          unit: dataToUse.totalDaily.VITD.unit
        }
      }
    };
    
    // Update the per-serving data and FDA nutrition data
    setPerServingData(customPerServingData);
    const fdaNutritionData = mapPerServingDataToFDAFormat(customPerServingData);
    setNutritionData(fdaNutritionData);
    
    console.log('✅ Custom serving nutrition calculated:', customPerServingData);
    
    // Save serving configuration to backend for serving mode
    if (currentRecipe?.id) {
      await saveServingConfigToBackend({
        mode: 'serving',
        servings_per_container: 1,
        serving_size_grams: Math.round(servingWeight),
        serving_size_number: servingNumber,
        net_weight_per_package: null, // Not applicable for serving mode
        servings_per_package: null // Not applicable for serving mode
      });
    }
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalDisplayPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Function to load custom ingredients
  const loadCustomIngredients = async (searchTerm?: string) => {
    setIsLoadingCustomIngredients(true);
    try {
      console.log('🔄 Loading custom ingredients with search term:', searchTerm);
      
      // Use getCustomIngredients for loading all ingredients, searchCustomIngredients for specific searches
      const response = searchTerm && searchTerm.trim()
        ? await CustomIngredientApi.searchCustomIngredients(searchTerm.trim())
        : await CustomIngredientApi.getCustomIngredients();
      
      console.log('📡 Custom ingredients API response:', response);
      console.log('📡 Response type:', typeof response);
      console.log('📡 Response success property:', response?.success);
      console.log('📡 Response data property:', response?.data);
      console.log('📡 Is response an array?', Array.isArray(response));
      
      // Handle both wrapped response format and direct array format
      let ingredientsArray: any[] = [];
      
      if (response && response.success && response.data) {
        // Wrapped format: {success: true, data: [...]}
        ingredientsArray = Array.isArray(response.data) ? response.data : [response.data];
        console.log('✅ Using wrapped format, ingredients:', ingredientsArray);
      } else if (Array.isArray(response)) {
        // Direct array format: [...]
        ingredientsArray = response;
        console.log('✅ Using direct array format, ingredients:', ingredientsArray);
      } else if (response && typeof response === 'object' && !response.success) {
        // Check if response is actually the data object itself
        console.log('🔍 Checking if response is data object...');
        ingredientsArray = [];
      } else {
        console.error('❌ Unexpected response format:', response);
        ingredientsArray = [];
      }
      
      console.log('✅ Final ingredients array:', ingredientsArray);
      setCustomIngredients(ingredientsArray);
      return ingredientsArray;
      
    } catch (error) {
      console.error('❌ Error loading custom ingredients:', error);
      setCustomIngredients([]);
      return [];
    } finally {
      setIsLoadingCustomIngredients(false);
    }
  };


  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      setSearchError(null);
      setHasSearched(true);
      setCurrentPage(1);
      setSearchResults([]); // Clear previous results
      setTotalResults(0);
      setTotalPages(0);
      
      try {
        // Only search Edamam database now
        console.log('🔍 Searching Edamam database:', searchQuery.trim());
        
        const progressiveCallback: ProgressiveSearchCallback = {
          onOriginalResults: (originalResults) => {
            setSearchResults(originalResults);
            setTotalResults(originalResults.length);
            setTotalPages(Math.ceil(originalResults.length / displayedResultsPerPage));
          },
          
          onEnhancedBatch: (newBatchResults, totalEnhanced) => {
            setSearchResults(prevResults => {
              const combined = [...prevResults, ...newBatchResults];
              // Remove duplicates based on ingredient name
              const seen = new Set<string>();
              const unique = combined.filter(ingredient => {
                const nameLower = ingredient.name.toLowerCase().trim();
                if (seen.has(nameLower)) {
                  return false;
                }
                seen.add(nameLower);
                return true;
              });
              
              setTotalResults(unique.length);
              setTotalPages(Math.ceil(unique.length / displayedResultsPerPage));
              
              return unique;
            });
          },
          
          onComplete: (finalResults) => {
            setSearchResults(finalResults.combinedResults);
            setTotalResults(finalResults.totalResults);
            setTotalPages(Math.ceil(finalResults.totalResults / displayedResultsPerPage));
            setIsSearching(false);
            
            if (finalResults.combinedResults.length === 0) {
              setSearchError('No ingredients found in Edamam database. Please try a different search term.');
            }
          },
          
          onError: (error) => {
            setSearchError('Failed to search Edamam database. Please try again.');
            setSearchResults([]);
            setTotalResults(0);
            setTotalPages(0);
            setIsSearching(false);
          }
        };
        
        await performProgressiveEnhancedSearch(searchQuery.trim(), progressiveCallback);
        
      } catch (error) {
        setSearchError('Failed to initialize search. Please try again.');
        setSearchResults([]);
        setTotalResults(0);
        setTotalPages(0);
        setIsSearching(false);
      }
    }
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
    setHasSearched(false);
    setIsSearching(false);
    setCurrentPage(1);
    setSearchResults([]);
    setSearchError(null);
    setTotalResults(0);
    setTotalPages(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Function to create new recipe automatically (without modal)
  const handleCreateNewRecipe = async () => {
    if (!recipeName.trim() || isCreatingRecipe) {
      return;
    }

    setIsCreatingRecipe(true);
    try {
      // Step 1: Create recipe with progressive API
      const response = await ProgressiveRecipeApi.createRecipe({
        name: recipeName.trim(),
        description: recipeDescription || '',
        is_public: false
      });

      // Handle both direct response and wrapped response formats
      let responseData: any;
      let recipeData: any;
      
      // Check if response has success property (wrapped format)
      if ('success' in response) {
        responseData = response;
        recipeData = responseData.data || responseData;
      } else {
        // Direct response format
        responseData = { success: true, data: response };
        recipeData = response;
      }
      
      if (responseData.success !== false && recipeData) {
        // Set all states immediately after successful creation
        setCurrentRecipe(recipeData);
        setIsRecipeCreated(true);

        // Notify activity center: recipe created
        try {
          await addNotification({
            type: "product.created",
            title: "Recipe created",
            message: recipeName ? `Recipe "${recipeName.trim()}" created` : "Recipe created",
            metadata: { product_id: recipeData.id },
            link: `/products/${recipeData.id}/edit`
          })
        } catch {}

        forceProgressUpdate();
        
        // Get initial progress
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(recipeData.id!);
          if (progressResponse.success) {
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.warn('Failed to load progress, but recipe was created:', progressError);
        }
        
        // Keep cache to persist across refreshes of new recipe flow
        // clearStateCache();
      } else {
        const errorMessage = ('error' in responseData ? responseData.error : null) ||
                            ('message' in responseData ? responseData.message : null) ||
                            'Failed to create recipe';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      toast({
        title: "Creation Error",
        description: 'Failed to create recipe: ' + (error.message || 'Unknown error'),
        variant: "destructive"
      });
      // Reset states on error - batch updates to prevent context issues
      React.startTransition(() => {
        setCurrentRecipe(null);
        setRecipeProgress(null);
        setIsRecipeCreated(false);
      });
    } finally {
      setIsCreatingRecipe(false);
    }
  };

  const handleConfirmDuplicateAdd = () => {
    if (duplicateIngredient) {
      handleAddIngredient(duplicateIngredient, true); // Force add the duplicate
    }
    setIsDuplicateDialogOpen(false);
    setDuplicateIngredient(null);
  };

  const handleCancelDuplicateAdd = () => {
    setIsDuplicateDialogOpen(false);
    setDuplicateIngredient(null);
    setLoadingIngredientName(null);
  };

  const handleCustomIngredientSubmit = async (ingredientData: CustomIngredientData) => {
    try {
      // Use extracted utility to process custom ingredient
      const customIngredient = processCustomIngredient(ingredientData);

      // Add the custom ingredient to the recipe
      setAddedIngredients(prev => {
        const updated = [...prev, customIngredient];
        
        // Save ingredients to backend progressively
        if (currentRecipe?.id) {
          saveIngredientsToBackend(updated, currentRecipe, setRecipeProgress, toast);
        }
        
        return updated;
      });
      
      // Add to tracking set
      const ingredientKey = ingredientData.name.toLowerCase().trim();
      setAddedIngredientNames(prev => {
        const newSet = new Set(prev);
        newSet.add(ingredientKey);
        return newSet;
      });

      // Increment usage count if the ingredient has an ID (was saved to database)
      if ((ingredientData as any).id) {
        try {
          await CustomIngredientApi.incrementUsage((ingredientData as any).id);
          console.log('✅ Usage count incremented for new custom ingredient:', ingredientData.name);
        } catch (error) {
          console.error('❌ Failed to increment usage count:', error);
          // Don't block the ingredient addition if usage tracking fails
        }
      }
      
    } catch (error) {
      console.error('Error adding custom ingredient:', error);
    }
  };

  // Function to handle adding custom ingredients to recipe
  const handleAddCustomIngredient = async (customIngredientData: any) => {
    try {
      // Check for duplicate ingredients using tracking set
      const ingredientKey = customIngredientData.name.toLowerCase().trim();
      const isDuplicate = addedIngredientNames.has(ingredientKey);
      
      if (isDuplicate) {
        console.warn('Custom ingredient already exists:', customIngredientData.name);
        return;
      }

      // Use extracted utility to process custom ingredient from DB
      const customIngredient = processCustomIngredientFromDB(customIngredientData);

      // Add the custom ingredient to the recipe
      setAddedIngredients(prev => {
        const updated = [...prev, customIngredient];
        
        // Step 2: Save ingredients to backend progressively
        if (currentRecipe?.id) {
          saveIngredientsToBackend(updated, currentRecipe, setRecipeProgress, toast);
        }
        
        return updated;
      });
      
      // Add to tracking set
      setAddedIngredientNames(prev => {
        const newSet = new Set(prev);
        newSet.add(ingredientKey);
        return newSet;
      });

      // Increment usage count for the custom ingredient
      try {
        await CustomIngredientApi.incrementUsage(customIngredientData.id);
        console.log('✅ Usage count incremented for custom ingredient:', customIngredientData.name);
      } catch (error) {
        console.error('❌ Failed to increment usage count:', error);
        // Don't block the ingredient addition if usage tracking fails
      }
      
    } catch (error) {
      console.error('Error adding custom ingredient:', error);
    }
  };

  const handleOpenCustomIngredient = () => {
    // Save current state to cache before navigating
    saveStateToCache();
    
    // Navigate to the custom ingredient page with return URL
    const currentPath = location.pathname;
    saveStateToCache();
    navigate(`/ingredients/create?returnTo=${encodeURIComponent(currentPath)}`);
  };

  // Product Details Functions
  const loadCategories = async () => {
    if (isLoadingCategories) return;
    
    setIsLoadingCategories(true);
    try {
      const response = await ProgressiveRecipeApi.getCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleExtractImageUrl = async () => {
    if (!productImageUrl.trim()) return;
    
    // Auto-create recipe if it doesn't exist
    if (!currentRecipe?.id && recipeName.trim() && !isCreatingRecipe) {
      console.log('🔄 Auto-creating recipe before extracting image URL');
      setIsCreatingRecipe(true);
      try {
        await handleCreateNewRecipe();
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('❌ Failed to auto-create recipe:', error);
        setIsCreatingRecipe(false);
        return;
      }
    }
    
    setIsExtractingImageUrl(true);
    setImageUrlError(null);
    
    try {
      const response = await ProgressiveRecipeApi.extractImageUrl(productImageUrl.trim());
      if (response.success) {
        // Set the processed image URL for preview (this was missing!)
        setProductImageUrl(response.data.image_url);
        
        // Image URL is valid, save it immediately (with retry if recipe was just created)
        let retryCount = 0;
        while (retryCount < 3) {
          if (currentRecipe?.id) {
            await saveProductDetailsToBackend({
              image_url: response.data.image_url
            });
            break;
          } else {
            console.log(`⏳ Waiting for recipe creation... (attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
          }
        }
      }
    } catch (error: any) {
      setImageUrlError(error.message || 'Failed to process image URL');
    } finally {
      setIsExtractingImageUrl(false);
    }
  };

  const handleImageFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageUrlError('Please select a valid image file');
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageUrlError('Image file must be less than 5MB');
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }
    
    setProductImageFile(file);
    setImageUrlError(null);
    setIsSavingImage(true);

    toast({
      title: "Uploading Image",
      description: "Processing your image file...",
    });

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProductImageUrl(previewUrl);
      
      // Upload file to server using the new API
      if (currentRecipe?.id) {
        const uploadResponse = await ProgressiveRecipeApi.uploadImage(currentRecipe.id, file);
        
        if (uploadResponse.success) {
          // Update the preview URL with the server URL if available
          if (uploadResponse.data.image_url) {
            setProductImageUrl(uploadResponse.data.image_url);
          }
          
          toast({
            title: "✅ Image Uploaded",
            description: "Image file uploaded and saved successfully!",
          });
        } else {
          throw new Error(uploadResponse.message || 'Upload failed');
        }
      } else {
        // Fallback: save file path to backend if no recipe ID
        const imagePath = `uploads/images/${file.name}`;
        await saveProductDetailsToBackend({
          image_path: imagePath
        });

        toast({
          title: "✅ Image Processed",
          description: "Local image file processed and saved successfully!",
        });
      }

    } catch (error: any) {
      console.error('❌ File upload error:', error);
      setImageUrlError(error.message || 'Failed to process image file');
      toast({
        title: "Upload Error",
        description: error.message || 'Failed to process image file',
        variant: "destructive"
      });
    } finally {
      setIsSavingImage(false);
    }
  };

  // Auto-preview image URLs as user types with automatic processing
  const handleImageUrlChange = async (url: string) => {
    setProductImageUrl(url);
    setImageUrlError(null);
    
    if (!url.trim()) return;
    
    // Check if it's a direct image URL
    const isDirectImageUrl = url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') ||
                            url.includes('.gif') || url.includes('.webp') || url.includes('.bmp') ||
                            url.includes('.svg');
    
    if (isDirectImageUrl) {
      // Direct image URL - preview will show immediately via productImageUrl state
      console.log('✅ Direct image URL detected, showing preview immediately');
      // Save direct image URL immediately
      await saveProductDetailsToBackend({
        image_url: url
      });
    } else {
      // Complex URL (Google Images, etc.) - automatically process it with debounce
      toast({
        title: "Processing Image",
        description: "Complex URL detected, processing automatically...",
      });
      
      // Add a small delay to avoid processing while user is still typing
      setTimeout(() => {
        if (productImageUrl === url) { // Only process if URL hasn't changed
          handleExtractImageUrlAutomatically(url);
        }
      }, 1500); // Increased delay to 1.5 seconds
    }
  };

  // Automatic URL processing (without user clicking button)
  const handleExtractImageUrlAutomatically = async (url: string) => {
    if (!url.trim()) return;
    
    setIsExtractingImageUrl(true);
    setImageUrlError(null);
    
    try {
      const response = await ProgressiveRecipeApi.extractImageUrl(url.trim());
      if (response.success) {
        // Set the processed image URL for automatic preview
        setProductImageUrl(response.data.image_url);
        
        // Save to backend automatically
        await saveProductDetailsToBackend({
          image_url: response.data.image_url
        });
        
        toast({
          title: "✅ Image Processed",
          description: "Complex URL processed and saved automatically!",
        });
      } else {
        setImageUrlError(response.message || 'Failed to process URL automatically');
        toast({
          title: "Auto-Processing Failed",
          description: response.message || 'Failed to process URL automatically. Try the "Re-process" button.',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setImageUrlError('Failed to process URL automatically. Please check the URL.');
      toast({
        title: "Auto-Processing Error",
        description: 'Failed to process URL automatically. Try the "Re-process" button.',
        variant: "destructive"
      });
    } finally {
      setIsExtractingImageUrl(false);
    }
  };

  // Handle file upload for local images
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setProductImageFile(file);
    setIsSavingImage(true);

    toast({
      title: "Uploading Image",
      description: "Processing your image file...",
    });

    try {
      // Create a local URL for preview
      const localUrl = URL.createObjectURL(file);
      setProductImageUrl(localUrl);

      // For now, we'll save the file name as image_path
      // In a real implementation, you'd upload to a server and get back a path
      const imagePath = `uploads/images/${file.name}`;
      
      await saveProductDetailsToBackend({
        image_path: imagePath
      });

      toast({
        title: "✅ Image Uploaded",
        description: "Local image file processed and saved successfully!",
      });

    } catch (error: any) {
      console.error('❌ File upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || 'Failed to process image file',
        variant: "destructive"
      });
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    const numericCategoryId = categoryId === 'none' ? null : parseInt(categoryId);
    setSelectedCategoryId(numericCategoryId);
    
    // Auto-create recipe if it doesn't exist and user is selecting a category
    if (!currentRecipe?.id && recipeName.trim() && !isCreatingRecipe) {
      console.log('🔄 Auto-creating recipe before saving category');
      await handleCreateNewRecipe();
      // Wait a moment for recipe creation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Save category selection immediately
    await saveProductDetailsToBackend({
      category_id: numericCategoryId
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || isCreatingCategory) return;
    
    setIsCreatingCategory(true);
    try {
      const response = await ProgressiveRecipeApi.createCategory(newCategoryName.trim());
      
      // Check if response has success property (wrapped format) or is direct data
      let categoryData;
      if (response.success && response.data) {
        // Wrapped format: {success: true, data: {...}}
        categoryData = response.data;
      } else if ((response as any).id && (response as any).name) {
        // Direct format: {id: 5, name: 'category', ...}
        categoryData = response as any;
      } else {
        toast({
          title: "Creation Error",
          description: "Failed to create category: Invalid response format",
          variant: "destructive"
        });
        return;
      }
      
      // Add new category to list
      setCategories(prev => {
        const updated = [...prev, categoryData];
        return updated;
      });
      
      // Select the new category automatically
      setSelectedCategoryId(categoryData.id);
      
      // Save the new category selection
      await saveProductDetailsToBackend({
        category_id: categoryData.id
      });
      
      // Reset form and close modal - IMPORTANT: Do this after all state updates
      setNewCategoryName('');
      setShowCreateCategory(false);
    } catch (error: any) {
      // Show more detailed error information
      let errorMessage = 'Failed to create category';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.name && errors.name.length > 0) {
          errorMessage = errors.name[0];
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Creation Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Live sync product details to backend
  const saveProductDetailsToBackend = async (details: { image_url?: string; image_path?: string; category_id?: number | null }) => {
    if (!currentRecipe?.id) {
      console.warn('⚠️ No current recipe ID, skipping product details save');
      return;
    }
    
    setIsSavingImage(true);
    
    try {
      console.log('🔄 Live sync: Saving product details to backend:', {
        recipeId: currentRecipe.id,
        details
      });
      
      const response = await ProgressiveRecipeApi.saveProductDetails(currentRecipe.id, details);
      
      console.log('📡 Product details API response:', response);
      
      // Check if response has success property (wrapped format) or is direct data
      const isSuccess = response.success === true ||
                       (response && typeof response === 'object' && (response as any).id);
      
      if (isSuccess) {
        console.log('✅ Live sync: Product details saved successfully');
        
        // Update current recipe data - handle both wrapped and direct response formats
        const responseData = response.success ? response.data : response;
        setCurrentRecipe(prev => prev ? { ...prev, ...responseData } : null);
        
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            console.log('📊 Live progress update:', progressResponse.data.progress);
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('❌ Live sync progress error:', progressError);
        }

      } else {
        console.error('❌ Live sync product details failed:', response);
        toast({
          title: "Sync Error",
          description: 'Live sync failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Live sync product details error:', error);
      toast({
        title: "Sync Error",
        description: 'Live sync error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    } finally {
      setIsSavingImage(false);
    }
  };
  // Load categories when component mounts or when Product Details tab is accessed
  React.useEffect(() => {
    if (isRecipeCreated) {
      loadCategories();
      console.log('🔄 Component mounted, loading custom ingredients...');
      loadCustomIngredients();
    }
  }, [isRecipeCreated]);

  // Debug useEffect to track progress indicator state changes
  React.useEffect(() => {
    console.log('🔍 Progress Debug - State changed:', {
      recipeName: recipeName,
      recipeNameTrimmed: recipeName?.trim(),
      recipeNameExists: !!(recipeName && recipeName.trim()),
      addedIngredientsCount: addedIngredients.length,
      addedIngredientsExist: addedIngredients.length > 0,
      nutritionDataExists: !!nutritionData,
      isLoadingNutrition: isLoadingNutrition,
      nutritionComplete: !!(nutritionData && !isLoadingNutrition),
      currentRecipeStatus: currentRecipe?.status,
      isRecipeCreated: isRecipeCreated,
      progressUpdateTrigger: progressUpdateTrigger
    });
  }, [recipeName, addedIngredients.length, nutritionData, isLoadingNutrition, currentRecipe?.status, isRecipeCreated, progressUpdateTrigger]);

  // Debug: Log custom ingredients state changes
  React.useEffect(() => {
    console.log('🔍 Custom ingredients state changed:', {
      count: customIngredients.length,
      ingredients: customIngredients,
      isLoading: isLoadingCustomIngredients
    });
  }, [customIngredients, isLoadingCustomIngredients]);

  // Also load categories when Product Details tab is accessed
  React.useEffect(() => {
    if (activeTab === 'product-details' && isRecipeCreated && categories.length === 0) {
      console.log('🔄 Loading categories for Product Details tab');
      loadCategories();
    }
  }, [activeTab, isRecipeCreated, categories.length]);

  return (
    <div className="container mx-auto py-4 px-3">
        {/* Show header only when recipe is created */}
        {isRecipeCreated && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Recipe: ' : ''}{recipeName || 'Recipe'}
                </h1>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  🏷️ Add Tags...
                </Button>
              </div>
              <div className="text-sm text-blue-600">
                {isUpdatingPublicationStatus ? '🔄 Updating Publication Status...' :
                 isSavingImage ? '💾 Saving Image...' :
                 isSavingAllergens ? '🛡️ Saving Allergens...' :
                 isSavingStatements ? '💾 Saving Statements...' :
                 isLoadingNutrition ? '⚗️ Analyzing Nutrition...' :
                 isCreatingRecipe ? '🔄 Creating Recipe...' :
                 recipeProgress?.current_step === 'completed' ? '✅ Recipe Complete' :
                 (currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') && nutritionData && addedIngredients.length > 0 ? '✅ Recipe Ready' :
                 nutritionData && addedIngredients.length > 0 && !isLoadingNutrition ? '🎯 Ready to Publish' :
                 addedIngredients.length > 0 && !nutritionData ? '⏳ Processing...' :
                 recipeName && recipeName.trim() ? '📝 Recipe Created' :
                 'Getting Started...'}
              </div>
            </div>

            {/* Progressive Recipe Creation Steps */}
            {recipeProgress && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recipe Creation Progress</h3>
                
                {/* Debug Info - Remove in production */}
                <div className="mb-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  Debug: Name="{recipeName}" | Ingredients={addedIngredients.length} | Nutrition={nutritionData ? 'Yes' : 'No'} | Loading={isLoadingNutrition ? 'Yes' : 'No'}
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Step 1: Recipe Name */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      recipeName && recipeName.trim()
                        ? 'bg-green-500 text-white shadow-lg transform scale-105'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {recipeName && recipeName.trim() ? '✓' : '1'}
                    </div>
                    <span className={`ml-2 text-sm transition-colors duration-300 ${
                      recipeName && recipeName.trim() ? 'text-green-600 font-medium' : 'text-gray-600'
                    }`}>Name</span>
                  </div>

                  <div className={`flex-1 h-1 transition-all duration-500 ${
                    addedIngredients.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 2: Ingredients */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      addedIngredients.length > 0
                        ? 'bg-green-500 text-white shadow-lg transform scale-105'
                        : recipeProgress?.current_step === 'ingredients_added'
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {addedIngredients.length > 0 ? '✓' : '2'}
                    </div>
                    <span className={`ml-2 text-sm transition-colors duration-300 ${
                      addedIngredients.length > 0 ? 'text-green-600 font-medium' : 'text-gray-600'
                    }`}>Ingredients ({addedIngredients.length})</span>
                  </div>

                  <div className={`flex-1 h-1 transition-all duration-500 ${
                    nutritionData && !isLoadingNutrition && addedIngredients.length > 0 ? 'bg-green-500' :
                    isLoadingNutrition ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 3: Nutrition */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      nutritionData && !isLoadingNutrition && addedIngredients.length > 0
                        ? 'bg-green-500 text-white shadow-lg transform scale-105'
                        : isLoadingNutrition
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {nutritionData && !isLoadingNutrition && addedIngredients.length > 0 ? '✓' : isLoadingNutrition ? '⏳' : '3'}
                    </div>
                    <span className={`ml-2 text-sm transition-colors duration-300 ${
                      nutritionData && !isLoadingNutrition && addedIngredients.length > 0 ? 'text-green-600 font-medium' :
                      isLoadingNutrition ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}>
                      {isLoadingNutrition ? 'Analyzing...' : 'Nutrition'}
                    </span>
                  </div>

                  <div className={`flex-1 h-1 transition-all duration-500 ${
                    (nutritionData && addedIngredients.length > 0 && !isLoadingNutrition) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 4: Serving */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      (nutritionData && addedIngredients.length > 0 && !isLoadingNutrition)
                        ? 'bg-green-500 text-white shadow-lg transform scale-105'
                        : recipeProgress?.current_step === 'serving_configured'
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {(nutritionData && addedIngredients.length > 0 && !isLoadingNutrition) ? '✓' : '4'}
                    </div>
                    <span className={`ml-2 text-sm transition-colors duration-300 ${
                      (nutritionData && addedIngredients.length > 0 && !isLoadingNutrition) ? 'text-green-600 font-medium' : 'text-gray-600'
                    }`}>Serving</span>
                  </div>

                  <div className={`flex-1 h-1 transition-all duration-500 ${
                    (currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') && nutritionData && addedIngredients.length > 0 && !isLoadingNutrition ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 5: Complete */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                      (currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') && nutritionData && addedIngredients.length > 0 && !isLoadingNutrition
                        ? 'bg-green-500 text-white shadow-lg transform scale-105'
                        : isUpdatingPublicationStatus
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {(currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') && nutritionData && addedIngredients.length > 0 && !isLoadingNutrition ? '✓' :
                       isUpdatingPublicationStatus ? '⏳' : '5'}
                    </div>
                    <span className={`ml-2 text-sm transition-colors duration-300 ${
                      (currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') && nutritionData && addedIngredients.length > 0 && !isLoadingNutrition ? 'text-green-600 font-medium' :
                      isUpdatingPublicationStatus ? 'text-blue-600 font-medium' : 'text-gray-600'
                    }`}>
                      {isUpdatingPublicationStatus ? 'Publishing...' :
                       (currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') ? 'Complete' : 'Publish'}
                    </span>
                  </div>
                </div>

                {/* Current Step Description */}
                <div className="mt-3 text-sm">
                  {!recipeName || !recipeName.trim() ? (
                    <div className="text-blue-600 font-medium flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                      <span>Enter a recipe name to get started</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Step 1/5</span>
                    </div>
                  ) : addedIngredients.length === 0 ? (
                    <div className="text-blue-600 font-medium flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                      <span>Next: Add ingredients to your recipe</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Step 2/5</span>
                    </div>
                  ) : isLoadingNutrition ? (
                    <div className="text-blue-600 font-medium flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                      <span>Analyzing nutrition data for {addedIngredients.length} ingredients...</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Step 3/5</span>
                    </div>
                  ) : isUpdatingPublicationStatus ? (
                    <div className="text-blue-600 font-medium flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
                      <span>Updating publication status...</span>
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Step 5/5</span>
                    </div>
                  ) : addedIngredients.length > 0 && nutritionData && !isLoadingNutrition && !(currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') ? (
                    <div className="text-green-600 font-medium flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>Ready to publish! Use the Publication tab to finalize your recipe.</span>
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Step 4/5</span>
                    </div>
                  ) : (currentRecipe?.status === 'published' || currentRecipe?.status === 'draft') && nutritionData && addedIngredients.length > 0 && !isLoadingNutrition ? (
                    <div className="text-green-600 font-medium flex items-center">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>🎉 Recipe complete! Your nutrition label is ready.</span>
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Complete</span>
                    </div>
                  ) : (
                    <div className="text-gray-600 flex items-center">
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      <span>Continue building your recipe...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Wizard Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'recipe', label: 'Recipe' },
                  { id: 'ingredients', label: 'Ingredients' },
                  { id: 'ingredient-statement', label: 'Ingredient Statement' },
                  { id: 'allergens', label: 'Allergens' },
                  { id: 'publication', label: 'Publication' },
                  { id: 'label', label: 'Label' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'label') {
                        // Navigate to the nutrition label page with current data and return info
                        console.log('🔍 Navigation Debug - Navigating to custom label page');
                        saveStateToCache();
                        navigate('/nutrition-label', {
                          state: {
                            nutritionData: nutritionData,
                            ingredients: addedIngredients.map(ing => ({
                              name: ing.name,
                              allergens: ing.allergens
                            })),
                            allergenData: allergenData,
                            recipeName: recipeName,
                            // CRITICAL FIX: Pass productId for edit mode
                            productId: currentRecipe?.id || productId,
                            // Add return navigation info
                            returnTo: location.pathname,
                            currentRecipe: currentRecipe,
                            fromRecipeForm: true
                          }
                        });
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {/* Show status indicators for Publication tab */}
                    {tab.id === 'publication' && currentRecipe && (
                      <div className="ml-2 inline-flex items-center space-x-1">
                        {currentRecipe.status === 'published' && (
                          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                        {currentRecipe.is_public && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

      {/* Main Content - Only show after recipe is created */}
      {isRecipeCreated ? (
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 px-6">
          {/* Left Side - Tab Content */}
          <div className="space-y-4">
            
            {/* Recipe Tab - Recipe Details */}
            {activeTab === 'recipe' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recipe Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Recipe Name */}
                    <div className="space-y-2">
                      <Label htmlFor="recipeName">Recipe Name</Label>
                      <Input
                        id="recipeName"
                        type="text"
                        placeholder="Enter recipe name..."
                        value={recipeName}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setRecipeName(newName);
                          
                          // Auto-save recipe name with debounce and user feedback
                         if (currentRecipe?.id) {
                           // Clear existing timeout
                           if ((window as any).recipeNameSaveTimeout) {
                             clearTimeout((window as any).recipeNameSaveTimeout);
                           }
                           
                           // Set new timeout for auto-save
                           (window as any).recipeNameSaveTimeout = setTimeout(async () => {
                              try {
                                toast({
                                  title: "💾 Saving Recipe Name...",
                                  description: "Auto-saving changes",
                                });
                                
                                const response = await ProgressiveRecipeApi.updateRecipe(currentRecipe.id!, {
                                  name: newName.trim()
                                });
                                
                                if (response.success) {
                                  setCurrentRecipe(prev => prev ? { ...prev, name: newName.trim() } : null);
                                  forceProgressUpdate(); // Update progress indicators
                                  
                                  toast({
                                    title: "✅ Recipe Name Saved",
                                    description: "Changes saved successfully",
                                  });
                                } else {
                                  toast({
                                    title: "❌ Save Failed",
                                    description: "Failed to save recipe name",
                                    variant: "destructive"
                                  });
                                }
                              } catch (error: any) {
                                console.error('Failed to auto-save recipe name:', error);
                                toast({
                                  title: "❌ Save Error",
                                  description: "Network error while saving",
                                  variant: "destructive"
                                });
                              }
                            }, 1000); // 1 second debounce
                          }
                        }}
                        className="text-lg font-medium"
                      />
                      <div className="text-xs text-gray-500">
                        Changes are saved automatically
                      </div>
                    </div>

                    {/* Recipe Description */}
                    <div className="space-y-2">
                      <Label htmlFor="recipeDescription">Recipe Description</Label>
                      <Textarea
                        id="recipeDescription"
                        placeholder="Enter a description for your recipe..."
                        value={recipeDescription}
                        onChange={(e) => {
                          const newDescription = e.target.value;
                          setRecipeDescription(newDescription);
                          
                          // Reset auto-create timer when description changes (to include description in auto-creation)
                          if (!currentRecipe?.id && recipeName.trim() && !isCreatingRecipe) {
                            // Clear existing timeout
                            if ((window as any).autoCreateRecipeTimeout) {
                              clearTimeout((window as any).autoCreateRecipeTimeout);
                            }
                            
                            // Auto-create recipe after user stops typing description
                            (window as any).autoCreateRecipeTimeout = setTimeout(async () => {
                              if (!currentRecipe?.id && recipeName.trim() && !isCreatingRecipe) {
                                console.log('🔄 Auto-creating recipe with description:', newDescription);
                                setIsCreatingRecipe(true);
                                try {
                                  const response = await ProgressiveRecipeApi.createRecipe({
                                    name: recipeName.trim(),
                                    description: newDescription || '', // Use current description
                                    is_public: false
                                  });

                                  // Handle response
                                  let responseData: any;
                                  let recipeData: any;
                                  
                                  if ('success' in response) {
                                    responseData = response;
                                    recipeData = responseData.data || responseData;
                                  } else {
                                    responseData = { success: true, data: response };
                                    recipeData = response;
                                  }
                                  
                                  if (responseData.success !== false && recipeData && recipeData.id) {
                                    setCurrentRecipe(recipeData);
                                    setIsRecipeCreated(true);
                                    console.log('✅ Recipe auto-created with description:', newDescription);
                                    
                                    toast({
                                      title: "✅ Recipe Created",
                                      description: `"${recipeName.trim()}" recipe created with description`,
                                    });
                                    
                                    forceProgressUpdate();
                                  }
                                } catch (error) {
                                  console.error('❌ Auto-create failed:', error);
                                } finally {
                                  setIsCreatingRecipe(false);
                                }
                              }
                            }, 2000); // 2 second delay for description
                          }
                          
                          // Auto-save recipe description with debounce (if recipe exists)
                          if (currentRecipe?.id) {
                            // Clear existing timeout
                            if ((window as any).recipeDescriptionSaveTimeout) {
                              clearTimeout((window as any).recipeDescriptionSaveTimeout);
                            }
                            
                            // Set new timeout for auto-save
                            (window as any).recipeDescriptionSaveTimeout = setTimeout(async () => {
                              try {
                                toast({
                                  title: "💾 Saving Description...",
                                  description: "Auto-saving changes",
                                });
                                await saveRecipeDescriptionToBackend(newDescription);
                              } catch (error) {
                                console.error('Auto-save description error:', error);
                                toast({
                                  title: "❌ Save Error",
                                  description: "Failed to save description",
                                  variant: "destructive"
                                });
                              }
                            }, 1500); // 1.5 second debounce for longer text
                          }
                        }}
                        className="min-h-[100px] resize-y"
                        maxLength={500}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Changes are saved automatically</span>
                        <span>{recipeDescription.length}/500 characters</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Image</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Image Preview */}
                    {productImageUrl && (
                      <div className="flex justify-center">
                        <div className="relative">
                          <img
                            src={productImageUrl}
                            alt="Product preview"
                            className="max-w-xs max-h-48 object-contain border rounded-lg"
                            onError={(e) => {
                              console.log('❌ Image failed to load:', productImageUrl);
                              setImageUrlError('Image failed to load. Please check the URL or try the "Re-process" button for complex URLs.');
                              // Hide the broken image
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={(e) => {
                              console.log('✅ Image loaded successfully:', productImageUrl);
                              setImageUrlError(null);
                              // Ensure image is visible
                              (e.target as HTMLImageElement).style.display = 'block';
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setProductImageUrl('');
                              setProductImageFile(null);
                              setImageUrlError(null);
                            }}
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Image URL Input */}
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="imageUrl"
                          type="url"
                          placeholder="https://example.com/image.jpg or Google Images URL"
                          value={productImageUrl}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            
                            // Show processing feedback for non-empty URLs
                            if (newUrl.trim() && newUrl !== productImageUrl) {
                              toast({
                                title: "🖼️ Processing Image URL...",
                                description: "Analyzing and saving image URL",
                              });
                            }
                            
                            handleImageUrlChange(newUrl);
                          }}
                          className="flex-1"
                          disabled={isExtractingImageUrl}
                        />
                        <Button
                          onClick={handleExtractImageUrl}
                          disabled={!productImageUrl.trim() || isExtractingImageUrl}
                          variant="outline"
                        >
                          {isExtractingImageUrl ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Re-process'
                          )}
                        </Button>
                      </div>
                      {isExtractingImageUrl && (
                        <div className="text-sm text-blue-600 flex items-center">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Automatically processing URL...
                        </div>
                      )}
                      {imageUrlError && (
                        <div className="text-sm text-red-600">{imageUrlError}</div>
                      )}
                      <div className="text-xs text-gray-500">
                        💡 Tip: URLs are processed automatically! Direct image URLs show immediately, complex URLs (Google Images, etc.) are processed in the background.
                      </div>
                    </div>
                    
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="imageFile">Or upload from device</Label>
                      <Input
                        id="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            toast({
                              title: "📤 Uploading Image...",
                              description: `Processing ${file.name}`,
                            });
                          }
                          handleImageFileUpload(e);
                        }}
                        className="cursor-pointer"
                      />
                      <div className="text-xs text-gray-500">
                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Category</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="category">Select Category</Label>
                      <Select
                        value={selectedCategoryId?.toString() || 'none'}
                        onValueChange={(value) => {
                          // Show saving feedback
                          const categoryName = value === 'none' ? 'No category' :
                            categories.find(cat => cat.id.toString() === value)?.name || 'Selected category';
                          
                          toast({
                            title: "📂 Saving Category...",
                            description: `Setting category to: ${categoryName}`,
                          });
                          
                          handleCategoryChange(value);
                        }}
                        disabled={isLoadingCategories}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Choose a category"} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Create New Category Button */}
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "📂 Opening Category Creator...",
                            description: "Create a new category for your recipe",
                          });
                          setShowCreateCategory(true);
                        }}
                        className="w-full"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add New Category
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Ingredients Tab (formerly Recipe Tab) */}
            {activeTab === 'ingredients' && (
              <div className="space-y-4">
                {/* Page Navigation */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Your Ingredient Page</span>
                </div>
          
          {/* Added Ingredients List */}
          {addedIngredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Added Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div className="col-span-4">Ingredient</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Unit</div>
                    <div className="col-span-2">Waste %</div>
                    <div className="col-span-1">Grams</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {/* Ingredient Rows */}
                  {addedIngredients.map((ingredient) => (
                    <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                              {ingredient.name}
                            </span>
                          </div>
                          {ingredient.allergens.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {ingredient.allergens.map((allergen, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Input
                          key={`quantity-${ingredient.id}`}
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => {
                            const newValue = parseFloat(e.target.value) || 0;
                            
                            // Show saving feedback
                            toast({
                              title: "💾 Updating Ingredient...",
                              description: `Saving quantity change for ${ingredient.name}`,
                            });

                            handleUpdateIngredient(ingredient.id, 'quantity', newValue);
                          }}
                          className="h-8 text-sm"
                          step="0.1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Select 
                          key={`select-${ingredient.id}`}
                          value={ingredient.unit}
                          onValueChange={(value) => {
                            // Show saving feedback
                            toast({
                              title: "💾 Updating Ingredient...",
                              description: `Changing unit for ${ingredient.name} to ${value}`,
                            });

                            handleUpdateIngredient(ingredient.id, 'unit', value);
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredient.availableMeasures.map((measure, idx) => (
                              <SelectItem key={`${ingredient.id}-${measure.label}-${idx}`} value={measure.label}>
                                {measure.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          value={ingredient.waste}
                          onChange={(e) => {
                            const newWaste = parseFloat(e.target.value) || 0;
                            
                            // Show saving feedback
                            toast({
                              title: "💾 Updating Waste %...",
                              description: `Setting waste to ${newWaste}% for ${ingredient.name}`,
                            });
                            
                            handleUpdateIngredient(ingredient.id, 'waste', newWaste);
                          }}
                          className="h-8 text-sm"
                          step="0.1"
                        />
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm">{(Number(ingredient.grams) || 0).toFixed(1)}</span>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            // Show removal feedback
                            toast({
                              title: "🗑️ Removing Ingredient...",
                              description: `Removing ${ingredient.name} from recipe`,
                            });
                            
                            handleRemoveIngredient(ingredient.id);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Totals Row */}
                  <div className="grid grid-cols-12 gap-2 items-center border-t pt-2 font-medium">
                    <div className="col-span-6">Totals:</div>
                    <div className="col-span-2"></div>
                    <div className="col-span-2">
                      {Number(addedIngredients.reduce((sum, ing) => {
                        const selectedMeasure = ing.availableMeasures.find(m => m.label === ing.unit);
                        const baseGrams = selectedMeasure ? ing.quantity * selectedMeasure.weight : 0;
                        const wasteGrams = baseGrams * (ing.waste / 100);
                        return sum + (Number(wasteGrams) || 0);
                      }, 0)).toFixed(1)} (waste)
                    </div>
                    <div className="col-span-1">
                      {Number(addedIngredients.reduce((sum, ing) => sum + (Number(ing.grams) || 0), 0)).toFixed(1)}
                    </div>
                    <div className="col-span-1"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search Edamam food database..."
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchQuery(value);
                        setCurrentPage(1);
                        
                        // Clear results if query becomes empty
                        if (value.trim().length === 0) {
                          setSearchResults([]);
                          setHasSearched(false);
                          setTotalResults(0);
                          setTotalPages(0);
                          setSearchError(null);
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      className="pl-10"
                    />
                  </div>
                  {!hasSearched ? (
                    <Button
                      onClick={handleSearch}
                      disabled={!searchQuery.trim() || isSearching}
                      className="px-6"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCancelSearch}
                      variant="outline"
                      className="px-4"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Custom Ingredient Dropdown */}
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Select from your custom ingredients:</Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('🔄 Manual refresh clicked');
                            loadCustomIngredients();
                          }}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          🔄 Refresh
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenCustomIngredient}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New
                        </Button>
                      </div>
                    </div>
                    
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && customIngredients.length > 0) {
                          const selectedCustomIngredient = customIngredients.find(ing => ing.id.toString() === value);
                          if (selectedCustomIngredient) {
                            // Show adding feedback
                            toast({
                              title: "🏠 Adding Custom Ingredient...",
                              description: `Adding ${selectedCustomIngredient.name} to your recipe`,
                            });
                            
                            handleAddCustomIngredient(selectedCustomIngredient);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={
                          isLoadingCustomIngredients
                            ? "Loading custom ingredients..."
                            : customIngredients.length === 0
                            ? "No custom ingredients available"
                            : "Choose a custom ingredient to add..."
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {customIngredients.length === 0 ? (
                          <SelectItem value="none" disabled>
                            <div className="flex items-center gap-2 text-gray-500">
                              <span>📝</span>
                              <span>No custom ingredients yet</span>
                            </div>
                          </SelectItem>
                        ) : (
                          customIngredients.map((ingredient) => (
                            <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span className="text-green-600">🏠</span>
                                <div className="flex flex-col">
                                  <span className="font-medium">{ingredient.name}</span>
                                  {ingredient.brand && (
                                    <span className="text-xs text-gray-500">{ingredient.brand}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    <div className="text-xs text-muted-foreground">
                      💡 Select from your saved custom ingredients or create new ones
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Search Results */}
          {hasSearched && searchQuery && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Search Results</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">{totalResults} results</Badge>
                    {isSearching && (
                      <div className="flex items-center space-x-1">
                        <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-xs text-blue-600">Finding more...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Error State */}
                {searchError && (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">⚠️ {searchError}</div>
                    <Button onClick={handleSearch} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                )}
                
                {/* Loading State - Only show when no results yet */}
                {isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">🔍 Searching ingredients...</div>
                  </div>
                )}
                
                {/* No Results */}
                {!isSearching && !searchError && searchResults.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">No ingredients found for "{searchQuery}"</div>
                    <div className="text-sm text-muted-foreground">Try a different search term</div>
                  </div>
                )}
                
                {/* Results */}
                {!searchError && searchResults.length > 0 && (
                  <div className="h-96 overflow-y-auto border rounded-lg">
                    <div className="space-y-3 p-2">
                      {currentResults.map((ingredient, index) => (
                        <div key={`${ingredient.name}-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full flex-shrink-0 bg-green-500"></div>
                            <div>
                              <div className="font-medium text-sm">{ingredient.name}</div>
                              <div className="text-xs text-muted-foreground">
                                <span>Ingredient</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {(ingredient as any).isCustom ? (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-700 bg-green-50">
                                🏠 Custom
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                📖 Recipe
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              onClick={() => {
                                // Show adding feedback
                                toast({
                                  title: "➕ Adding Ingredient...",
                                  description: `Adding ${ingredient.name} to your recipe`,
                                });
                                
                                if ((ingredient as any).isCustom) {
                                  handleAddCustomIngredient((ingredient as any).customData);
                                } else {
                                  handleAddIngredient(ingredient);
                                }
                              }}
                              disabled={loadingIngredientName === ingredient.name}
                              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingIngredientName === ingredient.name ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add to Recipe
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Progressive Loading Indicator - Only show at end of current page when searching */}
                      {isSearching && searchResults.length > 0 && currentPage === totalDisplayPages && (
                        <div className="flex items-center justify-center p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-2 text-blue-600">
                            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <span className="text-sm font-medium">Finding more ingredients...</span>
                          </div>
                        </div>
                      )}
                    </div>
        
                  {/* Pagination */}
                  {totalDisplayPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, searchResults.length)} of {searchResults.length} results
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {totalDisplayPages}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleNextPage}
                          disabled={currentPage === totalDisplayPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Empty State */}
          {!searchQuery && addedIngredients.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Start Building Your Recipe</h3>
                  <p className="text-muted-foreground mb-4">Search for ingredients above to begin adding them to your recipe.</p>
                </div>
              </CardContent>
            </Card>
          )}
                {/* Package Configuration Form - Moved from Product Details */}
                {isRecipeCreated && addedIngredients.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        Package Configuration
                        {(isSavingImage || isLoadingNutrition) && (
                          <div className="flex items-center text-sm text-blue-600">
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            {isSavingImage ? 'Saving Configuration...' : 'Updating Nutrition...'}
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Label Setup Selection */}
                      <div className="space-y-4 mb-6">
                        <Label className="text-sm font-medium">How would you like to set up your label?</Label>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="byPackageSize"
                              name="labelSetup"
                              value="package"
                              checked={labelSetupMode === 'package'}
                              onChange={(e) => {
                                setLabelSetupMode('package');
                                toast({
                                  title: "💾 Saving Configuration...",
                                  description: "Switching to package-based setup",
                                });
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <Label htmlFor="byPackageSize" className="text-sm">By package size</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="byServingSize"
                              name="labelSetup"
                              value="serving"
                              checked={labelSetupMode === 'serving'}
                              onChange={(e) => {
                                setLabelSetupMode('serving');
                                toast({
                                  title: "💾 Saving Configuration...",
                                  description: "Switching to serving-based setup",
                                });
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <Label htmlFor="byServingSize" className="text-sm">By serving size</Label>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Configuration changes are saved automatically
                        </div>
                      </div>

                      {/* Conditional Configuration Based on Mode */}
                      {labelSetupMode === 'package' ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Net Weight Per Package */}
                          <div className="space-y-2">
                            <Label htmlFor="netWeight" className="text-sm font-medium">
                              Net weight per package
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="netWeight"
                                type="number"
                                value={netWeightPerPackage}
                                onChange={(e) => {
                                  const newWeight = Number(e.target.value);
                                  setNetWeightPerPackage(newWeight);
                                  
                                  // Show saving feedback
                                  toast({
                                    title: "💾 Saving Package Weight...",
                                    description: `Updating to ${newWeight}g per package`,
                                  });
                                  
                                  handlePackageConfigChange(newWeight, servingsPerPackage);
                                }}
                                className="flex-1"
                                min="0"
                                step="0.1"
                              />
                              <Select value="grams" disabled>
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="grams">grams</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {rawNutritionData && (
                              <div className="text-xs text-orange-600">
                                Yield: {((netWeightPerPackage / rawNutritionData.totalWeight) * 100).toFixed(1)}% of {rawNutritionData.totalWeight.toFixed(1)} total grams
                              </div>
                            )}
                          </div>
                          
                          {/* How Many Servings Are In Each Package */}
                          <div className="space-y-2">
                            <Label htmlFor="servingsPerPkg" className="text-sm font-medium">
                              How many servings are in each package?
                            </Label>
                            <Input
                              id="servingsPerPkg"
                              type="number"
                              value={servingsPerPackage}
                              onChange={(e) => {
                                const newServings = Number(e.target.value);
                                setServingsPerPackage(newServings);
                                
                                // Show saving feedback
                                toast({
                                  title: "💾 Saving Servings Config...",
                                  description: `Updating to ${newServings} servings per package`,
                                });
                                
                                handlePackageConfigChange(netWeightPerPackage, newServings);
                              }}
                              min="0.1"
                              step="0.1"
                            />
                          </div>

                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Serving Size Weight */}
                          <div className="space-y-2">
                            <Label htmlFor="servingWeight" className="text-sm font-medium">
                              Serving size weight
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="servingWeight"
                                type="number"
                                value={servingSizeWeight}
                                onChange={(e) => {
                                  const newWeight = Number(e.target.value);
                                  toast({
                                    title: "💾 Saving Serving Size...",
                                    description: `Updating serving size to ${newWeight}g`,
                                  });
                                  handleServingSizeWeightChange(newWeight);
                                }}
                                className="flex-1"
                                min="0"
                                step="0.1"
                              />
                              <Select value="grams" disabled>
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="grams">grams</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {rawNutritionData && (
                              <div className="text-xs text-orange-600">
                                Default per serving: {Math.round(rawNutritionData.totalWeight / (rawNutritionData.yield || 1))}g
                              </div>
                            )}
                          </div>
                          
                          {/* Serving Size Number */}
                          <div className="space-y-2">
                            <Label htmlFor="servingNumber" className="text-sm font-medium">
                              Serving size
                            </Label>
                            <Input
                              id="servingNumber"
                              type="number"
                              value={servingSizeNumber}
                              onChange={(e) => {
                                const newNumber = Number(e.target.value);
                                toast({
                                  title: "💾 Saving Serving Number...",
                                  description: `Updating to ${newNumber} servings`,
                                });
                                handleServingSizeNumberChange(newNumber);
                              }}
                              min="0.1"
                              step="0.1"
                            />
                          </div>

                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

              </div>
            )}

            {/* Ingredient Statement Tab */}
            {activeTab === 'ingredient-statement' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Ingredient Statements
                      {isSavingStatements && (
                        <div className="flex items-center text-sm text-blue-600">
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Saving...
                        </div>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Customize how ingredients appear on your nutrition label. By default, ingredient names are used.
                      Add custom statements to provide more detailed descriptions.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {addedIngredients.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No ingredients added yet. Add ingredients in the Recipe tab to customize their statements.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Side - Ingredient Statement List */}
                        <div className="space-y-4">
                          <h3 className="text-base font-medium text-gray-900">Customize Statements</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                            {addedIngredients.map((ingredient) => (
                              <div key={ingredient.id} className="border rounded-lg p-3">
                                <Label htmlFor={`statement-${ingredient.id}`} className="text-sm font-medium text-gray-700">
                                  {ingredient.name}
                                </Label>
                                <p className="text-xs text-gray-500 mb-2">
                                  Default: "{ingredient.name}"
                                </p>
                                <Textarea
                                  id={`statement-${ingredient.id}`}
                                  placeholder={`Enter custom statement for ${ingredient.name} (leave empty to use default name)`}
                                  value={ingredientStatements[ingredient.id] || ''}
                                  onChange={(e) => {
                                    const newValue = e.target.value;
                                    const newStatements = {
                                      ...ingredientStatements,
                                      [ingredient.id]: newValue
                                    };
                                    
                                    console.log('🔍 DEBUG: Ingredient statement changed:', {
                                      ingredientId: ingredient.id,
                                      ingredientName: ingredient.name,
                                      newValue,
                                      newStatements,
                                      hasValue: !!(newValue && newValue.trim())
                                    });
                                    
                                    setIngredientStatements(newStatements);
                                    
                                    // Debounced auto-save to backend
                                    if (currentRecipe?.id) {
                                      if (ingredientStatementSaveTimeoutRef.current) {
                                        clearTimeout(ingredientStatementSaveTimeoutRef.current);
                                      }
                                      ingredientStatementSaveTimeoutRef.current = setTimeout(() => {
                                        console.log('🔍 DEBUG: Saving ingredient statements to backend:', newStatements);
                                        saveIngredientStatementsToBackend(newStatements);
                                      }, 1000); // 1 second debounce
                                    }
                                  }}
                                  className="min-h-[60px] text-sm"
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                  {ingredientStatements[ingredient.id]?.length || 0} characters
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Side - Live Preview */}
                        <div className="space-y-4">
                          <h3 className="text-base font-medium text-gray-900">Live Preview</h3>
                          <div className="sticky top-4">
                            <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px]">
                              <div className="text-sm font-bold mb-3 text-gray-800">INGREDIENTS:</div>
                              <div className="text-sm text-gray-700 leading-relaxed">
                                {addedIngredients.length > 0 ? (
                                  addedIngredients.map((ingredient, index) => {
                                    const customStatement = ingredientStatements[ingredient.id];
                                    const displayText = customStatement && customStatement.trim()
                                      ? customStatement.trim()
                                      : ingredient.name;
                                    return (
                                      <span key={ingredient.id} className="inline">
                                        {displayText}
                                        {index < addedIngredients.length - 1 ? ', ' : '.'}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-gray-500 italic">No ingredients added</span>
                                )}
                              </div>
                              
                              {/* Preview Statistics */}
                              <div className="mt-4 pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div>Total ingredients: {addedIngredients.length}</div>
                                  <div>Custom statements: {Object.values(ingredientStatements).filter(s => s && s.trim()).length}</div>
                                  <div>Statement length: {addedIngredients.map((ingredient, index) => {
                                    const customStatement = ingredientStatements[ingredient.id];
                                    const displayText = customStatement && customStatement.trim()
                                      ? customStatement.trim()
                                      : ingredient.name;
                                    return displayText + (index < addedIngredients.length - 1 ? ', ' : '.');
                                  }).join('').length} characters</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Allergens Tab */}
            {activeTab === 'allergens' && (
              <div className="space-y-4">
                <AllergenManagement
                  allergenData={allergenData}
                  setAllergenData={setAllergenData}
                  addedIngredients={addedIngredients}
                  currentRecipe={currentRecipe}
                  isSavingAllergens={isSavingAllergens}
                  onSaveAllergens={saveAllergensToBackend}
                />
              </div>
            )}

            {/* Publication Tab */}
            {activeTab === 'publication' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      Publication Settings
                      <div className="flex items-center space-x-2">
                        {isUpdatingPublicationStatus && (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Updating...</span>
                          </div>
                        )}
                        {!isUpdatingPublicationStatus && currentRecipe?.status === 'published' && (
                          <Badge variant="default" className="bg-green-500">
                            Published
                          </Badge>
                        )}
                        {!isUpdatingPublicationStatus && currentRecipe?.is_public && (
                          <Badge variant="outline" className="border-blue-500 text-blue-700">
                            Public
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Choose how you want to publish your recipe and nutrition label.
                      {isUpdatingPublicationStatus && (
                        <span className="text-blue-600 font-medium"> Saving changes...</span>
                      )}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {!isRecipeCreated ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Create a recipe first to access publication settings.</p>
                      </div>
                    ) : addedIngredients.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Add ingredients to your recipe to access publication settings.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Publication Status */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Publication Status</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id="statusDraft"
                                name="publicationStatus"
                                value="draft"
                                checked={publicationStatus === 'draft'}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handlePublicationSettingsChange('draft', isPublic);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600"
                              />
                              <Label htmlFor="statusDraft" className="text-sm cursor-pointer">
                                <div className="flex items-center space-x-2">
                                  <span>📝</span>
                                  <div>
                                    <div className="font-medium">Save as Draft</div>
                                    <div className="text-xs text-gray-500">Keep recipe private and continue editing</div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id="statusPublished"
                                name="publicationStatus"
                                value="published"
                                checked={publicationStatus === 'published'}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handlePublicationSettingsChange('published', isPublic);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600"
                              />
                              <Label htmlFor="statusPublished" className="text-sm cursor-pointer">
                                <div className="flex items-center space-x-2">
                                  <span>🚀</span>
                                  <div>
                                    <div className="font-medium">Publish Recipe</div>
                                    <div className="text-xs text-gray-500">Finalize recipe and make it available</div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </div>
                        </div>

                        {/* Public Access Settings */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Public Access</Label>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="isPublicAccess"
                                checked={isPublic}
                                onChange={(e) => {
                                  handlePublicationSettingsChange(publicationStatus, e.target.checked);
                                }}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <Label htmlFor="isPublicAccess" className="text-sm cursor-pointer">
                                <div className="flex items-center space-x-2">
                                  <span>🌐</span>
                                  <div>
                                    <div className="font-medium">Make publicly accessible</div>
                                    <div className="text-xs text-gray-500">Allow anyone to view this recipe via QR code or direct link</div>
                                  </div>
                                </div>
                              </Label>
                            </div>
                            
                            {/* Public URL Preview */}
                            {isPublic && currentRecipe?.id && (
                              <div className="ml-7 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="text-xs text-blue-700 font-medium mb-1">Public URL:</div>
                                <div className="text-xs text-blue-600 font-mono break-all">
                                  {window.location.origin}/public/product/{currentRecipe.id}
                                </div>
                                <div className="text-xs text-blue-500 mt-1">
                                  This URL will be embedded in QR codes on your nutrition labels
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t space-y-4">
                          <div className="text-sm text-gray-500">
                            {publicationStatus === 'published' && isPublic && (
                              <span className="text-green-600">✅ Recipe will be published and publicly accessible</span>
                            )}
                            {publicationStatus === 'published' && !isPublic && (
                              <span className="text-blue-600">🔒 Recipe will be published but kept private</span>
                            )}
                            {publicationStatus === 'draft' && (
                              <span className="text-gray-600">📝 Recipe will be saved as draft</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={() => {
                                console.log('🔍 DEBUG: Save as Draft button clicked!');
                                handleSaveAsDraft();
                              }}
                              disabled={isUpdatingPublicationStatus}
                              variant="outline"
                              className={`flex-1 ${isUpdatingPublicationStatus ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {isUpdatingPublicationStatus ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving Draft...
                                </>
                              ) : (
                                <>
                                  📝 Save as Draft
                                </>
                              )}
                            </Button>
                            
                            <Button
                              onClick={() => {
                                console.log('🔍 DEBUG: Publish Recipe button clicked!');
                                handlePublishRecipe();
                              }}
                              disabled={isUpdatingPublicationStatus}
                              className={`flex-1 bg-green-600 hover:bg-green-700 ${isUpdatingPublicationStatus ? 'opacity-60 cursor-not-allowed' : ''}`}
                            >
                              {isUpdatingPublicationStatus ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  🚀 {isPublic ? 'Publish & Make Public' : 'Publish Recipe'}
                                </>
                              )}
                            </Button>
                          </div>

                          {/* QR Code Management Section */}
                          {publicationStatus === 'published' && isPublic && currentRecipe?.id && (
                            <div className="pt-4 border-t space-y-4">
                              <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <span>📱</span>
                                  QR Code Management
                                </Label>
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-green-600 font-medium">✅ Ready for QR Code Generation</span>
                                      </div>
                                      <p className="text-sm text-green-700 mb-3">
                                        Your recipe is published and public. You can now generate QR codes that link to your nutrition label.
                                      </p>
                                      <div className="text-xs text-green-600 bg-green-100 p-2 rounded border">
                                        <div className="font-medium mb-1">Public URL:</div>
                                        <div className="font-mono break-all">
                                          {window.location.origin}/public/product/{currentRecipe.id}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-4">
                                    <Button
                                      onClick={() => {
                                        // Navigate to QR code page with current recipe auto-selected
                                        console.log('🔍 Navigation Debug - Navigating to QR codes page with productId:', currentRecipe?.id || productId);
                                        saveStateToCache();
                                        navigate('/qr-codes', {
                                          state: {
                                            productId: currentRecipe?.id || productId,
                                            productName: recipeName,
                                            publicUrl: `${window.location.origin}/public/product/${currentRecipe?.id || productId}`,
                                            fromProductForm: true
                                          }
                                        });
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <span className="mr-2">📱</span>
                                      Manage QR Code
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Warning for Draft/Private Recipes */}
                          {(publicationStatus === 'draft' || !isPublic) && (
                            <div className="pt-4 border-t space-y-4">
                              <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                  <span>📱</span>
                                  QR Code Management
                                </Label>
                                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                  <div className="flex items-start gap-3">
                                    <span className="text-orange-500 text-lg">⚠️</span>
                                    <div className="flex-1">
                                      <div className="font-medium text-orange-800 mb-1">
                                        QR Code Generation Not Available
                                      </div>
                                      <p className="text-sm text-orange-700 mb-3">
                                        {publicationStatus === 'draft' && !isPublic
                                          ? 'Your recipe must be published and made public to generate QR codes.'
                                          : publicationStatus === 'draft'
                                          ? 'Your recipe must be published to generate QR codes.'
                                          : 'Your recipe must be made public to generate QR codes.'
                                        }
                                      </p>
                                      <div className="text-xs text-orange-600">
                                        💡 Tip: {publicationStatus === 'draft' && !isPublic
                                          ? 'Select "Publish Recipe" and check "Make publicly accessible" above.'
                                          : publicationStatus === 'draft'
                                          ? 'Select "Publish Recipe" above.'
                                          : 'Check "Make publicly accessible" above.'
                                        }
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          {/* Right Side - Label Preview - Only show for Ingredients and Label tabs */}
          {(activeTab === 'ingredients' || activeTab === 'label') && (
            <div className="space-y-3">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Label Preview</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Nutrition Loading State */}
                    {isLoadingNutrition && addedIngredients.length > 0 && (
                      <div className="flex items-center justify-center p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm font-medium">Analyzing nutrition...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Nutrition Error State */}
                    {nutritionError && (
                      <div className="p-3 border border-orange-200 rounded-lg bg-orange-50">
                        <div className="flex items-center space-x-2 text-orange-700">
                          <span className="text-sm">⚠️ {nutritionError}</span>
                        </div>
                        <div className="text-xs text-orange-600 mt-1">Showing demo data as fallback</div>
                      </div>
                    )}
                    
                    {/* FDA Nutrition Label - Uses actual nutrition data or fallback to zeros */}
                    <div>
                      {(() => {
                        // Debug logging for ingredient statements
                        const realIngredientsData = addedIngredients.map(ing => {
                          const customStatement = ingredientStatements[ing.id];
                          const finalData = {
                            name: ing.name,
                            allergens: ing.allergens,
                            customStatement: customStatement,
                            custom_statement: customStatement // Add both for compatibility
                          };
                          
                          console.log(`🔍 DEBUG: ProductForm mapping ingredient ${ing.name} (${ing.id}):`, {
                            originalName: ing.name,
                            customStatement: customStatement,
                            hasCustomStatement: !!(customStatement && customStatement.trim()),
                            finalData
                          });
                          
                          return finalData;
                        });
                        
                        console.log('🔍 DEBUG: ProductForm FINAL DATA passing to FDANutritionLabel:', {
                          addedIngredients: addedIngredients.map(ing => ({ id: ing.id, name: ing.name })),
                          ingredientStatements,
                          realIngredientsData,
                          hasCustomStatements: Object.keys(ingredientStatements).length > 0,
                          detailedMapping: addedIngredients.map(ing => ({
                            id: ing.id,
                            name: ing.name,
                            hasCustomStatement: !!(ingredientStatements[ing.id] && ingredientStatements[ing.id].trim()),
                            customStatementValue: ingredientStatements[ing.id]
                          }))
                        });
                        
                        console.log('🔍 DEBUG: ProductForm EXACT realIngredientsData being passed:', JSON.stringify(realIngredientsData, null, 2));
                        
                        return (
                          <FDANutritionLabel
                            key={`nutrition-label-${Object.keys(ingredientStatements).length}-${JSON.stringify(ingredientStatements)}`}
                            data={nutritionData}
                            showActionButtons={true}
                            realIngredients={realIngredientsData}
                            realAllergens={[...new Set(addedIngredients.flatMap(ing => ing.allergens))]}
                            allergenData={allergenData}
                            recipeName={recipeName}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>


      ) : (
        /* Initial Recipe Creation Interface for New Recipes */
        <div className="container mx-auto py-8 px-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                {/* Legacy modal removed: title */}
                {/* Legacy modal removed: subtitle */}
              </CardHeader>
              {/* Legacy modal content hidden */}
          <CardContent className="hidden">
                <div className="space-y-2">
                  <Label htmlFor="newRecipeName">Recipe Name</Label>
                  <Input
                    id="newRecipeName"
                    type="text"
                    placeholder="Enter your recipe name..."
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="text-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && recipeName.trim()) {
                        handleCreateNewRecipe();
                      }
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newRecipeDescription">Recipe Description (Optional)</Label>
                  <Textarea
                    id="newRecipeDescription"
                    placeholder="Describe your recipe..."
                    value={recipeDescription}
                    onChange={(e) => setRecipeDescription(e.target.value)}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {recipeDescription.length}/500 characters
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleCreateNewRecipe}
                    disabled={!recipeName.trim() || isCreatingRecipe}
                    className="px-8 py-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {isCreatingRecipe ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating Recipe...
                      </>
                    ) : (
                      'Create Recipe'
                    )}
                  </Button>
                </div>
                
                {/* Auto-create recipe when user starts typing (for better UX) */}
                {!isRecipeCreated && recipeName.trim() && !isCreatingRecipe && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-700 text-center">
                      💡 Tip: Click "Create Recipe" to start adding ingredients and building your nutrition label
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Duplicate Ingredient Warning Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Duplicate Ingredient Detected</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>The ingredient <strong>"{duplicateIngredient?.name}"</strong> is already added to your recipe.</p>
              <p className="mt-2">Do you want to add it again as a separate ingredient?</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelDuplicateAdd}>
                Cancel
              </Button>
              <Button onClick={handleConfirmDuplicateAdd} className="bg-orange-600 hover:bg-orange-700">
                Add Anyway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Modal */}
      <Dialog
        open={showCreateCategory}
        onOpenChange={(open) => {
          console.log('🔄 Modal state changing to:', open);
          setShowCreateCategory(open);
          if (!open) {
            setNewCategoryName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modalNewCategory">Category Name</Label>
              <Input
                id="modalNewCategory"
                placeholder="Enter category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isCreatingCategory) {
                    handleCreateCategory();
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  console.log('🚫 Cancel button clicked');
                  setShowCreateCategory(false);
                  setNewCategoryName('');
                }}
                disabled={isCreatingCategory}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim() || isCreatingCategory}
              >
                {isCreatingCategory ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
