import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Package, 
  Zap, 
  FileText, 
  Download,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

import { productsAPI } from '@/services/api';
import { Product } from '@/types/product';
import { NutritionData } from '@/types/nutrition';
import { LabelData, LabelTemplate } from '@/types/label';
import { LabelPreview } from './LabelPreview';
import { calculateServingInfo, generateServingBreakdown } from '@/utils/serving';

interface AutoLabelGeneratorProps {
  onBack?: () => void;
}

const standardTemplate: LabelTemplate = {
  id: 'standard-fda',
  name: 'Standard FDA Nutrition Label',
  category: 'food',
  regulatory: 'FDA',
  layout: {
    orientation: 'portrait',
    dimensions: { width: 100, height: 150 }, // Label size in mm
    margins: { top: 5, right: 5, bottom: 5, left: 5 },
    template: 'standard-fda',
    sections: [
      {
        id: 'header',
        type: 'header',
        position: { x: 0, y: 0 },
        dimensions: { width: 90, height: 20 },
        visible: true,
        order: 1
      },
      {
        id: 'nutrition',
        type: 'nutrition',
        position: { x: 0, y: 25 },
        dimensions: { width: 90, height: 80 },
        visible: true,
        order: 2
      },
      {
        id: 'ingredients',
        type: 'ingredients',
        position: { x: 0, y: 110 },
        dimensions: { width: 90, height: 20 },
        visible: true,
        order: 3
      },
      {
        id: 'allergens',
        type: 'allergens',
        position: { x: 0, y: 135 },
        dimensions: { width: 90, height: 10 },
        visible: true,
        order: 4
      }
    ]
  },
  typography: {
    primaryFont: 'Arial',
    arabicFont: 'Noto Sans Arabic',
    fontSizes: { heading: 14, subheading: 12, body: 10, small: 8 },
    colors: { primary: '#000000', secondary: '#666666', accent: '#000000' },
    lineSpacing: 1.1,
    characterSpacing: 0
  },
  thumbnail: '',
  isDefault: true,
  createdAt: new Date()
};

