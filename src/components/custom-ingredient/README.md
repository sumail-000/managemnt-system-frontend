# Custom Ingredient Form Components

This directory contains a modular custom ingredient form system that allows users to add ingredients that aren't available in the Edamam Food Database. The system is broken down into smaller, maintainable components following the project's file structure patterns.

## Components Overview

### Main Component
- **`CustomIngredientForm.tsx`** - The main orchestrator component that manages the form state and coordinates all sub-components

### Sub-Components
- **`GeneralInformation.tsx`** - Handles basic ingredient information (name, brand, category, description)
- **`AllergenManagement.tsx`** - Manages comprehensive allergen classification and detailed allergen types
- **`RegulatoryInformation.tsx`** - Handles ingredient lists and regulatory information
- **`NutritionInformation.tsx`** - Manages nutritional data entry with serving size and comprehensive nutrition facts

### Supporting Files
- **`index.ts`** - Barrel export for easy importing
- **`../types/customIngredient.ts`** - TypeScript interfaces and type definitions

## Features

### 🎯 Multi-Step Form with Validation
- **Tabbed Interface**: Three main sections (General, Regulatory, Nutrition)
- **Progress Indicators**: Visual completion status for each tab
- **Form Validation**: Comprehensive validation with error messages
- **Navigation**: Previous/Next buttons for easy navigation

### 📋 General Information
- Ingredient name (required)
- Brand name
- Category selection (required)
- Description

### 🚨 Allergen Management
- **Main Allergens**: Gluten, Dairy, Eggs, Fish, Shellfish, Tree Nuts, Peanuts, Soy, Sesame
- **Classification Types**: Contains, May Contain, Free From
- **Detailed Sub-types**: Specific allergen classifications (e.g., types of tree nuts, fish species)
- **Source Information**: Additional context for allergen presence

### 📜 Regulatory Information
- **Ingredient List**: Complete ingredient listing as it would appear on packaging
- **Integrated Allergen Display**: Shows selected allergens in context

### 🥗 Nutrition Information
- **Serving Size**: Configurable serving size with multiple units
- **Comprehensive Nutrition Facts**: 15+ nutrition values including:
  - Macronutrients (calories, protein, carbs, fats)
  - Micronutrients (vitamins, minerals)
  - Detailed breakdowns (saturated fat, added sugars, etc.)
- **Additional Notes**: Optional nutrition-related notes

## Usage

### Basic Implementation
```tsx
import { CustomIngredientForm } from '@/components/custom-ingredient';

function MyComponent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (ingredientData: CustomIngredientData) => {
    setIsLoading(true);
    try {
      // Process the ingredient data
      await saveCustomIngredient(ingredientData);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Failed to save ingredient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomIngredientForm
      isOpen={isFormOpen}
      onClose={() => setIsFormOpen(false)}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
```

### Integration with ProductForm
```tsx
// In ProductForm.tsx
import { CustomIngredientForm } from '@/components/custom-ingredient';

// Add state for custom ingredient form
const [showCustomIngredientForm, setShowCustomIngredientForm] = useState(false);

// Add button to trigger custom ingredient form
<Button 
  variant="outline" 
  onClick={() => setShowCustomIngredientForm(true)}
>
  Add Custom Ingredient
</Button>

// Add the form component
<CustomIngredientForm
  isOpen={showCustomIngredientForm}
  onClose={() => setShowCustomIngredientForm(false)}
  onSubmit={handleCustomIngredientSubmit}
  isLoading={isSubmittingCustomIngredient}
/>
```

## Data Structure

### CustomIngredientData Interface
```typescript
interface CustomIngredientData {
  // General Information
  name: string;
  brand: string;
  category: string;
  description: string;
  
  // Regulatory Information
  ingredientList: string;
  allergens: AllergenData;
  
  // Nutrition Information
  servingSize: number;
  servingUnit: string;
  nutrition: NutritionData;
  nutritionNotes?: string;
}
```

### AllergenData Structure
```typescript
interface AllergenData {
  contains: string[];
  mayContain: string[];
  freeFrom: string[];
  types: {
    gluten: AllergenType;
    dairy: AllergenType;
    eggs: AllergenType;
    fish: AllergenType;
    shellfish: AllergenType;
    treeNuts: AllergenType;
    peanuts: AllergenType;
    soy: AllergenType;
    sesame: AllergenType;
  };
}
```

## Validation Rules

### Required Fields
- **Name**: Must not be empty
- **Category**: Must be selected
- **Ingredient List**: Must not be empty
- **Serving Size**: Must be greater than 0
- **Nutrition Data**: At least one nutrition value must be provided

### Optional Fields
- Brand name
- Description
- Allergen information
- Nutrition notes

## Styling

The components use Tailwind CSS classes and shadcn/ui components for consistent styling:
- **Cards**: Clean, bordered containers for each section
- **Form Controls**: Consistent input styling with proper spacing
- **Tabs**: Visual progress indicators with completion status
- **Buttons**: Primary/secondary button styling
- **Alerts**: Error display with proper iconography

## File Structure Benefits

### ✅ Maintainability
- **Single Responsibility**: Each component handles one specific aspect
- **Easy Updates**: Changes to allergen management don't affect nutrition components
- **Clear Separation**: Logic is separated by concern

### ✅ Reusability
- **Modular Components**: Individual components can be reused elsewhere
- **Flexible Integration**: Easy to integrate into different forms or workflows
- **Component Composition**: Mix and match components as needed

### ✅ Testing
- **Unit Testing**: Each component can be tested independently
- **Focused Tests**: Test specific functionality without complex setup
- **Mock Dependencies**: Easy to mock individual component dependencies

### ✅ Development Experience
- **Smaller Files**: Easier to navigate and understand
- **Focused Development**: Work on specific features without distractions
- **Team Collaboration**: Multiple developers can work on different components simultaneously

## Future Enhancements

### Potential Improvements
1. **Auto-save**: Save form data as user types
2. **Import/Export**: Allow importing ingredient data from files
3. **Templates**: Pre-defined ingredient templates for common items
4. **Validation Enhancement**: Real-time validation with field-level feedback
5. **Accessibility**: Enhanced keyboard navigation and screen reader support
6. **Internationalization**: Multi-language support for ingredient categories and allergens

### Integration Opportunities
1. **Backend Integration**: Connect to custom ingredient storage API
2. **Search Integration**: Allow searching through custom ingredients
3. **Nutrition Calculation**: Auto-calculate nutrition per 100g for consistency
4. **Label Generation**: Direct integration with label generation system
5. **Audit Trail**: Track changes and versions of custom ingredients

## Dependencies

### UI Components
- `@/components/ui/dialog` - Modal dialog
- `@/components/ui/button` - Button components
- `@/components/ui/tabs` - Tabbed interface
- `@/components/ui/card` - Card containers
- `@/components/ui/input` - Input fields
- `@/components/ui/textarea` - Text areas
- `@/components/ui/select` - Dropdown selects
- `@/components/ui/checkbox` - Checkboxes
- `@/components/ui/alert` - Error alerts

### Icons
- `lucide-react` - Icons for UI elements

### State Management
- React `useState` - Local component state
- Form validation logic

This modular approach ensures the custom ingredient form system is maintainable, scalable, and follows the project's established patterns while providing a comprehensive solution for adding custom ingredients to the food management system.