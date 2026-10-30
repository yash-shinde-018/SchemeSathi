# SchemeSathi Navigation Redesign - Visual Testing Guide

## Quick Start

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Open Browser:**
   - Navigate to `http://localhost:5173`

3. **Test Mobile View:**
   - Open Chrome DevTools: `F12`
   - Click "Toggle device toolbar" (Ctrl+Shift+M)
   - Select iPhone 12 (390px) or Samsung Galaxy S20 (360px)

---

## Desktop Navigation (1024px+)

### Visual Checklist
- [ ] Clean horizontal navbar at top
- [ ] SchemeSathi logo/brand visible
- [ ] 3 navigation items: Explore, How It Works, About
- [ ] Language selector visible
- [ ] "Find Schemes" button on right side
- [ ] No vertical scrollbar issues
- [ ] No horizontal overflow

### Interaction Checklist
- [ ] Hover over nav items: Underline appears with gradient
- [ ] Hover over "Find Schemes" button: Scale increases, glow appears
- [ ] Click nav items: Smooth scroll to corresponding sections
- [ ] Click "Find Schemes": Scrolls to categories section
- [ ] Tab through items: All focusable, outline visible
- [ ] Keyboard: Enter activates links

### Expected Styling
```
Background: Slightly transparent (glass effect from header)
Text Color: #172033 (dark text)
Primary Color: #4338CA (indigo underline on hover)
Button: Indigo gradient with smooth shadow
```

---

## Mobile Navigation (360px - 768px)

### Visual Checklist - Floating Nav Bar
- [ ] Navigation appears at **bottom** of screen
- [ ] **Not hidden** by content (page has bottom padding)
- [ ] Curved/notched design visible around center button
- [ ] White glass surface with subtle border
- [ ] Soft shadow above navigation
- [ ] 4 navigation items: Explore, Categories, Saved, Profile
- [ ] Circular floating button above center of nav
- [ ] "Find" label visible on FAB button
- [ ] Icon visible on FAB (magnifying glass)

### Visual Checklist - Individual Items
- [ ] **Explore item (first):** 🔍 icon + "Explore" label
- [ ] **Categories item:** 📂 icon + "Categories" label
- [ ] **Saved item:** ❤️ icon + "Saved" label
- [ ] **Profile item (last):** 👤 icon + "Profile" label
- [ ] All icons are ~24px size
- [ ] Labels are uppercase and small
- [ ] Icons/labels are centered in each item
- [ ] Each item has ~56px+ touch target area

### Visual Checklist - FAB Button
- [ ] **Position:** Centered, floating above nav bar
- [ ] **Color:** Indigo gradient (looks premium)
- [ ] **Size:** ~60px diameter circle
- [ ] **Icon:** Magnifying glass (search icon)
- [ ] **Label:** "Find" text below icon
- [ ] **Shadow:** Visible soft shadow beneath FAB
- [ ] **Glow:** Subtle indigo glow around button

### Interaction Checklist - Mobile Navigation

#### Navigation Items
- [ ] Click "Explore": Scrolls to categories section
- [ ] Click "Categories": Scrolls to categories section
- [ ] Click "Saved": No scroll (placeholder link)
- [ ] Click "Profile": No scroll (placeholder link)
- [ ] Smooth scroll animation (no jumpy behavior)
- [ ] Active item color changes to indigo
- [ ] Active item rises slightly above navigation
- [ ] Active item has soft glow/background
- [ ] Active item's label becomes bold/brighter
- [ ] Smooth 250ms transition between items

#### FAB Button (Find Schemes)
- [ ] Click FAB: Scrolls to categories section
- [ ] Hover/tap FAB: Scales up slightly (1.08x)
- [ ] After tap: Button pulses (quick animation)
- [ ] Breathing animation: Subtle up/down floating (continuous)
- [ ] Breathing is very subtle (not distracting)
- [ ] FAB always visible (never hidden behind content)
- [ ] FAB responds immediately to taps

#### Content & Layout
- [ ] No content hidden behind navigation bar
- [ ] Main content has proper bottom padding
- [ ] Scroll content smoothly (no stuttering)
- [ ] Sections scroll past without nav appearing
- [ ] Last section's content fully visible above nav
- [ ] Footer visible and clickable
- [ ] No horizontal scrollbars at any width

