# select
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: `Root` bare re-export; `Portal > Positioner > Popup`, `Viewport` → `List`, `Label` → `GroupLabel`, scroll arrows; popper behavior preserved via `alignItemWithTrigger={false}`.

## Changed

- `src/components/ui/select.tsx`: `@base-ui/react/select`; `const Select = SelectPrimitive.Root`; `Icon render={<ChevronDownIcon/>}`; CSS vars → `--available-height` / `--transform-origin` / `--anchor-width`; `data-open` / `data-closed`; `ItemIndicator render={<span/>}`; `ScrollUpArrow` / `ScrollDownArrow`; `GroupLabel`; `alignItemWithTrigger` default `false` (maps old `position='popper'`).
- `src/components/select-dropdown.tsx`: passes `items` to Root so `SelectValue` shows labels rather than raw values; wraps `onValueChange` to drop `null`.
- `src/features/apps/index.tsx`, `src/features/settings/components/sidebar-nav.tsx`: handlers widened to accept `null`.

## Left alone

- `cmdk`, `react-day-picker`, `input-otp` — non-Radix.

## Behavior changes

- `onValueChange` receives `(value | null, eventDetails)`; one-arg consumers now guard `null`.
- Base UI `Value` otherwise renders raw values unless `items` or a render function is supplied.
- Scroll arrows may overlay the last item when the list is height-constrained; the fixed `h-(--anchor-height)` was removed from `List`.
- Dev-only warning about changing `defaultValue` on an uncontrolled Select remains in some create-sheet flows.

## Verify by hand

- In Users invite and Tasks create dialogs, open the role/status Select, pick with mouse and keyboard, and confirm labels (not raw values) display.
