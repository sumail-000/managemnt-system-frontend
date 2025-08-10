/**
 * Security utilities for frontend input validation and XSS protection
 */

// XSS Protection utilities
export class SecurityUtils {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(input: string): string {
    if (!input) return '';
    
    // Create a temporary div element to leverage browser's HTML parsing
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
  }

  /**
   * Escape HTML special characters
   */
  static escapeHtml(input: string): string {
    if (!input) return '';
    
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    
    return input.replace(/[&<>"'/]/g, (s) => map[s]);
  }

  /**
   * Remove potentially dangerous characters and patterns
   */
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    let sanitized = input;
    
    // Remove script tags
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript\s*:/gi, '');
    
    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data\s*:/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*["\'][^"\']*["\']/gi, '');
    
    // Remove potential SQL injection patterns
    sanitized = sanitized.replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi, '');
    
    return sanitized.trim();
  }

  /**
   * Validate email format with security considerations
   */
  static validateEmail(email: string): boolean {
    if (!email) return false;
    
    // Basic email regex that prevents common XSS vectors
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /data:/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(email)) {
        return false;
      }
    }
    
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Validate password strength and security
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let score = 0;
    
    if (!password) {
      return { isValid: false, errors: ['Password is required'], strength: 'weak' };
    }
    
    // Length check
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }
    
    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters');
    }
    
    // Character type checks
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    } else {
      score += 1;
    }
    
    // Check for common weak patterns
    const weakPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /admin/i,
      /(.)\1{2,}/, // Repeated characters
    ];
    
    for (const pattern of weakPatterns) {
      if (pattern.test(password)) {
        errors.push('Password contains common weak patterns');
        score -= 1;
        break;
      }
    }
    
    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 4) {
      strength = 'strong';
    } else if (score >= 2) {
      strength = 'medium';
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Validate name input for security
   */
  static validateName(name: string): boolean {
    if (!name) return false;
    
    // Only allow letters, spaces, hyphens, apostrophes, and dots
    const nameRegex = /^[a-zA-Z\s\-'\.]{2,100}$/;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /admin/i,
      /test/i,
      /bot/i,
      /null/i,
      /undefined/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(name)) {
        return false;
      }
    }
    
    return nameRegex.test(name);
  }

  /**
   * Validate URL for security
   */
  static validateUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(url)) {
          return false;
        }
      }
      
      return url.length <= 2048;
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for older browsers
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Check if the current connection is secure (HTTPS)
   */
  static isSecureConnection(): boolean {
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  }

  /**
   * Validate file upload for security
   */
  static validateFileUpload(file: File, allowedTypes: string[], maxSize: number): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }
    
    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.php$/i,
      /\.jsp$/i,
      /\.asp$/i,
      /<script/i,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push('File name contains suspicious patterns');
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Rate limiting utility for client-side
   */
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, number[]>();
    
    return (key: string): boolean => {
      const now = Date.now();
      const keyAttempts = attempts.get(key) || [];
      
      // Remove old attempts outside the window
      const validAttempts = keyAttempts.filter(time => now - time < windowMs);
      
      if (validAttempts.length >= maxAttempts) {
        return false; // Rate limit exceeded
      }
      
      validAttempts.push(now);
      attempts.set(key, validAttempts);
      
      return true; // Allow the request
    };
  }
}

// Export default instance
export default SecurityUtils;