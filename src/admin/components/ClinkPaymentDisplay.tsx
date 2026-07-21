/**
 * CLINK Storefront Components
 * 
 * React components for displaying Lightning invoices
 * with QR codes and copy functionality.
 */

import React, { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"

// Types
interface ClinkPaymentDisplayProps {
  /** BOLT11 invoice string */
  bolt11: string
  /** Amount in satoshis */
  amountSats: number
  /** Fiat amount */
  fiatAmount?: number
  /** Fiat currency code */
  currencyCode?: string
  /** Exchange rate used */
  exchangeRate?: number
  /** Invoice expiry timestamp (Unix seconds) */
  expiresAt: number
  /** Payment confirmed callback */
  onPaymentConfirmed?: () => void
  /** Custom styles */
  className?: string
}

// ============================================================================
// Copy to Clipboard Hook
// ============================================================================
// QR Code Component
// ============================================================================

interface QRCodeProps {
  /** Data to encode in QR code */
  data: string
  /** QR code size in pixels */
  size?: number
  /** Error correction level */
  errorLevel?: "L" | "M" | "Q" | "H"
}

export function QRCode({ data, size = 200, errorLevel = "M" }: QRCodeProps) {
  return (
    <QRCodeSVG
      value={data}
      size={size}
      level={errorLevel}
      bgColor="#ffffff"
      fgColor="#000000"
      style={{ maxWidth: "100%", height: "auto" }}
    />
  )
}

// ============================================================================
// Copy to Clipboard Hook
// ============================================================================

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false)
  
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
      return true
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), timeout)
      return true
    }
  }, [timeout])
  
  return { copied, copy }
}

// ============================================================================
// Countdown Timer Hook
// ============================================================================

