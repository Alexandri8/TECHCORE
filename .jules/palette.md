## 2026-07-14 - Accessible ScrollSpy with Smooth Navigation Offset
**Learning:** Combining `IntersectionObserver` for ScrollSpy with `scroll-padding-top` on the `html` element provides a seamless "current position" indicator while solving the common issue of fixed headers obscuring content targets. Using `aria-current="location"` ensures this visual state is also communicated to assistive technologies.
**Action:** Always pair fixed-header navigation with `scroll-padding-top` and use `aria-current` for active navigation states.
