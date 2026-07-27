export interface MarketQuote {
  symbol: string;
  price: number;
  changePercent: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  url: string;
  source?: string;
}
