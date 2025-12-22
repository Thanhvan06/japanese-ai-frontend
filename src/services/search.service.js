import { api } from "../lib/api";

export const searchAll = ({ q, type = "all", limit = 20 }) => {
  // backend route is mounted under /api/search
  return api(`/api/search?q=${encodeURIComponent(q)}&type=${type}&limit=${limit}`);
};
