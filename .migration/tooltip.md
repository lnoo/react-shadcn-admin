# tooltip
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: `Portal > Positioner > Popup`, Provider `delay`, per-side arrow positioning.

## Changed

- `src/components/ui/tooltip.tsx`: `@base-ui/react/tooltip`; `delayDuration` → `delay` (default 0); `Content` split into `Portal` + `Positioner` + `Popup` with `side`/`align`/`sideOffset`/`alignOffset` forwarded; origin var → `--transform-origin`; `data-[state=closed]` → `data-closed`; Arrow given explicit per-side offsets.
- `src/components/long-text.tsx`: `TooltipProvider delayDuration={0}` → `delay={0}`.
- `src/components/ui/sidebar.tsx`: Tooltip trigger uses `render`.

## Left alone

- `disableHoverableContent` had no in-repo usage.

## Behavior changes

- `disableHoverableContent` has no Base UI equivalent (none used).
- Default `sideOffset` changed from 0 to 4; `side` default `top`.
- Provider `skipDelayDuration` concept dropped.

## Verify by hand

- Hover truncated text and collapsed sidebar items; confirm tooltip appears immediately, arrow points correctly, and it dismisses on mouse-out/Escape.
