# Add Guest Modal — Design & Prototype

Status: Draft

## 🎯 Goals
- Improve usability and accessibility of the existing **Add Guest** modal on the Admin page.
- Ensure reliable keyboard and screen-reader behavior (focus trap, Escape to close, return focus to trigger).
- Provide clear validation and error states (inline messages, ARIA alerts).
- Add non-intrusive, subtle open/close animations and a success toast on save.
- Keep implementation small and testable; maintain keyboard-first and mobile-friendly behavior.

---

## Scope
- Component: `src/components/AddGuestModal.tsx`
- Tests: unit tests (Vitest + Testing Library) and E2E (Playwright)
- Not in scope: backend changes — UI-only improvements and small client-side UX helpers

---

## UX Requirements
1. Open behavior
   - When opened, the modal should:
     - Be announced to assistive tech as a dialog: `role="dialog"`, `aria-modal="true"`, and have a descriptive `aria-labelledby`.
     - Focus the first input (`First name`) and select the text if any value present.
     - Trap keyboard focus inside the modal.
     - Prevent page scrolling behind the dialog.

2. Close behavior
   - Close via:
     - Cancel button
     - Close (X) icon (optional)
     - Pressing the `Escape` key
     - Clicking the overlay (configurable — should close by default)
   - On close, focus should return to the element that opened the modal (the Add guest button).

3. Validation & Errors
   - Inline validation for required fields (First/Last name) and length limits (<=64 chars).
   - Validation message should be visually adjacent and also exposed to screen readers using `aria-describedby` and role `alert` (or `aria-live="assertive"`).
   - On save error (e.g., network, server reject), show an inline error message at top or near Save button; keep modal open.

4. Success state
   - On successful save, close modal and show a small success toast (non-modal) near top-right with `role="status"` or `aria-live="polite"`.
   - If possible, use a short animation for toast in/out.

5. Animations
   - Subtle fade + scale on open/close for the dialog container (prefers-reduced-motion support).
   - Use CSS transitions or a lightweight animation helper. Avoid heavy dependencies.

6. Accessibility
   - Ensure proper label/input association (`<label htmlFor="...">` + input `id`), and semantic buttons.
   - Focus trap implementation must be keyboard-only friendly and robust to nested interactive content.
   - Provide accessible names and roles for toast messages and error alerts.

---

## Interaction Flow (sequence)
1. Admin clicks `Add guest` button (button has `aria-haspopup="dialog"` optional)
2. Save the opener (`HTMLElement`) to restore focus on close.
3. Modal opens with overlay; page body scrolling is disabled.
4. First input is focused; keyboard Tab cycles within modal.
5. User fills fields; on Save:
   - Client-side validate; if invalid show inline message and set focus to first invalid input
   - If valid, call `onSave()` (already part of existing component contract)
   - If `onSave` resolves, close modal and fire toast
   - If `onSave` rejects, show inline error and do not close
6. On modal close, restore scroll and return focus to opener

---

## Edge cases & Notes
- If multiple modals or nested modals become possible in future, ensure the focus-trap is reentrant or scoped.
- Support browser `prefers-reduced-motion` to reduce/disable animations.
- Ensure tests do not rely on animation timing — use `await` on DOM changes instead of timeouts.

---

## Implementation sketch
- Introduce small helper hook(s):
  - `useFocusTrap(rootRef, { initialFocusRef, onClose, returnFocusTo })`
  - `usePreventBodyScroll(active)`
- Modal changes (pseudo/approx):

```tsx
<div role="dialog" aria-modal="true" aria-labelledby="add-guest-title" ref={rootRef} onKeyDown={handleKeyDown}>
  <h3 id="add-guest-title">Add guest</h3>
  <label htmlFor="first-name">First name</label>
  <input id="first-name" ref={firstRef} />
  ...
</div>
```

- `handleKeyDown` handles `Escape` to close.
- Focus trap implementation: capture Tab/Shift+Tab and cycle focus; or use a lightweight utility (small inline implementation) — avoid adding a third-party dependency unless necessary.

- Animation: add `data-open` attribute or class `modal-open` and CSS transitions. Respect `prefers-reduced-motion`.

- Toast: simple component `<Toast message="Guest added" />` that appears on success and uses `aria-live="polite"`.

---

## Tests to add
### Unit (Vitest + Testing Library)
- Focus behavior
  - Renders modal and focuses first input when `open` prop set
  - Tab/Shift+Tab cycles focus inside modal
  - Pressing `Escape` closes modal and returns focus to opener
- Validation
  - Shows inline messages for missing / too-long names
  - On invalid input, Save does not call `onSave`
- Save behaviors
  - On `onSave` success: modal closes and toast is shown (ensure toast `role="status"` exists)
  - On `onSave` reject: inline error message shown and modal remains open
- Animation-safe assertions: avoid relying on timeout for animation — use DOM state change assertions

### E2E (Playwright)
- Open admin page, click `Add guest`, keyboard nav, save a guest and confirm RSVP updated
- Confirm Escape closes dialog and focus returns to opener
- Visual regression: capture modal open screenshot (optional)

---

## Acceptance criteria
- Modal traps focus and restores focus after close
- Escape and overlay click close modal
- Inline validation and server error flows behave correctly
- Success shows toast and RSVP list updates
- All new behaviors covered by unit tests; key flows covered by an E2E test

---

## Implementation plan (tasks)
1. Add `useFocusTrap` and `usePreventBodyScroll` helpers (small, tested)
2. Update `AddGuestModal.tsx` to use hooks; add Escape handling and overlay click handling
3. Add CSS for animations and `prefers-reduced-motion` support
4. Add `Toast` component and wire it to admin page (or local state) on save success
5. Add unit tests and Playwright E2E test
6. Iterate on polish after review

---

If this looks good I can:
- implement the helpers + modal changes and add unit tests now, or
- provide a short prototype PR with minimal changes for faster review

Please tell me which you prefer and any stylistic preferences (e.g., use CSS transitions vs. Framer Motion).