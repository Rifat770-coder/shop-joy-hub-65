export interface FlashSaleSettings {
  id?: string;
  isActive: boolean;
  title: string;
  subtitle: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  targetUrl: string;
  categories: string[];
  products: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FlashSaleCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}