# scroll-area

2026-11-20 · transformation engine. Verdict: `ScrollAreaScrollbar` → `Scrollbar`, `ScrollAreaThumb` → `Thumb`; app-specific `type` prop removed.

## Changed

- `src/components/ui/scroll-area.tsx`: `@base-ui/react/scroll-area`; `Scrollbar` / `Thumb` parts; kept the custom `orientation` prop and its conditional classes; added `data-orientation` for styling parity.
- `src/components/command-menu.tsx`: removed `type='hover'`.
- `src/features/settings/components/sidebar-nav.tsx`: removed `type='always'`.

## Left alone

- `Corner` and `Viewport` parts remain; no Base UI `Content` part was introduced.

## Behavior changes

- Radix `type` (always/scroll/hover) has no equivalent; scrollbar visibility is controlled by Base UI.
- Scrollbar DOM class hooks changed from Radix data attributes (`data-orientation` remains explicit here).

## Verify by hand

- Open the command palette and the horizontal settings nav; confirm scrolling and scrollbar appearance.
