/**
 * Utility functions for managing product categories and subcategories
 */

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  icon?: string;
  color?: string;
  subcategories?: Subcategory[];
  isActive?: boolean;
  sortOrder?: number;
}

export interface Subcategory {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  categoryId: string;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Default food categories with subcategories
 */
export const getDefaultCategories = (): Category[] => [
  {
    id: 'beverages',
    name: 'Beverages',
    nameAr: 'المشروبات',
    description: 'All types of drinks and beverages',
    icon: '🥤',
    color: '#3B82F6',
    isActive: true,
    sortOrder: 1,
    subcategories: [
      { id: 'soft-drinks', name: 'Soft Drinks', nameAr: 'المشروبات الغازية', categoryId: 'beverages', isActive: true, sortOrder: 1 },
      { id: 'juices', name: 'Juices', nameAr: 'العصائر', categoryId: 'beverages', isActive: true, sortOrder: 2 },
      { id: 'water', name: 'Water', nameAr: 'المياه', categoryId: 'beverages', isActive: true, sortOrder: 3 },
      { id: 'tea-coffee', name: 'Tea & Coffee', nameAr: 'الشاي والقهوة', categoryId: 'beverages', isActive: true, sortOrder: 4 },
      { id: 'energy-drinks', name: 'Energy Drinks', nameAr: 'مشروبات الطاقة', categoryId: 'beverages', isActive: true, sortOrder: 5 },
      { id: 'alcoholic', name: 'Alcoholic Beverages', nameAr: 'المشروبات الكحولية', categoryId: 'beverages', isActive: true, sortOrder: 6 }
    ]
  },
  {
    id: 'dairy',
    name: 'Dairy & Eggs',
    nameAr: 'الألبان والبيض',
    description: 'Milk products and eggs',
    icon: '🥛',
    color: '#F59E0B',
    isActive: true,
    sortOrder: 2,
    subcategories: [
      { id: 'milk', name: 'Milk', nameAr: 'الحليب', categoryId: 'dairy', isActive: true, sortOrder: 1 },
      { id: 'cheese', name: 'Cheese', nameAr: 'الجبن', categoryId: 'dairy', isActive: true, sortOrder: 2 },
      { id: 'yogurt', name: 'Yogurt', nameAr: 'الزبادي', categoryId: 'dairy', isActive: true, sortOrder: 3 },
      { id: 'butter', name: 'Butter & Margarine', nameAr: 'الزبدة والسمن', categoryId: 'dairy', isActive: true, sortOrder: 4 },
      { id: 'eggs', name: 'Eggs', nameAr: 'البيض', categoryId: 'dairy', isActive: true, sortOrder: 5 },
      { id: 'cream', name: 'Cream', nameAr: 'الكريمة', categoryId: 'dairy', isActive: true, sortOrder: 6 }
    ]
  },
  {
    id: 'meat-poultry',
    name: 'Meat & Poultry',
    nameAr: 'اللحوم والدواجن',
    description: 'Fresh and processed meat products',
    icon: '🥩',
    color: '#DC2626',
    isActive: true,
    sortOrder: 3,
    subcategories: [
      { id: 'beef', name: 'Beef', nameAr: 'لحم البقر', categoryId: 'meat-poultry', isActive: true, sortOrder: 1 },
      { id: 'chicken', name: 'Chicken', nameAr: 'الدجاج', categoryId: 'meat-poultry', isActive: true, sortOrder: 2 },
      { id: 'lamb', name: 'Lamb', nameAr: 'لحم الخروف', categoryId: 'meat-poultry', isActive: true, sortOrder: 3 },
      { id: 'turkey', name: 'Turkey', nameAr: 'الديك الرومي', categoryId: 'meat-poultry', isActive: true, sortOrder: 4 },
      { id: 'processed-meat', name: 'Processed Meat', nameAr: 'اللحوم المصنعة', categoryId: 'meat-poultry', isActive: true, sortOrder: 5 },
      { id: 'sausages', name: 'Sausages', nameAr: 'النقانق', categoryId: 'meat-poultry', isActive: true, sortOrder: 6 }
    ]
  },
  {
    id: 'seafood',
    name: 'Seafood',
    nameAr: 'المأكولات البحرية',
    description: 'Fish and seafood products',
    icon: '🐟',
    color: '#0891B2',
    isActive: true,
    sortOrder: 4,
    subcategories: [
      { id: 'fresh-fish', name: 'Fresh Fish', nameAr: 'السمك الطازج', categoryId: 'seafood', isActive: true, sortOrder: 1 },
      { id: 'frozen-fish', name: 'Frozen Fish', nameAr: 'السمك المجمد', categoryId: 'seafood', isActive: true, sortOrder: 2 },
      { id: 'shellfish', name: 'Shellfish', nameAr: 'المحار', categoryId: 'seafood', isActive: true, sortOrder: 3 },
      { id: 'canned-fish', name: 'Canned Fish', nameAr: 'السمك المعلب', categoryId: 'seafood', isActive: true, sortOrder: 4 },
      { id: 'smoked-fish', name: 'Smoked Fish', nameAr: 'السمك المدخن', categoryId: 'seafood', isActive: true, sortOrder: 5 }
    ]
  },
  {
    id: 'fruits-vegetables',
    name: 'Fruits & Vegetables',
    nameAr: 'الفواكه والخضروات',
    description: 'Fresh and processed fruits and vegetables',
    icon: '🥕',
    color: '#16A34A',
    isActive: true,
    sortOrder: 5,
    subcategories: [
      { id: 'fresh-fruits', name: 'Fresh Fruits', nameAr: 'الفواكه الطازجة', categoryId: 'fruits-vegetables', isActive: true, sortOrder: 1 },
      { id: 'fresh-vegetables', name: 'Fresh Vegetables', nameAr: 'الخضروات الطازجة', categoryId: 'fruits-vegetables', isActive: true, sortOrder: 2 },
      { id: 'frozen-fruits', name: 'Frozen Fruits', nameAr: 'الفواكه المجمدة', categoryId: 'fruits-vegetables', isActive: true, sortOrder: 3 },
      { id: 'frozen-vegetables', name: 'Frozen Vegetables', nameAr: 'الخضروات المجمدة', categoryId: 'fruits-vegetables', isActive: true, sortOrder: 4 },
      { id: 'canned-fruits', name: 'Canned Fruits', nameAr: 'الفواكه المعلبة', categoryId: 'fruits-vegetables', isActive: true, sortOrder: 5 },
      { id: 'canned-vegetables', name: 'Canned Vegetables', nameAr: 'الخضروات المعلبة', categoryId: 'fruits-vegetables', isActive: true, sortOrder: 6 }
    ]
  },
  {
    id: 'grains-cereals',
    name: 'Grains & Cereals',
    nameAr: 'الحبوب والمحاصيل',
    description: 'Rice, wheat, oats and other grains',
    icon: '🌾',
    color: '#D97706',
    isActive: true,
    sortOrder: 6,
    subcategories: [
      { id: 'rice', name: 'Rice', nameAr: 'الأرز', categoryId: 'grains-cereals', isActive: true, sortOrder: 1 },
      { id: 'wheat', name: 'Wheat Products', nameAr: 'منتجات القمح', categoryId: 'grains-cereals', isActive: true, sortOrder: 2 },
      { id: 'oats', name: 'Oats', nameAr: 'الشوفان', categoryId: 'grains-cereals', isActive: true, sortOrder: 3 },
      { id: 'quinoa', name: 'Quinoa', nameAr: 'الكينوا', categoryId: 'grains-cereals', isActive: true, sortOrder: 4 },
      { id: 'barley', name: 'Barley', nameAr: 'الشعير', categoryId: 'grains-cereals', isActive: true, sortOrder: 5 },
      { id: 'breakfast-cereals', name: 'Breakfast Cereals', nameAr: 'حبوب الإفطار', categoryId: 'grains-cereals', isActive: true, sortOrder: 6 }
    ]
  },
  {
    id: 'bakery',
    name: 'Bakery & Bread',
    nameAr: 'المخبوزات والخبز',
    description: 'Bread, pastries and baked goods',
    icon: '🍞',
    color: '#92400E',
    isActive: true,
    sortOrder: 7,
    subcategories: [
      { id: 'bread', name: 'Bread', nameAr: 'الخبز', categoryId: 'bakery', isActive: true, sortOrder: 1 },
      { id: 'pastries', name: 'Pastries', nameAr: 'المعجنات', categoryId: 'bakery', isActive: true, sortOrder: 2 },
      { id: 'cakes', name: 'Cakes', nameAr: 'الكعك', categoryId: 'bakery', isActive: true, sortOrder: 3 },
      { id: 'cookies', name: 'Cookies & Biscuits', nameAr: 'الكوكيز والبسكويت', categoryId: 'bakery', isActive: true, sortOrder: 4 },
      { id: 'muffins', name: 'Muffins', nameAr: 'المافن', categoryId: 'bakery', isActive: true, sortOrder: 5 }
    ]
  },
  {
    id: 'snacks',
    name: 'Snacks & Confectionery',
    nameAr: 'الوجبات الخفيفة والحلويات',
    description: 'Chips, nuts, candy and sweet treats',
    icon: '🍿',
    color: '#7C2D12',
    isActive: true,
    sortOrder: 8,
    subcategories: [
      { id: 'chips', name: 'Chips & Crisps', nameAr: 'الشيبس والمقرمشات', categoryId: 'snacks', isActive: true, sortOrder: 1 },
      { id: 'nuts', name: 'Nuts & Seeds', nameAr: 'المكسرات والبذور', categoryId: 'snacks', isActive: true, sortOrder: 2 },
      { id: 'candy', name: 'Candy & Sweets', nameAr: 'الحلوى والسكاكر', categoryId: 'snacks', isActive: true, sortOrder: 3 },
      { id: 'chocolate', name: 'Chocolate', nameAr: 'الشوكولاتة', categoryId: 'snacks', isActive: true, sortOrder: 4 },
      { id: 'popcorn', name: 'Popcorn', nameAr: 'الفشار', categoryId: 'snacks', isActive: true, sortOrder: 5 }
    ]
  },
  {
    id: 'condiments',
    name: 'Condiments & Sauces',
    nameAr: 'التوابل والصلصات',
    description: 'Spices, herbs, sauces and seasonings',
    icon: '🧂',
    color: '#B91C1C',
    isActive: true,
    sortOrder: 9,
    subcategories: [
      { id: 'spices', name: 'Spices & Herbs', nameAr: 'التوابل والأعشاب', categoryId: 'condiments', isActive: true, sortOrder: 1 },
      { id: 'sauces', name: 'Sauces', nameAr: 'الصلصات', categoryId: 'condiments', isActive: true, sortOrder: 2 },
      { id: 'vinegar', name: 'Vinegar', nameAr: 'الخل', categoryId: 'condiments', isActive: true, sortOrder: 3 },
      { id: 'oils', name: 'Cooking Oils', nameAr: 'زيوت الطبخ', categoryId: 'condiments', isActive: true, sortOrder: 4 },
      { id: 'dressings', name: 'Salad Dressings', nameAr: 'تتبيلات السلطة', categoryId: 'condiments', isActive: true, sortOrder: 5 }
    ]
  },
  {
    id: 'frozen-foods',
    name: 'Frozen Foods',
    nameAr: 'الأطعمة المجمدة',
    description: 'Frozen meals and convenience foods',
    icon: '🧊',
    color: '#1E40AF',
    isActive: true,
    sortOrder: 10,
    subcategories: [
      { id: 'frozen-meals', name: 'Frozen Meals', nameAr: 'الوجبات المجمدة', categoryId: 'frozen-foods', isActive: true, sortOrder: 1 },
      { id: 'frozen-pizza', name: 'Frozen Pizza', nameAr: 'البيتزا المجمدة', categoryId: 'frozen-foods', isActive: true, sortOrder: 2 },
      { id: 'ice-cream', name: 'Ice Cream', nameAr: 'الآيس كريم', categoryId: 'frozen-foods', isActive: true, sortOrder: 3 },
      { id: 'frozen-desserts', name: 'Frozen Desserts', nameAr: 'الحلويات المجمدة', categoryId: 'frozen-foods', isActive: true, sortOrder: 4 }
    ]
  }
];

/**
 * Find category by ID
 */
export const findCategoryById = (categories: Category[], categoryId: string): Category | undefined => {
  return categories.find(cat => cat.id === categoryId);
};

/**
 * Find subcategory by ID
 */
export const findSubcategoryById = (categories: Category[], subcategoryId: string): Subcategory | undefined => {
  for (const category of categories) {
    if (category.subcategories) {
      const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory) return subcategory;
    }
  }
  return undefined;
};

