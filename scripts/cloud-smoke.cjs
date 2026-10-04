// Integration runner for an isolated cloud container, never a production launcher.
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const runtime = path.join(root, ".runtime");
fs.mkdirSync(runtime, { recursive: true });
const data = fs.mkdtempSync(path.join(runtime, "desktop-test-"));
const log = fs.openSync(path.join(data, "desktop.log"), "w");
let server, child;
function cleanup() {
  child?.kill("SIGTERM");
  server?.kill("SIGTERM");
}
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});
const timeout = setTimeout(() => {
  console.error("Desktop test timed out");
  cleanup();
  process.exit(1);
}, 45000);
async function display() {
  if (process.env.DISPLAY) return process.env.DISPLAY;
  const config = path.join(data, "xorg.conf");
  fs.writeFileSync(
    config,
    `Section "ServerFlags"
 Option "AutoAddDevices" "false"
 Option "AutoEnableDevices" "false"
EndSection
Section "Device"
 Identifier "Dummy"
 Driver "dummy"
 VideoRam 256000
EndSection
Section "Monitor"
 Identifier "Monitor"
 HorizSync 5.0-1000.0
 VertRefresh 5.0-200.0
 Modeline "1280x800" 83.5 1280 1352 1480 1680 800 803 809 831
EndSection
Section "Screen"
 Identifier "Screen"
 Device "Dummy"
 Monitor "Monitor"
 DefaultDepth 24
 SubSection "Display"
  Depth 24
  Modes "1280x800"
 EndSubSection
EndSection
`,
  );
  return new Promise((resolve, reject) => {
    server = spawn(
      "Xorg",
      [
        "-displayfd",
        "3",
        "-config",
        config,
        "-logfile",
        path.join(data, "xorg.log"),
        "-nolisten",
        "tcp",
        "-noreset",
      ],
      { stdio: ["ignore", log, log, "pipe"] },
    );
    server.on("error", reject);
    server.once("exit", (code) =>
      reject(new Error(`Xorg exited before startup (${code})`)),
    );
    let received = "";
    server.stdio[3].on("data", (chunk) => {
      received += chunk;
      if (/^\d+\n/.test(received)) resolve(`:${received.trim()}`);
    });
  });
}
(async () => {
  try {
    const targetDisplay = await display();
    const packaged = process.argv.includes("--packaged");
    const executable = packaged
      ? path.join(root, "dist/linux-unpacked/daily-focus")
      : path.join(root, "node_modules/electron/dist/electron");
    const args = packaged ? [] : [root];
    // This container has read-only UID maps and cannot enable Chromium's sandbox.
    // The installed .deb and npm start do not include these test-only flags.
    args.push("--ozone-platform=x11", "--no-sandbox", "--disable-gpu");
    const env = {
      ...process.env,
      DISPLAY: targetDisplay,
      DAILY_FOCUS_DATA_DIR: data,
      DAILY_FOCUS_SMOKE: "1",
      XDG_CACHE_HOME: path.resolve(root, "../.cache"),
      XDG_CONFIG_HOME: path.join(data, "config"),
    };
    const code = await new Promise((resolve, reject) => {
      child = spawn("dbus-run-session", ["--", executable, ...args], {
        cwd: root,
        env,
        stdio: ["ignore", log, log],
      });
      child.on("error", reject);
      child.on("exit", (code) => resolve(code ?? 1));
    });
    const output = fs.readFileSync(path.join(data, "desktop.log"), "utf8");
    const passed = output.includes("DESKTOP_SMOKE_PASSED");
    if (code !== 0 || !passed) {
      console.error(output.split("\n").slice(-25).join("\n"));
      process.exitCode = code || 1;
    } else {
      console.log(
        `${packaged ? "PACKAGED" : "DEVELOPMENT"}_DESKTOP_SMOKE_PASSED`,
      );
      console.log(`Test data and screenshots: ${data}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    clearTimeout(timeout);
    cleanup();
    fs.closeSync(log);
  }
})();
