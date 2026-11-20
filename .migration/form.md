# form
> 官方 base registry 没有 `form` 组件（内容为 `null`），因此最终仍保留本项目基于 react-hook-form 的 wrapper；中间转换步骤见下文，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: Radix `Slot` in `FormControl` replaced with `mergeProps` + `cloneElement`; `LabelPrimitive` removed in favor of the native label wrapper.

## Changed

- `src/components/ui/form.tsx`: imports `mergeProps` from `@base-ui/react/merge-props`; `FormLabel` typed against the native `label`; `FormControl` merges injected `id`, `aria-describedby`, `aria-invalid` and `data-slot` onto its single child via `React.cloneElement(children, mergeProps(...))`; child props cast to `React.ComponentProps<'div'>` to satisfy `mergeProps`.
- `src/components/ui/label.tsx` migrated separately to a native `<label>`.

## Left alone

- `react-hook-form` itself; all field-level form logic.

## Behavior changes

- Event handlers from the child and injected props are merged by Base UI `mergeProps` rather than Radix `Slot`; verify focus/description wiring in forms.

## Verify by hand

- Submit an empty users-invite form and confirm validation messages plus `aria-describedby` / `aria-invalid` wiring on inputs and Select triggers.
