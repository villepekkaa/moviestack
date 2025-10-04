/**
 * JustWatch Type Definitions
 * Types for storing and displaying JustWatch streaming availability data
 */

export type StreamingOffer = {
  monetizationType: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';
  providerName: string;
  providerId: number;
  price?: number;
  currency?: string;
  quality?: string; // 'HD', 'SD', '4K'
  url?: string;
};

export type StreamingData = {
  movieId: number;
  tmdbId: number;
  country: string;
  offers: StreamingOffer[];
  flatrate: StreamingOffer[]; // Subscription services (Netflix, Disney+, etc.)
  rent: StreamingOffer[];
  buy: StreamingOffer[];
  free: StreamingOffer[];
  ads: StreamingOffer[]; // Free with ads
  cheapestRent?: {
    price: number;
    currency: string;
    provider: string;
  };
  cheapestBuy?: {
    price: number;
    currency: string;
    provider: string;
  };
  lastUpdated: string; // ISO date string
};

export type StreamingCache = {
  [tmdbId: number]: StreamingData;
};
