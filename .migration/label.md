# label

2026-11-20 · transformation engine (Radix Label has no Base UI counterpart). Verdict: native `<label>`, original classes preserved.

## Changed

- `src/components/ui/label.tsx`: dropped `LabelPrimitive.Root`; renders `<label>` with `data-slot='label'` and the exact original class string.

## Left alone

- `form.tsx` `FormLabel`: it already consumed `Label`, so it now inherits the native label automatically.

## Behavior changes

- None observable; `htmlFor` and other native label props pass through.

## Verify by hand

- Open a form dialog and click a field label; confirm the associated input receives focus.
