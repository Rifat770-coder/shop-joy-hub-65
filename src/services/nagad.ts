/**
 * Nagad Payment Gateway Integration
 * Official Nagad Payment API implementation
 */

interface NagadInitResponse {
  sensitiveData: string;
  signature: string;
  clientType: string;
  status: string;
  statusCode: string;
}

interface NagadPaymentResponse {
  paymentReferenceId: string;
  challenge: string;
  acceptDateTime: string;
  status: string;
  statusCode: string;
  callBackUrl: string;
}

interface NagadVerificationResponse {
  merchantId: string;
  orderId: string;
  paymentReferenceId: string;
  amount: string;
  clientMobileNo: string;
  merchantMobileNo: string;
  status: string;
  statusCode: string;
  dateTime: string;
  issuerPaymentDateTime: string;
  issuerPaymentRefNo: string;
}

interface NagadConfig {
  baseUrl: string;
  merchantId: string;
  merchantNumber: string;
  publicKey: string;
  privateKey: string;
}

class NagadService {
  private config: NagadConfig;

  constructor() {
    this.config = {
      baseUrl: import.meta.env.VITE_NAGAD_BASE_URL || 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs',
      merchantId: import.meta.env.VITE_NAGAD_MERCHANT_ID || '',
      merchantNumber: import.meta.env.VITE_NAGAD_MERCHANT_NUMBER || '',
      publicKey: import.meta.env.VITE_NAGAD_PUBLIC_KEY || '',
      privateKey: import.meta.env.VITE_NAGAD_PRIVATE_KEY || '',
    };

    if (!this.config.merchantId || !this.config.privateKey) {
      console.warn('Nagad credentials not configured. Please set environment variables.');
    }
  }

  /**
   * Generate random string for challenge
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate signature using HMAC-SHA256
   */
  private async generateSignature(data: string): Promise<string> {
    // For browser environment, we'll use Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.privateKey);
    const messageData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '127.0.0.1';
    }
  }

  /**
   * Initialize payment with Nagad
   */
  async initializePayment(amount: number, orderId: string): Promise<NagadInitResponse> {
    const dateTime = new Date().toISOString();
    const challenge = this.generateRandomString(40);
    
    const sensitiveData = {
      merchantId: this.config.merchantId,
      datetime: dateTime,
      orderId: orderId,
      challenge: challenge,
    };

    const sensitiveDataString = JSON.stringify(sensitiveData);
    const signature = await this.generateSignature(sensitiveDataString);
    const clientIP = await this.getClientIP();

    try {
      const response = await fetch(`${this.config.baseUrl}/check-out/initialize/${this.config.merchantId}/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KM-Api-Version': 'v-0.2.0',
          'X-KM-IP-V4': clientIP,
          'X-KM-Client-Type': 'PC_WEB',
        },
        body: JSON.stringify({
          accountNumber: this.config.merchantNumber,
          dateTime: dateTime,
          sensitiveData: btoa(sensitiveDataString),
          signature: signature,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NagladInitResponse = await response.json();
      
      if (data.status !== 'Success') {
        throw new Error(`Nagad initialization failed: ${data.statusCode}`);
      }

      return data;
    } catch (error) {
      console.error('Nagad initialize payment error:', error);
      throw new Error('Failed to initialize Nagad payment');
    }
  }

  /**
   * Complete payment process
   */
  async completePayment(
    paymentReferenceId: string,
    amount: number,
    orderId: string
  ): Promise<NagadPaymentResponse> {
    const dateTime = new Date().toISOString();
    const challenge = this.generateRandomString(40);
    
    const sensitiveData = {
      merchantId: this.config.merchantId,
      orderId: orderId,
      amount: amount.toFixed(2),
      currencyCode: '050', // BDT currency code
      challenge: challenge,
    };

    const sensitiveDataString = JSON.stringify(sensitiveData);
    const signature = await this.generateSignature(sensitiveDataString);
    const clientIP = await this.getClientIP();

    try {
      const response = await fetch(`${this.config.baseUrl}/check-out/complete/${paymentReferenceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-KM-Api-Version': 'v-0.2.0',
          'X-KM-IP-V4': clientIP,
          'X-KM-Client-Type': 'PC_WEB',
        },
        body: JSON.stringify({
          paymentReferenceId: paymentReferenceId,
          sensitiveData: btoa(sensitiveDataString),
          signature: signature,
          merchantCallbackURL: `${window.location.origin}/payment/nagad/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NagadPaymentResponse = await response.json();
      
      if (data.status !== 'Success') {
        throw new Error(`Nagad payment completion failed: ${data.statusCode}`);
      }

      return data;
    } catch (error) {
      console.error('Nagad complete payment error:', error);
      throw new Error('Failed to complete Nagad payment');
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentReferenceId: string): Promise<NagadVerificationResponse> {
    const clientIP = await this.getClientIP();

    try {
      const response = await fetch(`${this.config.baseUrl}/verify/payment/${paymentReferenceId}`, {
        method: 'GET',
        headers: {
          'X-KM-Api-Version': 'v-0.2.0',
          'X-KM-IP-V4': clientIP,
          'X-KM-Client-Type': 'PC_WEB',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: NagadVerificationResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Nagad verify payment error:', error);
      throw new Error('Failed to verify Nagad payment');
    }
  }

  /**
   * Check if Nagad is configured
   */
  isConfigured(): boolean {
    return !!(this.config.merchantId && this.config.merchantNumber && this.config.privateKey);
  }

  /**
   * Get payment redirect URL
   */
  getPaymentUrl(callBackUrl: string): string {
    return callBackUrl;
  }
}

export const nagadService = new NagadService();
export type { NagadPaymentResponse, NagadVerificationResponse };