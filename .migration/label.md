# label
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine (Radix Label has no Base UI counterpart). Verdict: native `<label>`, original classes preserved.

## Changed

- `src/components/ui/label.tsx`: dropped `LabelPrimitive.Root`; renders `<label>` with `data-slot='label'` and the exact original class string.

## Left alone

- `form.tsx` `FormLabel`: it already consumed `Label`, so it now inherits the native label automatically.

## Behavior changes

- None observable; `htmlFor` and other native label props pass through.

## Verify by hand

- Open a form dialog and click a field label; confirm the associated input receives focus.
