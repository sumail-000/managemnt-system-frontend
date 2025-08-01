import api from './api';

export interface QrCodeGenerationOptions {
  size?: number;
  format?: 'png' | 'svg' | 'jpg';
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: string;
  background_color?: string;
}

export interface QrCodeUrlGenerationOptions extends QrCodeGenerationOptions {
  content: string;
  type?: 'url' | 'custom';
}

export interface QrCodeData {
  id: number;
  url_slug: string;
  image_url: string;
  image_path: string;
  public_url?: string;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  download_url: string;
  product_name?: string;
  product_id?: number;
  is_premium?: boolean;
  unique_code?: string;
  analytics?: QrCodeAnalytics;
  product?: {
    id: number;
    name: string;
  };
}

export interface QrCodeGenerationResponse {
  success: boolean;
  message: string;
  qr_code?: QrCodeData;
  image_url?: string;
  public_url?: string;
  download_url?: string;
  upgrade_required?: boolean;
  user_plan?: {
    is_premium: boolean;
    is_enterprise: boolean;
    plan_name: string;
  };
}

export interface QrCodeAnalytics {
  overview: {
    total_qr_codes: number;
    total_scans: number;
    avg_scans_per_qr: number;
    max_scans: number;
  };
  top_performing: Array<{
    id: number;
    product_name: string;
    scan_count: number;
    last_scanned_at: string | null;
    unique_code?: string;
  }>;
  top_qr_codes?: Array<{
    id: number;
    product_name?: string;
    scan_count: number;
    last_scanned_at: string | null;
    created_at: string;
    is_premium?: boolean;
    product?: {
      id: number;
      name: string;
    };
  }>;
  scan_trends?: Array<{
    scan_date: string;
    daily_scans: number;
    date?: string;
    scans?: number;
  }>;
  recent_scans?: Array<{
    product_name?: string;
    device_type?: string;
    location?: string;
    scanned_at: string;
  }>;
}

export interface QrCodeDetailedAnalytics {
  total_scans: number;
  last_scanned: string | null;
  premium_analytics: boolean;
  scans_today?: number;
  scans_this_week?: number;
  scans_this_month?: number;
  recent_scans?: Array<{
    timestamp: string;
    data: {
      user_agent?: string;
      ip_address?: string;
      referrer?: string;
      device_type?: string;
      location?: string;
    };
  }>;
  qr_code_id?: number;
  days_active?: number;
  avg_scans_per_day?: number;
}

export interface QrCodeCreationDeletionAnalytics {
  creation_analytics: Array<{
    date: string;
    count: number;
  }>;
  deletion_analytics: Array<{
    date: string;
    count: number;
  }>;
  trends: Array<{
    date: string;
    created: number;
    deleted: number;
    net_change: number;
  }>;
  totals: {
    created: number;
    deleted: number;
    net_qr_codes: number;
  };
  period_days: number;
}

