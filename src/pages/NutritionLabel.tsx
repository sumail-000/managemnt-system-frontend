import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FDANutritionLabel } from '@/components/previewlabel/FDANutritionLabel';
import { generateNutritionLabelPDF } from '@/utils/pdfGenerator';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Info,
  Download,
  Share2,
  FileText,
  Calculator,
  Settings,
  ArrowLeft,
  QrCode,
  ExternalLink
} from "lucide-react";

interface LabelSection {
  id: string;
  label: string;
  checked: boolean;
  hasInfo?: boolean;
}

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

export default function NutritionLabel() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if user came from ProductForm with real data
  const passedData = location.state as {
    nutritionData?: NutritionData;
    language?: string;
    ingredients?: Array<{name: string; allergens: string[]}>;
    allergenData?: any; // Add allergen data from allergen management system
    recipeName?: string;
    productId?: string; // Add product ID for QR code generation
    publicationStatus?: {
      status: string;
      is_public: boolean;
    };
    showQRCodeOnReturn?: boolean; // Flag for returning from QR code generation
  } | null;
  const isLoggedUserWithData = !!passedData?.nutritionData;
  
  // Use real data if provided, otherwise use sample data
  const [nutritionData, setNutritionData] = useState<NutritionData>(
    passedData?.nutritionData || {
      servings: 48,
      servingSize: '1 cookie',
      servingSizeGrams: 25,
      calories: 110,
      totalFat: 4.5,
      saturatedFat: 2.5,
      transFat: 0,
      cholesterol: 20,
      sodium: 80,
      totalCarbohydrate: 17,
      dietaryFiber: 1,
      totalSugars: 9,
      addedSugars: 9,
      protein: 2,
      vitaminD: 0,
      calcium: 10,
      iron: 0.4,
      potassium: 40
    }
  );

  const [labelType, setLabelType] = useState("FDA Vertical (default)");
  const [expandedSections, setExpandedSections] = useState({
    labelSections: true,
    labelStyle: false,
    optionalNutrients: false,
    optionalVitamins: false,
    nutritionAdjustments: false
  });

  // Label style customization options
  const [labelStyle, setLabelStyle] = useState({
    justifyLeft: false,
    justifyCenter: false,
    removeUppercase: false,
    makeLowercase: false,
    makeTitlecase: false,
    labelWidth: 227,
    textColor: 'black',
    backgroundColor: 'white'
  });

  const [optionalNutrients, setOptionalNutrients] = useState([
    { id: "monounsaturatedFat", label: "Show monounsaturated fat", checked: false, hasInfo: true },
    { id: "polyunsaturatedFat", label: "Show polyunsaturated fat", checked: false, hasInfo: true },
    { id: "sugarAlcohol", label: "Show sugar alcohols", checked: false, hasInfo: true },
    { id: "proteinPercentage", label: "Show protein percentage", checked: false, hasInfo: true }
  ]);

  const [optionalVitamins, setOptionalVitamins] = useState([
    { id: "toggleAll", label: "Toggle All", checked: false, hasInfo: true },
    { id: "vitaminA", label: "Show Vitamin A", checked: false, hasInfo: true },
    { id: "vitaminC", label: "Show Vitamin C", checked: false, hasInfo: true },
    { id: "vitaminE", label: "Show Vitamin E", checked: false, hasInfo: true },
    { id: "vitaminK", label: "Show Vitamin K", checked: false, hasInfo: true },
    { id: "thiamin", label: "Show Thiamin", checked: false, hasInfo: true },
    { id: "riboflavin", label: "Show Riboflavin", checked: false, hasInfo: true },
    { id: "niacin", label: "Show Niacin", checked: false, hasInfo: true },
    { id: "vitaminB6", label: "Show Vitamin B6", checked: false, hasInfo: true },
    { id: "folate", label: "Show Folate", checked: false, hasInfo: true },
    { id: "vitaminB12", label: "Show Vitamin B12", checked: false, hasInfo: true },
    { id: "pantothenicAcid", label: "Show Pantothenic Acid", checked: false, hasInfo: true },
    { id: "phosphorus", label: "Show Phosphorus", checked: false, hasInfo: true },
    { id: "magnesium", label: "Show Magnesium", checked: false, hasInfo: true },
    { id: "zinc", label: "Show Zinc", checked: false, hasInfo: true },
    { id: "selenium", label: "Show Selenium", checked: false, hasInfo: true },
    { id: "copper", label: "Show Copper", checked: false, hasInfo: true },
    { id: "manganese", label: "Show Manganese", checked: false, hasInfo: true }
  ]);

  const [labelSections, setLabelSections] = useState<LabelSection[]>([
    { id: "hideIngredientList", label: "Hide ingredient list", checked: false, hasInfo: true },
    { id: "hideBusinessInfo", label: "Hide business info", checked: false, hasInfo: true },
    { id: "hideAllergens", label: "Hide allergens", checked: false, hasInfo: true },
    { id: "showQRCode", label: "Show QR code", checked: false, hasInfo: true }
  ]);

  // Business information state
  const [businessInfo, setBusinessInfo] = useState({
    companyName: 'Your Company Name',
    address: 'Address',
    city: 'City',
    state: 'State',
    zipCode: 'ZIP'
  });

  // Nutrition adjustments state
  const [nutritionAdjustments, setNutritionAdjustments] = useState({
    calorieAdjustment: 0,
    fatAdjustment: 0,
    sodiumAdjustment: 0,
    sugarAdjustment: 0
  });

  // QR Code management state
  const [showQRCodeManagement, setShowQRCodeManagement] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<any>(null);
  const [isLoadingQRCode, setIsLoadingQRCode] = useState(false);

  const labelTypeOptions = [
    "FDA Vertical (default)",
    "FDA Tabular",
    "FDA Linear"
  ];

  // Extract real ingredients and allergens from passed data
  const realIngredients = passedData?.ingredients || [];
  
  // Extract allergens from comprehensive allergen data if available
  const extractAllergensFromAllergenData = (allergenData: any): string[] => {
    if (!allergenData) return [];
    
    const allAllergens: string[] = [];
    
    // Import ALLERGEN_CATEGORIES to iterate through categories
    // For now, we'll extract from both detected and manual allergens
    Object.keys(allergenData.detected || {}).forEach(categoryId => {
      const detected = allergenData.detected[categoryId] || [];
      // Ensure detected is an array before calling forEach
      if (Array.isArray(detected)) {
        detected.forEach((allergen: any) => {
          if (!allAllergens.includes(allergen.name)) {
            allAllergens.push(allergen.name);
          }
        });
      }
    });
    
    Object.keys(allergenData.manual || {}).forEach(categoryId => {
      const manual = allergenData.manual[categoryId] || [];
      // Ensure manual is an array before calling forEach
      if (Array.isArray(manual)) {
        manual.forEach((allergen: any) => {
          if (!allAllergens.includes(allergen.name)) {
            allAllergens.push(allergen.name);
          }
        });
      }
    });
    
    return allAllergens;
  };
  
  // Use comprehensive allergen data if available, otherwise fall back to ingredient-based extraction
  const uniqueAllergens = passedData?.allergenData
    ? extractAllergensFromAllergenData(passedData.allergenData)
    : [...new Set(realIngredients.reduce((acc: string[], ingredient) => {
        return [...acc, ...ingredient.allergens];
      }, []))];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleLabelSection = (id: string) => {
    if (id === 'showQRCode') {
      // Handle QR code toggle
      const currentSection = labelSections.find(s => s.id === 'showQRCode');
      if (!currentSection?.checked) {
        // User is trying to show QR code - check if we have QR code data
        if (qrCodeData) {
          // We have QR code data, just enable the checkbox
          setLabelSections(prev =>
            prev.map(section =>
              section.id === id
                ? { ...section, checked: true }
                : section
            )
          );
        } else {
          // No QR code data, show management interface
          handleShowQRCode();
        }
      } else {
        // User is hiding QR code - just toggle off
        setLabelSections(prev =>
          prev.map(section =>
            section.id === id
              ? { ...section, checked: false }
              : section
          )
        );
      }
    } else {
      setLabelSections(prev =>
        prev.map(section =>
          section.id === id
            ? { ...section, checked: !section.checked }
            : section
        )
      );
    }
  };

  const toggleOptionalNutrient = (id: string) => {
    setOptionalNutrients(prev => 
      prev.map(nutrient => 
        nutrient.id === id 
          ? { ...nutrient, checked: !nutrient.checked }
          : nutrient
      )
    );
  };

  const toggleOptionalVitamin = (id: string) => {
    if (id === "toggleAll") {
      const allChecked = optionalVitamins.filter(v => v.id !== "toggleAll").every(v => v.checked);
      setOptionalVitamins(prev => 
        prev.map(vitamin => 
          ({ ...vitamin, checked: !allChecked })
        )
      );
    } else {
      setOptionalVitamins(prev => 
        prev.map(vitamin => 
          vitamin.id === id 
            ? { ...vitamin, checked: !vitamin.checked }
            : vitamin
        )
      );
    }
  };

  const handleLabelStyleChange = (key: string, value: any) => {
    setLabelStyle(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const SectionHeader = ({ title, section, icon }: { title: string; section: string; icon?: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="w-full justify-between p-2 h-auto bg-blue-500 hover:bg-blue-600 text-white rounded-t-lg text-xs"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-1">
        {icon}
        <span className="font-medium">{title}</span>
      </div>
      {expandedSections[section as keyof typeof expandedSections] ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )}
    </Button>
  );

  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [showDownloadButton, setShowDownloadButton] = useState(false);

  const handleGenerateLabel = async () => {
    try {
      setIsGeneratingLabel(true);
      setShowDownloadButton(false);
      
      // Show loading for 2-3 seconds
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const recipeName = passedData?.recipeName || 'nutrition-label';
      const filename = `${recipeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      
      // Generate PDF with actual label dimensions (not A4)
      await generateNutritionLabelPDF('fda-nutrition-label', {
        filename,
        quality: 1
      });
      
      setShowDownloadButton(true);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate label. Please try again.');
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const recipeName = passedData?.recipeName || 'nutrition-label';
      const filename = `${recipeName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      
      // Generate PDF with actual label dimensions (not A4)
      await generateNutritionLabelPDF('fda-nutrition-label', {
        filename,
        quality: 1
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to download label. Please try again.');
    }
  };

  const handleGoBack = () => {
    // Check if we have data indicating we came from ProductForm
    if (passedData?.nutritionData && passedData?.recipeName) {
      // Navigate back to ProductForm with proper state indicating we're returning from custom label
      navigate('/product-form', {
        state: {
          returnFromCustomLabel: true,
          recipeName: passedData.recipeName,
          productId: passedData.productId,
          preserveRecipeState: true
        },
        replace: true // Replace current history entry to prevent back button loops
      });
    } else {
      // Fallback to browser back for non-recipe users (sample label users)
      navigate(-1);
    }
  };

  const handleBusinessInfoChange = (field: string, value: string) => {
    setBusinessInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNutritionAdjustmentChange = (field: string, value: number) => {
    setNutritionAdjustments(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // QR Code management handlers
  const handleShowQRCode = async () => {
    setShowQRCodeManagement(true);
  };

  const handleManageQRCode = async () => {
    if (!passedData?.productId) {
      console.error('No product ID available for QR code generation');
      return;
    }

    try {
      setIsLoadingQRCode(true);
      
      // Import the QR code service
      const qrCodeService = (await import('@/services/qrCodeService')).default;
      
      // Generate QR code for the product
      const response = await qrCodeService.generateQrCode(parseInt(passedData.productId), {
        size: 300,
        format: 'png',
        margin: 2,
        color: '#000000',
        background_color: '#ffffff'
      });

      if (response.success && response.qr_code) {
        // Set the QR code data for display
        setQrCodeData({
          qr_code_url: response.image_url || response.qr_code.image_url,
          name: response.qr_code.product?.name || 'Product QR Code',
          public_url: response.public_url || response.qr_code.public_url
        });

        // Enable the QR code checkbox
        setLabelSections(prev =>
          prev.map(section =>
            section.id === 'showQRCode'
              ? { ...section, checked: true }
              : section
          )
        );

        // Close the management interface
        setShowQRCodeManagement(false);

        console.log('QR code generated successfully:', response.qr_code);
      } else {
        console.error('QR code generation failed:', response.message);
        // Still close the management interface
        setShowQRCodeManagement(false);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setShowQRCodeManagement(false);
    } finally {
      setIsLoadingQRCode(false);
    }
  };

  const handleBackFromQRCode = () => {
    setShowQRCodeManagement(false);
    // If we have QR code data, enable the checkbox
    if (qrCodeData) {
      setLabelSections(prev =>
        prev.map(section =>
          section.id === 'showQRCode'
            ? { ...section, checked: true }
            : section
        )
      );
    }
  };

  // Check if we're returning from QR code generation or load QR code on mount
  useEffect(() => {
    if (passedData?.showQRCodeOnReturn) {
      // Enable QR code display
      setLabelSections(prev =>
        prev.map(section =>
          section.id === 'showQRCode'
            ? { ...section, checked: true }
            : section
        )
      );
      
      // Load QR code data if available
      if (passedData.productId) {
        loadQRCodeForProduct(passedData.productId);
      }
    } else if (passedData?.productId) {
      // Try to load existing QR code data on mount
      loadQRCodeForProduct(passedData.productId);
    }
  }, [passedData?.showQRCodeOnReturn, passedData?.productId]);

  const loadQRCodeForProduct = async (productId: string) => {
    try {
      setIsLoadingQRCode(true);
      
      // Import the QR code service
      const qrCodeService = (await import('@/services/qrCodeService')).default;
      
      // Get existing QR codes for this product
      const response = await qrCodeService.getProductQrCodes(parseInt(productId));
      
      if (response.success && response.data && response.data.length > 0) {
        // Use the first QR code found for this product
        const qrCode = response.data[0];
        setQrCodeData({
          qr_code_url: qrCode.image_url,
          name: qrCode.product?.name || qrCode.product_name || 'Product QR Code',
          public_url: qrCode.public_url
        });
        console.log('QR code data loaded:', qrCode);
      } else {
        setQrCodeData(null);
        console.log('No QR codes found for product');
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
      setQrCodeData(null);
    } finally {
      setIsLoadingQRCode(false);
    }
  };

  // Apply nutrition adjustments to the data
  const getAdjustedNutritionData = (): NutritionData => {
    if (!nutritionData) return nutritionData;
    
    return {
      ...nutritionData,
      calories: (nutritionData.calories || 0) + nutritionAdjustments.calorieAdjustment,
      totalFat: (nutritionData.totalFat || 0) + nutritionAdjustments.fatAdjustment,
      sodium: (nutritionData.sodium || 0) + nutritionAdjustments.sodiumAdjustment,
      totalSugars: (nutritionData.totalSugars || 0) + nutritionAdjustments.sugarAdjustment
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Conditional Header - Landing header for non-logged users, custom header for logged users */}
      {!isLoggedUserWithData && <LandingHeader />}
      
      {/* Custom header for logged users */}
      {isLoggedUserWithData && (
        <div className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Label Customization
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Customize your FDA nutrition label
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!showDownloadButton ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateLabel}
                    disabled={isGeneratingLabel}
                    className="flex items-center gap-2"
                  >
                    {isGeneratingLabel ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Generating Label...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Generate Label
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className={isLoggedUserWithData ? "py-6" : "pt-16 pb-8"}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header for non-logged users */}
          {!isLoggedUserWithData && (
            <div className="mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                Sample Label - Your Nutritionsy
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      <FileText className="h-3 w-3 mr-1" />
                      Label
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border shadow-lg">
                    <DropdownMenuItem>FDA Label</DropdownMenuItem>
                    <DropdownMenuItem>Canadian Label</DropdownMenuItem>
                    <DropdownMenuItem>USDA Label</DropdownMenuItem>
                    <DropdownMenuItem>Custom Template</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      <Calculator className="h-3 w-3 mr-1" />
                      Nutrition Breakdown
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border shadow-lg">
                    <DropdownMenuItem>Macro Analysis</DropdownMenuItem>
                    <DropdownMenuItem>Vitamin Details</DropdownMenuItem>
                    <DropdownMenuItem>Mineral Content</DropdownMenuItem>
                    <DropdownMenuItem>Calorie Breakdown</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                      <Settings className="h-3 w-3 mr-1" />
                      More
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Badge>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border shadow-lg">
                    <DropdownMenuItem>Export Options</DropdownMenuItem>
                    <DropdownMenuItem>Print Settings</DropdownMenuItem>
                    <DropdownMenuItem>Share & Collaborate</DropdownMenuItem>
                    <DropdownMenuItem>Advanced Settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-4">
            {/* Left Controls Panel */}
            <div className="lg:col-span-1 space-y-3">
              {/* Label Type and Preview in one row */}
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white flex-1">
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </div>

              {/* Label Type */}
              <Card className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium text-foreground">Label Type</h3>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                <Select value={labelType} onValueChange={setLabelType}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-48 bg-background border shadow-lg">
                    {labelTypeOptions.map((option) => (
                      <SelectItem key={option} value={option} className="text-xs">
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Card>

              {/* All sections in accordion style */}
              <div className="space-y-2">
                {/* Label Sections */}
                <Card className="overflow-hidden">
                  <SectionHeader 
                    title="Label sections" 
                    section="labelSections" 
                    icon={<Info className="h-3 w-3" />}
                  />
                  {expandedSections.labelSections && (
                    <div className="p-3 space-y-2 bg-card">
                      {labelSections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={section.id}
                              checked={section.checked}
                              onCheckedChange={() => toggleLabelSection(section.id)}
                              className="h-3 w-3"
                            />
                            <label
                              htmlFor={section.id}
                              className="text-xs text-foreground cursor-pointer"
                            >
                              {section.label}
                            </label>
                          </div>
                          {section.hasInfo && (
                            <Info className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                      
                      {/* QR Code Management Interface */}
                      {showQRCodeManagement && (
                        <div className="mt-3 p-3 border rounded-lg bg-blue-50 border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <QrCode className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Manage QR Code</span>
                          </div>
                          
                          {qrCodeData ? (
                            <div className="space-y-2">
                              <div className="text-xs text-blue-700">
                                Active QR Code: {qrCodeData.name || 'Product QR Code'}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleManageQRCode}
                                  className="text-xs px-2 py-1 h-6 border-blue-300 text-blue-700 hover:bg-blue-100"
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Edit QR Code
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleBackFromQRCode}
                                  className="text-xs px-2 py-1 h-6 text-gray-600 hover:bg-gray-100"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs text-blue-700">
                                {isLoadingQRCode ? 'Loading QR code...' : 'No QR code found for this recipe.'}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleManageQRCode}
                                  disabled={isLoadingQRCode}
                                  className="text-xs px-2 py-1 h-6 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <QrCode className="h-3 w-3 mr-1" />
                                  Generate QR Code
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleBackFromQRCode}
                                  className="text-xs px-2 py-1 h-6 text-gray-600 hover:bg-gray-100"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Nutrition Adjustments - moved up */}
                <Card className="overflow-hidden">
                  <SectionHeader 
                    title="Nutrition adjustments" 
                    section="nutritionAdjustments" 
                    icon={<Info className="h-3 w-3" />}
                  />
                  {expandedSections.nutritionAdjustments && (
                    <div className="p-3 bg-card space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Calorie Adjustment</label>
                        <input
                          type="number"
                          value={nutritionAdjustments.calorieAdjustment}
                          onChange={(e) => handleNutritionAdjustmentChange('calorieAdjustment', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border rounded"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Fat Adjustment (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={nutritionAdjustments.fatAdjustment}
                          onChange={(e) => handleNutritionAdjustmentChange('fatAdjustment', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border rounded"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Sodium Adjustment (mg)</label>
                        <input
                          type="number"
                          value={nutritionAdjustments.sodiumAdjustment}
                          onChange={(e) => handleNutritionAdjustmentChange('sodiumAdjustment', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border rounded"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">Sugar Adjustment (g)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={nutritionAdjustments.sugarAdjustment}
                          onChange={(e) => handleNutritionAdjustmentChange('sugarAdjustment', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs border rounded"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </Card>

                {/* Optional Nutrients */}
                <Card className="overflow-hidden">
                  <SectionHeader 
                    title="Optional nutrients" 
                    section="optionalNutrients" 
                    icon={<Info className="h-3 w-3" />}
                  />
                  {expandedSections.optionalNutrients && (
                    <div className="p-3 space-y-2 bg-card">
                      {optionalNutrients.map((nutrient) => (
                        <div key={nutrient.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={nutrient.id}
                              checked={nutrient.checked}
                              onCheckedChange={() => toggleOptionalNutrient(nutrient.id)}
                              className="h-3 w-3"
                            />
                            <label 
                              htmlFor={nutrient.id}
                              className="text-xs text-foreground cursor-pointer"
                            >
                              {nutrient.label}
                            </label>
                          </div>
                          {nutrient.hasInfo && (
                            <Info className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Optional Vitamins */}
                <Card className="overflow-hidden">
                  <SectionHeader 
                    title="Optional vitamins" 
                    section="optionalVitamins" 
                    icon={<Info className="h-3 w-3" />}
                  />
                  {expandedSections.optionalVitamins && (
                    <div className="p-3 space-y-2 bg-card max-h-64 overflow-y-auto">
                      {optionalVitamins.map((vitamin) => (
                        <div key={vitamin.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={vitamin.id}
                              checked={vitamin.checked}
                              onCheckedChange={() => toggleOptionalVitamin(vitamin.id)}
                              className="h-3 w-3"
                            />
                            <label 
                              htmlFor={vitamin.id}
                              className="text-xs text-foreground cursor-pointer"
                            >
                              {vitamin.label}
                            </label>
                          </div>
                          {vitamin.hasInfo && (
                            <Info className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Label Style */}
                <Card className="overflow-hidden">
                  <SectionHeader
                    title="Label style"
                    section="labelStyle"
                    icon={<Info className="h-3 w-3" />}
                  />
                  {expandedSections.labelStyle && (
                    <div className="p-3 bg-card space-y-3">
                      {/* Text Alignment Options */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="justifyLeft"
                            checked={labelStyle.justifyLeft}
                            onCheckedChange={(checked) => handleLabelStyleChange('justifyLeft', checked)}
                            className="h-3 w-3"
                          />
                          <label htmlFor="justifyLeft" className="text-xs text-foreground cursor-pointer">
                            Justify left
                          </label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="justifyCenter"
                            checked={labelStyle.justifyCenter}
                            onCheckedChange={(checked) => handleLabelStyleChange('justifyCenter', checked)}
                            className="h-3 w-3"
                          />
                          <label htmlFor="justifyCenter" className="text-xs text-foreground cursor-pointer">
                            Justify center
                          </label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Case Options */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="removeUppercase"
                            checked={labelStyle.removeUppercase}
                            onCheckedChange={(checked) => handleLabelStyleChange('removeUppercase', checked)}
                            className="h-3 w-3"
                          />
                          <label htmlFor="removeUppercase" className="text-xs text-foreground cursor-pointer">
                            Remove uppercase
                          </label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="makeLowercase"
                            checked={labelStyle.makeLowercase}
                            onCheckedChange={(checked) => handleLabelStyleChange('makeLowercase', checked)}
                            className="h-3 w-3"
                          />
                          <label htmlFor="makeLowercase" className="text-xs text-foreground cursor-pointer">
                            Make lowercase
                          </label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="makeTitlecase"
                            checked={labelStyle.makeTitlecase}
                            onCheckedChange={(checked) => handleLabelStyleChange('makeTitlecase', checked)}
                            className="h-3 w-3"
                          />
                          <label htmlFor="makeTitlecase" className="text-xs text-foreground cursor-pointer">
                            Make titlecase
                          </label>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Width Slider */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground">
                          Slide to adjust label width
                        </label>
                        <div className="px-2">
                          <input
                            type="range"
                            min="200"
                            max="400"
                            value={labelStyle.labelWidth}
                            onChange={(e) => handleLabelStyleChange('labelWidth', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="text-center text-xs text-muted-foreground mt-1">
                            {labelStyle.labelWidth}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground text-center">
                          Label dimensions: 2.6 x 7.6
                        </div>
                      </div>

                      {/* Text Color */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1">
                          Label text color
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={labelStyle.textColor}
                            onChange={(e) => handleLabelStyleChange('textColor', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border rounded"
                            placeholder="black"
                          />
                          <Button size="sm" className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600">
                            Update
                          </Button>
                        </div>
                      </div>

                      {/* Background Color */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1">
                          Label background color
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={labelStyle.backgroundColor}
                            onChange={(e) => handleLabelStyleChange('backgroundColor', e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border rounded"
                            placeholder="white"
                          />
                          <Button size="sm" className="text-xs px-3 py-1 bg-red-500 hover:bg-red-600">
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Right Preview Panel - larger */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                <div className="flex justify-center">
                  <FDANutritionLabel
                    data={getAdjustedNutritionData()}
                    showActionButtons={false}
                    customization={{
                      labelType,
                      justifyLeft: labelStyle.justifyLeft,
                      justifyCenter: labelStyle.justifyCenter,
                      removeUppercase: labelStyle.removeUppercase,
                      makeLowercase: labelStyle.makeLowercase,
                      makeTitlecase: labelStyle.makeTitlecase,
                      labelWidth: labelStyle.labelWidth,
                      textColor: labelStyle.textColor,
                      backgroundColor: labelStyle.backgroundColor,
                      hideIngredientList: labelSections.find(s => s.id === 'hideIngredientList')?.checked || false,
                      hideBusinessInfo: labelSections.find(s => s.id === 'hideBusinessInfo')?.checked || false,
                      hideAllergens: labelSections.find(s => s.id === 'hideAllergens')?.checked || false,
                      showQRCode: labelSections.find(s => s.id === 'showQRCode')?.checked || false
                    }}
                    selectedVitamins={optionalVitamins.filter(v => v.checked && v.id !== 'toggleAll').map(v => v.id)}
                    selectedOptionalNutrients={optionalNutrients.filter(n => n.checked).map(n => n.id)}
                    realIngredients={realIngredients}
                    realAllergens={uniqueAllergens}
                    businessInfo={businessInfo}
                    recipeName={passedData?.recipeName}
                    qrCodeData={qrCodeData}
                  />
                </div>

                {/* Business Information Editor - Only show when business info is not hidden */}
                {!labelSections.find(s => s.id === 'hideBusinessInfo')?.checked && (
                  <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="text-sm font-medium mb-3">Business Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Company Name</label>
                        <input
                          type="text"
                          value={businessInfo.companyName}
                          onChange={(e) => handleBusinessInfoChange('companyName', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          value={businessInfo.address}
                          onChange={(e) => handleBusinessInfoChange('address', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          value={businessInfo.city}
                          onChange={(e) => handleBusinessInfoChange('city', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          value={businessInfo.state}
                          onChange={(e) => handleBusinessInfoChange('state', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">ZIP Code</label>
                        <input
                          type="text"
                          value={businessInfo.zipCode}
                          onChange={(e) => handleBusinessInfoChange('zipCode', e.target.value)}
                          className="w-full px-2 py-1 text-xs border rounded mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-8">
                  {!showDownloadButton ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateLabel}
                      disabled={isGeneratingLabel}
                      className="flex items-center gap-2 hover:bg-blue-50 border-blue-200 text-blue-700"
                    >
                      {isGeneratingLabel ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          Generating Label...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4" />
                          Generate Label
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
    </main>

      {/* Conditional Footer - only for non-logged users */}
      {!isLoggedUserWithData && <LandingFooter />}
    </div>
  );
}