import { edamamDirectApi } from '@/services/edamamDirectApi';
import { processSearchResults, SimpleIngredient } from './recipeIngredientExtractor';

interface FoodDatabaseHint {
  food: {
    foodId: string;
    label: string;
    knownAs: string;
    nutrients: any;
    category: string;
    categoryLabel: string;
    image?: string;
    brand?: string;
  };
  measures: any[];
}

interface FoodDatabaseResponse {
  success: boolean;
  query: string;
  data: {
    text: string;
    count: number;
    parsed: FoodDatabaseHint[];
    hints: FoodDatabaseHint[];
  };
}

/**
 * Extracts unique food labels from food database response
 * Filters out duplicates and search term matches
 */
export function extractUniqueFoodLabels(
  foodDatabaseResponse: FoodDatabaseResponse,
  searchTerm: string
): string[] {
  if (!foodDatabaseResponse.success || !foodDatabaseResponse.data || !foodDatabaseResponse.data.hints) {
    console.log('Food database response validation failed:', {
      success: foodDatabaseResponse.success,
      hasData: !!foodDatabaseResponse.data,
      hasHints: !!(foodDatabaseResponse.data && foodDatabaseResponse.data.hints)
    });
    return [];
  }

  const allHints = foodDatabaseResponse.data.hints || [];
  const labels = new Set<string>();
  const searchTermLower = searchTerm.toLowerCase().trim();
  const maxLabels = 2; // Limit to 2 labels to prevent excessive API calls

  for (const hint of allHints) {
    if (labels.size >= maxLabels) break;
    
    if (hint.food && hint.food.label) {
      const label = hint.food.label.trim();
      const labelLower = label.toLowerCase();
      
      // Filter conditions:
      // 1. Not empty
      // 2. Not exactly matching search term (allow partial matches for variety)
      // 3. Not already in set (duplicates)
      // 4. Skip very generic labels that are just the search term
      if (label && 
          labelLower !== searchTermLower && 
          label.length > searchTerm.length) {
        labels.add(label);
      }
    }
  }
  
  console.log('Label extraction debug:', {
    totalHints: allHints.length,
    searchTerm: searchTerm,
    maxLabels: maxLabels,
    sampleLabels: allHints.slice(0, 5).map(h => h.food?.label).filter(Boolean),
    extractedCount: labels.size,
    limitReached: labels.size >= maxLabels
  });

  return Array.from(labels);
}

/**
 * Utility function to add delay between API calls
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Performs parallel recipe searches for multiple food labels with rate limiting
 * Returns combined and processed ingredient results
 */
