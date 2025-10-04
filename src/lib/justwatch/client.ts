/**
 * JustWatch API Client
 *
 * Unofficial client for JustWatch API to fetch streaming availability and pricing.
 * Based on reverse-engineering of the JustWatch website API.
 *
 * ⚠️ DISCLAIMER: This is NOT an official API. Use responsibly and for non-commercial purposes only.
 */

// Types
export type JustWatchOffer = {
  monetization_type: string; // 'flatrate' | 'rent' | 'buy' | 'free' | 'ads'
  provider_id: number;
  provider_name?: string;
  retail_price?: number;
  currency?: string;
  presentation_type?: string; // 'hd' | 'sd' | '4k'
  urls?: {
    standard_web?: string;
  };
};

export type JustWatchProvider = {
  id: number;
  technical_name: string;
  short_name: string;
  clear_name: string;
  icon_url?: string;
};

export type JustWatchResult = {
  id: number;
  title: string;
  object_type: string; // 'movie' | 'show'
  tmdb_id?: number;
  offers?: JustWatchOffer[];
  scoring?: Array<{
    provider_type: string;
    value: number;
  }>;
};

export type JustWatchSearchResponse = {
  items: JustWatchResult[];
  total_results: number;
};

/**
 * JustWatch API Client
 */
export class JustWatchClient {
  private baseUrl = "https://apis.justwatch.com";
  private graphqlUrl = "https://apis.justwatch.com/graphql";
  private locale: string;
  private country: string;
  private providersCache: Map<number, JustWatchProvider> = new Map();

  constructor(country: string = "FI") {
    this.country = country.toUpperCase();
    this.locale = `${this.country.toLowerCase()}_${this.country}`;
  }

