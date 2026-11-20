# dialog
> 后续已用 `shadcn add <component> --overwrite` 替换为官方 base-vega 版本；本报告记录的是中间转换步骤，最终状态见 `project.md`。

2026-11-20 · transformation engine. Verdict: `Overlay` → `Backdrop`, `Content` → `Popup`, presence-attribute animations.

## Changed

- `src/components/ui/dialog.tsx`: `@base-ui/react/dialog`; `DialogOverlay` renders `Backdrop`; `DialogContent` renders `Popup`; `data-[state=open|closed]` → `data-open` / `data-closed`; `showCloseButton` customization preserved.
- `src/components/ui/command.tsx`: `CommandDialog` casts `children` to `React.ReactNode` because Base UI Root children may be a render function.
- `src/components/confirm-dialog.tsx`: `AlertDialogDescription asChild` → `render={<div>...</div>}`.

## Left alone

- `cmdk` command primitive itself.

## Behavior changes

- `onOpenChange` receives `(open, eventDetails)`; `onOpenAutoFocus` / `onCloseAutoFocus` map to `initialFocus` / `finalFocus` (no in-repo usage).
- Focus/dismissal behavior is Base UI's; verify focus return manually.

## Verify by hand

- Open and close the command palette and the users invite dialog via close button, Escape and backdrop click; confirm focus returns to the trigger.
