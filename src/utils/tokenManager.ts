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
  private static readonly REMEMBER_ME_KEY = 'remember_me_enabled';
  private static readonly REMEMBER_ME_EMAIL_KEY = 'remember_me_email';
  private static readonly REMEMBER_ME_PASSWORD_KEY = 'remember_me_password';
  private static readonly REMEMBER_ME_EXPIRY_KEY = 'remember_me_expires_at';

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
   * Set "Remember Me" credentials with 1-week expiration
   */
  static setRememberMeCredentials(email: string, password: string): void {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 1 week from now
    
    localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
    localStorage.setItem(this.REMEMBER_ME_EMAIL_KEY, email);
    localStorage.setItem(this.REMEMBER_ME_PASSWORD_KEY, password);
    localStorage.setItem(this.REMEMBER_ME_EXPIRY_KEY, expiryDate.toISOString());
    
    console.log(`[TOKEN_MANAGER] Remember me credentials set with 1-week expiration:`, {
      email,
      expiresAt: expiryDate.toISOString()
    });
  }

  /**
   * Get remembered credentials if still valid
   */
  static getRememberedCredentials(): { email: string; password: string } | null {
    const isEnabled = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    const email = localStorage.getItem(this.REMEMBER_ME_EMAIL_KEY);
    const password = localStorage.getItem(this.REMEMBER_ME_PASSWORD_KEY);
    const expiryString = localStorage.getItem(this.REMEMBER_ME_EXPIRY_KEY);
    
    if (!isEnabled || !email || !password || !expiryString) {
      return null;
    }
    
    const expiryDate = new Date(expiryString);
    const isExpired = expiryDate <= new Date();
    
    if (isExpired) {
      console.log('[TOKEN_MANAGER] Remember me credentials expired, clearing');
      this.clearRememberMeCredentials();
      return null;
    }
    
    console.log('[TOKEN_MANAGER] Valid remember me credentials found');
    return { email, password };
  }

  /**
   * Clear "Remember Me" credentials
   */
  static clearRememberMeCredentials(): void {
    localStorage.removeItem(this.REMEMBER_ME_KEY);
    localStorage.removeItem(this.REMEMBER_ME_EMAIL_KEY);
    localStorage.removeItem(this.REMEMBER_ME_PASSWORD_KEY);
    localStorage.removeItem(this.REMEMBER_ME_EXPIRY_KEY);
    console.log('[TOKEN_MANAGER] Remember me credentials cleared');
  }

  /**
   * Check if "Remember Me" is enabled and valid
   */
  static isRememberMeEnabled(): boolean {
    return this.getRememberedCredentials() !== null;
  }

  /**
   * Clear tokens on manual logout (but keep remember me for future auto-login)
   */
  static clearTokensOnLogout(isAdmin: boolean = false): void {
    // Clear tokens but keep remember me credentials for future auto-login
    this.clearToken(isAdmin);
    console.log(`[TOKEN_MANAGER] Tokens cleared on manual logout for ${isAdmin ? 'admin' : 'user'}, remember me preserved`);
  }

  /**
   * Clear everything on complete logout (logout from all devices)
   */
  static clearEverything(): void {
    this.clearAllTokens();
    this.clearRememberMeCredentials();
    console.log('[TOKEN_MANAGER] Everything cleared - tokens and remember me');
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
      currentContext: this.isAdminContext() ? 'admin' : 'user',
      rememberMeEnabled: this.isRememberMeEnabled()
    };
  }
}