## 2025-05-14 - [Payment Modal Accessibility and Loading State]
**Learning:** In projects where buttons use a specific loading CSS pattern (hiding `span` and `i` elements inside `.btn.loading`), it's critical to wrap existing button text in a `<span>` and ensure the `.loader` element is injected via JS to provide visual feedback. Additionally, modal close "X" marks should always be `<button>` elements with `aria-label` to ensure keyboard focusability and screen reader accessibility.
**Action:** Always check `style.css` for `.btn.loading span` rules and convert `<span>` clickables to `<button>` for proper a11y.

## 2025-05-16 - [Modal Focus Management and Escape Key Support]
**Learning:** Proper modal accessibility requires saving the trigger element's focus and restoring it upon closure, as well as providing an Escape key listener. Additionally, auto-focusing the first input field significantly improves UX for keyboard and screen reader users by reducing the number of tabs needed to reach the primary action.
**Action:** Implement a `lastFocusedElement` pattern for modals and add a global `keydown` listener for 'Escape'. Use `role="status"` and `aria-live="polite"` for dynamic notifications.
