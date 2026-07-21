# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-21

### Added
- Initial release
- Core payment provider service (`ClinkPaymentProviderService`)
- CLINK Offers integration for invoice generation
- Currency conversion service (CoinGecko, Kraken, Fixed, Manual)
- Webhook endpoint for payment confirmations
- Status endpoint for payment polling
- Admin settings widget
- Comprehensive test suite
- Merchant documentation
- Customer documentation
- GitHub Wiki pages

### Features
- Bitcoin Lightning payments via CLINK protocol
- QR code and one-click copy for invoices
- Auto currency conversion from fiat to satoshis
- Subscription support via CLINK Debits (nDebit)
- Dual confirmation (webhook + polling)
- Privacy-preserving ephemeral Nostr keys
- Self-custodial - merchant's node receives funds directly

### Supported
- Medusa v2.x
- CLINK-compatible wallets (ShockWallet, ZEUS, Lightning.Pub, etc.)
- All major currencies via CoinGecko/Kraken
