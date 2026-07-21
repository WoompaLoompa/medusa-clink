"use strict";
/**
 * CLINK Payment Module
 * Bitcoin Lightning payments for Medusa via the CLINK protocol
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = exports.ClinkPaymentProviderService = void 0;
var service_1 = require("./service");
Object.defineProperty(exports, "ClinkPaymentProviderService", { enumerable: true, get: function () { return __importDefault(service_1).default; } });
var utils_1 = require("./utils");
Object.defineProperty(exports, "CurrencyService", { enumerable: true, get: function () { return utils_1.CurrencyService; } });
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
//# sourceMappingURL=index.js.map