/**
 * Get subcategories for a specific category
 */
export const getSubcategoriesForCategory = (categories: Category[], categoryId: string): Subcategory[] => {
  const category = findCategoryById(categories, categoryId);
  return category?.subcategories || [];
};

/**
 * Get category name with fallback
 */
export const getCategoryName = (category: Category | undefined, language: 'en' | 'ar' = 'en'): string => {
  if (!category) return '';
  return language === 'ar' && category.nameAr ? category.nameAr : category.name;
};

/**
 * Get subcategory name with fallback
 */
export const getSubcategoryName = (subcategory: Subcategory | undefined, language: 'en' | 'ar' = 'en'): string => {
  if (!subcategory) return '';
  return language === 'ar' && subcategory.nameAr ? subcategory.nameAr : subcategory.name;
};

/**
 * Search categories by name
 */
export const searchCategories = (categories: Category[], query: string, language: 'en' | 'ar' = 'en'): Category[] => {
  const lowerQuery = query.toLowerCase();
  
  return categories.filter(category => {
    const name = getCategoryName(category, language).toLowerCase();
    const description = category.description?.toLowerCase() || '';
    
    return name.includes(lowerQuery) || description.includes(lowerQuery);
  });
};

/**
 * Search subcategories by name
 */
export const searchSubcategories = (categories: Category[], query: string, language: 'en' | 'ar' = 'en'): Subcategory[] => {
  const lowerQuery = query.toLowerCase();
  const results: Subcategory[] = [];
  
  categories.forEach(category => {
    if (category.subcategories) {
      category.subcategories.forEach(subcategory => {
        const name = getSubcategoryName(subcategory, language).toLowerCase();
        const description = subcategory.description?.toLowerCase() || '';
        
        if (name.includes(lowerQuery) || description.includes(lowerQuery)) {
          results.push(subcategory);
        }
      });
    }
  });
  
  return results;
};

