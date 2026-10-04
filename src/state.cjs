const { randomUUID } = require("node:crypto");

function dayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function initial(now = new Date()) {
  return {
    version: 1,
    date: dayKey(now),
    tasks: [],
    history: [],
    planned: false,
    breakSince: now.getTime(),
    autostart: false,
  };
}
function rollover(state, now = new Date()) {
  if (state.date === dayKey(now)) return state;
  const end = new Date(`${state.date}T00:00:00`);
  end.setDate(end.getDate() + 1);
  const archived = state.tasks.map((task) =>
    task.status === "running"
      ? {
          ...task,
          status: "pending",
          elapsed: task.elapsed + Math.max(0, end.getTime() - task.startedAt),
          startedAt: null,
        }
      : { ...task },
  );
  return {
    ...initial(now),
    autostart: state.autostart,
    history: [...state.history, { date: state.date, tasks: archived }].slice(
      -90,
    ),
  };
}
function transition(original, action, payload, now = new Date()) {
  const state = structuredClone(rollover(original, now));
  const task = state.tasks.find((t) => t.id === payload);
  switch (action) {
    case "add": {
      if (
        typeof payload !== "string" ||
        !payload.trim() ||
        payload.trim().length > 200
      )
        throw new Error("Nhập tên công việc từ 1 đến 200 ký tự.");
      state.tasks.push({
        id: randomUUID(),
        title: payload.trim(),
        status: "pending",
        elapsed: 0,
        startedAt: null,
      });
      break;
    }
    case "start": {
      if (!task || task.status === "done")
        throw new Error("Không thể bắt đầu công việc này.");
      for (const t of state.tasks)
        if (t.status === "running") {
          t.elapsed += Math.max(0, now.getTime() - t.startedAt);
          t.status = "pending";
          t.startedAt = null;
        }
      task.status = "running";
      task.startedAt = now.getTime();
      state.planned = true;
      break;
    }
    case "finish": {
      if (!task || task.status !== "running")
        throw new Error("Chọn công việc đang chạy để hoàn thành.");
      task.elapsed += Math.max(0, now.getTime() - task.startedAt);
      task.startedAt = null;
      task.status = "done";
      state.breakSince = now.getTime();
      break;
    }
    case "break": {
      for (const t of state.tasks)
        if (t.status === "running") {
          t.elapsed += Math.max(0, now.getTime() - t.startedAt);
          t.status = "pending";
          t.startedAt = null;
        }
      state.breakSince = now.getTime();
      break;
    }
    case "delete":
      if (!task || task.status === "running")
        throw new Error("Tạm nghỉ trước khi xóa công việc đang chạy.");
      state.tasks = state.tasks.filter((t) => t.id !== payload);
      break;
    case "planned":
      state.planned = true;
      break;
    default:
      throw new Error("Thao tác không hợp lệ.");
  }
  return state;
}
module.exports = { dayKey, initial, rollover, transition };
