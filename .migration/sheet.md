# sheet
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: Base UI Dialog primitives with transition-based slide animations.

## Changed

- `src/components/ui/sheet.tsx`: `@base-ui/react/dialog`; `Overlay` → `Backdrop`, `Content` → `Popup` with `data-side`; Radix `animate-in/out` + `slide-in-from-*` replaced with `transition` + `data-starting-style` / `data-ending-style` translate classes per side; `data-[state=open]` → `data-open`; Chinese sr-only close label preserved.
- `src/components/config-drawer.tsx`, `src/features/tasks/components/tasks-mutate-drawer.tsx`: `SheetTrigger` / `SheetClose` `asChild` → `render`.

## Left alone

- `vaul` drawer (not present in this repo); no drawer migration performed.

## Behavior changes

- Exit animations now rely on Base UI's `data-ending-style`; duration/feel may differ from the old 300/500ms keyframes.
- `onOpenChange` gains `eventDetails`.

## Verify by hand

- Open the theme settings sheet and task create/edit sheet from each side; confirm slide-in/out, focus return and Escape dismissal.