class QrCodeService {
  /**
   * Generate QR code from URL content directly
   */
  async generateQrCodeFromUrl(options: QrCodeUrlGenerationOptions): Promise<QrCodeGenerationResponse> {
    try {
      console.log('🔧 [SERVICE DEBUG] Starting generateQrCodeFromUrl service call')
      console.log('🔧 [SERVICE DEBUG] Options:', options)
      
      // Validate options before sending to API
      const validation = this.validateOptions(options);
      console.log('🔧 [SERVICE DEBUG] Validation result:', validation)
      
      if (!validation.valid) {
        console.warn('🔧 [SERVICE DEBUG] Validation failed, returning error response')
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      console.log('🔧 [SERVICE DEBUG] Making API call to:', `/qr-codes/generate-from-url`)
      const response = await api.post(`/qr-codes/generate-from-url`, options);
      
      console.log('🔧 [SERVICE DEBUG] Raw API response:', response)
      console.log('🔧 [SERVICE DEBUG] Response type:', typeof response)
      console.log('🔧 [SERVICE DEBUG] Response keys:', Object.keys(response || {}))
      
      // The API interceptor already extracts response.data, so 'response' is the actual data
      console.log('🔧 [SERVICE DEBUG] Returning response directly:', response)
      return response as unknown as QrCodeGenerationResponse;
    } catch (error: any) {
      console.error('🔧 [SERVICE DEBUG] API call failed:')
      console.error('🔧 [SERVICE DEBUG] Error:', error)
      console.error('🔧 [SERVICE DEBUG] Error response:', error.response)
      console.error('🔧 [SERVICE DEBUG] Error response status:', error.response?.status)
      console.error('🔧 [SERVICE DEBUG] Error response data:', error.response?.data)
      
      if (error.response?.status === 403) {
        console.log('🔧 [SERVICE DEBUG] 403 error, returning structured error response')
        return {
          success: false,
          message: error.response.data.message || 'QR code generation requires a premium membership',
          upgrade_required: true
        };
      }
      console.log('🔧 [SERVICE DEBUG] Re-throwing error for other status codes')
      throw error;
    }
  }

  /**
   * Generate QR code for a product
   */
  async generateQrCode(productId: number, options: QrCodeGenerationOptions = {}): Promise<QrCodeGenerationResponse> {
    try {
      console.log('🔧 [SERVICE DEBUG] Starting generateQrCode service call')
      console.log('🔧 [SERVICE DEBUG] Product ID:', productId)
      console.log('🔧 [SERVICE DEBUG] Options:', options)
      
      // Validate options before sending to API
      const validation = this.validateOptions(options);
      console.log('🔧 [SERVICE DEBUG] Validation result:', validation)
      
      if (!validation.valid) {
        console.warn('🔧 [SERVICE DEBUG] Validation failed, returning error response')
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      console.log('🔧 [SERVICE DEBUG] Making API call to:', `/qr-codes/products/${productId}/generate`)
      const response = await api.post(`/qr-codes/products/${productId}/generate`, options);
      
      console.log('🔧 [SERVICE DEBUG] Raw API response:', response)
      console.log('🔧 [SERVICE DEBUG] Response type:', typeof response)
      console.log('🔧 [SERVICE DEBUG] Response keys:', Object.keys(response || {}))
      
      // The API interceptor already extracts response.data, so 'response' is the actual data
      console.log('🔧 [SERVICE DEBUG] Returning response directly:', response)
      return response as unknown as QrCodeGenerationResponse;
    } catch (error: any) {
      console.error('🔧 [SERVICE DEBUG] API call failed:')
      console.error('🔧 [SERVICE DEBUG] Error:', error)
      console.error('🔧 [SERVICE DEBUG] Error response:', error.response)
      console.error('🔧 [SERVICE DEBUG] Error response status:', error.response?.status)
      console.error('🔧 [SERVICE DEBUG] Error response data:', error.response?.data)
      
      if (error.response?.status === 403) {
        console.log('🔧 [SERVICE DEBUG] 403 error, returning structured error response')
        return {
          success: false,
          message: error.response.data.message || 'QR code generation requires a premium membership',
          upgrade_required: true
        };
      }
      console.log('🔧 [SERVICE DEBUG] Re-throwing error for other status codes')
      throw error;
    }
  }

  /**
   * Get QR codes for a product
   */
  async getProductQrCodes(productId: number): Promise<{ success: boolean; data: QrCodeData[] }> {
    const response = await api.get(`/qr-codes/products/${productId}`);
    return response.data;
  }

  /**
   * Get all QR codes for the authenticated user
   */
  async getUserQRCodes(): Promise<{ success: boolean; data: QrCodeData[] }> {
    console.log('🌐 [QR_SERVICE] Starting getUserQRCodes API call...');
    console.log('🔗 [QR_SERVICE] API endpoint: /qr-codes/');
    
    try {
      const response = await api.get('/qr-codes/');
      
      console.log('📡 [QR_SERVICE] API response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        dataKeys: Object.keys(response.data || {}),
        responseData: response.data
      });
      
      // Check if response has the expected structure
      if (response.data && typeof response.data === 'object') {
        // If response.data has success and data properties, return it directly
        if ('success' in response.data && 'data' in response.data) {
          console.log('📋 [QR_SERVICE] QR codes in structured response:', {
            success: response.data.success,
            count: response.data.data?.length || 0,
            qrCodes: response.data.data?.map((qr: any) => ({
              id: qr.id,
              product_id: qr.product_id,
              product_name: qr.product_name,
              url_slug: qr.url_slug,
              scan_count: qr.scan_count,
              created_at: qr.created_at
            })) || []
          });
          return response.data;
        }
        // If response.data is an array (legacy format), wrap it
        else if (Array.isArray(response.data)) {
          console.log('📋 [QR_SERVICE] QR codes in array response:', {
            count: response.data.length,
            qrCodes: response.data.map((qr: any) => ({
              id: qr.id,
              product_id: qr.product_id,
              product_name: qr.product_name,
              url_slug: qr.url_slug,
              scan_count: qr.scan_count,
              created_at: qr.created_at
            }))
          });
          return {
            success: true,
            data: response.data
          };
        }
      }
      
      // Fallback: return empty data with success false
      console.warn('⚠️ [QR_SERVICE] Unexpected response format, returning empty data');
      return {
        success: false,
        data: []
      };
      
    } catch (error: any) {
      console.error('❌ [QR_SERVICE] getUserQRCodes API call failed:', {
        error: error,
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        responseData: error?.response?.data,
        config: {
          url: error?.config?.url,
          method: error?.config?.method,
          headers: error?.config?.headers
        }
      });
      throw error;
    }
  }

  /**
   * Download QR code
   */
  async downloadQrCode(qrCodeId: number): Promise<Blob> {
    const response = await api.get(`/qr-codes/${qrCodeId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Delete QR code
   */
  async deleteQrCode(qrCodeId: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/qr-codes/${qrCodeId}`);
    return response.data;
  }

  /**
   * Track QR code scan (public endpoint)
   */
  async trackScan(qrCodeId: number): Promise<{ success: boolean; data: { scan_count: number; redirect_url: string } }> {
    const response = await api.post(`/qr-codes/${qrCodeId}/scan`);
    return response.data;
  }

  /**
   * Get QR code analytics
   */
  async getAnalytics(): Promise<{ success: boolean; data: QrCodeAnalytics }> {
    const response = await api.get('/qr-codes/analytics');
    return response.data;
  }

  /**
   * Get detailed analytics for a specific QR code (premium feature)
   */
  async getQrCodeAnalytics(qrCodeId: number): Promise<{ success: boolean; data: QrCodeDetailedAnalytics }> {
    try {
      const response = await api.get(`/qr-codes/${qrCodeId}/analytics`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(error.response.data.message || 'Detailed analytics requires a premium membership');
      }
      throw error;
    }
  }

  /**
   * Get QR code creation and deletion analytics
   */
  async getCreationDeletionAnalytics(days: number = 30): Promise<{ success: boolean; data: QrCodeCreationDeletionAnalytics }> {
    try {
      const response = await api.get(`/qr-codes/creation-deletion-analytics?days=${days}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(error.response.data.message || 'Analytics requires a premium membership');
      }
      throw error;
    }
  }

  /**
   * Generate QR code download URL
   */
  getDownloadUrl(qrCodeId: number): string {
    return `${import.meta.env.VITE_API_URL}/qr-codes/${qrCodeId}/download`;
  }

  /**
   * Generate public scan tracking URL
   */
  getScanTrackingUrl(qrCodeId: number): string {
    return `${import.meta.env.VITE_API_URL}/qr-codes/${qrCodeId}/scan`;
  }

  /**
   * Trigger download of QR code
   */
  async triggerDownload(qrCodeId: number, filename?: string): Promise<void> {
    try {
      const blob = await this.downloadQrCode(qrCodeId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `qr-code-${qrCodeId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      throw error;
    }
  }

  /**
   * Copy QR code URL to clipboard
   */
  async copyToClipboard(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  /**
   * Validate QR code generation options
   */
  validateOptions(options: QrCodeGenerationOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.size && (options.size < 100 || options.size > 1000)) {
      errors.push('Size must be between 100 and 1000 pixels');
    }

    if (options.format && !['png', 'svg', 'jpg'].includes(options.format)) {
      errors.push('Format must be png, jpg, or svg');
    }

    if (options.error_correction && !['L', 'M', 'Q', 'H'].includes(options.error_correction)) {
      errors.push('Error correction must be L, M, Q, or H');
    }

    if (options.margin && (options.margin < 0 || options.margin > 10)) {
      errors.push('Margin must be between 0 and 10');
    }

    if (options.color && !/^#[0-9A-Fa-f]{6}$/.test(options.color)) {
      errors.push('Color must be a valid hex color code');
    }

    if (options.background_color && !/^#[0-9A-Fa-f]{6}$/.test(options.background_color)) {
      errors.push('Background color must be a valid hex color code');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new QrCodeService();