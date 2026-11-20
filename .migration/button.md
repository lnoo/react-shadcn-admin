# button
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: shadcn Slot-based button replaced by the real Base UI `Button` primitive.

## Changed

- `src/components/ui/button.tsx`: imports `{ Button as ButtonPrimitive } from '@base-ui/react/button'`; `asChild` → `render`; `cva` variants and all class strings untouched; removed the now-unused React import.
- All `asChild` call sites across the app converted to `render` by codemod.

## Left alone

- `buttonVariants` consumers (alert-dialog, etc.).

## Behavior changes

- `render` replaces `asChild`; Base UI Button accepts `focusableWhenDisabled` (default false per installed types) and state-function `className`.
- `onClick` and other handlers are merged by Base UI rather than Radix Slot.

## Verify by hand

- Click buttons in dialogs and tables, confirm disabled styling, and test a `render={<a/>}` composition in the sidebar/nav.
