/**
 * bKash Payment Gateway Integration
 * Official bKash Tokenized Checkout API implementation
 */

interface BkashTokenResponse {
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface BkashPaymentResponse {
  paymentID: string;
  createTime: string;
  updateTime: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
}

interface BkashConfig {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
}

class BkashService {
  private config: BkashConfig;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      baseUrl: import.meta.env.VITE_BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
      appKey: import.meta.env.VITE_BKASH_APP_KEY || '',
      appSecret: import.meta.env.VITE_BKASH_APP_SECRET || '',
      username: import.meta.env.VITE_BKASH_USERNAME || '',
      password: import.meta.env.VITE_BKASH_PASSWORD || '',
    };

    if (!this.config.appKey || !this.config.appSecret) {
      console.warn('bKash credentials not configured. Please set environment variables.');
    }
  }

  /**
   * Get access token from bKash
   */
  async getToken(): Promise<string> {
    // Return cached token if still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/token/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': this.config.username,
          'password': this.config.password,
        },
        body: JSON.stringify({
          app_key: this.config.appKey,
          app_secret: this.config.appSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BkashTokenResponse = await response.json();
      
      if (!data.id_token) {
        throw new Error('No token received from bKash');
      }

      this.token = data.id_token;
      // Set expiry to 90% of actual expiry time for safety
      this.tokenExpiry = Date.now() + (data.expires_in * 900);
      
      return data.id_token;
    } catch (error) {
      console.error('bKash token error:', error);
      throw new Error('Failed to get bKash authentication token');
    }
  }

  /**
   * Create a new payment
   */
  async createPayment(amount: number, orderId: string, customerPhone?: string): Promise<BkashPaymentResponse> {
    const token = await this.getToken();

    try {
      const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.config.appKey,
        },
        body: JSON.stringify({
          mode: '0011', // Instant payment
          payerReference: customerPhone || '',
          callbackURL: `${window.location.origin}/payment/bkash/callback`,
          amount: amount.toFixed(2),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: orderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BkashPaymentResponse = await response.json();
      
      if (!data.paymentID) {
        throw new Error('No payment ID received from bKash');
      }

      return data;
    } catch (error) {
      console.error('bKash create payment error:', error);
      throw new Error('Failed to create bKash payment');
    }
  }

  /**
   * Execute payment after user authorization
   */
  async executePayment(paymentID: string): Promise<BkashPaymentResponse> {
    const token = await this.getToken();

    try {
      const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.config.appKey,
        },
        body: JSON.stringify({
          paymentID,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BkashPaymentResponse = await response.json();
      return data;
    } catch (error) {
      console.error('bKash execute payment error:', error);
      throw new Error('Failed to execute bKash payment');
    }
  }

  /**
   * Query payment status
   */
  async queryPayment(paymentID: string): Promise<BkashPaymentResponse> {
    const token = await this.getToken();

    try {
      const response = await fetch(`${this.config.baseUrl}/tokenized/checkout/payment/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authorization': token,
          'x-app-key': this.config.appKey,
        },
        body: JSON.stringify({
          paymentID,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BkashPaymentResponse = await response.json();
      return data;
    } catch (error) {
      console.error('bKash query payment error:', error);
      throw new Error('Failed to query bKash payment status');
    }
  }

  /**
   * Get payment URL for redirect
   */
  getPaymentUrl(paymentID: string): string {
    const baseUrl = this.config.baseUrl.includes('sandbox') 
      ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'
      : 'https://tokenized.pay.bka.sh/v1.2.0-beta';
    
    return `${baseUrl}/tokenized/checkout/execute/${paymentID}`;
  }

  /**
   * Check if bKash is configured
   */
  isConfigured(): boolean {
    return !!(this.config.appKey && this.config.appSecret && this.config.username && this.config.password);
  }
}

export const bkashService = new BkashService();
export type { BkashPaymentResponse };