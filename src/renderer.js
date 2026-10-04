let state,
  busy = false;
let view = "break",
  wasRunning = false,
  pauseAt = null,
  pausedTime = 0;
const $ = (id) => document.getElementById(id);
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").hidden = true), 4500);
}
async function act(action, payload) {
  if (busy) return false;
  busy = true;
  try {
    const result = await window.dailyFocus.act(action, payload);
    if (!result.ok) {
      toast(result.error);
      return false;
    }
    render(result.state);
    return true;
  } finally {
    busy = false;
  }
}
function duration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function running() {
  return state?.tasks.find((t) => t.status === "running");
}
function setView(next) {
  view = next;
  $("break-view").hidden = next !== "break";
  $("daily-view").hidden = next === "break";
  for (const mode of ["daily", "runner", "break"])
    $("view-" + mode).classList.toggle("selected", mode === next);
  const icon = document.createElement("img");
  icon.src = `assets/icons/${next === "break" ? "coffee" : next === "runner" ? "circle-play" : "layout-grid"}.svg`;
  icon.alt = "";
  $("mode-pill").replaceChildren(
    icon,
    document.createTextNode(
      next === "break"
        ? "Break Mode"
        : next === "runner"
          ? "Task Runner"
          : "Daily Setup",
    ),
  );
}
function tick() {
  if (!state) return;
  const task = running();
  $("clock").textContent = duration(
    task
      ? task.elapsed + Date.now() - task.startedAt
      : Date.now() - state.breakSince,
  );
  $("wall-clock").textContent = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  $("break-clock").textContent = duration(
    Math.max(
      0,
      300000 - ((pauseAt || Date.now()) - state.breakSince - pausedTime),
    ),
  );
}
function render(next) {
  const changedDay = state && state.date !== next.date;
  if (state && state.breakSince !== next.breakSince) {
    pauseAt = null;
    pausedTime = 0;
    $("pause-break").querySelector("span").textContent = "Pause timer";
  }
  state = next;
  const current = running(),
    done = state.tasks.filter((t) => t.status === "done").length;
  $("date").textContent = new Date(`${state.date}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short", day: "numeric", month: "short" },
  );
  if (current && !wasRunning) view = "runner";
  if (!current && wasRunning) view = "break";
  wasRunning = !!current;
  setView(view);
  $("nav-count").textContent = state.tasks.length - done;
  $("task-count").textContent = state.tasks.length;
  $("progress-label").textContent = state.tasks.length
    ? `${done} / ${state.tasks.length} đã hoàn thành`
    : "Chưa có công việc";
  $("progress").style.width =
    `${state.tasks.length ? (done / state.tasks.length) * 100 : 0}%`;
  $("autostart").checked = state.autostart;
  $("status-badge").textContent = current ? "● ĐANG TẬP TRUNG" : "● ĐANG NGHỈ";
  $("focus-label").textContent = current
    ? "MỘT VIỆC MỖI LÚC"
    : "HÍT THỞ MỘT CHÚT";
  $("current-title").textContent = current?.title || "Break time";
  $("focus-description").textContent = current
    ? "Cứ làm từng chút một. Bạn đang tiến về phía trước."
    : "Chọn một công việc bên dưới khi bạn sẵn sàng.";
  $("current-action").textContent = current
    ? "✓ Hoàn thành công việc"
    : "Hiện cửa sổ nổi ↗";
  $("empty").hidden = !!state.tasks.length;
  $("tasks").replaceChildren(
    ...state.tasks.map((task) => {
      const row = document.createElement("div");
      row.className = `task-row ${task.status}`;
      const indicator = document.createElement("span");
      indicator.className = "task-indicator";
      indicator.textContent =
        task.status === "done" ? "✓" : task.status === "running" ? "▶" : "";
      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.title;
      row.append(indicator, title);
      if (task.status === "done") {
        const meta = document.createElement("span");
        meta.className = "task-meta";
        meta.textContent = `${Math.floor(task.elapsed / 60000)} phút · Hoàn thành`;
        row.append(meta);
      } else {
        const button = document.createElement("button");
        button.className = `button ${task.status === "running" ? "primary" : "secondary"}`;
        button.textContent =
          task.status === "running" ? "Tạm nghỉ" : "Bắt đầu →";
        button.onclick = () =>
          act(task.status === "running" ? "break" : "start", task.id);
        row.append(button);
      }
      if (task.status !== "running") {
        const remove = document.createElement("button");
        remove.className = "delete";
        remove.textContent = "×";
        remove.setAttribute("aria-label", `Xóa ${task.title}`);
        remove.onclick = () => act("delete", task.id);
        row.append(remove);
      }
      return row;
    }),
  );
  tick();
  if (changedDay && !state.planned && !$("plan-dialog").open)
    $("plan-dialog").showModal();
}
$("add-form").onsubmit = async (event) => {
  event.preventDefault();
  if (await act("add", $("new-task").value)) {
    $("new-task").value = "";
    $("new-task").focus();
  }
};
$("show-widget").onclick = () => window.dailyFocus.window("show-widget");
$("view-daily").onclick = () => setView("daily");
$("view-runner").onclick = () => setView("runner");
$("view-break").onclick = async () => {
  if (running()) await act("break");
  setView("break");
};
$("choose-task").onclick = () => {
  setView("daily");
  $("new-task").focus();
};
$("pause-break").onclick = () => {
  if (pauseAt) {
    pausedTime += Date.now() - pauseAt;
    pauseAt = null;
  } else pauseAt = Date.now();
  $("pause-break").querySelector("span").textContent = pauseAt
    ? "Resume timer"
    : "Pause timer";
  tick();
};
$("settings-open").onclick = () => $("settings-dialog").showModal();
$("settings-close").onclick = () => $("settings-dialog").close();
$("current-action").onclick = () =>
  running()
    ? act("finish", running().id)
    : window.dailyFocus.window("show-widget");
$("plan-open").onclick = () => $("plan-dialog").showModal();
$("plan-skip").onclick = () => $("plan-dialog").close();
$("plan-form").onsubmit = async (event) => {
  event.preventDefault();
  const titles = $("plan-text")
    .value.split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
  if (titles.some((t) => t.length > 200)) {
    toast("Mỗi công việc tối đa 200 ký tự.");
    return;
  }
  for (const title of titles) if (!(await act("add", title))) return;
  await act("planned");
  $("plan-text").value = "";
  $("plan-dialog").close();
};
$("autostart").onchange = async (event) => {
  const result = await window.dailyFocus.autostart(event.target.checked);
  if (!result.ok) {
    toast(result.error);
    event.target.checked = state.autostart;
  }
};
window.dailyFocus.subscribe(render);
window.dailyFocus.get().then((next) => {
  render(next);
  if (!next.planned) $("plan-dialog").showModal();
  document.documentElement.dataset.ready = "true";
});
setInterval(tick, 1000);
