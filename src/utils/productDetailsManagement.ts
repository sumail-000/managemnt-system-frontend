/**
 * Utility functions for managing product details and form data
 */

export interface ProductDetails {
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  servingSize: number;
  servingUnit: string;
  servingsPerContainer: number;
  netWeight: number;
  netWeightUnit: string;
  barcode?: string;
  sku?: string;
  price?: number;
  currency?: string;
  countryOfOrigin?: string;
  manufacturer?: string;
  distributedBy?: string;
  storageInstructions?: string;
  preparationInstructions?: string;
  shelfLife?: number;
  shelfLifeUnit?: string;
}

export interface ProductImage {
  id?: string;
  file?: File;
  url?: string;
  type: 'main' | 'nutrition_label' | 'ingredients' | 'additional';
  caption?: string;
  isDefault?: boolean;
}

/**
 * Get empty product details object
 */
export const getEmptyProductDetails = (): ProductDetails => ({
  name: '',
  brand: '',
  category: '',
  subcategory: '',
  description: '',
  servingSize: 1,
  servingUnit: 'serving',
  servingsPerContainer: 1,
  netWeight: 0,
  netWeightUnit: 'g',
  barcode: '',
  sku: '',
  price: 0,
  currency: 'USD',
  countryOfOrigin: '',
  manufacturer: '',
  distributedBy: '',
  storageInstructions: '',
  preparationInstructions: '',
  shelfLife: 0,
  shelfLifeUnit: 'months'
});

/**
 * Validate product details
 */
