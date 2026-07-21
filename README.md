# bitcoin-lightning-payment-module-for-medusajs-via-clink

[Bitcoin](https://bitcoin.org/bitcoin.pdf) [Lightning](https://Lightning.network) payment module for [MedusaJS](https://medusajs.com/) eCommerce via the [CLINK protocol](https://clinkme.dev).

[![npm version](https://img.shields.io/npm/v/bitcoin-lightning-payment-module-for-medusajs-via-clink.svg)](https://www.npmjs.com/package/medusa-bitcoin-lightning-payment-module-via-clink) [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) [![Medusa v2](https://img.shields.io/badge/Medusa-v2-green.svg)](https://docs.medusajs.com/) [![CLINK](https://img.shields.io/badge/Protocol-CLINK-orange.svg)](https://clinkme.dev)

## Features

- ⚡ **Lightning Payments** - Accept Bitcoin Lightning payments via CLINK protocol
- 🔒 **Self-Custodial** - Your node, your funds, no third-party
- 🌐 **Nostr-Native** - All communication via Nostr relays, no web server needed
- 💱 **Auto Conversion** - CoinGecko, Kraken, Fixed rate, or Manual
- 🔄 **Subscriptions** - Auto-renewal via CLINK Debits (nDebit)
- 📱 **QR + Copy** - Beautiful QR codes with one-click copy for invoices
- 🔐 **Privacy** - Ephemeral Nostr keys for payment requests
- 🛡️ **Dual Confirmation** - Webhook (primary) + Polling (backup)
- 📊 **Admin Dashboard** - Configure everything from the Medusa admin panel

## What's in the Box

| Component | Description |
| --- | --- |
| `ClinkPaymentProviderService` | Core payment provider with CLINK SDK integration |
| `CurrencyService` | Fiat-to-sats conversion (CoinGecko, Kraken, Fixed, Manual) |
| `SubscriptionService` | Recurring payments via nDebit protocol |
| Admin Settings Widget | Configure noffer, currency source, subscriptions, refunds |
| Storefront Component | QR code + copy + countdown timer + payment status polling |
| Webhook Endpoint | Real-time payment confirmations from CLINK relay |
| Status Endpoint | Backup polling for payment verification |

## Quick Start

### 1. Install

```bash
npm install -bitcoin-lightning-payment-module-for-medusajs-via-clink
```

### 2. Configure

Add to your `-config.ts`:

```ts
import { Modules } from "@medusajs/framework/utils"

module.exports = defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "bitcoin-lightning-payment-module-for-medusajs-via-clink",
            id: "clink",
            options: {
              noffer: "noffer1...", // Your CLINK offer string
              currencySource: "coingecko",
              invoiceTimeout: 600,
              debug: false
            }
          }
        ]
      }
    }
  ]
})
```

### 3. Enable in Admin

1. Go to **Settings > Regions**
2. Edit your region
3. Enable **Lightning (CLINK)** as a payment provider

### 4. Accept Payments!

Customers can now pay with Lightning at checkout.

## Documentation

Full documentation lives on the [GitHub Wiki](https://github.com/WoompaLoompa/medusa-clink/wiki):

- [Getting Started](https://github.com/WoompaLoompa/medusa-clink/wiki/Getting-Started)
- [Configuration](https://github.com/WoompaLoompa/medusa-clink/wiki/Configuration)
- [Guide for Merchants](https://github.com/WoompaLoompa/medusa-clink/wiki/Guide-for-Merchants)
- [Guide for Customers](https://github.com/WoompaLoompa/medusa-clink/wiki/Guide-for-Customers)
- [Guide for Subscriptions](https://github.com/WoompaLoompa/medusa-clink/wiki/Guide-for-Subscriptions)
- [Currency Sources](https://github.com/WoompaLoompa/medusa-clink/wiki/Currency-Sources)
- [Troubleshooting](https://github.com/WoompaLoompa/medusa-clink/wiki/Troubleshooting)
- [FAQ](https://github.com/WoompaLoompa/medusa-clink/wiki/Frequently-Asked-Questions)
- [Changelog](https://github.com/WoompaLoompa/medusa-clink/wiki/Changelog)

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHECKOUT FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Customer selects "Pay with Lightning"                           │
│       │                                                          │
│       ▼                                                          │
│  Medusa requests invoice                                         │
│       │                                                          │
│       ▼                                                          │
│  CLINK SDK decodes nOffer → requests BOLT11 from your node       │
│       │                                                          │
│       ▼                                                          │
│  QR code + invoice displayed to customer                         │
│       │                                                          │
│       ▼                                                          │
│  Customer scans QR with Lightning wallet                         │
│       │                                                          │
│       ▼                                                          │
│  Payment confirmed via Webhook (primary) OR Polling (backup)     │
│       │                                                          │
│       ▼                                                          │
│  Order confirmed! ⚡                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

No web server needed for your Lightning node. All communication flows over Nostr. See the [Wiki architecture page](https://github.com/WoompaLoompa/medusa-clink/wiki#architecture) for the full data flow.

## Requirements

- Medusa v2.x
- Node.js >= 18.0.0
- A CLINK-compatible Lightning wallet/node:
  - [ShockWallet](https://shockwallet.app) (iOS/Android/Desktop)
  - [Lightning.Pub](https://lightning.pub) (self-hosted)
  - [ZEUS](https://zeusln.com) (iOS/Android)
  - [Amethyst](https://amethyst.social) (Android)
  - [Electrum](https://electrum.org) with [CLINK plugin](https://github.com/BareBits/electrum_clink) (Desktop)

## Configuration Options

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `noffer` | string | Yes | - | Your CLINK offer string |
| `currencySource` | string | No | `coingecko` | Exchange rate source |
| `fixedBtcRate` | number | No | - | Fixed BTC rate (if using `fixed` source) |
| `invoiceTimeout` | number | No | `600` | Invoice expiry in seconds |
| `pollInterval` | number | No | `5000` | Polling interval in ms |
| `enableSubscriptions` | boolean | No | `false` | Enable nDebit subscriptions |
| `refundContactEmail` | string | No | - | Merchant email for refunds |
| `refundContactNostr` | string | No | - | Merchant Nostr for refunds |
| `debug` | boolean | No | `false` | Enable debug logging |

See the [Configuration Wiki page](https://github.com/WoompaLoompa/medusa-clink/wiki/Configuration) for details on each option.

## Supported Wallets

**For Merchants** (to get your `nOffer`):
- [ShockWallet](https://shockwallet.app) - Menu > Static Offer
- [Lightning.Pub](https://lightning.pub) - Dashboard > Offers
- [ZEUS](https://zeusln.com) - Settings > CLINK

**For Customers** (to pay):
- [ShockWallet](https://shockwallet.app)
- [ZEUS](https://zeusln.com)
- [Amethyst](https://amethyst.social)
- [Electrum](https://electrum.org) with [CLINK plugin](https://github.com/BareBits/electrum_clink)
- Any CLINK-compatible wallet

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Watch mode
npm run dev
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

GPL-3.0 - See [LICENSE](LICENSE) for details.

## Support

- [Issues](https://github.com/shocknet/medusa-clink/issues)
- [Discussions](https://github.com/shocknet/medusa-clink/discussions)
- [CLINK Protocol](https://clinkme.dev)
- [Medusa Documentation](https://docs.medusajs.com/)
