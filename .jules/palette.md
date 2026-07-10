## 2026-07-10 - [ScrollSpy and Fixed Header UX]
**Learning:** Fixed headers often overlap section content during anchor navigation. `scroll-padding-top` on the `html` element is a clean, CSS-only solution to provide the necessary offset without JavaScript calculations.
**Action:** Always pair fixed navbars with `scroll-padding-top` to ensure section headers remain visible upon navigation.

## 2026-07-10 - [Dynamic Accessibility Labels]
**Learning:** Screen reader users need context on what a toggle button will do *next*. Updating the `aria-label` dynamically (e.g., from "Open menu" to "Close menu") provides clearer feedback than `aria-expanded` alone for some users.
**Action:** Implement dynamic `aria-label` updates on state-toggle components like mobile menus or accordions.

## 2026-07-10 - [Redundant Interaction Logic]
**Learning:** Multiple competing implementations of the same UI logic (like mobile menu toggles) lead to unpredictable behavior and "ghost" event listeners.
**Action:** Consolidate UI interaction logic into a single source of truth to ensure reliable state management and cleaner code.
