import { getEmptyAllergenData, AllergenData } from '@/utils/nutritionDataMapper';
import { AddedIngredient } from '@/utils/nutritionCalculations';

// Import the correct mapAllergenToCategory function from nutritionDataMapper
// This function uses the correct category IDs that match ALLERGEN_CATEGORIES
const mapAllergenToCategoryCorrect = (allergenName: string): string | null => {
  const lowerName = allergenName.toLowerCase();
  
  // Use the same ALLERGEN_CATEGORIES from nutritionDataMapper
  const ALLERGEN_CATEGORIES = [
    { id: 'milk', name: 'Milk & Dairy', subcategories: ['Cow Milk', 'Goat Milk', 'Sheep Milk', 'Cheese', 'Butter', 'Cream', 'Yogurt', 'Lactose'] },
    { id: 'eggs', name: 'Eggs', subcategories: ['Chicken Eggs', 'Duck Eggs', 'Quail Eggs', 'Egg Whites', 'Egg Yolks'] },
    { id: 'fish', name: 'Fish', subcategories: ['Salmon', 'Tuna', 'Cod', 'Mackerel', 'Sardines', 'Anchovies', 'Other Fish'] },
    { id: 'shellfish', name: 'Shellfish', subcategories: ['Crustaceans', 'Shrimp', 'Crab', 'Lobster', 'Mollusks', 'Oysters', 'Mussels', 'Clams', 'Scallops'] },
    { id: 'tree_nuts', name: 'Tree Nuts', subcategories: ['Almonds', 'Walnuts', 'Cashews', 'Pistachios', 'Pecans', 'Hazelnuts', 'Brazil Nuts', 'Macadamia Nuts', 'Pine Nuts'] },
    { id: 'peanuts', name: 'Peanuts', subcategories: ['Peanuts', 'Peanut Oil', 'Peanut Butter', 'Peanut Flour'] },
    { id: 'wheat', name: 'Wheat & Gluten', subcategories: ['Wheat', 'Gluten', 'Barley', 'Rye', 'Oats (may contain gluten)', 'Spelt', 'Kamut'] },
    { id: 'soy', name: 'Soy', subcategories: ['Soybeans', 'Soy Sauce', 'Tofu', 'Tempeh', 'Soy Oil', 'Soy Lecithin'] },
    { id: 'sesame', name: 'Sesame', subcategories: ['Sesame Seeds', 'Sesame Oil', 'Tahini'] },
    { id: 'sulfites', name: 'Sulfites', subcategories: ['Sulfur Dioxide', 'Sodium Sulfite', 'Potassium Sulfite'] },
    { id: 'other', name: 'Other Allergens', subcategories: ['Celery', 'Mustard', 'Lupine', 'Alcohol', 'MSG', 'Artificial Colors', 'Artificial Flavors'] }
  ];
  
  for (const category of ALLERGEN_CATEGORIES) {
    // Check if allergen name matches category name or subcategories
    if (category.name.toLowerCase().includes(lowerName) ||
        category.subcategories.some(sub => sub.toLowerCase().includes(lowerName))) {
      return category.id;
    }
  }
  
  return 'other'; // Default to other category
};

/**
 * DEPRECATED: This function uses incorrect category names that don't match ALLERGEN_CATEGORIES
 * Use mapAllergenToCategoryCorrect instead or the function from nutritionDataMapper.ts
 *
 * Function to map allergen names to categories (English and Arabic)
 * @deprecated Use the correct mapping function from nutritionDataMapper.ts
 */
