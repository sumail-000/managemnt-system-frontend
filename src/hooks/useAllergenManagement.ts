import { useState, useCallback, useEffect } from 'react';
import { AllergenData, getEmptyAllergenData } from '@/utils/nutritionDataMapper';
import { 
  transformFlatToCategories, 
  extractAllergensFromIngredients,
  generateAllergenStatement,
  hasAllergens,
  getActiveAllergenCategories,
  countTotalAllergens,
  validateAllergenData
} from '@/utils/allergenManagement';
import { AddedIngredient } from '@/utils/nutritionCalculations';

interface UseAllergenManagementProps {
  initialAllergenData?: AllergenData;
  ingredients?: AddedIngredient[];
  onAllergenDataChange?: (allergenData: AllergenData) => void;
}

interface UseAllergenManagementReturn {
  // State
  allergenData: AllergenData;
  isLoadingAllergens: boolean;
  allergenError: string | null;
  
  // Computed values
  allergenStatement: string;
  hasAnyAllergens: boolean;
  activeCategories: string[];
  totalAllergenCount: number;
  
  // Actions
  updateAllergenData: (newData: AllergenData) => void;
  addManualAllergen: (category: string, allergenName: string) => void;
  removeManualAllergen: (category: string, allergenName: string) => void;
  addDetectedAllergen: (category: string, allergen: any) => void;
  removeDetectedAllergen: (category: string, allergenName: string) => void;
  updateAllergenStatement: (statement: string) => void;
  toggleDisplayOnLabel: () => void;
  extractFromIngredients: () => void;
  resetAllergenData: () => void;
  transformFromFlat: (flatData: any) => void;
  validateData: () => boolean;
}

