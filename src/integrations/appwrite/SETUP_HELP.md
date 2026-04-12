/**
 * If you're getting errors like "Invalid document structure: Unknown attribute: 'paymentMethod'"
 * 
 * This means your Appwrite collections need to be updated with new payment-related attributes.
 * 
 * SOLUTION: Run the setup script again
 * ============================================
 * 
 * 1. Open your terminal
 * 2. Run: node scripts/setup-appwrite.js
 * 3. Follow the prompts to enter your Appwrite credentials
 * 
 * The script will:
 * ✅ Detect that the collections already exist
 * ✅ Skip creating collections (saves time)
 * ✅ Add the missing attributes: paymentMethod, paymentStatus, refundedAmount, etc.
 * ✅ Create the necessary indexes
 * 
 * After running the script, refresh your browser and try placing an order again.
 * 
 * ============================================
 * 
 * NEW PAYMENT ATTRIBUTES BEING ADDED:
 * 
 * Orders Collection:
 *   - paymentMethod: 'stripe' | 'paypal' | 'bkash' | 'nagad' | 'cod'
 *   - paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded'
 *   - refundedAmount: number (default: 0)
 *   - refundReason: string (optional)
 *   - refundedAt: datetime (optional)
 */

export const SETUP_INSTRUCTIONS = {
  paymentAttributeError: `
    Error: Invalid document structure: Unknown attribute: 'paymentMethod'
    
    Your Appwrite collections need to be updated with payment attributes.
    
    Run this command:
    $ node scripts/setup-appwrite.js
    
    It will add the missing payment fields to your existing collections.
  `
};
