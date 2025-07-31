/**
 * Utility functions for handling storage URLs
 */

const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8000/storage';

/**
 * Constructs a full storage URL from a relative path
 * @param path - The relative storage path (e.g., 'avatars/123_image.jpg')
 * @returns The full storage URL or null if path is invalid
 */
export function getStorageUrl(path: string | null | undefined): string | null {
  console.log('🔧 getStorageUrl called with path:', path);
  console.log('🌐 STORAGE_BASE_URL:', STORAGE_BASE_URL);
  
  if (!path || typeof path !== 'string') {
    console.log('❌ Invalid path provided');
    return null;
  }
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log('🌐 Already a full URL, returning as is');
    return path;
  }
  
  // Remove leading slash if present
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  console.log('🧹 After removing leading slash:', cleanPath);
  
  // Check if path already starts with 'storage/' and remove it to avoid duplication
  if (cleanPath.startsWith('storage/')) {
    cleanPath = cleanPath.substring(8); // Remove 'storage/' prefix
    console.log('🔄 Removed duplicate storage prefix:', cleanPath);
  }
  
  const finalUrl = `${STORAGE_BASE_URL}/${cleanPath}`;
  console.log('🎯 Final constructed URL:', finalUrl);
  
  return finalUrl;
}

/**
 * Constructs an avatar URL from a user's avatar path
 * @param avatarPath - The user's avatar path from the database
 * @returns The full avatar URL or null if no avatar
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  return getStorageUrl(avatarPath);
}

/**
 * Constructs a product image URL from a product's image path
 * @param imagePath - The product's image path from the database
 * @returns The full image URL or null if no image
 */
export function getProductImageUrl(imagePath: string | null | undefined): string | null {
  return getStorageUrl(imagePath);
}