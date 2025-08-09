import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Languages, Download, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateNutritionLabelPDF } from '@/utils/pdfGenerator';

interface NutritionData {
  servings?: number;
  servingSize?: string;
  servingSizeGrams?: number;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrate?: number;
  dietaryFiber?: number;
  totalSugars?: number;
  addedSugars?: number;
  sugarAlcohol?: number;
  protein?: number;
  
  // Comprehensive Vitamins
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  thiamin?: number;
  riboflavin?: number;
  niacin?: number;
  vitaminB6?: number;
  folate?: number;
  vitaminB12?: number;
  pantothenicAcid?: number;
  
  // Comprehensive Minerals
  calcium?: number;
  iron?: number;
  potassium?: number;
  phosphorus?: number;
  magnesium?: number;
  zinc?: number;
  selenium?: number;
  copper?: number;
  manganese?: number;
  
  // Daily Value percentages for all nutrients
  totalFatDV?: number;
  saturatedFatDV?: number;
  monounsaturatedFatDV?: number;
  polyunsaturatedFatDV?: number;
  cholesterolDV?: number;
  sodiumDV?: number;
  totalCarbohydrateDV?: number;
  dietaryFiberDV?: number;
  addedSugarsDV?: number;
  sugarAlcoholDV?: number;
  proteinDV?: number;
  
  // Vitamin Daily Values
  vitaminADV?: number;
  vitaminCDV?: number;
  vitaminDDV?: number;
  vitaminEDV?: number;
  vitaminKDV?: number;
  thiaminDV?: number;
  riboflavinDV?: number;
  niacinDV?: number;
  vitaminB6DV?: number;
  folateDV?: number;
  vitaminB12DV?: number;
  pantothenicAcidDV?: number;
  
  // Mineral Daily Values
  calciumDV?: number;
  ironDV?: number;
  potassiumDV?: number;
  phosphorusDV?: number;
  magnesiumDV?: number;
  zincDV?: number;
  seleniumDV?: number;
  copperDV?: number;
  manganeseDV?: number;
}

interface LabelCustomization {
  labelType?: string;
  justifyLeft?: boolean;
  justifyCenter?: boolean;
  removeUppercase?: boolean;
  makeLowercase?: boolean;
  makeTitlecase?: boolean;
  labelWidth?: number;
  textColor?: string;
  backgroundColor?: string;
  hideIngredientList?: boolean;
  hideBusinessInfo?: boolean;
  hideAllergens?: boolean;
  showQRCode?: boolean;
}

