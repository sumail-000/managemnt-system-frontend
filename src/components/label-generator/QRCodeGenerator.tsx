import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  QrCode, 
  Download,
  Copy,
  Eye,
  EyeOff,
  Maximize,
  Link,
  FileText,
  List,
  AlertTriangle
} from 'lucide-react';
import { LabelData, QRCodeData } from '@/types/label';
import { toast } from 'sonner';
import { isValidUrl, validateUrl, formatUrl } from '@/utils/urlValidation';

interface QRCodeGeneratorProps {
  labelData: LabelData;
  onChange: (updates: Partial<LabelData>) => void;
}

const qrCodeTypes = [
  { value: 'url', label: 'Product URL', icon: Link },
  { value: 'nutrition', label: 'Nutrition Facts', icon: FileText },
  { value: 'ingredients', label: 'Ingredients List', icon: List },
  { value: 'custom', label: 'Custom Text', icon: QrCode }
];

const errorCorrectionLevels = [
  { value: 'L', label: 'Low (7%)', description: 'Suitable for clean environments' },
  { value: 'M', label: 'Medium (15%)', description: 'Most common choice' },
  { value: 'Q', label: 'Quartile (25%)', description: 'Good for slightly damaged codes' },
  { value: 'H', label: 'High (30%)', description: 'Best for harsh conditions' }
];

const qrPositions = [
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'center', label: 'Center' },
  { value: 'custom', label: 'Custom Position' }
];

