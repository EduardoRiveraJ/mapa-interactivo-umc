# Performance & Responsive Design Improvements

## Critical Issues Found

### 1. **Mobile Responsiveness Issues**

#### Problem: Fixed Panel Width
- Current: `width: 340px` (hardcoded)
- Mobile devices: Panel may exceed viewport or overlap controls
- **Impact**: Unusable on phones < 360px width

**Fix:**
```css
#info-panel {
  width: 340px;
  max-width: 85vw; /* Don't exceed 85% of viewport */
}

@media (max-width: 480px) {
  #info-panel {
    width: 100%;
    max-width: 100%;
  }
}
```

#### Problem: SVG Text Unreadable on Mobile
- Current: Font sizes hardcoded to `font-size="8"` in SVG
- Mobile zoom doesn't scale SVG text proportionally
- **Impact**: Text overlaps at all zoom levels on mobile

**Fix in index.html:**
```html
<svg id="campus" viewBox="0 0 960 1060" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
```

Add CSS:
```css
@media (max-width: 768px) {
  svg#campus text {
    font-size: 12px !important; /* Enlarge from 8px */
  }
  .zone-label {
    font-size: 10px !important;
  }
}
```

#### Problem: Filter Buttons Stack Poorly
- Current: Uses `flex-wrap: wrap` but buttons have fixed padding
- Mobile: Creates 4+ row overflow issues
- **Impact**: Filters take 50% of screen height

**Fix:**
```css
@media (max-width: 640px) {
  #filters {
    padding: 8px 12px;
    gap: 6px;
  }
  .filter-btn {
    padding: 6px 10px;
    font-size: 0.7rem;
  }
  .filter-btn .dot {
    width: 8px;
    height: 8px;
  }
}
```

#### Problem: Zoom Controls Overlap
- Current: Absolute positioning without mobile awareness
- Mobile: Overlaps map legend and controls
- **Impact**: Controls inaccessible on small screens

**Fix:**
```css
@media (max-width: 768px) {
  .zoom-controls {
    bottom: 12px;
    left: 12px;
    flex-direction: row;
    gap: 4px;
  }
  .zoom-btn {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
}
```

---

### 2. **JavaScript Performance Issues**

#### Problem: Inefficient Event Handling
- Current: 70+ zones each have individual event listeners
- **Impact**: Slower initialization, higher memory usage

**Fix:**
```javascript
// OLD (script.js lines 228-248):
allZones.forEach(zone => {
  zone.addEventListener('click', (e) => { ... });
});

// NEW - Use Event Delegation:
svg.addEventListener('click', (e) => {
  if (e.target.closest('.zone')) {
    const zone = e.target.closest('.zone');
    handleZoneClick(zone);
  }
});
```

#### Problem: Linear Search on Every Keystroke
- Current: Searches all 70+ zones for every character typed
- No debouncing
- **Impact**: CPU spike while typing

**Fix:**
```javascript
// Add debounce wrapper
function debounce(func, delay) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

const debouncedSearch = debounce(performSearch, 200);
searchInput.addEventListener('input', debouncedSearch);
```

#### Problem: Missing Performance Optimization
- Current: No GPU acceleration hints
- SVG transforms trigger layout recalculations
- **Impact**: Jank during pan/zoom on mobile

**Fix:**
```css
svg#campus {
  will-change: transform;
  transform-origin: center center;
  contain: layout style paint;
}
```

---

### 3. **Mobile Touch Handling Issues**

#### Problem: Touch Gestures Conflict with Scroll
- Current: `passive: true` events prevent scroll optimization
- Mobile: Difficult to scroll map on narrow viewports
- **Impact**: Poor UX on phones

**Fix:**
```javascript
// Detect if touch is scroll vs pan
let touchStartY = 0;

mapSvgWrap.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0].clientY;
  }
}, { passive: true });

mapSvgWrap.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1) {
    const delta = Math.abs(e.touches[0].clientY - touchStartY);
    // Only pan if intentional (delta > 10px)
    if (delta > 10) {
      isTouching = true;
    }
  }
}, { passive: true });
```

---

### 4. **Asset & Code Loading Issues**

#### Problem: Large Embedded Base64 Logo
- Current: Logo embedded as base64 in HTML (3-5KB)
- **Impact**: Delays HTML parsing, increases initial load

**Recommendation:**
```html
<!-- Change from inline base64 to external file -->
<img id="umc-logo" src="logo.png" alt="UMC Logo">
```

#### Problem: Inline Critical Styles Missing
- Current: All CSS loaded without priority marking
- **Impact**: Slower First Contentful Paint (FCP)

**Recommendation:**
```html
<style>
  /* Critical path styles only */
  body { font-family: 'Outfit', system-ui; }
  header { background: linear-gradient(...); }
</style>
<link rel="stylesheet" href="style.css">
```

---

## Recommended Action Items (Priority Order)

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 **P0** | SVG text unreadable on mobile | 15 min | High - UX breaking |
| 🔴 **P0** | Panel width causes overflow | 10 min | High - Layout broken |
| 🟠 **P1** | Event delegation (70+ listeners) | 30 min | Medium - Performance |
| 🟠 **P1** | Search debouncing | 10 min | Medium - Responsiveness |
| 🟡 **P2** | Filter button mobile sizing | 15 min | Medium - Usability |
| 🟡 **P2** | GPU acceleration hints | 5 min | Low - Edge cases |
| ⚪ **P3** | Base64 logo extraction | 20 min | Low - Parsing |

---

## Testing Checklist for Mobile

- [ ] Test on 320px (iPhone SE), 375px (iPhone), 414px (large phone)
- [ ] Verify SVG text readable without zooming
- [ ] Check filter buttons don't wrap > 2 rows
- [ ] Confirm zoom controls don't overlap legend
- [ ] Test touch pan/pinch zoom without accidental scrolls
- [ ] Verify search doesn't cause scroll jank
- [ ] Check dark mode toggle works on mobile
- [ ] Test orientation change (portrait ↔ landscape)