interface FDANutritionLabelProps {
  data?: NutritionData;
  className?: string;
  showActionButtons?: boolean;
  onDownload?: () => void;
  onCustomize?: () => void;
  customization?: LabelCustomization;
  selectedVitamins?: string[];
  selectedOptionalNutrients?: string[];
  realIngredients?: Array<{name: string; allergens: string[]; customStatement?: string}>;
  realAllergens?: string[];
  allergenData?: any; // Add allergen data from allergen management system
  businessInfo?: {
    companyName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  recipeName?: string;
  qrCodeData?: any; // Add QR code data for displaying actual QR codes
}

type Language = 'en' | 'ar';

// Translation object for Arabic
const translations = {
  en: {
    nutritionFacts: 'Nutrition Facts',
    servingsPerContainer: 'servings per container',
    servingSize: 'Serving size',
    amountPerServing: 'Amount per serving',
    calories: 'Calories',
    dailyValue: '% Daily Value*',
    totalFat: 'Total Fat',
    saturatedFat: 'Saturated Fat',
    transFat: 'Trans Fat',
    cholesterol: 'Cholesterol',
    sodium: 'Sodium',
    totalCarbohydrate: 'Total Carbohydrate',
    dietaryFiber: 'Dietary Fiber',
    totalSugars: 'Total Sugars',
    addedSugars: 'Added Sugars',
    includes: 'Includes',
    protein: 'Protein',
    vitaminD: 'Vitamin D',
    vitaminA: 'Vitamin A',
    vitaminC: 'Vitamin C',
    vitaminE: 'Vitamin E',
    vitaminK: 'Vitamin K',
    thiamin: 'Thiamin',
    riboflavin: 'Riboflavin',
    niacin: 'Niacin',
    vitaminB6: 'Vitamin B6',
    folate: 'Folate',
    vitaminB12: 'Vitamin B12',
    pantothenicAcid: 'Pantothenic Acid',
    calcium: 'Calcium',
    iron: 'Iron',
    potassium: 'Potassium',
    phosphorus: 'Phosphorus',
    magnesium: 'Magnesium',
    zinc: 'Zinc',
    selenium: 'Selenium',
    copper: 'Copper',
    manganese: 'Manganese',
    monounsaturatedFat: 'Monounsaturated Fat',
    polyunsaturatedFat: 'Polyunsaturated Fat',
    sugarAlcohol: 'Sugar Alcohol',
    footer: '* The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.',
    units: {
      g: 'g',
      mg: 'mg',
      mcg: 'mcg'
    }
  },
  ar: {
    nutritionFacts: 'حقائق التغذية',
    servingsPerContainer: 'حصص لكل عبوة',
    servingSize: 'حجم الحصة',
    amountPerServing: 'الكمية لكل حصة',
    calories: 'السعرات الحرارية',
    dailyValue: '* النسبة المئوية للقيمة اليومية',
    totalFat: 'إجمالي الدهون',
    saturatedFat: 'الدهون المشبعة',
    transFat: 'الدهون المتحولة',
    cholesterol: 'الكوليسترول',
    sodium: 'الصوديوم',
    totalCarbohydrate: 'إجمالي الكربوهيدرات',
    dietaryFiber: 'الألياف الغذائية',
    totalSugars: 'إجمالي السكريات',
    addedSugars: 'السكريات المضافة',
    includes: 'يشمل',
    protein: 'البروتين',
    vitaminD: 'فيتامين د',
    vitaminA: 'فيتامين أ',
    vitaminC: 'فيتامين ج',
    vitaminE: 'فيتامين هـ',
    vitaminK: 'فيتامين ك',
    thiamin: 'الثيامين',
    riboflavin: 'الريبوفلافين',
    niacin: 'النياسين',
    vitaminB6: 'فيتامين ب6',
    folate: 'الفولات',
    vitaminB12: 'فيتامين ب12',
    pantothenicAcid: 'حمض البانتوثينيك',
    calcium: 'الكالسيوم',
    iron: 'الحديد',
    potassium: 'البوتاسيوم',
    phosphorus: 'الفوسفور',
    magnesium: 'المغنيسيوم',
    zinc: 'الزنك',
    selenium: 'السيلينيوم',
    copper: 'النحاس',
    manganese: 'المنغنيز',
    monounsaturatedFat: 'الدهون الأحادية غير المشبعة',
    polyunsaturatedFat: 'الدهون المتعددة غير المشبعة',
    sugarAlcohol: 'كحول السكر',
    footer: '* تخبرك النسبة المئوية للقيمة اليومية بمقدار مساهمة العنصر الغذائي في حصة من الطعام في النظام الغذائي اليومي. يتم استخدام 2000 سعرة حرارية يومياً للحصول على نصائح التغذية العامة.',
    units: {
      g: 'جم',
      mg: 'مجم',
      mcg: 'مكجم'
    }
  }
};

export function FDANutritionLabel({
  data,
  className,
  showActionButtons = false,
  onDownload,
  onCustomize,
  customization = {},
  selectedVitamins = [],
  selectedOptionalNutrients = [],
  realIngredients = [],
  realAllergens = [],
  allergenData,
  businessInfo,
  recipeName,
  qrCodeData
}: FDANutritionLabelProps): JSX.Element {
  const [language, setLanguage] = useState<Language>('en');
  const navigate = useNavigate();

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

  const t = translations[language];
  const isRTL = language === 'ar';

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const calculateDV = (nutrient: keyof NutritionData, amount: number, providedDV?: number): number => {
    // If provided daily value exists, use it
    if (providedDV !== undefined && providedDV !== null) {
      return Math.round(providedDV);
    }
    
    // Otherwise calculate using standard daily values (FDA 2016 guidelines)
    const dvValues: Record<string, number> = {
      totalFat: 65,
      saturatedFat: 20,
      monounsaturatedFat: 0, // No DV established
      polyunsaturatedFat: 0, // No DV established
      cholesterol: 300,
      sodium: 2300,
      totalCarbohydrate: 300,
      dietaryFiber: 25,
      addedSugars: 50,
      sugarAlcohol: 0, // No DV established
      protein: 50,
      
      // Vitamins (in mcg unless noted)
      vitaminA: 900, // mcg RAE
      vitaminC: 90, // mg
      vitaminD: 20, // mcg
      vitaminE: 15, // mg
      vitaminK: 120, // mcg
      thiamin: 1.2, // mg
      riboflavin: 1.3, // mg
      niacin: 16, // mg
      vitaminB6: 1.7, // mg
      folate: 400, // mcg DFE
      vitaminB12: 2.4, // mcg
      pantothenicAcid: 5, // mg
      
      // Minerals
      calcium: 1300, // mg
      iron: 18, // mg
      potassium: 4700, // mg
      phosphorus: 1250, // mg
      magnesium: 420, // mg
      zinc: 11, // mg
      selenium: 55, // mcg
      copper: 0.9, // mg
      manganese: 2.3 // mg
    };
    
    const dv = dvValues[nutrient as string];
    if (!dv) return 0;
    return Math.round((amount / dv) * 100);
  };

  // Helper function to apply text formatting based on customization
  const formatText = (text: string): string => {
    let formatted = text;
    
    if (customization.removeUppercase) {
      formatted = formatted.toLowerCase();
    }
    if (customization.makeLowercase) {
      formatted = formatted.toLowerCase();
    }
    if (customization.makeTitlecase) {
      formatted = formatted.replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    }
    
    return formatted;
  };

  // Helper function to get label alignment classes
  const getLabelAlignment = (): string => {
    if (customization.justifyCenter) return 'text-center';
    if (customization.justifyLeft) return 'text-left';
    return 'text-left'; // default
  };

  // Helper function to get label width
  const getLabelWidth = (): number => {
    return customization.labelWidth || 320;
  };

  // Helper function to get label colors
  const getLabelColors = () => ({
    textColor: customization.textColor || 'black',
    backgroundColor: customization.backgroundColor || 'white'
  });

  // Helper function to render vitamins and minerals based on selected vitamins
  const renderSelectedVitamins = (colors: any) => {
    const vitaminsToShow = selectedVitamins.length > 0 ? selectedVitamins : ['vitaminD', 'calcium', 'iron', 'potassium'];
    
    return vitaminsToShow.map((vitaminId) => {
      const vitaminMap: Record<string, { label: string; amount: number; unit: string; dv: number }> = {
        vitaminA: { label: t.vitaminA, amount: nutritionData.vitaminA || 0, unit: t.units.mcg, dv: calculateDV('vitaminA', nutritionData.vitaminA || 0, nutritionData.vitaminADV) },
        vitaminC: { label: t.vitaminC, amount: nutritionData.vitaminC || 0, unit: t.units.mg, dv: calculateDV('vitaminC', nutritionData.vitaminC || 0, nutritionData.vitaminCDV) },
        vitaminD: { label: t.vitaminD, amount: nutritionData.vitaminD || 0, unit: t.units.mcg, dv: calculateDV('vitaminD', nutritionData.vitaminD || 0, nutritionData.vitaminDDV) },
        vitaminE: { label: t.vitaminE, amount: nutritionData.vitaminE || 0, unit: t.units.mg, dv: calculateDV('vitaminE', nutritionData.vitaminE || 0, nutritionData.vitaminEDV) },
        vitaminK: { label: t.vitaminK, amount: nutritionData.vitaminK || 0, unit: t.units.mcg, dv: calculateDV('vitaminK', nutritionData.vitaminK || 0, nutritionData.vitaminKDV) },
        thiamin: { label: t.thiamin, amount: nutritionData.thiamin || 0, unit: t.units.mg, dv: calculateDV('thiamin', nutritionData.thiamin || 0, nutritionData.thiaminDV) },
        riboflavin: { label: t.riboflavin, amount: nutritionData.riboflavin || 0, unit: t.units.mg, dv: calculateDV('riboflavin', nutritionData.riboflavin || 0, nutritionData.riboflavinDV) },
        niacin: { label: t.niacin, amount: nutritionData.niacin || 0, unit: t.units.mg, dv: calculateDV('niacin', nutritionData.niacin || 0, nutritionData.niacinDV) },
        vitaminB6: { label: t.vitaminB6, amount: nutritionData.vitaminB6 || 0, unit: t.units.mg, dv: calculateDV('vitaminB6', nutritionData.vitaminB6 || 0, nutritionData.vitaminB6DV) },
        folate: { label: t.folate, amount: nutritionData.folate || 0, unit: t.units.mcg, dv: calculateDV('folate', nutritionData.folate || 0, nutritionData.folateDV) },
        vitaminB12: { label: t.vitaminB12, amount: nutritionData.vitaminB12 || 0, unit: t.units.mcg, dv: calculateDV('vitaminB12', nutritionData.vitaminB12 || 0, nutritionData.vitaminB12DV) },
        pantothenicAcid: { label: t.pantothenicAcid, amount: nutritionData.pantothenicAcid || 0, unit: t.units.mg, dv: calculateDV('pantothenicAcid', nutritionData.pantothenicAcid || 0, nutritionData.pantothenicAcidDV) },
        calcium: { label: t.calcium, amount: nutritionData.calcium || 0, unit: t.units.mg, dv: calculateDV('calcium', nutritionData.calcium || 0, nutritionData.calciumDV) },
        iron: { label: t.iron, amount: nutritionData.iron || 0, unit: t.units.mg, dv: calculateDV('iron', nutritionData.iron || 0, nutritionData.ironDV) },
        potassium: { label: t.potassium, amount: nutritionData.potassium || 0, unit: t.units.mg, dv: calculateDV('potassium', nutritionData.potassium || 0, nutritionData.potassiumDV) },
        phosphorus: { label: t.phosphorus, amount: nutritionData.phosphorus || 0, unit: t.units.mg, dv: calculateDV('phosphorus', nutritionData.phosphorus || 0, nutritionData.phosphorusDV) },
        magnesium: { label: t.magnesium, amount: nutritionData.magnesium || 0, unit: t.units.mg, dv: calculateDV('magnesium', nutritionData.magnesium || 0, nutritionData.magnesiumDV) },
        zinc: { label: t.zinc, amount: nutritionData.zinc || 0, unit: t.units.mg, dv: calculateDV('zinc', nutritionData.zinc || 0, nutritionData.zincDV) },
        selenium: { label: t.selenium, amount: nutritionData.selenium || 0, unit: t.units.mcg, dv: calculateDV('selenium', nutritionData.selenium || 0, nutritionData.seleniumDV) },
        copper: { label: t.copper, amount: nutritionData.copper || 0, unit: t.units.mg, dv: calculateDV('copper', nutritionData.copper || 0, nutritionData.copperDV) },
        manganese: { label: t.manganese, amount: nutritionData.manganese || 0, unit: t.units.mg, dv: calculateDV('manganese', nutritionData.manganese || 0, nutritionData.manganeseDV) }
      };

      const vitamin = vitaminMap[vitaminId];
      if (!vitamin) return null;

      return (
        <div key={vitaminId} className={cn("flex py-0.5", isRTL ? "justify-between" : "justify-between")}>
          <span className="text-sm" style={{ color: colors.textColor }}>
            {isRTL ? `${vitamin.dv}%` : `${formatText(vitamin.label)} ${vitamin.amount}${vitamin.unit}`}
          </span>
          <span className="text-sm" style={{ color: colors.textColor }}>
            {isRTL ? `${formatText(vitamin.label)} ${vitamin.amount}${vitamin.unit}` : `${vitamin.dv}%`}
          </span>
        </div>
      );
    }).filter(Boolean);
  };

  // Helper function to render optional nutrients based on selected options
  const renderOptionalNutrients = (colors: any) => {
    if (selectedOptionalNutrients.length === 0) return null;

    return selectedOptionalNutrients.map((nutrientId) => {
      switch (nutrientId) {
        case 'monounsaturatedFat':
          if ((nutritionData.monounsaturatedFat || 0) === 0) return null;
          return (
            <div key={nutrientId} className={cn("flex border-b border-black py-1 justify-between")}>
              <span className={cn("text-sm", isRTL ? "pr-4" : "pl-4")} style={{ color: colors.textColor }}>
                {isRTL ? "-" : `${formatText(t.monounsaturatedFat)} ${(nutritionData.monounsaturatedFat || 0).toFixed(1)}${t.units.g}`}
              </span>
              <span className="text-sm" style={{ color: colors.textColor }}>
                {isRTL ? `${formatText(t.monounsaturatedFat)} ${(nutritionData.monounsaturatedFat || 0).toFixed(1)}${t.units.g}` : "-"}
              </span>
            </div>
          );
        case 'polyunsaturatedFat':
          if ((nutritionData.polyunsaturatedFat || 0) === 0) return null;
          return (
            <div key={nutrientId} className={cn("flex border-b border-black py-1 justify-between")}>
              <span className={cn("text-sm", isRTL ? "pr-4" : "pl-4")} style={{ color: colors.textColor }}>
                {isRTL ? "-" : `${formatText(t.polyunsaturatedFat)} ${(nutritionData.polyunsaturatedFat || 0).toFixed(1)}${t.units.g}`}
              </span>
              <span className="text-sm" style={{ color: colors.textColor }}>
                {isRTL ? `${formatText(t.polyunsaturatedFat)} ${(nutritionData.polyunsaturatedFat || 0).toFixed(1)}${t.units.g}` : "-"}
              </span>
            </div>
          );
        case 'sugarAlcohol':
          if ((nutritionData.sugarAlcohol || 0) === 0) return null;
          return (
            <div key={nutrientId} className={cn("flex border-b border-black py-1 justify-between")}>
              <span className={cn("text-sm", isRTL ? "pr-4" : "pl-4")} style={{ color: colors.textColor }}>
                {isRTL ? "-" : `${formatText(t.sugarAlcohol)} ${(nutritionData.sugarAlcohol || 0).toFixed(1)}${t.units.g}`}
              </span>
              <span className="text-sm" style={{ color: colors.textColor }}>
                {isRTL ? `${formatText(t.sugarAlcohol)} ${(nutritionData.sugarAlcohol || 0).toFixed(1)}${t.units.g}` : "-"}
              </span>
            </div>
          );
        default:
          return null;
      }
    }).filter(Boolean);
  };

  // Helper function to generate QR code content
  const generateQRCodeContent = () => {
    const productInfo = {
      name: recipeName || 'Custom Recipe',
      calories: nutritionData.calories,
      servingSize: nutritionData.servingSize,
      company: businessInfo?.companyName || 'Your Company'
    };
    return `Product: ${productInfo.name}\nCalories: ${productInfo.calories}\nServing: ${productInfo.servingSize}\nBy: ${productInfo.company}`;
  };

  // Helper function to render real ingredient list
  const renderIngredientList = (colors: any) => {
    if (realIngredients.length === 0) {
      return "Sample ingredient list would appear here";
    }
    return realIngredients.map(ing => {
      // Use custom statement if available, otherwise use ingredient name
      return ing.customStatement && ing.customStatement.trim()
        ? ing.customStatement.trim()
        : ing.name;
    }).join(', ');
  };

  // Helper function to render business info
  const renderBusinessInfo = (colors: any) => {
    if (!businessInfo) {
      return "Your Company Name, Address, City, State ZIP";
    }
    return `${businessInfo.companyName}, ${businessInfo.address}, ${businessInfo.city}, ${businessInfo.state} ${businessInfo.zipCode}`;
  };

  // Helper function to render allergen info
  const renderAllergenInfo = (colors: any) => {
    if (realAllergens.length === 0) {
      return "Sample allergen information";
    }
    return realAllergens.join(', ');
  };

  // Helper function to render QR code
  const renderQRCode = (colors: any) => {
    if (qrCodeData && qrCodeData.qr_code_url) {
      // Display actual QR code image
      return (
        <div className="pt-2 flex justify-center">
          <img
            src={qrCodeData.qr_code_url}
            alt="QR Code"
            className="w-16 h-16 object-contain"
            style={{
              filter: colors.textColor !== 'black' ? `invert(1)` : 'none'
            }}
          />
        </div>
      );
    } else {
      // Display placeholder QR code
      return (
        <div className="pt-2 flex justify-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center text-white text-xs" style={{ backgroundColor: colors.textColor }}>
            <div className="text-center leading-tight">
              <div>QR</div>
              <div className="text-[6px]">Scan me</div>
            </div>
          </div>
        </div>
      );
    }
  };

  // Helper function to render Arabic QR code
  const renderArabicQRCode = (colors: any) => {
    if (qrCodeData && qrCodeData.qr_code_url) {
      // Display actual QR code image
      return (
        <div className="pt-2 flex justify-center">
          <img
            src={qrCodeData.qr_code_url}
            alt="QR Code"
            className="w-16 h-16 object-contain"
            style={{
              filter: colors.textColor !== 'black' ? `invert(1)` : 'none'
            }}
          />
        </div>
      );
    } else {
      // Display placeholder QR code with Arabic text
      return (
        <div className="pt-2 flex justify-center">
          <div className="w-16 h-16 bg-black flex items-center justify-center text-white text-xs" style={{ backgroundColor: colors.textColor }}>
            <div className="text-center leading-tight">
              <div>QR</div>
              <div className="text-[6px]">امسح</div>
            </div>
          </div>
        </div>
      );
    }
  };

  // FDA Vertical Template (Traditional Layout)
  const renderFDAVertical = () => {
    const colors = getLabelColors();
    const alignment = getLabelAlignment();
    const width = getLabelWidth();
    
    return (
      <Card
        id="fda-nutrition-label"
        className={cn(
          "mx-auto border-2 border-black shadow-lg rounded-none",
          className
        )}
        style={{
          maxWidth: `${width}px`,
          backgroundColor: colors.backgroundColor,
          color: colors.textColor
        }}
      >
        <div className={cn("p-3", alignment)}>
          {/* Header */}
          <div className="border-b-8 border-black pb-1 mb-2">
            <h1 className={cn(
              "text-3xl font-black text-center tracking-tight",
              customization.removeUppercase || customization.makeLowercase ? "" : "uppercase"
            )} style={{ color: colors.textColor }}>
              {formatText(t.nutritionFacts)}
            </h1>
            <div className="text-sm font-medium" style={{ color: colors.textColor }}>
              {nutritionData.servings} {formatText(t.servingsPerContainer)}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold" style={{ color: colors.textColor }}>
                {formatText(t.servingSize)}
              </span>
              <span className="text-base font-bold" style={{ color: colors.textColor }}>
                {nutritionData.servingSize} ({nutritionData.servingSizeGrams}{t.units.g})
              </span>
            </div>
          </div>

          {/* Amount Per Serving */}
          <div className="mb-1">
            <div className="flex items-baseline justify-start">
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>{t.amountPerServing}</span>
            </div>
          </div>

          {/* Calories */}
          <div className="border-b-8 border-black pb-1 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black" style={{ color: colors.textColor }}>{formatText(t.calories)}</span>
              <span className="text-4xl font-black" style={{ color: colors.textColor }}>{nutritionData.calories}</span>
            </div>
          </div>

          {/* % Daily Value */}
          <div className="flex mb-1 justify-end">
            <span className="text-sm font-bold" style={{ color: colors.textColor }}>{t.dailyValue}</span>
          </div>

          {/* Nutrients */}
          <div className="space-y-0">
            {/* Total Fat */}
            <div className="flex border-b border-black py-1 justify-between">
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                {formatText(t.totalFat)} {nutritionData.totalFat}{t.units.g}
              </span>
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                {calculateDV('totalFat', nutritionData.totalFat, nutritionData.totalFatDV)}%
              </span>
            </div>

             {/* Saturated Fat */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm pl-4" style={{ color: colors.textColor }}>
                 {formatText(t.saturatedFat)} {nutritionData.saturatedFat}{t.units.g}
               </span>
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {calculateDV('saturatedFat', nutritionData.saturatedFat, nutritionData.saturatedFatDV)}%
               </span>
             </div>

             {/* Trans Fat */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm pl-4" style={{ color: colors.textColor }}>
                 <em>{formatText(t.transFat)}</em> {nutritionData.transFat}{t.units.g}
               </span>
               <span className="text-sm" style={{ color: colors.textColor }}></span>
             </div>

             {/* Cholesterol */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.cholesterol)} {nutritionData.cholesterol}{t.units.mg}
               </span>
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {calculateDV('cholesterol', nutritionData.cholesterol, nutritionData.cholesterolDV)}%
               </span>
             </div>

             {/* Sodium */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.sodium)} {nutritionData.sodium}{t.units.mg}
               </span>
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {calculateDV('sodium', nutritionData.sodium, nutritionData.sodiumDV)}%
               </span>
             </div>

             {/* Total Carbohydrate */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.totalCarbohydrate)} {nutritionData.totalCarbohydrate}{t.units.g}
               </span>
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {calculateDV('totalCarbohydrate', nutritionData.totalCarbohydrate, nutritionData.totalCarbohydrateDV)}%
               </span>
             </div>

             {/* Dietary Fiber */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm pl-4" style={{ color: colors.textColor }}>
                 {formatText(t.dietaryFiber)} {nutritionData.dietaryFiber}{t.units.g}
               </span>
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {calculateDV('dietaryFiber', nutritionData.dietaryFiber, nutritionData.dietaryFiberDV)}%
               </span>
             </div>

             {/* Total Sugars */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm pl-4" style={{ color: colors.textColor }}>
                 {formatText(t.totalSugars)} {nutritionData.totalSugars}{t.units.g}
               </span>
               <span className="text-sm" style={{ color: colors.textColor }}></span>
             </div>

             {/* Added Sugars */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm pl-8" style={{ color: colors.textColor }}>
                 {formatText(t.includes)} {nutritionData.addedSugars}{t.units.g} {formatText(t.addedSugars)}
               </span>
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {calculateDV('addedSugars', nutritionData.addedSugars)}%
               </span>
             </div>

             {/* Optional Nutrients */}
             {renderOptionalNutrients(colors)}

             {/* Protein */}
             <div className="flex border-b-4 border-black py-1 justify-between">
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.protein)} {nutritionData.protein}{t.units.g}
               </span>
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {selectedOptionalNutrients.includes('proteinPercentage') ?
                   `${calculateDV('protein', nutritionData.protein, nutritionData.proteinDV)}%` :
                   ''
                 }
               </span>
             </div>

             {/* Vitamins and Minerals */}
             <div className="border-b-4 border-black py-1">
               {renderSelectedVitamins(colors)}
             </div>
          </div>

          {/* Footer */}
          <div className="pt-2">
            <p className="text-xs leading-tight text-left" style={{ color: colors.textColor }}>
              {t.footer}
            </p>
          </div>

          {/* Conditional Sections */}
          {!customization.hideIngredientList && (
            <div className="pt-2 border-t border-black mt-2">
              <p className="text-xs font-bold" style={{ color: colors.textColor }}>
                INGREDIENTS: {renderIngredientList(colors)}
              </p>
            </div>
          )}

          {!customization.hideBusinessInfo && (
            <div className="pt-1">
              <p className="text-xs" style={{ color: colors.textColor }}>
                Manufactured by: {renderBusinessInfo(colors)}
              </p>
            </div>
          )}

          {!customization.hideAllergens && realAllergens.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold" style={{ color: colors.textColor }}>
                CONTAINS: {renderAllergenInfo(colors)}
              </p>
            </div>
          )}

          {customization.showQRCode && renderQRCode(colors)}
        </div>
      </Card>
    );
  };

