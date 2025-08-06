// Simple utility to extract ingredients from recipe API responses

export interface SimpleIngredient {
  name: string;
  source: 'recipe';
}

export interface RecipeApiResponse {
  hits?: Array<{
    recipe: {
      ingredientLines?: string[];
    };
  }>;
  success?: boolean;
}



/**
 * Extract ingredients from recipe response using only ingredientLines
 */
export function extractIngredientsFromRecipes(
  recipeResponse: RecipeApiResponse,
  searchTerm: string
): SimpleIngredient[] {
  
  if (!recipeResponse.hits) {
    return [];
  }

  const ingredients: SimpleIngredient[] = [];
  const seenIngredients = new Set<string>();

  // Extract from all recipes
  recipeResponse.hits.forEach((hit, index) => {
    
    if (hit.recipe.ingredientLines) {
      hit.recipe.ingredientLines.forEach(line => {
        const cleanedLine = cleanIngredientLine(line);
        
        // Only include if contains search term and not already seen
        if (containsSearchTerm(cleanedLine, searchTerm) && !seenIngredients.has(cleanedLine.toLowerCase())) {
          seenIngredients.add(cleanedLine.toLowerCase());
          ingredients.push({
            name: cleanedLine,
            source: 'recipe'
          });
        }
      });
    }
  });

  return ingredients;
}

/**
 * Clean ingredient line by removing extra spaces and trimming
 */
function cleanIngredientLine(line: string): string {
  return line.trim().replace(/\s+/g, ' ');
}

/**
 * Check if ingredient line contains the search term
 */
function containsSearchTerm(ingredient: string, searchTerm: string): boolean {
  return ingredient.toLowerCase().includes(searchTerm.toLowerCase());
}

/**
 * Process recipe search results to extract ingredients
 */
export function processRecipeSearchResults(
  recipeResponse: RecipeApiResponse,
  searchTerm: string
): SimpleIngredient[] {
  const results: SimpleIngredient[] = [];
  const seenIngredients = new Set<string>();

  // Add recipe ingredients
  const recipeIngredients = extractIngredientsFromRecipes(recipeResponse, searchTerm);
  recipeIngredients.forEach(ingredient => {
    if (!seenIngredients.has(ingredient.name.toLowerCase())) {
      seenIngredients.add(ingredient.name.toLowerCase());
      results.push(ingredient);
    }
  });

  // Shuffle results for better UX
  return shuffleArray(results);
}

/**
 * Shuffle array randomly
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Main function to process search results from recipe API only
 */
export function processSearchResults(
  recipeSuccess: boolean,
  recipeResponse: RecipeApiResponse,
  searchTerm: string
): SimpleIngredient[] {
  try {
    
    const results: SimpleIngredient[] = [];

    // Add recipe results if successful
    if (recipeSuccess && recipeResponse.hits) {
      const recipeIngredients = extractIngredientsFromRecipes(recipeResponse, searchTerm);
      results.push(...recipeIngredients);
    }

    
    // Shuffle the results
    const shuffledResults = shuffleArray(results);
    
    return shuffledResults;
  } catch (error) {
    console.error('Error processing search results:', error);
    return [];
  }
}