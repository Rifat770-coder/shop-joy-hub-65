import { useSettings } from '@/hooks/useSettings';

export function useCurrency() {
  const { storeSettings } = useSettings();

  const formatCurrency = (amount: number): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: storeSettings.currency || 'BDT',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${storeSettings.currency || 'BDT'} ${amount.toFixed(2)}`;
    }
  };

  return { formatCurrency, currency: storeSettings.currency || 'BDT' };
}
