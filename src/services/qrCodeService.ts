import api from './api';

export interface QrCodeGenerationOptions {
  size?: number;
  format?: 'png' | 'svg' | 'jpg';
  error_correction?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  color?: string;
  background_color?: string;
}

export interface QrCodeData {
  id: number;
  url_slug: string;
  image_url: string | null;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  download_url: string;
  product_name?: string;
  product_id?: number;
}

export interface QrCodeGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    qr_code: QrCodeData;
    image_url: string;
    public_url: string;
    download_url: string;
  };
  upgrade_required?: boolean;
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
  }>;
}

class QrCodeService {
  /**
   * Generate QR code for a product
   */
  async generateQrCode(productId: number, options: QrCodeGenerationOptions = {}): Promise<QrCodeGenerationResponse> {
    try {
      // Validate options before sending to API
      const validation = this.validateOptions(options);
      if (!validation.valid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      const response = await api.post(`/qr-codes/products/${productId}/generate`, options);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        return {
          success: false,
          message: error.response.data.message || 'QR code generation requires a premium membership',
          upgrade_required: true
        };
      }
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
    const response = await api.get('/qr-codes/');
    return response.data;
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