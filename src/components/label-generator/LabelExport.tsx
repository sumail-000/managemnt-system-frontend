import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileImage, 
  FileText, 
  Printer,
  Settings,
  AlertTriangle,
  CheckCircle,
  History,
  Copy
} from 'lucide-react';
import { LabelData, ValidationResult, ExportOptions } from '@/types/label';
import { toast } from 'sonner';

interface LabelExportProps {
  labelData: LabelData;
  validation: ValidationResult;
}

const exportFormats = [
  { value: 'pdf', label: 'PDF (Print Ready)', icon: FileText, description: 'Vector format, ideal for printing' },
  { value: 'png', label: 'PNG (High Resolution)', icon: FileImage, description: 'Raster format, good for web' },
  { value: 'svg', label: 'SVG (Vector)', icon: FileText, description: 'Scalable vector graphics' },
  { value: 'jpeg', label: 'JPEG (Compressed)', icon: FileImage, description: 'Compressed format, smaller file size' }
];

const paperSizes = [
  { value: 'a4', label: 'A4 (210 × 297mm)', width: 210, height: 297 },
  { value: 'letter', label: 'Letter (216 × 279mm)', width: 216, height: 279 },
  { value: 'a3', label: 'A3 (297 × 420mm)', width: 297, height: 420 },
  { value: 'custom', label: 'Custom Size', width: 0, height: 0 }
];

const resolutionOptions = [
  { value: 150, label: '150 DPI (Web)', description: 'Good for screen viewing' },
  { value: 300, label: '300 DPI (Print)', description: 'Standard for printing' },
  { value: 600, label: '600 DPI (High Quality)', description: 'Premium print quality' }
];

