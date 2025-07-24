import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Layout, 
  Search, 
  Star, 
  Download, 
  Eye,
  Copy,
  Filter
} from 'lucide-react';
import { LabelTemplate } from '@/types/label';
import { toast } from 'sonner';

interface TemplateLibraryProps {
  onTemplateSelect: (template: LabelTemplate) => void;
}

const predefinedTemplates: LabelTemplate[] = [
  {
    id: 'fda-standard',
    name: 'FDA Standard',
    category: 'food',
    regulatory: 'FDA',
    layout: {
      orientation: 'portrait',
      dimensions: { width: 100, height: 150 },
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      template: 'fda-standard',
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
    thumbnail: '/api/placeholder/120/160',
    isDefault: true,
    createdAt: new Date()
  },
  {
    id: 'eu-nutrition',
    name: 'EU Nutrition Label',
    category: 'food',
    regulatory: 'EU',
    layout: {
      orientation: 'portrait',
      dimensions: { width: 85, height: 120 },
      margins: { top: 8, right: 8, bottom: 8, left: 8 },
      template: 'eu-standard',
      sections: []
    },
    typography: {
      primaryFont: 'Inter',
      arabicFont: 'Noto Sans Arabic',
      fontSizes: { heading: 14, subheading: 12, body: 10, small: 8 },
      colors: { primary: '#1e293b', secondary: '#64748b', accent: '#3b82f6' },
      lineSpacing: 1.1,
      characterSpacing: 0
    },
    thumbnail: '/api/placeholder/120/160',
    isDefault: false,
    createdAt: new Date()
  },
  {
    id: 'sfda-bilingual',
    name: 'SFDA Bilingual',
    category: 'food',
    regulatory: 'SFDA',
    layout: {
      orientation: 'portrait',
      dimensions: { width: 110, height: 170 },
      margins: { top: 12, right: 12, bottom: 12, left: 12 },
      template: 'sfda-bilingual',
      sections: []
    },
    typography: {
      primaryFont: 'Inter',
      arabicFont: 'Cairo',
      fontSizes: { heading: 16, subheading: 14, body: 12, small: 10 },
      colors: { primary: '#0f172a', secondary: '#475569', accent: '#059669' },
      lineSpacing: 1.3,
      characterSpacing: 0.2
    },
    thumbnail: '/api/placeholder/120/160',
    isDefault: false,
    createdAt: new Date()
  },
  {
    id: 'beverage-modern',
    name: 'Modern Beverage',
    category: 'beverage',
    regulatory: 'FDA',
    layout: {
      orientation: 'portrait',
      dimensions: { width: 80, height: 200 },
      margins: { top: 8, right: 6, bottom: 8, left: 6 },
      template: 'beverage-modern',
      sections: []
    },
    typography: {
      primaryFont: 'Montserrat',
      arabicFont: 'Tajawal',
      fontSizes: { heading: 14, subheading: 12, body: 10, small: 8 },
      colors: { primary: '#1e40af', secondary: '#6b7280', accent: '#06b6d4' },
      lineSpacing: 1.2,
      characterSpacing: 0
    },
    thumbnail: '/api/placeholder/120/160',
    isDefault: false,
    createdAt: new Date()
  },
  {
    id: 'supplement-premium',
    name: 'Premium Supplement',
    category: 'supplement',
    regulatory: 'FDA',
    layout: {
      orientation: 'portrait',
      dimensions: { width: 120, height: 80 },
      margins: { top: 10, right: 10, bottom: 10, left: 10 },
      template: 'supplement-premium',
      sections: []
    },
    typography: {
      primaryFont: 'Roboto',
      arabicFont: 'Noto Sans Arabic',
      fontSizes: { heading: 18, subheading: 14, body: 12, small: 10 },
      colors: { primary: '#7c2d12', secondary: '#a3a3a3', accent: '#ea580c' },
      lineSpacing: 1.1,
      characterSpacing: 0
    },
    thumbnail: '/api/placeholder/120/160',
    isDefault: false,
    createdAt: new Date()
  },
  {
    id: 'organic-natural',
    name: 'Organic & Natural',
    category: 'food',
    regulatory: 'MULTI',
    layout: {
      orientation: 'portrait',
      dimensions: { width: 95, height: 140 },
      margins: { top: 12, right: 8, bottom: 12, left: 8 },
      template: 'organic-natural',
      sections: []
    },
    typography: {
      primaryFont: 'Source Sans Pro',
      arabicFont: 'Amiri',
      fontSizes: { heading: 16, subheading: 13, body: 11, small: 9 },
      colors: { primary: '#166534', secondary: '#525252', accent: '#16a34a' },
      lineSpacing: 1.25,
      characterSpacing: 0.1
    },
    thumbnail: '/api/placeholder/120/160',
    isDefault: false,
    createdAt: new Date()
  }
];

export function TemplateLibrary({ onTemplateSelect }: TemplateLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegulatory, setSelectedRegulatory] = useState<string>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredTemplates = predefinedTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesRegulatory = selectedRegulatory === 'all' || template.regulatory === selectedRegulatory;
    
    return matchesSearch && matchesCategory && matchesRegulatory;
  });

  const toggleFavorite = (templateId: string) => {
    setFavorites(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleTemplateSelect = (template: LabelTemplate) => {
    onTemplateSelect(template);
    toast.success(`Template "${template.name}" applied`);
  };

  const categories = ['all', 'food', 'beverage', 'supplement', 'custom'];
  const regulations = ['all', 'FDA', 'EU', 'SFDA', 'MULTI'];

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Layout className="h-5 w-5" />
          Template Library
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium">Regulation</label>
              <Select value={selectedRegulatory} onValueChange={setSelectedRegulatory}>
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regulations.map(reg => (
                    <SelectItem key={reg} value={reg}>
                      {reg === 'all' ? 'All Standards' : reg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTemplateSelect(template)}
            >
              {/* Template Preview */}
              <div className="aspect-[3/4] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                <div className="text-center p-4">
                  <div className="w-12 h-16 bg-white border border-border rounded shadow-sm mx-auto mb-2 flex items-center justify-center">
                    <div className="text-xs text-muted-foreground font-mono">
                      {template.layout.dimensions.width}×{template.layout.dimensions.height}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {template.regulatory}
                  </div>
                </div>
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" className="h-8 px-3">
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-8 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template.id);
                      }}
                    >
                      <Star className={`h-3 w-3 ${favorites.includes(template.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                {/* Default badge */}
                {template.isDefault && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                    Default
                  </Badge>
                )}
              </div>
              
              {/* Template Info */}
              <div className="p-3 bg-background">
                <h4 className="font-medium text-sm mb-1">{template.name}</h4>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {template.layout.dimensions.width}×{template.layout.dimensions.height}mm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No templates found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Download className="h-3 w-3 mr-1" />
              Download All
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Copy className="h-3 w-3 mr-1" />
              Create Custom
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}