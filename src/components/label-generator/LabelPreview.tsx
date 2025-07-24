import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Grid3X3, 
  Maximize2, 
  Smartphone,
  Tablet,
  Monitor,
  Ruler
} from 'lucide-react';
import { LabelData } from '@/types/label';

interface LabelPreviewProps {
  labelData: LabelData;
  isFullscreen?: boolean;
  onDataChange: (updates: Partial<LabelData>) => void;
}

export function LabelPreview({ labelData, isFullscreen, onDataChange }: LabelPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  const zoomLevels = [25, 50, 75, 100, 125, 150, 200];

  // Calculate preview dimensions
  const getPreviewDimensions = useCallback(() => {
    const { width, height } = labelData.layout.dimensions;
    const aspectRatio = width / height;
    
    let maxWidth, maxHeight;
    
    switch (previewMode) {
      case 'mobile':
        maxWidth = 320;
        maxHeight = 568;
        break;
      case 'tablet':
        maxWidth = 768;
        maxHeight = 1024;
        break;
      default:
        maxWidth = containerRef.current?.clientWidth || 600;
        maxHeight = containerRef.current?.clientHeight || 800;
    }
    
    const scale = Math.min(
      (maxWidth * 0.8) / width,
      (maxHeight * 0.8) / height
    );
    
    return {
      width: width * scale * (zoom / 100),
      height: height * scale * (zoom / 100),
      scale: scale * (zoom / 100)
    };
  }, [labelData.layout.dimensions, zoom, previewMode]);

  // Render label content
  const renderLabel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, scale } = getPreviewDimensions();
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas
    ctx.fillStyle = labelData.branding.colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Apply scale
    ctx.scale(scale, scale);
    
    // Render grid if enabled
    if (showGrid) {
      renderGrid(ctx, labelData.layout.dimensions);
    }
    
    // Render label sections
    renderLabelSections(ctx);
    
    // Render QR code if present
    if (labelData.qrCode && labelData.qrCode.content) {
      renderQRCode(ctx);
    }
    
    // Render logo if present
    if (labelData.branding.logo) {
      renderLogo(ctx);
    }
    
  }, [labelData, zoom, showGrid, getPreviewDimensions]);

  const renderGrid = (ctx: CanvasRenderingContext2D, dimensions: { width: number; height: number }) => {
    const gridSize = 10;
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);
    
    // Vertical lines
    for (let x = 0; x <= dimensions.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, dimensions.height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y <= dimensions.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(dimensions.width, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  };

  const renderLabelSections = (ctx: CanvasRenderingContext2D) => {
    const { margins } = labelData.layout;
    const { fontSizes, colors, primaryFont } = labelData.typography;
    
    let currentY = margins.top + 20;
    const contentWidth = labelData.layout.dimensions.width - margins.left - margins.right;
    
    // Product Name (Bilingual)
    if (labelData.productName.english || labelData.productName.arabic) {
      ctx.fillStyle = colors.primary;
      ctx.font = `bold ${fontSizes.heading}px ${primaryFont}`;
      ctx.textAlign = 'center';
      
      if (labelData.productName.english) {
        ctx.fillText(
          labelData.productName.english,
          labelData.layout.dimensions.width / 2,
          currentY
        );
        currentY += fontSizes.heading + 5;
      }
      
      if (labelData.productName.arabic) {
        ctx.font = `bold ${fontSizes.heading}px "Noto Sans Arabic"`;
        ctx.direction = 'rtl';
        ctx.fillText(
          labelData.productName.arabic,
          labelData.layout.dimensions.width / 2,
          currentY
        );
        ctx.direction = 'ltr';
        currentY += fontSizes.heading + 15;
      }
    }
    
    // Brand Name
    if (labelData.brandName) {
      ctx.fillStyle = colors.secondary;
      ctx.font = `${fontSizes.subheading}px ${primaryFont}`;
      ctx.textAlign = 'center';
      ctx.fillText(
        labelData.brandName,
        labelData.layout.dimensions.width / 2,
        currentY
      );
      currentY += fontSizes.subheading + 20;
    }
    
    // Nutrition Facts Header
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${fontSizes.subheading}px ${primaryFont}`;
    ctx.textAlign = 'left';
    ctx.fillText('Nutrition Facts', margins.left, currentY);
    currentY += fontSizes.subheading + 10;
    
    // Serving Size
    if (labelData.servingSize) {
      ctx.fillStyle = colors.secondary;
      ctx.font = `${fontSizes.body}px ${primaryFont}`;
      ctx.fillText(`Serving Size: ${labelData.servingSize}`, margins.left, currentY);
      currentY += fontSizes.body + 5;
    }
    
    // Calories
    if (labelData.calories > 0) {
      ctx.fillStyle = colors.primary;
      ctx.font = `bold ${fontSizes.subheading}px ${primaryFont}`;
      ctx.fillText(`Calories: ${labelData.calories}`, margins.left, currentY);
      currentY += fontSizes.subheading + 15;
    }
    
    // Nutrition Facts
    labelData.nutrition.forEach(nutrient => {
      ctx.fillStyle = colors.secondary;
      ctx.font = `${fontSizes.body}px ${primaryFont}`;
      ctx.fillText(
        `${nutrient.name}: ${nutrient.amount}${nutrient.unit}`,
        margins.left,
        currentY
      );
      
      if (nutrient.dailyValue) {
        ctx.textAlign = 'right';
        ctx.fillText(
          `${nutrient.dailyValue}%`,
          labelData.layout.dimensions.width - margins.right,
          currentY
        );
        ctx.textAlign = 'left';
      }
      
      currentY += fontSizes.body + 3;
    });
    
    // Ingredients (if they fit)
    if (labelData.ingredients.english && currentY < labelData.layout.dimensions.height - 100) {
      currentY += 15;
      ctx.fillStyle = colors.primary;
      ctx.font = `bold ${fontSizes.body}px ${primaryFont}`;
      ctx.fillText('Ingredients:', margins.left, currentY);
      currentY += fontSizes.body + 5;
      
      ctx.fillStyle = colors.secondary;
      ctx.font = `${fontSizes.small}px ${primaryFont}`;
      
      // Word wrap for ingredients
      const words = labelData.ingredients.english.split(' ');
      let line = '';
      
      words.forEach(word => {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > contentWidth && line !== '') {
          ctx.fillText(line, margins.left, currentY);
          line = word + ' ';
          currentY += fontSizes.small + 2;
        } else {
          line = testLine;
        }
      });
      
      if (line) {
        ctx.fillText(line, margins.left, currentY);
      }
    }
  };

  const renderQRCode = (ctx: CanvasRenderingContext2D) => {
    if (!labelData.qrCode) return;
    
    // Draw QR code placeholder (would be replaced with actual QR code generation)
    const { position, size } = labelData.qrCode;
    
    ctx.fillStyle = labelData.qrCode.backgroundColor;
    ctx.fillRect(position.x, position.y, size, size);
    
    ctx.strokeStyle = labelData.qrCode.color;
    ctx.lineWidth = 1;
    ctx.strokeRect(position.x, position.y, size, size);
    
    // Draw QR pattern simulation
    ctx.fillStyle = labelData.qrCode.color;
    const cellSize = size / 10;
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j) % 3 === 0) {
          ctx.fillRect(
            position.x + i * cellSize,
            position.y + j * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }
  };

  const renderLogo = (ctx: CanvasRenderingContext2D) => {
    if (!labelData.branding.logo) return;
    
    const { position, dimensions, opacity } = labelData.branding.logo;
    
    // Draw logo placeholder
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(position.x, position.y, dimensions.width, dimensions.height);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(position.x, position.y, dimensions.width, dimensions.height);
    
    // Add "LOGO" text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'LOGO',
      position.x + dimensions.width / 2,
      position.y + dimensions.height / 2 + 4
    );
    
    ctx.restore();
  };

  useEffect(() => {
    renderLabel();
  }, [renderLabel]);

  const handleZoomChange = (newZoom: number[]) => {
    setZoom(newZoom[0]);
  };

  const zoomIn = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex < zoomLevels.length - 1) {
      setZoom(zoomLevels[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const currentIndex = zoomLevels.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomLevels[currentIndex - 1]);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Preview Controls */}
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={zoom === zoomLevels[0]}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            
            <div className="flex items-center gap-2 min-w-[120px]">
              <Slider
                value={[zoom]}
                onValueChange={handleZoomChange}
                min={zoomLevels[0]}
                max={zoomLevels[zoomLevels.length - 1]}
                step={25}
                className="flex-1"
              />
              <Badge variant="secondary" className="text-xs min-w-[45px] text-center">
                {zoom}%
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={zoom === zoomLevels[zoomLevels.length - 1]}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={showGrid ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid3X3 className="h-3 w-3 mr-1" />
              Grid
            </Button>
            
            <Button
              variant={showRulers ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRulers(!showRulers)}
            >
              <Ruler className="h-3 w-3 mr-1" />
              Rulers
            </Button>
          </div>

          {/* Device Preview */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={previewMode === 'desktop' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
              className="h-7 px-2"
            >
              <Monitor className="h-3 w-3" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
              className="h-7 px-2"
            >
              <Tablet className="h-3 w-3" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
              className="h-7 px-2"
            >
              <Smartphone className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/10 p-4"
      >
        <motion.div 
          className="flex items-center justify-center min-h-full"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            {/* Rulers */}
            {showRulers && (
              <>
                {/* Horizontal Ruler */}
                <div className="absolute -top-6 left-0 right-0 h-6 bg-background border border-border text-xs">
                  {/* Ruler markings would go here */}
                </div>
                
                {/* Vertical Ruler */}
                <div className="absolute -left-6 top-0 bottom-0 w-6 bg-background border border-border text-xs">
                  {/* Ruler markings would go here */}
                </div>
              </>
            )}
            
            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="border border-border shadow-lg bg-white"
              style={{
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
            
            {/* Label Info Overlay */}
            <div className="absolute -bottom-8 left-0 right-0 text-center">
              <Badge variant="secondary" className="text-xs">
                {labelData.layout.dimensions.width} × {labelData.layout.dimensions.height}mm
              </Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}