export const validateProductDetails = (details: ProductDetails): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields
  if (!details.name?.trim()) {
    errors.push('Product name is required');
  }
  
  if (!details.brand?.trim()) {
    errors.push('Brand is required');
  }
  
  if (!details.category?.trim()) {
    errors.push('Category is required');
  }
  
  // Numeric validations
  if (details.servingSize <= 0) {
    errors.push('Serving size must be greater than 0');
  }
  
  if (details.servingsPerContainer <= 0) {
    errors.push('Servings per container must be greater than 0');
  }
  
  if (details.netWeight <= 0) {
    errors.push('Net weight must be greater than 0');
  }
  
  // Optional numeric fields validation
  if (details.price !== undefined && details.price < 0) {
    errors.push('Price cannot be negative');
  }
  
  if (details.shelfLife !== undefined && details.shelfLife < 0) {
    errors.push('Shelf life cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate total weight from serving information
 */
export const calculateTotalWeight = (details: ProductDetails): number => {
  return details.servingSize * details.servingsPerContainer;
};

/**
 * Calculate serving weight in grams
 */
export const calculateServingWeightInGrams = (servingSize: number, servingUnit: string): number => {
  const unitConversions: { [key: string]: number } = {
    'g': 1,
    'gram': 1,
    'grams': 1,
    'kg': 1000,
    'kilogram': 1000,
    'kilograms': 1000,
    'oz': 28.35,
    'ounce': 28.35,
    'ounces': 28.35,
    'lb': 453.59,
    'pound': 453.59,
    'pounds': 453.59,
    'ml': 1, // Assuming 1ml = 1g for liquids
    'milliliter': 1,
    'milliliters': 1,
    'l': 1000,
    'liter': 1000,
    'liters': 1000,
    'cup': 240,
    'cups': 240,
    'tbsp': 15,
    'tablespoon': 15,
    'tablespoons': 15,
    'tsp': 5,
    'teaspoon': 5,
    'teaspoons': 5,
    'serving': 100, // Default serving weight
    'servings': 100,
    'piece': 50, // Default piece weight
    'pieces': 50,
    'slice': 30, // Default slice weight
    'slices': 30
  };
  
  const multiplier = unitConversions[servingUnit.toLowerCase()] || 100;
  return servingSize * multiplier;
};

/**
 * Format weight with appropriate unit
 */
export const formatWeight = (weight: number, unit: string): string => {
  if (weight === 0) return '0';
  
  // Convert to appropriate unit for display
  if (unit === 'g' && weight >= 1000) {
    return `${(weight / 1000).toFixed(1)} kg`;
  }
  
  if (unit === 'ml' && weight >= 1000) {
    return `${(weight / 1000).toFixed(1)} L`;
  }
  
  return `${weight} ${unit}`;
};

/**
 * Generate product SKU if not provided
 */
export const generateSKU = (details: ProductDetails): string => {
  if (details.sku?.trim()) {
    return details.sku.trim();
  }
  
  // Generate SKU from brand and product name
  const brandCode = details.brand.substring(0, 3).toUpperCase();
  const nameCode = details.name.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  
  return `${brandCode}${nameCode}${timestamp}`;
};

/**
 * Validate barcode format
 */
export const validateBarcode = (barcode: string): boolean => {
  if (!barcode) return true; // Optional field
  
  // Remove any spaces or dashes
  const cleanBarcode = barcode.replace(/[\s-]/g, '');
  
  // Check common barcode formats
  const formats = [
    /^\d{8}$/, // EAN-8
    /^\d{12}$/, // UPC-A
    /^\d{13}$/, // EAN-13
    /^\d{14}$/, // ITF-14
  ];
  
  return formats.some(format => format.test(cleanBarcode));
};

/**
 * Format barcode for display
 */
export const formatBarcode = (barcode: string): string => {
  if (!barcode) return '';
  
  const cleanBarcode = barcode.replace(/[\s-]/g, '');
  
  // Format based on length
  switch (cleanBarcode.length) {
    case 8: // EAN-8
      return cleanBarcode.replace(/(\d{4})(\d{4})/, '$1-$2');
    case 12: // UPC-A
      return cleanBarcode.replace(/(\d{1})(\d{5})(\d{5})(\d{1})/, '$1-$2-$3-$4');
    case 13: // EAN-13
      return cleanBarcode.replace(/(\d{1})(\d{6})(\d{6})/, '$1-$2-$3');
    case 14: // ITF-14
      return cleanBarcode.replace(/(\d{2})(\d{6})(\d{6})/, '$1-$2-$3');
    default:
      return cleanBarcode;
  }
};

/**
 * Get serving unit options
 */
export const getServingUnitOptions = (): Array<{ value: string; label: string }> => [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (L)' },
  { value: 'cup', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons' },
  { value: 'tsp', label: 'Teaspoons' },
  { value: 'serving', label: 'Serving' },
  { value: 'piece', label: 'Piece' },
  { value: 'slice', label: 'Slice' }
];

/**
 * Get shelf life unit options
 */
export const getShelfLifeUnitOptions = (): Array<{ value: string; label: string }> => [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' }
];

/**
 * Convert shelf life to days
 */
export const convertShelfLifeToDays = (shelfLife: number, unit: string): number => {
  const conversions: { [key: string]: number } = {
    'days': 1,
    'weeks': 7,
    'months': 30,
    'years': 365
  };
  
  return shelfLife * (conversions[unit] || 1);
};

/**
 * Check if product details have changed
 */
export const hasProductDetailsChanged = (current: ProductDetails, original: ProductDetails): boolean => {
  const keys = Object.keys(current) as Array<keyof ProductDetails>;
  
  return keys.some(key => {
    const currentValue = current[key];
    const originalValue = original[key];
    
    // Handle undefined/null/empty string comparisons
    if (!currentValue && !originalValue) return false;
    if (!currentValue || !originalValue) return true;
    
    return currentValue !== originalValue;
  });
};

/**
 * Sanitize product details for API submission
 */
export const sanitizeProductDetails = (details: ProductDetails): ProductDetails => {
  const sanitized = { ...details };
  
  // Trim string fields
  const stringFields: Array<keyof ProductDetails> = [
    'name', 'brand', 'category', 'subcategory', 'description',
    'servingUnit', 'netWeightUnit', 'barcode', 'sku', 'currency',
    'countryOfOrigin', 'manufacturer', 'distributedBy',
    'storageInstructions', 'preparationInstructions', 'shelfLifeUnit'
  ];
  
  stringFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      (sanitized as any)[field] = (sanitized[field] as string).trim();
    }
  });
  
  // Ensure numeric fields are numbers
  const numericFields: Array<keyof ProductDetails> = [
    'servingSize', 'servingsPerContainer', 'netWeight', 'price', 'shelfLife'
  ];
  
  numericFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      const value = Number(sanitized[field]);
      if (!isNaN(value)) {
        (sanitized as any)[field] = value;
      }
    }
  });
  
  return sanitized;
};

/**
 * Get product completion percentage
 */
export const getProductCompletionPercentage = (details: ProductDetails): number => {
  const requiredFields = ['name', 'brand', 'category'];
  const optionalFields = [
    'subcategory', 'description', 'barcode', 'sku', 'price',
    'countryOfOrigin', 'manufacturer', 'storageInstructions'
  ];
  
  let completedFields = 0;
  const totalFields = requiredFields.length + optionalFields.length;
  
  // Check required fields (weighted more heavily)
  requiredFields.forEach(field => {
    if (details[field as keyof ProductDetails]) {
      completedFields += 2; // Required fields count double
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    if (details[field as keyof ProductDetails]) {
      completedFields += 1;
    }
  });
  
  const maxScore = requiredFields.length * 2 + optionalFields.length;
  return Math.round((completedFields / maxScore) * 100);
};