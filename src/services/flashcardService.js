import { api } from "../lib/api.js";

const BASE = "/api/flashcards";

// ------- Folder APIs -------
export async function listFolders() {
  return api(`${BASE}/folders`);
}

export async function createFolder(folderName) {
  return api(`${BASE}/folders`, {
    method: "POST",
    body: JSON.stringify({ folderName })
  });
}

export async function removeFolder(folderId) {
  return api(`${BASE}/folders/${folderId}`, { method: "DELETE" });
}

// ------- Set APIs -------
export async function listSets(folderId) {
  const query = folderId ? `?folderId=${folderId}` : "";
  return api(`${BASE}/sets${query}`);
}

export async function getSet(setId) {
  return api(`${BASE}/sets/${setId}`);
}

export async function createSet(setName, folderId) {
  return api(`${BASE}/sets`, {
    method: "POST",
    body: JSON.stringify({
      setName,
      folderId: folderId ?? null
    })
  });
}

export async function updateSet(setId, { setName, folderId }) {
  return api(`${BASE}/sets/${setId}`, {
    method: "PUT",
    body: JSON.stringify({
      ...(setName !== undefined ? { setName } : {}),
      ...(folderId !== undefined ? { folderId } : {})
    })
  });
}

export async function removeSet(setId) {
  return api(`${BASE}/sets/${setId}`, { method: "DELETE" });
}

// ------- Card APIs -------
export async function listCards(setId) {
  return api(`${BASE}/sets/${setId}/cards`);
}

export async function createCard(setId, payload) {
  return api(`${BASE}/sets/${setId}/cards`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateCard(setId, cardId, payload) {
  return api(`${BASE}/sets/${setId}/cards/${cardId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function removeCard(setId, cardId) {
  return api(`${BASE}/sets/${setId}/cards/${cardId}`, {
    method: "DELETE"
  });
}

// ------- Study APIs -------
export async function startStudy(setId, mode = "all") {
  const params = new URLSearchParams();
  if (mode) params.set("mode", mode);
  return api(`${BASE}/sets/${setId}/study?${params.toString()}`);
}

export async function getCardAnswer(setId, cardId) {
  return api(`${BASE}/sets/${setId}/study/cards/${cardId}/answer`);
}

export async function submitStudyAnswer(setId, cardId, correct) {
  return api(`${BASE}/sets/${setId}/study/answer`, {
    method: "POST",
    body: JSON.stringify({ cardId, correct })
  });
}

export async function getStudyStats(setId) {
  return api(`${BASE}/sets/${setId}/stats`);
}

