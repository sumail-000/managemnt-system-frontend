import React, { useState } from 'react';
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Info,
  Download,
  Share2,
  FileText,
  Calculator,
  Settings
} from "lucide-react";

interface LabelSection {
  id: string;
  label: string;
  checked: boolean;
  hasInfo?: boolean;
}

export default function SampleLabel() {
  const [labelType, setLabelType] = useState("FDA Vertical (default)");
  const [expandedSections, setExpandedSections] = useState({
    labelSections: true,
    labelStyle: false,
    optionalNutrients: false,
    optionalVitamins: false,
    nutritionAdjustments: false
  });

  const [optionalNutrients, setOptionalNutrients] = useState([
    { id: "unsaturatedFats", label: "Show unsaturated fats", checked: false, hasInfo: true },
    { id: "sugarAlcohols", label: "Show sugar alcohols", checked: false, hasInfo: true },
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
    { id: "hideRecipeTitle", label: "Hide recipe title", checked: true, hasInfo: true },
    { id: "hideNutritionFacts", label: "Hide nutrition facts", checked: false, hasInfo: true },
    { id: "hideIngredientList", label: "Hide ingredient list", checked: false, hasInfo: true },
    { id: "hideAllergens", label: "Hide allergens", checked: false, hasInfo: true },
    { id: "hideFacilityAllergens", label: "Hide facility allergens", checked: false, hasInfo: true },
    { id: "hideBusinessInfo", label: "Hide business info", checked: false, hasInfo: true },
    { id: "hideBioengineeredClaim", label: "Hide bioengineered claim", checked: false, hasInfo: true },
    { id: "indicateBioengineeredFood", label: "Indicate bioengineered food", checked: true, hasInfo: true },
    { id: "hideBarcode", label: "Hide barcode", checked: true, hasInfo: true }
  ]);

  const labelTypeOptions = [
    "FDA Vertical (default)",
    "FDA Tabular", 
    "FDA Linear",
    "FDA As Packaged/As Prepared",
    "FDA Aggregate",
    "FDA Infant (0-12 mths)",
    "FDA Child (1-3 yrs)",
    "FDA 100 Grams",
    "Canadian Vertical",
    "Canadian Linear",
    "Canadian Horizontal",
    "Canadian As Packaged/As Prepared",
    "Canadian Aggregate",
    "Canadian 100 Grams",
    "USDA (Old FDA) Vertical",
    "USDA (Old FDA) Tabular",
    "USDA (Old FDA) Linear",
    "USDA (Old FDA) As Packaged/As Prepared",
    "USDA (Old FDA) Infant (0-2 yrs)",
    "USDA (Old FDA) Child (2-4 yrs)"
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleLabelSection = (id: string) => {
    setLabelSections(prev => 
      prev.map(section => 
        section.id === id 
          ? { ...section, checked: !section.checked }
          : section
      )
    );
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

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
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
                    <div className="p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Adjustment options coming soon...</p>
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

                {/* Label Style - moved to bottom */}
                <Card className="overflow-hidden">
                  <SectionHeader 
                    title="Label style" 
                    section="labelStyle" 
                    icon={<Info className="h-3 w-3" />}
                  />
                  {expandedSections.labelStyle && (
                    <div className="p-3 bg-card">
                      <p className="text-xs text-muted-foreground">Style options coming soon...</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>

            {/* Right Preview Panel - larger */}
            <div className="lg:col-span-3">
              <Card className="p-4 min-h-[500px]">
                {/* Nutrition Facts Label */}
                <div className="max-w-xs mx-auto border-2 border-black bg-white text-black font-mono text-xs">
                  {/* Header */}
                  <div className="text-center py-1 border-b-4 border-black">
                    <h2 className="text-lg font-black">Nutrition Facts</h2>
                    <p className="text-xs">48 servings per container</p>
                    <div className="flex justify-between items-center px-2">
                      <span className="font-bold text-xs">Serving size</span>
                      <span className="font-bold text-xs">1 cookie (25g)</span>
                    </div>
                  </div>

                  {/* Calories */}
                  <div className="px-2 py-1 border-b-2 border-black">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Amount Per Serving</span>
                      <span className="text-xs">% Daily Value*</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black">Calories</span>
                      <span className="text-xl font-black">110</span>
                    </div>
                  </div>

                  {/* Nutrients */}
                  <div className="px-2 text-xs border-b border-black">
                    <div className="flex justify-between py-1 border-b border-black">
                      <span className="font-bold">Total Fat 4.5g</span>
                      <span className="font-bold">6%</span>
                    </div>
                    <div className="flex justify-between py-1 pl-4">
                      <span>Saturated Fat 2.5g</span>
                      <span className="font-bold">13%</span>
                    </div>
                    <div className="flex justify-between py-1 pl-4 italic border-b border-black">
                      <span>Trans Fat 0g</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black">
                      <span className="font-bold">Cholesterol 20mg</span>
                      <span className="font-bold">7%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black">
                      <span className="font-bold">Sodium 80mg</span>
                      <span className="font-bold">3%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-black">
                      <span className="font-bold">Total Carbohydrate 17g</span>
                      <span className="font-bold">6%</span>
                    </div>
                    <div className="flex justify-between py-1 pl-4">
                      <span>Dietary Fiber &lt;1g</span>
                      <span className="font-bold">3%</span>
                    </div>
                    <div className="flex justify-between py-1 pl-4 border-b border-black">
                      <span>Total Sugars 9g</span>
                    </div>
                    <div className="flex justify-between py-1 pl-8 border-b-4 border-black">
                      <span>Includes 9g Added Sugars</span>
                      <span className="font-bold">18%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b-8 border-black">
                      <span className="font-bold">Protein 2g</span>
                    </div>
                  </div>

                  {/* Vitamins & Minerals */}
                  <div className="px-2 text-xs border-b-4 border-black">
                    <div className="flex justify-between py-1">
                      <span>Vitamin D 0mcg</span>
                      <span>0%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Calcium 10mg</span>
                      <span>0%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Iron 0.4mg</span>
                      <span>2%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Potassium 40mg</span>
                      <span>0%</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-2 py-2 text-xs leading-tight">
                    <p>*The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
                  </div>

                  {/* Ingredients */}
                  <div className="px-2 py-2 text-xs border-t border-black">
                    <p><span className="font-bold">Ingredients:</span> Wheat flour, Oat Butter (Cream, Natural Flavoring), Brown Sugar, Sugar, Banana, Eggs, Salt, Baking Soda, Natural Flavor, Spices *= Organic</p>
                  </div>

                  {/* Allergens */}
                  <div className="px-2 py-2 text-xs border-t border-black">
                    <p><span className="font-bold">Contains:</span> Milk, Egg, Wheat</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-6">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}