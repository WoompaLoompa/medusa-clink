/**
 * CLINK Admin Settings Widget
 * 
 * Provides a settings interface for merchants to configure
 * Bitcoin Lightning payments via CLINK.
 */

import React, { useState, useEffect } from "react"

// Types for the widget
interface ClinkSettings {
  noffer: string
  currencySource: "coingecko" | "kraken" | "fixed" | "manual"
  fixedBtcRate: number | null
  invoiceTimeout: number
  enableSubscriptions: boolean
  refundContactEmail: string
  refundContactNostr: string
  debug: boolean
}

interface ClinkSettingsWidgetProps {
  provider?: {
    id: string
    is_enabled: boolean
  }
  onSave?: (settings: ClinkSettings) => void
}

// Default settings
const defaultSettings: ClinkSettings = {
  noffer: "",
  currencySource: "coingecko",
  fixedBtcRate: null,
  invoiceTimeout: 600,
  enableSubscriptions: false,
  refundContactEmail: "",
  refundContactNostr: "",
  debug: false
}

/**
 * Main CLINK Settings Widget Component
 */
export function ClinkSettingsWidget({ provider, onSave }: ClinkSettingsWidgetProps) {
  const [settings, setSettings] = useState<ClinkSettings>(defaultSettings)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Load saved settings on mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/admin/clink/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error("Failed to load CLINK settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof ClinkSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setMessage(null) // Clear any previous messages
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/admin/clink/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: "success", text: "Settings saved successfully!" })
        onSave?.(settings)
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "Failed to save settings" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.icon}>⚡</span>
          <h3 style={styles.title}>Lightning (CLINK)</h3>
          {provider?.is_enabled && (
            <span style={styles.badge}>Enabled</span>
          )}
        </div>
        <button
          style={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "−" : "+"}
        </button>
      </div>

      {isExpanded && (
        <div style={styles.content}>
          {isLoading && (
            <div style={styles.loading}>Loading settings...</div>
          )}

          {/* Status Message */}
          {message && (
            <div style={{
              ...styles.message,
              backgroundColor: message.type === "success" ? "#d1fae5" : "#fee2e2",
              color: message.type === "success" ? "#065f46" : "#991b1b"
            }}>
              {message.text}
            </div>
          )}

          {/* nOffer String */}
          <div style={styles.field}>
            <label style={styles.label}>
              CLINK Offer String (noffer1...)
              <button
                style={styles.helpButton}
                onClick={() => setShowHelp(!showHelp)}
              >
                ?
              </button>
            </label>
            {showHelp && (
              <div style={styles.helpBox}>
                <p><strong>How to get your nOffer:</strong></p>
                <ul>
                  <li><strong>ShockWallet:</strong> Receive → CLINK Offer</li>
                  <li><strong>Lightning.Pub:</strong> Dashboard → Offers</li>
                  <li><strong>ZEUS:</strong> Settings → CLINK</li>
                </ul>
                <a href="https://clinkme.dev" target="_blank" rel="noopener noreferrer">
                  Learn more about CLINK
                </a>
              </div>
            )}
            <input
              type="text"
              style={styles.input}
              placeholder="noffer1qvqsyq..."
              value={settings.noffer}
              onChange={(e) => handleChange("noffer", e.target.value)}
            />
            <span style={styles.hint}>
              Get this from your Lightning wallet (ShockWallet, ZEUS, etc.)
            </span>
          </div>

          {/* Currency Source */}
          <div style={styles.field}>
            <label style={styles.label}>Currency Conversion Source</label>
            <select
              style={styles.select}
              value={settings.currencySource}
              onChange={(e) => handleChange("currencySource", e.target.value)}
            >
              <option value="coingecko">CoinGecko (Free, No API Key)</option>
              <option value="kraken">Kraken (More Accurate)</option>
              <option value="fixed">Fixed Rate (Manual)</option>
              <option value="manual">Manual (Enter Sats)</option>
            </select>
            <span style={styles.hint}>
              {settings.currencySource === "coingecko" && "Free, updates every 5 minutes"}
              {settings.currencySource === "kraken" && "More accurate, API key optional"}
              {settings.currencySource === "fixed" && "You set the BTC/fiat rate"}
              {settings.currencySource === "manual" && "Enter prices in satoshis directly"}
            </span>
          </div>

          {/* Fixed Rate (conditional) */}
          {settings.currencySource === "fixed" && (
            <div style={styles.field}>
              <label style={styles.label}>Fixed BTC Rate (USD per BTC)</label>
              <input
                type="number"
                style={styles.input}
                placeholder="65000"
                value={settings.fixedBtcRate || ""}
                onChange={(e) => handleChange("fixedBtcRate", parseFloat(e.target.value) || null)}
              />
              <span style={styles.hint}>
                Example: 65000 means 1 BTC = $65,000
              </span>
            </div>
          )}

          {/* Invoice Timeout */}
          <div style={styles.field}>
            <label style={styles.label}>Invoice Timeout (seconds)</label>
            <input
              type="number"
              style={styles.input}
              min={60}
              max={86400}
              value={settings.invoiceTimeout}
              onChange={(e) => handleChange("invoiceTimeout", parseInt(e.target.value) || 600)}
            />
            <span style={styles.hint}>
              How long before invoice expires (default: 600 = 10 minutes)
            </span>
          </div>

          {/* Subscriptions */}
          <div style={styles.field}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.enableSubscriptions}
                onChange={(e) => handleChange("enableSubscriptions", e.target.checked)}
              />
              Enable Auto-Renewal Subscriptions (nDebit)
            </label>
            <span style={styles.hint}>
              Allow customers to set up automatic recurring payments
            </span>
          </div>

          {/* Refund Contact */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Refund Contact (Optional)</h4>
            <p style={styles.sectionDescription}>
              How customers can reach you for Lightning refunds
            </p>

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                style={styles.input}
                placeholder="support@yourstore.com"
                value={settings.refundContactEmail}
                onChange={(e) => handleChange("refundContactEmail", e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Nostr Pubkey (npub1...)</label>
              <input
                type="text"
                style={styles.input}
                placeholder="npub1..."
                value={settings.refundContactNostr}
                onChange={(e) => handleChange("refundContactNostr", e.target.value)}
              />
            </div>
          </div>

          {/* Debug Mode */}
          <div style={styles.field}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={settings.debug}
                onChange={(e) => handleChange("debug", e.target.checked)}
              />
              Enable Debug Logging
            </label>
            <span style={styles.hint}>
              Log detailed information for troubleshooting
            </span>
          </div>

          {/* Save Button */}
          <div style={styles.actions}>
            <button
              style={{
                ...styles.saveButton,
                opacity: isSaving ? 0.7 : 1
              }}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </button>
          </div>

          {/* Info Box */}
          <div style={styles.infoBox}>
            <h4>Quick Start</h4>
            <ol>
              <li>Get your <code>noffer1...</code> from ShockWallet or ZEUS</li>
              <li>Paste it in the field above</li>
              <li>Click "Save Configuration"</li>
              <li>Enable in <strong>Settings → Regions</strong></li>
            </ol>
            <p>
              <a href="https://github.com/shocknet/medusa-bitcoin-lightning-payment-module-via-clink/wiki/Getting-Started" target="_blank" rel="noopener noreferrer">
                Read the full getting started guide →
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#fff",
    marginBottom: "16px"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #e5e7eb"
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  icon: {
    fontSize: "24px"
  },
  title: {
    margin: 0,
    fontSize: "16px",
    fontWeight: 600
  },
  badge: {
    backgroundColor: "#10b981",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: 500
  },
  expandButton: {
    background: "none",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    width: "28px",
    height: "28px",
    cursor: "pointer",
    fontSize: "18px"
  },
  content: {
    padding: "16px"
  },
  field: {
    marginBottom: "16px"
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: 500,
    fontSize: "14px"
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box"
  },
  select: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "#fff"
  },
  hint: {
    display: "block",
    marginTop: "4px",
    fontSize: "12px",
    color: "#6b7280"
  },
  helpButton: {
    marginLeft: "8px",
    padding: "0 6px",
    background: "#e5e7eb",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px"
  },
  helpBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "12px",
    marginBottom: "12px",
    fontSize: "13px"
  },
  section: {
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb"
  },
  sectionTitle: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: 600
  },
  sectionDescription: {
    margin: "0 0 12px 0",
    fontSize: "13px",
    color: "#6b7280"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px"
  },
  actions: {
    marginTop: "24px"
  },
  saveButton: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer"
  },
  infoBox: {
    marginTop: "24px",
    backgroundColor: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "16px",
    fontSize: "13px"
  },
  loading: {
    padding: "16px",
    textAlign: "center",
    color: "#6b7280"
  },
  message: {
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "14px"
  }
}

export default ClinkSettingsWidget
