# Mobile Integration Quick Start

**Time to implement**: 5 minutes
**Files to modify**: 2 files

---

## Step 1: Import Mobile Styles

**File**: `src/index.tsx`

```typescript
// Add these imports at the top
import './styles/responsive.css';
import './styles/mobile.css';
```

**Full example**:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/responsive.css'; // ← Add this
import './styles/mobile.css';      // ← Add this
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Step 2: Enable Mobile Behaviors (Optional)

**File**: `src/index.tsx`

```typescript
import { preventMobileBehaviors } from './utils/mobileOptimizations';

// Before rendering
preventMobileBehaviors();

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**What this does**:
- Prevents pinch-to-zoom on iOS
- Prevents double-tap zoom
- No extra configuration needed

---

## Step 3: Add Haptic Feedback (Optional)

**File**: Any component where you want haptic feedback

```typescript
import { HapticFeedback } from '../utils/mobileOptimizations';

function CardDisplay({ card, onClick }) {
  const handleClick = () => {
    HapticFeedback.cardSelect(); // ← Add this
    onClick(card);
  };

  return <div onClick={handleClick}>{/* ... */}</div>;
}
```

**Haptic patterns available**:
```typescript
HapticFeedback.light()       // Subtle feedback
HapticFeedback.medium()      // Medium strength
HapticFeedback.heavy()       // Strong feedback
HapticFeedback.cardSelect()  // Double tap pattern
HapticFeedback.attack()      // Multiple pulses
HapticFeedback.victory()     // Celebration pattern
HapticFeedback.error()       // Error notification
```

---

## Step 4: Use Mobile Detection (Optional)

**File**: Any component needing responsive behavior

```typescript
import { useMobileDetect } from '../hooks/useMobileDetect';

function BattleView() {
  const { isMobile, isTablet, isTouchDevice } = useMobileDetect();

  return (
    <div>
      {isMobile ? (
        <CompactLayout />
      ) : (
        <FullLayout />
      )}
    </div>
  );
}
```

**Simple version** (just check if mobile):
```typescript
import { useIsMobile } from '../hooks/useMobileDetect';

function MyComponent() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'mobile-view' : 'desktop-view'}>
      {/* ... */}
    </div>
  );
}
```

---

## That's It! 🎉

**What you get automatically**:
- ✅ Touch-optimized interface (44px+ tap targets)
- ✅ Smooth horizontal scrolling for hand
- ✅ Responsive typography (scales with screen)
- ✅ iPhone notch support (safe areas)
- ✅ No bounce scroll on iOS
- ✅ No accidental zoom
- ✅ Landscape mode optimization
- ✅ PWA support (add to home screen)

**Test it**:
1. Run `npm start`
2. Open on mobile device
3. Try adding to home screen
4. Test touch interactions

---

## Advanced Usage (Optional)

### Fullscreen Mode

```typescript
import { requestFullscreen, exitFullscreen } from '../utils/mobileOptimizations';

function BattleView() {
  const startBattle = async () => {
    await requestFullscreen(); // Enter fullscreen
    // Start battle...
  };

  const endBattle = () => {
    exitFullscreen(); // Exit fullscreen
    // End battle...
  };
}
```

### Orientation Lock

```typescript
import { lockOrientation, unlockOrientation } from '../utils/mobileOptimizations';

function DeckSelection() {
  useEffect(() => {
    lockOrientation('portrait-primary'); // Force portrait

    return () => {
      unlockOrientation(); // Unlock on unmount
    };
  }, []);
}
```

### Lazy Load Images

```typescript
import { lazyLoadImages } from '../utils/mobileOptimizations';

function NFTGallery() {
  useEffect(() => {
    lazyLoadImages(); // Auto-detects images with data-src
  }, []);

  return (
    <div>
      {/* Use data-src instead of src */}
      <img data-src="nft-image.jpg" alt="NFT" />
    </div>
  );
}
```

### Network-Aware Loading

```typescript
import { getNetworkSpeed } from '../utils/mobileOptimizations';

function NFTGallery() {
  const loadImages = () => {
    const speed = getNetworkSpeed();

    if (speed === 'slow') {
      // Load thumbnail images
      return nfts.map(nft => nft.thumbnailUrl);
    } else {
      // Load full-res images
      return nfts.map(nft => nft.imageUrl);
    }
  };
}
```

---

## PWA Installation

### For Users

**iOS**:
1. Safari → Share button
2. "Add to Home Screen"
3. Tap "Add"

**Android**:
1. Chrome → Menu (⋮)
2. "Add to Home Screen"
3. Confirm

### What They Get

- Full-screen app (no browser UI)
- App icon on home screen
- Faster load times
- Offline support (when service worker added)

---

## Troubleshooting

### Styles not applying?

Make sure you imported both CSS files:
```typescript
import './styles/responsive.css';
import './styles/mobile.css';
```

### Haptic feedback not working?

Only works on devices with vibration motor. Check in browser console:
```javascript
'vibrate' in navigator // Should return true on supported devices
```

### PWA not installing?

1. Check `manifest.json` is accessible at `/manifest.json`
2. Verify HTTPS (required for PWA)
3. Check browser console for manifest errors
4. iOS requires icons (add `apple-touch-icon.png`)

---

## Next Steps

1. **Test on real devices** (iPhone, Android)
2. **Add app icons** (see MOBILE_OPTIMIZATIONS.md for icon sizes)
3. **Add service worker** for offline support
4. **Test PWA installation**
5. **Run Lighthouse audit** (should score 90+ on mobile)

---

## Minimal Implementation (Just 2 Lines!)

If you only want the core mobile optimizations:

```typescript
// src/index.tsx
import './styles/mobile.css'; // ← Just add this one line
```

That's it! You get:
- Touch-optimized UI
- Responsive layout
- iPhone notch support
- No bounce scroll
- Haptic feedback utilities available (but not auto-enabled)

---

🦋 **Your app is now mobile-optimized!**

Read `MOBILE_OPTIMIZATIONS.md` for complete documentation.