export function AutoLabelGenerator({ onBack }: AutoLabelGeneratorProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate>(standardTemplate);
  const [generatedLabel, setGeneratedLabel] = useState<LabelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'select-product' | 'select-template' | 'preview'>('select-product');

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productsAPI.getAll({ 
        per_page: 100, 
        sort_by: 'updated_at', 
        sort_order: 'desc' 
      });
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setStep('select-template');
    }
  };

  const handleTemplateSelect = () => {
    setStep('preview');
  };

  const generateLabelFromProduct = async () => {
    if (!selectedProduct) return;

    try {
      setIsGenerating(true);

      // Get nutrition data for the product
      let nutritionData: NutritionData | null = null;
      if (selectedProduct.nutritional_data && selectedProduct.nutritional_data.length > 0) {
        const latestNutrition = selectedProduct.nutritional_data[0];
        
        // Transform the nutritional data to match NutritionData interface
        nutritionData = {
          calories: latestNutrition.basic_nutrition.total_calories,
          totalWeight: latestNutrition.basic_nutrition.weight_per_serving * latestNutrition.basic_nutrition.servings,
          servings: latestNutrition.basic_nutrition.servings,
          weightPerServing: latestNutrition.basic_nutrition.weight_per_serving,
          ingredients: [],
          totalNutrients: latestNutrition.micronutrients as any,
          totalNutrientsKCal: [],
          totalDaily: latestNutrition.daily_values as any,
          healthLabels: latestNutrition.health_labels || [],
          dietLabels: latestNutrition.diet_labels || [],
          cautions: latestNutrition.allergens || [],
          allergens: latestNutrition.allergens || [],
          warnings: latestNutrition.warnings || [],
          highNutrients: latestNutrition.high_nutrients || [],
          co2EmissionsClass: null,
          totalCO2Emissions: 0,
          analysisMetadata: {
            analyzedAt: new Date().toISOString(),
            source: 'auto-generator',
            version: '1.0'
          },
          nutritionSummary: {
            macronutrients: {
              protein: {
                grams: latestNutrition.macronutrients.protein,
                calories: latestNutrition.macronutrients.protein * 4,
                percentage: Math.round((latestNutrition.macronutrients.protein * 4) / latestNutrition.basic_nutrition.total_calories * 100)
              },
              carbs: {
                grams: latestNutrition.macronutrients.carbohydrates,
                calories: latestNutrition.macronutrients.carbohydrates * 4,
                percentage: Math.round((latestNutrition.macronutrients.carbohydrates * 4) / latestNutrition.basic_nutrition.total_calories * 100)
              },
              fat: {
                grams: latestNutrition.macronutrients.fat,
                calories: latestNutrition.macronutrients.fat * 9,
                percentage: Math.round((latestNutrition.macronutrients.fat * 9) / latestNutrition.basic_nutrition.total_calories * 100)
              }
            },
            calories: latestNutrition.basic_nutrition.total_calories,
            fiber: latestNutrition.macronutrients.fiber || 0,
            sodium: 0,
            sugar: 0,
            caloriesPerGram: latestNutrition.basic_nutrition.total_calories / latestNutrition.basic_nutrition.weight_per_serving
          }
        };
      }

      // Calculate serving information
      const servingInfo = calculateServingInfo(
        {
          calories_per_serving: nutritionData ? nutritionData.calories / nutritionData.servings : 0,
          total_servings: selectedProduct.servings_per_container,
          serving_size: selectedProduct.serving_size,
          servings_per_container: selectedProduct.servings_per_container
        },
        undefined,
        nutritionData
      );

      const servingBreakdown = generateServingBreakdown(servingInfo);

      // Convert nutrition data to nutrition facts format
      const nutritionFacts = [];
      if (nutritionData) {
        // Add macronutrients
        nutritionFacts.push(
          { name: 'Protein', amount: nutritionData.nutritionSummary.macronutrients.protein.grams, unit: 'g' },
          { name: 'Total Carbohydrate', amount: nutritionData.nutritionSummary.macronutrients.carbs.grams, unit: 'g' },
          { name: 'Total Fat', amount: nutritionData.nutritionSummary.macronutrients.fat.grams, unit: 'g' }
        );

        // Add key micronutrients from totalDaily
        Object.entries(nutritionData.totalDaily).forEach(([key, nutrient]) => {
          if (nutrient && ['NA', 'FIBTG', 'SUGAR', 'CHOLE', 'CA', 'FE', 'VITC', 'VITD'].includes(key)) {
            nutritionFacts.push({
              name: nutrient.label,
              amount: nutritionData.totalNutrients[key]?.quantity || 0,
              unit: nutritionData.totalNutrients[key]?.unit || 'mg',
              dailyValue: Math.round(nutrient.quantity)
            });
          }
        });
      }

      // Create label data
      const labelData: LabelData = {
        id: crypto.randomUUID(),
        productId: selectedProduct.id,
        productName: {
          english: selectedProduct.name,
          arabic: selectedProduct.name // You could add Arabic translation here
        },
        brandName: selectedProduct.user?.name || 'Your Brand',
        servingSize: servingBreakdown.display.servingSize,
        servingsPerContainer: servingBreakdown.display.servingsPerContainer.toString(),
        calories: Math.round(servingInfo.caloriesPerServing),
        nutrition: nutritionFacts,
        ingredients: {
          english: selectedProduct.ingredient_notes || 'See product packaging for ingredients',
          arabic: selectedProduct.ingredient_notes || 'انظر تغليف المنتج للمكونات'
        },
        allergens: {
          english: nutritionData?.allergens || [],
          arabic: nutritionData?.allergens || [] // You could add Arabic translations
        },
        netWeight: `${selectedProduct.serving_size} ${selectedProduct.serving_unit}`,
        layout: selectedTemplate.layout,
        typography: selectedTemplate.typography,
        branding: {
          colors: {
            primary: '#000000',
            secondary: '#666666',
            accent: '#22c55e',
            background: '#ffffff'
          }
        },
        regulatoryStandard: selectedTemplate.regulatory === 'MULTI' ? 'FDA' : selectedTemplate.regulatory,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setGeneratedLabel(labelData);
      toast.success('Label generated successfully!');

    } catch (error) {
      console.error('Failed to generate label:', error);
      toast.error('Failed to generate label');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBack = () => {
    if (step === 'select-template') {
      setStep('select-product');
    } else if (step === 'preview') {
      setStep('select-template');
    } else if (onBack) {
      onBack();
    } else {
      navigate('/label-generator');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Auto Label Generator</h1>
                <p className="text-sm text-muted-foreground">
                  Generate nutrition labels automatically from your product data
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2">
              <Badge variant={step === 'select-product' ? 'default' : 'secondary'}>
                1. Product
              </Badge>
              <Badge variant={step === 'select-template' ? 'default' : 'secondary'}>
                2. Template
              </Badge>
              <Badge variant={step === 'preview' ? 'default' : 'secondary'}>
                3. Preview
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Left Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 1: Product Selection */}
            {step === 'select-product' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Select Product
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Label htmlFor="product-select">Choose a product to generate label for:</Label>
                    <Select onValueChange={handleProductSelect}>
                      <SelectTrigger id="product-select">
                        <SelectValue placeholder="Select a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem value="loading" disabled>Loading products...</SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="empty" disabled>No products found</SelectItem>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    
                    {selectedProduct && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-muted/50 rounded-lg border"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{selectedProduct.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {selectedProduct.serving_size} {selectedProduct.serving_unit} per serving
                            </p>
                          </div>
                          <Badge variant="outline">
                            {selectedProduct.nutritional_data?.length ? 'Has Nutrition Data' : 'Basic Info Only'}
                          </Badge>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Template Selection */}
            {step === 'select-template' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Select Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div 
                        className="p-4 border rounded-lg cursor-pointer bg-primary/5 border-primary"
                        onClick={handleTemplateSelect}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{standardTemplate.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              FDA compliant nutrition label format
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{standardTemplate.regulatory}</Badge>
                            <CheckCircle className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Template Features</p>
                          <ul className="text-xs text-blue-700 mt-1 space-y-1">
                            <li>• FDA nutrition facts format</li>
                            <li>• Serving size and nutrition per serving</li>
                            <li>• Ingredients and allergen information</li>
                            <li>• Print-ready dimensions</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Generate & Preview */}
            {step === 'preview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Generate Label
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!generatedLabel ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Ready to generate your nutrition label using:
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Product:</span>
                            <span className="font-medium">{selectedProduct?.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Template:</span>
                            <span className="font-medium">{selectedTemplate.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Standard:</span>
                            <span className="font-medium">{selectedTemplate.regulatory}</span>
                          </div>
                        </div>
                        <Separator />
                        <Button 
                          onClick={generateLabelFromProduct}
                          disabled={isGenerating}
                          className="w-full"
                        >
                          {isGenerating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Generate Label
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium text-green-900">
                              Label Generated Successfully!
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-7">
            <Card className="h-[calc(100vh-200px)] overflow-hidden">
              {generatedLabel ? (
                <LabelPreview
                  labelData={generatedLabel}
                  isFullscreen={false}
                  onDataChange={() => {}}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8">
                  <div>
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Label Preview
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {step === 'select-product' && 'Select a product to start generating your nutrition label'}
                      {step === 'select-template' && 'Choose a template to continue'}
                      {step === 'preview' && 'Click generate to see your label preview here'}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}