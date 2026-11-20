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

## Verify by hand

- Open the theme settings sheet and switch theme/layout/font presets; confirm radio checkmarks and cookie persistence.
- Open any dialog/sheet, press Escape and click the close button; confirm focus returns to the trigger.
- Open a Select in a form (users invite / task create), pick an option with mouse and keyboard.
- Open a dropdown menu with submenus; confirm keyboard navigation and outside-click dismissal.