export function LabelExport({ labelData, validation }: LabelExportProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    resolution: 300,
    paperSize: 'a4',
    labelsPerSheet: 1,
    includeCutLines: true,
    includeBleed: false,
    colorProfile: 'rgb'
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const calculateLabelsPerSheet = () => {
    const selectedPaper = paperSizes.find(p => p.value === exportOptions.paperSize);
    if (!selectedPaper || selectedPaper.value === 'custom') return 1;

    const labelWidth = labelData.layout.dimensions.width;
    const labelHeight = labelData.layout.dimensions.height;
    const margin = 10; // 10mm margin

    const availableWidth = selectedPaper.width - (margin * 2);
    const availableHeight = selectedPaper.height - (margin * 2);

    const labelsHorizontal = Math.floor(availableWidth / labelWidth);
    const labelsVertical = Math.floor(availableHeight / labelHeight);

    return Math.max(1, labelsHorizontal * labelsVertical);
  };

  const exportLabel = async () => {
    if (!validation.isValid) {
      toast.error('Please fix validation errors before exporting');
      return;
    }

    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would implement actual export logic based on format
      switch (exportOptions.format) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'png':
          await exportToPNG();
          break;
        case 'svg':
          await exportToSVG();
          break;
        case 'jpeg':
          await exportToJPEG();
          break;
      }

      toast.success(`Label exported as ${exportOptions.format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    
    const pdf = new jsPDF({
      orientation: labelData.layout.orientation === 'landscape' ? 'l' : 'p',
      unit: 'mm',
      format: exportOptions.paperSize === 'custom' ? 
        [labelData.layout.dimensions.width, labelData.layout.dimensions.height] : 
        exportOptions.paperSize as any
    });

    // Add label content to PDF
    // This would be implemented with proper canvas to PDF conversion
    pdf.text('Label Content', 10, 10);
    
    pdf.save(`${labelData.productName.english || 'label'}.pdf`);
  };

  const exportToPNG = async () => {
    // Convert canvas to PNG
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${labelData.productName.english || 'label'}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    }
  };

  const exportToSVG = async () => {
    // Generate SVG content
    const svgContent = `
      <svg width="${labelData.layout.dimensions.width}" height="${labelData.layout.dimensions.height}" xmlns="http://www.w3.org/2000/svg">
        <!-- SVG content would be generated here -->
        <text x="10" y="30" font-family="Arial" font-size="16">${labelData.productName.english}</text>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${labelData.productName.english || 'label'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToJPEG = async () => {
    // Convert canvas to JPEG
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${labelData.productName.english || 'label'}.jpg`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const maxLabelsPerSheet = calculateLabelsPerSheet();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" disabled={!validation.isValid}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Label
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          
          {/* Validation Status */}
          {!validation.isValid ? (
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Cannot export - validation errors found:</div>
                <ul className="text-sm space-y-1">
                  {validation.errors.slice(0, 3).map((error, index) => (
                    <li key={index}>• {error.message}</li>
                  ))}
                  {validation.errors.length > 3 && (
                    <li>• And {validation.errors.length - 3} more errors...</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Label is ready for export. {validation.warnings.length > 0 && 
                  `${validation.warnings.length} warning${validation.warnings.length !== 1 ? 's' : ''} found but export is allowed.`
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Format Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {exportFormats.map(format => (
                  <div
                    key={format.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      exportOptions.format === format.value 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleExportOptionChange('format', format.value)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <format.icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{format.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Print Settings */}
          {(exportOptions.format === 'pdf' || exportOptions.format === 'png') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Paper Size */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Paper Size</Label>
                  <Select 
                    value={exportOptions.paperSize} 
                    onValueChange={(value) => handleExportOptionChange('paperSize', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paperSizes.map(size => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Labels per Sheet */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Labels per Sheet</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={maxLabelsPerSheet}
                      value={exportOptions.labelsPerSheet}
                      onChange={(e) => handleExportOptionChange('labelsPerSheet', Number(e.target.value))}
                      className="h-8 flex-1"
                    />
                    <Badge variant="secondary" className="text-xs">
                      Max: {maxLabelsPerSheet}
                    </Badge>
                  </div>
                </div>

                {/* Resolution */}
                {exportOptions.format === 'png' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Resolution</Label>
                    <Select 
                      value={exportOptions.resolution.toString()} 
                      onValueChange={(value) => handleExportOptionChange('resolution', Number(value))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resolutionOptions.map(res => (
                          <SelectItem key={res.value} value={res.value.toString()}>
                            <div>
                              <div className="font-medium">{res.label}</div>
                              <div className="text-xs text-muted-foreground">{res.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Print Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cutLines"
                      checked={exportOptions.includeCutLines}
                      onCheckedChange={(checked) => handleExportOptionChange('includeCutLines', checked)}
                    />
                    <Label htmlFor="cutLines" className="text-xs">Include cut lines</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bleed"
                      checked={exportOptions.includeBleed}
                      onCheckedChange={(checked) => handleExportOptionChange('includeBleed', checked)}
                    />
                    <Label htmlFor="bleed" className="text-xs">Include bleed area (3mm)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Advanced Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Advanced Settings
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="h-6 text-xs"
                >
                  {showAdvanced ? 'Hide' : 'Show'}
                </Button>
              </CardTitle>
            </CardHeader>
            
            {showAdvanced && (
              <CardContent className="space-y-3">
                
                {/* Color Profile */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Color Profile</Label>
                  <Select 
                    value={exportOptions.colorProfile} 
                    onValueChange={(value: 'rgb' | 'cmyk') => handleExportOptionChange('colorProfile', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rgb">RGB (Web/Digital)</SelectItem>
                      <SelectItem value="cmyk">CMYK (Print)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Export Preview */}
                <div className="p-3 bg-muted/20 rounded border">
                  <div className="text-xs space-y-1">
                    <div><strong>File name:</strong> {labelData.productName.english || 'label'}.{exportOptions.format}</div>
                    <div><strong>Dimensions:</strong> {labelData.layout.dimensions.width} × {labelData.layout.dimensions.height}mm</div>
                    {exportOptions.format === 'png' && (
                      <div><strong>Resolution:</strong> {exportOptions.resolution} DPI</div>
                    )}
                    <div><strong>Estimated size:</strong> ~{Math.round(Math.random() * 500 + 200)}KB</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Export Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={exportLabel}
              disabled={isExporting || !validation.isValid}
              className="flex-1"
            >
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Label
                </>
              )}
            </Button>
            
            <Button variant="outline" className="px-3">
              <History className="h-4 w-4" />
            </Button>
          </div>

          {/* Export History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { name: 'nutrition-label.pdf', time: '2 hours ago', size: '245KB' },
                  { name: 'product-label.png', time: 'Yesterday', size: '512KB' },
                  { name: 'final-label.svg', time: '2 days ago', size: '89KB' }
                ].map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded text-xs">
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-muted-foreground">{file.time} • {file.size}</div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}