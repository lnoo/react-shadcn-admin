# alert-dialog

2026-11-20 · transformation engine. Verdict: Base UI AlertDialog primitives; `Action` → `Button`, `Cancel` → `Close` rendered as Button.

## Changed

- `src/components/ui/alert-dialog.tsx`: `@base-ui/react/alert-dialog`; `Overlay` → `Backdrop`, `Content` → `Popup`; `AlertDialogAction` renders the repo `Button`; `AlertDialogCancel` renders `Close render={<Button variant='outline'/>}`; `data-closed` / `data-open` classes.
- `src/features/users/components/users-delete-dialog.test.tsx`: exact-argument callback assertion changed to check the first argument only.

## Left alone

- `sonner` toaster (not Radix).

## Behavior changes

- `AlertDialogAction` no longer has a Radix "action" primitive that auto-closes the dialog; it is a plain Button (matches the shadcn Base UI registry). Confirm app logic closes explicitly where needed.
- `onOpenChange` receives `(open, eventDetails)`.

## Verify by hand

- Open the delete-user confirmation, click Cancel and confirm, press Escape; verify dismissal and submitted callback.
