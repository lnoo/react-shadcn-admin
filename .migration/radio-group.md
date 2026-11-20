# radio-group
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: split into `RadioGroup` (callable) + `Radio.Root` / `Radio.Indicator`.

## Changed

- `src/components/ui/radio-group.tsx`: imports `@base-ui/react/radio-group` and `@base-ui/react/radio`; `RadioGroupItem` renders `RadioPrimitive.Root` / `RadioPrimitive.Indicator`; `disabled:` → `data-disabled:`.
- `src/components/config-drawer.tsx`: hand-rolled Radix composition migrated — `const Item = Radio.Root`, `<RadioGroupPrimitive>` root, `group-data-[state=checked|unchecked]` → `group-data-checked|unchecked`, `data-[state=checked]` → `data-checked`; `SheetTrigger asChild` → `render`.
- `src/components/config-drawer.test.tsx`: `data-state="checked"` expectation → `data-checked=""`.

## Left alone

- `src/assets/custom/icon-theme-system.tsx` needed its own `group-data-[state=unchecked]` classes rewritten to `group-data-unchecked:`.

## Behavior changes

- `onValueChange` gains an `eventDetails` argument; `orientation` / `loop` props removed by Base UI.
- `Radio.Root` renders a `<span>` + hidden input rather than a button.

## Verify by hand

- Open theme settings and switch theme / layout / font / preset radios; confirm the checkmark icon and `data-checked` state, and arrow-key navigation.