export const mapAllergenToCategory_DEPRECATED = (allergenName: string): string => {
  console.warn('⚠️ DEPRECATED: mapAllergenToCategory uses incorrect category names. Use nutritionDataMapper.ts version instead.');
  
  const allergenMap: { [key: string]: string } = {
    // Dairy - English (WRONG: should be 'milk' not 'dairy')
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
    
    // Wheat - English (WRONG: should be 'wheat' but maps to 'wheat' - this one is actually correct)
    'wheat': 'wheat',
    'gluten': 'wheat',
    
    // Wheat - Arabic
    'قمح': 'wheat',
    'حنطة': 'wheat',
    'جلوتين': 'wheat',
    'غلوتين': 'wheat',
    
    // Soybeans - English (WRONG: should be 'soy' not 'soybeans')
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
    
    // Mustard - English (WRONG: should be in 'other' category)
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

/**
 * Transform flat allergen structure back to category-based structure
 */
export const transformFlatToCategories = (flatAllergenData: any): AllergenData => {
  // Initialize empty category-based structure
  const categoryBasedData: AllergenData = getEmptyAllergenData();
  
  // Handle detected allergens (flat array to category-based)
  if (Array.isArray(flatAllergenData.detected)) {
    flatAllergenData.detected.forEach((allergen: any) => {
      // Try to determine category from allergen name or use the correct mapping
      const category = mapAllergenToCategoryCorrect(allergen.name) || 'other';
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
      const category = allergen.category || mapAllergenToCategoryCorrect(allergen.name) || 'other';
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
  
  return categoryBasedData;
};

/**
 * Extract unique allergens from ingredients
 */
export const extractAllergensFromIngredients = (ingredients: AddedIngredient[]): string[] => {
  const allergenSet = new Set<string>();
  
  ingredients.forEach(ingredient => {
    if (ingredient.allergens && Array.isArray(ingredient.allergens)) {
      ingredient.allergens.forEach(allergen => {
        if (allergen && typeof allergen === 'string') {
          allergenSet.add(allergen.trim());
        }
      });
    }
  });
  
  return Array.from(allergenSet).sort();
};

/**
 * Generate allergen statement from allergen data
 */
export const generateAllergenStatement = (allergenData: AllergenData): string => {
  const allAllergens: string[] = [];
  
  // Collect detected allergens
  Object.values(allergenData.detected).forEach(categoryAllergens => {
    if (Array.isArray(categoryAllergens)) {
      categoryAllergens.forEach(allergen => {
        if (allergen.name && !allAllergens.includes(allergen.name)) {
          allAllergens.push(allergen.name);
        }
      });
    }
  });
  
  // Collect manual allergens
  Object.values(allergenData.manual).forEach(categoryAllergens => {
    if (Array.isArray(categoryAllergens)) {
      categoryAllergens.forEach(allergen => {
        if (allergen.name && !allAllergens.includes(allergen.name)) {
          allAllergens.push(allergen.name);
        }
      });
    }
  });
  
  if (allAllergens.length === 0) {
    return '';
  }
  
  // Sort allergens alphabetically
  allAllergens.sort();
  
  // Generate statement
  if (allAllergens.length === 1) {
    return `Contains: ${allAllergens[0]}.`;
  } else if (allAllergens.length === 2) {
    return `Contains: ${allAllergens[0]} and ${allAllergens[1]}.`;
  } else {
    const lastAllergen = allAllergens.pop();
    return `Contains: ${allAllergens.join(', ')}, and ${lastAllergen}.`;
  }
};

/**
 * Check if allergen data has any allergens
 */
export const hasAllergens = (allergenData: AllergenData): boolean => {
  // Check detected allergens
  const hasDetected = Object.values(allergenData.detected).some(categoryAllergens => 
    Array.isArray(categoryAllergens) && categoryAllergens.length > 0
  );
  
  // Check manual allergens
  const hasManual = Object.values(allergenData.manual).some(categoryAllergens => 
    Array.isArray(categoryAllergens) && categoryAllergens.length > 0
  );
  
  return hasDetected || hasManual;
};

/**
 * Get all allergen categories that have allergens
 */
export const getActiveAllergenCategories = (allergenData: AllergenData): string[] => {
  const activeCategories = new Set<string>();
  
  // Check detected allergens
  Object.entries(allergenData.detected).forEach(([category, allergens]) => {
    if (Array.isArray(allergens) && allergens.length > 0) {
      activeCategories.add(category);
    }
  });
  
  // Check manual allergens
  Object.entries(allergenData.manual).forEach(([category, allergens]) => {
    if (Array.isArray(allergens) && allergens.length > 0) {
      activeCategories.add(category);
    }
  });
  
  return Array.from(activeCategories).sort();
};

/**
 * Count total number of allergens
 */
export const countTotalAllergens = (allergenData: AllergenData): number => {
  let count = 0;
  
  // Count detected allergens
  Object.values(allergenData.detected).forEach(categoryAllergens => {
    if (Array.isArray(categoryAllergens)) {
      count += categoryAllergens.length;
    }
  });
  
  // Count manual allergens
  Object.values(allergenData.manual).forEach(categoryAllergens => {
    if (Array.isArray(categoryAllergens)) {
      count += categoryAllergens.length;
    }
  });
  
  return count;
};

/**
 * Merge allergen data from multiple sources
 */
export const mergeAllergenData = (primary: AllergenData, secondary: AllergenData): AllergenData => {
  const merged: AllergenData = {
    detected: { ...primary.detected },
    manual: { ...primary.manual },
    statement: primary.statement || secondary.statement || '',
    displayOnLabel: primary.displayOnLabel !== false || secondary.displayOnLabel !== false
  };
  
  // Merge detected allergens
  Object.entries(secondary.detected).forEach(([category, allergens]) => {
    if (Array.isArray(allergens) && allergens.length > 0) {
      if (!merged.detected[category]) {
        merged.detected[category] = [];
      }
      
      // Add allergens that don't already exist
      allergens.forEach(allergen => {
        const exists = merged.detected[category].some(existing => 
          existing.name === allergen.name
        );
        if (!exists) {
          merged.detected[category].push(allergen);
        }
      });
    }
  });
  
  // Merge manual allergens
  Object.entries(secondary.manual).forEach(([category, allergens]) => {
    if (Array.isArray(allergens) && allergens.length > 0) {
      if (!merged.manual[category]) {
        merged.manual[category] = [];
      }
      
      // Add allergens that don't already exist
      allergens.forEach(allergen => {
        const exists = merged.manual[category].some(existing => 
          existing.name === allergen.name
        );
        if (!exists) {
          merged.manual[category].push(allergen);
        }
      });
    }
  });
  
  return merged;
};

/**
 * Validate allergen data structure
 */
export const validateAllergenData = (allergenData: any): boolean => {
  if (!allergenData || typeof allergenData !== 'object') {
    return false;
  }
  
  // Check required properties
  if (!allergenData.detected || typeof allergenData.detected !== 'object') {
    return false;
  }
  
  if (!allergenData.manual || typeof allergenData.manual !== 'object') {
    return false;
  }
  
  // Check that detected and manual are properly structured
  const checkAllergenStructure = (allergens: any) => {
    return Object.values(allergens).every(categoryAllergens => 
      Array.isArray(categoryAllergens) && 
      categoryAllergens.every(allergen => 
        allergen && 
        typeof allergen === 'object' && 
        typeof allergen.name === 'string'
      )
    );
  };
  
  return checkAllergenStructure(allergenData.detected) && 
         checkAllergenStructure(allergenData.manual);
};