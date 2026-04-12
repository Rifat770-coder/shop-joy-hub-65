import { useSettings } from '@/hooks/useSettings';

/**
 * Returns a formatCurrency function that formats a number using
 * the currency code configured in the admin Store Information settings.
 * Uses Intl.NumberFormat for proper symbol, grouping, and decimal handling.
 */
export function useCurrency() {
  const { storeSettings } = useSettings();

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: storeSettings.currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback if the currency code is invalid
      return `${storeSettings.currency || '$'} ${amount.toFixed(2)}`;
    }
  };

  return { formatCurrency, currency: storeSettings.currency || 'USD' };
}
