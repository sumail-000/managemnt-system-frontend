import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Layout, 
  Palette, 
  Type, 
  Ruler, 
  RotateCw,
  Monitor
} from 'lucide-react';
import { LabelData, LabelTemplate } from '@/types/label';

interface LabelCustomizerProps {
  labelData: LabelData;
  onChange: (updates: Partial<LabelData>) => void;
  templates?: LabelTemplate[];
  onTemplateLoad?: (template: LabelTemplate) => void;
}

const standardSizes = [
  { name: 'A4', width: 210, height: 297 },
  { name: 'Letter', width: 216, height: 279 },
  { name: 'Custom Label 1', width: 100, height: 150 },
  { name: 'Custom Label 2', width: 75, height: 100 },
];

const fontOptions = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Source Sans Pro'
];

const arabicFonts = [
  'Noto Sans Arabic',
  'Amiri',
  'Cairo',
  'Tajawal',
  'Markazi Text'
];

export function LabelCustomizer({ labelData, onChange, templates, onTemplateLoad }: LabelCustomizerProps) {
  
  const handleLayoutChange = (updates: Partial<LabelData['layout']>) => {
    onChange({
      layout: {
        ...labelData.layout,
        ...updates
      }
    });
  };

  const handleTypographyChange = (updates: Partial<LabelData['typography']>) => {
    onChange({
      typography: {
        ...labelData.typography,
        ...updates
      }
    });
  };

  const handleDimensionChange = (dimension: 'width' | 'height', value: number) => {
    handleLayoutChange({
      dimensions: {
        ...labelData.layout.dimensions,
        [dimension]: value
      }
    });
  };

  const handleMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    handleLayoutChange({
      margins: {
        ...labelData.layout.margins,
        [side]: value
      }
    });
  };

  const handleFontSizeChange = (type: keyof LabelData['typography']['fontSizes'], value: number) => {
    handleTypographyChange({
      fontSizes: {
        ...labelData.typography.fontSizes,
        [type]: value
      }
    });
  };

  const handleColorChange = (type: keyof LabelData['typography']['colors'], color: string) => {
    handleTypographyChange({
      colors: {
        ...labelData.typography.colors,
        [type]: color
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Templates */}
      {templates && templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {templates.map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-start"
                  onClick={() => onTemplateLoad?.(template)}
                >
                  <div className="text-xs font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {template.regulatory}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layout Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Layout & Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Orientation */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Orientation</Label>
            <div className="flex gap-2">
              <Button
                variant={labelData.layout.orientation === 'portrait' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLayoutChange({ orientation: 'portrait' })}
                className="flex-1"
              >
                <Monitor className="h-3 w-3 mr-1 rotate-90" />
                Portrait
              </Button>
              <Button
                variant={labelData.layout.orientation === 'landscape' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLayoutChange({ orientation: 'landscape' })}
                className="flex-1"
              >
                <Monitor className="h-3 w-3 mr-1" />
                Landscape
              </Button>
            </div>
          </div>

          {/* Standard Sizes */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Standard Sizes</Label>
            <Select onValueChange={(value) => {
              const size = standardSizes.find(s => s.name === value);
              if (size) {
                handleLayoutChange({
                  dimensions: { width: size.width, height: size.height }
                });
              }
            }}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {standardSizes.map(size => (
                  <SelectItem key={size.name} value={size.name}>
                    {size.name} ({size.width} × {size.height}mm)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Width (mm)</Label>
              <Input
                type="number"
                value={labelData.layout.dimensions.width}
                onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Height (mm)</Label>
              <Input
                type="number"
                value={labelData.layout.dimensions.height}
                onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                className="h-8"
              />
            </div>
          </div>

          <Separator />

          {/* Margins */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Margins (mm)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Top</Label>
                <Input
                  type="number"
                  value={labelData.layout.margins.top}
                  onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Right</Label>
                <Input
                  type="number"
                  value={labelData.layout.margins.right}
                  onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Bottom</Label>
                <Input
                  type="number"
                  value={labelData.layout.margins.bottom}
                  onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Left</Label>
                <Input
                  type="number"
                  value={labelData.layout.margins.left}
                  onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Type className="h-4 w-4" />
            Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Font Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Primary Font</Label>
              <Select 
                value={labelData.typography.primaryFont}
                onValueChange={(value) => handleTypographyChange({ primaryFont: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontOptions.map(font => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs font-medium">Arabic Font</Label>
              <Select 
                value={labelData.typography.arabicFont}
                onValueChange={(value) => handleTypographyChange({ arabicFont: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {arabicFonts.map(font => (
                    <SelectItem key={font} value={font}>
                      {font}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Font Sizes */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Font Sizes (px)</Label>
            
            {Object.entries(labelData.typography.fontSizes).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs capitalize">{key}</Label>
                  <Badge variant="secondary" className="text-xs">
                    {value}px
                  </Badge>
                </div>
                <Slider
                  value={[value]}
                  onValueChange={(values) => handleFontSizeChange(key as keyof LabelData['typography']['fontSizes'], values[0])}
                  min={8}
                  max={32}
                  step={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Colors */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Colors</Label>
            
            {Object.entries(labelData.typography.colors).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-xs capitalize">{key}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof LabelData['typography']['colors'], e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <Input
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof LabelData['typography']['colors'], e.target.value)}
                    className="h-8 w-20 text-xs font-mono"
                  />
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Text Settings */}
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Line Spacing</Label>
                <Badge variant="secondary" className="text-xs">
                  {labelData.typography.lineSpacing}
                </Badge>
              </div>
              <Slider
                value={[labelData.typography.lineSpacing]}
                onValueChange={(values) => handleTypographyChange({ lineSpacing: values[0] })}
                min={0.8}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs">Character Spacing</Label>
                <Badge variant="secondary" className="text-xs">
                  {labelData.typography.characterSpacing}px
                </Badge>
              </div>
              <Slider
                value={[labelData.typography.characterSpacing]}
                onValueChange={(values) => handleTypographyChange({ characterSpacing: values[0] })}
                min={-2}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regulatory Standard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Regulatory Standard</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={labelData.regulatoryStandard}
            onValueChange={(value: LabelData['regulatoryStandard']) => onChange({ regulatoryStandard: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FDA">FDA (United States)</SelectItem>
              <SelectItem value="EU">EU (European Union)</SelectItem>
              <SelectItem value="SFDA">SFDA (Saudi Arabia)</SelectItem>
              <SelectItem value="CUSTOM">Custom</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}