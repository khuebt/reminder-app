# FocusFlow visual comparison

Final result: passed for the available Break Mode reference.

Reference: the 1200×630 public preview of the MagicPath project **Daily Setup** by Ken Tran. Actual: `docs/images/break-mode.png`, captured from the packaged Electron app at 1200×630 with Break Mode active and dialogs closed.

The comparison covers the visible portion of Break Mode only. The reference does not show the other screens, a running task, or the floating window; those use the same design language and are not claimed as faithful recreations of unseen views.

## Checked

- Dark 256 px sidebar, orange active navigation, menu labels and bottom profile area.
- White 64 px app header, Ubuntu branding, purple mode badge and local date/time.
- Break introduction at x=320, large two-line headline, purple second line, supporting text and orange action.
- Purple reset card at x=771, y=120, width 365, height 410, rounded corners and soft shadow.
- Reset heading, timer label, countdown, message, divider and pause control.
- Tip card below the reset card; local Ubuntu font and supplied Lucide icons.

No remaining P0/P1/P2 issues were found in this scope. Minor differences: the screenshot reflects the actual running countdown (04:59 instead of the reference's static 05:00) and current device clock; a generic local workspace label replaces the reference's sample persona. Timer glyph widths and icon strokes are close rather than exact.

## Functional evidence

Four state tests passed. The Electron development and packaged smoke runs passed task start, renderer/IPC updates, always-on-top property, completion to Break time, persisted completion, hiding/reopening, break pause/resume, screen navigation and Settings. The packaged run also passed user autostart creation/removal.

Validation used a dummy local X server with sandbox disabled only for that isolated test invocation. Native notifications, actual drag/stacking behavior and installation into a real Ubuntu session remain on-device checks. Normal launch and the Debian installer retain sandboxing.
