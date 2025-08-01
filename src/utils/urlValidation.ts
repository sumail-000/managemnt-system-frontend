// URL Validation Utility

/**
 * Validates if a string is a valid URL
 * @param url - The string to validate
 * @returns boolean indicating if the URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Remove leading/trailing whitespace
  url = url.trim();

  // Check if it's empty after trimming
  if (!url) {
    return false;
  }

  try {
    // Try to create a URL object
    const urlObject = new URL(url);
    
    // Check if protocol is http or https
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch (error) {
    // If URL constructor throws an error, it's not a valid URL
    return false;
  }
}

/**
 * Validates URL and returns error message if invalid
 * @param url - The URL string to validate
 * @returns string with error message or empty string if valid
 */
export function validateUrl(url: string): string {
  if (!url || !url.trim()) {
    return 'URL is required';
  }

  if (!isValidUrl(url)) {
    return 'Please enter a valid URL (must start with http:// or https://)';
  }

  return '';
}

/**
 * Formats a URL by adding https:// if no protocol is specified
 * @param url - The URL string to format
 * @returns formatted URL string
 */
export function formatUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  url = url.trim();
  
  if (!url) {
    return '';
  }

  // If URL doesn't start with http:// or https://, add https://
  if (!url.match(/^https?:\/\//i)) {
    return `https://${url}`;
  }

  return url;
}