  /**
   * Search for a title by name using GraphQL
   */
  async searchTitle(
    query: string,
    contentType: "movie" | "show" = "movie",
  ): Promise<JustWatchSearchResponse> {
    const graphqlQuery = `
      query GetSearchTitles($country: Country!, $language: Language!, $first: Int!, $filter: TitleFilter) {
        popularTitles(country: $country, first: $first, filter: $filter) {
          edges {
            node {
              id
              objectType
              objectId
              content(country: $country, language: $language) {
                title
                shortDescription
                originalReleaseYear
                externalIds {
                  imdbId
                  tmdbId
                }
              }
              offers(country: $country, platform: WEB) {
                monetizationType
                presentationType
                retailPrice(language: $language)
                currency
                package {
                  id
                  packageId
                  clearName
                }
                standardWebURL
              }
            }
          }
        }
      }
    `;

    const variables = {
      country: this.country,
      language: "en",
      first: 5,
      filter: {
        searchQuery: query,
        objectTypes: [contentType.toUpperCase()],
      },
    };

    try {
      const response = await fetch(this.graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables,
        }),
      });

      if (!response.ok) {
        console.error(`[JustWatch] GraphQL API error: ${response.status}`);
        // Fallback to old API
        return this.searchTitleFallback(query, contentType);
      }

      const result = await response.json();

      if (result.errors) {
        console.error("[JustWatch] GraphQL errors:", result.errors);
        return this.searchTitleFallback(query, contentType);
      }

      const items = (result.data?.popularTitles?.edges || []).map(
        (edge: any) => {
          const node = edge.node;
          return {
            id: node.objectId,
            title: node.content?.title || "",
            object_type: node.objectType?.toLowerCase() || "movie",
            tmdb_id: node.content?.externalIds?.tmdbId,
            offers: (node.offers || []).map((offer: any) => ({
              monetization_type: offer.monetizationType?.toLowerCase(),
              provider_id: offer.package?.packageId || 0,
              provider_name: offer.package?.clearName,
              retail_price: offer.retailPrice,
              currency: offer.currency,
              presentation_type: offer.presentationType?.toLowerCase(),
              urls: {
                standard_web: offer.standardWebURL,
              },
            })),
          };
        },
      );

      return {
        items,
        total_results: items.length,
      };
    } catch (error) {
      console.error("[JustWatch] Search error:", error);
      return this.searchTitleFallback(query, contentType);
    }
  }

  /**
   * Fallback to old API format
   */
  private async searchTitleFallback(
    query: string,
    contentType: "movie" | "show" = "movie",
  ): Promise<JustWatchSearchResponse> {
    const url = `${this.baseUrl}/content/titles/${this.locale}/popular`;

    const body = {
      page: 1,
      page_size: 5,
      query,
      content_types: [contentType],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`JustWatch API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        items: data.items || [],
        total_results: data.total_results || 0,
      };
    } catch (error) {
      console.error("[JustWatch] Fallback search error:", error);
      return { items: [], total_results: 0 };
    }
  }

  /**
   * Get title details by JustWatch ID
   */
  async getTitle(
    jwId: number,
    contentType: "movie" | "show" = "movie",
  ): Promise<JustWatchResult | null> {
    const url = `${this.baseUrl}/content/titles/${contentType}/${jwId}/locale/${this.locale}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        throw new Error(`JustWatch API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("[JustWatch] Get title error:", error);
      return null;
    }
  }

  /**
   * Get providers list for the locale
   */
  async getProviders(): Promise<JustWatchProvider[]> {
    const url = `${this.baseUrl}/content/providers/locale/${this.locale}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        throw new Error(`JustWatch API error: ${response.status}`);
      }

      const data = await response.json();
      const providers: JustWatchProvider[] = data || [];

      // Cache providers
      providers.forEach((p) => this.providersCache.set(p.id, p));

      return providers;
    } catch (error) {
      console.error("[JustWatch] Get providers error:", error);
      return [];
    }
  }

  /**
   * Find streaming offers by TMDB ID
   * This searches by title and tries to match TMDB ID
   */
  async getOffersByTmdbId(
    tmdbId: number,
    title: string,
  ): Promise<JustWatchOffer[]> {
    try {
      console.log(
        `[JustWatch] Searching for "${title}" (TMDB: ${tmdbId}) in ${this.country}`,
      );

      // Search by title first
      const searchResults = await this.searchTitle(title);

      console.log(`[JustWatch] Found ${searchResults.items.length} results`);

      if (searchResults.items.length === 0) {
        console.log(`[JustWatch] No results found for "${title}"`);
        return [];
      }

      // Try to find exact match by tmdb_id
      let match = searchResults.items.find((item) => item.tmdb_id === tmdbId);

      // If no exact match, take the first result (best match)
      if (!match) {
        console.log(
          `[JustWatch] No exact TMDB match for ${tmdbId}, using best result:`,
          searchResults.items[0].title,
        );
        match = searchResults.items[0];
      } else {
        console.log(`[JustWatch] Found exact TMDB match:`, match.title);
      }

      // Check if offers are already in the search result (from GraphQL)
      if (match.offers && match.offers.length > 0) {
        console.log(
          `[JustWatch] Found ${match.offers.length} offers in search results`,
        );
        return match.offers;
      }

      // Get detailed info if we have a JustWatch ID (fallback)
      if (match && match.id) {
        console.log(
          `[JustWatch] Fetching details for JustWatch ID: ${match.id}`,
        );
        const details = await this.getTitle(
          match.id,
          match.object_type as "movie" | "show",
        );
        if (details && details.offers) {
          console.log(
            `[JustWatch] Found ${details.offers.length} offers from details`,
          );
          return details.offers;
        }
      }

      console.log(`[JustWatch] No offers found for "${title}"`);
      return [];
    } catch (error) {
      console.error("[JustWatch] Get offers error:", error);
      return [];
    }
  }

  /**
   * Format offers into a readable structure
   */
  formatOffers(offers: JustWatchOffer[]) {
    const grouped: {
      flatrate: JustWatchOffer[];
      rent: JustWatchOffer[];
      buy: JustWatchOffer[];
      free: JustWatchOffer[];
      ads: JustWatchOffer[];
    } = {
      flatrate: [],
      rent: [],
      buy: [],
      free: [],
      ads: [],
    };

    offers.forEach((offer) => {
      const type = offer.monetization_type as keyof typeof grouped;
      if (grouped[type]) {
        grouped[type].push(offer);
      }
    });

    return grouped;
  }

  /**
   * Get the cheapest rent/buy price from offers
   */
  getCheapestPrice(
    offers: JustWatchOffer[],
    type: "rent" | "buy",
  ): { price: number; currency: string; provider: string } | null {
    console.log(`[JustWatch] getCheapestPrice for type: ${type}`);
    console.log(`[JustWatch] Total offers:`, offers.length);

    // Helper to parse price from string (removes currency symbols)
    const parsePrice = (priceValue: any): number => {
      if (typeof priceValue === "number") return priceValue;
      if (typeof priceValue === "string") {
        // Remove currency symbols and other non-numeric characters except . and ,
        const cleaned = priceValue.replace(/[^0-9.,]/g, "").replace(",", ".");
        return parseFloat(cleaned);
      }
      return NaN;
    };

    const filtered = offers.filter((o) => {
      if (o.monetization_type !== type) return false;

      console.log(`[JustWatch] Checking ${type} offer:`, {
        provider: o.provider_name,
        retail_price: o.retail_price,
        retail_price_type: typeof o.retail_price,
        currency: o.currency,
      });

      if (!o.retail_price) {
        console.log(`[JustWatch] Skipping - no retail_price`);
        return false;
      }

      const price = parsePrice(o.retail_price);

      console.log(
        `[JustWatch] Parsed price: ${price}, isNaN: ${isNaN(price)}, > 0: ${price > 0}`,
      );

      return !isNaN(price) && price > 0;
    });

    console.log(`[JustWatch] Filtered ${type} offers:`, filtered.length);

    if (filtered.length === 0) {
      console.log(`[JustWatch] No valid ${type} offers found`);
      return null;
    }

    const sorted = filtered.sort((a, b) => {
      const priceA = parsePrice(a.retail_price);
      const priceB = parsePrice(b.retail_price);
      return priceA - priceB;
    });
    const cheapest = sorted[0];
    const price = parsePrice(cheapest.retail_price);

    console.log(`[JustWatch] Cheapest ${type}:`, {
      price,
      currency: cheapest.currency,
      provider: cheapest.provider_name,
    });

    return {
      price,
      currency: cheapest.currency || "EUR",
      provider: cheapest.provider_name || "Unknown",
    };
  }
}

/**
 * Default export - singleton instance for FI
 */
export const justWatchClient = new JustWatchClient("FI");
