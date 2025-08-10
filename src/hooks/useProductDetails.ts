import { useState, useCallback, useEffect } from 'react';
import { 
  ProductDetails, 
  ProductImage,
  getEmptyProductDetails,
  validateProductDetails,
  calculateTotalWeight,
  calculateServingWeightInGrams,
  generateSKU,
  validateBarcode,
  formatBarcode,
  hasProductDetailsChanged,
  sanitizeProductDetails,
  getProductCompletionPercentage
} from '@/utils/productDetailsManagement';

interface UseProductDetailsProps {
  initialDetails?: ProductDetails;
  initialImages?: ProductImage[];
  onDetailsChange?: (details: ProductDetails) => void;
  onImagesChange?: (images: ProductImage[]) => void;
  autoGenerateSKU?: boolean;
}

interface UseProductDetailsReturn {
  // State
  productDetails: ProductDetails;
  productImages: ProductImage[];
  isLoadingDetails: boolean;
  detailsError: string | null;
  validationErrors: string[];
  hasUnsavedChanges: boolean;
  completionPercentage: number;
  
  // Computed values
  isValid: boolean;
  totalWeight: number;
  servingWeightInGrams: number;
  formattedBarcode: string;
  
  // Actions
  updateProductDetails: (updates: Partial<ProductDetails>) => void;
  updateField: (field: keyof ProductDetails, value: any) => void;
  addImage: (image: ProductImage) => void;
  removeImage: (imageId: string) => void;
  updateImage: (imageId: string, updates: Partial<ProductImage>) => void;
  setMainImage: (imageId: string) => void;
  validateDetails: () => boolean;
  resetDetails: () => void;
  generateProductSKU: () => void;
  sanitizeDetails: () => ProductDetails;
  markAsSaved: () => void;
}

export const useProductDetails = ({
  initialDetails,
  initialImages = [],
  onDetailsChange,
  onImagesChange,
  autoGenerateSKU = false
}: UseProductDetailsProps = {}): UseProductDetailsReturn => {
  
  // Initialize product details
  const [productDetails, setProductDetails] = useState<ProductDetails>(() => {
    return initialDetails || getEmptyProductDetails();
  });
  
  const [productImages, setProductImages] = useState<ProductImage[]>(initialImages);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [originalDetails, setOriginalDetails] = useState<ProductDetails>(productDetails);
  
  // Validation
  const validation = validateProductDetails(productDetails);
  const validationErrors = validation.errors;
  const isValid = validation.isValid;
  
  // Computed values
  const hasUnsavedChanges = hasProductDetailsChanged(productDetails, originalDetails);
  const completionPercentage = getProductCompletionPercentage(productDetails);
  const totalWeight = calculateTotalWeight(productDetails);
  const servingWeightInGrams = calculateServingWeightInGrams(
    productDetails.servingSize, 
    productDetails.servingUnit
  );
  const formattedBarcode = formatBarcode(productDetails.barcode || '');
  
  // Notify parent components of changes
  useEffect(() => {
    if (onDetailsChange) {
      onDetailsChange(productDetails);
    }
  }, [productDetails, onDetailsChange]);
  
  useEffect(() => {
    if (onImagesChange) {
      onImagesChange(productImages);
    }
  }, [productImages, onImagesChange]);
  
  // Auto-generate SKU when name or brand changes
  useEffect(() => {
    if (autoGenerateSKU && productDetails.name && productDetails.brand && !productDetails.sku) {
      const generatedSKU = generateSKU(productDetails);
      setProductDetails(prev => ({ ...prev, sku: generatedSKU }));
    }
  }, [productDetails.name, productDetails.brand, autoGenerateSKU, productDetails.sku]);
  
  // Update product details
  const updateProductDetails = useCallback((updates: Partial<ProductDetails>) => {
    setProductDetails(prev => {
      const updated = { ...prev, ...updates };
      
      // Validate barcode if it's being updated
      if (updates.barcode !== undefined && updates.barcode && !validateBarcode(updates.barcode)) {
        setDetailsError('Invalid barcode format');
        return prev; // Don't update if barcode is invalid
      }
      
      setDetailsError(null);
      return updated;
    });
  }, []);
  
  // Update single field
  const updateField = useCallback((field: keyof ProductDetails, value: any) => {
    updateProductDetails({ [field]: value });
  }, [updateProductDetails]);
  
  // Add image
  const addImage = useCallback((image: ProductImage) => {
    setProductImages(prev => {
      const newImage = {
        ...image,
        id: image.id || `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      // If this is the first image or marked as default, make it the main image
      if (prev.length === 0 || image.isDefault) {
        // Remove default flag from other images
        const updatedImages = prev.map(img => ({ ...img, isDefault: false }));
        return [...updatedImages, { ...newImage, isDefault: true }];
      }
      
      return [...prev, newImage];
    });
  }, []);
  
  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setProductImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      
      // If we removed the main image, make the first remaining image the main one
      const removedImage = prev.find(img => img.id === imageId);
      if (removedImage?.isDefault && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      
      return filtered;
    });
  }, []);
  
  // Update image
  const updateImage = useCallback((imageId: string, updates: Partial<ProductImage>) => {
    setProductImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, ...updates } : img
      )
    );
  }, []);
  
  // Set main image
  const setMainImage = useCallback((imageId: string) => {
    setProductImages(prev => 
      prev.map(img => ({
        ...img,
        isDefault: img.id === imageId
      }))
    );
  }, []);
  
  // Validate details
  const validateDetails = useCallback(() => {
    const validation = validateProductDetails(productDetails);
    
    if (!validation.isValid) {
      setDetailsError(validation.errors.join(', '));
      return false;
    }
    
    setDetailsError(null);
    return true;
  }, [productDetails]);
  
  // Reset details
  const resetDetails = useCallback(() => {
    const emptyDetails = getEmptyProductDetails();
    setProductDetails(emptyDetails);
    setOriginalDetails(emptyDetails);
    setProductImages([]);
    setDetailsError(null);
  }, []);
  
  // Generate SKU
  const generateProductSKU = useCallback(() => {
    const sku = generateSKU(productDetails);
    updateField('sku', sku);
  }, [productDetails, updateField]);
  
  // Sanitize details
  const sanitizeDetails = useCallback(() => {
    return sanitizeProductDetails(productDetails);
  }, [productDetails]);
  
  // Mark as saved
  const markAsSaved = useCallback(() => {
    setOriginalDetails({ ...productDetails });
  }, [productDetails]);
  
  return {
    // State
    productDetails,
    productImages,
    isLoadingDetails,
    detailsError,
    validationErrors,
    hasUnsavedChanges,
    completionPercentage,
    
    // Computed values
    isValid,
    totalWeight,
    servingWeightInGrams,
    formattedBarcode,
    
    // Actions
    updateProductDetails,
    updateField,
    addImage,
    removeImage,
    updateImage,
    setMainImage,
    validateDetails,
    resetDetails,
    generateProductSKU,
    sanitizeDetails,
    markAsSaved
  };
};

export default useProductDetails;