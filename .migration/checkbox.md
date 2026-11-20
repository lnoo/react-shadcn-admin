# checkbox

2026-11-20 · transformation engine. Verdict: 1:1 primitive swap plus state-class and indeterminate API migration.

## Changed

- `src/components/ui/checkbox.tsx`: `@base-ui/react/checkbox`; `data-[state=checked]:` → `data-checked:`, `disabled:` → `data-disabled:` (Root now renders a `<span>`).
- `src/features/tasks/components/tasks-columns.tsx`, `src/features/users/components/users-columns.tsx`: `checked={... || 'indeterminate'}` → `checked={allSelected}` plus `indeterminate={someSelected && !allSelected}`.

## Left alone

- `onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}` — still type-safe.

## Behavior changes

- `checked="indeterminate"` is no longer valid; indeterminate is a separate boolean prop.
- `onCheckedChange` receives `(boolean, eventDetails)`; one-arg handlers are unaffected.

## Verify by hand

- Select some/all rows in Tasks and Users tables; confirm checked and mixed-state visuals and header toggle behavior.
