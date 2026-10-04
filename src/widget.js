let state;
const $ = (id) => document.getElementById(id);
const current = () => state?.tasks.find((t) => t.status === "running");
function tick() {
  if (!state) return;
  const task = current(),
    s = Math.max(
      0,
      Math.floor(
        (task
          ? task.elapsed + Date.now() - task.startedAt
          : Date.now() - state.breakSince) / 1000,
      ),
    );
  $("widget-clock").textContent =
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
function render(next) {
  state = next;
  const task = current();
  $("task-title").textContent = task?.title || "Break time";
  $("task-title").title = task?.title || "Break time";
  $("widget-status").textContent = task ? "● ĐANG TẬP TRUNG" : "● ĐANG NGHỈ";
  document.querySelector(".widget").classList.toggle("break-widget", !task);
  $("widget-symbol").replaceChildren(
    Object.assign(document.createElement("img"), {
      src: task ? "assets/icons/circle-play.svg" : "assets/icons/coffee.svg",
      alt: "",
    }),
  );
  $("widget-description").textContent = task
    ? "Từng chút một, bạn đang tiến bộ."
    : "Nghỉ một chút, rồi tiếp tục nhé.";
  $("widget-action").textContent = task ? "✓ Hoàn thành" : "Chọn việc →";
  tick();
}
$("hide").onclick = () => window.dailyFocus.window("hide-widget");
$("open").onclick = () => window.dailyFocus.window("show-main");
$("widget-action").onclick = async () => {
  const task = current();
  if (task) {
    const result = await window.dailyFocus.act("finish", task.id);
    if (result.ok) render(result.state);
  }
  window.dailyFocus.window("show-main");
};
window.dailyFocus.subscribe(render);
window.dailyFocus.get().then(render);
setInterval(tick, 1000);