/**
 * Get category hierarchy (category -> subcategory)
 */
export const getCategoryHierarchy = (categories: Category[], categoryId: string, subcategoryId?: string): string => {
  const category = findCategoryById(categories, categoryId);
  if (!category) return '';
  
  let hierarchy = category.name;
  
  if (subcategoryId) {
    const subcategory = findSubcategoryById(categories, subcategoryId);
    if (subcategory) {
      hierarchy += ` > ${subcategory.name}`;
    }
  }
  
  return hierarchy;
};

/**
 * Validate category selection
 */
export const validateCategorySelection = (categories: Category[], categoryId: string, subcategoryId?: string): { isValid: boolean; error?: string } => {
  const category = findCategoryById(categories, categoryId);
  
  if (!category) {
    return { isValid: false, error: 'Invalid category selected' };
  }
  
  if (!category.isActive) {
    return { isValid: false, error: 'Selected category is not active' };
  }
  
  if (subcategoryId) {
    const subcategory = findSubcategoryById(categories, subcategoryId);
    
    if (!subcategory) {
      return { isValid: false, error: 'Invalid subcategory selected' };
    }
    
    if (subcategory.categoryId !== categoryId) {
      return { isValid: false, error: 'Subcategory does not belong to selected category' };
    }
    
    if (!subcategory.isActive) {
      return { isValid: false, error: 'Selected subcategory is not active' };
    }
  }
  
  return { isValid: true };
};

