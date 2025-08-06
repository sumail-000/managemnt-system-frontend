export interface NutritionData {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  fiber: number;
  sugars: number;
  addedSugars: number;
  vitaminA: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  // Extended nutrition data
  vitaminD?: number;
  potassium?: number;
  thiamine?: number;
  riboflavin?: number;
  niacin?: number;
  vitaminB6?: number;
  folate?: number;
  vitaminB12?: number;
  biotin?: number;
  pantothenicAcid?: number;
  phosphorus?: number;
  iodine?: number;
  magnesium?: number;
  zinc?: number;
  selenium?: number;
  copper?: number;
  manganese?: number;
  chromium?: number;
  molybdenum?: number;
  chloride?: number;
}

export interface AllergenType {
  contains: boolean;
  mayContain: boolean;
  freeFrom: boolean;
  source: string;
}

export interface AllergenData {
  contains: string[];
  mayContain: string[];
  freeFrom: string[];
  types: {
    gluten: AllergenType;
    dairy: AllergenType;
    eggs: AllergenType;
    fish: AllergenType;
    shellfish: AllergenType;
    treeNuts: AllergenType;
    peanuts: AllergenType;
    soy: AllergenType;
    sesame: AllergenType;
  };
  // Detailed classifications
  milkType?: {
    cowMilk: boolean;
    goatMilk: boolean;
    sheepMilk: boolean;
    other: string;
  };
  eggType?: {
    chickenEgg: boolean;
    duckEgg: boolean;
    quailEgg: boolean;
    other: string;
  };
  fishType?: {
    tuna: boolean;
    cod: boolean;
    salmon: boolean;
    bass: boolean;
    other: string;
  };
  treeNutType?: {
    almond: boolean;
    blackWalnut: boolean;
    brazilNut: boolean;
    californiaWalnut: boolean;
    cashew: boolean;
    hazelnut: boolean;
    heartnut: boolean;
    macadamiaNut: boolean;
    pecan: boolean;
    pineNut: boolean;
    pistachio: boolean;
    walnut: boolean;
    other: string;
  };
  glutenType?: {
    barley: boolean;
    oats: boolean;
    rye: boolean;
    triticale: boolean;
    other: string;
  };
}

export interface CustomIngredientData {
  // General Information
  name: string;
  brand: string;
  category: string;
  description: string;
  
  // Regulatory Information
  ingredientList: string;
  allergens: AllergenData;
  
  // Nutrition Information
  servingSize: number;
  servingUnit: string;
  nutrition: NutritionData;
  nutritionNotes?: string;
}

export interface CustomIngredientFormProps {
  onBack: () => void;
  onSave: (ingredientData: CustomIngredientData) => void;
}

// Legacy interface for backward compatibility
export interface LegacyCustomIngredientData {
  // General Information
  name: string;
  brand: string;
  
  // Regulatory Information
  ingredientList: string;
  allergens: {
    // Main allergens
    milk: boolean;
    egg: boolean;
    fish: boolean;
    shellfish: boolean;
    treeNuts: boolean;
    wheat: boolean;
    peanuts: boolean;
    soy: boolean;
    sesame: boolean;
    mustard: boolean;
    sulfites: boolean;
    gluten: boolean;
    
    // Milk classifications
    milkType: {
      cowMilk: boolean;
      goatMilk: boolean;
      sheepMilk: boolean;
      other: string;
    };
    
    // Egg classifications
    eggType: {
      chickenEgg: boolean;
      duckEgg: boolean;
      quailEgg: boolean;
      other: string;
    };
    
    // Fish classifications
    fishType: {
      tuna: boolean;
      cod: boolean;
      salmon: boolean;
      bass: boolean;
      other: string;
    };
    
    // Tree nut classifications
    treeNutType: {
      almond: boolean;
      blackWalnut: boolean;
      brazilNut: boolean;
      californiaWalnut: boolean;
      cashew: boolean;
      hazelnut: boolean;
      heartnut: boolean;
      macadamiaNut: boolean;
      pecan: boolean;
      pineNut: boolean;
      pistachio: boolean;
      walnut: boolean;
      other: string;
    };
    
    // Gluten classifications
    glutenType: {
      barley: boolean;
      oats: boolean;
      rye: boolean;
      triticale: boolean;
      other: string;
    };
  };
  
  // Nutrition Information
  quantity: number;
  unit: string;
  calories: number;
  
  // Macronutrients
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbohydrate: number;
  dietaryFiber: number;
  totalSugars: number;
  addedSugars: number;
  protein: number;
  
  // Vitamins and Minerals
  vitaminD: number;
  calcium: number;
  iron: number;
  potassium: number;
  vitaminA: number;
  vitaminC: number;
  thiamine: number;
  riboflavin: number;
  niacin: number;
  vitaminB6: number;
  folate: number;
  vitaminB12: number;
  biotin: number;
  pantothenicAcid: number;
  phosphorus: number;
  iodine: number;
  magnesium: number;
  zinc: number;
  selenium: number;
  copper: number;
  manganese: number;
  chromium: number;
  molybdenum: number;
  chloride: number;
}