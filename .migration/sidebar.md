# sidebar
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: five polymorphic Slot wrappers converted to Base UI `useRender` + `mergeProps` with a `render` prop.

## Changed

- `src/components/ui/sidebar.tsx`: `SidebarGroupLabel`, `SidebarGroupAction`, `SidebarMenuButton`, `SidebarMenuAction`, `SidebarMenuSubButton` now use `useRender`/`mergeProps` and expose `render`; `TooltipProvider delayDuration={0}` → `delay={0}`; `TooltipTrigger asChild` → `render={button}`.
- `src/components/layout/nav-group.tsx`, `src/components/layout/app-title.tsx` and other call sites: `asChild` → `render`.

## Left alone

- `data-[state=collapsed]`, `data-[variant=inset]` and `data-[collapsible=icon]` classes — app-owned sidebar state, not Radix.

## Behavior changes

- `asChild` is no longer accepted by the five polymorphic sidebar parts; use `render`.
- Tooltip open delay stays 0 but the prop name changed.

## Verify by hand

- Collapse/expand the sidebar, hover a collapsed nav item for its tooltip, and follow a `SidebarMenuSubButton` link; confirm icons/labels render without extra wrapper elements.
