import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Plus, Calculator } from 'lucide-react';
import { UNITS, Unit } from '@/types/ingredient';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(100, 'Name is too long'),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0').max(99999, 'Quantity is too large'),
  unit: z.enum(UNITS),
});

type IngredientFormData = z.infer<typeof ingredientSchema>;

interface IngredientFormProps {
  onSubmit: (data: { name: string; quantity: number; unit: string }) => Promise<void>;
  isLoading: boolean;
}

const UNIT_CONVERSIONS = {
  g: { kg: 0.001, mg: 1000, oz: 0.035274, lb: 0.002205 },
  kg: { g: 1000, mg: 1000000, oz: 35.274, lb: 2.20462 },
  mg: { g: 0.001, kg: 0.000001, oz: 0.000035, lb: 0.0000022 },
  oz: { g: 28.3495, kg: 0.0283495, mg: 28349.5, lb: 0.0625 },
  lb: { g: 453.592, kg: 0.453592, mg: 453592, oz: 16 },
};

export const IngredientForm = ({ onSubmit, isLoading }: IngredientFormProps) => {
  const [showConversions, setShowConversions] = useState(false);
  
  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'g',
    },
  });

  const watchedQuantity = form.watch('quantity');
  const watchedUnit = form.watch('unit');

  const handleSubmit = async (data: IngredientFormData) => {
    await onSubmit({
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
    });
    form.reset();
    setShowConversions(false);
  };

  const getConversions = () => {
    if (!watchedQuantity || watchedQuantity <= 0) return [];
    
    const conversions = UNIT_CONVERSIONS[watchedUnit as keyof typeof UNIT_CONVERSIONS];
    if (!conversions) return [];

    return Object.entries(conversions).map(([unit, multiplier]) => ({
      unit,
      value: (watchedQuantity * multiplier).toFixed(3).replace(/\.?0+$/, ''),
    }));
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Ingredient
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Ingredient Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredient Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., All-purpose flour"
                      {...field}
                      className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        step="0.1"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Unit Conversion Calculator */}
            {watchedQuantity > 0 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConversions(!showConversions)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Calculator className="h-4 w-4" />
                  {showConversions ? 'Hide' : 'Show'} Unit Conversions
                </Button>
                
                {showConversions && (
                  <Card className="p-3 bg-muted/50">
                    <div className="text-sm font-medium mb-2">Conversions for {watchedQuantity} {watchedUnit}:</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {getConversions().map(({ unit, value }) => (
                        <div key={unit} className="flex justify-between">
                          <span className="text-muted-foreground">{unit}:</span>
                          <span className="font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Ingredient
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};