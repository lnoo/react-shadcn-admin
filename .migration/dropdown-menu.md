# dropdown-menu
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: Radix `DropdownMenu` → Base UI `Menu` with restructured popup anatomy.

## Changed

- `src/components/ui/dropdown-menu.tsx`: `@base-ui/react/menu`; `Content` → `Portal > Positioner > Popup` with positioning props forwarded; `Label` → `GroupLabel` **wrapped in `Menu.Group`** (Base UI requires the context; without it the app crashed at runtime); `ItemIndicator` → `CheckboxItemIndicator` / `RadioItemIndicator`; `Sub` → `SubmenuRoot`, `SubTrigger` → `SubmenuTrigger`, `SubContent` composes `DropdownMenuContent`; `data-popup-open` for submenu trigger open styling; CSS vars → `--available-height` / `--transform-origin`; added `keepMounted` passthrough to Portal.
- `src/components/data-table/view-options.tsx`: hand-rolled Radix trigger replaced by `DropdownMenuTrigger render={<Button/>}`.
- 20+ call sites: `asChild` → `render`; `data-[state=open]` → `data-popup-open`; `--radix-dropdown-menu-trigger-width` → `--anchor-width`.
- Removed meaningless `defaultValue` props from two `DropdownMenuItem` call sites in task bulk actions.

## Left alone

- `cmdk` command menu; `sonner`.

## Behavior changes

- Radix group labels could stand alone; Base UI `GroupLabel` now implies a surrounding `Group`.
- Base UI menu items do not necessarily close on click; checkbox/radio items default `closeOnClick={false}` (flagged, not patched).
- `forceMount` on Content became `keepMounted` on Portal for the profile dropdown.

## Verify by hand

- Open row-action menus, profile/team/theme menus and view-options; test submenus, keyboard typeahead, outside-click dismissal and the `keepMounted` profile menu.
