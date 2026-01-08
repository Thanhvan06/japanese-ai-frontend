import { api } from "../lib/api.js";

/**
 * Get grammar rules by level
 * @param {string} level - JLPT level (N5, N4, N3, N2, N1)
 * @returns {Promise<{items: Array}>}
 */
export async function getGrammarByLevel(level) {
  return api(`/api/grammar?level=${level}`);
}

/**
 * Get grammar detail by ID
 * @param {number} id - Grammar ID
 * @returns {Promise<Object>}
 */
export async function getGrammarDetail(id) {
  return api(`/api/grammar/${id}`);
}

/**
 * Get grammar exercises
 * @param {Object} params
 * @param {string} params.level - JLPT level (N5-N1)
 * @param {string} params.question_type - 'multiple_choice' | 'sentence_arrangement'
 * @param {number} params.limit - Number of exercises to return
 * @param {Array<number>} [params.grammar_ids] - Optional array of grammar IDs to filter
 * @returns {Promise<Array>}
 */
export async function getGrammarExercises({ level, question_type, limit, grammar_ids }) {
  const params = new URLSearchParams();
  params.append("level", level);
  params.append("question_type", question_type);
  params.append("limit", limit || 20);
  
  if (grammar_ids && grammar_ids.length > 0) {
    grammar_ids.forEach(id => {
      params.append("grammar_ids[]", id);
    });
  }
  
  return api(`/api/grammar/exercises?${params.toString()}`);
}

