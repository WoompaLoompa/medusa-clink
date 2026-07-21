/**
 * CLINK Currency Conversion Service
 * Handles fiat-to-satoshi conversion with multiple exchange rate sources
 */
import { ConversionResult, ClinkOptions } from "./types";
/**
 * Currency conversion service
 * Converts fiat amounts to satoshis using various exchange rate sources
 */
export declare class CurrencyService {
    private source;
    private fixedRate?;
    private cache;
    private debug;
    constructor(options: ClinkOptions);
    /**
     * Convert fiat amount to satoshis
     * @param amount - Fiat amount
     * @param currency - ISO 4217 currency code (e.g., "USD", "EUR")
     * @returns Conversion result with sats, rate, and metadata
     */
    fiatToSats(amount: number, currency: string): Promise<ConversionResult>;
    /**
     * Get exchange rate for currency
     * Uses cache when available, otherwise fetches from source
     */
    getRate(currency: string): Promise<number>;
    /**
     * Fetch BTC/fiat rate from CoinGecko
     * Free API, no key required
     */
    private fetchCoinGeckoRate;
    /**
     * Fetch BTC/fiat rate from Kraken
     * Free tier available, API key optional
     */
    private fetchKrakenRate;
    /**
     * Clear rate cache
     */
    clearCache(): void;
    /**
     * Get current cache status
     */
    getCacheStatus(): Record<string, {
        rate: number;
        age: number;
    }>;
    /**
     * Debug logging
     */
    private log;
}
/**
 * Validate a noffer string format
 * @param noffer - The noffer string to validate
 * @returns true if valid format
 */
export declare function isValidNoffer(noffer: string): boolean;
/**
 * Extract offer ID from noffer string (simple extraction)
 * Note: Full decoding requires bech32 TLV parsing from CLINK SDK
 */
export declare function extractOfferPrefix(noffer: string): string;
/**
 * Format satoshi amount for display
 * @param sats - Amount in satoshis
 * @param format - Display format
 */
export declare function formatSats(sats: number, format?: "sats" | "btc" | "btc-symbol"): string;
/**
 * Validate invoice timeout value
 */
export declare function isValidTimeout(timeout: number): boolean;
/**
 * Calculate expiry timestamp
 * @param timeoutSeconds - Timeout in seconds from now
 * @returns Unix timestamp of expiry
 */
export declare function calculateExpiry(timeoutSeconds: number): number;
/**
 * Check if invoice has expired
 * @param expiresAt - Unix timestamp of expiry
 * @returns true if expired
 */
export declare function isInvoiceExpired(expiresAt: number): boolean;
//# sourceMappingURL=utils.d.ts.map