export async function performParallelRecipeSearches(
  foodLabels: string[],
  originalSearchTerm: string
): Promise<SimpleIngredient[]> {
  if (foodLabels.length === 0) {
    return [];
  }

  // Limit to maximum 3 API calls as requested
  const limitedLabels = foodLabels.slice(0, 3);
  console.log(`Starting batched recipe searches for ${limitedLabels.length} labels (limited to 3 max):`, limitedLabels);

  try {
    // Process searches in batches to avoid overwhelming the backend
    const batchSize = 3; // Process 3 searches at a time
    const delayBetweenBatches = 1000; // 1 second delay between batches
    const searchResults: any[] = [];

    for (let i = 0; i < limitedLabels.length; i += batchSize) {
      const batch = limitedLabels.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(limitedLabels.length / batchSize)}:`, batch);

      // Create parallel API calls for current batch
      const batchPromises = batch.map(async (label) => {
        try {
          const response = await edamamDirectApi.searchRecipes(label);
          return {
            label,
            response,
            success: true
          };
        } catch (error) {
          console.error(`Recipe search failed for label "${label}":`, error);
          return {
            label,
            response: null,
            success: false
          };
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      searchResults.push(...batchResults);

      // Add delay between batches (except for the last batch)
      if (i + batchSize < limitedLabels.length) {
        await delay(delayBetweenBatches);
      }
    }
    
    // Process successful results
    const allIngredients: SimpleIngredient[] = [];
    
    searchResults.forEach(({ label, response, success }) => {
      if (success && response) {
        console.log(`Processing recipe results for "${label}":`, response.hits?.length || 0, 'recipes');
        
        // Process each recipe search result using existing utility
        const ingredients = processSearchResults(
          response.success,
          response,
          originalSearchTerm
        );
        
        // Add ingredients to combined results
        allIngredients.push(...ingredients);
      }
    });

    // Remove duplicates based on ingredient name
    const uniqueIngredients = removeDuplicateIngredients(allIngredients);
    
    console.log(`Enhanced search completed: ${allIngredients.length} total ingredients, ${uniqueIngredients.length} unique`);
    
    return uniqueIngredients;
    
  } catch (error) {
    console.error('Error in parallel recipe searches:', error);
    return [];
  }
}

/**
 * Removes duplicate ingredients based on name (case-insensitive)
 */
function removeDuplicateIngredients(ingredients: SimpleIngredient[]): SimpleIngredient[] {
  const seen = new Set<string>();
  const unique: SimpleIngredient[] = [];
  
  ingredients.forEach(ingredient => {
    const nameLower = ingredient.name.toLowerCase().trim();
    if (!seen.has(nameLower)) {
      seen.add(nameLower);
      unique.push(ingredient);
    }
  });
  
  return unique;
}

/**
 * Progressive callback interface for real-time search updates
 */
export interface ProgressiveSearchCallback {
  onOriginalResults: (results: SimpleIngredient[]) => void;
  onEnhancedBatch: (newResults: SimpleIngredient[], totalEnhanced: number) => void;
  onComplete: (finalResults: {
    originalResults: SimpleIngredient[];
    enhancedResults: SimpleIngredient[];
    combinedResults: SimpleIngredient[];
    totalResults: number;
  }) => void;
  onError: (error: any) => void;
}

/**
 * Progressive enhanced search that emits results as they become available
 */
export async function performProgressiveEnhancedSearch(
  searchTerm: string,
  callback: ProgressiveSearchCallback
): Promise<void> {
  console.log(`Starting progressive enhanced search for: "${searchTerm}"`);
  
  try {
    // Start both API calls simultaneously
    const recipesPromise = edamamDirectApi.searchRecipes(searchTerm.trim());
    const foodDatabasePromise = edamamDirectApi.searchFoodDatabase(searchTerm.trim());
    
    // Wait for original recipe results first and emit immediately
    const recipesResponse = await recipesPromise;
    const originalResults = processSearchResults(
      recipesResponse.success,
      recipesResponse,
      searchTerm.trim()
    );
    
    console.log(`Original results ready: ${originalResults.length} ingredients`);
    callback.onOriginalResults(originalResults);
    
    // Wait for food database response
    const foodDatabaseResponse = await foodDatabasePromise;
    
    console.log('Food database response structure:', {
      success: foodDatabaseResponse.success,
      hasData: !!foodDatabaseResponse.data,
      hintsLength: foodDatabaseResponse.data?.hints?.length || 0,
      parsedLength: foodDatabaseResponse.data?.parsed?.length || 0
    });
    
    // Extract unique food labels from food database
    const foodLabels = extractUniqueFoodLabels(foodDatabaseResponse, searchTerm);
    console.log(`Extracted ${foodLabels.length} unique food labels for enhanced search`);
    
    if (foodLabels.length === 0) {
      // No enhanced results to process, complete with original results only
      callback.onComplete({
        originalResults,
        enhancedResults: [],
        combinedResults: originalResults,
        totalResults: originalResults.length
      });
      return;
    }
    
    // Perform progressive parallel recipe searches
    await performProgressiveParallelRecipeSearches(
      foodLabels,
      searchTerm,
      originalResults,
      callback
    );
    
  } catch (error) {
    console.error('Progressive enhanced search error:', error);
    callback.onError(error);
  }
}

/**
 * Progressive parallel recipe searches that emit results as batches complete
 */
async function performProgressiveParallelRecipeSearches(
  foodLabels: string[],
  originalSearchTerm: string,
  originalResults: SimpleIngredient[],
  callback: ProgressiveSearchCallback
): Promise<void> {
  // Limit to maximum 3 API calls as requested
  const limitedLabels = foodLabels.slice(0, 3);
  console.log(`Starting progressive batched recipe searches for ${limitedLabels.length} labels (limited to 3 max)`);
  
  const batchSize = 3;
  const delayBetweenBatches = 1000;
  const allEnhancedResults: SimpleIngredient[] = [];
  
  for (let i = 0; i < limitedLabels.length; i += batchSize) {
    const batch = limitedLabels.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(limitedLabels.length / batchSize);
    
    console.log(`Processing batch ${batchNumber}/${totalBatches}:`, batch);
    
    try {
      // Create parallel API calls for current batch
      const batchPromises = batch.map(async (label) => {
        try {
          const response = await edamamDirectApi.searchRecipes(label);
          return {
            label,
            response,
            success: true
          };
        } catch (error) {
          console.error(`Recipe search failed for label "${label}":`, error);
          return {
            label,
            response: null,
            success: false
          };
        }
      });
      
      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Process successful results from this batch
      const batchIngredients: SimpleIngredient[] = [];
      
      batchResults.forEach(({ label, response, success }) => {
        if (success && response) {
          console.log(`Processing recipe results for "${label}":`, response.hits?.length || 0, 'recipes');
          
          const ingredients = processSearchResults(
            response.success,
            response,
            originalSearchTerm
          );
          
          batchIngredients.push(...ingredients);
        }
      });
      
      // Add to total enhanced results
      allEnhancedResults.push(...batchIngredients);
      
      // Remove duplicates from new batch results only
      const uniqueBatchResults = removeDuplicateIngredients(batchIngredients);
      
      console.log(`Batch ${batchNumber} completed: ${batchIngredients.length} ingredients, ${uniqueBatchResults.length} unique`);
      
      // Emit batch results immediately
      if (uniqueBatchResults.length > 0) {
        callback.onEnhancedBatch(uniqueBatchResults, allEnhancedResults.length);
      }
      
      // Add delay between batches (except for the last batch)
      if (i + batchSize < limitedLabels.length) {
        await delay(delayBetweenBatches);
      }
      
    } catch (error) {
      console.error(`Error processing batch ${batchNumber}:`, error);
      // Continue with next batch even if this one fails
    }
  }
  
  // Final processing and completion
  const uniqueEnhancedResults = removeDuplicateIngredients(allEnhancedResults);
  const allResults = [...originalResults, ...uniqueEnhancedResults];
  const combinedResults = removeDuplicateIngredients(allResults);
  
  console.log('Progressive enhanced search completed:', {
    original: originalResults.length,
    enhanced: uniqueEnhancedResults.length,
    combined: combinedResults.length,
    total: allResults.length
  });
  
  callback.onComplete({
    originalResults,
    enhancedResults: uniqueEnhancedResults,
    combinedResults,
    totalResults: combinedResults.length
  });
}

/**
 * Main enhanced search function that combines original recipe search 
 * with food database enhanced searches (legacy version for backward compatibility)
 */
export async function performEnhancedSearch(
  searchTerm: string
): Promise<{
  originalResults: SimpleIngredient[];
  enhancedResults: SimpleIngredient[];
  combinedResults: SimpleIngredient[];
  totalResults: number;
}> {
  console.log(`Starting enhanced search for: "${searchTerm}"`);
  
  try {
    // Make simultaneous API calls (original approach)
    const [recipesResponse, foodDatabaseResponse] = await Promise.all([
      edamamDirectApi.searchRecipes(searchTerm.trim()),
      edamamDirectApi.searchFoodDatabase(searchTerm.trim())
    ]);
    
    console.log('API responses received:', {
      recipes: recipesResponse.hits?.length || 0,
      foodDatabase: foodDatabaseResponse.data?.hints?.length || 0
    });
    
    // Process original recipe results
    const originalResults = processSearchResults(
      recipesResponse.success,
      recipesResponse,
      searchTerm.trim()
    );
    
    // Debug: Log the actual food database response structure
    console.log('Food database response structure:', {
      success: foodDatabaseResponse.success,
      hasData: !!foodDatabaseResponse.data,
      dataKeys: foodDatabaseResponse.data ? Object.keys(foodDatabaseResponse.data) : [],
      hintsLength: foodDatabaseResponse.data?.hints?.length || 0,
      parsedLength: foodDatabaseResponse.data?.parsed?.length || 0,
      sampleHint: foodDatabaseResponse.data?.hints?.[0]
    });
    
    // Extract unique food labels from food database
    const foodLabels = extractUniqueFoodLabels(foodDatabaseResponse, searchTerm);
    console.log(`Extracted ${foodLabels.length} unique food labels for enhanced search`);
    if (foodLabels.length > 0) {
      console.log('Sample extracted labels:', foodLabels.slice(0, 5));
    }
    
    // Perform parallel recipe searches for food labels
    const enhancedResults = await performParallelRecipeSearches(foodLabels, searchTerm);
    
    // Combine and deduplicate all results
    const allResults = [...originalResults, ...enhancedResults];
    const combinedResults = removeDuplicateIngredients(allResults);
    
    console.log('Enhanced search summary:', {
      original: originalResults.length,
      enhanced: enhancedResults.length,
      combined: combinedResults.length,
      total: allResults.length
    });
    
    return {
      originalResults,
      enhancedResults,
      combinedResults,
      totalResults: combinedResults.length
    };
    
  } catch (error) {
    console.error('Enhanced search error:', error);
    throw error;
  }
}