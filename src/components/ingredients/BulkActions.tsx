import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ingredientApi } from '@/services/ingredientApi';
import { Ingredient } from '@/types/ingredient';

interface BulkActionsProps {
  onImportComplete: (ingredients: Ingredient[]) => void;
  totalIngredients: number;
}

export const BulkActions = ({ onImportComplete, totalIngredients }: BulkActionsProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or JSON file.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const importedIngredients = await ingredientApi.bulkImportIngredients(file);
      
      setImportResults({
        success: importedIngredients.length,
        failed: 0,
        errors: [],
      });

      onImportComplete(importedIngredients);
      
      toast({
        title: "Import successful",
        description: `Successfully imported ${importedIngredients.length} ingredients.`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      
      setImportResults({
        success: 0,
        failed: 1,
        errors: [errorMessage],
      });

      toast({
        title: "Import failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (totalIngredients === 0) {
      toast({
        title: "No data to export",
        description: "Add some ingredients before exporting.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const blob = await ingredientApi.exportIngredients(format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ingredients.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Downloaded ingredients as ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export ingredients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTemplate = (format: 'csv' | 'json') => {
    const templateData = {
      csv: `name,quantity,unit,notes
All-purpose flour,500,g,Organic wheat flour
Olive oil,250,ml,Extra virgin
Salt,10,g,Sea salt`,
      json: JSON.stringify([
        {
          name: "All-purpose flour",
          quantity: 500,
          unit: "g",
          notes: "Organic wheat flour"
        },
        {
          name: "Olive oil",
          quantity: 250,
          unit: "ml", 
          notes: "Extra virgin"
        },
        {
          name: "Salt",
          quantity: 10,
          unit: "g",
          notes: "Sea salt"
        }
      ], null, 2)
    };

    const blob = new Blob([templateData[format]], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingredient-template.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template downloaded",
      description: `Downloaded ${format.toUpperCase()} template file.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="import" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Upload a CSV or JSON file to bulk import ingredients. Make sure your file includes columns: name, quantity, unit, notes (optional).
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.json"
                  onChange={handleFileImport}
                  disabled={isImporting}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('csv')}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('json')}
                  className="flex items-center gap-2"
                >
                  <FileJson className="h-4 w-4" />
                  JSON Template
                </Button>
              </div>

              {isImporting && (
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing file...</span>
                </div>
              )}

              {importResults && (
                <div className="space-y-2">
                  {importResults.success > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg border border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">
                        Successfully imported {importResults.success} ingredients
                      </span>
                    </div>
                  )}
                  
                  {importResults.failed > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg border border-red-200">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">
                          Failed to import {importResults.failed} items
                        </span>
                      </div>
                      {importResults.errors.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <div className="font-medium mb-1">Errors:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {importResults.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Export your ingredient list to CSV or JSON format for backup or sharing.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Total ingredients to export:</span>
                <Badge variant="secondary">{totalIngredients}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleExport('csv')}
                  disabled={isExporting || totalIngredients === 0}
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Export CSV
                </Button>
                
                <Button
                  onClick={() => handleExport('json')}
                  disabled={isExporting || totalIngredients === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileJson className="h-4 w-4" />
                  )}
                  Export JSON
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};