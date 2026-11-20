# popover
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: `Portal > Positioner > Popup` structure; custom `collisionPadding` passthrough preserved.

## Changed

- `src/components/ui/popover.tsx`: `@base-ui/react/popover`; extracted `align`/`alignOffset`/`side`/`sideOffset`/`collisionPadding` and forwarded them to `Positioner` (declared → destructured → forwarded); origin var `--radix-popover-content-transform-origin` → `--transform-origin`; `data-[state=open|closed]` → `data-open` / `data-closed`.
- `PopoverAnchor` removed (Base UI has no equivalent; no consumers).

## Left alone

- `cmdk` command palette, date-picker's calendar popover content (still uses this wrapper).

## Behavior changes

- `sideOffset` default is now 4; `align` default `center`.
- Global `collisionPadding` was added to the wrapper so the existing AI-chat call site keeps working.

## Verify by hand

- Open the date picker and the AI-chat popover; confirm placement above/near the trigger and outside-click dismissal.
