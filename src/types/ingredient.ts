export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  tags: string[]; // Auto-generated, read-only
  allergens: string[]; // Auto-detected
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IngredientState {
  ingredients: Ingredient[];
  isLoading: boolean;
  draggedItem: string | null;
  editingItem: string | null;
  showNotesModal: boolean;
  selectedIngredient: string | null;
}

export const UNITS = [
  'g',
  'kg',
  'mg',
  'oz',
  'lb',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'cup',
  'pint',
  'quart',
  'gallon',
  'pieces',
  'pinch',
  'dash'
] as const;

export type Unit = typeof UNITS[number];

export const ALLERGEN_COLORS = {
  gluten: 'bg-red-100 text-red-800',
  dairy: 'bg-blue-100 text-blue-800',
  nuts: 'bg-orange-100 text-orange-800',
  soy: 'bg-yellow-100 text-yellow-800',
  eggs: 'bg-purple-100 text-purple-800',
  fish: 'bg-cyan-100 text-cyan-800',
  shellfish: 'bg-teal-100 text-teal-800',
  sulfites: 'bg-pink-100 text-pink-800',
  sesame: 'bg-indigo-100 text-indigo-800',
} as const;

export const DIETARY_COLORS = {
  'sugar-free': 'bg-green-100 text-green-800',
  'fat-free': 'bg-emerald-100 text-emerald-800',
  'low-sodium': 'bg-slate-100 text-slate-800',
  'organic': 'bg-lime-100 text-lime-800',
  'vegan': 'bg-green-100 text-green-800',
  'vegetarian': 'bg-green-100 text-green-800',
  'gluten-free': 'bg-blue-100 text-blue-800',
  'keto': 'bg-purple-100 text-purple-800',
} as const;