import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Palette, 
  Move, 
  RotateCw,
  Crop,
  Maximize
} from 'lucide-react';
import { LabelData, Position, Dimensions } from '@/types/label';
import { toast } from 'sonner';

interface BrandingUploadProps {
  labelData: LabelData;
  onChange: (updates: Partial<LabelData>) => void;
}

const logoPositions = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center-left', label: 'Center Left' },
  { value: 'center', label: 'Center' },
  { value: 'center-right', label: 'Center Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'custom', label: 'Custom Position' }
];

export function BrandingUpload({ labelData, onChange }: BrandingUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setLogoPreview(url);
      
      onChange({
        branding: {
          ...labelData.branding,
          logo: {
            url,
            position: { x: 50, y: 20 },
            dimensions: { width: 60, height: 40 },
            opacity: 1
          }
        }
      });
      
      toast.success('Logo uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleLogoPositionChange = (position: string) => {
    if (!labelData.branding.logo) return;

    let newPosition: Position;
    const { width, height } = labelData.layout.dimensions;

    switch (position) {
      case 'top-left':
        newPosition = { x: 10, y: 10 };
        break;
      case 'top-center':
        newPosition = { x: width / 2 - 30, y: 10 };
        break;
      case 'top-right':
        newPosition = { x: width - 70, y: 10 };
        break;
      case 'center-left':
        newPosition = { x: 10, y: height / 2 - 20 };
        break;
      case 'center':
        newPosition = { x: width / 2 - 30, y: height / 2 - 20 };
        break;
      case 'center-right':
        newPosition = { x: width - 70, y: height / 2 - 20 };
        break;
      case 'bottom-left':
        newPosition = { x: 10, y: height - 50 };
        break;
      case 'bottom-center':
        newPosition = { x: width / 2 - 30, y: height - 50 };
        break;
      case 'bottom-right':
        newPosition = { x: width - 70, y: height - 50 };
        break;
      default:
        newPosition = labelData.branding.logo.position;
    }

    onChange({
      branding: {
        ...labelData.branding,
        logo: {
          ...labelData.branding.logo,
          position: newPosition
        }
      }
    });
  };

  const handleLogoUpdate = (updates: Partial<NonNullable<LabelData['branding']['logo']>>) => {
    if (!labelData.branding.logo) return;

    onChange({
      branding: {
        ...labelData.branding,
        logo: {
          ...labelData.branding.logo,
          ...updates
        }
      }
    });
  };

  const handleColorChange = (colorType: keyof LabelData['branding']['colors'], color: string) => {
    onChange({
      branding: {
        ...labelData.branding,
        colors: {
          ...labelData.branding.colors,
          [colorType]: color
        }
      }
    });
  };

  const removeLogo = () => {
    setLogoPreview(null);
    onChange({
      branding: {
        ...labelData.branding,
        logo: undefined
      }
    });
    toast.success('Logo removed');
  };

  return (
    <div className="space-y-6">
      
      {/* Logo Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Logo Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${logoPreview ? 'bg-muted/20' : 'hover:border-primary/50'}`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            {logoPreview ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-20 max-w-full object-contain rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogo();
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click to change logo or drag new file
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">Upload Logo</p>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, SVG up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          {/* Logo Controls */}
          {labelData.branding.logo && (
            <div className="space-y-4 pt-2">
              <Separator />
              
              {/* Position */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Position</Label>
                <Select onValueChange={handleLogoPositionChange}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {logoPositions.map(pos => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Position */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">X Position</Label>
                  <Input
                    type="number"
                    value={labelData.branding.logo.position.x}
                    onChange={(e) => handleLogoUpdate({
                      position: {
                        ...labelData.branding.logo!.position,
                        x: Number(e.target.value)
                      }
                    })}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Y Position</Label>
                  <Input
                    type="number"
                    value={labelData.branding.logo.position.y}
                    onChange={(e) => handleLogoUpdate({
                      position: {
                        ...labelData.branding.logo!.position,
                        y: Number(e.target.value)
                      }
                    })}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Width</Label>
                  <Input
                    type="number"
                    value={labelData.branding.logo.dimensions.width}
                    onChange={(e) => handleLogoUpdate({
                      dimensions: {
                        ...labelData.branding.logo!.dimensions,
                        width: Number(e.target.value)
                      }
                    })}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height</Label>
                  <Input
                    type="number"
                    value={labelData.branding.logo.dimensions.height}
                    onChange={(e) => handleLogoUpdate({
                      dimensions: {
                        ...labelData.branding.logo!.dimensions,
                        height: Number(e.target.value)
                      }
                    })}
                    className="h-8"
                  />
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-medium">Opacity</Label>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(labelData.branding.logo.opacity * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[labelData.branding.logo.opacity]}
                  onValueChange={(values) => handleLogoUpdate({ opacity: values[0] })}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Brand Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {Object.entries(labelData.branding.colors).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-xs font-medium capitalize">{key}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorChange(key as keyof LabelData['branding']['colors'], e.target.value)}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={value}
                  onChange={(e) => handleColorChange(key as keyof LabelData['branding']['colors'], e.target.value)}
                  className="h-8 w-24 text-xs font-mono"
                />
              </div>
            </div>
          ))}

          {/* Color Palette Presets */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-medium">Color Presets</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Ocean', colors: { primary: '#0ea5e9', secondary: '#64748b', accent: '#06b6d4', background: '#ffffff' } },
                { name: 'Forest', colors: { primary: '#059669', secondary: '#6b7280', accent: '#10b981', background: '#ffffff' } },
                { name: 'Sunset', colors: { primary: '#ea580c', secondary: '#78716c', accent: '#f59e0b', background: '#ffffff' } },
                { name: 'Modern', colors: { primary: '#1e293b', secondary: '#64748b', accent: '#3b82f6', background: '#ffffff' } }
              ].map(preset => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => onChange({
                    branding: {
                      ...labelData.branding,
                      colors: preset.colors
                    }
                  })}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}