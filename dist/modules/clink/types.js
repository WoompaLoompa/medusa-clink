"use strict";
/**
 * CLINK Payment Module Types
 * Bitcoin Lightning payments for Medusa via the CLINK protocol
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinkError = exports.ClinkErrorCode = exports.OfferPriceType = exports.CLINK_DEFAULTS = void 0;
exports.isClinkError = isClinkError;
/** Defaults for ClinkOptions */
exports.CLINK_DEFAULTS = {
    currencySource: "coingecko",
    invoiceTimeout: 600,
    pollInterval: 5000,
    maxPollAttempts: 120,
    description: "Medusa Order",
    enableSubscriptions: false,
    debug: false
};
// ============================================================================
// CLINK Protocol Types
// ============================================================================
/** CLINK Offer pricing type */
var OfferPriceType;
(function (OfferPriceType) {
    OfferPriceType[OfferPriceType["Fixed"] = 0] = "Fixed";
    OfferPriceType[OfferPriceType["Variable"] = 1] = "Variable";
    OfferPriceType[OfferPriceType["Spontaneous"] = 2] = "Spontaneous";
})(OfferPriceType || (exports.OfferPriceType = OfferPriceType = {}));
/** Check if response is an error */
function isClinkError(response) {
    return "error" in response;
}
// ============================================================================
// Error Types
// ============================================================================
/** CLINK error codes per specification */
var ClinkErrorCode;
(function (ClinkErrorCode) {
    ClinkErrorCode[ClinkErrorCode["InvalidOffer"] = 1] = "InvalidOffer";
    ClinkErrorCode[ClinkErrorCode["TemporaryFailure"] = 2] = "TemporaryFailure";
    ClinkErrorCode[ClinkErrorCode["ExpiredOrMoved"] = 3] = "ExpiredOrMoved";
    ClinkErrorCode[ClinkErrorCode["UnsupportedFeature"] = 4] = "UnsupportedFeature";
    ClinkErrorCode[ClinkErrorCode["InvalidAmount"] = 5] = "InvalidAmount";
})(ClinkErrorCode || (exports.ClinkErrorCode = ClinkErrorCode = {}));
/** CLINK error with code and message */
class ClinkError extends Error {
    code;
    range;
    constructor(message, code, range) {
        super(message);
        this.name = "ClinkError";
        this.code = code;
        this.range = range;
    }
}
exports.ClinkError = ClinkError;
//# sourceMappingURL=types.js.map