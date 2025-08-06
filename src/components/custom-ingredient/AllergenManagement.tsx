import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Checkbox } from '@/components/ui/checkbox';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CustomIngredientData } from '@/types/customIngredient';

interface AllergenManagementProps {
  formData: CustomIngredientData;
  onAllergenChange: (allergen: string, checked: boolean) => void;
  onAllergenTypeChange: (category: string, type: string, value: any) => void;
}

const TooltipWrapper = ({ children, content }: { children: React.ReactNode; content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs max-w-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export function AllergenManagement({ formData, onAllergenChange, onAllergenTypeChange }: AllergenManagementProps) {
  // Helper function to check if an allergen is selected
  const isAllergenSelected = (allergen: string) => {
    return formData.allergens.contains.includes(allergen);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Allergens</Label>
      
      {/* Main Allergens Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { key: 'dairy', label: 'Dairy/Milk' },
          { key: 'eggs', label: 'Eggs' },
          { key: 'fish', label: 'Fish' },
          { key: 'shellfish', label: 'Shellfish' },
          { key: 'treeNuts', label: 'Tree Nuts' },
          { key: 'peanuts', label: 'Peanuts' },
          { key: 'soy', label: 'Soy' },
          { key: 'sesame', label: 'Sesame' },
          { key: 'gluten', label: 'Gluten' }
        ].map(allergen => (
          <div key={allergen.key} className="flex items-center space-x-2">
            <Checkbox
              id={allergen.key}
              checked={isAllergenSelected(allergen.key)}
              onCheckedChange={(checked) => onAllergenChange(allergen.key, checked as boolean)}
            />
            <Label htmlFor={allergen.key} className="text-sm">{allergen.label}</Label>
          </div>
        ))}
      </div>

      {/* Dairy/Milk Classifications */}
      {isAllergenSelected('dairy') && (
        <div className="ml-6 space-y-3 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Which type of dairy/milk?</Label>
            <TooltipWrapper content="Select the specific type of dairy/milk allergen present">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'cowMilk', label: 'Cow milk' },
              { key: 'goatMilk', label: 'Goat milk' },
              { key: 'sheepMilk', label: 'Sheep milk' }
            ].map(milk => (
              <div key={milk.key} className="flex items-center space-x-2">
                <Checkbox
                  id={milk.key}
                  checked={formData.allergens.milkType?.[milk.key as keyof typeof formData.allergens.milkType] as boolean || false}
                  onCheckedChange={(checked) => onAllergenTypeChange('milkType', milk.key, checked)}
                />
                <Label htmlFor={milk.key} className="text-sm">{milk.label}</Label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="otherMilk"
              checked={!!(formData.allergens.milkType?.other)}
              onCheckedChange={(checked) => {
                if (!checked) onAllergenTypeChange('milkType', 'other', '');
              }}
            />
            <Input
              placeholder="Other dairy/milk type"
              value={formData.allergens.milkType?.other || ''}
              onChange={(e) => onAllergenTypeChange('milkType', 'other', e.target.value)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      )}

      {/* Egg Classifications */}
      {isAllergenSelected('eggs') && (
        <div className="ml-6 space-y-3 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Which type of eggs?</Label>
            <TooltipWrapper content="Select the specific type of egg allergen present">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'chickenEgg', label: 'Chicken egg' },
              { key: 'duckEgg', label: 'Duck egg' },
              { key: 'quailEgg', label: 'Quail egg' }
            ].map(egg => (
              <div key={egg.key} className="flex items-center space-x-2">
                <Checkbox
                  id={egg.key}
                  checked={formData.allergens.eggType?.[egg.key as keyof typeof formData.allergens.eggType] as boolean || false}
                  onCheckedChange={(checked) => onAllergenTypeChange('eggType', egg.key, checked)}
                />
                <Label htmlFor={egg.key} className="text-sm">{egg.label}</Label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="otherEgg"
              checked={!!(formData.allergens.eggType?.other)}
              onCheckedChange={(checked) => {
                if (!checked) onAllergenTypeChange('eggType', 'other', '');
              }}
            />
            <Input
              placeholder="Other egg type"
              value={formData.allergens.eggType?.other || ''}
              onChange={(e) => onAllergenTypeChange('eggType', 'other', e.target.value)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      )}

      {/* Fish Classifications */}
      {isAllergenSelected('fish') && (
        <div className="ml-6 space-y-3 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Which type of fish?</Label>
            <TooltipWrapper content="Select the specific type of fish allergen present">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'tuna', label: 'Tuna' },
              { key: 'cod', label: 'Cod' },
              { key: 'salmon', label: 'Salmon' },
              { key: 'bass', label: 'Bass' }
            ].map(fish => (
              <div key={fish.key} className="flex items-center space-x-2">
                <Checkbox
                  id={fish.key}
                  checked={formData.allergens.fishType?.[fish.key as keyof typeof formData.allergens.fishType] as boolean || false}
                  onCheckedChange={(checked) => onAllergenTypeChange('fishType', fish.key, checked)}
                />
                <Label htmlFor={fish.key} className="text-sm">{fish.label}</Label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="otherFish"
              checked={!!(formData.allergens.fishType?.other)}
              onCheckedChange={(checked) => {
                if (!checked) onAllergenTypeChange('fishType', 'other', '');
              }}
            />
            <Input
              placeholder="Other fish type"
              value={formData.allergens.fishType?.other || ''}
              onChange={(e) => onAllergenTypeChange('fishType', 'other', e.target.value)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      )}

      {/* Tree Nuts Classifications */}
      {isAllergenSelected('treeNuts') && (
        <div className="ml-6 space-y-3 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Which tree nuts?</Label>
            <TooltipWrapper content="Select the specific types of tree nuts present">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { key: 'almond', label: 'Almond' },
              { key: 'blackWalnut', label: 'Black walnut' },
              { key: 'brazilNut', label: 'Brazil nut' },
              { key: 'californiaWalnut', label: 'California walnut' },
              { key: 'cashew', label: 'Cashew' },
              { key: 'hazelnut', label: 'Hazelnut' },
              { key: 'heartnut', label: 'Heartnut' },
              { key: 'macadamiaNut', label: 'Macadamia nut' },
              { key: 'pecan', label: 'Pecan' },
              { key: 'pineNut', label: 'Pine nut' },
              { key: 'pistachio', label: 'Pistachio' },
              { key: 'walnut', label: 'Walnut' }
            ].map(nut => (
              <div key={nut.key} className="flex items-center space-x-2">
                <Checkbox
                  id={nut.key}
                  checked={formData.allergens.treeNutType?.[nut.key as keyof typeof formData.allergens.treeNutType] as boolean || false}
                  onCheckedChange={(checked) => onAllergenTypeChange('treeNutType', nut.key, checked)}
                />
                <Label htmlFor={nut.key} className="text-sm">{nut.label}</Label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="otherTreeNut"
              checked={!!(formData.allergens.treeNutType?.other)}
              onCheckedChange={(checked) => {
                if (!checked) onAllergenTypeChange('treeNutType', 'other', '');
              }}
            />
            <Input
              placeholder="Other tree nut type"
              value={formData.allergens.treeNutType?.other || ''}
              onChange={(e) => onAllergenTypeChange('treeNutType', 'other', e.target.value)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      )}

      {/* Gluten Classifications */}
      {isAllergenSelected('gluten') && (
        <div className="ml-6 space-y-3 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Which gluten sources?</Label>
            <TooltipWrapper content="Select the specific sources of gluten present">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipWrapper>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'barley', label: 'Barley' },
              { key: 'oats', label: 'Oats' },
              { key: 'rye', label: 'Rye' },
              { key: 'triticale', label: 'Triticale' }
            ].map(gluten => (
              <div key={gluten.key} className="flex items-center space-x-2">
                <Checkbox
                  id={gluten.key}
                  checked={formData.allergens.glutenType?.[gluten.key as keyof typeof formData.allergens.glutenType] as boolean || false}
                  onCheckedChange={(checked) => onAllergenTypeChange('glutenType', gluten.key, checked)}
                />
                <Label htmlFor={gluten.key} className="text-sm">{gluten.label}</Label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="otherGluten"
              checked={!!(formData.allergens.glutenType?.other)}
              onCheckedChange={(checked) => {
                if (!checked) onAllergenTypeChange('glutenType', 'other', '');
              }}
            />
            <Input
              placeholder="Other gluten source"
              value={formData.allergens.glutenType?.other || ''}
              onChange={(e) => onAllergenTypeChange('glutenType', 'other', e.target.value)}
              className="h-8 text-sm flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}