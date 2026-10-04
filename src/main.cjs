const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  Notification,
  globalShortcut,
  screen,
} = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { initial, rollover, transition } = require("./state.cjs");

app.commandLine.appendSwitch("ozone-platform", "x11");
const userDataDirectory = process.env.DAILY_FOCUS_DATA_DIR
  ? path.resolve(process.env.DAILY_FOCUS_DATA_DIR)
  : path.join(app.getPath("appData"), "daily-focus");
fs.mkdirSync(userDataDirectory, { recursive: true });
app.setPath("userData", userDataDirectory);
let main,
  widget,
  tray,
  state,
  quitting = false;
const single = app.requestSingleInstanceLock();
if (!single) app.quit();
app.on("second-instance", () => {
  main?.show();
  main?.focus();
});
app.on("before-quit", () => {
  quitting = true;
});
app.on("window-all-closed", () => {});
app.on("will-quit", () => globalShortcut.unregisterAll());
const statePath = () => path.join(app.getPath("userData"), "tasks.json");
function save() {
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.writeFileSync(`${statePath()}.tmp`, JSON.stringify(state, null, 2), {
    mode: 0o600,
  });
  fs.renameSync(`${statePath()}.tmp`, statePath());
}
function publish() {
  save();
  for (const win of [main, widget])
    if (win && !win.isDestroyed()) win.webContents.send("state:changed", state);
  tray?.setToolTip(
    state.tasks.find((t) => t.status === "running")?.title ||
      "FocusFlow · Break time",
  );
}
function remind() {
  main.show();
  if (Notification.isSupported())
    new Notification({
      title: "Hôm nay bạn muốn làm gì?",
      body: "Lên danh sách công việc và chọn một việc để bắt đầu.",
      icon: path.join(__dirname, "icon.png"),
    }).show();
}
function createWindow(isWidget) {
  const area = screen.getPrimaryDisplay().workArea;
  const win = new BrowserWindow({
    width: isWidget ? 370 : 1200,
    height: isWidget ? 196 : 800,
    minWidth: isWidget ? 370 : 780,
    minHeight: isWidget ? 196 : 580,
    ...(isWidget ? { x: area.x + area.width - 394, y: area.y + 32 } : {}),
    frame: !isWidget,
    resizable: !isWidget,
    maximizable: !isWidget,
    minimizable: !isWidget,
    alwaysOnTop: isWidget,
    skipTaskbar: isWidget,
    backgroundColor: "#f5f4ef",
    title: "FocusFlow",
    icon: path.join(__dirname, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  if (isWidget) {
    win.setAlwaysOnTop(true, "floating");
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  win.on("close", (event) => {
    if (!quitting) {
      event.preventDefault();
      win.hide();
    }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  win.loadFile(path.join(__dirname, isWidget ? "widget.html" : "index.html"));
  return win;
}
if (single)
  app.whenReady().then(() => {
    try {
      state = JSON.parse(fs.readFileSync(statePath(), "utf8"));
      if (
        state.version !== 1 ||
        !Array.isArray(state.tasks) ||
        !Array.isArray(state.history)
      )
        throw new Error("Unsupported state");
    } catch (error) {
      if (fs.existsSync(statePath()))
        fs.copyFileSync(statePath(), `${statePath()}.backup-${Date.now()}`);
      state = initial();
    }
    state = rollover(state);
    save();
    main = createWindow(false);
    widget = createWindow(true);
    tray = new Tray(path.join(__dirname, "icon.png"));
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: "Mở danh sách công việc",
          click: () => {
            main.show();
            main.focus();
          },
        },
        { label: "Hiện cửa sổ nổi", click: () => widget.show() },
        { label: "Ẩn cửa sổ nổi", click: () => widget.hide() },
        { type: "separator" },
        { label: "Thoát ứng dụng", click: () => app.quit() },
      ]),
    );
    tray.on("click", () => {
      main.show();
      main.focus();
    });
    globalShortcut.register("CommandOrControl+Shift+F", () =>
      widget.isVisible() ? widget.hide() : widget.show(),
    );
    ipcMain.handle("state:get", () => state);
    ipcMain.handle("state:act", (_, action, payload) => {
      try {
        state = transition(state, action, payload);
        publish();
        return { ok: true, state };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    });
    ipcMain.handle("window:act", (_, action) => {
      if (action === "show-main") {
        main.show();
        main.focus();
      }
      if (action === "hide-widget") widget.hide();
      if (action === "show-widget") widget.show();
    });
    ipcMain.handle("autostart:set", (_, enabled) => {
      try {
        if (typeof enabled !== "boolean")
          throw new Error("Giá trị không hợp lệ.");
        if (!app.isPackaged)
          throw new Error("Cài bản .deb trước khi bật khởi động cùng Ubuntu.");
        const target = path.join(
          process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
          "autostart",
          "daily-focus.desktop",
        );
        if (enabled) {
          fs.mkdirSync(path.dirname(target), { recursive: true });
          const executable = process.execPath.replace(/[\\"`$]/g, "\\$&");
          fs.writeFileSync(
            target,
            `[Desktop Entry]\nType=Application\nName=FocusFlow\nExec="${executable}" --ozone-platform=x11\nX-GNOME-Autostart-enabled=true\n`,
          );
        } else if (fs.existsSync(target)) fs.unlinkSync(target);
        state.autostart = enabled;
        publish();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    });
    publish();
    if (!state.planned) remind();
    setInterval(() => {
      const updated = rollover(state);
      if (updated !== state) {
        state = updated;
        publish();
        remind();
      }
    }, 15000);
    // Only the integration runner sets this; normal users retain their windows.
    if (process.env.DAILY_FOCUS_SMOKE === "1") {
      const timeout = setTimeout(() => {
        console.error("Desktop smoke timed out");
        app.exit(1);
      }, 20000);
      Promise.all(
        [main, widget].map(
          (win) =>
            new Promise((resolve) =>
              win.webContents.once("did-finish-load", resolve),
            ),
        ),
      ).then(async () => {
        try {
          await main.webContents.executeJavaScript(`new Promise(resolve => {
          const check = () => {if(document.documentElement.dataset.ready==='true') resolve(); else setTimeout(check,20);}; check();
        })`);
          const result = await main.webContents
            .executeJavaScript(`(async () => {
          document.querySelector('#plan-dialog').close();
          await window.dailyFocus.act('add', 'Desktop smoke task');
          let state = await window.dailyFocus.get();
          await window.dailyFocus.act('start', state.tasks[0].id);
          return await window.dailyFocus.get();
        })()`);
          if (result.tasks[0].status !== "running")
            throw new Error("Task failed to start");
          const label = await widget.webContents
            .executeJavaScript(`new Promise(resolve => {
          const check = () => {const text = document.querySelector('#task-title').textContent;
            if (text === 'Desktop smoke task') resolve(text); else setTimeout(check, 20);}; check();
        })`);
          if (label !== "Desktop smoke task")
            throw new Error("Widget did not update");
          await main.webContents.executeJavaScript(`new Promise(resolve => {
          const check = () => {if (document.querySelector('#current-title').textContent === 'Desktop smoke task') requestAnimationFrame(() => requestAnimationFrame(resolve)); else setTimeout(check,20);}; check();
        })`);
          if (!widget.isAlwaysOnTop())
            throw new Error("Widget should be always on top");
          fs.writeFileSync(
            path.join(app.getPath("userData"), "main.png"),
            (await main.webContents.capturePage()).toPNG(),
          );
          fs.writeFileSync(
            path.join(app.getPath("userData"), "widget.png"),
            (await widget.webContents.capturePage()).toPNG(),
          );
          widget.close();
          if (widget.isDestroyed() || widget.isVisible())
            throw new Error("Close should hide the widget");
          widget.show();
          await widget.webContents.executeJavaScript(
            'document.querySelector("#widget-action").click()',
          );
          await widget.webContents.executeJavaScript(`new Promise(resolve => {
          const check = () => {if (document.querySelector('#task-title').textContent === 'Break time') resolve(); else setTimeout(check,20);}; check();
        })`);
          const taskState = await widget.webContents.executeJavaScript(
            "window.dailyFocus.get()",
          );
          if (taskState.tasks[0].status !== "done")
            throw new Error("Task failed to finish");
          main.setContentSize(1200, 630);
          await main.webContents.executeJavaScript(`new Promise(resolve => {
          const check = () => {if (!document.querySelector('#break-view').hidden) requestAnimationFrame(() => requestAnimationFrame(resolve)); else setTimeout(check,20);}; check();
        })`);
          const navigation = await main.webContents.executeJavaScript(`(() => {
          document.querySelector('#pause-break').click();
          const paused=document.querySelector('#pause-break span').textContent==='Resume timer';
          document.querySelector('#pause-break').click();
          document.querySelector('#choose-task').click();
          const daily=!document.querySelector('#daily-view').hidden;
          document.querySelector('#settings-open').click();
          const settings=document.querySelector('#settings-dialog').open;
          document.querySelector('#settings-close').click();
          document.querySelector('#view-break').click();
          return paused && daily && settings;
        })()`);
          if (!navigation)
            throw new Error("Break/navigation/settings controls failed");
          await main.webContents.executeJavaScript(
            "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
          );
          fs.writeFileSync(
            path.join(app.getPath("userData"), "break.png"),
            (await main.webContents.capturePage()).toPNG(),
          );
          const persisted = JSON.parse(fs.readFileSync(statePath(), "utf8"));
          if (persisted.tasks[0].status !== "done")
            throw new Error("Completion was not saved");
          if (app.isPackaged) {
            const enabled = await main.webContents.executeJavaScript(
              "window.dailyFocus.autostart(true)",
            );
            if (!enabled.ok) throw new Error(enabled.error);
            const desktopFile = path.join(
              process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
              "autostart",
              "daily-focus.desktop",
            );
            if (
              !fs.readFileSync(desktopFile, "utf8").includes(process.execPath)
            )
              throw new Error("Autostart entry missing");
            const disabled = await main.webContents.executeJavaScript(
              "window.dailyFocus.autostart(false)",
            );
            if (!disabled.ok || fs.existsSync(desktopFile))
              throw new Error("Autostart entry not removed");
          }
          clearTimeout(timeout);
          console.log(
            "DESKTOP_SMOKE_PASSED: renderer, IPC, running widget, completion, hide/reopen",
          );
          app.exit(0);
        } catch (error) {
          console.error(error);
          app.exit(1);
        }
      });
    }
  });
