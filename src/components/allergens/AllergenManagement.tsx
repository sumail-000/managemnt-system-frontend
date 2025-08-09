import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Loader2 } from 'lucide-react';
import {
  AllergenData,
  ALLERGEN_CATEGORIES,
  AllergenItem,
  getEmptyAllergenData
} from '@/utils/nutritionDataMapper';

interface AllergenManagementProps {
  allergenData: AllergenData;
  setAllergenData: (data: AllergenData) => void;
  addedIngredients: any[];
  currentRecipe: any;
  isSavingAllergens: boolean;
  onSaveAllergens: (data: AllergenData) => void;
}

export const AllergenManagement: React.FC<AllergenManagementProps> = ({
  allergenData,
  setAllergenData,
  addedIngredients,
  currentRecipe,
  isSavingAllergens,
  onSaveAllergens
}) => {
  const allergenSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleManualAllergenChange = (categoryId: string, subcategory: string, checked: boolean) => {
    const newAllergenData = { ...allergenData };
    if (!newAllergenData.manual[categoryId]) {
      newAllergenData.manual[categoryId] = [];
    }
    
    if (checked) {
      // Add allergen
      newAllergenData.manual[categoryId].push({
        name: subcategory,
        confidence: 'high',
        source: 'manual'
      });
    } else {
      // Remove allergen
      newAllergenData.manual[categoryId] = newAllergenData.manual[categoryId].filter(
        a => a.name !== subcategory
      );
    }
    
    setAllergenData(newAllergenData);
    
    // Debounced auto-save to backend
    if (currentRecipe?.id) {
      if (allergenSaveTimeoutRef.current) {
        clearTimeout(allergenSaveTimeoutRef.current);
      }
      allergenSaveTimeoutRef.current = setTimeout(() => {
        onSaveAllergens(newAllergenData);
      }, 1000); // 1 second debounce
    }
  };

  const generateAllergenPreview = () => {
    const allAllergens: string[] = [];
    
    // Collect all detected and manual allergens
    ALLERGEN_CATEGORIES.forEach(category => {
      const detected = allergenData.detected[category.id] || [];
      const manual = allergenData.manual[category.id] || [];
      
      detected.forEach(allergen => {
        if (!allAllergens.includes(allergen.name)) {
          allAllergens.push(allergen.name);
        }
      });
      
      manual.forEach(allergen => {
        if (!allAllergens.includes(allergen.name)) {
          allAllergens.push(allergen.name);
        }
      });
    });
    
    if (allAllergens.length === 0) {
      return <span className="text-gray-500 italic">No allergens detected or selected</span>;
    }
    
    return allAllergens.map((allergen, index) => (
      <span key={allergen} className="inline">
        {allergen}
        {index < allAllergens.length - 1 ? ', ' : '.'}
      </span>
    ));
  };

  const getAllergenStats = () => {
    const detectedCount = Object.values(allergenData.detected).flat().length;
    const manualCount = Object.values(allergenData.manual).flat().length;
    
    // Calculate total unique allergens
    const allAllergens = new Set<string>();
    ALLERGEN_CATEGORIES.forEach(category => {
      const detected = allergenData.detected[category.id] || [];
      const manual = allergenData.manual[category.id] || [];
      detected.concat(manual).forEach(allergen => {
        allAllergens.add(allergen.name);
      });
    });
    
    return {
      detected: detectedCount,
      manual: manualCount,
      total: allAllergens.size
    };
  };

  if (addedIngredients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Allergen Management
            {isSavingAllergens && (
              <div className="flex items-center text-sm text-blue-600">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Saving...
              </div>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Manage allergen information for your product. Allergens are automatically detected from ingredients and can be manually adjusted.
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No ingredients added yet. Add ingredients in the Recipe tab to detect allergens automatically.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getAllergenStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Allergen Management
          {isSavingAllergens && (
            <div className="flex items-center text-sm text-blue-600">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Saving...
            </div>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage allergen information for your product. Allergens are automatically detected from ingredients and can be manually adjusted.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Allergen Categories */}
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">Allergen Categories</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {ALLERGEN_CATEGORIES.map((category) => (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{category.icon}</span>
                      <h4 className="font-medium text-gray-900">{category.name}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      {allergenData.detected[category.id] && allergenData.detected[category.id].length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          Auto-detected
                        </Badge>
                      )}
                      {allergenData.manual[category.id] && allergenData.manual[category.id].length > 0 && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Manual
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Auto-detected allergens */}
                  {allergenData.detected[category.id] && allergenData.detected[category.id].length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-orange-600 mb-2">Auto-detected from ingredients:</p>
                      <div className="flex flex-wrap gap-1">
                        {allergenData.detected[category.id].map((allergen, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-orange-200 text-orange-700">
                            {allergen.name} ({allergen.confidence})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Manual allergen selection */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600">Manual selection:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {category.subcategories.map((subcategory) => (
                        <label key={subcategory} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={allergenData.manual[category.id]?.some(a => a.name === subcategory) || false}
                            onChange={(e) => handleManualAllergenChange(category.id, subcategory, e.target.checked)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-gray-700">{subcategory}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Allergen Statement Preview */}
          <div className="space-y-4">
            <h3 className="text-base font-medium text-gray-900">Allergen Statement Preview</h3>
            <div className="sticky top-4">
              <div className="border rounded-lg p-4 bg-gray-50 min-h-[200px]">
                <div className="text-sm font-bold mb-3 text-gray-800">CONTAINS:</div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {generateAllergenPreview()}
                </div>
                
                {/* May Contain Statement */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="text-sm font-bold mb-2 text-gray-800">MAY CONTAIN:</div>
                  <div className="text-sm text-gray-700">
                    <span className="text-gray-500 italic">Cross-contamination warnings (if applicable)</span>
                  </div>
                </div>
                
                {/* Allergen Statistics */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Auto-detected: {stats.detected}</div>
                    <div>Manually selected: {stats.manual}</div>
                    <div>Total allergens: {stats.total}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllergenManagement;