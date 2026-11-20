# avatar

2026-11-20 · transformation engine. Verdict: direct part swap, classes untouched.

## Changed

- `src/components/ui/avatar.tsx`: `@base-ui/react/avatar` with `Root` / `Image` / `Fallback` parts; all `data-slot` values and class strings preserved.

## Left alone

- No consumers required changes.

## Behavior changes

- `Avatar.Image` delay prop is `delay` instead of Radix `delayMs` (no in-repo usage).

## Verify by hand

- Confirm avatar images load and the `SN` fallback renders when the image is missing.
