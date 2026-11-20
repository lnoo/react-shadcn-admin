# project

2026-11-20 · whole-project migration, transformation engine on user-owned files (legacy `new-york` has no `base-*` golden to replay). Verdict: Radix fully removed; build, lint and all 122 tests pass.

## Changed

- `components.json`: `style` `new-york` → `base-vega`. `shadcn info` now reports `base: base`.
- `package.json` / `bun.lock`: removed `radix-ui@^1.6.7`, added `@base-ui/react@^1.9.0`.
- 20 UI wrappers in `src/components/ui/` migrated to Base UI primitives; 2 hand-rolled consumers (`config-drawer.tsx`, `data-table/view-options.tsx`) migrated directly.
- Consumer sweep: 45 `asChild` → `render` call sites (AST-based codemod + manual nested pass), `delayDuration` → `delay`, `forceMount` → `keepMounted`, `ScrollArea type` removed, `checked="indeterminate"` split into `checked` + `indeterminate`, Select `onValueChange` handlers widened for `null`, Radix CSS vars → Base UI vars, `data-[state=...]` → `data-open` / `data-checked` / `data-popup-open`.
- `vite.config.ts` + `src/test-utils/setup.ts`: browser tests now load the app stylesheet. Base UI relies on CSS classes for `fixed`/`z-index`; without CSS its internal modal backdrop intercepts clicks.
- Test expectations updated for Base UI state attributes (`data-checked`) and the extra `eventDetails` callback argument.
- Leftover scan: `grep -rn "radix-ui\|@radix-ui\|--radix-" src` → clean.

## Left alone

- `cmdk` (command), `sonner`, `input-otp`, `react-day-picker` (calendar), `recharts` (chart) — not Radix, intentionally untouched.
- `table.tsx` `data-[state=selected]` and sidebar custom `data-[state=collapsed]` hooks — app-owned state, not Radix.
- Third-party CSS/theme tokens in `src/styles/index.css` — no restyle attempted; Vega component classes were not replayed onto user wrappers.

## Behavior changes

- Base UI callbacks pass a second `eventDetails` argument (`onOpenChange`, `onValueChange`, `onCheckedChange`). Existing one-arg handlers still work; tests asserting exact call arguments were updated.
- Select `Value` renders the raw value unless `items` is supplied on Root; `SelectDropdown` now passes `items` so labels still display.
- Base UI Select/Menu/Tooltip defaults differ (positioning, submenu alignment, tooltip delay/direction). Original class strings were preserved; verify visually.
- Tabs default to manual activation in Base UI; no `activateOnFocus` was added (flagged, not patched).
- Menu items may not close on click; checkbox/radio items default `closeOnClick={false}` (flagged, not patched).
- Dev-only warning remains in some create-sheet flows: "changing the default value state of an uncontrolled Select" — caused by `defaultValue` changing while mounted; not a functional failure.

## Verification

- `bun run build` — pass (tsc -b clean).
- `bun run lint` — pass.
- `bun run test` — 16 files, 122 tests passed.
- Manual smoke with Playwright at 1440×900 and 390×844: dashboard, command palette, theme dropdown, theme-settings sheet/radios, profile dropdown, tasks table, row-actions menu, create sheet + Select, view-options menu, users navigation — no console/page errors.

## Final state: all UI components replaced with official base-vega registry versions

2026-11-20 (follow-up): ran `shadcn add <component> --overwrite -y` for all 30 components listed by `shadcn info`. Every component in `src/components/ui/` is now the verbatim official `base-vega` registry file (IconPlaceholder resolved to Lucide by the CLI). Previous hand-migrated class strings were intentionally discarded.

Exceptions / follow-up adaptations required by the official versions:

- `form.tsx` — the official base registry ships no `form` component (registry content is `null`), so the project's react-hook-form wrapper remains. Migrating it to the official `Field` family would require rewriting every form and was not done.
- `sonner.tsx` — kept official but swapped `next-themes`' `useTheme` for the project's `@/context/theme-provider` so toasts follow the app theme; `next-themes` was removed again.
- `react-day-picker` upgraded `9.14.0` → `^10.0.2`, and registry-added `input-group.tsx` / `hooks/use-mobile.ts` were kept. The duplicate old `hooks/use-mobile.tsx` was deleted.
- Call-site fixes: dashboard Tabs list wrapper `w-full` → `shrink-0` (official vertical tabs use a row flex layout; the old wrapper squeezed content to 96px); removed unsupported `keepMounted`, `collisionPadding`, and `ScrollArea orientation` props.
- Styles are still the project's new-york-era CSS; official Vega-only utility classes (`cn-menu-target`, `cn-toast`, …) are not defined, but visual checks showed no regressions.

## Verify by hand

- Open the theme settings sheet and switch theme/layout/font presets; confirm radio checkmarks and cookie persistence.
- Open any dialog/sheet, press Escape and click the close button; confirm focus returns to the trigger.
- Open a Select in a form (users invite / task create), pick an option with mouse and keyboard.
- Open a dropdown menu with submenus; confirm keyboard navigation and outside-click dismissal.