export function QRCodeGenerator({ labelData, onChange }: QRCodeGeneratorProps) {
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [urlError, setUrlError] = useState<string>('');

  const qrData = labelData.qrCode || {
    content: '',
    type: 'url',
    size: 50,
    position: { x: 10, y: 10 },
    errorCorrectionLevel: 'M',
    color: '#000000',
    backgroundColor: '#ffffff',
    logoEmbedded: false
  };

  const handleQRCodeUpdate = (updates: Partial<QRCodeData>) => {
    const newQRData = { ...qrData, ...updates };
    
    // Clear URL error when switching away from URL type
    if (updates.type !== undefined && updates.type !== 'url') {
      setUrlError('');
    }
    
    // Validate URL if content is being updated and type is URL
    if (updates.content !== undefined && (newQRData.type === 'url' || updates.type === 'url')) {
      const error = validateUrl(updates.content || '');
      setUrlError(error);
    }
    
    onChange({ qrCode: newQRData });
  };

  const generateQRContent = () => {
    switch (qrData.type) {
      case 'nutrition':
        const nutritionData = {
          product: labelData.productName?.english || 'Product',
          calories: labelData.calories || 0,
          servingSize: labelData.servingSize || 'Not specified',
          nutrition: labelData.nutrition || []
        };
        return JSON.stringify(nutritionData);
      case 'ingredients':
        const ingredients = labelData.ingredients?.english || 'No ingredients specified';
        return `Ingredients: ${ingredients}`;
      case 'url':
        // Ensure URL is properly formatted
        const url = qrData.content || '';
        return url.trim() ? (isValidUrl(url) ? url : formatUrl(url)) : 'https://example.com';
      case 'custom':
        return qrData.content || 'Custom QR Code';
      default:
        return qrData.content || 'QR Code Content';
    }
  };

  const generateQRCode = async () => {
    // Validate content based on type
    if (qrData.type === 'url') {
      if (!qrData.content) {
        toast.error('Please enter a URL for the QR code');
        return;
      }
      const urlValidationError = validateUrl(qrData.content);
      if (urlValidationError) {
        toast.error(urlValidationError);
        return;
      }
    } else if (qrData.type === 'custom' && !qrData.content) {
      toast.error('Please enter content for the QR code');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Import QRCode library dynamically
      const QRCode = (await import('qrcode')).default;
      
      const content = generateQRContent();
      
      // Validate that content is not empty
      if (!content || content.trim() === '') {
        throw new Error('No input text');
      }
      
      const qrCodeDataURL = await QRCode.toDataURL(content, {
        errorCorrectionLevel: qrData.errorCorrectionLevel as any,
        margin: 1,
        color: {
          dark: qrData.color,
          light: qrData.backgroundColor
        },
        width: qrData.size * 4 // Higher resolution for preview
      });
      
      setQrPreview(qrCodeDataURL);
      toast.success('QR code generated successfully');
    } catch (error) {
      toast.error(`QR Code generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('QR Code generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePositionChange = (position: string) => {
    let newPosition = { x: 10, y: 10 };
    const { width, height } = labelData.layout.dimensions;
    const qrSize = qrData.size;

    switch (position) {
      case 'top-right':
        newPosition = { x: width - qrSize - 10, y: 10 };
        break;
      case 'top-left':
        newPosition = { x: 10, y: 10 };
        break;
      case 'bottom-right':
        newPosition = { x: width - qrSize - 10, y: height - qrSize - 10 };
        break;
      case 'bottom-left':
        newPosition = { x: 10, y: height - qrSize - 10 };
        break;
      case 'center':
        newPosition = { x: (width - qrSize) / 2, y: (height - qrSize) / 2 };
        break;
    }

    handleQRCodeUpdate({ position: newPosition });
  };

  const copyQRContent = () => {
    const content = generateQRContent();
    navigator.clipboard.writeText(content);
    toast.success('QR code content copied to clipboard');
  };

  useEffect(() => {
    // Only generate QR code if we have valid content
    const content = generateQRContent();
    if (content && content.trim() !== '') {
      generateQRCode();
    }
  }, [qrData.type, qrData.errorCorrectionLevel, qrData.color, qrData.backgroundColor, qrData.content, labelData]);

  return (
    <div className="space-y-6">
      
      {/* QR Code Type */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Code Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Content Type</Label>
            <Select 
              value={qrData.type} 
              onValueChange={(value: QRCodeData['type']) => handleQRCodeUpdate({ type: value })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qrCodeTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-3 w-3" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Content */}
          {qrData.type === 'custom' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Custom Content</Label>
              <Textarea
                placeholder="Enter URL, text, or any data for the QR code..."
                value={qrData.content}
                onChange={(e) => handleQRCodeUpdate({ content: e.target.value })}
                className="min-h-[80px] text-xs"
              />
            </div>
          )}

          {qrData.type === 'url' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Product Public Page URL</Label>
              <Input
                placeholder="https://example.com/public/product/123"
                value={qrData.content}
                onChange={(e) => {
                  const value = e.target.value;
                  handleQRCodeUpdate({ content: value });
                }}
                onBlur={(e) => {
                  // Auto-format URL on blur if it's not empty and doesn't have protocol
                  const value = e.target.value.trim();
                  if (value && !value.match(/^https?:\/\//i)) {
                    const formatted = formatUrl(value);
                    handleQRCodeUpdate({ content: formatted });
                  }
                }}
                className={`h-8 ${urlError ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {urlError && (
                <p className="text-xs text-red-500 mt-1">{urlError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the public URL where users will be redirected when they scan the QR code. You can manually enter any URL or paste a product's public page URL.
              </p>
            </div>
          )}

          {/* Content Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Generated Content</Label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 px-2"
                >
                  {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyQRContent}
                  className="h-6 px-2"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {showPreview && (
              <div className="p-3 bg-muted/20 rounded border text-xs font-mono max-h-24 overflow-y-auto">
                {generateQRContent() || 'No content to display'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Settings & Styling</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Size */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">Size</Label>
              <Badge variant="secondary" className="text-xs">
                {qrData.size}×{qrData.size}mm
              </Badge>
            </div>
            <Slider
              value={[qrData.size]}
              onValueChange={(values) => handleQRCodeUpdate({ size: values[0] })}
              min={20}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Error Correction Level */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Error Correction</Label>
            <Select 
              value={qrData.errorCorrectionLevel} 
              onValueChange={(value: QRCodeData['errorCorrectionLevel']) => 
                handleQRCodeUpdate({ errorCorrectionLevel: value })
              }
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {errorCorrectionLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    <div>
                      <div className="font-medium">{level.label}</div>
                      <div className="text-xs text-muted-foreground">{level.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Foreground</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={qrData.color}
                  onChange={(e) => handleQRCodeUpdate({ color: e.target.value })}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={qrData.color}
                  onChange={(e) => handleQRCodeUpdate({ color: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium">Background</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={qrData.backgroundColor}
                  onChange={(e) => handleQRCodeUpdate({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={qrData.backgroundColor}
                  onChange={(e) => handleQRCodeUpdate({ backgroundColor: e.target.value })}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Position */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Position on Label</Label>
            
            <Select onValueChange={handlePositionChange}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {qrPositions.map(pos => (
                  <SelectItem key={pos.value} value={pos.value}>
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Custom Position */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">X Position (mm)</Label>
                <Input
                  type="number"
                  value={qrData.position.x}
                  onChange={(e) => handleQRCodeUpdate({
                    position: { ...qrData.position, x: Number(e.target.value) }
                  })}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y Position (mm)</Label>
                <Input
                  type="number"
                  value={qrData.position.y}
                  onChange={(e) => handleQRCodeUpdate({
                    position: { ...qrData.position, y: Number(e.target.value) }
                  })}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          {/* Logo Embedding */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Embed Logo in QR Code</Label>
              <p className="text-xs text-muted-foreground">
                Requires logo to be uploaded in Branding section
              </p>
            </div>
            <Switch
              checked={qrData.logoEmbedded}
              onCheckedChange={(checked) => handleQRCodeUpdate({ logoEmbedded: checked })}
              disabled={!labelData.branding.logo}
            />
          </div>
        </CardContent>
      </Card>

      {/* QR Code Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Preview & Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Preview */}
          <div className="text-center space-y-3">
            {qrPreview ? (
              <div className="inline-block p-4 bg-white rounded border">
                <img
                  src={qrPreview}
                  alt="QR Code Preview"
                  className="max-w-full h-auto"
                  style={{ maxHeight: '150px' }}
                />
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">QR code preview will appear here</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={generateQRCode}
              disabled={isGenerating}
              className="flex-1"
              size="sm"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <QrCode className="h-3 w-3 mr-1" />
                  Generate
                </>
              )}
            </Button>
            
            {qrPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = 'qr-code.png';
                  link.href = qrPreview;
                  link.click();
                  toast.success('QR code downloaded');
                }}
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Warning for complex content */}
          {qrData.type === 'nutrition' && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium">Complex Content Warning</p>
                  <p className="text-muted-foreground mt-1">
                    Nutrition data may create large QR codes. Consider using a URL link instead for better scannability.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}