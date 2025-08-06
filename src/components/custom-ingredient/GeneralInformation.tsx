import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { CustomIngredientData } from '@/types/customIngredient';

interface GeneralInformationProps {
  formData: CustomIngredientData;
  onInputChange: (field: string, value: any) => void;
}

export function GeneralInformation({ formData, onInputChange }: GeneralInformationProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">General Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Bob's Organic White Rice Flour"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              className="h-9"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
            <Input
              id="brand"
              placeholder="Bob's Red Mill"
              value={formData.brand}
              onChange={(e) => onInputChange('brand', e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}