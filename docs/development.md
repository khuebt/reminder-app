# FocusFlow for Ubuntu

A local desktop task app with a draggable, always-on-top focus window. Task management is in Vietnamese; navigation and Break Mode use English. Your tasks stay on your computer; no account or online service is needed.

## Install on Ubuntu

Download `daily-focus_0.1.0_amd64.deb` from the build output, then install it:

```sh
sudo apt install ./daily-focus_0.1.0_amd64.deb
```

Open **FocusFlow** from the applications menu. The package is for Ubuntu on x86-64; an ARM package has not been built or tested.

## Daily workflow

- On the first launch each local calendar day, enter your tasks, one per line. The app also prompts when it stays running into a new day. It cannot send reminders while it is not running.
- Add more tasks anytime. Select **Bắt đầu** to run one. Starting another task pauses the previous one and keeps its elapsed time.
- The floating window shows the active task and elapsed time. Drag its top bar to move it. Click **Hoàn thành** to complete the task and open the list to choose the next one.
- Until you choose another task, the floating window displays **Break time**. **Tạm nghỉ** pauses a task without completing it.
- **−** hides the floating window. There is no close button. OS close requests hide it instead of destroying it. Restore it through the task list, tray menu, or **Ctrl+Shift+F**.
- Closing the main window hides it as well. To stop the app deliberately, use **Thoát ứng dụng** in the tray menu.
- After installing the package, enable **Start when I log in to Ubuntu** to start the app when you log in. This controls your user's autostart entry, not a system service.

At midnight, yesterday's list is archived locally and a fresh list begins. The last 90 daily lists are retained in the data file; a history screen is not included yet. Incomplete tasks are not carried into the new day. A running task remains running across app restarts on the same day, including its elapsed time.

## Ubuntu desktop behavior

The app uses X11, including XWayland on Ubuntu Wayland sessions, for window placement and the always-on-top setting. The desktop/window manager ultimately controls stacking; full-screen applications, screen locks, and some Wayland configurations can override it. If the window cannot stay above other applications, try the **Ubuntu on Xorg** login session.

Ubuntu normally provides tray support through AppIndicator. If your desktop hides tray icons, reopen the app from the applications menu to restore the task list. The shortcut can also conflict with an existing system shortcut.

Tasks are stored in Electron's user-data directory (normally `~/.config/daily-focus/tasks.json`). For testing only, `DAILY_FOCUS_DATA_DIR` selects a separate directory. Updates are written through a temporary file; unreadable data is backed up before a fresh list is created.

## Development

Requires Node.js 22.12+ (Node 24 tested), npm, and a Linux graphical session. Use the existing checkout; each cloud task is isolated and does not need a Git worktree.

```sh
cd /workspace/reminder-app
npm ci
npx --no install-electron
npm test
npm start
```

For cloud machines with a read-only home, use writable caches:

```sh
export npm_config_cache=/workspace/.npm-cache
export electron_config_cache=/workspace/.cache/electron
export XDG_CACHE_HOME=/workspace/.cache
export ELECTRON_BUILDER_CACHE=/workspace/.cache/electron-builder
export NODE_USE_ENV_PROXY=1
npm ci
npx --no install-electron
npm test
npm run dist
```

`npm run dist` builds the `.deb` installer in `dist/`. `npm run pack` builds an unpacked app. Electron-builder generates the Debian installation hooks for Chromium's sandbox and Ubuntu AppArmor support. Production launch commands keep sandboxing enabled.

## Validation

`npm test` exercises task switching, elapsed-time accounting, pause/resume, completion, local-day rollover, and invalid actions.

In this cloud environment, run `npm run test:desktop` for the development app or `npm run test:desktop -- --packaged` after building. The runner creates its own temporary Xorg display when needed, uses a fresh test data directory, and stops the display it started. It requires Xorg's dummy driver and `dbus-run-session`, both provided by this environment.

The development-only `DAILY_FOCUS_SMOKE=1` runner exercises actual Electron renderers, IPC, the running widget, completion to Break time, persistence, and hiding/reopening on a fresh test data directory. It writes window captures beside its test data. Never set this on your real data directory: it adds and finishes a sample task and exits the app. On packaged builds it additionally tests creating and removing a user autostart entry.

Cloud GUI validation uses a local dummy X server. This isolated cloud container cannot configure Chromium's SUID sandbox or user namespaces, so its smoke invocation uses `--no-sandbox --disable-gpu` only for that test. These flags are not in normal startup or the Ubuntu installer. The cloud lacks a desktop notification service; the daily in-app dialog is verified, but native notifications and actual Ubuntu session behavior require a check on your Ubuntu machine.

The interface now follows the supplied MagicPath project, “Daily Setup” by Ken Tran: a dark sidebar, Ubuntu orange accents, and an aubergine Break Mode screen. Visual comparison uses its 1200×630 public preview of Break Mode; the other screens and floating widget use the same palette but were not visible in that reference. The rest timer counts down from five minutes and supports pause/resume within the current app session; reaching zero keeps the app in Break time until you start a task. Tasks and daily planning remain in Vietnamese, with English navigation and Break Mode copy matching the reference.
