import { api, BASE_URL } from "../lib/api.js";

/**
 * Get speaking phrases
 * @param {Object} params
 * @param {string} [params.level] - JLPT level (N5, N4, N3, N2, N1)
 * @param {string} [params.topic] - Topic filter
 * @param {number} [params.limit] - Number of results
 * @param {number} [params.offset] - Offset for pagination
 * @returns {Promise<{phrases: Array, total: number}>}
 */
export async function getSpeakingPhrases({ level, topic, limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (level) params.append("level", level);
  if (topic) params.append("topic", topic);
  params.append("limit", limit);
  params.append("offset", offset);
  
  return api(`/api/speaking/phrases?${params.toString()}`);
}

/**
 * Get speaking phrase detail by ID
 * @param {number} id - Phrase ID
 * @returns {Promise<Object>}
 */
export async function getSpeakingPhraseDetail(id) {
  return api(`/api/speaking/phrases/${id}`);
}

/**
 * Practice speaking - upload audio and get score
 * @param {File} audioFile - Audio file to upload
 * @param {number} phraseId - Phrase ID to practice
 * @returns {Promise<Object>}
 */
export async function practiceSpeaking(audioFile, phraseId) {
  const formData = new FormData();
  formData.append("audio", audioFile);
  formData.append("phraseId", phraseId.toString());

  return api("/api/speaking/practice", {
    method: "POST",
    body: formData,
  });
}

/**
 * Get speaking attempts history (requires auth)
 * @param {Object} params
 * @param {number} [params.limit] - Number of results
 * @param {number} [params.offset] - Offset for pagination
 * @returns {Promise<{attempts: Array, total: number}>}
 */
export async function getSpeakingAttempts({ limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams();
  params.append("limit", limit);
  params.append("offset", offset);
  
  return api(`/api/speaking/attempts?${params.toString()}`);
}

/**
 * Get speaking statistics (requires auth)
 * @returns {Promise<Object>}
 */
export async function getSpeakingStats() {
  return api("/api/speaking/stats");
}

/**
 * Generate audio for a speaking phrase
 * @param {number} phraseId - Phrase ID
 * @returns {Promise<{audioUrl: string}>}
 */
export async function generatePhraseAudio(phraseId) {
  return api(`/api/speaking/phrases/${phraseId}/generate-audio`, {
    method: "POST",
  });
}

