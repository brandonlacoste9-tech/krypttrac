# Sentinel AI Dashboard - Luxury V2 🛡️

## Overview

The Sentinel AI Dashboard is a luxury, leather-bound aesthetic dashboard interface for Krypto Trac's Fort Knox security system. It features:

- **Leather Texture Background** - Rich, premium feel
- **Gold Foil Accents** - Luxurious gold (#f4c025) highlights
- **Terminal-Style Interface** - Real-time Sentinel analysis logs
- **Embossed Text Effects** - Debossed and gold foil press effects
- **Bottom Navigation** - Floating dock with center AI button

---

## Component: `SentinelDashboard`

**Location:** `components/SentinelDashboard.tsx`

### Features

1. **Total Net Worth Card**
   - Displays total portfolio value
   - 24h change percentage
   - Gold foil styling
   - Deposit/Swap/Send action buttons

2. **Live Sentinel Analysis Terminal**
   - Real-time security scan logs
   - System version indicator
   - Animated pulse indicator
   - Fading scroll effect

3. **Quick Stats Grid**
   - Daily Yield display
   - Risk Level indicator
   - Progress bars with gold glow

4. **Emergency Section**
   - Panic liquidate button
   - Warning styling
   - Caution stripes

5. **Bottom Navigation Dock**
   - Floating navigation bar
   - Center AI button (gold gradient)
   - Leather stitching effect

---

## Usage

### Basic Usage

```tsx
import { SentinelDashboard } from '@/components/SentinelDashboard'

export default function SentinelPage() {
  return <SentinelDashboard />
}
```

### With Props

```tsx
<SentinelDashboard
  totalAssets={1500000.00}
  dailyYield={2500.50}
  riskLevel="low"
/>
```

### Props Interface

```typescript
interface SentinelDashboardProps {
  totalAssets?: number        // Default: 1245390.00
  dailyYield?: number         // Default: 1294.20
  riskLevel?: 'low' | 'medium' | 'high'  // Default: 'low'
  className?: string          // Additional CSS classes
}
```

---

## Route

**Page Route:** `/sentinel`

**File:** `app/sentinel/page.tsx`

Access the Sentinel Dashboard at: `http://localhost:3000/sentinel`

---

## Design System

### Colors

- **Leather Dark:** `#1a1814` - Base background
- **Leather Surface:** `#24201b` - Card surfaces
- **Gold Foil:** `#f4c025` - Primary gold
- **Gold Dim:** `#a88b3d` - Secondary gold
- **Text Accent:** `#8c7e63` - Muted text

### Typography

- **Display Font:** Manrope (via inline styles)
- **Monospace:** For terminal logs
- **Uppercase Tracking:** `0.15em` - 0.2em for labels

### Effects

- **Gold Foil Press:** Embossed text effect with shadow
- **Debossed Text:** Inset shadow effect
- **Leather Texture:** Background image overlay
- **Embossed Borders:** Inset shadows on buttons
- **Gold Glow:** Shadow with gold color

---

## Integration with Krypto Trac

### Subscription Store

The component uses `useSubscriptionStore` to check for DeFi subscription:

```tsx
const hasDeFi = useSubscriptionStore((state) => state.hasDeFi())
```

### Real Data Integration

To integrate with real portfolio data:

```tsx
import { useAppStore } from '@/lib/store'

const { portfolio } = useAppStore()

<SentinelDashboard
  totalAssets={portfolio.value}
  dailyYield={portfolio.dailyYield}
  riskLevel={portfolio.riskLevel}
/>
```

---

## Customization

### Update Sentinel Logs

Modify the `sentinelLogs` state to show real-time security scans:

```tsx
const [sentinelLogs, setSentinelLogs] = useState([
  { 
    time: '10:42:05', 
    type: 'scanning', 
    message: 'SCANNING NETWORK...', 
    detail: 'Analyzing 4,203 nodes for arbitrage opportunities.', 
    color: 'primary' 
  },
  // Add more logs...
])
```

### Connect to Security Scanner

Integrate with the Vertex AI Guardian:

```tsx
import { scanTransaction } from '@/lib/security/guardian'

useEffect(() => {
  // Poll for security scans
  const interval = setInterval(async () => {
    const result = await scanTransaction(transactionMetadata)
    // Update logs with scan results
  }, 5000)
  return () => clearInterval(interval)
}, [])
```

---

## Styling Notes

### CSS Classes Added to globals.css

- `.text-gold-foil` - Gold gradient text
- `.leather-texture` - Leather background texture
- `.stitch-border` - Dashed border for stitching effect
- `.debossed-text` - Inset shadow text
- `.gold-foil-press` - Embossed gold text

### Inline Styles

Some effects use inline styles for gold foil gradients and text shadows that are difficult to achieve with Tailwind utilities alone.

---

## Future Enhancements

1. **Real-Time Data Integration**
   - Connect to portfolio API
   - Live security scan updates
   - Real-time price feeds

2. **Interactive Elements**
   - Clickable action buttons
   - Expandable log details
   - Emergency button functionality

3. **Animation Enhancements**
   - Smooth transitions
   - Loading states
   - Typing effect for logs

4. **Responsive Design**
   - Mobile optimizations
   - Tablet layouts
   - Desktop enhancements

---

## Status

✅ **Component Created** - `components/SentinelDashboard.tsx`
✅ **Route Created** - `app/sentinel/page.tsx`
✅ **CSS Styles Added** - `app/globals.css`
✅ **Documentation** - This file

**Ready for integration and customization!** 🚀
