# Motion Animation Library

## Overview

**Motion** (package: `motion`, formerly `framer-motion`) is the industry-standard React animation library used in production by thousands of applications. With 30,200+ GitHub stars and 300+ official examples, it provides a declarative API for creating sophisticated animations with minimal code.

*   **Gestures:** Drag, hover, tap, pan, focus with cross-device support.
*   **Scroll Animations:** Viewport-triggered, scroll-linked, parallax effects.
*   **Layout Animations:** FLIP technique for smooth layout changes, shared element transitions.
*   **Spring Physics:** Natural, customizable motion with physics-based easing.
*   **SVG:** Path morphing, line drawing, attribute animation.
*   **Exit Animations:** `AnimatePresence` for unmounting transitions.
*   **Performance:** Hardware-accelerated, ScrollTimeline API, bundle optimization (2.3 KB - 34 KB).
*   **Production Tested:** React 19, Next.js 16, Vite 7, Tailwind v4.

---

## When to Use This Skill

### ✅ Use Motion When:

#### Complex Interactions
*   Drag-and-drop interfaces (sortable lists, kanban boards, sliders)
*   Hover states with scale/rotation/color changes
*   Tap feedback with bounce/squeeze effects
*   Pan gestures for mobile-friendly controls

#### Scroll-Based Animations
*   Hero sections with parallax layers
*   Scroll-triggered reveals (fade in as elements enter viewport)
*   Progress bars linked to scroll position
*   Sticky headers with scroll-dependent transforms

#### Layout Transitions
*   Shared element transitions between routes (card → detail page)
*   Expand/collapse with automatic height animation
*   Grid/list view switching with smooth repositioning
*   Tab navigation with animated underline

#### Advanced Features
*   SVG line drawing animations
*   Path morphing between shapes
*   Spring physics for natural bounce
*   Orchestrated sequences (staggered reveals)
*   Modal dialogs with backdrop blur

#### Bundle Optimization
*   Need a 2.3 KB animation library (`useAnimate` mini)
*   Want to reduce Motion from 34 KB to 4.6 KB (`LazyMotion`)

### ❌ Don't Use Motion When:

#### Simple List Animations → Use `auto-animate` skill instead:
*   Todo list add/remove (`auto-animate`: 3.28 KB vs `motion`: 34 KB)
*   Search results filtering
*   Shopping cart items
*   Notification toasts
*   Basic accordions without gestures

#### Static Content
*   No user interaction or animations needed
*   Server-rendered content without client interactivity

#### 3D Animations → Use dedicated 3D library:
*   Three.js for WebGL
*   React Three Fiber for React + Three.js

---

## Cloudflare Workers Deployment

> **Status:** ✅ Fixed (Dec 2024)
> Previous build compatibility issues resolved (GitHub issue #2918 closed as completed). Motion now works directly with Wrangler - no workaround needed. Both `motion` and `framer-motion` v12.23.24 work correctly.

---

## Installation

### Latest Stable Version

```bash
# Using pnpm (recommended)
pnpm add motion

# Using npm
npm install motion

# Using yarn
yarn add motion