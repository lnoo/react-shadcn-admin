# separator
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: callable Base UI `Separator`, `decorative` dropped.

## Changed

- `src/components/ui/separator.tsx`: import from `@base-ui/react/separator`; `SeparatorPrimitive.Root` → callable `SeparatorPrimitive`; removed `decorative` prop; kept `orientation` default and classes.

## Left alone

- Nothing else; all consumers pass only `className`/`orientation`.

## Behavior changes

- `decorative` is no longer accepted (Base UI handles accessibility internally).

## Verify by hand

- Confirm horizontal and vertical separators render with the expected border size and `data-orientation`.
