import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FDANutritionLabel } from '@/components/previewlabel/FDANutritionLabel';
import { edamamDirectApi, EdamamSearchResult } from '@/services/edamamDirectApi';
import { foodParserApi, ParseIngredientResponse } from '@/services/foodParserApi';
import { NutritionApi } from '@/services/nutritionApi';
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
    totalFat: number;
    saturatedFat: number;
    transFat: number;
    cholesterol: number;
    sodium: number;
    totalCarbohydrate: number;
    dietaryFiber: number;
    totalSugars: number;
    addedSugars: number;
    protein: number;
    vitaminD: number;
    calcium: number;
    iron: number;
    potassium: number;
    // Daily values (percentages)
    totalFatDV: number;
    saturatedFatDV: number;
    cholesterolDV: number;
    sodiumDV: number;
    totalCarbohydrateDV: number;
    dietaryFiberDV: number;
    proteinDV: number;
    vitaminDDV: number;
    calciumDV: number;
    ironDV: number;
    potassiumDV: number;
  };
}

export default function ProductForm() {
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
      
    } catch (error: any) {
      setNutritionError(error.message || 'Failed to analyze nutrition');
      // Fallback to empty nutrition data
      initializeEmptyNutrition();
    } finally {
      setIsLoadingNutrition(false);
    }
  };
  
  // Function to calculate nutrition proportions for each ingredient
  const calculateNutritionProportions = (ingredients: AddedIngredient[], totalNutrition: NutritionData) => {
    const totalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
    if (totalGrams === 0) return ingredients;

    return ingredients.map(ingredient => {
      const proportion = ingredient.grams / totalGrams;
      return {
        ...ingredient,
        nutritionProportion: {
          calories: totalNutrition.calories * proportion,
          totalFat: totalNutrition.totalNutrients.FAT.quantity * proportion,
          saturatedFat: totalNutrition.totalNutrients.FASAT.quantity * proportion,
          transFat: totalNutrition.totalNutrients.FATRN.quantity * proportion,
          cholesterol: totalNutrition.totalNutrients.CHOLE.quantity * proportion,
          sodium: totalNutrition.totalNutrients.NA.quantity * proportion,
          totalCarbohydrate: totalNutrition.totalNutrients.CHOCDF.quantity * proportion,
          dietaryFiber: totalNutrition.totalNutrients.FIBTG.quantity * proportion,
          totalSugars: totalNutrition.totalNutrients.SUGAR.quantity * proportion,
          addedSugars: 0, // Not available in current structure
          protein: totalNutrition.totalNutrients.PROCNT.quantity * proportion,
          vitaminD: totalNutrition.totalNutrients.VITD.quantity * proportion,
          calcium: totalNutrition.totalNutrients.CA.quantity * proportion,
          iron: totalNutrition.totalNutrients.FE.quantity * proportion,
          potassium: totalNutrition.totalNutrients.K.quantity * proportion,
          // Daily values (percentages)
          totalFatDV: totalNutrition.totalDaily.FAT.quantity * proportion,
          saturatedFatDV: totalNutrition.totalDaily.FASAT.quantity * proportion,
          cholesterolDV: totalNutrition.totalDaily.CHOLE.quantity * proportion,
          sodiumDV: totalNutrition.totalDaily.NA.quantity * proportion,
          totalCarbohydrateDV: totalNutrition.totalDaily.CHOCDF.quantity * proportion,
          dietaryFiberDV: totalNutrition.totalDaily.FIBTG.quantity * proportion,
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
        FAT: { label: 'Total lipid (fat)', quantity: 0, unit: 'g' },
        FASAT: { label: 'Fatty acids, total saturated', quantity: 0, unit: 'g' },
        FATRN: { label: 'Fatty acids, total trans', quantity: 0, unit: 'g' },
        CHOCDF: { label: 'Carbohydrate, by difference', quantity: 0, unit: 'g' },
        FIBTG: { label: 'Fiber, total dietary', quantity: 0, unit: 'g' },
        SUGAR: { label: 'Sugars, total', quantity: 0, unit: 'g' },
        PROCNT: { label: 'Protein', quantity: 0, unit: 'g' },
        CHOLE: { label: 'Cholesterol', quantity: 0, unit: 'mg' },
        NA: { label: 'Sodium, Na', quantity: 0, unit: 'mg' },
        CA: { label: 'Calcium, Ca', quantity: 0, unit: 'mg' },
        MG: { label: 'Magnesium, Mg', quantity: 0, unit: 'mg' },
        K: { label: 'Potassium, K', quantity: 0, unit: 'mg' },
        FE: { label: 'Iron, Fe', quantity: 0, unit: 'mg' },
        VITD: { label: 'Vitamin D', quantity: 0, unit: 'µg' }
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
        recalculatedNutrition.totalNutrients.FAT.quantity += ingredient.nutritionProportion.totalFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.FASAT.quantity += ingredient.nutritionProportion.saturatedFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.FATRN.quantity += ingredient.nutritionProportion.transFat * ingredientScaling;
        recalculatedNutrition.totalNutrients.CHOLE.quantity += ingredient.nutritionProportion.cholesterol * ingredientScaling;
        recalculatedNutrition.totalNutrients.NA.quantity += ingredient.nutritionProportion.sodium * ingredientScaling;
        recalculatedNutrition.totalNutrients.CHOCDF.quantity += ingredient.nutritionProportion.totalCarbohydrate * ingredientScaling;
        recalculatedNutrition.totalNutrients.FIBTG.quantity += ingredient.nutritionProportion.dietaryFiber * ingredientScaling;
        recalculatedNutrition.totalNutrients.SUGAR.quantity += ingredient.nutritionProportion.totalSugars * ingredientScaling;
        recalculatedNutrition.totalNutrients.PROCNT.quantity += ingredient.nutritionProportion.protein * ingredientScaling;
        recalculatedNutrition.totalNutrients.VITD.quantity += ingredient.nutritionProportion.vitaminD * ingredientScaling;
        recalculatedNutrition.totalNutrients.CA.quantity += ingredient.nutritionProportion.calcium * ingredientScaling;
        recalculatedNutrition.totalNutrients.FE.quantity += ingredient.nutritionProportion.iron * ingredientScaling;
        recalculatedNutrition.totalNutrients.K.quantity += ingredient.nutritionProportion.potassium * ingredientScaling;
        
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
        } else {
  
        }
      } else {
  
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
        

        setAddedIngredients(prev => {
          const updated = [...prev, newIngredient];

          return updated;
        });
        
      } else {
        console.error('❌ No parsed data available in response');
      }
      
    } catch (error) {
      console.error('💥 Error adding ingredient:', error);
      // No fallback - just log the error
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

  const handleRecipeNameSubmit = () => {
    if (recipeName.trim()) {
      setIsRecipeNameModalOpen(false);
      setIsRecipeCreated(true);
      // Here you would typically create a new recipe with the given name
    }
  };

  const handleCancelRecipeCreation = () => {
    setIsRecipeNameModalOpen(false);
    setRecipeName('');
    // Optionally redirect back or show a different state
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

  return (
      <div className="container mx-auto py-4 px-3">
        {/* Step-by-step Wizard Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              {isRecipeCreated && recipeName ? recipeName : 'New Recipe'}
            </h1>
            <Button variant="outline" size="sm" onClick={handleRename}>
               🏷️ Rename...
             </Button>
          </div>
          <div className="text-sm text-gray-500">
            Updated less than a minute ago
          </div>
        
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
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
                  <FDANutritionLabel data={nutritionData} />
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
                        onChange={(e) => setNetWeightPerPackage(Number(e.target.value))}
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
                      onChange={(e) => setServingsPerPackage(Number(e.target.value))}
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
      ) : (
        !isRecipeNameModalOpen && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">No Recipe Created</h2>
              <p className="text-gray-500 mb-4">Please create a recipe to get started.</p>
              <Button onClick={() => setIsRecipeNameModalOpen(true)}>
                Create New Recipe
              </Button>
            </div>
          </div>
        )
      )}

        {/* Add Recipe Modal */}
        <Dialog open={isRecipeNameModalOpen} onOpenChange={setIsRecipeNameModalOpen}>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleRecipeNameSubmit()}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelRecipeCreation}>
                  Cancel
                </Button>
                <Button onClick={handleRecipeNameSubmit} disabled={!recipeName.trim()}>
                  Create Recipe
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


      </div>
    </div>
  )};