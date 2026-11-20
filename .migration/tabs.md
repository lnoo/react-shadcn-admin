# tabs

2026-11-20 · transformation engine. Verdict: `Trigger` → `Tab`, `Content` → `Panel`, `data-active` classes.

## Changed

- `src/components/ui/tabs.tsx`: `@base-ui/react/tabs`; `TabsPrimitive.Tab` / `TabsPrimitive.Panel`; `data-[state=active]:` → `data-active:`; added `aria-disabled:pointer-events-none aria-disabled:opacity-50` alongside existing disabled styles (Base UI surfaces disabled via `aria-disabled`).

## Left alone

- No consumer changes were needed.

## Behavior changes

- Base UI defaults to manual tab activation. `activateOnFocus` was NOT added (flagged per skill; behavior differs from Radix's automatic default).
- `forceMount` would be `keepMounted` (no in-repo usage).

## Verify by hand

- Open a settings page with tabs; confirm click/keyboard navigation and active underline styling.
