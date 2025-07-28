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
  if (!path || typeof path !== 'string') {
    return null;
  }
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  return `${STORAGE_BASE_URL}/${cleanPath}`;
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