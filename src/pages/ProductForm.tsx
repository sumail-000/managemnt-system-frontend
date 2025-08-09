import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
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
  const { toast } = useToast();
  const { id: productId } = useParams();
  const isEditMode = Boolean(productId);
  
  // Progressive recipe state
  const [currentRecipe, setCurrentRecipe] = useState<ProgressiveRecipeData | null>(null);
  const [recipeProgress, setRecipeProgress] = useState<RecipeProgress | null>(null);
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false);
  const [isLoadingExistingRecipe, setIsLoadingExistingRecipe] = useState(false);
  
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

  // Function to transform flat allergen structure back to category-based structure
  const transformFlatToCategories = (flatAllergenData: any): AllergenData => {
    console.log('🔄 Transforming flat allergen data:', flatAllergenData);
    
    // Initialize empty category-based structure
    const categoryBasedData: AllergenData = getEmptyAllergenData();
    
    // Handle detected allergens (flat array to category-based)
    if (Array.isArray(flatAllergenData.detected)) {
      flatAllergenData.detected.forEach((allergen: any) => {
        // Try to determine category from allergen name or use a default mapping
        const category = mapAllergenToCategory(allergen.name);
        if (!categoryBasedData.detected[category]) {
          categoryBasedData.detected[category] = [];
        }
        categoryBasedData.detected[category].push({
          name: allergen.name,
          source: allergen.source || 'manual',
          confidence: allergen.confidence || 'high',
          details: allergen.details
        });
      });
    }
    
    // Handle manual allergens (flat array to category-based)
    if (Array.isArray(flatAllergenData.manual)) {
      flatAllergenData.manual.forEach((allergen: any) => {
        const category = allergen.category || mapAllergenToCategory(allergen.name);
        if (!categoryBasedData.manual[category]) {
          categoryBasedData.manual[category] = [];
        }
        categoryBasedData.manual[category].push({
          name: allergen.name || allergen.subcategory,
          source: 'manual',
          confidence: 'high'
        });
      });
    }
    
    // Preserve other properties
    categoryBasedData.statement = flatAllergenData.statement;
    categoryBasedData.displayOnLabel = flatAllergenData.displayOnLabel !== false; // Default to true
    
    console.log('✅ Transformed to category-based structure:', categoryBasedData);
    return categoryBasedData;
  };

  // Function to map allergen names to categories (English and Arabic)
  const mapAllergenToCategory = (allergenName: string): string => {
    const allergenMap: { [key: string]: string } = {
      // Dairy - English
      'milk': 'dairy',
      'cheese': 'dairy',
      'butter': 'dairy',
      'cream': 'dairy',
      'yogurt': 'dairy',
      'lactose': 'dairy',
      
      // Dairy - Arabic
      'حليب': 'dairy',
      'لبن': 'dairy',
      'جبن': 'dairy',
      'جبنة': 'dairy',
      'زبدة': 'dairy',
      'كريمة': 'dairy',
      'لبن رائب': 'dairy',
      'زبادي': 'dairy',
      'لاكتوز': 'dairy',
      
      // Eggs - English
      'eggs': 'eggs',
      'egg': 'eggs',
      
      // Eggs - Arabic
      'بيض': 'eggs',
      'بيضة': 'eggs',
      
      // Fish - English
      'fish': 'fish',
      'salmon': 'fish',
      'tuna': 'fish',
      'cod': 'fish',
      
      // Fish - Arabic
      'سمك': 'fish',
      'أسماك': 'fish',
      'سلمون': 'fish',
      'تونة': 'fish',
      'سردين': 'fish',
      
      // Shellfish - English
      'shellfish': 'shellfish',
      'shrimp': 'shellfish',
      'crab': 'shellfish',
      'lobster': 'shellfish',
      
      // Shellfish - Arabic
      'محار': 'shellfish',
      'قشريات': 'shellfish',
      'جمبري': 'shellfish',
      'روبيان': 'shellfish',
      'سرطان البحر': 'shellfish',
      'كابوريا': 'shellfish',
      'استاكوزا': 'shellfish',
      
      // Tree Nuts - English
      'tree nuts': 'tree_nuts',
      'almonds': 'tree_nuts',
      'walnuts': 'tree_nuts',
      'pecans': 'tree_nuts',
      'cashews': 'tree_nuts',
      'pistachios': 'tree_nuts',
      'hazelnuts': 'tree_nuts',
      
      // Tree Nuts - Arabic
      'مكسرات': 'tree_nuts',
      'لوز': 'tree_nuts',
      'جوز': 'tree_nuts',
      'عين الجمل': 'tree_nuts',
      'كاجو': 'tree_nuts',
      'فستق': 'tree_nuts',
      'بندق': 'tree_nuts',
      'جوز البرازيل': 'tree_nuts',
      
      // Peanuts - English
      'peanuts': 'peanuts',
      'peanut': 'peanuts',
      
      // Peanuts - Arabic
      'فول سوداني': 'peanuts',
      'فستق العبيد': 'peanuts',
      
      // Wheat - English
      'wheat': 'wheat',
      'gluten': 'wheat',
      
      // Wheat - Arabic
      'قمح': 'wheat',
      'حنطة': 'wheat',
      'جلوتين': 'wheat',
      'غلوتين': 'wheat',
      
      // Soybeans - English
      'soybeans': 'soybeans',
      'soy': 'soybeans',
      
      // Soybeans - Arabic
      'فول الصويا': 'soybeans',
      'صويا': 'soybeans',
      
      // Sesame - English
      'sesame': 'sesame',
      
      // Sesame - Arabic
      'سمسم': 'sesame',
      'طحينة': 'sesame',
      
      // Sulfites - English
      'sulfites': 'sulfites',
      'sulfur dioxide': 'sulfites',
      
      // Sulfites - Arabic
      'كبريتيت': 'sulfites',
      'ثاني أكسيد الكبريت': 'sulfites',
      
      // Mustard - English
      'mustard': 'mustard',
      
      // Mustard - Arabic
      'خردل': 'mustard'
    };
    
    const lowerName = allergenName.toLowerCase();
    
    // Check for exact matches first
    if (allergenMap[lowerName]) {
      return allergenMap[lowerName];
    }
    
    // Check for partial matches
    for (const [key, category] of Object.entries(allergenMap)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        return category;
      }
    }
    
    // Default to 'other' if no match found
    return 'other';
  };

  // Function to update ingredient statement preview
  const updateIngredientStatementPreview = React.useCallback(() => {
    if (addedIngredients.length === 0) {
      setIngredientStatementPreview('No ingredients added');
      return;
    }

    const preview = addedIngredients.map((ingredient) => {
      const customStatement = ingredientStatements[ingredient.id];
      return customStatement && customStatement.trim()
        ? customStatement.trim()
        : ingredient.name;
    }).join(', ');

    setIngredientStatementPreview(preview);
  }, [addedIngredients, ingredientStatements]);

  // Auto-update preview when dependencies change
  React.useEffect(() => {
    updateIngredientStatementPreview();
  }, [updateIngredientStatementPreview]);

  // Function to save ingredient statements to backend
  const saveIngredientStatementsToBackend = async (statements: {[key: string]: string}) => {
    if (!currentRecipe?.id) {
      console.warn('⚠️ No current recipe ID, skipping ingredient statements save');
      return;
    }
    
    setIsSavingStatements(true);
    
    try {
      console.log('🔄 Live sync: Saving ingredient statements to backend:', {
        recipeId: currentRecipe.id,
        statements,
        statementsCount: Object.keys(statements).length,
        nonEmptyStatements: Object.entries(statements).filter(([key, value]) => value && value.trim()).length
      });
      
      const response = await ProgressiveRecipeApi.saveIngredientStatements(currentRecipe.id, statements);
      
      console.log('📡 Ingredient statements API response:', response);
      
      if (response.success) {
        console.log('✅ Live sync: Ingredient statements saved successfully');
        console.log('💾 Database should now contain:', statements);
        
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
        console.error('❌ Live sync ingredient statements failed:', response);
        toast({
          title: "Sync Error",
          description: 'Live sync failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Live sync ingredient statements error:', error);
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
      console.warn('⚠️ No current recipe ID, skipping allergen save');
      return;
    }
    
    setIsSavingAllergens(true);
    
    try {
      console.log('🔄 Live sync: Saving allergen data to backend:', {
        recipeId: currentRecipe.id,
        allergenData,
        detectedCount: Object.values(allergenData.detected).flat().length,
        manualCount: Object.values(allergenData.manual).flat().length
      });
      
      const response = await ProgressiveRecipeApi.saveAllergens(currentRecipe.id, allergenData);
      
      console.log('📡 Allergen API response:', response);
      
      if (response.success) {
        console.log('✅ Live sync: Allergen data saved successfully');
        console.log('💾 Database should now contain:', allergenData);
        
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
        console.error('❌ Live sync allergen failed:', response);
        toast({
          title: "Sync Error",
          description: 'Live sync failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Live sync allergen error:', error);
      toast({
        title: "Sync Error",
        description: 'Live sync error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    } finally {
      setIsSavingAllergens(false);
    }
  };

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
    const loadExistingRecipe = async () => {
        if (isEditMode && productId) {
          try {
            setIsLoadingExistingRecipe(true);
            console.log('🔄 Loading existing recipe for editing:', productId);
            
            // Load recipe data from API
            const response = await ProgressiveRecipeApi.getRecipe(productId);
            console.log('📡 API Response:', response);
            
            if (response.success && response.data) {
              const recipeData = response.data;
              console.log('✅ Recipe data loaded:', recipeData);
              
              // Set recipe basic info
              setRecipeName(recipeData.name || '');
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
                console.log('🔄 Loading existing ingredient statements:', recipeData.ingredient_statements);
                console.log('🔍 Ingredient statements type:', typeof recipeData.ingredient_statements);
                console.log('🔍 Ingredient statements keys:', Object.keys(recipeData.ingredient_statements || {}));
                setIngredientStatements(recipeData.ingredient_statements);
              } else {
                console.log('⚠️ No ingredient statements found in recipe data');
                console.log('🔍 Available recipe data keys:', Object.keys(recipeData));
              }
              
              // Load allergen data if available
              if (recipeData.allergens_data) {
                console.log('🔄 Loading existing allergen data:', recipeData.allergens_data);
                
                // Transform flat array structure back to category-based structure
                const transformedAllergenData = transformFlatToCategories(recipeData.allergens_data);
                console.log('🔄 Transformed allergen data to categories:', transformedAllergenData);
                setAllergenData(transformedAllergenData);
              } else {
                console.log('⚠️ No allergen data found in recipe data');
                setAllergenData(getEmptyAllergenData());
              }
              
              // Load publication settings if available
              if (recipeData.status) {
                console.log('🔄 Loading existing publication status:', recipeData.status);
                setPublicationStatus(recipeData.status);
              }
              if (recipeData.is_public !== undefined) {
                console.log('🔄 Loading existing public access setting:', recipeData.is_public);
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
                
                console.log('✅ Serving configuration loaded:', servingConfig);
              }
              
              // Load existing nutrition data if available
              if (recipeData.nutrition_data) {
                console.log('🔄 Loading existing nutrition data for edit mode:', recipeData.nutrition_data);
                
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
                  
                  console.log('✅ Existing nutrition data loaded successfully');
                } else if (recipeData.nutrition_data.macronutrients) {
                  // Handle case where we have nutrition data but no per_serving_data
                  // This can happen if the recipe was created before per_serving_data was added
                  console.log('🔄 Loading legacy nutrition data format');
                  
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
                  
                  console.log('✅ Legacy nutrition data loaded successfully');
                }
                
                // Set total grams from last analysis to enable local recalculation
                if (recipeData.nutrition_data.total_weight) {
                  setTotalGramsAtLastAnalysis(recipeData.nutrition_data.total_weight);
                }
                
                // Calculate nutrition proportions for ingredients if we have both ingredients and nutrition data
                if (recipeData.ingredients_data && Array.isArray(recipeData.ingredients_data) && rawNutritionFromDB) {
                  console.log('🔄 Calculating nutrition proportions for loaded ingredients');
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
                  console.log('✅ Nutrition proportions calculated for edit mode ingredients');
                }
                
                // CRITICAL FIX: Trigger per-serving recalculation after loading nutrition data
                // This ensures that per-serving nutrition is displayed correctly in edit mode
                setTimeout(() => {
                  if (rawNutritionFromDB && perServingData) {
                    console.log('🔄 Triggering per-serving recalculation after nutrition data load');
                    
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
                    
                    console.log('✅ Per-serving nutrition recalculated successfully after data load');
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
      const recalculatedNutrition = recalculateNutritionLocally(addedIngredients);
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
        analyzeNutrition();
      } else {
        // All ingredients are custom - calculate nutrition from their existing data
        console.log('🔄 All ingredients are custom, calculating nutrition from existing data');
        calculateNutritionFromCustomIngredients();
      }
    } else {
      // Can recalculate locally - do it now to ensure nutrition is displayed
      console.log('🔄 Recalculating nutrition locally');
      const recalculatedNutrition = recalculateNutritionLocally(addedIngredients);
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
      
      // Extract allergen data from API response
      const extractedAllergens = extractAllergenData(response.data);
      setAllergenData(extractedAllergens);
      console.log('Allergens extracted:', extractedAllergens);
      
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
      
      // Calculate per-serving nutrition data
      const perServingNutrition = calculatePerServingNutrition(extractedData, defaultServings);
      setPerServingData(perServingNutrition);
      
      // Map to FDA format for display
      const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
      setNutritionData(mappedData);
      
      console.log('✅ Per-serving nutrition calculated and set:', {
        perServingNutrition,
        mappedData
      });
      
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

  // Function to calculate nutrition from custom ingredients only
  const calculateNutritionFromCustomIngredients = async () => {
    if (addedIngredients.length === 0) {
      initializeEmptyNutrition();
      return;
    }

    // Check if all ingredients are custom and have nutrition data
    const allCustomWithNutrition = addedIngredients.every(ing =>
      ing.id.startsWith('custom-') && ing.nutritionProportion
    );

    if (!allCustomWithNutrition) {
      console.log('⚠️ Not all ingredients are custom with nutrition data, falling back to API');
      analyzeNutrition();
      return;
    }

    console.log('🔄 Calculating nutrition from custom ingredients only');

    try {
      // Calculate total nutrition from custom ingredients
      const totalGrams = addedIngredients.reduce((sum, ing) => sum + ing.grams, 0);
      const totalCalories = addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calories || 0), 0);

      // Create nutrition data structure from custom ingredients
      const customNutritionData: NutritionData = {
        yield: 1,
        calories: totalCalories,
        totalWeight: totalGrams,
        totalNutrients: {
          // Macronutrients
          FAT: {
            label: 'Total lipid (fat)',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalFat || 0), 0),
            unit: 'g'
          },
          FASAT: {
            label: 'Fatty acids, total saturated',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.saturatedFat || 0), 0),
            unit: 'g'
          },
          FATRN: {
            label: 'Fatty acids, total trans',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.transFat || 0), 0),
            unit: 'g'
          },
          FAMS: {
            label: 'Fatty acids, total monounsaturated',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.monounsaturatedFat || 0), 0),
            unit: 'g'
          },
          FAPU: {
            label: 'Fatty acids, total polyunsaturated',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.polyunsaturatedFat || 0), 0),
            unit: 'g'
          },
          CHOCDF: {
            label: 'Carbohydrate, by difference',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalCarbohydrate || 0), 0),
            unit: 'g'
          },
          FIBTG: {
            label: 'Fiber, total dietary',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.dietaryFiber || 0), 0),
            unit: 'g'
          },
          SUGAR: {
            label: 'Sugars, total',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalSugars || 0), 0),
            unit: 'g'
          },
          PROCNT: {
            label: 'Protein',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.protein || 0), 0),
            unit: 'g'
          },
          CHOLE: {
            label: 'Cholesterol',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.cholesterol || 0), 0),
            unit: 'mg'
          },
          NA: {
            label: 'Sodium, Na',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.sodium || 0), 0),
            unit: 'mg'
          },
          
          // Vitamins & Minerals
          VITA_RAE: {
            label: 'Vitamin A, RAE',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminA || 0), 0),
            unit: 'µg'
          },
          VITC: {
            label: 'Vitamin C, total ascorbic acid',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminC || 0), 0),
            unit: 'mg'
          },
          VITD: {
            label: 'Vitamin D (D2 + D3)',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminD || 0), 0),
            unit: 'µg'
          },
          TOCPHA: {
            label: 'Vitamin E (alpha-tocopherol)',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminE || 0), 0),
            unit: 'mg'
          },
          VITK1: {
            label: 'Vitamin K (phylloquinone)',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminK || 0), 0),
            unit: 'µg'
          },
          THIA: {
            label: 'Thiamin',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.thiamin || 0), 0),
            unit: 'mg'
          },
          RIBF: {
            label: 'Riboflavin',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.riboflavin || 0), 0),
            unit: 'mg'
          },
          NIA: {
            label: 'Niacin',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.niacin || 0), 0),
            unit: 'mg'
          },
          VITB6A: {
            label: 'Vitamin B-6',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminB6 || 0), 0),
            unit: 'mg'
          },
          FOLDFE: {
            label: 'Folate, DFE',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.folate || 0), 0),
            unit: 'µg'
          },
          VITB12: {
            label: 'Vitamin B-12',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminB12 || 0), 0),
            unit: 'µg'
          },
          PANTAC: {
            label: 'Pantothenic acid',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.pantothenicAcid || 0), 0),
            unit: 'mg'
          },
          
          CA: {
            label: 'Calcium, Ca',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calcium || 0), 0),
            unit: 'mg'
          },
          FE: {
            label: 'Iron, Fe',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.iron || 0), 0),
            unit: 'mg'
          },
          K: {
            label: 'Potassium, K',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.potassium || 0), 0),
            unit: 'mg'
          },
          P: {
            label: 'Phosphorus, P',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.phosphorus || 0), 0),
            unit: 'mg'
          },
          MG: {
            label: 'Magnesium, Mg',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.magnesium || 0), 0),
            unit: 'mg'
          },
          ZN: {
            label: 'Zinc, Zn',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.zinc || 0), 0),
            unit: 'mg'
          },
          SE: {
            label: 'Selenium, Se',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.selenium || 0), 0),
            unit: 'µg'
          },
          CU: {
            label: 'Copper, Cu',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.copper || 0), 0),
            unit: 'mg'
          },
          MN: {
            label: 'Manganese, Mn',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.manganese || 0), 0),
            unit: 'mg'
          }
        },
        totalDaily: {
          FAT: {
            label: 'Total lipid (fat)',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalFatDV || 0), 0),
            unit: '%'
          },
          FASAT: {
            label: 'Fatty acids, total saturated',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.saturatedFatDV || 0), 0),
            unit: '%'
          },
          CHOCDF: {
            label: 'Carbohydrate, by difference',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.totalCarbohydrateDV || 0), 0),
            unit: '%'
          },
          FIBTG: {
            label: 'Fiber, total dietary',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.dietaryFiberDV || 0), 0),
            unit: '%'
          },
          PROCNT: {
            label: 'Protein',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.proteinDV || 0), 0),
            unit: '%'
          },
          CHOLE: {
            label: 'Cholesterol',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.cholesterolDV || 0), 0),
            unit: '%'
          },
          NA: {
            label: 'Sodium, Na',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.sodiumDV || 0), 0),
            unit: '%'
          },
          CA: {
            label: 'Calcium, Ca',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.calciumDV || 0), 0),
            unit: '%'
          },
          MG: {
            label: 'Magnesium, Mg',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.magnesium || 0), 0) / 400 * 100,
            unit: '%'
          },
          K: {
            label: 'Potassium, K',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.potassiumDV || 0), 0),
            unit: '%'
          },
          FE: {
            label: 'Iron, Fe',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.ironDV || 0), 0),
            unit: '%'
          },
          VITD: {
            label: 'Vitamin D',
            quantity: addedIngredients.reduce((sum, ing) => sum + (ing.nutritionProportion?.vitaminDDV || 0), 0),
            unit: '%'
          }
        }
      };

      // Set the calculated nutrition data
      setRawNutritionData(customNutritionData);
      setTotalGramsAtLastAnalysis(totalGrams);

      // Set default servings and calculate per-serving nutrition
      const defaultServings = 1;
      setServingsPerContainer(defaultServings);
      
      // Calculate default per-serving weight
      const defaultServingWeight = Math.round(totalGrams / 1);
      setServingSizeWeight(defaultServingWeight);
      
      // Calculate per-serving nutrition data
      const perServingNutrition = calculatePerServingNutrition(customNutritionData, defaultServings);
      setPerServingData(perServingNutrition);
      
      // Map to FDA format for display
      const mappedData = mapPerServingDataToFDAFormat(perServingNutrition);
      setNutritionData(mappedData);
      
      console.log('✅ Custom ingredient per-serving nutrition calculated and set:', {
        perServingNutrition,
        mappedData
      });
      
      // Save nutrition data to backend progressively
      if (currentRecipe?.id) {
        await saveNutritionToBackend(customNutritionData, defaultServings);
      }

      console.log('✅ Custom ingredient nutrition calculated successfully');
      
    } catch (error: any) {
      console.error('❌ Error calculating custom ingredient nutrition:', error);
      setNutritionError('Failed to calculate nutrition from custom ingredients');
      initializeEmptyNutrition();
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
        toast({
          title: "Sync Error",
          description: 'Live sync nutrition failed: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Live sync nutrition error:', error);
      toast({
        title: "Sync Error",
        description: 'Live sync nutrition error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
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
    if (!hasAllProportions) {
      console.log('🔄 Cannot recalculate locally: Missing nutrition proportions for some ingredients');
      return null; // Cannot recalculate locally, need API call
    }

    const currentTotalGrams = ingredients.reduce((sum, ing) => sum + ing.grams, 0);
    if (currentTotalGrams === 0) {
      console.log('🔄 Cannot recalculate locally: Total grams is 0');
      return null;
    }

    console.log('🔄 Recalculating nutrition locally for', ingredients.length, 'ingredients');

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

    console.log('✅ Local nutrition recalculation completed successfully');
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
          grams: Number(baseGrams),
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
    
    // Handle empty ingredients array - clear database data
    if (ingredients.length === 0) {
      console.log('🔄 All ingredients removed, clearing database data...');
      await clearAllIngredientsFromBackend();
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
      
      // Check if response has success property (wrapped format) or expected data structure (unwrapped format)
      const isSuccess = response?.success === true ||
                       (response && (response.product || response.total_weight !== undefined || response.ingredients_count !== undefined));
      
      if (isSuccess) {
        console.log('✅ Live sync: Processed ingredients saved successfully');
        
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse?.success) {
            console.log('📊 Live progress update:', progressResponse.data.progress);
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('❌ Live sync progress error:', progressError);
        }
      } else {
        console.error('❌ Live sync failed:', response);
        toast({
          title: "Sync Error",
          description: 'Live sync failed: ' + (response?.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Live sync error:', error);
      toast({
        title: "Sync Error",
        description: 'Live sync error: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
    }
  };

  // Function to clear all ingredients and nutrition data from backend
  const clearAllIngredientsFromBackend = async () => {
    if (!currentRecipe?.id) {
      console.warn('⚠️ No current recipe ID, skipping clear operation');
      return;
    }

    try {
      console.log('🔄 Clearing all ingredients and nutrition data from backend...');
      
      // Use the new API method to clear all ingredients and nutrition data
      const response = await ProgressiveRecipeApi.clearAllIngredients(currentRecipe.id);
      
      if (response.success) {
        console.log('✅ Successfully cleared all ingredients and nutrition data from backend');
        
        // Update the current recipe data
        setCurrentRecipe(prev => prev ? { ...prev, ...response.data } : null);
        
        // Update progress in real-time
        try {
          const progressResponse = await ProgressiveRecipeApi.getProgress(currentRecipe.id);
          if (progressResponse.success) {
            console.log('📊 Progress updated after clearing data:', progressResponse.data.progress);
            setRecipeProgress(progressResponse.data.progress);
          }
        } catch (progressError) {
          console.error('❌ Error updating progress after clear:', progressError);
        }
        
        toast({
          title: "✅ Ingredients Cleared",
          description: "All ingredients and nutrition data have been removed from the database.",
        });
      } else {
        console.error('❌ Failed to clear backend data:', response);
        toast({
          title: "Clear Error",
          description: 'Failed to clear ingredients from database: ' + (response.message || 'Unknown error'),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Error clearing backend data:', error);
      toast({
        title: "Clear Error",
        description: 'Failed to clear ingredients from database: ' + (error.message || 'Network error'),
        variant: "destructive"
      });
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
        console.log('🔄 Live sync: Ingredient removed, syncing changes to backend...');
        saveIngredientsToBackend(updated);
      }
      
      return updated;
    });
  };
  
  const handleUpdateIngredient = (id: string, field: keyof AddedIngredient, value: any) => {
    setAddedIngredients(prev => {
      const updated = prev.map(ingredient => {
        if (ingredient.id === id) {
          const updatedIngredient = { ...ingredient, [field]: field === 'waste' || field === 'quantity' ? Number(value) || 0 : value };
          
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
              updatedIngredient.grams = Number(Math.round((baseGrams * (1 - wastePercentage)) * 10) / 10);
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

  // Handle publication settings change
  const handlePublicationSettingsChange = async (status: 'draft' | 'published', isPublicFlag: boolean) => {
    setPublicationStatus(status);
    setIsPublic(isPublicFlag);
    
    // If recipe is already created, update it immediately
    if (currentRecipe?.id) {
      try {
        console.log('🔄 Updating publication settings:', { status, is_public: isPublicFlag });
        
        const response = await ProgressiveRecipeApi.updateRecipe(currentRecipe.id, {
          status: status,
          is_public: isPublicFlag
        });
        
        if (response.success) {
          console.log('✅ Publication settings updated successfully');
          setCurrentRecipe(prev => prev ? {
            ...prev,
            status: status,
            is_public: isPublicFlag
          } : null);
          
          toast({
            title: "Settings Updated",
            description: `Recipe ${status === 'published' ? 'published' : 'saved as draft'} ${isPublicFlag ? 'and made public' : 'as private'}.`,
          });
        }
      } catch (error: any) {
        console.error('❌ Error updating publication settings:', error);
        toast({
          title: "Update Error",
          description: 'Failed to update publication settings: ' + error.message,
          variant: "destructive"
        });
      }
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
            console.error('Edamam search error:', error);
            setSearchError('Failed to search Edamam database. Please try again.');
            setSearchResults([]);
            setTotalResults(0);
            setTotalPages(0);
            setIsSearching(false);
          }
        };
        
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
      // If in edit mode, just update the recipe name and close modal
      if (isEditMode && currentRecipe) {
        try {
          setIsCreatingRecipe(true);
          console.log('🔄 Updating recipe name:', recipeName.trim());
          
          const response = await ProgressiveRecipeApi.updateRecipe(currentRecipe.id!, {
            name: recipeName.trim()
          });
          
          if (response.success) {
            setCurrentRecipe(prev => prev ? { ...prev, name: recipeName.trim() } : null);
            setIsRecipeNameModalOpen(false);
            console.log('✅ Recipe name updated successfully');
          } else {
            throw new Error(response.message || 'Failed to update recipe name');
          }
        } catch (error: any) {
          console.error('❌ Error updating recipe name:', error);
          toast({
            title: "Update Error",
            description: 'Failed to update recipe name: ' + (error.message || 'Unknown error'),
            variant: "destructive"
          });
        } finally {
          setIsCreatingRecipe(false);
        }
        return;
      }

      // Create new recipe (existing logic)
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
          const errorMessage = ('error' in responseData ? responseData.error : null) ||
                              ('message' in responseData ? responseData.message : null) ||
                              'Failed to create recipe';
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('❌ Error creating recipe:', error);
        toast({
          title: "Creation Error",
          description: 'Failed to create recipe: ' + (error.message || 'Unknown error'),
          variant: "destructive"
        });
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
        grams: Number(ingredientData.servingSize),
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

      // Create a custom ingredient object that matches AddedIngredient interface
      const customIngredient: AddedIngredient = {
        id: `custom-${Date.now()}`,
        name: customIngredientData.name,
        quantity: 1,
        unit: customIngredientData.serving_unit || 'g',
        waste: 0.0,
        grams: Number(customIngredientData.serving_size) || 100,
        availableMeasures: [
          {
            uri: `custom-measure-${customIngredientData.serving_unit || 'g'}`,
            label: customIngredientData.serving_unit || 'g',
            weight: customIngredientData.serving_size || 100
          }
        ],
        allergens: customIngredientData.allergens?.contains || [],
        // Add nutrition proportion based on custom ingredient data
        nutritionProportion: {
          calories: customIngredientData.nutrition?.calories || 0,
          // Macronutrients
          totalFat: customIngredientData.nutrition?.fat || 0,
          saturatedFat: customIngredientData.nutrition?.saturated_fat || 0,
          transFat: customIngredientData.nutrition?.trans_fat || 0,
          monounsaturatedFat: 0, // Not available in custom ingredient form
          polyunsaturatedFat: 0, // Not available in custom ingredient form
          cholesterol: customIngredientData.nutrition?.cholesterol || 0,
          sodium: customIngredientData.nutrition?.sodium || 0,
          totalCarbohydrate: customIngredientData.nutrition?.carbohydrates || 0,
          dietaryFiber: customIngredientData.nutrition?.fiber || 0,
          totalSugars: customIngredientData.nutrition?.sugars || 0,
          addedSugars: customIngredientData.nutrition?.added_sugars || 0,
          sugarAlcohol: 0, // Not available in custom ingredient form
          protein: customIngredientData.nutrition?.protein || 0,
          
          // Comprehensive Vitamins - Use custom ingredient data or default to 0
          vitaminA: customIngredientData.nutrition?.vitamin_a || 0,
          vitaminC: customIngredientData.nutrition?.vitamin_c || 0,
          vitaminD: customIngredientData.nutrition?.vitamin_d || 0,
          vitaminE: 0, // Not available in custom ingredient form
          vitaminK: 0, // Not available in custom ingredient form
          thiamin: customIngredientData.nutrition?.thiamine || 0, // Note: thiamine with 'e'
          riboflavin: customIngredientData.nutrition?.riboflavin || 0,
          niacin: customIngredientData.nutrition?.niacin || 0,
          vitaminB6: customIngredientData.nutrition?.vitamin_b6 || 0,
          folate: customIngredientData.nutrition?.folate || 0,
          vitaminB12: customIngredientData.nutrition?.vitamin_b12 || 0,
          pantothenicAcid: customIngredientData.nutrition?.pantothenic_acid || 0,
          
          // Comprehensive Minerals - Use custom ingredient data or default to 0
          calcium: customIngredientData.nutrition?.calcium || 0,
          iron: customIngredientData.nutrition?.iron || 0,
          potassium: customIngredientData.nutrition?.potassium || 0,
          phosphorus: customIngredientData.nutrition?.phosphorus || 0,
          magnesium: customIngredientData.nutrition?.magnesium || 0,
          zinc: customIngredientData.nutrition?.zinc || 0,
          selenium: customIngredientData.nutrition?.selenium || 0,
          copper: customIngredientData.nutrition?.copper || 0,
          manganese: customIngredientData.nutrition?.manganese || 0,
          
          // Daily values - calculate based on standard daily values
          totalFatDV: ((customIngredientData.nutrition?.fat || 0) / 65) * 100,
          saturatedFatDV: ((customIngredientData.nutrition?.saturated_fat || 0) / 20) * 100,
          monounsaturatedFatDV: 0, // No DV established for monounsaturated fats
          polyunsaturatedFatDV: 0, // No DV established for polyunsaturated fats
          cholesterolDV: ((customIngredientData.nutrition?.cholesterol || 0) / 300) * 100,
          sodiumDV: ((customIngredientData.nutrition?.sodium || 0) / 2300) * 100,
          totalCarbohydrateDV: ((customIngredientData.nutrition?.carbohydrates || 0) / 300) * 100,
          dietaryFiberDV: ((customIngredientData.nutrition?.fiber || 0) / 25) * 100,
          addedSugarsDV: ((customIngredientData.nutrition?.added_sugars || 0) / 50) * 100,
          sugarAlcoholDV: 0, // No DV established for sugar alcohols
          proteinDV: ((customIngredientData.nutrition?.protein || 0) / 50) * 100,
          vitaminDDV: ((customIngredientData.nutrition?.vitamin_d || 0) / 20) * 100,
          calciumDV: ((customIngredientData.nutrition?.calcium || 0) / 1000) * 100,
          ironDV: ((customIngredientData.nutrition?.iron || 0) / 18) * 100,
          potassiumDV: ((customIngredientData.nutrition?.potassium || 0) / 3500) * 100
        }
      };

      // Add the custom ingredient to the recipe
      setAddedIngredients(prev => {
        const updated = [...prev, customIngredient];
        
        // Step 2: Save ingredients to backend progressively
        if (currentRecipe?.id) {
          saveIngredientsToBackend(updated);
        }
        
        return updated;
      });
      
      // Add to tracking set
      setAddedIngredientNames(prev => {
        const newSet = new Set(prev);
        newSet.add(ingredientKey);
        return newSet;
      });
      
      console.log('✅ Custom ingredient added successfully:', customIngredient);
      
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
    
    setIsExtractingImageUrl(true);
    setImageUrlError(null);
    
    try {
      const response = await ProgressiveRecipeApi.extractImageUrl(productImageUrl.trim());
      if (response.success) {
        // Set the processed image URL for preview (this was missing!)
        setProductImageUrl(response.data.image_url);
        
        // Image URL is valid, save it immediately
        await saveProductDetailsToBackend({
          image_url: response.data.image_url
        });
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
      console.log('🔄 Complex URL detected, processing automatically...');
      
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
      console.log('🔄 Auto-processing URL:', url);
      const response = await ProgressiveRecipeApi.extractImageUrl(url.trim());
      if (response.success) {
        console.log('✅ URL processed successfully:', response.data.image_url);
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
        console.error('❌ Auto-processing failed:', response.message);
        setImageUrlError(response.message || 'Failed to process URL automatically');
        toast({
          title: "Auto-Processing Failed",
          description: response.message || 'Failed to process URL automatically. Try the "Re-process" button.',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Auto URL processing failed:', error);
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
    console.log('🔄 Category change requested:', categoryId);
    const numericCategoryId = categoryId === 'none' ? null : parseInt(categoryId);
    setSelectedCategoryId(numericCategoryId);
    console.log('✅ Category ID set to:', numericCategoryId);
    
    // Save category selection immediately
    await saveProductDetailsToBackend({
      category_id: numericCategoryId
    });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || isCreatingCategory) return;
    
    setIsCreatingCategory(true);
    try {
      console.log('🔄 Creating category with name:', newCategoryName.trim());
      const response = await ProgressiveRecipeApi.createCategory(newCategoryName.trim());
      
      console.log('📡 Category creation response:', response);
      
      // Check if response has success property (wrapped format) or is direct data
      let categoryData;
      if (response.success && response.data) {
        // Wrapped format: {success: true, data: {...}}
        categoryData = response.data;
      } else if ((response as any).id && (response as any).name) {
        // Direct format: {id: 5, name: 'category', ...}
        categoryData = response as any;
      } else {
        console.error('❌ Invalid response format:', response);
        toast({
          title: "Creation Error",
          description: "Failed to create category: Invalid response format",
          variant: "destructive"
        });
        return;
      }
      
      console.log('✅ Category created successfully:', categoryData);
      
      // Add new category to list
      setCategories(prev => {
        const updated = [...prev, categoryData];
        console.log('📋 Updated categories list:', updated);
        return updated;
      });
      
      // Select the new category automatically
      setSelectedCategoryId(categoryData.id);
      console.log('🎯 Selected category ID:', categoryData.id);
      
      // Save the new category selection
      await saveProductDetailsToBackend({
        category_id: categoryData.id
      });
      
      // Reset form and close modal - IMPORTANT: Do this after all state updates
      setNewCategoryName('');
      setShowCreateCategory(false);
      
      console.log('🎉 Category creation process completed successfully');
    } catch (error: any) {
      console.error('❌ Error creating category:', error);
      
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
                <Button variant="outline" size="sm" onClick={handleRename} className="flex items-center gap-2">
                  🏷️ Rename...
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  🏷️ Add Tags...
                </Button>
              </div>
              <div className="text-sm text-blue-600">
                {isSavingImage ? '💾 Saving Image...' :
                 isSavingAllergens ? '🛡️ Saving Allergens...' :
                 isSavingStatements ? '💾 Saving Statements...' :
                 recipeProgress?.current_step === 'completed' ? '✅ Recipe Complete' :
                 'In Progress...'}
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
                    addedIngredients.length > 0 || recipeProgress.steps_completed.ingredients_added ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 2: Ingredients */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      addedIngredients.length > 0 || recipeProgress.steps_completed.ingredients_added
                        ? 'bg-green-500 text-white'
                        : recipeProgress.current_step === 'ingredients_added'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {addedIngredients.length > 0 || recipeProgress.steps_completed.ingredients_added ? '✓' : '2'}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Ingredients</span>
                  </div>

                  <div className={`flex-1 h-1 ${
                    nutritionData && !isLoadingNutrition || recipeProgress.steps_completed.nutrition_analyzed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 3: Nutrition */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      nutritionData && !isLoadingNutrition || recipeProgress.steps_completed.nutrition_analyzed
                        ? 'bg-green-500 text-white'
                        : isLoadingNutrition
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {nutritionData && !isLoadingNutrition || recipeProgress.steps_completed.nutrition_analyzed ? '✓' : isLoadingNutrition ? '⏳' : '3'}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">Nutrition</span>
                  </div>

                  <div className={`flex-1 h-1 ${
                    recipeProgress.steps_completed.serving_configured || (nutritionData && addedIngredients.length > 0) ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>

                  {/* Step 4: Serving */}
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      recipeProgress.steps_completed.serving_configured || (nutritionData && addedIngredients.length > 0)
                        ? 'bg-green-500 text-white'
                        : recipeProgress.current_step === 'serving_configured'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {recipeProgress.steps_completed.serving_configured || (nutritionData && addedIngredients.length > 0) ? '✓' : '4'}
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
                  {addedIngredients.length === 0 && (
                    <span>👆 Next: Add ingredients to your recipe</span>
                  )}
                  {addedIngredients.length > 0 && isLoadingNutrition && (
                    <span>⚗️ Analyzing nutrition data...</span>
                  )}
                  {addedIngredients.length > 0 && nutritionData && !isLoadingNutrition && !recipeProgress.steps_completed.completed && (
                    <span>✅ Ready to complete! Use the Publication tab to finalize your recipe.</span>
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
                  { id: 'product-details', label: 'Product Details' },
                  { id: 'ingredient-statement', label: 'Ingredient Statement' },
                  { id: 'allergens', label: 'Allergens' },
                  { id: 'publication', label: 'Publication' },
                  { id: 'label', label: 'Label' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'label') {
                        // Navigate to the nutrition label page with current data
                        navigate('/nutrition-label', {
                          state: {
                            nutritionData: nutritionData,
                            ingredients: addedIngredients.map(ing => ({
                              name: ing.name,
                              allergens: ing.allergens
                            })),
                            allergenData: allergenData,
                            recipeName: recipeName
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
            
            {/* Product Details Tab */}
            {activeTab === 'product-details' && (
              <div className="space-y-6">
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
                          onChange={(e) => handleImageUrlChange(e.target.value)}
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
                        onChange={handleImageFileUpload}
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
                        onValueChange={handleCategoryChange}
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
                        onClick={() => setShowCreateCategory(true)}
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

            {/* Recipe Tab (Ingredient Management) */}
            {activeTab === 'recipe' && (
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
                        <span className="text-sm">{(Number(ingredient.grams) || 0).toFixed(1)}</span>
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
                                    const newStatements = {
                                      ...ingredientStatements,
                                      [ingredient.id]: e.target.value
                                    };
                                    setIngredientStatements(newStatements);
                                    
                                    // Debounced auto-save to backend
                                    if (currentRecipe?.id) {
                                      if (ingredientStatementSaveTimeoutRef.current) {
                                        clearTimeout(ingredientStatementSaveTimeoutRef.current);
                                      }
                                      ingredientStatementSaveTimeoutRef.current = setTimeout(() => {
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
                        {currentRecipe?.status === 'published' && (
                          <Badge variant="default" className="bg-green-500">
                            Published
                          </Badge>
                        )}
                        {currentRecipe?.is_public && (
                          <Badge variant="outline" className="border-blue-500 text-blue-700">
                            Public
                          </Badge>
                        )}
                      </div>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Choose how you want to publish your recipe and nutrition label.
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
                        <div className="flex items-center justify-between pt-4 border-t">
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
                          
                          <Button
                            onClick={() => completeRecipe({ status: publicationStatus, is_public: isPublic })}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {publicationStatus === 'published' ? (
                              <>
                                🚀 Publish Recipe
                              </>
                            ) : (
                              <>
                                💾 Save as Draft
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          {/* Right Side - Label Preview - Only show for Recipe and Label tabs */}
          {(activeTab === 'recipe' || activeTab === 'label') && (
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
                          allergens: ing.allergens,
                          customStatement: ingredientStatements[ing.id]
                        }))}
                        realAllergens={[...new Set(addedIngredients.flatMap(ing => ing.allergens))]}
                        allergenData={allergenData}
                        recipeName={recipeName}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

      {/* Custom Ingredient Modal - Removed, now using page navigation */}

    </div>
  );
}