/**
 * Get categories for dropdown/select options
 */
export const getCategoryOptions = (categories: Category[], language: 'en' | 'ar' = 'en'): Array<{ value: string; label: string; color?: string }> => {
  return categories
    .filter(cat => cat.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(cat => ({
      value: cat.id,
      label: getCategoryName(cat, language),
      color: cat.color
    }));
};

/**
 * Get subcategories for dropdown/select options
 */
export const getSubcategoryOptions = (categories: Category[], categoryId: string, language: 'en' | 'ar' = 'en'): Array<{ value: string; label: string }> => {
  const subcategories = getSubcategoriesForCategory(categories, categoryId);
  
  return subcategories
    .filter(sub => sub.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(sub => ({
      value: sub.id,
      label: getSubcategoryName(sub, language)
    }));
};

/**
 * Get category statistics
 */
export const getCategoryStatistics = (categories: Category[]): { totalCategories: number; totalSubcategories: number; activeCategories: number; activeSubcategories: number } => {
  let totalSubcategories = 0;
  let activeSubcategories = 0;
  
  categories.forEach(category => {
    if (category.subcategories) {
      totalSubcategories += category.subcategories.length;
      activeSubcategories += category.subcategories.filter(sub => sub.isActive).length;
    }
  });
  
  return {
    totalCategories: categories.length,
    totalSubcategories,
    activeCategories: categories.filter(cat => cat.isActive).length,
    activeSubcategories
  };
};