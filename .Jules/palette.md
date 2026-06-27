## 2025-05-14 - [Payment Modal Accessibility and Loading State]
**Learning:** In projects where buttons use a specific loading CSS pattern (hiding `span` and `i` elements inside `.btn.loading`), it's critical to wrap existing button text in a `<span>` and ensure the `.loader` element is injected via JS to provide visual feedback. Additionally, modal close "X" marks should always be `<button>` elements with `aria-label` to ensure keyboard focusability and screen reader accessibility.
**Action:** Always check `style.css` for `.btn.loading span` rules and convert `<span>` clickables to `<button>` for proper a11y.

## 2026-06-12 - [Modal Focus and Keyboard Navigation]
**Learning:** For modals that contain forms, automatically focusing the first input field upon opening significantly reduces friction and improves the "path to action". Additionally, global keyboard listeners for the 'Escape' key should check for modal visibility before triggering close actions to ensure a predictable user experience.
**Action:** Implement `element.focus()` on modal open and add a visibility-aware `Escape` key listener for all new modal components.

## 2026-06-13 - [Stateful Button Feedback and Modal Scoping]
**Learning:** Providing immediate, stateful visual feedback on a submit button (e.g., transitioning from 'Loading' to 'Success') after an async operation significantly enhances the user's sense of task completion. Additionally, when implementing modal focus restoration, the tracking variable must be scoped correctly (top-level or shared closure) if the open/close logic is split between global functions and event listeners.
**Action:** Use temporary success classes and icons on buttons after fetch completion and ensure focus-tracking variables are globally accessible within the script.

## 2026-06-15 - [Enhanced Character Counter Feedback and Accessibility]
**Learning:** For textareas with character limits, linking the counter via `aria-describedby` provides a non-intrusive way for screen reader users to discover the limit. Furthermore, providing multi-stage visual feedback (e.g., warning at 90%, danger at 98%) helps users anticipate the limit without needing to constantly check the number.
**Action:** Always link character counters to their inputs via ARIA and implement progressive visual cues for inputs with length constraints.

## 2026-06-27 - [Accessible Mobile Navigation Overlay]
**Learning:** Implementing a full-screen mobile navigation overlay requires careful synchronization of visual state (classes), accessibility state (`aria-expanded`), and behavioral constraints (body scroll locking). A 'backdrop click' listener on the fixed overlay element itself provides a premium feel and intuitive dismissal without needing a dedicated 'close' button area for every interaction.
**Action:** Use fixed overlays with `backdrop-filter` for premium mobile menus and always implement body scroll locking and backdrop-click dismissal.
