"use strict";
/**
 * CLINK Currency Conversion Service
 * Handles fiat-to-satoshi conversion with multiple exchange rate sources
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
exports.isValidNoffer = isValidNoffer;
exports.extractOfferPrefix = extractOfferPrefix;
exports.formatSats = formatSats;
exports.isValidTimeout = isValidTimeout;
exports.calculateExpiry = calculateExpiry;
exports.isInvoiceExpired = isInvoiceExpired;
const types_1 = require("./types");
/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL = 5 * 60 * 1000;
/** CoinGecko base URL */
const COINGECKO_API = "https://api.coingecko.com/api/v3";
/** Kraken base URL */
const KRAKEN_API = "https://api.kraken.com/0/public";
/** Satoshis per BTC */
const SATS_PER_BTC = 100_000_000;
/**
 * Currency conversion service
 * Converts fiat amounts to satoshis using various exchange rate sources
 */
class CurrencyService {
    source;
    fixedRate;
    cache = new Map();
    debug;
    constructor(options) {
        this.source = options.currencySource || types_1.CLINK_DEFAULTS.currencySource;
        this.fixedRate = options.fixedBtcRate;
        this.debug = options.debug || false;
    }
    /**
     * Convert fiat amount to satoshis
     * @param amount - Fiat amount
     * @param currency - ISO 4217 currency code (e.g., "USD", "EUR")
     * @returns Conversion result with sats, rate, and metadata
     */
    async fiatToSats(amount, currency) {
        const normalizedCurrency = currency.toLowerCase();
        if (this.source === "manual") {
            return {
                sats: 0,
                rate: 0,
                source: "manual",
                cachedAt: Date.now()
            };
        }
        const rate = await this.getRate(normalizedCurrency);
        const btcAmount = amount / rate;
        const sats = Math.round(btcAmount * SATS_PER_BTC);
        this.log(`Converted ${amount} ${currency.toUpperCase()} = ${sats} sats (rate: ${rate})`);
        return {
            sats,
            rate,
            source: this.source,
            cachedAt: Date.now()
        };
    }
    /**
     * Get exchange rate for currency
     * Uses cache when available, otherwise fetches from source
     */
    async getRate(currency) {
        // Check cache first
        const cached = this.cache.get(currency);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            this.log(`Using cached rate for ${currency}: ${cached.rate}`);
            return cached.rate;
        }
        // Fetch fresh rate
        let rate;
        switch (this.source) {
            case "coingecko":
                rate = await this.fetchCoinGeckoRate(currency);
                break;
            case "kraken":
                rate = await this.fetchKrakenRate(currency);
                break;
            case "fixed":
                if (!this.fixedRate) {
                    throw new Error("fixedBtcRate is required when currencySource is 'fixed'");
                }
                rate = this.fixedRate;
                break;
            default:
                throw new Error(`Unsupported currency source: ${this.source}`);
        }
        // Cache the rate
        this.cache.set(currency, { rate, timestamp: Date.now() });
        return rate;
    }
    /**
     * Fetch BTC/fiat rate from CoinGecko
     * Free API, no key required
     */
    async fetchCoinGeckoRate(currency) {
        const url = `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=${currency}`;
        this.log(`Fetching CoinGecko rate for ${currency}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.bitcoin || !(currency in data.bitcoin)) {
            throw new Error(`CoinGecko: No rate found for ${currency}`);
        }
        return data.bitcoin[currency];
    }
    /**
     * Fetch BTC/fiat rate from Kraken
     * Free tier available, API key optional
     */
    async fetchKrakenRate(currency) {
        // Kraken uses XBT for BTC and specific pair formats
        const pair = `XXBTZ${currency.toUpperCase()}`;
        const url = `${KRAKEN_API}/Ticker?pair=${pair}`;
        this.log(`Fetching Kraken rate for ${currency}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Kraken API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error && data.error.length > 0) {
            throw new Error(`Kraken API error: ${data.error.join(", ")}`);
        }
        const tickerKey = Object.keys(data.result)[0];
        if (!tickerKey) {
            throw new Error(`Kraken: No data for ${currency}`);
        }
        // c is the last trade closed [price, lot-volume]
        const lastPrice = parseFloat(data.result[tickerKey].c[0]);
        if (isNaN(lastPrice) || lastPrice <= 0) {
            throw new Error(`Kraken: Invalid price for ${currency}`);
        }
        return lastPrice;
    }
    /**
     * Clear rate cache
     */
    clearCache() {
        this.cache.clear();
        this.log("Currency cache cleared");
    }
    /**
     * Get current cache status
     */
    getCacheStatus() {
        const status = {};
        this.cache.forEach((cached, currency) => {
            status[currency] = {
                rate: cached.rate,
                age: Date.now() - cached.timestamp
            };
        });
        return status;
    }
    /**
     * Debug logging
     */
    log(message) {
        if (this.debug) {
            console.log(`[ClinkCurrency] ${message}`);
        }
    }
}
exports.CurrencyService = CurrencyService;
/**
 * Validate a noffer string format
 * @param noffer - The noffer string to validate
 * @returns true if valid format
 */
function isValidNoffer(noffer) {
    if (!noffer || typeof noffer !== "string") {
        return false;
    }
    // Must start with noffer1
    if (!noffer.startsWith("noffer1")) {
        return false;
    }
    // Minimum length check (noffer1 + some data)
    if (noffer.length < 10) {
        return false;
    }
    // Only bech32 characters (lowercase)
    const bech32Chars = /^[a-z0-9]+$/;
    const dataPart = noffer.slice(7); // Remove "noffer1"
    return bech32Chars.test(dataPart);
}
/**
 * Extract offer ID from noffer string (simple extraction)
 * Note: Full decoding requires bech32 TLV parsing from CLINK SDK
 */
function extractOfferPrefix(noffer) {
    if (!isValidNoffer(noffer)) {
        return "invalid";
    }
    // Return first 20 chars as identifier for logging
    return noffer.slice(0, 20) + "...";
}
/**
 * Format satoshi amount for display
 * @param sats - Amount in satoshis
 * @param format - Display format
 */
function formatSats(sats, format = "sats") {
    switch (format) {
        case "btc":
            return (sats / SATS_PER_BTC).toFixed(8);
        case "btc-symbol":
            return `\u20BF ${(sats / SATS_PER_BTC).toFixed(8)}`;
        case "sats":
        default:
            return `${sats.toLocaleString()} sats`;
    }
}
/**
 * Validate invoice timeout value
 */
function isValidTimeout(timeout) {
    return timeout > 0 && timeout <= 86400 && Number.isInteger(timeout);
}
/**
 * Calculate expiry timestamp
 * @param timeoutSeconds - Timeout in seconds from now
 * @returns Unix timestamp of expiry
 */
function calculateExpiry(timeoutSeconds) {
    return Math.floor(Date.now() / 1000) + timeoutSeconds;
}
/**
 * Check if invoice has expired
 * @param expiresAt - Unix timestamp of expiry
 * @returns true if expired
 */
function isInvoiceExpired(expiresAt) {
    return Math.floor(Date.now() / 1000) > expiresAt;
}
//# sourceMappingURL=utils.js.map