function useCountdown(expiresAt: number) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, expiresAt - Math.floor(Date.now() / 1000)))
  
  useEffect(() => {
    if (timeLeft <= 0) return
    
    const timer = setInterval(() => {
      const newTimeLeft = Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
      setTimeLeft(newTimeLeft)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [expiresAt, timeLeft])
  
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isExpired = timeLeft <= 0
  const percentage = timeLeft / (10 * 60) // Assuming 10 min default
  
  return { minutes, seconds, isExpired, timeLeft, percentage }
}

// ============================================================================
// Main Payment Display Component
// ============================================================================

/**
 * ClinkPaymentDisplay
 * 
 * Displays a Lightning invoice with QR code and copy functionality.
 * Used at checkout to show customers how to pay.
 */
export function ClinkPaymentDisplay({
  bolt11,
  amountSats,
  fiatAmount,
  currencyCode = "USD",
  exchangeRate,
  expiresAt,
  onPaymentConfirmed,
  className = ""
}: ClinkPaymentDisplayProps) {
  const { copied, copy } = useClipboard()
  const { minutes, seconds, isExpired, percentage } = useCountdown(expiresAt)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending")
  
  // Format satoshis with locale
  const formattedSats = amountSats.toLocaleString()
  
  // Format fiat amount
  const formattedFiat = fiatAmount
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode
      }).format(fiatAmount)
    : null
  
  // Handle payment confirmation
  const handleCopy = () => {
    copy(bolt11)
  }
  
  // Auto-expire effect
  useEffect(() => {
    if (isExpired && paymentStatus === "pending") {
      setPaymentStatus("expired")
    }
  }, [isExpired, paymentStatus])
  
  return (
    <div className={`clink-payment ${className}`} style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.icon}>⚡</span>
        <span style={styles.title}>Pay with Lightning</span>
      </div>
      
      {/* Amount Display */}
      <div style={styles.amountSection}>
        <div style={styles.satsAmount}>{formattedSats} sats</div>
        {formattedFiat && (
          <div style={styles.fiatAmount}>≈ {formattedFiat}</div>
        )}
        {exchangeRate && (
          <div style={styles.exchangeRate}>
            Rate: 1 BTC = {new Intl.NumberFormat("en-US").format(exchangeRate)} {currencyCode}
          </div>
        )}
      </div>
      
      {/* QR Code */}
      <div style={styles.qrSection}>
        <QRCode data={bolt11} size={200} />
      </div>
      
      {/* Invoice String */}
      <div style={styles.invoiceSection}>
        <label style={styles.invoiceLabel}>Lightning Invoice</label>
        <div style={styles.invoiceBox}>
          <code style={styles.invoiceCode}>
            {bolt11.slice(0, 40)}...{bolt11.slice(-20)}
          </code>
          <button
            style={{
              ...styles.copyButton,
              backgroundColor: copied ? "#10b981" : "#2563eb"
            }}
            onClick={handleCopy}
            disabled={isExpired}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
        </div>
      </div>
      
      {/* Timer */}
      <div style={styles.timerSection}>
        <div style={styles.timerBar}>
          <div
            style={{
              ...styles.timerProgress,
              width: `${Math.max(0, percentage) * 100}%`,
              backgroundColor: percentage > 0.3 ? "#10b981" : percentage > 0.1 ? "#f59e0b" : "#ef4444"
            }}
          />
        </div>
        <div style={styles.timerText}>
          {isExpired ? (
            <span style={{ color: "#ef4444" }}>Invoice expired</span>
          ) : (
            <>
              Expires in: {minutes}:{seconds.toString().padStart(2, "0")}
            </>
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div style={styles.instructions}>
        <h4 style={styles.instructionsTitle}>How to pay:</h4>
        <ol style={styles.instructionsList}>
          <li>Open your Lightning wallet</li>
          <li>Scan the QR code or paste the invoice</li>
          <li>Confirm payment</li>
        </ol>
      </div>
      
      {/* Compatible Wallets */}
      <div style={styles.wallets}>
        <span style={styles.walletsLabel}>Compatible wallets:</span>
        <span style={styles.walletsList}>
          ShockWallet, ZEUS, Amethyst, Electrum
        </span>
      </div>
      
      {/* Status Messages */}
      {paymentStatus === "paid" && (
        <div style={styles.successMessage}>
          ✓ Payment received! Completing your order...
        </div>
      )}
      
      {paymentStatus === "expired" && (
        <div style={styles.errorMessage}>
          Invoice has expired. Please try again.
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Compact Payment Display (for order summary)
// ============================================================================

interface ClinkPaymentCompactProps {
  amountSats: number
  bolt11: string
  status: "pending" | "paid" | "expired"
}

export function ClinkPaymentCompact({ amountSats, bolt11, status }: ClinkPaymentCompactProps) {
  const { copied, copy } = useClipboard()
  
  return (
    <div style={styles.compactContainer}>
      <div style={styles.compactLeft}>
        <span style={styles.compactIcon}>⚡</span>
        <div>
          <div style={styles.compactAmount}>{amountSats.toLocaleString()} sats</div>
          <div style={styles.compactStatus}>
            {status === "pending" && "Awaiting payment"}
            {status === "paid" && "✓ Paid"}
            {status === "expired" && "✗ Expired"}
          </div>
        </div>
      </div>
      {status === "pending" && (
        <button
          style={styles.compactCopyButton}
          onClick={() => copy(bolt11)}
        >
          {copied ? "✓" : "Copy"}
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Payment Status Checker Hook
// ============================================================================

interface UsePaymentStatusProps {
  paymentId: string
  pollInterval?: number
  onPaid?: () => void
  onExpired?: () => void
}

export function usePaymentStatus({ 
  paymentId, 
  pollInterval = 3000, 
  onPaid, 
  onExpired 
}: UsePaymentStatusProps) {
  const [status, setStatus] = useState<"pending" | "paid" | "expired" | "error">("pending")
  const [isPolling, setIsPolling] = useState(true)

  useEffect(() => {
    if (!isPolling || !paymentId) return

    const poll = async () => {
      try {
        const response = await fetch(`/clink/status/${paymentId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.status === "paid") {
            setStatus("paid")
            setIsPolling(false)
            onPaid?.()
          } else if (data.status === "expired") {
            setStatus("expired")
            setIsPolling(false)
            onExpired?.()
          }
        }
      } catch (error) {
        console.error("Error polling payment status:", error)
      }
    }

    poll()
    const interval = setInterval(poll, pollInterval)

    return () => clearInterval(interval)
  }, [paymentId, pollInterval, isPolling, onPaid, onExpired])

  return { status, stopPolling: () => setIsPolling(false) }
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  // Main container
  container: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    backgroundColor: "#fff",
    padding: "24px",
    maxWidth: "400px",
    margin: "0 auto"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "20px"
  },
  icon: {
    fontSize: "28px"
  },
  title: {
    fontSize: "20px",
    fontWeight: 600,
    margin: 0
  },
  
  // Amount
  amountSection: {
    textAlign: "center",
    marginBottom: "24px"
  },
  satsAmount: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#111827"
  },
  fiatAmount: {
    fontSize: "18px",
    color: "#6b7280",
    marginTop: "4px"
  },
  exchangeRate: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "4px"
  },
  
  // QR Code
  qrSection: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "24px"
  },
  
  // Invoice
  invoiceSection: {
    marginBottom: "16px"
  },
  invoiceLabel: {
    display: "block",
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "8px"
  },
  invoiceBox: {
    display: "flex",
    gap: "8px"
  },
  invoiceCode: {
    flex: 1,
    fontSize: "12px",
    padding: "8px 12px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  copyButton: {
    padding: "8px 16px",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s"
  },
  
  // Timer
  timerSection: {
    marginBottom: "20px"
  },
  timerBar: {
    height: "4px",
    backgroundColor: "#e5e7eb",
    borderRadius: "2px",
    overflow: "hidden"
  },
  timerProgress: {
    height: "100%",
    transition: "width 1s linear, background-color 0.3s"
  },
  timerText: {
    textAlign: "center",
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "8px"
  },
  
  // Instructions
  instructions: {
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px"
  },
  instructionsTitle: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: 600
  },
  instructionsList: {
    margin: 0,
    paddingLeft: "20px",
    fontSize: "13px",
    color: "#4b5563"
  },
  
  // Wallets
  wallets: {
    textAlign: "center",
    fontSize: "12px",
    color: "#6b7280"
  },
  walletsLabel: {
    marginRight: "4px"
  },
  walletsList: {
    fontWeight: 500
  },
  
  // Status messages
  successMessage: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#d1fae5",
    color: "#065f46",
    borderRadius: "6px",
    textAlign: "center",
    fontWeight: 500
  },
  errorMessage: {
    marginTop: "16px",
    padding: "12px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    borderRadius: "6px",
    textAlign: "center",
    fontWeight: 500
  },
  
  // Compact view
  compactContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px"
  },
  compactLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  compactIcon: {
    fontSize: "24px"
  },
  compactAmount: {
    fontWeight: 600,
    fontSize: "16px"
  },
  compactStatus: {
    fontSize: "12px",
    color: "#6b7280"
  },
  compactCopyButton: {
    padding: "6px 12px",
    backgroundColor: "#e5e7eb",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer"
  }
}

export default ClinkPaymentDisplay
