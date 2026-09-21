export interface Asset {
  id: string;
  enName: string;
  faName: string;
  category: 'metals' | 'pharma' | 'petro' | 'investment';
  price: number;
  change: number;
  flag: string;
  locationEn: string;
  locationFa: string;
  progress: number; // For sale progress bars
  descriptionEn?: string;
  descriptionFa?: string;
  backingEn?: string;
  backingFa?: string;
  custodianEn?: string;
  custodianFa?: string;
  riskLevel?: 'Low' | 'Medium' | 'High';
  payoutIntervalEn?: string;
  payoutIntervalFa?: string;
  tsetmcUrl?: string;
  bourseSymbol?: string;
  tsetmcInsCode?: string;
  lastPriceRial?: number;
  closingPriceRial?: number;
  yesterdayPriceRial?: number;
  dayLowRial?: number;
  dayHighRial?: number;
  tradeVolume?: number;
  tradeValueRial?: number;
  marketUpdatedAt?: string;
}

export interface PortfolioItem {
  assetId: string;
  shares: number;
  avgPrice: number;
}

export interface PurchaseLot {
  id: string;
  assetId: string;
  shares: number;
  price: number;
  date: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'buy' | 'sell';
  asset: string;
  amount: string;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
}

export type Theme = 'dark' | 'light';
export type Language = 'en' | 'fa';

export interface LimitOrder {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number; // USDT amount for buy, or Shares count for sell
  date: string;
  status: 'pending' | 'executed' | 'cancelled';
}

export interface PriceAlert {
  id: string;
  assetId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  date: string;
}

export interface UserActivity {
  id: string;
  type: string;
  descriptionEn: string;
  descriptionFa: string;
  date: string;
}
