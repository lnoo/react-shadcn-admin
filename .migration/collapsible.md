# collapsible

2026-11-20 · transformation engine. Verdict: Base UI parts `Root` / `Trigger` / `Panel`; consumer `asChild` converted to `render`.

## Changed

- `src/components/ui/collapsible.tsx`: `Collapsible` from `@base-ui/react/collapsible`; `CollapsibleContent` now wraps `CollapsiblePrimitive.Panel`.
- `src/components/layout/nav-group.tsx`: `Collapsible` and `CollapsibleTrigger` call sites use `render={<SidebarMenuItem>...}` / `render={<SidebarMenuButton>...}`; chevron class `group-data-[state=open]/collapsible` → `group-has-data-open/collapsible`.

## Left alone

- `sidebar.tsx` custom `data-[state=collapsed]` classes (app state, not Radix).

## Behavior changes

- Base UI puts open state on `Panel` (`data-open`) and `Trigger` (`data-panel-open`); Root no longer exposes `data-state`.
- `Toggle` marked open via `group-has-data-open` rather than the old Root attribute.

## Verify by hand

- Expand/collapse a sidebar group with nested items; confirm the chevron rotates and keyboard focus works.
