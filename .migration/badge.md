# badge

2026-11-20 · transformation engine. Verdict: `asChild`/`Slot` replaced by Base UI `render` via `useRender` + `mergeProps`.

## Changed

- `src/components/ui/badge.tsx`: `SlotPrimitive.Slot` → `useRender({ defaultTagName: 'span', render, props: mergeProps(...) })`; `asChild` prop → `render`; `badgeVariants` untouched; `data-slot='badge'` object literal cast to `React.ComponentProps<'span'>` as required by `mergeProps`.

## Left alone

- All `<Badge>` call sites (none used `asChild`).

## Behavior changes

- Callers that previously passed `asChild` must pass `render`; no in-repo call sites did.

## Verify by hand

- Render a Badge with `render={<a href="..." />}` and confirm the classes are merged onto the anchor without a wrapping span.
