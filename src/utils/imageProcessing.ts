/**
 * Utility functions for image processing, validation, and management
 */

export interface ImageFile {
  file: File;
  preview: string;
  id: string;
  type: 'main' | 'nutrition_label' | 'ingredients' | 'additional';
  caption?: string;
  isDefault?: boolean;
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

/**
 * Supported image formats
 */
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
];

/**
 * Maximum file size (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Maximum image dimensions
 */
export const MAX_IMAGE_WIDTH = 4000;
export const MAX_IMAGE_HEIGHT = 4000;

/**
 * Minimum image dimensions
 */
export const MIN_IMAGE_WIDTH = 100;
export const MIN_IMAGE_HEIGHT = 100;

/**
 * Validate image file
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check file type
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    errors.push(`Unsupported file format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`);
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size too large. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`);
  }
  
  // Check file name
  if (file.name.length > 255) {
    errors.push('File name too long (maximum 255 characters)');
  }
  
  // Warnings for large files
  if (file.size > MAX_FILE_SIZE * 0.8) {
    warnings.push('Large file size may affect upload performance');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate image dimensions
 */
export const validateImageDimensions = (width: number, height: number): ImageValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check minimum dimensions
  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    errors.push(`Image too small. Minimum dimensions: ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}px`);
  }
  
  // Check maximum dimensions
  if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
    errors.push(`Image too large. Maximum dimensions: ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}px`);
  }
  
  // Warnings for very large images
  if (width > MAX_IMAGE_WIDTH * 0.8 || height > MAX_IMAGE_HEIGHT * 0.8) {
    warnings.push('Large image dimensions may affect performance');
  }
  
  // Warning for unusual aspect ratios
  const aspectRatio = width / height;
  if (aspectRatio > 5 || aspectRatio < 0.2) {
    warnings.push('Unusual aspect ratio detected');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Create image preview URL
 */
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to create image preview'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Resize image canvas
 */
export const resizeImage = (
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<Blob> => {
  const {
    maxWidth = MAX_IMAGE_WIDTH,
    maxHeight = MAX_IMAGE_HEIGHT,
    quality = 0.9,
    format = 'jpeg',
    maintainAspectRatio = true
  } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (maintainAspectRatio) {
        const aspectRatio = width / height;
        
        if (width > maxWidth) {
          width = maxWidth;
          height = width / aspectRatio;
        }
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
      } else {
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create resized image'));
          }
        },
        `image/${format}`,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress image
 */
export const compressImage = (file: File, quality: number = 0.8): Promise<Blob> => {
  return resizeImage(file, { quality, format: 'jpeg' });
};

/**
 * Convert image to different format
 */
export const convertImageFormat = (
  file: File, 
  format: 'jpeg' | 'png' | 'webp',
  quality: number = 0.9
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Fill with white background for JPEG
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image format'));
          }
        },
        `image/${format}`,
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for conversion'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate thumbnail
 */
export const generateThumbnail = (
  file: File,
  size: number = 150,
  quality: number = 0.8
): Promise<Blob> => {
  return resizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality,
    format: 'jpeg',
    maintainAspectRatio: true
  });
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get image file extension
 */
export const getImageExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Generate unique image filename
 */
export const generateImageFilename = (originalName: string, prefix: string = ''): string => {
  const extension = getImageExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${prefix}${prefix ? '_' : ''}${timestamp}_${random}.${extension}`;
};

/**
 * Create image file object
 */
export const createImageFile = async (
  file: File,
  type: 'main' | 'nutrition_label' | 'ingredients' | 'additional' = 'additional',
  caption?: string
): Promise<ImageFile> => {
  const preview = await createImagePreview(file);
  const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    file,
    preview,
    id,
    type,
    caption,
    isDefault: false
  };
};

/**
 * Process multiple image files
 */
export const processImageFiles = async (
  files: FileList | File[],
  options: ImageProcessingOptions = {}
): Promise<{ processed: ImageFile[]; errors: string[] }> => {
  const processed: ImageFile[] = [];
  const errors: string[] = [];
  
  const fileArray = Array.from(files);
  
  for (const file of fileArray) {
    try {
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        errors.push(`${file.name}: ${validation.errors.join(', ')}`);
        continue;
      }
      
      // Get dimensions and validate
      const dimensions = await getImageDimensions(file);
      const dimensionValidation = validateImageDimensions(dimensions.width, dimensions.height);
      if (!dimensionValidation.isValid) {
        errors.push(`${file.name}: ${dimensionValidation.errors.join(', ')}`);
        continue;
      }
      
      // Process image if needed
      let processedFile = file;
      if (options.maxWidth || options.maxHeight || options.quality) {
        const resizedBlob = await resizeImage(file, options);
        processedFile = new File([resizedBlob], file.name, { type: resizedBlob.type });
      }
      
      // Create image file object
      const imageFile = await createImageFile(processedFile);
      processed.push(imageFile);
      
    } catch (error) {
      errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Processing failed'}`);
    }
  }
  
  return { processed, errors };
};

/**
 * Clean up image preview URLs
 */
export const cleanupImagePreviews = (images: ImageFile[]): void => {
  images.forEach(image => {
    if (image.preview && image.preview.startsWith('blob:')) {
      URL.revokeObjectURL(image.preview);
    }
  });
};

/**
 * Get image type icon
 */
export const getImageTypeIcon = (type: string): string => {
  const icons = {
    'main': '🖼️',
    'nutrition_label': '🏷️',
    'ingredients': '📋',
    'additional': '📷'
  };
  
  return icons[type as keyof typeof icons] || '📷';
};

/**
 * Get image type label
 */
export const getImageTypeLabel = (type: string): string => {
  const labels = {
    'main': 'Main Product Image',
    'nutrition_label': 'Nutrition Label',
    'ingredients': 'Ingredients List',
    'additional': 'Additional Image'
  };
  
  return labels[type as keyof typeof labels] || 'Image';
};

/**
 * Sort images by type priority
 */
export const sortImagesByType = (images: ImageFile[]): ImageFile[] => {
  const typePriority = {
    'main': 1,
    'nutrition_label': 2,
    'ingredients': 3,
    'additional': 4
  };
  
  return [...images].sort((a, b) => {
    const priorityA = typePriority[a.type] || 999;
    const priorityB = typePriority[b.type] || 999;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same type, sort by default status
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    
    return 0;
  });
};

/**
 * Check if image needs processing
 */
export const needsProcessing = (file: File, options: ImageProcessingOptions = {}): Promise<boolean> => {
  return new Promise(async (resolve) => {
    try {
      const dimensions = await getImageDimensions(file);
      const maxWidth = options.maxWidth || MAX_IMAGE_WIDTH;
      const maxHeight = options.maxHeight || MAX_IMAGE_HEIGHT;
      
      // Check if resizing is needed
      if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
        resolve(true);
        return;
      }
      
      // Check if compression is needed
      if (file.size > MAX_FILE_SIZE * 0.8) {
        resolve(true);
        return;
      }
      
      resolve(false);
    } catch {
      resolve(false);
    }
  });
};