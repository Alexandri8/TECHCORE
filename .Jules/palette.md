## 2025-05-14 - [Payment Modal Accessibility and Loading State]
**Learning:** In projects where buttons use a specific loading CSS pattern (hiding `span` and `i` elements inside `.btn.loading`), it's critical to wrap existing button text in a `<span>` and ensure the `.loader` element is injected via JS to provide visual feedback. Additionally, modal close "X" marks should always be `<button>` elements with `aria-label` to ensure keyboard focusability and screen reader accessibility.
**Action:** Always check `style.css` for `.btn.loading span` rules and convert `<span>` clickables to `<button>` for proper a11y.

## 2026-06-12 - [Modal Focus and Keyboard Navigation]
**Learning:** For modals that contain forms, automatically focusing the first input field upon opening significantly reduces friction and improves the "path to action". Additionally, global keyboard listeners for the 'Escape' key should check for modal visibility before triggering close actions to ensure a predictable user experience.
**Action:** Implement `element.focus()` on modal open and add a visibility-aware `Escape` key listener for all new modal components.