export const useAllergenManagement = ({
  initialAllergenData,
  ingredients = [],
  onAllergenDataChange
}: UseAllergenManagementProps = {}): UseAllergenManagementReturn => {
  
  // Initialize allergen data
  const [allergenData, setAllergenData] = useState<AllergenData>(() => {
    if (initialAllergenData && validateAllergenData(initialAllergenData)) {
      return initialAllergenData;
    }
    return getEmptyAllergenData();
  });
  
  const [isLoadingAllergens, setIsLoadingAllergens] = useState(false);
  const [allergenError, setAllergenError] = useState<string | null>(null);
  
  // Computed values
  const allergenStatement = generateAllergenStatement(allergenData);
  const hasAnyAllergens = hasAllergens(allergenData);
  const activeCategories = getActiveAllergenCategories(allergenData);
  const totalAllergenCount = countTotalAllergens(allergenData);
  
  // Notify parent component of changes
  useEffect(() => {
    if (onAllergenDataChange) {
      onAllergenDataChange(allergenData);
    }
  }, [allergenData, onAllergenDataChange]);
  
  // Update allergen data
  const updateAllergenData = useCallback((newData: AllergenData) => {
    if (validateAllergenData(newData)) {
      setAllergenData(newData);
      setAllergenError(null);
    } else {
      setAllergenError('Invalid allergen data structure');
    }
  }, []);
  
  // Add manual allergen
  const addManualAllergen = useCallback((category: string, allergenName: string) => {
    if (!allergenName.trim()) return;
    
    setAllergenData(prev => {
      const updated = { ...prev };
      
      if (!updated.manual[category]) {
        updated.manual[category] = [];
      }
      
      // Check if allergen already exists
      const exists = updated.manual[category].some(allergen => 
        allergen.name.toLowerCase() === allergenName.toLowerCase()
      );
      
      if (!exists) {
        updated.manual[category].push({
          name: allergenName.trim(),
          source: 'manual',
          confidence: 'high'
        });
      }
      
      return updated;
    });
  }, []);
  
  // Remove manual allergen
  const removeManualAllergen = useCallback((category: string, allergenName: string) => {
    setAllergenData(prev => {
      const updated = { ...prev };
      
      if (updated.manual[category]) {
        updated.manual[category] = updated.manual[category].filter(allergen => 
          allergen.name !== allergenName
        );
      }
      
      return updated;
    });
  }, []);
  
  // Add detected allergen
  const addDetectedAllergen = useCallback((category: string, allergen: any) => {
    setAllergenData(prev => {
      const updated = { ...prev };
      
      if (!updated.detected[category]) {
        updated.detected[category] = [];
      }
      
      // Check if allergen already exists
      const exists = updated.detected[category].some(existing => 
        existing.name.toLowerCase() === allergen.name.toLowerCase()
      );
      
      if (!exists) {
        updated.detected[category].push({
          name: allergen.name,
          source: allergen.source || 'api',
          confidence: allergen.confidence || 'medium',
          details: allergen.details
        });
      }
      
      return updated;
    });
  }, []);
  
  // Remove detected allergen
  const removeDetectedAllergen = useCallback((category: string, allergenName: string) => {
    setAllergenData(prev => {
      const updated = { ...prev };
      
      if (updated.detected[category]) {
        updated.detected[category] = updated.detected[category].filter(allergen => 
          allergen.name !== allergenName
        );
      }
      
      return updated;
    });
  }, []);
  
  // Update allergen statement
  const updateAllergenStatement = useCallback((statement: string) => {
    setAllergenData(prev => ({
      ...prev,
      statement: statement
    }));
  }, []);
  
  // Toggle display on label
  const toggleDisplayOnLabel = useCallback(() => {
    setAllergenData(prev => ({
      ...prev,
      displayOnLabel: !prev.displayOnLabel
    }));
  }, []);
  
  // Extract allergens from ingredients
  const extractFromIngredients = useCallback(() => {
    if (!ingredients || ingredients.length === 0) return;
    
    setIsLoadingAllergens(true);
    setAllergenError(null);
    
    try {
      const extractedAllergens = extractAllergensFromIngredients(ingredients);
      
      setAllergenData(prev => {
        const updated = { ...prev };
        
        // Add extracted allergens as detected allergens
        extractedAllergens.forEach(allergenName => {
          // Try to categorize the allergen
          const category = 'other'; // Default category, could be improved with mapping
          
          if (!updated.detected[category]) {
            updated.detected[category] = [];
          }
          
          // Check if allergen already exists
          const exists = updated.detected[category].some(allergen => 
            allergen.name.toLowerCase() === allergenName.toLowerCase()
          );
          
          if (!exists) {
            updated.detected[category].push({
              name: allergenName,
              source: 'ingredients',
              confidence: 'medium'
            });
          }
        });
        
        return updated;
      });
      
    } catch (error) {
      setAllergenError('Failed to extract allergens from ingredients');
      console.error('Error extracting allergens:', error);
    } finally {
      setIsLoadingAllergens(false);
    }
  }, [ingredients]);
  
  // Reset allergen data
  const resetAllergenData = useCallback(() => {
    setAllergenData(getEmptyAllergenData());
    setAllergenError(null);
  }, []);
  
  // Transform from flat structure
  const transformFromFlat = useCallback((flatData: any) => {
    setIsLoadingAllergens(true);
    setAllergenError(null);
    
    try {
      const transformed = transformFlatToCategories(flatData);
      setAllergenData(transformed);
    } catch (error) {
      setAllergenError('Failed to transform allergen data');
      console.error('Error transforming allergen data:', error);
    } finally {
      setIsLoadingAllergens(false);
    }
  }, []);
  
  // Validate current data
  const validateData = useCallback(() => {
    const isValid = validateAllergenData(allergenData);
    if (!isValid) {
      setAllergenError('Current allergen data is invalid');
    } else {
      setAllergenError(null);
    }
    return isValid;
  }, [allergenData]);
  
  return {
    // State
    allergenData,
    isLoadingAllergens,
    allergenError,
    
    // Computed values
    allergenStatement,
    hasAnyAllergens,
    activeCategories,
    totalAllergenCount,
    
    // Actions
    updateAllergenData,
    addManualAllergen,
    removeManualAllergen,
    addDetectedAllergen,
    removeDetectedAllergen,
    updateAllergenStatement,
    toggleDisplayOnLabel,
    extractFromIngredients,
    resetAllergenData,
    transformFromFlat,
    validateData
  };
};

export default useAllergenManagement;