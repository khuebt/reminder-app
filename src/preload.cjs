const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("dailyFocus", {
  get: () => ipcRenderer.invoke("state:get"),
  act: (action, payload) => ipcRenderer.invoke("state:act", action, payload),
  window: (action) => ipcRenderer.invoke("window:act", action),
  autostart: (enabled) => ipcRenderer.invoke("autostart:set", enabled),
  subscribe: (callback) => {
    const listener = (_, state) => callback(state);
    ipcRenderer.on("state:changed", listener);
    return () => ipcRenderer.removeListener("state:changed", listener);
  },
});
