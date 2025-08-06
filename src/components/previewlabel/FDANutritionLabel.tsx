import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NutritionData {
  servings?: number;
  servingSize?: string;
  servingSizeGrams?: number;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrate?: number;
  dietaryFiber?: number;
  totalSugars?: number;
  addedSugars?: number;
  protein?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  // Daily Value percentages
  totalFatDV?: number;
  saturatedFatDV?: number;
  cholesterolDV?: number;
  sodiumDV?: number;
  totalCarbohydrateDV?: number;
  dietaryFiberDV?: number;
  proteinDV?: number;
  vitaminDDV?: number;
  calciumDV?: number;
  ironDV?: number;
  potassiumDV?: number;
}

interface FDANutritionLabelProps {
  data?: NutritionData;
  className?: string;
}



export function FDANutritionLabel({ data, className }: FDANutritionLabelProps) {

  // Use actual data if provided, otherwise fallback to zeros
  const nutritionData: NutritionData = data || {
    servings: 1,
    servingSize: '1 serving',
    servingSizeGrams: 0,
    calories: 0,
    totalFat: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    sodium: 0,
    totalCarbohydrate: 0,
    dietaryFiber: 0,
    totalSugars: 0,
    addedSugars: 0,
    protein: 0,
    vitaminD: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    // Daily values (all zeros)
    totalFatDV: 0,
    saturatedFatDV: 0,
    cholesterolDV: 0,
    sodiumDV: 0,
    totalCarbohydrateDV: 0,
    dietaryFiberDV: 0,
    proteinDV: 0,
    vitaminDDV: 0,
    calciumDV: 0,
    ironDV: 0,
    potassiumDV: 0
  };

  const calculateDV = (nutrient: keyof NutritionData, amount: number, providedDV?: number): number => {
    // If provided daily value exists, use it
    if (providedDV !== undefined && providedDV !== null) {
      return Math.round(providedDV);
    }
    
    // Otherwise calculate using standard daily values
    const dvValues: Record<string, number> = {
      totalFat: 65,
      saturatedFat: 20,
      cholesterol: 300,
      sodium: 2300,
      totalCarbohydrate: 300,
      dietaryFiber: 25,
      addedSugars: 50,
      protein: 50,
      vitaminD: 20,
      calcium: 1300,
      iron: 18,
      potassium: 4700
    };
    
    const dv = dvValues[nutrient as string];
    if (!dv) return 0;
    return Math.round((amount / dv) * 100);
  };

  return (
    <Card className={cn(
        "w-full max-w-[320px] mx-auto bg-white border-2 border-black shadow-lg rounded-none",
        className
      )}>
        <div className="p-3">
          {/* Header */}
          <div className="border-b-8 border-black pb-1 mb-2">
            <h1 className="text-3xl font-black text-black text-center tracking-tight uppercase">
              Nutrition Facts
            </h1>
            <div className="text-sm text-black font-medium text-left">
              {nutritionData.servings} servings per container
            </div>
            <div className="flex items-baseline justify-between"> 
              <span className="text-base font-bold text-black">Serving size</span>
              <span className="text-base font-bold text-black">
                {nutritionData.servingSize} ({nutritionData.servingSizeGrams}g)
              </span>
            </div>
          </div>

          {/* Amount Per Serving */}
          <div className="mb-1">
            <div className="flex items-baseline justify-start"> 
              <span className="text-sm font-bold text-black">Amount per serving</span>
            </div>
          </div>

          {/* Calories */}
          <div className="border-b-8 border-black pb-1 mb-2">
            <div className="flex items-center justify-between"> 
              <span className="text-2xl font-black text-black uppercase">Calories</span>
              <span className="text-4xl font-black text-black">{nutritionData.calories}</span>
            </div>
          </div>

          {/* % Daily Value */}
          <div className="flex mb-1 justify-end">
            <span className="text-sm font-bold text-black">% Daily Value*</span>
          </div>

          {/* Nutrients */}
          <div className="space-y-0">
            {/* Total Fat */}
            <div className="flex border-b border-black py-1 justify-between">
              <span className="text-sm font-bold text-black">
                Total Fat {nutritionData.totalFat}g
              </span>
              <span className="text-sm font-bold text-black">
                {calculateDV('totalFat', nutritionData.totalFat, nutritionData.totalFatDV)}%
              </span>
            </div>

             {/* Saturated Fat */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm text-black pl-4">
                 Saturated Fat {nutritionData.saturatedFat}g
               </span>
               <span className="text-sm text-black">
                 {calculateDV('saturatedFat', nutritionData.saturatedFat, nutritionData.saturatedFatDV)}%
               </span>
             </div>

             {/* Trans Fat */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm text-black pl-4">
                 <em>Trans Fat</em> {nutritionData.transFat}g
               </span>
               <span className="text-sm text-black"></span>
             </div>

             {/* Cholesterol */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold text-black">
                 Cholesterol {nutritionData.cholesterol}mg
               </span>
               <span className="text-sm font-bold text-black">
                 {calculateDV('cholesterol', nutritionData.cholesterol, nutritionData.cholesterolDV)}%
               </span>
             </div>

             {/* Sodium */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold text-black">
                 Sodium {nutritionData.sodium}mg
               </span>
               <span className="text-sm font-bold text-black">
                 {calculateDV('sodium', nutritionData.sodium, nutritionData.sodiumDV)}%
               </span>
             </div>

             {/* Total Carbohydrate */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold text-black">
                 Total Carbohydrate {nutritionData.totalCarbohydrate}g
               </span>
               <span className="text-sm font-bold text-black">
                 {calculateDV('totalCarbohydrate', nutritionData.totalCarbohydrate, nutritionData.totalCarbohydrateDV)}%
               </span>
             </div>

             {/* Dietary Fiber */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm text-black pl-4">
                 Dietary Fiber {nutritionData.dietaryFiber}g
               </span>
               <span className="text-sm text-black">
                 {calculateDV('dietaryFiber', nutritionData.dietaryFiber, nutritionData.dietaryFiberDV)}%
               </span>
             </div>

             {/* Total Sugars */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm text-black pl-4">
                 Total Sugars {nutritionData.totalSugars}g
               </span>
               <span className="text-sm text-black"></span>
             </div>

             {/* Added Sugars */}
             <div className="flex border-b-4 border-black py-1 justify-between">
               <span className="text-sm text-black pl-8">
                 Includes {nutritionData.addedSugars}g Added Sugars
               </span>
               <span className="text-sm text-black">
                 {calculateDV('addedSugars', nutritionData.addedSugars)}%
               </span>
             </div>

             {/* Protein */}
             <div className="flex border-b-4 border-black py-1 justify-between">
               <span className="text-sm font-bold text-black">
                 Protein {nutritionData.protein}g
               </span>
               <span className="text-sm text-black">
                 {calculateDV('protein', nutritionData.protein, nutritionData.proteinDV)}%
               </span>
             </div>

             {/* Vitamins and Minerals */}
             <div className="border-b-4 border-black py-1">
               <div className="flex py-0.5 justify-between">
                 <span className="text-sm text-black">Vitamin D {nutritionData.vitaminD}mcg</span>
                 <span className="text-sm text-black">{calculateDV('vitaminD', nutritionData.vitaminD, nutritionData.vitaminDDV)}%</span>
               </div>
               <div className="flex py-0.5 justify-between">
                 <span className="text-sm text-black">Calcium {nutritionData.calcium}mg</span>
                 <span className="text-sm text-black">{calculateDV('calcium', nutritionData.calcium, nutritionData.calciumDV)}%</span>
               </div>
               <div className="flex py-0.5 justify-between">
                 <span className="text-sm text-black">Iron {nutritionData.iron}mg</span>
                 <span className="text-sm text-black">{calculateDV('iron', nutritionData.iron, nutritionData.ironDV)}%</span>
               </div>
               <div className="flex py-0.5 justify-between">
                 <span className="text-sm text-black">Potassium {nutritionData.potassium}mg</span>
                 <span className="text-sm text-black">{calculateDV('potassium', nutritionData.potassium, nutritionData.potassiumDV)}%</span>
               </div>
             </div>
          </div>

          {/* Footer */}
          <div className="pt-2">
            <p className="text-xs text-black leading-tight text-left">
              * The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
            </p>
          </div>
        </div>
      </Card>
  );
}

export default FDANutritionLabel;