import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, Printer, FileText } from 'lucide-react'
import { NutritionData } from '@/types/nutrition'

interface NutritionLabelProps {
  nutritionData: NutritionData | null
  productName?: string
  servings?: number
  totalWeight?: number
  caloriesPerServing?: number
}

export function NutritionLabel({ 
  nutritionData, 
  productName = 'Product', 
  servings,
  totalWeight,
  caloriesPerServing
}: NutritionLabelProps) {
  
  // Calculate actual allergens (filter out "free" and "no" cautions)
  const actualAllergens = nutritionData?.cautions?.filter(caution => 
    !caution.toLowerCase().includes('free') && 
    !caution.toLowerCase().includes('no ')
  ) || []
  
  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log('Download label as PDF')
  }

  const handlePrint = () => {
    // TODO: Implement print functionality
    window.print()
  }

  if (!nutritionData) {
    return (
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Nutrition Facts Label</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
        
        {/* Empty State */}
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Nutrition Data Available</h3>
            <p className="text-muted-foreground">
              Add ingredients and analyze nutrition to generate the FDA/EFSA compliant label.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate values for label (free version with limited info)
  const totalCalories = nutritionData?.calories || 0
  const servingsCount = servings || nutritionData?.servings || 1
  const caloriesPerServ = caloriesPerServing || Math.round(totalCalories / servingsCount)
  const weightPerServing = totalWeight ? totalWeight / servingsCount : (nutritionData?.totalWeight ? nutritionData.totalWeight / servingsCount : 0)
  
  // Get key macronutrients only (free version)
  const totalFat = nutritionData?.totalNutrients?.FAT?.quantity || 0
  const saturatedFat = nutritionData?.totalNutrients?.FASAT?.quantity || 0
  const cholesterol = nutritionData?.totalNutrients?.CHOLE?.quantity || 0
  const sodium = nutritionData?.totalNutrients?.NA?.quantity || 0
  const totalCarbs = nutritionData?.totalNutrients?.CHOCDF?.quantity || 0
  const fiber = nutritionData?.totalNutrients?.FIBTG?.quantity || 0
  const sugars = nutritionData?.totalNutrients?.SUGAR?.quantity || 0
  const protein = nutritionData?.totalNutrients?.PROCNT?.quantity || 0
  

  
  // Get daily values (per serving)
  const fatDV = nutritionData?.totalDaily?.FAT?.quantity ? Math.round((nutritionData.totalDaily.FAT.quantity / servingsCount)) : 0
  const saturatedFatDV = nutritionData?.totalDaily?.FASAT?.quantity ? Math.round((nutritionData.totalDaily.FASAT.quantity / servingsCount)) : 0
  const cholesterolDV = nutritionData?.totalDaily?.CHOLE?.quantity ? Math.round((nutritionData.totalDaily.CHOLE.quantity / servingsCount)) : 0
  const sodiumDV = nutritionData?.totalDaily?.NA?.quantity ? Math.round((nutritionData.totalDaily.NA.quantity / servingsCount)) : 0
  const carbsDV = nutritionData?.totalDaily?.CHOCDF?.quantity ? Math.round((nutritionData.totalDaily.CHOCDF.quantity / servingsCount)) : 0
  const fiberDV = nutritionData?.totalDaily?.FIBTG?.quantity ? Math.round((nutritionData.totalDaily.FIBTG.quantity / servingsCount)) : 0

  // Get vitamins and minerals
  const vitaminA = nutritionData.totalNutrients?.VITA_RAE?.quantity || 0
  const vitaminC = nutritionData.totalNutrients?.VITC?.quantity || 0
  const calcium = nutritionData.totalNutrients?.CA?.quantity || 0
  const iron = nutritionData.totalNutrients?.FE?.quantity || 0
  
  const vitaminADV = nutritionData.totalDaily?.VITA_RAE?.quantity || 0
  const vitaminCDV = nutritionData.totalDaily?.VITC?.quantity || 0
  const calciumDV = nutritionData.totalDaily?.CA?.quantity || 0
  const ironDV = nutritionData.totalDaily?.FE?.quantity || 0



  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">
            Free sample label - Nutrition Facts
          </h2>
          <Badge variant="outline" className="ml-2">
            English
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* FDA/EFSA Compliant Nutrition Label */}
      <div className="flex justify-center">
        <div 
          className="nutrition-label bg-white border-2 border-black p-4 font-mono text-black w-full text-left"
          style={{ 
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            lineHeight: '1.2',
            direction: 'ltr',
            maxWidth: '320px'
          }}
        >
          {/* Title */}
          <div className="text-center mb-3">
            <h1 className="text-3xl font-black tracking-tight border-b-8 border-black pb-2 mb-1" style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900 }}>
              Nutrition Facts
            </h1>
          </div>

          {/* Serving Information */}
          <div className="mb-2 text-sm">
            <div className="flex justify-between border-b-2 border-black pb-1">
              <span className="font-medium">Servings Per Container</span>
              <span className="font-bold">{servingsCount}</span>
            </div>
            <div className="mt-1">
              <span className="font-bold">Serving Size</span>
              <span className="ml-2 font-bold">{Math.round(weightPerServing)}g</span>
            </div>
            {totalWeight && (
              <div className="mt-1 text-xs">
                <span>Total Weight: {totalWeight.toFixed(0)}g</span>
              </div>
            )}
          </div>

          {/* Calories */}
          <div className="border-t-8 border-black pt-2 mb-2">
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold">Amount Per Serving</span>
            </div>
            <div className="flex justify-between items-end border-b-4 border-black pb-1">
              <span className="text-xl font-bold">Calories</span>
              <span className="text-2xl font-bold">{caloriesPerServ}</span>
            </div>
          </div>

          {/* Daily Value Header */}
          <div className="text-right text-sm font-bold mb-1 border-b-2 border-black pb-1">
            % Daily Value*
          </div>

          {/* Key Nutrients - Free Version (Limited) */}
          <div className="space-y-0 text-sm">
            {/* Total Fat */}
            <div className="flex justify-between border-b-2 border-black py-1">
              <span className="font-bold">Total Fat {Math.round(totalFat / servingsCount)}g</span>
              <span className="font-bold">{fatDV}%</span>
            </div>
            
            {/* Saturated Fat */}
            {saturatedFat > 0 && (
              <div className="flex justify-between border-b border-black py-1 pl-4">
                <span>Saturated Fat {Math.round(saturatedFat / servingsCount)}g</span>
                <span className="font-bold">{saturatedFatDV}%</span>
              </div>
            )}
            
            {/* Cholesterol */}
            {cholesterol > 0 && (
              <div className="flex justify-between border-b-2 border-black py-1">
                <span className="font-bold">Cholesterol {Math.round(cholesterol / servingsCount)}mg</span>
                <span className="font-bold">{cholesterolDV}%</span>
              </div>
            )}
            
            {/* Sodium */}
            <div className="flex justify-between border-b-2 border-black py-1">
              <span className="font-bold">Sodium {Math.round(sodium / servingsCount)}mg</span>
              <span className="font-bold">{sodiumDV}%</span>
            </div>
            
            {/* Total Carbs */}
            <div className="flex justify-between border-b-2 border-black py-1">
              <span className="font-bold">Total Carbohydrate {Math.round(totalCarbs / servingsCount)}g</span>
              <span className="font-bold">{carbsDV}%</span>
            </div>
            
            {/* Dietary Fiber */}
            <div className="flex justify-between border-b border-black py-1 pl-4">
              <span>Dietary Fiber {Math.round(fiber / servingsCount)}g</span>
              <span className="font-bold">{fiberDV}%</span>
            </div>
            
            {/* Sugars */}
            {sugars > 0 && (
              <div className="flex justify-between border-b border-black py-1 pl-4">
                <span>Total Sugars {Math.round(sugars / servingsCount)}g</span>
              </div>
            )}
            
            {/* Protein */}
            <div className="flex justify-between border-b-8 border-black py-2">
              <span className="font-bold">Protein {Math.round(protein / servingsCount)}g</span>
            </div>
          </div>

          {/* Diet Labels Only (Free Version) */}
          {nutritionData?.dietLabels && nutritionData.dietLabels.length > 0 && (
            <div className="mt-2 border-t border-b-4 border-black pt-2 pb-2">
              <h3 className="font-bold text-sm mb-1">Diet Information</h3>
              <div className="flex flex-wrap gap-1">
                {nutritionData.dietLabels.slice(0, 3).map((label, index) => (
                  <span key={index} className="text-xs bg-gray-100 px-2 py-1 border border-gray-300">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footnote */}
          <div className="mt-2 text-xs leading-tight">
            *The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
          </div>

          {/* Actual Allergens Only (Free Version) */}
          {actualAllergens.length > 0 && (
            <div className="mt-3 border-t border-black pt-2">
              <div className="font-bold text-sm mb-1">Allergens:</div>
              <div className="text-xs">
                {actualAllergens.join(', ')}
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  )
}

export default NutritionLabel