---

## Specific Viewport Tests

### iPhone 12 (390px)
```
DevTools > Device Toolbar > iPhone 12

Expected:
- Navigation at bottom, fully visible
- All 4 items visible, no overflow
- FAB centered above nav
- Content scrollable above nav
- No horizontal scroll
```

### iPhone SE (360px)
```
DevTools > Device Toolbar > iPhone SE

Expected:
- Same as iPhone 12, but tighter spacing
- All items still visible
- FAB still properly positioned
- No layout breakage
```

### Samsung Galaxy S20 (360px)
```
DevTools > Device Toolbar > Samsung Galaxy S20

Expected:
- Same as iPhone SE
- Touch targets still 44px+
- All interactions work smoothly
```

### iPad (768px)
```
DevTools > Device Toolbar > iPad

Expected:
- Floating navigation still visible
- Larger spacing between items
- FAB proportionally sized
- Content has appropriate padding
```

### iPad Pro (1024px)
```
DevTools > Responsive > 1024x768

Expected:
- **Switches to desktop navbar**
- Floating nav disappears
- Horizontal navbar appears at top
- No transition issues
- All desktop nav items visible
```

---

## Keyboard Navigation Testing

### Tab Navigation (All Devices)
1. Press `Tab` repeatedly
2. **Expected:** Focus moves through:
   - Nav items (mobile) or Desktop items
   - FAB button
   - Content links below
3. **Check:** Outline always visible (blue or indigo), 3px
4. **Check:** Focus order is logical (left-to-right, top-to-bottom)

### Arrow Keys (Mobile Only)
1. Focus a nav item (Tab to it)
2. Press Arrow Right → moves to next item
3. Press Arrow Left → moves to previous item
4. **Expected:** Smooth focus transition, visual indication
5. **Check:** Wraps around (last → first, first → last)

### Enter Key
1. Focus a nav item with Tab
2. Press Enter
3. **Expected:** Scrolls to that section (same as click)
4. **Check:** Scroll is smooth, no jumpy behavior

### Escape Key
1. Focus any element
2. Press Escape
3. **Expected:** No menu closes (mobile has no menu now)
4. **Check:** Nothing breaks, focus stays in place

---

## Accessibility Testing

### Screen Reader (NVDA, JAWS, or VoiceOver)
1. **Enable screen reader:**
   - Windows: NVDA (free, www.nvaccess.org)
   - Mac: VoiceOver (Cmd+F5)
   - iOS: Settings > Accessibility > VoiceOver

2. **Test Navigation Announcement:**
   - [ ] "Main navigation" announced
   - [ ] "Explore, button" announced (or similar)
   - [ ] "Categories, button" announced
   - [ ] "Saved, button" announced
   - [ ] "Profile, button" announced
   - [ ] "Find government schemes, button" announced for FAB
   - [ ] Active item: "Explore, button, current page" (or similar)

3. **Test Keyboard Navigation:**
   - [ ] Tab announces each item as it's focused
   - [ ] Arrow keys announce navigation between items
   - [ ] Enter key announces navigation event

### High Contrast Mode (Windows)
1. **Enable:** Windows Settings > Ease of Access > High Contrast
2. **Expected:**
   - [ ] Navigation still visible
   - [ ] Borders/outlines appear
   - [ ] Active item clearly distinguished
   - [ ] No text unreadable
   - [ ] FAB still prominent

### Prefers Reduced Motion
1. **Enable:** Chrome DevTools > Rendering > Emulate CSS media feature prefers-reduced-motion: reduce
2. **Expected:**
   - [ ] FAB breathing animation **stops** (disabled)
   - [ ] Active item glow animation **stops** (disabled)
   - [ ] Transitions still smooth (but no spring effect)
   - [ ] No janky behavior
   - [ ] Navigation still functional

---

## Performance Testing

### Chrome DevTools - Performance Tab
1. Open DevTools (F12)
2. Go to **Performance** tab
3. Click **Record**
4. Interact with navigation for 5 seconds:
   - Click nav items
   - Scroll page
   - Tap FAB button
5. Click **Stop**

**Expected Results:**
- [ ] Frame rate: 60 FPS (mostly)
- [ ] No red indicators in timeline
- [ ] No long tasks > 50ms
- [ ] Smooth interactions

