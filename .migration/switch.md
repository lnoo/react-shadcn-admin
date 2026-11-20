# switch
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: 1:1 primitive swap with presence-attribute class rewrite.

## Changed

- `src/components/ui/switch.tsx`: `@base-ui/react/switch`; Root/Thumb classes use `data-checked:` / `data-unchecked:` / `data-disabled:` instead of Radix `data-[state=...]` and `disabled:`.

## Left alone

- No consumer changes were required.

## Behavior changes

- `onCheckedChange` now receives `(checked, eventDetails)`; existing handlers ignore the second argument.
- Root renders a `<span>` with a hidden input rather than a `<button>`.

## Verify by hand

- Toggle a switch in settings; confirm thumb translate/ RTL behavior and keyboard operation.
