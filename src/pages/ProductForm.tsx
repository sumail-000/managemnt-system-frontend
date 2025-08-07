import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, X, Loader2, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FDANutritionLabel } from '@/components/previewlabel/FDANutritionLabel';
import { edamamDirectApi, EdamamSearchResult } from '@/services/edamamDirectApi';
import { foodParserApi, ParseIngredientResponse } from '@/services/foodParserApi';
import { NutritionApi } from '@/services/nutritionApi';
import { ProgressiveRecipeApi, ProgressiveRecipeData, RecipeProgress } from '@/services/progressiveRecipeApi';
import { processSearchResults, SimpleIngredient } from '@/utils/recipeIngredientExtractor';
import { performEnhancedSearch, performProgressiveEnhancedSearch, ProgressiveSearchCallback } from '@/utils/enhancedSearchProcessor';
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
  PerServingNutritionData
} from '@/utils/nutritionDataMapper';
import { CustomIngredientData } from '@/types/customIngredient';

interface AddedIngredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  waste: number;
  grams: number;
  availableMeasures: Array<{
    uri: string;
    label: string;
    weight: number;
  }>;
  allergens: string[];
  nutritionProportion?: {
    calories: number;
    // Macronutrients
    totalFat: number;
    saturatedFat: number;
    transFat: number;
    monounsaturatedFat: number;
    polyunsaturatedFat: number;
    cholesterol: number;
    sodium: number;
    totalCarbohydrate: number;
    dietaryFiber: number;
    totalSugars: number;
    addedSugars: number;
    sugarAlcohol: number;
    protein: number;
    
    // Comprehensive Vitamins - Based on exact API response structure
    vitaminA?: number;
    vitaminC?: number;
    vitaminD: number;
    vitaminE?: number;
    vitaminK?: number;
    thiamin?: number;
    riboflavin?: number;
    niacin?: number;
    vitaminB6?: number;
    folate?: number;
    vitaminB12?: number;
    pantothenicAcid?: number;
    
    // Comprehensive Minerals - Based on exact API response structure
    calcium: number;
    iron: number;
    potassium: number;
    phosphorus?: number;
    magnesium?: number;
    zinc?: number;
    selenium?: number;
    copper?: number;
    manganese?: number;
    
    // Daily values (percentages) - Basic nutrients
    totalFatDV: number;
    saturatedFatDV: number;
    monounsaturatedFatDV: number;
    polyunsaturatedFatDV: number;
    cholesterolDV: number;
    sodiumDV: number;
    totalCarbohydrateDV: number;
    dietaryFiberDV: number;
    addedSugarsDV: number;
    sugarAlcoholDV: number;
    proteinDV: number;
    vitaminDDV: number;
    calciumDV: number;
    ironDV: number;
    potassiumDV: number;
  };
}

