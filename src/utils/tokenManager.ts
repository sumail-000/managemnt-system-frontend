/**
 * Token Management Utility
 * Handles separate token storage for admin and user sessions
 */

export interface TokenInfo {
  token: string | null;
  expiresAt: string | null;
}

export class TokenManager {
  private static readonly ADMIN_TOKEN_KEY = 'admin_auth_token';
  private static readonly ADMIN_TOKEN_EXPIRY_KEY = 'admin_auth_token_expires_at';
  private static readonly USER_TOKEN_KEY = 'user_auth_token';
  private static readonly USER_TOKEN_EXPIRY_KEY = 'user_auth_token_expires_at';

  /**
   * Get the appropriate token based on context
   */
  static getToken(isAdmin: boolean = false): TokenInfo {
    const tokenKey = isAdmin ? this.ADMIN_TOKEN_KEY : this.USER_TOKEN_KEY;
    const expiryKey = isAdmin ? this.ADMIN_TOKEN_EXPIRY_KEY : this.USER_TOKEN_EXPIRY_KEY;

    return {
      token: localStorage.getItem(tokenKey),
      expiresAt: localStorage.getItem(expiryKey)
    };
  }

  /**
   * Set token for specific user type
   */
  static setToken(token: string, expiresAt: string | null, isAdmin: boolean = false): void {
    const tokenKey = isAdmin ? this.ADMIN_TOKEN_KEY : this.USER_TOKEN_KEY;
    const expiryKey = isAdmin ? this.ADMIN_TOKEN_EXPIRY_KEY : this.USER_TOKEN_EXPIRY_KEY;

    localStorage.setItem(tokenKey, token);
    if (expiresAt) {
      localStorage.setItem(expiryKey, expiresAt);
    }

    console.log(`[TOKEN_MANAGER] Token set for ${isAdmin ? 'admin' : 'user'}`, {
      tokenKey,
      expiryKey,
      expiresAt
    });
  }

  /**
   * Clear tokens for specific user type
   */
  static clearToken(isAdmin: boolean = false): void {
    const tokenKey = isAdmin ? this.ADMIN_TOKEN_KEY : this.USER_TOKEN_KEY;
    const expiryKey = isAdmin ? this.ADMIN_TOKEN_EXPIRY_KEY : this.USER_TOKEN_EXPIRY_KEY;

    localStorage.removeItem(tokenKey);
    localStorage.removeItem(expiryKey);

    console.log(`[TOKEN_MANAGER] Token cleared for ${isAdmin ? 'admin' : 'user'}`, {
      tokenKey,
      expiryKey
    });
  }

  /**
   * Clear all tokens (both admin and user)
   */
  static clearAllTokens(): void {
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_TOKEN_KEY);
    localStorage.removeItem(this.USER_TOKEN_EXPIRY_KEY);

    console.log('[TOKEN_MANAGER] All tokens cleared');
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  }

  /**
   * Get current context based on URL
   */
  static isAdminContext(): boolean {
    return window.location.pathname.startsWith('/admin');
  }

  /**
   * Get the appropriate token for current context
   */
  static getCurrentToken(): TokenInfo {
    return this.getToken(this.isAdminContext());
  }

  /**
   * Switch context and return appropriate token
   */
  static switchContext(toAdmin: boolean): TokenInfo {
    console.log(`[TOKEN_MANAGER] Switching context to ${toAdmin ? 'admin' : 'user'}`);
    return this.getToken(toAdmin);
  }

  /**
   * Check if user has valid admin session
   */
  static hasValidAdminSession(): boolean {
    const { token, expiresAt } = this.getToken(true);
    return !!(token && !this.isTokenExpired(expiresAt));
  }

  /**
   * Check if user has valid user session
   */
  static hasValidUserSession(): boolean {
    const { token, expiresAt } = this.getToken(false);
    return !!(token && !this.isTokenExpired(expiresAt));
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo() {
    const adminToken = this.getToken(true);
    const userToken = this.getToken(false);

    return {
      admin: {
        hasToken: !!adminToken.token,
        isExpired: this.isTokenExpired(adminToken.expiresAt),
        expiresAt: adminToken.expiresAt
      },
      user: {
        hasToken: !!userToken.token,
        isExpired: this.isTokenExpired(userToken.expiresAt),
        expiresAt: userToken.expiresAt
      },
      currentContext: this.isAdminContext() ? 'admin' : 'user'
    };
  }
}