### Chrome DevTools - Lighthouse
1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Click **Analyze page load**
4. Wait for report

**Expected Results:**
- [ ] Performance: > 80
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] No critical issues

---

## Color & Contrast Testing

### Color Accuracy
- [ ] Primary navigation items: `#172033` (dark text)
- [ ] Active item: `#4338CA` (indigo)
- [ ] FAB background: Indigo gradient
- [ ] FAB text: White
- [ ] Navigation background: `rgba(255,255,255,0.82)` (slightly transparent white)
- [ ] Icons: Scale appropriately

### Contrast Ratio
Use WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/):
- [ ] Dark text on white background: ≥ 4.5:1
- [ ] White text on indigo background: ≥ 4.5:1
- [ ] Indigo text on white background: ≥ 4.5:1

---

## Responsive Behavior Testing

### No Horizontal Scrollbar
Test at these widths:
- [ ] 360px: No horizontal scroll
- [ ] 390px: No horizontal scroll
- [ ] 414px: No horizontal scroll
- [ ] 480px: No horizontal scroll
- [ ] 768px: No horizontal scroll
- [ ] 1024px: Switches to desktop ✓

### Safe Area Support (iPhone Notch)
1. DevTools > Device Toolbar > iPhone 12 (has notch)
2. **Expected:**
   - [ ] Navigation respects bottom safe area
   - [ ] Content doesn't go behind notch
   - [ ] FAB properly positioned
   - [ ] Bottom padding accounts for notch height

---

## Animation Smoothness

### FAB Breathing Animation
1. Look at FAB button continuously for 3 seconds
2. **Expected:**
   - [ ] Very subtle floating (up 2px, down 2px)
   - [ ] Not distracting
   - [ ] Smooth and continuous
   - [ ] ~3 second cycle

### Active Item Glow
1. Click a navigation item
2. **Expected:**
   - [ ] Item rises slightly
   - [ ] Color fades in (indigo tint)
   - [ ] Background glow appears and fades
   - [ ] All smooth transitions
   - [ ] ~250ms duration

### Hover Scale on FAB
1. Move mouse to FAB (desktop) or touch area (mobile)
2. **Expected:**
   - [ ] Button scales to 1.08x size
   - [ ] Smooth transition (~250ms)
   - [ ] Shadow increases
   - [ ] Glow becomes more prominent

---

## Edge Cases & Special Scenarios

### Long Scrolling
1. Scroll down the page significantly
2. **Expected:**
   - [ ] Navigation remains at bottom
   - [ ] Navigation stays fixed (doesn't scroll away)
   - [ ] Content scrolls behind nav (with padding)
   - [ ] FAB remains centered

### Tab Switching (iOS)
1. On iPhone, open Safari
2. Open SchemeSathi in tab A
3. Switch to another tab
4. Switch back to SchemeSathi tab
5. **Expected:**
   - [ ] Navigation state preserved
   - [ ] No resets or glitches
   - [ ] Page responsive

### Browser Zoom (Desktop)
1. Press Ctrl++ to zoom in (200%)
2. **Expected:**
   - [ ] All navigation items still visible
   - [ ] No overflow or cutoff
   - [ ] Touch targets stay large
   - [ ] Text readable

---

## Cross-Browser Checklist

| Browser | Desktop | Mobile | Status |
|---------|---------|--------|--------|
| Chrome  | [ ] Test | [ ] Test | |
| Firefox | [ ] Test | [ ] Test | |
| Safari  | [ ] Test | [ ] Test | |
| Edge    | [ ] Test | N/A    | |
| Samsung Internet | N/A | [ ] Test | |

---

## Final Sign-Off

- [ ] All visual elements present and styled correctly
- [ ] All interactions smooth and responsive
- [ ] Keyboard navigation works completely
- [ ] Accessibility standards met
- [ ] No content hidden behind navigation
- [ ] Responsive across all breakpoints
- [ ] Performance acceptable (60 FPS)
- [ ] Cross-browser tested
- [ ] Ready for production

---

**Testing Date:** _____________
**Tested By:** _____________
**Status:** ☐ Pass ☐ Fail ☐ Needs Revision

**Notes:**
```
[Add notes here]
```

---

**Need Help?** Check NAVIGATION_REDESIGN_SUMMARY.md for implementation details.
