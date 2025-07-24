import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Download, 
  Eye, 
  Settings, 
  Palette, 
  Type, 
  QrCode,
  Upload,
  RotateCcw,
  Copy,
  History
} from 'lucide-react';
import { toast } from 'sonner';

import { LabelPreview } from './LabelPreview';
import { LabelCustomizer } from './LabelCustomizer';
import { BilingualEditor } from './BilingualEditor';
import { BrandingUpload } from './BrandingUpload';
import { QRCodeGenerator } from './QRCodeGenerator';
import { LabelExport } from './LabelExport';
import { LabelData, LabelTemplate, ValidationResult } from '@/types/label';

interface LabelGeneratorProps {
  productId?: string;
  initialData?: Partial<LabelData>;
  templates?: LabelTemplate[];
}

const defaultLabelData: LabelData = {
  id: crypto.randomUUID(),
  productName: { english: '', arabic: '' },
  brandName: '',
  servingSize: '100g',
  servingsPerContainer: '1',
  calories: 0,
  nutrition: [],
  ingredients: { english: '', arabic: '' },
  allergens: { english: [], arabic: [] },
  netWeight: '',
  layout: {
    orientation: 'portrait',
    dimensions: { width: 210, height: 297 }, // A4
    margins: { top: 10, right: 10, bottom: 10, left: 10 },
    template: 'standard-fda',
    sections: []
  },
  typography: {
    primaryFont: 'Inter',
    arabicFont: 'Noto Sans Arabic',
    fontSizes: { heading: 16, subheading: 14, body: 12, small: 10 },
    colors: { primary: '#1a1a1a', secondary: '#666666', accent: '#22c55e' },
    lineSpacing: 1.2,
    characterSpacing: 0
  },
  branding: {
    colors: {
      primary: '#22c55e',
      secondary: '#666666',
      accent: '#ff6b35',
      background: '#ffffff'
    }
  },
  regulatoryStandard: 'FDA',
  createdAt: new Date(),
  updatedAt: new Date()
};

export function LabelGenerator({ productId, initialData, templates }: LabelGeneratorProps) {
  const [labelData, setLabelData] = useState<LabelData>({
    ...defaultLabelData,
    ...initialData
  });
  
  const [validation, setValidation] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: []
  });
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<LabelTemplate[]>(templates || []);
  const [activeTab, setActiveTab] = useState('content');
  const [isDirty, setIsDirty] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 2000);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [labelData, isDirty]);

  const handleAutoSave = useCallback(() => {
    // Auto-save logic here
    setIsDirty(false);
    console.log('Auto-saved label data');
  }, [labelData]);

  const handleDataChange = useCallback((updates: Partial<LabelData>) => {
    setLabelData(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date()
    }));
    setIsDirty(true);
  }, []);

  const handleSave = async () => {
    try {
      // Save logic here
      toast.success('Label saved successfully');
      setIsDirty(false);
    } catch (error) {
      toast.error('Failed to save label');
    }
  };

  const handleTemplateLoad = (template: LabelTemplate) => {
    handleDataChange({
      layout: template.layout,
      typography: template.typography
    });
    toast.success(`Template "${template.name}" loaded`);
  };

  const validateLabel = useCallback((): ValidationResult => {
    const errors = [];
    const warnings = [];

    // Required field validation
    if (!labelData.productName.english.trim()) {
      errors.push({
        field: 'productName',
        message: 'Product name is required',
        severity: 'error' as const
      });
    }

    if (!labelData.brandName.trim()) {
      warnings.push({
        field: 'brandName',
        message: 'Brand name is recommended',
        suggestion: 'Add your brand name for better identification'
      });
    }

    // Regulatory compliance checks
    if (labelData.regulatoryStandard === 'FDA' && labelData.nutrition.length === 0) {
      errors.push({
        field: 'nutrition',
        message: 'Nutrition facts are required for FDA compliance',
        severity: 'error' as const
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [labelData]);

  useEffect(() => {
    setValidation(validateLabel());
  }, [validateLabel]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.div 
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Label Generator</h1>
                <p className="text-sm text-muted-foreground">
                  Create professional food labels with bilingual support
                </p>
              </div>
              {isDirty && (
                <Badge variant="secondary" className="animate-pulse">
                  Unsaved changes
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="hidden md:flex"
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={!isDirty}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>

              <LabelExport 
                labelData={labelData}
                validation={validation}
              />
            </div>
          </div>

          {/* Validation Status */}
          {!validation.isValid && (
            <motion.div 
              className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <div className="flex items-center gap-2 text-destructive text-sm">
                <span className="font-medium">
                  {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''} found
                </span>
                {validation.warnings.length > 0 && (
                  <span className="text-warning">
                    · {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          
          {/* Controls Panel */}
          <motion.div 
            className={`${isPreviewMode ? 'lg:col-span-4' : 'lg:col-span-6'} transition-all duration-300`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="p-4 pb-0">
                  <TabsList className="grid w-full grid-cols-5 bg-muted/50">
                    <TabsTrigger value="content" className="text-xs">
                      <Type className="h-3 w-3 mr-1" />
                      Content
                    </TabsTrigger>
                    <TabsTrigger value="design" className="text-xs">
                      <Settings className="h-3 w-3 mr-1" />
                      Design
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="text-xs">
                      <Palette className="h-3 w-3 mr-1" />
                      Brand
                    </TabsTrigger>
                    <TabsTrigger value="qr" className="text-xs">
                      <QrCode className="h-3 w-3 mr-1" />
                      QR
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      Media
                    </TabsTrigger>
                  </TabsList>
                </div>

                <ScrollArea className="flex-1 px-4 pb-4">
                  <TabsContent value="content" className="mt-4 space-y-4">
                    <BilingualEditor
                      labelData={labelData}
                      onChange={handleDataChange}
                      validation={validation}
                    />
                  </TabsContent>

                  <TabsContent value="design" className="mt-4 space-y-4">
                    <LabelCustomizer
                      labelData={labelData}
                      onChange={handleDataChange}
                      templates={savedTemplates}
                      onTemplateLoad={handleTemplateLoad}
                    />
                  </TabsContent>

                  <TabsContent value="branding" className="mt-4 space-y-4">
                    <BrandingUpload
                      labelData={labelData}
                      onChange={handleDataChange}
                    />
                  </TabsContent>

                  <TabsContent value="qr" className="mt-4 space-y-4">
                    <QRCodeGenerator
                      labelData={labelData}
                      onChange={handleDataChange}
                    />
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4 space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Media upload functionality</p>
                      <p className="text-sm">Coming soon...</p>
                    </div>
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </Card>
          </motion.div>

          {/* Preview Panel */}
          <motion.div 
            className={`${isPreviewMode ? 'lg:col-span-8' : 'lg:col-span-6'} transition-all duration-300`}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full bg-card border-border/50 overflow-hidden">
              <LabelPreview
                labelData={labelData}
                isFullscreen={isPreviewMode}
                onDataChange={handleDataChange}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}