  // FDA Linear Template (Horizontal Compact Layout)
  const renderFDALinear = () => {
    const colors = getLabelColors();
    const width = getLabelWidth();
    
    return (
      <Card
        id="fda-nutrition-label"
        className={cn(
          "mx-auto border-2 border-black shadow-lg rounded-none",
          className
        )}
        style={{
          maxWidth: `${width}px`,
          backgroundColor: colors.backgroundColor,
          color: colors.textColor
        }}
      >
        <div className="p-3">
          {/* Header */}
          <div className="border-b-4 border-black pb-1 mb-2">
            <h1 className={cn(
              "text-xl font-black text-center tracking-tight",
              customization.removeUppercase || customization.makeLowercase ? "" : "uppercase"
            )} style={{ color: colors.textColor }}>
              {formatText(t.nutritionFacts)}
            </h1>
            <div className="text-xs font-medium text-center" style={{ color: colors.textColor }}>
              {nutritionData.servings} {formatText(t.servingsPerContainer)} | {formatText(t.servingSize)} {nutritionData.servingSize} ({nutritionData.servingSizeGrams}{t.units.g})
            </div>
          </div>

          {/* Linear Format - All nutrients in paragraph style */}
          <div className="text-sm leading-relaxed" style={{ color: colors.textColor }}>
            <span className="font-bold">{formatText(t.calories)} {nutritionData.calories}</span>
            {', '}
            <span>{formatText(t.totalFat)} {nutritionData.totalFat}{t.units.g} ({calculateDV('totalFat', nutritionData.totalFat, nutritionData.totalFatDV)}% DV)</span>
            {', '}
            <span>{formatText(t.saturatedFat)} {nutritionData.saturatedFat}{t.units.g} ({calculateDV('saturatedFat', nutritionData.saturatedFat, nutritionData.saturatedFatDV)}% DV)</span>
            {', '}
            <span>{formatText(t.transFat)} {nutritionData.transFat}{t.units.g}</span>
            {', '}
            <span>{formatText(t.cholesterol)} {nutritionData.cholesterol}{t.units.mg} ({calculateDV('cholesterol', nutritionData.cholesterol, nutritionData.cholesterolDV)}% DV)</span>
            {', '}
            <span>{formatText(t.sodium)} {nutritionData.sodium}{t.units.mg} ({calculateDV('sodium', nutritionData.sodium, nutritionData.sodiumDV)}% DV)</span>
            {', '}
            <span>{formatText(t.totalCarbohydrate)} {nutritionData.totalCarbohydrate}{t.units.g} ({calculateDV('totalCarbohydrate', nutritionData.totalCarbohydrate, nutritionData.totalCarbohydrateDV)}% DV)</span>
            {', '}
            <span>{formatText(t.dietaryFiber)} {nutritionData.dietaryFiber}{t.units.g} ({calculateDV('dietaryFiber', nutritionData.dietaryFiber, nutritionData.dietaryFiberDV)}% DV)</span>
            {', '}
            <span>{formatText(t.totalSugars)} {nutritionData.totalSugars}{t.units.g}</span>
            {', '}
            <span>{formatText(t.addedSugars)} {nutritionData.addedSugars}{t.units.g} ({calculateDV('addedSugars', nutritionData.addedSugars)}% DV)</span>
            {selectedOptionalNutrients.map((nutrientId) => {
              switch (nutrientId) {
                case 'monounsaturatedFat':
                  return <span key={nutrientId}>{', '}{formatText('Monounsaturated Fat')} {nutritionData.monounsaturatedFat || 0}{t.units.g}</span>;
                case 'polyunsaturatedFat':
                  return <span key={nutrientId}>{', '}{formatText('Polyunsaturated Fat')} {nutritionData.polyunsaturatedFat || 0}{t.units.g}</span>;
                case 'sugarAlcohol':
                  return <span key={nutrientId}>{', '}{formatText('Sugar Alcohol')} {nutritionData.sugarAlcohol || 0}{t.units.g}</span>;
                default:
                  return null;
              }
            })}
            {', '}
            <span className="font-bold">
              {formatText(t.protein)} {nutritionData.protein}{t.units.g}
              {selectedOptionalNutrients.includes('proteinPercentage') &&
                ` (${calculateDV('protein', nutritionData.protein, nutritionData.proteinDV)}% DV)`
              }
            </span>
            {selectedVitamins.length > 0 && ', '}
            {selectedVitamins.map((vitaminId, index) => {
              const vitaminMap: Record<string, { label: string; amount: number; unit: string; dv: number }> = {
                vitaminA: { label: 'Vitamin A', amount: nutritionData.vitaminA || 0, unit: 'mcg', dv: calculateDV('vitaminA', nutritionData.vitaminA || 0, nutritionData.vitaminADV) },
                vitaminC: { label: 'Vitamin C', amount: nutritionData.vitaminC || 0, unit: 'mg', dv: calculateDV('vitaminC', nutritionData.vitaminC || 0, nutritionData.vitaminCDV) },
                vitaminD: { label: 'Vitamin D', amount: nutritionData.vitaminD || 0, unit: 'mcg', dv: calculateDV('vitaminD', nutritionData.vitaminD || 0, nutritionData.vitaminDDV) },
                vitaminE: { label: 'Vitamin E', amount: nutritionData.vitaminE || 0, unit: 'mg', dv: calculateDV('vitaminE', nutritionData.vitaminE || 0, nutritionData.vitaminEDV) },
                vitaminK: { label: 'Vitamin K', amount: nutritionData.vitaminK || 0, unit: 'mcg', dv: calculateDV('vitaminK', nutritionData.vitaminK || 0, nutritionData.vitaminKDV) },
                thiamin: { label: 'Thiamin', amount: nutritionData.thiamin || 0, unit: 'mg', dv: calculateDV('thiamin', nutritionData.thiamin || 0, nutritionData.thiaminDV) },
                riboflavin: { label: 'Riboflavin', amount: nutritionData.riboflavin || 0, unit: 'mg', dv: calculateDV('riboflavin', nutritionData.riboflavin || 0, nutritionData.riboflavinDV) },
                niacin: { label: 'Niacin', amount: nutritionData.niacin || 0, unit: 'mg', dv: calculateDV('niacin', nutritionData.niacin || 0, nutritionData.niacinDV) },
                vitaminB6: { label: 'Vitamin B6', amount: nutritionData.vitaminB6 || 0, unit: 'mg', dv: calculateDV('vitaminB6', nutritionData.vitaminB6 || 0, nutritionData.vitaminB6DV) },
                folate: { label: 'Folate', amount: nutritionData.folate || 0, unit: 'mcg', dv: calculateDV('folate', nutritionData.folate || 0, nutritionData.folateDV) },
                vitaminB12: { label: 'Vitamin B12', amount: nutritionData.vitaminB12 || 0, unit: 'mcg', dv: calculateDV('vitaminB12', nutritionData.vitaminB12 || 0, nutritionData.vitaminB12DV) },
                pantothenicAcid: { label: 'Pantothenic Acid', amount: nutritionData.pantothenicAcid || 0, unit: 'mg', dv: calculateDV('pantothenicAcid', nutritionData.pantothenicAcid || 0, nutritionData.pantothenicAcidDV) },
                calcium: { label: 'Calcium', amount: nutritionData.calcium || 0, unit: 'mg', dv: calculateDV('calcium', nutritionData.calcium || 0, nutritionData.calciumDV) },
                iron: { label: 'Iron', amount: nutritionData.iron || 0, unit: 'mg', dv: calculateDV('iron', nutritionData.iron || 0, nutritionData.ironDV) },
                potassium: { label: 'Potassium', amount: nutritionData.potassium || 0, unit: 'mg', dv: calculateDV('potassium', nutritionData.potassium || 0, nutritionData.potassiumDV) },
                phosphorus: { label: 'Phosphorus', amount: nutritionData.phosphorus || 0, unit: 'mg', dv: calculateDV('phosphorus', nutritionData.phosphorus || 0, nutritionData.phosphorusDV) },
                magnesium: { label: 'Magnesium', amount: nutritionData.magnesium || 0, unit: 'mg', dv: calculateDV('magnesium', nutritionData.magnesium || 0, nutritionData.magnesiumDV) },
                zinc: { label: 'Zinc', amount: nutritionData.zinc || 0, unit: 'mg', dv: calculateDV('zinc', nutritionData.zinc || 0, nutritionData.zincDV) },
                selenium: { label: 'Selenium', amount: nutritionData.selenium || 0, unit: 'mcg', dv: calculateDV('selenium', nutritionData.selenium || 0, nutritionData.seleniumDV) },
                copper: { label: 'Copper', amount: nutritionData.copper || 0, unit: 'mg', dv: calculateDV('copper', nutritionData.copper || 0, nutritionData.copperDV) },
                manganese: { label: 'Manganese', amount: nutritionData.manganese || 0, unit: 'mg', dv: calculateDV('manganese', nutritionData.manganese || 0, nutritionData.manganeseDV) }
              };
              
              const vitamin = vitaminMap[vitaminId];
              if (!vitamin) return null;
              
              return (
                <span key={vitaminId}>
                  {formatText(vitamin.label)} {vitamin.amount}{vitamin.unit} ({vitamin.dv}% DV)
                  {index < selectedVitamins.length - 1 ? ', ' : ''}
                </span>
              );
            })}
            {'. '}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-black mt-2">
            <p className="text-xs leading-tight" style={{ color: colors.textColor }}>
              {t.footer}
            </p>
          </div>

          {/* Conditional Sections */}
          {!customization.hideIngredientList && (
            <div className="pt-2 border-t border-black mt-2">
              <p className="text-xs font-bold" style={{ color: colors.textColor }}>
                INGREDIENTS: {renderIngredientList(colors)}
              </p>
            </div>
          )}

          {!customization.hideBusinessInfo && (
            <div className="pt-1">
              <p className="text-xs" style={{ color: colors.textColor }}>
                Manufactured by: {renderBusinessInfo(colors)}
              </p>
            </div>
          )}

          {!customization.hideAllergens && realAllergens.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold" style={{ color: colors.textColor }}>
                CONTAINS: {renderAllergenInfo(colors)}
              </p>
            </div>
          )}

          {customization.showQRCode && renderQRCode(colors)}
        </div>
      </Card>
    );
  };

  // FDA Tabular Template (Table Format)
  const renderFDATabular = () => {
    const colors = getLabelColors();
    const width = getLabelWidth();
    
    return (
      <Card
        id="fda-nutrition-label"
        className={cn(
          "mx-auto border-2 border-black shadow-lg rounded-none",
          className
        )}
        style={{
          maxWidth: `${width}px`,
          backgroundColor: colors.backgroundColor,
          color: colors.textColor
        }}
      >
        <div className="p-3">
          {/* Header */}
          <div className="border-b-4 border-black pb-1 mb-2">
            <h1 className={cn(
              "text-2xl font-black text-center tracking-tight",
              customization.removeUppercase || customization.makeLowercase ? "" : "uppercase"
            )} style={{ color: colors.textColor }}>
              {formatText(t.nutritionFacts)}
            </h1>
            <div className="text-sm font-medium text-center" style={{ color: colors.textColor }}>
              {nutritionData.servings} {formatText(t.servingsPerContainer)} | {formatText(t.servingSize)} {nutritionData.servingSize} ({nutritionData.servingSizeGrams}{t.units.g})
            </div>
          </div>

          {/* Table Format */}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left font-bold py-1" style={{ color: colors.textColor }}>Nutrient</th>
                <th className="text-right font-bold py-1" style={{ color: colors.textColor }}>Amount</th>
                <th className="text-right font-bold py-1" style={{ color: colors.textColor }}>% DV</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.calories)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.calories}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>-</td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.totalFat)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.totalFat}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('totalFat', nutritionData.totalFat, nutritionData.totalFatDV)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="pl-4 py-1" style={{ color: colors.textColor }}>{formatText(t.saturatedFat)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.saturatedFat}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('saturatedFat', nutritionData.saturatedFat, nutritionData.saturatedFatDV)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="pl-4 py-1" style={{ color: colors.textColor }}><em>{formatText(t.transFat)}</em></td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.transFat}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>-</td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.cholesterol)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.cholesterol}{t.units.mg}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('cholesterol', nutritionData.cholesterol, nutritionData.cholesterolDV)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.sodium)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.sodium}{t.units.mg}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('sodium', nutritionData.sodium, nutritionData.sodiumDV)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.totalCarbohydrate)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.totalCarbohydrate}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('totalCarbohydrate', nutritionData.totalCarbohydrate, nutritionData.totalCarbohydrateDV)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="pl-4 py-1" style={{ color: colors.textColor }}>{formatText(t.dietaryFiber)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.dietaryFiber}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('dietaryFiber', nutritionData.dietaryFiber, nutritionData.dietaryFiberDV)}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="pl-4 py-1" style={{ color: colors.textColor }}>{formatText(t.totalSugars)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.totalSugars}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>-</td>
              </tr>
              <tr className="border-b border-black">
                <td className="pl-8 py-1" style={{ color: colors.textColor }}>{formatText(t.addedSugars)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.addedSugars}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('addedSugars', nutritionData.addedSugars)}%</td>
              </tr>
              {/* Optional Nutrients */}
              {selectedOptionalNutrients.map((nutrientId) => {
                switch (nutrientId) {
                  case 'monounsaturatedFat':
                    return (
                      <tr key={nutrientId} className="border-b border-black">
                        <td className="pl-4 py-1" style={{ color: colors.textColor }}>{formatText('Monounsaturated Fat')}</td>
                        <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.monounsaturatedFat || 0}{t.units.g}</td>
                        <td className="text-right py-1" style={{ color: colors.textColor }}>-</td>
                      </tr>
                    );
                  case 'polyunsaturatedFat':
                    return (
                      <tr key={nutrientId} className="border-b border-black">
                        <td className="pl-4 py-1" style={{ color: colors.textColor }}>{formatText('Polyunsaturated Fat')}</td>
                        <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.polyunsaturatedFat || 0}{t.units.g}</td>
                        <td className="text-right py-1" style={{ color: colors.textColor }}>-</td>
                      </tr>
                    );
                  case 'sugarAlcohol':
                    return (
                      <tr key={nutrientId} className="border-b border-black">
                        <td className="pl-4 py-1" style={{ color: colors.textColor }}>{formatText('Sugar Alcohol')}</td>
                        <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.sugarAlcohol || 0}{t.units.g}</td>
                        <td className="text-right py-1" style={{ color: colors.textColor }}>-</td>
                      </tr>
                    );
                  default:
                    return null;
                }
              })}
              <tr className="border-b-2 border-black">
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.protein)}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.protein}{t.units.g}</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>
                  {selectedOptionalNutrients.includes('proteinPercentage') ?
                    `${calculateDV('protein', nutritionData.protein, nutritionData.proteinDV)}%` :
                    '-'
                  }
                </td>
              </tr>
              {/* Vitamins and Minerals */}
              {selectedVitamins.map((vitaminId) => {
                const vitaminMap: Record<string, { label: string; amount: number; unit: string; dv: number }> = {
                  vitaminA: { label: 'Vitamin A', amount: nutritionData.vitaminA || 0, unit: 'mcg', dv: calculateDV('vitaminA', nutritionData.vitaminA || 0, nutritionData.vitaminADV) },
                  vitaminC: { label: 'Vitamin C', amount: nutritionData.vitaminC || 0, unit: 'mg', dv: calculateDV('vitaminC', nutritionData.vitaminC || 0, nutritionData.vitaminCDV) },
                  vitaminD: { label: 'Vitamin D', amount: nutritionData.vitaminD || 0, unit: 'mcg', dv: calculateDV('vitaminD', nutritionData.vitaminD || 0, nutritionData.vitaminDDV) },
                  vitaminE: { label: 'Vitamin E', amount: nutritionData.vitaminE || 0, unit: 'mg', dv: calculateDV('vitaminE', nutritionData.vitaminE || 0, nutritionData.vitaminEDV) },
                  vitaminK: { label: 'Vitamin K', amount: nutritionData.vitaminK || 0, unit: 'mcg', dv: calculateDV('vitaminK', nutritionData.vitaminK || 0, nutritionData.vitaminKDV) },
                  thiamin: { label: 'Thiamin', amount: nutritionData.thiamin || 0, unit: 'mg', dv: calculateDV('thiamin', nutritionData.thiamin || 0, nutritionData.thiaminDV) },
                  riboflavin: { label: 'Riboflavin', amount: nutritionData.riboflavin || 0, unit: 'mg', dv: calculateDV('riboflavin', nutritionData.riboflavin || 0, nutritionData.riboflavinDV) },
                  niacin: { label: 'Niacin', amount: nutritionData.niacin || 0, unit: 'mg', dv: calculateDV('niacin', nutritionData.niacin || 0, nutritionData.niacinDV) },
                  vitaminB6: { label: 'Vitamin B6', amount: nutritionData.vitaminB6 || 0, unit: 'mg', dv: calculateDV('vitaminB6', nutritionData.vitaminB6 || 0, nutritionData.vitaminB6DV) },
                  folate: { label: 'Folate', amount: nutritionData.folate || 0, unit: 'mcg', dv: calculateDV('folate', nutritionData.folate || 0, nutritionData.folateDV) },
                  vitaminB12: { label: 'Vitamin B12', amount: nutritionData.vitaminB12 || 0, unit: 'mcg', dv: calculateDV('vitaminB12', nutritionData.vitaminB12 || 0, nutritionData.vitaminB12DV) },
                  pantothenicAcid: { label: 'Pantothenic Acid', amount: nutritionData.pantothenicAcid || 0, unit: 'mg', dv: calculateDV('pantothenicAcid', nutritionData.pantothenicAcid || 0, nutritionData.pantothenicAcidDV) },
                  calcium: { label: 'Calcium', amount: nutritionData.calcium || 0, unit: 'mg', dv: calculateDV('calcium', nutritionData.calcium || 0, nutritionData.calciumDV) },
                  iron: { label: 'Iron', amount: nutritionData.iron || 0, unit: 'mg', dv: calculateDV('iron', nutritionData.iron || 0, nutritionData.ironDV) },
                  potassium: { label: 'Potassium', amount: nutritionData.potassium || 0, unit: 'mg', dv: calculateDV('potassium', nutritionData.potassium || 0, nutritionData.potassiumDV) },
                  phosphorus: { label: 'Phosphorus', amount: nutritionData.phosphorus || 0, unit: 'mg', dv: calculateDV('phosphorus', nutritionData.phosphorus || 0, nutritionData.phosphorusDV) },
                  magnesium: { label: 'Magnesium', amount: nutritionData.magnesium || 0, unit: 'mg', dv: calculateDV('magnesium', nutritionData.magnesium || 0, nutritionData.magnesiumDV) },
                  zinc: { label: 'Zinc', amount: nutritionData.zinc || 0, unit: 'mg', dv: calculateDV('zinc', nutritionData.zinc || 0, nutritionData.zincDV) },
                  selenium: { label: 'Selenium', amount: nutritionData.selenium || 0, unit: 'mcg', dv: calculateDV('selenium', nutritionData.selenium || 0, nutritionData.seleniumDV) },
                  copper: { label: 'Copper', amount: nutritionData.copper || 0, unit: 'mg', dv: calculateDV('copper', nutritionData.copper || 0, nutritionData.copperDV) },
                  manganese: { label: 'Manganese', amount: nutritionData.manganese || 0, unit: 'mg', dv: calculateDV('manganese', nutritionData.manganese || 0, nutritionData.manganeseDV) }
                };

                const vitamin = vitaminMap[vitaminId];
                if (!vitamin) return null;

                return (
                  <tr key={vitaminId} className="border-b border-black">
                    <td className="py-1" style={{ color: colors.textColor }}>{formatText(vitamin.label)}</td>
                    <td className="text-right py-1" style={{ color: colors.textColor }}>{vitamin.amount}{vitamin.unit}</td>
                    <td className="text-right py-1" style={{ color: colors.textColor }}>{vitamin.dv}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div className="pt-2 border-t border-black mt-2">
            <p className="text-xs leading-tight" style={{ color: colors.textColor }}>
              {t.footer}
            </p>
          </div>

          {/* Conditional Sections */}
          {!customization.hideIngredientList && (
            <div className="pt-2 border-t border-black mt-2">
              <p className="text-xs font-bold" style={{ color: colors.textColor }}>
                INGREDIENTS: {renderIngredientList(colors)}
              </p>
            </div>
          )}

          {!customization.hideBusinessInfo && (
            <div className="pt-1">
              <p className="text-xs" style={{ color: colors.textColor }}>
                Manufactured by: {renderBusinessInfo(colors)}
              </p>
            </div>
          )}

          {!customization.hideAllergens && realAllergens.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold" style={{ color: colors.textColor }}>
                CONTAINS: {renderAllergenInfo(colors)}
              </p>
            </div>
          )}

          {customization.showQRCode && renderQRCode(colors)}
        </div>
      </Card>
    );
  };

  // Render English (LTR) Layout - Legacy function for backward compatibility
  const renderEnglishLayout = () => renderFDAVertical();

  // Render Arabic (RTL) Layout with full customization support
  const renderArabicLayout = () => {
    // Support different label types for Arabic
    switch (customization.labelType) {
      case 'FDA Linear':
        return renderArabicLinear();
      case 'FDA Tabular':
        return renderArabicTabular();
      case 'FDA Vertical':
      default:
        return renderArabicVertical();
    }
  };

  // Arabic Vertical Layout
  const renderArabicVertical = () => {
    const colors = getLabelColors();
    const alignment = getLabelAlignment();
    const width = getLabelWidth();
    
    return (
      <Card
        id="fda-nutrition-label"
        className={cn(
          "mx-auto border-2 border-black shadow-lg rounded-none",
          className
        )}
        style={{
          maxWidth: `${width}px`,
          backgroundColor: colors.backgroundColor,
          color: colors.textColor
        }}>
        <div className={cn("p-3", alignment)} dir="rtl">
          {/* Header - Fixed Arabic layout with proper spacing */}
          <div className="border-b-8 border-black pb-2 mb-3">
            <h1 className={cn(
              "text-2xl font-black text-center tracking-tight mb-2",
              customization.removeUppercase || customization.makeLowercase ? "" : "uppercase"
            )} style={{ color: colors.textColor, lineHeight: '1.2' }}>
              {formatText(t.nutritionFacts)}
            </h1>
            <div className="text-sm font-medium text-right mb-1" style={{ color: colors.textColor }}>
              {t.servingsPerContainer} {nutritionData.servings}
            </div>
            <div className="flex items-baseline justify-between flex-wrap gap-1">
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                ({nutritionData.servingSizeGrams}{t.units.g}) {nutritionData.servingSize}
              </span>
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>{t.servingSize}</span>
            </div>
          </div>

          {/* Amount Per Serving */}
          <div className="mb-1">
            <div className="flex items-baseline justify-end">
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>{t.amountPerServing}</span>
            </div>
          </div>

          {/* Calories */}
          <div className="border-b-8 border-black pb-1 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-4xl font-black" style={{ color: colors.textColor }}>{nutritionData.calories}</span>
              <span className="text-2xl font-black" style={{ color: colors.textColor }}>{formatText(t.calories)}</span>
            </div>
          </div>

          {/* % Daily Value */}
          <div className="flex mb-1 justify-start">
            <span className="text-sm font-bold" style={{ color: colors.textColor }}>{t.dailyValue}</span>
          </div>

          {/* Nutrients */}
          <div className="space-y-0">
            {/* Total Fat */}
            <div className="flex border-b border-black py-1 justify-between">
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                {calculateDV('totalFat', nutritionData.totalFat, nutritionData.totalFatDV)}%
              </span>
              <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                {formatText(t.totalFat)} {nutritionData.totalFat}{t.units.g}
              </span>
            </div>

             {/* Saturated Fat */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {calculateDV('saturatedFat', nutritionData.saturatedFat, nutritionData.saturatedFatDV)}%
               </span>
               <span className="text-sm pr-4" style={{ color: colors.textColor }}>
                 {formatText(t.saturatedFat)} {nutritionData.saturatedFat}{t.units.g}
               </span>
             </div>

             {/* Trans Fat */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm" style={{ color: colors.textColor }}></span>
               <span className="text-sm pr-4" style={{ color: colors.textColor }}>
                 <em>{formatText(t.transFat)}</em> {nutritionData.transFat}{t.units.g}
               </span>
             </div>

             {/* Cholesterol */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {calculateDV('cholesterol', nutritionData.cholesterol, nutritionData.cholesterolDV)}%
               </span>
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.cholesterol)} {nutritionData.cholesterol}{t.units.mg}
               </span>
             </div>

             {/* Sodium */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {calculateDV('sodium', nutritionData.sodium, nutritionData.sodiumDV)}%
               </span>
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.sodium)} {nutritionData.sodium}{t.units.mg}
               </span>
             </div>

             {/* Total Carbohydrate */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {calculateDV('totalCarbohydrate', nutritionData.totalCarbohydrate, nutritionData.totalCarbohydrateDV)}%
               </span>
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.totalCarbohydrate)} {nutritionData.totalCarbohydrate}{t.units.g}
               </span>
             </div>

             {/* Dietary Fiber */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {calculateDV('dietaryFiber', nutritionData.dietaryFiber, nutritionData.dietaryFiberDV)}%
               </span>
               <span className="text-sm pr-4" style={{ color: colors.textColor }}>
                 {formatText(t.dietaryFiber)} {nutritionData.dietaryFiber}{t.units.g}
               </span>
             </div>

             {/* Total Sugars */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm" style={{ color: colors.textColor }}></span>
               <span className="text-sm pr-4" style={{ color: colors.textColor }}>
                 {formatText(t.totalSugars)} {nutritionData.totalSugars}{t.units.g}
               </span>
             </div>

             {/* Added Sugars */}
             <div className="flex border-b border-black py-1 justify-between">
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {calculateDV('addedSugars', nutritionData.addedSugars)}%
               </span>
               <span className="text-sm pr-8" style={{ color: colors.textColor }}>
                 {formatText(t.includes)} {nutritionData.addedSugars}{t.units.g} {formatText(t.addedSugars)}
               </span>
             </div>

             {/* Optional Nutrients */}
             {renderOptionalNutrients(colors)}

             {/* Protein */}
             <div className="flex border-b-4 border-black py-1 justify-between">
               <span className="text-sm" style={{ color: colors.textColor }}>
                 {selectedOptionalNutrients.includes('proteinPercentage') ?
                   `${calculateDV('protein', nutritionData.protein, nutritionData.proteinDV)}%` :
                   ''
                 }
               </span>
               <span className="text-sm font-bold" style={{ color: colors.textColor }}>
                 {formatText(t.protein)} {nutritionData.protein}{t.units.g}
               </span>
             </div>

             {/* Vitamins and Minerals */}
             <div className="border-b-4 border-black py-1">
               {renderSelectedVitamins(colors)}
             </div>
          </div>

          {/* Footer */}
          <div className="pt-2">
            <p className="text-xs leading-tight text-right" style={{ color: colors.textColor }}>
              {t.footer}
            </p>
          </div>

          {/* Conditional Sections */}
          {!customization.hideIngredientList && (
            <div className="pt-2 border-t border-black mt-2">
              <p className="text-xs font-bold text-right" style={{ color: colors.textColor }}>
                المكونات: {renderIngredientList(colors)}
              </p>
            </div>
          )}

          {!customization.hideBusinessInfo && (
            <div className="pt-1">
              <p className="text-xs text-right" style={{ color: colors.textColor }}>
                مُصنع بواسطة: {renderBusinessInfo(colors)}
              </p>
            </div>
          )}

          {!customization.hideAllergens && realAllergens.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold text-right" style={{ color: colors.textColor }}>
                يحتوي على: {renderAllergenInfo(colors)}
              </p>
            </div>
          )}

          {customization.showQRCode && renderArabicQRCode(colors)}
        </div>
      </Card>
    );
  };

  // Arabic Linear Layout
  const renderArabicLinear = () => {
    const colors = getLabelColors();
    const width = getLabelWidth();
    
    return (
      <Card
        id="fda-nutrition-label"
        className={cn(
          "mx-auto border-2 border-black shadow-lg rounded-none",
          className
        )}
        style={{
          maxWidth: `${width}px`,
          backgroundColor: colors.backgroundColor,
          color: colors.textColor
        }}
      >
        <div className="p-3" dir="rtl">
          {/* Header */}
          <div className="border-b-4 border-black pb-1 mb-2">
            <h1 className={cn(
              "text-xl font-black text-center tracking-tight",
              customization.removeUppercase || customization.makeLowercase ? "" : "uppercase"
            )} style={{ color: colors.textColor }}>
              {formatText(t.nutritionFacts)}
            </h1>
            <div className="text-xs font-medium text-center" style={{ color: colors.textColor }}>
              {t.servingsPerContainer} {nutritionData.servings} | {formatText(t.servingSize)} {nutritionData.servingSize} ({nutritionData.servingSizeGrams}{t.units.g})
            </div>
          </div>

          {/* Linear Format - All nutrients in paragraph style (RTL) */}
          <div className="text-sm leading-relaxed text-right" style={{ color: colors.textColor }}>
            <span className="font-bold">{formatText(t.calories)} {nutritionData.calories}</span>
            {', '}
            <span>{formatText(t.totalFat)} {nutritionData.totalFat}{t.units.g} ({calculateDV('totalFat', nutritionData.totalFat, nutritionData.totalFatDV)}% DV)</span>
            {', '}
            <span>{formatText(t.saturatedFat)} {nutritionData.saturatedFat}{t.units.g} ({calculateDV('saturatedFat', nutritionData.saturatedFat, nutritionData.saturatedFatDV)}% DV)</span>
            {', '}
            <span>{formatText(t.transFat)} {nutritionData.transFat}{t.units.g}</span>
            {', '}
            <span>{formatText(t.cholesterol)} {nutritionData.cholesterol}{t.units.mg} ({calculateDV('cholesterol', nutritionData.cholesterol, nutritionData.cholesterolDV)}% DV)</span>
            {', '}
            <span>{formatText(t.sodium)} {nutritionData.sodium}{t.units.mg} ({calculateDV('sodium', nutritionData.sodium, nutritionData.sodiumDV)}% DV)</span>
            {', '}
            <span>{formatText(t.totalCarbohydrate)} {nutritionData.totalCarbohydrate}{t.units.g} ({calculateDV('totalCarbohydrate', nutritionData.totalCarbohydrate, nutritionData.totalCarbohydrateDV)}% DV)</span>
            {', '}
            <span>{formatText(t.dietaryFiber)} {nutritionData.dietaryFiber}{t.units.g} ({calculateDV('dietaryFiber', nutritionData.dietaryFiber, nutritionData.dietaryFiberDV)}% DV)</span>
            {', '}
            <span>{formatText(t.totalSugars)} {nutritionData.totalSugars}{t.units.g}</span>
            {', '}
            <span>{formatText(t.addedSugars)} {nutritionData.addedSugars}{t.units.g} ({calculateDV('addedSugars', nutritionData.addedSugars)}% DV)</span>
            {', '}
            <span className="font-bold">
              {formatText(t.protein)} {nutritionData.protein}{t.units.g}
              {selectedOptionalNutrients.includes('proteinPercentage') &&
                ` (${calculateDV('protein', nutritionData.protein, nutritionData.proteinDV)}% DV)`
              }
            </span>
            {selectedVitamins.length > 0 && ', '}
            {selectedVitamins.map((vitaminId, index) => {
              const vitaminMap: Record<string, { label: string; amount: number; unit: string; dv: number }> = {
                vitaminA: { label: t.vitaminA, amount: nutritionData.vitaminA || 0, unit: t.units.mcg, dv: calculateDV('vitaminA', nutritionData.vitaminA || 0, nutritionData.vitaminADV) },
                vitaminC: { label: t.vitaminC, amount: nutritionData.vitaminC || 0, unit: t.units.mg, dv: calculateDV('vitaminC', nutritionData.vitaminC || 0, nutritionData.vitaminCDV) },
                vitaminD: { label: t.vitaminD, amount: nutritionData.vitaminD || 0, unit: t.units.mcg, dv: calculateDV('vitaminD', nutritionData.vitaminD || 0, nutritionData.vitaminDDV) },
                calcium: { label: t.calcium, amount: nutritionData.calcium || 0, unit: t.units.mg, dv: calculateDV('calcium', nutritionData.calcium || 0, nutritionData.calciumDV) },
                iron: { label: t.iron, amount: nutritionData.iron || 0, unit: t.units.mg, dv: calculateDV('iron', nutritionData.iron || 0, nutritionData.ironDV) },
                potassium: { label: t.potassium, amount: nutritionData.potassium || 0, unit: t.units.mg, dv: calculateDV('potassium', nutritionData.potassium || 0, nutritionData.potassiumDV) }
              };
              
              const vitamin = vitaminMap[vitaminId];
              if (!vitamin) return null;
              
              return (
                <span key={vitaminId}>
                  {formatText(vitamin.label)} {vitamin.amount}{vitamin.unit} ({vitamin.dv}% DV)
                  {index < selectedVitamins.length - 1 ? ', ' : ''}
                </span>
              );
            })}
            {'. '}
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-black mt-2">
            <p className="text-xs leading-tight text-right" style={{ color: colors.textColor }}>
              {t.footer}
            </p>
          </div>

          {/* Conditional Sections */}
          {!customization.hideIngredientList && (
            <div className="pt-2 border-t border-black mt-2">
              <p className="text-xs font-bold text-right" style={{ color: colors.textColor }}>
                المكونات: {renderIngredientList(colors)}
              </p>
            </div>
          )}

          {!customization.hideBusinessInfo && (
            <div className="pt-1">
              <p className="text-xs text-right" style={{ color: colors.textColor }}>
                مُصنع بواسطة: {renderBusinessInfo(colors)}
              </p>
            </div>
          )}

          {!customization.hideAllergens && realAllergens.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold text-right" style={{ color: colors.textColor }}>
                يحتوي على: {renderAllergenInfo(colors)}
              </p>
            </div>
          )}

          {customization.showQRCode && renderArabicQRCode(colors)}
        </div>
      </Card>
    );
  };

  // Arabic Tabular Layout
  const renderArabicTabular = () => {
    const colors = getLabelColors();
    const width = getLabelWidth();
    
    return (
      <Card
        id="fda-nutrition-label"
        className={cn(
          "mx-auto border-2 border-black shadow-lg rounded-none",
          className
        )}
        style={{
          maxWidth: `${width}px`,
          backgroundColor: colors.backgroundColor,
          color: colors.textColor
        }}
      >
        <div className="p-3" dir="rtl">
          {/* Header */}
          <div className="border-b-4 border-black pb-1 mb-2">
            <h1 className={cn(
              "text-2xl font-black text-center tracking-tight",
              customization.removeUppercase || customization.makeLowercase ? "" : "uppercase"
            )} style={{ color: colors.textColor }}>
              {formatText(t.nutritionFacts)}
            </h1>
            <div className="text-sm font-medium text-center" style={{ color: colors.textColor }}>
              {t.servingsPerContainer} {nutritionData.servings} | {formatText(t.servingSize)} {nutritionData.servingSize} ({nutritionData.servingSizeGrams}{t.units.g})
            </div>
          </div>

          {/* Table Format (RTL) */}
          <table className="w-full text-sm border-collapse" dir="rtl">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-right font-bold py-1" style={{ color: colors.textColor }}>% DV</th>
                <th className="text-right font-bold py-1" style={{ color: colors.textColor }}>الكمية</th>
                <th className="text-right font-bold py-1" style={{ color: colors.textColor }}>العنصر الغذائي</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="text-right py-1" style={{ color: colors.textColor }}>-</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.calories}</td>
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.calories)}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="text-right py-1" style={{ color: colors.textColor }}>{calculateDV('totalFat', nutritionData.totalFat, nutritionData.totalFatDV)}%</td>
                <td className="text-right py-1" style={{ color: colors.textColor }}>{nutritionData.totalFat}{t.units.g}</td>
                <td className="font-bold py-1" style={{ color: colors.textColor }}>{formatText(t.totalFat)}</td>
              </tr>
              {/* Add more nutrients as needed */}
            </tbody>
          </table>

          {/* Footer */}
          <div className="pt-2 border-t border-black mt-2">
            <p className="text-xs leading-tight text-right" style={{ color: colors.textColor }}>
              {t.footer}
            </p>
          </div>

          {/* Conditional Sections */}
          {!customization.hideIngredientList && (
            <div className="pt-2 border-t border-black mt-2">
              <p className="text-xs font-bold text-right" style={{ color: colors.textColor }}>
                المكونات: {renderIngredientList(colors)}
              </p>
            </div>
          )}

          {!customization.hideBusinessInfo && (
            <div className="pt-1">
              <p className="text-xs text-right" style={{ color: colors.textColor }}>
                مُصنع بواسطة: {renderBusinessInfo(colors)}
              </p>
            </div>
          )}

          {!customization.hideAllergens && realAllergens.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-bold text-right" style={{ color: colors.textColor }}>
                يحتوي على: {renderAllergenInfo(colors)}
              </p>
            </div>
          )}

          {customization.showQRCode && renderArabicQRCode(colors)}
        </div>
      </Card>
    );
  };

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
    } else {
      try {
        // Generate PDF from the nutrition label with actual label dimensions
        const labelId = 'fda-nutrition-label';
        const recipeName = nutritionData.servingSize || 'nutrition-label';
        const filename = `${recipeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        
        await generateNutritionLabelPDF(labelId, {
          filename,
          quality: 1
        });
      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('Failed to generate PDF. Please try again.');
      }
    }
  };

  const handleCustomize = () => {
    if (onCustomize) {
      onCustomize();
    } else {
      // Navigate to nutrition label page with current data for customization
      navigate('/nutrition-label', {
        state: {
          nutritionData: data,
          language: language,
          ingredients: realIngredients,
          allergenData: allergenData, // Pass the comprehensive allergen data
          recipeName: recipeName
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Language Switch Button */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-2"
        >
          <Languages className="h-4 w-4" />
          {language === 'en' ? 'العربية' : 'English'}
        </Button>
      </div>

      {/* Render appropriate layout based on language and template type */}
      {isRTL ? renderArabicLayout() : (() => {
        switch (customization.labelType) {
          case 'FDA Linear':
            return renderFDALinear();
          case 'FDA Tabular':
            return renderFDATabular();
          case 'FDA Vertical':
          default:
            return renderFDAVertical();
        }
      })()}

      {/* Action Buttons */}
      {showActionButtons && (
        <div className="flex justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2 hover:bg-blue-50 border-blue-200 text-blue-700"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleCustomize}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Settings className="h-4 w-4" />
            Customize
          </Button>
        </div>
      )}
    </div>
  );
}

export default FDANutritionLabel;