// Label Generator Types

export interface LabelData {
  id: string;
  productId?: string;
  
  // Content
  productName: {
    english: string;
    arabic: string;
  };
  brandName: string;
  
  // Nutrition Facts
  servingSize: string;
  servingsPerContainer: string;
  calories: number;
  nutrition: NutritionFact[];
  
  // Ingredients
  ingredients: {
    english: string;
    arabic: string;
  };
  
  // Allergens
  allergens: {
    english: string[];
    arabic: string[];
  };
  
  // Additional Info
  netWeight: string;
  barcode?: string;
  qrCode?: QRCodeData;
  
  // Styling
  layout: LabelLayout;
  typography: TypographySettings;
  branding: BrandingSettings;
  
  // Compliance
  regulatoryStandard: 'FDA' | 'EU' | 'SFDA' | 'CUSTOM';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NutritionFact {
  name: string;
  amount: number;
  unit: string;
  dailyValue?: number;
  subNutrients?: NutritionFact[];
}

export interface QRCodeData {
  content: string;
  type: 'url' | 'nutrition' | 'ingredients' | 'custom';
  size: number;
  position: Position;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  color: string;
  backgroundColor: string;
  logoEmbedded?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface LabelLayout {
  orientation: 'portrait' | 'landscape';
  dimensions: Dimensions;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  template: string;
  sections: LabelSection[];
}

export interface LabelSection {
  id: string;
  type: 'header' | 'nutrition' | 'ingredients' | 'allergens' | 'footer' | 'branding' | 'qr';
  position: Position;
  dimensions: Dimensions;
  visible: boolean;
  order: number;
}

export interface TypographySettings {
  primaryFont: string;
  arabicFont: string;
  fontSizes: {
    heading: number;
    subheading: number;
    body: number;
    small: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  lineSpacing: number;
  characterSpacing: number;
}

export interface BrandingSettings {
  logo?: {
    url: string;
    position: Position;
    dimensions: Dimensions;
    opacity: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  backgroundPattern?: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  category: 'food' | 'beverage' | 'supplement' | 'custom';
  regulatory: 'FDA' | 'EU' | 'SFDA' | 'MULTI';
  layout: LabelLayout;
  typography: TypographySettings;
  thumbnail: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'svg' | 'jpeg';
  resolution: number;
  paperSize?: 'a4' | 'letter' | 'custom';
  labelsPerSheet?: number;
  includeCutLines?: boolean;
  includeBleed?: boolean;
  colorProfile?: 'rgb' | 'cmyk';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface LabelHistory {
  id: string;
  labelId: string;
  version: number;
  changes: string[];
  timestamp: Date;
  author: string;
}