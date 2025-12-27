import { api } from "../lib/api.js";

const BASE = "/api/personal-room";

// Get personal room state (theme, playlist, todos, active_timer)
export async function getPersonalRoomState() {
  return api(`${BASE}/state`);
}

// Update personal room state (theme, playlist)
export async function updatePersonalRoomState({ theme, playlist }) {
  return api(`${BASE}/state`, {
    method: "PUT",
    body: JSON.stringify({ theme, playlist }),
  });
}

// Todo CRUD
export async function listTodos() {
  return api(`${BASE}/todos`);
}

export async function createTodo({ title, timerDuration }) {
  return api(`${BASE}/todos`, {
    method: "POST",
    body: JSON.stringify({ title, timerDuration }),
  });
}

export async function updateTodo(todoId, { title, status, timerDuration }) {
  return api(`${BASE}/todos/${todoId}`, {
    method: "PATCH",
    body: JSON.stringify({ title, status, timerDuration }),
  });
}

// Timer APIs
export async function startTodoTimer(todoId, timerDuration) {
  return api(`${BASE}/todos/${todoId}/timer/start`, {
    method: "POST",
    body: JSON.stringify({ timerDuration }),
  });
}

export async function stopTodoTimer(todoId, markDone) {
  return api(`${BASE}/todos/${todoId}/timer/end`, {
    method: "POST",
    body: JSON.stringify({ markDone }),
  });
}

// Weekly study stats
export async function getWeeklyStudyStats() {
  return api(`${BASE}/study-stats/weekly`);
}

