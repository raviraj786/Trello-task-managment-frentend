const prefix = "kanban_board_v1::";

export function saveTasksToLocal(projectId, tasks) {
  try {
    localStorage.setItem(prefix + projectId, JSON.stringify(tasks));
    console.log("localTaskSync: saved to localStorage", projectId);
  } catch (err) {
    console.error("localTaskSync: save error", err);
  }
}

export function loadTasksFromLocal(projectId) {
  try {
    const raw = localStorage.getItem(prefix + projectId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    console.log("localTaskSync: loaded from localStorage", projectId);
    return parsed;
  } catch (err) {
    console.error("localTaskSync: load error", err);
    return null;
  }
}

export function clearLocal(projectId) {
  try {
    localStorage.removeItem(prefix + projectId);
    console.log("localTaskSync: cleared", projectId);
  } catch (err) {
    console.error("localTaskSync: clear error", err);
  }
}