export default function ProductForm() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Progressive recipe state
  const [currentRecipe, setCurrentRecipe] = useState<ProgressiveRecipeData | null>(null);
  const [recipeProgress, setRecipeProgress] = useState<RecipeProgress | null>(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIngredients, setAddedIngredients] = useState<AddedIngredient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [isRecipeNameModalOpen, setIsRecipeNameModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('recipe');
  const [isRecipeCreated, setIsRecipeCreated] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newRecipeName, setNewRecipeName] = useState('');
  const [searchResults, setSearchResults] = useState<SimpleIngredient[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingIngredientName, setLoadingIngredientName] = useState<string | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateIngredient, setDuplicateIngredient] = useState<SimpleIngredient | null>(null);
  const [addedIngredientNames, setAddedIngredientNames] = useState<Set<string>>(new Set());
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

  // Cache key for localStorage
  const RECIPE_STATE_CACHE_KEY = 'recipe_state_cache';
  

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
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem(RECIPE_STATE_CACHE_KEY, JSON.stringify(currentState));
    } catch (error) {
      console.warn('Failed to save recipe state to cache:', error);
    }
  };

  const loadStateFromCache = () => {
    try {
      const cachedState = localStorage.getItem(RECIPE_STATE_CACHE_KEY);
      if (cachedState) {
        const parsedState = JSON.parse(cachedState);
        
        // Check if cache is not too old (1 hour max)
        const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
        if (Date.now() - parsedState.timestamp < maxAge) {
          return parsedState;
        } else {
          // Clear old cache
          localStorage.removeItem(RECIPE_STATE_CACHE_KEY);
        }
      }
    } catch (error) {
      console.warn('Failed to load recipe state from cache:', error);
      localStorage.removeItem(RECIPE_STATE_CACHE_KEY);
    }
    return null;
  };

  const clearStateCache = () => {
    try {
      localStorage.removeItem(RECIPE_STATE_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear recipe state cache:', error);
    }
  };

  // Initialize state from cache on component mount and handle direct navigation
  useEffect(() => {
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
      
      // Restore ingredient names tracking set
      if (cachedState.addedIngredients) {
        const ingredientNames = new Set<string>(
          cachedState.addedIngredients.map((ing: AddedIngredient) => ing.name.toLowerCase().trim())
        );
        setAddedIngredientNames(ingredientNames);
      }
      
      // Clear cache after successful restoration
      clearStateCache();
    } else {
      // Check if this is a direct navigation to create new recipe
      if (location.pathname === '/products/new' && !isRecipeCreated && !recipeName && !isRecipeNameModalOpen) {
        // For direct navigation, only open recipe name modal, don't set isRecipeCreated yet
        setIsRecipeNameModalOpen(true);
      }
    }
  }, [location.pathname]); // Remove dependencies that cause loops

  // Handle custom ingredient data returned from the custom ingredient page
  useEffect(() => {
    if (location.state?.customIngredient) {
      const customIngredientData = location.state.customIngredient as CustomIngredientData;
      handleCustomIngredientSubmit(customIngredientData);
      
      // Clear the state to prevent re-processing on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);
  
  // Analyze nutrition when ingredients change - but only if local recalculation isn't possible
  useEffect(() => {
    if (addedIngredients.length === 0) {
      initializeEmptyNutrition();
      return;
    }

    // Check if we can recalculate locally (all ingredients have nutrition proportions)
    const canRecalculateLocally = addedIngredients.every(ing => ing.nutritionProportion) && totalGramsAtLastAnalysis > 0;
    
    if (!canRecalculateLocally) {
      // Need to make API call for new nutrition analysis
      analyzeNutrition();
    }
    // If we can recalculate locally, the handleUpdateIngredient/handleRemoveIngredient functions already handle it
  }, [addedIngredients, totalGramsAtLastAnalysis]);
  
  // Function to analyze nutrition using real API
  const analyzeNutrition = async () => {
    if (addedIngredients.length === 0) {
      setNutritionData(null);
      setRawNutritionData(null);
      setPerServingData(null);
      setNutritionError(null);
      return;
    }
    
    try {
      setIsLoadingNutrition(true);
      setNutritionError(null);
      
      // Convert ingredients to strings for API
      const ingredientStrings = addedIngredients.map(ingredient =>
        NutritionApi.buildIngredientString(
          ingredient.quantity,
          ingredient.unit,
          ingredient.name
        )
      );
      
      // Call nutrition analysis API
      const response = await NutritionApi.analyzeNutrition(
        ingredientStrings,
        recipeName || 'Custom Recipe'
      );
      
      // Check if response exists and has valid nutrition data
      if (!response || !response.data || !response.data.totalNutrients || !response.data.totalDaily) {
        throw new Error('Invalid API response: missing nutrition data');
      }
      
      // Extract raw nutrition data from API response
      const extractedData = extractNutritionData(response.data);
      setRawNutritionData(extractedData);
      
      // Calculate and store nutrition proportions for each ingredient
      const totalGrams = addedIngredients.reduce((sum, ing) => sum + ing.grams, 0);
      setTotalGramsAtLastAnalysis(totalGrams);
      
      const ingredientsWithProportions = calculateNutritionProportions(addedIngredients, extractedData);
      setAddedIngredients(ingredientsWithProportions);
      
      // Set default servings and calculate per-serving nutrition
      const defaultServings = 1;
      setServingsPerContainer(defaultServings);
      
      // Calculate default per-serving weight
      const defaultServingWeight = Math.round(extractedData.totalWeight / (extractedData.yield || 1));
      setServingSizeWeight(defaultServingWeight);
      
      // Use the new function to calculate nutrition data
      updateNutritionForServingSize(servingSizeNumber, defaultServingWeight, extractedData);
      
      // Step 3: Save nutrition data to backend progressively
      if (currentRecipe?.id) {
        await saveNutritionToBackend(extractedData, defaultServings);
      }
      
    } catch (error: any) {
      setNutritionError(error.message || 'Failed to analyze nutrition');
      // Fallback to empty nutrition data
      initializeEmptyNutrition();
    } finally {
      setIsLoadingNutrition(false);
    }
  };

  // Step 3: Live sync nutrition data to backend (save processed display data)
  const saveNutritionToBackend = async (nutritionData: NutritionData, servingsPerContainer: number) => {
    if (!currentRecipe?.id) {
      console.warn('⚠️ No current recipe ID, skipping nutrition save');
      return;
    }
    
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
        
        // Per-serving processed data (what displays on label)
        per_serving_data: perServingData ? {
          serving_size: perServingData.servingSize,
          serving_size_grams: perServingData.servingSizeGrams,
          calories_per_serving: perServingData.calories,
          nutrients_per_serving: perServingData.nutrients,
          daily_values_per_serving: perServingData.dailyValues
        } : null
      };
      
      console.log('🔄 Live sync: Saving processed nutrition data to backend:', {
        recipeId: currentRecipe.id,
        processedData: processedNutritionData
      });
      
      const response = await ProgressiveRecipeApi.saveNutritionData(
        currentRecipe.id,
        processedNutritionData,
        servingsPerContainer,
        perServingData
      );
      
      console.log('📡 Live sync nutrition API response:', response);
      
      if (response.success) {
        console.log('✅ Live sync: Processed nutrition data saved successfully');
        
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            console.log('📊 Live nutrition progress update:', progressResponse.data.progress);
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('❌ Live sync nutrition progress error:', progressError);
        }
      } else {
        console.error('❌ Live sync nutrition failed:', response);
        alert('Live sync nutrition failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Live sync nutrition error:', error);
      alert('Live sync nutrition error: ' + (error.message || 'Network error'));
    }
  };
  
  // Function to calculate nutrition proportions for each ingredient with comprehensive vitamins/minerals
  const calculateNutritionProportions = (ingredients: AddedIngredient[], totalNutrition: NutritionData) => {
    const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
    if (totalGrams === 0) return ingredients;

    return ingredients.map(ingredient => {
      const proportion = ingredient.grams / totalGrams;
      return {
        ...ingredient,
        nutritionProportion: {
          calories: totalNutrition.calories * proportion,
          // Macronutrients
          totalFat: totalNutrition.totalNutrients.FAT.quantity * proportion,
          saturatedFat: totalNutrition.totalNutrients.FASAT.quantity * proportion,
          transFat: totalNutrition.totalNutrients.FATRN.quantity * proportion,
          monounsaturatedFat: (totalNutrition.totalNutrients.FAMS?.quantity || 0) * proportion,
          polyunsaturatedFat: (totalNutrition.totalNutrients.FAPU?.quantity || 0) * proportion,
          cholesterol: totalNutrition.totalNutrients.CHOLE.quantity * proportion,
          sodium: totalNutrition.totalNutrients.NA.quantity * proportion,
          totalCarbohydrate: totalNutrition.totalNutrients.CHOCDF.quantity * proportion,
          dietaryFiber: totalNutrition.totalNutrients.FIBTG.quantity * proportion,
          totalSugars: totalNutrition.totalNutrients.SUGAR.quantity * proportion,
          addedSugars: 0, // Not available in current structure
          sugarAlcohol: 0, // Not available in current structure
          protein: totalNutrition.totalNutrients.PROCNT.quantity * proportion,
          
          // Comprehensive Vitamins - Based on exact API response structure
          vitaminA: (totalNutrition.totalNutrients.VITA_RAE?.quantity || 0) * proportion,
          vitaminC: (totalNutrition.totalNutrients.VITC?.quantity || 0) * proportion,
          vitaminD: totalNutrition.totalNutrients.VITD.quantity * proportion,
          vitaminE: (totalNutrition.totalNutrients.TOCPHA?.quantity || 0) * proportion,
          vitaminK: (totalNutrition.totalNutrients.VITK1?.quantity || 0) * proportion,
          thiamin: (totalNutrition.totalNutrients.THIA?.quantity || 0) * proportion,
          riboflavin: (totalNutrition.totalNutrients.RIBF?.quantity || 0) * proportion,
          niacin: (totalNutrition.totalNutrients.NIA?.quantity || 0) * proportion,
          vitaminB6: (totalNutrition.totalNutrients.VITB6A?.quantity || 0) * proportion,
          folate: (totalNutrition.totalNutrients.FOLDFE?.quantity || 0) * proportion,
          vitaminB12: (totalNutrition.totalNutrients.VITB12?.quantity || 0) * proportion,
          pantothenicAcid: (totalNutrition.totalNutrients.PANTAC?.quantity || 0) * proportion,
          
          // Comprehensive Minerals - Based on exact API response structure
          calcium: totalNutrition.totalNutrients.CA.quantity * proportion,
          iron: totalNutrition.totalNutrients.FE.quantity * proportion,
          potassium: totalNutrition.totalNutrients.K.quantity * proportion,
          phosphorus: (totalNutrition.totalNutrients.P?.quantity || 0) * proportion,
          magnesium: totalNutrition.totalNutrients.MG.quantity * proportion,
          zinc: (totalNutrition.totalNutrients.ZN?.quantity || 0) * proportion,
          selenium: (totalNutrition.totalNutrients.SE?.quantity || 0) * proportion,
          copper: (totalNutrition.totalNutrients.CU?.quantity || 0) * proportion,
          manganese: (totalNutrition.totalNutrients.MN?.quantity || 0) * proportion,
          
          // Daily values (percentages) - Basic nutrients
          totalFatDV: totalNutrition.totalDaily.FAT.quantity * proportion,
          saturatedFatDV: totalNutrition.totalDaily.FASAT.quantity * proportion,
          monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
          polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
          cholesterolDV: totalNutrition.totalDaily.CHOLE.quantity * proportion,
          sodiumDV: totalNutrition.totalDaily.NA.quantity * proportion,
          totalCarbohydrateDV: totalNutrition.totalDaily.CHOCDF.quantity * proportion,
          dietaryFiberDV: totalNutrition.totalDaily.FIBTG.quantity * proportion,
          addedSugarsDV: 0, // Not available in current structure
          sugarAlcoholDV: 0, // No DV established for sugar alcohols
          proteinDV: totalNutrition.totalDaily.PROCNT.quantity * proportion,
          vitaminDDV: totalNutrition.totalDaily.VITD.quantity * proportion,
          calciumDV: totalNutrition.totalDaily.CA.quantity * proportion,
          ironDV: totalNutrition.totalDaily.FE.quantity * proportion,
          potassiumDV: totalNutrition.totalDaily.K.quantity * proportion
        }
      };
    });
  };

  // Function to recalculate nutrition locally based on current ingredient weights
  const recalculateNutritionLocally = (ingredients: AddedIngredient[]) => {
    // Check if we have nutrition proportions for all ingredients
    const hasAllProportions = ingredients.every(ing => ing.nutritionProportion);
    if (!hasAllProportions || totalGramsAtLastAnalysis === 0) {
      return null; // Cannot recalculate locally, need API call
    }

    const currentTotalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
    if (currentTotalGrams === 0) return null;

    // Recalculate total nutrition by scaling each ingredient's proportion based on its current weight
    const recalculatedNutrition: NutritionData = {
      yield: 1,
      calories: 0,
      totalWeight: currentTotalGrams,
      totalNutrients: {
        // Macronutrients
        FAT: { label: 'Total lipid (fat)', quantity: 0, unit: 'g' },
        FASAT: { label: 'Fatty acids, total saturated', quantity: 0, unit: 'g' },
        FATRN: { label: 'Fatty acids, total trans', quantity: 0, unit: 'g' },
        FAMS: { label: 'Fatty acids, total monounsaturated', quantity: 0, unit: 'g' },
        FAPU: { label: 'Fatty acids, total polyunsaturated', quantity: 0, unit: 'g' },
        CHOCDF: { label: 'Carbohydrate, by difference', quantity: 0, unit: 'g' },
        FIBTG: { label: 'Fiber, total dietary', quantity: 0, unit: 'g' },
        SUGAR: { label: 'Sugars, total', quantity: 0, unit: 'g' },
        PROCNT: { label: 'Protein', quantity: 0, unit: 'g' },
        CHOLE: { label: 'Cholesterol', quantity: 0, unit: 'mg' },
        NA: { label: 'Sodium, Na', quantity: 0, unit: 'mg' },
        
        // Comprehensive Vitamins
        VITA_RAE: { label: 'Vitamin A, RAE', quantity: 0, unit: 'µg' },
        VITC: { label: 'Vitamin C, total ascorbic acid', quantity: 0, unit: 'mg' },
        VITD: { label: 'Vitamin D (D2 + D3)', quantity: 0, unit: 'µg' },
        TOCPHA: { label: 'Vitamin E (alpha-tocopherol)', quantity: 0, unit: 'mg' },
        VITK1: { label: 'Vitamin K (phylloquinone)', quantity: 0, unit: 'µg' },
        THIA: { label: 'Thiamin', quantity: 0, unit: 'mg' },
        RIBF: { label: 'Riboflavin', quantity: 0, unit: 'mg' },
        NIA: { label: 'Niacin', quantity: 0, unit: 'mg' },
        VITB6A: { label: 'Vitamin B-6', quantity: 0, unit: 'mg' },
        FOLDFE: { label: 'Folate, DFE', quantity: 0, unit: 'µg' },
        VITB12: { label: 'Vitamin B-12', quantity: 0, unit: 'µg' },
        PANTAC: { label: 'Pantothenic acid', quantity: 0, unit: 'mg' },
        
        // Comprehensive Minerals
        CA: { label: 'Calcium, Ca', quantity: 0, unit: 'mg' },
        FE: { label: 'Iron, Fe', quantity: 0, unit: 'mg' },
        K: { label: 'Potassium, K', quantity: 0, unit: 'mg' },
        P: { label: 'Phosphorus, P', quantity: 0, unit: 'mg' },
        MG: { label: 'Magnesium, Mg', quantity: 0, unit: 'mg' },
        ZN: { label: 'Zinc, Zn', quantity: 0, unit: 'mg' },
        SE: { label: 'Selenium, Se', quantity: 0, unit: 'µg' },
        CU: { label: 'Copper, Cu', quantity: 0, unit: 'mg' },
        MN: { label: 'Manganese, Mn', quantity: 0, unit: 'mg' }
      },
      totalDaily: {
        FAT: { label: 'Total lipid (fat)', quantity: 0, unit: '%' },
        FASAT: { label: 'Fatty acids, total saturated', quantity: 0, unit: '%' },
        CHOCDF: { label: 'Carbohydrate, by difference', quantity: 0, unit: '%' },
        FIBTG: { label: 'Fiber, total dietary', quantity: 0, unit: '%' },
        PROCNT: { label: 'Protein', quantity: 0, unit: '%' },
        CHOLE: { label: 'Cholesterol', quantity: 0, unit: '%' },
        NA: { label: 'Sodium, Na', quantity: 0, unit: '%' },
        CA: { label: 'Calcium, Ca', quantity: 0, unit: '%' },
        MG: { label: 'Magnesium, Mg', quantity: 0, unit: '%' },
        K: { label: 'Potassium, K', quantity: 0, unit: '%' },
        FE: { label: 'Iron, Fe', quantity: 0, unit: '%' },
        VITD: { label: 'Vitamin D', quantity: 0, unit: '%' }
      }
    };

    // Calculate the original weight for each ingredient when proportions were stored
    const originalTotalCalories = ingredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calories || 0), 0);
    
    ingredients.forEach(ingredient => {
      if (ingredient.nutritionProportion && originalTotalCalories > 0) {
        // Calculate the original weight of this ingredient based on its calorie proportion
        const originalIngredientWeight = totalGramsAtLastAnalysis * (ingredient.nutritionProportion.calories / originalTotalCalories);
        
        // Calculate scaling factor for this specific ingredient
        const ingredientScaling = originalIngredientWeight > 0 ? ingredient.grams / originalIngredientWeight : 0;
        
        // Scale all nutrition values for this ingredient
        recalculatedNutrition.calories += ingredient.nutritionProportion.calories * ingredientScaling;
        
        // Macronutrients
        recalculatedNutrition.totalNutrients.FAT.quantity += ingredient.nutritionProportion.totalFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.FASAT.quantity += ingredient.nutritionProportion.saturatedFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.FATRN.quantity += ingredient.nutritionProportion.transFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.FAMS.quantity += ingredient.nutritionProportion.monounsaturatedFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.FAPU.quantity += ingredient.nutritionProportion.polyunsaturatedFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.CHOLE.quantity += ingredient.nutritionProportion.cholesterol * ingredientScaling;
        recalculatedNutrition.totalNutrients.NA.quantity += ingredient.nutritionProportion.sodium * ingredientScaling;
        recalculatedNutrition.totalNutrients.CHOCDF.quantity += ingredient.nutritionProportion.totalCarbohydrate * ingredientScaling;
        recalculatedNutrition.totalNutrients.FIBTG.quantity += ingredient.nutritionProportion.dietaryFiber * ingredientScaling;
        recalculatedNutrition.totalNutrients.SUGAR.quantity += ingredient.nutritionProportion.totalSugars * ingredientScaling;
        recalculatedNutrition.totalNutrients.PROCNT.quantity += ingredient.nutritionProportion.protein * ingredientScaling;
        
        // Comprehensive Vitamins
        recalculatedNutrition.totalNutrients.VITA_RAE.quantity += (ingredient.nutritionProportion.vitaminA || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.VITC.quantity += (ingredient.nutritionProportion.vitaminC || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.VITD.quantity += ingredient.nutritionProportion.vitaminD * ingredientScaling;
        recalculatedNutrition.totalNutrients.TOCPHA.quantity += (ingredient.nutritionProportion.vitaminE || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.VITK1.quantity += (ingredient.nutritionProportion.vitaminK || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.THIA.quantity += (ingredient.nutritionProportion.thiamin || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.RIBF.quantity += (ingredient.nutritionProportion.riboflavin || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.NIA.quantity += (ingredient.nutritionProportion.niacin || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.VITB6A.quantity += (ingredient.nutritionProportion.vitaminB6 || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.FOLDFE.quantity += (ingredient.nutritionProportion.folate || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.VITB12.quantity += (ingredient.nutritionProportion.vitaminB12 || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.PANTAC.quantity += (ingredient.nutritionProportion.pantothenicAcid || 0) * ingredientScaling;
        
        // Comprehensive Minerals
        recalculatedNutrition.totalNutrients.CA.quantity += ingredient.nutritionProportion.calcium * ingredientScaling;
        recalculatedNutrition.totalNutrients.FE.quantity += ingredient.nutritionProportion.iron * ingredientScaling;
        recalculatedNutrition.totalNutrients.K.quantity += ingredient.nutritionProportion.potassium * ingredientScaling;
        recalculatedNutrition.totalNutrients.P.quantity += (ingredient.nutritionProportion.phosphorus || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.MG.quantity += (ingredient.nutritionProportion.magnesium || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.ZN.quantity += (ingredient.nutritionProportion.zinc || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.SE.quantity += (ingredient.nutritionProportion.selenium || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.CU.quantity += (ingredient.nutritionProportion.copper || 0) * ingredientScaling;
        recalculatedNutrition.totalNutrients.MN.quantity += (ingredient.nutritionProportion.manganese || 0) * ingredientScaling;
        
        // Scale daily values for this ingredient
        recalculatedNutrition.totalDaily.FAT.quantity += ingredient.nutritionProportion.totalFatDV * ingredientScaling;
        recalculatedNutrition.totalDaily.FASAT.quantity += ingredient.nutritionProportion.saturatedFatDV * ingredientScaling;
        recalculatedNutrition.totalDaily.CHOLE.quantity += ingredient.nutritionProportion.cholesterolDV * ingredientScaling;
        recalculatedNutrition.totalDaily.NA.quantity += ingredient.nutritionProportion.sodiumDV * ingredientScaling;
        recalculatedNutrition.totalDaily.CHOCDF.quantity += ingredient.nutritionProportion.totalCarbohydrateDV * ingredientScaling;
        recalculatedNutrition.totalDaily.FIBTG.quantity += ingredient.nutritionProportion.dietaryFiberDV * ingredientScaling;
        recalculatedNutrition.totalDaily.PROCNT.quantity += ingredient.nutritionProportion.proteinDV * ingredientScaling;
        recalculatedNutrition.totalDaily.VITD.quantity += ingredient.nutritionProportion.vitaminDDV * ingredientScaling;
        recalculatedNutrition.totalDaily.CA.quantity += ingredient.nutritionProportion.calciumDV * ingredientScaling;
        recalculatedNutrition.totalDaily.FE.quantity += ingredient.nutritionProportion.ironDV * ingredientScaling;
        recalculatedNutrition.totalDaily.K.quantity += ingredient.nutritionProportion.potassiumDV * ingredientScaling;
      }
    });

    return recalculatedNutrition;
  };

  // Function to handle serving size changes
  const handleServingChange = (newServings: number) => {
    if (newServings <= 0 || !rawNutritionData) return;
    
    setServingsPerContainer(newServings);
    
    // Recalculate per-serving nutrition data with new serving count
    const updatedPerServingNutrition = calculatePerServingNutrition(rawNutritionData, newServings);
    setPerServingData(updatedPerServingNutrition);
    
    // Update FDA nutrition data with new per-serving values
    const mappedData = mapPerServingDataToFDAFormat(updatedPerServingNutrition);
    setNutritionData(mappedData);
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
      
      // Call the food parser API to get detailed ingredient data
      const parseResponse = await foodParserApi.parseIngredient(ingredient.name);
      
      if (!parseResponse) {
        console.error('❌ API call failed or no food data:', parseResponse);
        return;
      }
      
      const foodData = parseResponse;
      
      // Check if we have parsed data
      if (foodData.parsed && foodData.parsed.length > 0) {
        const parsed = foodData.parsed[0];
        
        // Get hints for available measures
        const hints = foodData.hints;
        if (!hints || hints.length === 0) {
          console.error('❌ No hints available for measures');
          return;
        }
        
        const hint = hints[0];
        
        // Filter out measures without labels
        const allMeasures = hint.measures || [];
        let measures = allMeasures.filter(measure => measure.label && measure.label.trim() !== '');
        
        // Use actual parsed values - NO FALLBACKS
        if (!parsed.quantity) {
          console.error('❌ No quantity in parsed data');
          return;
        }
        
        if (!parsed.measure) {
          console.error('❌ No measure in parsed data');
          return;
        }
        
        const actualQuantity = parsed.quantity;
        const actualMeasure = parsed.measure;
        const ingredientName = hint.food.label;
        
        // Find the corresponding measure in availableMeasures to ensure consistency
        let correspondingMeasure = measures.find(m => m.label === actualMeasure.label);
        
        // CRITICAL FIX: If parsed measure is not in available measures, add it
        if (!correspondingMeasure && actualMeasure.label && actualMeasure.weight) {
          const parsedMeasureToAdd = {
            uri: actualMeasure.uri || `http://www.edamam.com/ontologies/edamam.owl#Measure_${actualMeasure.label.toLowerCase()}`,
            label: actualMeasure.label,
            weight: actualMeasure.weight
          };
          
          // Add the parsed measure to the beginning of measures array for priority
          measures = [parsedMeasureToAdd, ...measures];
          correspondingMeasure = parsedMeasureToAdd;
        }
        
        if (measures.length === 0) {
          console.error('❌ No valid measures available');
          return;
        }
        
        // Use the corresponding measure (either found or added) or fallback to first available
        const finalMeasure = correspondingMeasure || measures[0];
        const measureWeight = finalMeasure.weight;
        
        // Calculate grams using the weight from availableMeasures for consistency
        const baseGrams = Math.round((actualQuantity * measureWeight) * 10) / 10;
        
        const newIngredient: AddedIngredient = {
          id: `${ingredient.name}-${Date.now()}`,
          name: ingredientName,
          quantity: actualQuantity,
          unit: finalMeasure.label,
          waste: 0.0,
          grams: baseGrams,
          availableMeasures: measures,
          allergens: []
        };
        
        // Add to local state first
        setAddedIngredients(prev => {
          const updated = [...prev, newIngredient];
          
          // Step 2: Save ingredients to backend progressively
          if (currentRecipe?.id) {
            saveIngredientsToBackend(updated);
          }
          
          return updated;
        });
        
      } else {
        console.error('❌ No parsed data available in response');
      }
      
    } catch (error) {
      console.error('💥 Error adding ingredient:', error);
    } finally {
      setLoadingIngredientName(null);
    }
  };

  // Step 2: Live sync ingredients to backend (save processed display data)
  const saveIngredientsToBackend = async (ingredients: AddedIngredient[]) => {
    if (!currentRecipe?.id) {
      console.warn('⚠️ No current recipe ID, skipping ingredient save');
      return;
    }
    
    try {
      // Transform ingredients to processed display data format (not raw API data)
      const processedIngredients = ingredients.map(ing => ({
        id: ing.id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        waste_percentage: ing.waste,
        grams: ing.grams,
        available_measures: ing.availableMeasures,
        allergens: ing.allergens,
        // Include processed nutrition data if available
        nutrition_proportion: ing.nutritionProportion || null
      }));
      
      console.log('🔄 Live sync: Saving processed ingredient data to backend:', {
        recipeId: currentRecipe.id,
        ingredientCount: processedIngredients.length,
        processedData: processedIngredients
      });
      
      const response = await ProgressiveRecipeApi.addIngredients(currentRecipe.id, processedIngredients);
      
      console.log('📡 Live sync API response:', response);
      
      if (response.success) {
        console.log('✅ Live sync: Processed ingredients saved successfully');
        
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
        console.error('❌ Live sync failed:', response);
        alert('Live sync failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Live sync error:', error);
      alert('Live sync error: ' + (error.message || 'Network error'));
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
        const recalculatedNutrition = recalculateNutritionLocally(updated);
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
        console.log('🔄 Live sync: Ingredient removed, syncing deletion to backend...');
        saveIngredientsToBackend(updated);
      }
      
      return updated;
    });
  };
  
  const handleUpdateIngredient = (id: string, field: keyof AddedIngredient, value: any) => {
    setAddedIngredients(prev => {
      const updated = prev.map(ingredient => {
        if (ingredient.id === id) {
          const updatedIngredient = { ...ingredient, [field]: value };
          
          // Recalculate grams when quantity, unit, or waste changes
          if (field === 'quantity' || field === 'unit' || field === 'waste') {
            const selectedMeasure = updatedIngredient.availableMeasures.find(
              measure => measure.label === updatedIngredient.unit
            );
            
            if (selectedMeasure) {
              // Calculate base grams from quantity and unit
              const baseGrams = updatedIngredient.quantity * selectedMeasure.weight;
              // Apply waste calculation: if 10% waste, only 90% remains
              const wastePercentage = updatedIngredient.waste / 100;
              updatedIngredient.grams = Math.round((baseGrams * (1 - wastePercentage)) * 10) / 10;
            }
          }
          
          return updatedIngredient;
        }
        return ingredient;
      });
      
      // Try to recalculate nutrition locally instead of making API call
      const recalculatedNutrition = recalculateNutritionLocally(updated);
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
        saveIngredientsToBackend(updated);
      }
      
      return updated;
    });
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
  const handleServingSizeWeightChange = (newWeight: number) => {
    setServingSizeWeight(newWeight);
    
    if (rawNutritionData && newWeight > 0) {
      // Calculate new serving size number based on weight
      const defaultServingWeight = rawNutritionData.totalWeight / (rawNutritionData.yield || 1);
      const newServingNumber = newWeight / defaultServingWeight;
      setServingSizeNumber(newServingNumber);
      
      // Update nutrition data based on new serving size
      updateNutritionForServingSize(newServingNumber, newWeight);
    }
  };

  // Function to handle serving size number changes
  const handleServingSizeNumberChange = (newNumber: number) => {
    setServingSizeNumber(newNumber);
    
    if (rawNutritionData && newNumber > 0) {
      // Calculate new serving weight based on number
      const defaultServingWeight = rawNutritionData.totalWeight / (rawNutritionData.yield || 1);
      const newWeight = defaultServingWeight * newNumber;
      setServingSizeWeight(newWeight);
      
      // Update nutrition data based on new serving size
      updateNutritionForServingSize(newNumber, newWeight);
    }
   };

  // Function to handle package configuration changes
  const handlePackageConfigChange = async (netWeight: number, servingsPerPkg: number) => {
    if (!rawNutritionData || netWeight <= 0 || servingsPerPkg <= 0) return;
    
    // Calculate serving size based on package configuration
    const servingSizeGrams = netWeight / servingsPerPkg;
    
    // Calculate scaling factor based on package weight vs total recipe weight
    const packageScalingFactor = netWeight / rawNutritionData.totalWeight;
    
    // Create package-based per-serving nutrition data
    const packagePerServingData: PerServingNutritionData = {
      servingsPerContainer: servingsPerPkg,
      servingSize: `${Math.round(servingSizeGrams)}g`,
      servingSizeGrams: Math.round(servingSizeGrams),
      calories: Math.round((rawNutritionData.calories * packageScalingFactor) / servingsPerPkg),
      
      nutrients: {
        FAT: {
          label: rawNutritionData.totalNutrients.FAT.label,
          quantity: Math.round((rawNutritionData.totalNutrients.FAT.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.FAT.unit
        },
        FASAT: {
          label: rawNutritionData.totalNutrients.FASAT.label,
          quantity: Math.round((rawNutritionData.totalNutrients.FASAT.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.FASAT.unit
        },
        FATRN: {
          label: rawNutritionData.totalNutrients.FATRN.label,
          quantity: Math.round((rawNutritionData.totalNutrients.FATRN.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.FATRN.unit
        },
        CHOCDF: {
          label: rawNutritionData.totalNutrients.CHOCDF.label,
          quantity: Math.round((rawNutritionData.totalNutrients.CHOCDF.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.CHOCDF.unit
        },
        FIBTG: {
          label: rawNutritionData.totalNutrients.FIBTG.label,
          quantity: Math.round((rawNutritionData.totalNutrients.FIBTG.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.FIBTG.unit
        },
        SUGAR: {
          label: rawNutritionData.totalNutrients.SUGAR.label,
          quantity: Math.round((rawNutritionData.totalNutrients.SUGAR.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.SUGAR.unit
        },
        PROCNT: {
          label: rawNutritionData.totalNutrients.PROCNT.label,
          quantity: Math.round((rawNutritionData.totalNutrients.PROCNT.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.PROCNT.unit
        },
        CHOLE: {
          label: rawNutritionData.totalNutrients.CHOLE.label,
          quantity: Math.round((rawNutritionData.totalNutrients.CHOLE.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.CHOLE.unit
        },
        NA: {
          label: rawNutritionData.totalNutrients.NA.label,
          quantity: Math.round((rawNutritionData.totalNutrients.NA.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.NA.unit
        },
        CA: {
          label: rawNutritionData.totalNutrients.CA.label,
          quantity: Math.round((rawNutritionData.totalNutrients.CA.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.CA.unit
        },
        MG: {
          label: rawNutritionData.totalNutrients.MG.label,
          quantity: Math.round((rawNutritionData.totalNutrients.MG.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.MG.unit
        },
        K: {
          label: rawNutritionData.totalNutrients.K.label,
          quantity: Math.round((rawNutritionData.totalNutrients.K.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.K.unit
        },
        FE: {
          label: rawNutritionData.totalNutrients.FE.label,
          quantity: Math.round((rawNutritionData.totalNutrients.FE.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.FE.unit
        },
        VITD: {
          label: rawNutritionData.totalNutrients.VITD.label,
          quantity: Math.round((rawNutritionData.totalNutrients.VITD.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalNutrients.VITD.unit
        }
      },
      
      dailyValues: {
        FAT: {
          label: rawNutritionData.totalDaily.FAT.label,
          quantity: Math.round((rawNutritionData.totalDaily.FAT.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.FAT.unit
        },
        FASAT: {
          label: rawNutritionData.totalDaily.FASAT.label,
          quantity: Math.round((rawNutritionData.totalDaily.FASAT.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.FASAT.unit
        },
        CHOCDF: {
          label: rawNutritionData.totalDaily.CHOCDF.label,
          quantity: Math.round((rawNutritionData.totalDaily.CHOCDF.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.CHOCDF.unit
        },
        FIBTG: {
          label: rawNutritionData.totalDaily.FIBTG.label,
          quantity: Math.round((rawNutritionData.totalDaily.FIBTG.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.FIBTG.unit
        },
        PROCNT: {
          label: rawNutritionData.totalDaily.PROCNT.label,
          quantity: Math.round((rawNutritionData.totalDaily.PROCNT.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.PROCNT.unit
        },
        CHOLE: {
          label: rawNutritionData.totalDaily.CHOLE.label,
          quantity: Math.round((rawNutritionData.totalDaily.CHOLE.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.CHOLE.unit
        },
        NA: {
          label: rawNutritionData.totalDaily.NA.label,
          quantity: Math.round((rawNutritionData.totalDaily.NA.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.NA.unit
        },
        CA: {
          label: rawNutritionData.totalDaily.CA.label,
          quantity: Math.round((rawNutritionData.totalDaily.CA.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.CA.unit
        },
        MG: {
          label: rawNutritionData.totalDaily.MG.label,
          quantity: Math.round((rawNutritionData.totalDaily.MG.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.MG.unit
        },
        K: {
          label: rawNutritionData.totalDaily.K.label,
          quantity: Math.round((rawNutritionData.totalDaily.K.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.K.unit
        },
        FE: {
          label: rawNutritionData.totalDaily.FE.label,
          quantity: Math.round((rawNutritionData.totalDaily.FE.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.FE.unit
        },
        VITD: {
          label: rawNutritionData.totalDaily.VITD.label,
          quantity: Math.round((rawNutritionData.totalDaily.VITD.quantity * packageScalingFactor / servingsPerPkg) * 100) / 100,
          unit: rawNutritionData.totalDaily.VITD.unit
        }
      }
    };
    
    // Update the per-serving data and FDA nutrition data
    setPerServingData(packagePerServingData);
    const fdaNutritionData = mapPerServingDataToFDAFormat(packagePerServingData);
    setNutritionData(fdaNutritionData);
    
    // Step 4: Save serving configuration to backend
    if (currentRecipe?.id) {
      await saveServingConfigToBackend({
        mode: 'package',
        servings_per_container: servingsPerPkg,
        serving_size_grams: Math.round(servingSizeGrams),
        net_weight_per_package: netWeight,
        servings_per_package: servingsPerPkg
      });
    }
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
      
      if (response.success) {
        console.log('✅ Serving configuration saved to backend successfully:', response.data);
        
        // Update progress
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            console.log('📊 Progress updated after serving config save:', progressResponse.data.progress);
            setRecipeProgress(progressResponse.data.progress);
            
            // Step 5: Complete recipe if all steps are done
            if (progressResponse.data.progress.current_step === 'serving_configured') {
              console.log('🎯 All steps completed, finalizing recipe...');
              await completeRecipe();
            }
          } else {
            console.warn('⚠️ Failed to get progress after serving config save');
          }
        } catch (progressError) {
          console.error('❌ Error getting progress after serving config save:', progressError);
        }
      } else {
        console.error('❌ Serving config save failed:', response);
        alert('Failed to save serving configuration: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('❌ Error saving serving configuration to backend:', error);
      alert('Failed to save serving configuration: ' + (error.message || 'Network error'));
    }
  };

  // Step 5: Complete recipe creation
  const completeRecipe = async () => {
    if (!currentRecipe?.id) return;
    
    try {
      const response = await ProgressiveRecipeApi.completeRecipe(currentRecipe.id, false);
      
      if (response.success) {
        console.log('✅ Recipe completed successfully:', response.data);
        
        // Update progress to show completion
        const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
        if (progressResponse.success) {
          setRecipeProgress(progressResponse.data.progress);
        }
        
        // Show success message
        alert('🎉 Recipe created successfully! Your nutrition label is ready.');
      }
    } catch (error: any) {
      console.error('❌ Error completing recipe:', error);
      alert('Failed to complete recipe: ' + error.message);
    }
  };

  // Function to update nutrition data based on serving size
  const updateNutritionForServingSize = (servingNumber: number, servingWeight: number, nutritionData?: NutritionData) => {
    const dataToUse = nutritionData || rawNutritionData;
    if (!dataToUse) return;
    
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
  
  // Removed loadPage function - no longer needed with direct API

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
        // Create progressive search callback
        const progressiveCallback: ProgressiveSearchCallback = {
          onOriginalResults: (originalResults) => {

            
            // Immediately display original results
            setSearchResults(originalResults);
            setTotalResults(originalResults.length);
            setTotalPages(Math.ceil(originalResults.length / displayedResultsPerPage));
            
            // Show a loading indicator for enhanced results if we expect more

          },
          
          onEnhancedBatch: (newBatchResults, totalEnhanced) => {

            
            // Add new batch results to existing results
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
              
              // Update pagination
              setTotalResults(unique.length);
              setTotalPages(Math.ceil(unique.length / displayedResultsPerPage));
              
              return unique;
            });
          },
          
          onComplete: (finalResults) => {

            
            // Final update with deduplicated results
            setSearchResults(finalResults.combinedResults);
            setTotalResults(finalResults.totalResults);
            setTotalPages(Math.ceil(finalResults.totalResults / displayedResultsPerPage));
            setIsSearching(false);
            
            if (finalResults.combinedResults.length === 0) {
              setSearchError('No ingredients found. Please try a different search term.');
            }
          },
          
          onError: (error) => {
            console.error('Progressive search error:', error);
            setSearchError('Failed to search ingredients. Please try again.');
            setSearchResults([]);
            setTotalResults(0);
            setTotalPages(0);
            setIsSearching(false);
          }
        };
        
        // Start progressive enhanced search
        await performProgressiveEnhancedSearch(searchQuery.trim(), progressiveCallback);
        
      } catch (error) {
        console.error('Search initialization error:', error);
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

  const handleAddRecipe = () => {
    setIsRecipeNameModalOpen(true);
  };

  const handleRecipeNameSubmit = async () => {
    if (recipeName.trim() && !isCreatingRecipe) {
      setIsCreatingRecipe(true);
      try {
        console.log('🚀 Creating recipe with name:', recipeName.trim());
        
        // Step 1: Create recipe with progressive API
        const response = await ProgressiveRecipeApi.createRecipe({
          name: recipeName.trim(),
          description: '',
          is_public: false
        });

        console.log('📡 API Response:', response);

        // Handle both direct response and wrapped response formats
        const responseData = response.success ? response : response.data || response;
        const recipeData = responseData.data || responseData;
        
        if (responseData.success !== false && recipeData) {
          console.log('✅ Recipe created successfully, setting states...');
          console.log('📦 Recipe data:', recipeData);
          
          // Set all states immediately after successful creation
          setCurrentRecipe(recipeData);
          setIsRecipeCreated(true);
          setIsRecipeNameModalOpen(false);
          
          // Get initial progress
          try {
            const progressResponse = await ProgressiveRecipeApi.getProgress(recipeData.id!);
            if (progressResponse.success) {
              setRecipeProgress(progressResponse.data.progress);
              console.log('📊 Progress loaded:', progressResponse.data.progress);
            }
          } catch (progressError) {
            console.warn('⚠️ Failed to load progress, but recipe was created:', progressError);
          }
          
          // Clear any existing cache to prevent conflicts
          clearStateCache();
          
          console.log('🎉 Recipe creation completed successfully!');
        } else {
          throw new Error(responseData.error || responseData.message || 'Failed to create recipe');
        }
      } catch (error: any) {
        console.error('❌ Error creating recipe:', error);
        alert('Failed to create recipe: ' + (error.message || 'Unknown error'));
        // Reset states on error but keep the modal open for retry
        setCurrentRecipe(null);
        setRecipeProgress(null);
        setIsRecipeCreated(false);
      } finally {
        setIsCreatingRecipe(false);
      }
    }
  };

  const handleCancelRecipeCreation = () => {
    setIsRecipeNameModalOpen(false);
    setRecipeName('');
    setIsRecipeCreated(false);
    setCurrentRecipe(null);
    setRecipeProgress(null);
    setIsCreatingRecipe(false);
    // Navigate back to home or previous page
    navigate('/');
  };

  const handleRename = () => {
    setNewRecipeName(recipeName);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = () => {
    if (newRecipeName.trim()) {
      setRecipeName(newRecipeName.trim());
      setIsRenameModalOpen(false);
      setNewRecipeName('');
    }
  };

  const handleCancelRename = () => {
    setIsRenameModalOpen(false);
    setNewRecipeName('');
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
      // Create a custom ingredient object that matches AddedIngredient interface
      const customIngredient: AddedIngredient = {
        id: `custom-${Date.now()}`,
        name: ingredientData.name,
        quantity: 1,
        unit: ingredientData.servingUnit,
        waste: 0.0,
        grams: ingredientData.servingSize,
        availableMeasures: [
          {
            uri: `custom-measure-${ingredientData.servingUnit}`,
            label: ingredientData.servingUnit,
            weight: ingredientData.servingSize
          }
        ],
        allergens: ingredientData.allergens.contains || [],
        // Add nutrition proportion based on custom ingredient data
        nutritionProportion: {
          calories: ingredientData.nutrition.calories,
          // Macronutrients
          totalFat: ingredientData.nutrition.fat,
          saturatedFat: ingredientData.nutrition.saturatedFat,
          transFat: ingredientData.nutrition.transFat,
          monounsaturatedFat: 0, // Not available in custom ingredient form
          polyunsaturatedFat: 0, // Not available in custom ingredient form
          cholesterol: ingredientData.nutrition.cholesterol,
          sodium: ingredientData.nutrition.sodium,
          totalCarbohydrate: ingredientData.nutrition.carbohydrates,
          dietaryFiber: ingredientData.nutrition.fiber,
          totalSugars: ingredientData.nutrition.sugars,
          addedSugars: ingredientData.nutrition.addedSugars,
          sugarAlcohol: 0, // Not available in custom ingredient form
          protein: ingredientData.nutrition.protein,
          
          // Comprehensive Vitamins - Use custom ingredient data or default to 0
          vitaminA: ingredientData.nutrition.vitaminA || 0,
          vitaminC: ingredientData.nutrition.vitaminC || 0,
          vitaminD: ingredientData.nutrition.vitaminD || 0,
          vitaminE: 0, // Not available in custom ingredient form
          vitaminK: 0, // Not available in custom ingredient form
          thiamin: ingredientData.nutrition.thiamine || 0, // Note: thiamine with 'e'
          riboflavin: ingredientData.nutrition.riboflavin || 0,
          niacin: ingredientData.nutrition.niacin || 0,
          vitaminB6: ingredientData.nutrition.vitaminB6 || 0,
          folate: ingredientData.nutrition.folate || 0,
          vitaminB12: ingredientData.nutrition.vitaminB12 || 0,
          pantothenicAcid: ingredientData.nutrition.pantothenicAcid || 0,
          
          // Comprehensive Minerals - Use custom ingredient data or default to 0
          calcium: ingredientData.nutrition.calcium,
          iron: ingredientData.nutrition.iron,
          potassium: ingredientData.nutrition.potassium || 0,
          phosphorus: ingredientData.nutrition.phosphorus || 0,
          magnesium: ingredientData.nutrition.magnesium || 0,
          zinc: ingredientData.nutrition.zinc || 0,
          selenium: ingredientData.nutrition.selenium || 0,
          copper: ingredientData.nutrition.copper || 0,
          manganese: ingredientData.nutrition.manganese || 0,
          
          // Daily values - calculate based on standard daily values
          totalFatDV: (ingredientData.nutrition.fat / 65) * 100,
          saturatedFatDV: (ingredientData.nutrition.saturatedFat / 20) * 100,
          monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
          polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
          cholesterolDV: (ingredientData.nutrition.cholesterol / 300) * 100,
          sodiumDV: (ingredientData.nutrition.sodium / 2300) * 100,
          totalCarbohydrateDV: (ingredientData.nutrition.carbohydrates / 300) * 100,
          dietaryFiberDV: (ingredientData.nutrition.fiber / 25) * 100,
          addedSugarsDV: (ingredientData.nutrition.addedSugars / 50) * 100,
          sugarAlcoholDV: 0, // No DV established for sugar alcohols
          proteinDV: (ingredientData.nutrition.protein / 50) * 100,
          vitaminDDV: ((ingredientData.nutrition.vitaminD || 0) / 20) * 100,
          calciumDV: (ingredientData.nutrition.calcium / 1000) * 100,
          ironDV: (ingredientData.nutrition.iron / 18) * 100,
          potassiumDV: ((ingredientData.nutrition.potassium || 0) / 3500) * 100
        }
      };

      // Add the custom ingredient to the recipe
      setAddedIngredients(prev => [...prev, customIngredient]);
      
      // Add to tracking set
      const ingredientKey = ingredientData.name.toLowerCase().trim();
      setAddedIngredientNames(prev => {
        const newSet = new Set(prev);
        newSet.add(ingredientKey);
        return newSet;
      });
      
    } catch (error) {
      console.error('Error adding custom ingredient:', error);
    }
  };

  const handleOpenCustomIngredient = () => {
    // Save current state to cache before navigating
    saveStateToCache();
    
    // Navigate to the custom ingredient page with return URL
    const currentPath = location.pathname;
    navigate(`/ingredients/create?returnTo=${encodeURIComponent(currentPath)}`);
  };

  return (
      <div className="container mx-auto py-4 px-3">
        {/* Show header only when recipe is created */}
        {isRecipeCreated && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {recipeName || 'Recipe'}
                </h1>
                <Button variant="outline" size="sm" onClick={handleRename} className="flex items-center gap-2">
                  🏷️ Rename...
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  🏷️ Add Tags...
                </Button>
              </div>
              <div className="text-sm text-blue-600">
                {recipeProgress?.current_step === 'completed' ? '✅ Recipe Complete' : 'In Progress...'}
              </div>
            </div>

            {/* Progressive Recipe Creation Steps */}
            {recipeProgress && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recipe Creation Progress</h3>
                <div className="flex items-center space-x-4">
                  {/* Step 1: Recipe Name */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      recipeProgress.steps_completed.name_created
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {recipeProgress.steps_completed.name_created ? '✓' : '1'}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Name</span>
                  </div>

                  <div className={`flex-1 h-1 ${
                    recipeProgress.steps_completed.ingredients_added ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 2: Ingredients */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      recipeProgress.steps_completed.ingredients_added
                        ? 'bg-green-500 text-white'
                        : recipeProgress.current_step === 'ingredients_added' || addedIngredients.length > 0
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {recipeProgress.steps_completed.ingredients_added ? '✓' : '2'}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Ingredients</span>
                  </div>

                  <div className={`flex-1 h-1 ${
                    recipeProgress.steps_completed.nutrition_analyzed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 3: Nutrition */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      recipeProgress.steps_completed.nutrition_analyzed
                        ? 'bg-green-500 text-white'
                        : recipeProgress.current_step === 'nutrition_analyzed' || isLoadingNutrition
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {recipeProgress.steps_completed.nutrition_analyzed ? '✓' : isLoadingNutrition ? '⏳' : '3'}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Nutrition</span>
                  </div>

                  <div className={`flex-1 h-1 ${
                    recipeProgress.steps_completed.serving_configured ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 4: Serving */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      recipeProgress.steps_completed.serving_configured
                        ? 'bg-green-500 text-white'
                        : recipeProgress.current_step === 'serving_configured'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {recipeProgress.steps_completed.serving_configured ? '✓' : '4'}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Serving</span>
                  </div>

                  <div className={`flex-1 h-1 ${
                    recipeProgress.steps_completed.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 5: Complete */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      recipeProgress.steps_completed.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {recipeProgress.steps_completed.completed ? '✓' : '5'}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Complete</span>
                  </div>
                </div>

                {/* Current Step Description */}
                <div className="mt-3 text-sm text-gray-600">
                  {recipeProgress.current_step === 'name_created' && addedIngredients.length === 0 && (
                    <span>👆 Next: Add ingredients to your recipe</span>
                  )}
                  {recipeProgress.current_step === 'ingredients_added' && !recipeProgress.steps_completed.nutrition_analyzed && (
                    <span>⚗️ Analyzing nutrition data...</span>
                  )}
                  {recipeProgress.current_step === 'nutrition_analyzed' && !recipeProgress.steps_completed.serving_configured && (
                    <span>📏 Configure serving size below</span>
                  )}
                  {recipeProgress.current_step === 'serving_configured' && !recipeProgress.steps_completed.completed && (
                    <span>🔄 Finalizing recipe...</span>
                  )}
                  {recipeProgress.steps_completed.completed && (
                    <span>🎉 Recipe complete! Your nutrition label is ready.</span>
                  )}
                </div>
              </div>
            )}
            
            {/* Wizard Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {[
                  { id: 'recipe', label: 'Recipe' },
                  { id: 'ingredient-statement', label: 'Ingredient Statement' },
                  { id: 'allergens', label: 'Allergens' },
                  { id: 'label', label: 'Label' },
                  { id: 'cost', label: 'Cost' },
                  { id: 'more', label: 'More' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

      {/* Main Content - Only show after recipe is created */}
      {isRecipeCreated ? (
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6 px-6">
          {/* Left Side - Ingredient Management */}
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
                          onChange={(e) => handleUpdateIngredient(ingredient.id, 'waste', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                          step="0.1"
                        />
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm">{ingredient.grams.toFixed(1)}</span>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRemoveIngredient(ingredient.id)}
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
                      {addedIngredients.reduce((sum, ing) => {
                        const selectedMeasure = ing.availableMeasures.find(m => m.label === ing.unit);
                        const baseGrams = selectedMeasure ? ing.quantity * selectedMeasure.weight : 0;
                        const wasteGrams = baseGrams * (ing.waste / 100);
                        return sum + wasteGrams;
                      }, 0).toFixed(1)} (waste)
                    </div>
                    <div className="col-span-1">
                      {addedIngredients.reduce((sum, ing) => sum + ing.grams, 0).toFixed(1)}
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
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search ingredients..."
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
                
                {/* Permanent Custom Ingredient Link */}
                <div className="border-t pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">Can't find an ingredient you're looking for?</p>
                    <Button
                      variant="outline"
                      onClick={handleOpenCustomIngredient}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your own ingredient
                    </Button>
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
                             <Badge variant="secondary" className="text-xs">
                               📖 Recipe
                             </Badge>
                            <Button 
                              size="sm" 
                              onClick={() => handleAddIngredient(ingredient)}
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
        </div>
        {/* Right Side - Label Preview */}
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
                  <FDANutritionLabel
                    data={nutritionData}
                    showActionButtons={true}
                    realIngredients={addedIngredients.map(ing => ({
                      name: ing.name,
                      allergens: ing.allergens
                    }))}
                    realAllergens={[...new Set(addedIngredients.flatMap(ing => ing.allergens))]}
                    recipeName={recipeName}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Package Configuration Form */}
        {isRecipeCreated && addedIngredients.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Package Configuration</CardTitle>
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
                      onChange={(e) => setLabelSetupMode('package')}
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
                      onChange={(e) => setLabelSetupMode('serving')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Label htmlFor="byServingSize" className="text-sm">By serving size</Label>
                  </div>
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
                        onChange={(e) => handleServingSizeWeightChange(Number(e.target.value))}
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
                      onChange={(e) => handleServingSizeNumberChange(Number(e.target.value))}
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
      ) : null}

        {/* Add Recipe Modal */}
        <Dialog
          open={isRecipeNameModalOpen && !isRecipeCreated}
          onOpenChange={(open) => {
            if (!isCreatingRecipe) {
              setIsRecipeNameModalOpen(open);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Recipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipe Name</label>
                <Input
                  type="text"
                  placeholder="Enter recipe name..."
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isCreatingRecipe && handleRecipeNameSubmit()}
                  disabled={isCreatingRecipe}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelRecipeCreation}
                  disabled={isCreatingRecipe}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecipeNameSubmit}
                  disabled={!recipeName.trim() || isCreatingRecipe}
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Rename Recipe Modal */}
        <Dialog open={isRenameModalOpen} onOpenChange={setIsRenameModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Recipe</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipe Name</label>
                <Input
                  type="text"
                  placeholder="Enter new recipe name..."
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit()}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelRename}>
                  Cancel
                </Button>
                <Button onClick={handleRenameSubmit} disabled={!newRecipeName.trim()}>
                  Rename
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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

        {/* Custom Ingredient Modal - Removed, now using page navigation */}

      </div>
  );
}