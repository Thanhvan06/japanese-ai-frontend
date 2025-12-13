import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchAll } from "../services/search.service";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

/** Hook đọc querystring ổn định */
function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

/** Escape và highlight an toàn */
const escapeRegExp = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlight = (text = "", q = "") => {
  if (!q) return text;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    return String(text).replace(re, "<mark>$1</mark>");
  } catch {
    return text;
  }
};

/** Tạo key ổn định để dedupe + render */
const getItemKey = (it) => {
  const id = it.vocab_id ?? it.grammar_id ?? it.id ?? it.slug ?? "";
  return `${it._type || "unknown"}:${id || JSON.stringify(it)}`;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "vocab", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
];

const SearchPage = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const q = (query.get("q") || "").trim();
  const type = query.get("type") || "all";

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // cache theo (q,type) để back/forward nhanh hơn, giảm call API
  const cacheRef = useRef(new Map());
  // dùng để debounce & tránh race condition
  const reqIdRef = useRef(0);

  const onSubmitFilter = useCallback(
    (newType) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("type", newType);
      navigate(`/search?${params.toString()}`);
    },
    [navigate, q]
  );

  useEffect(() => {
    if (!q) {
      setItems([]);
      setLoading(false);
      return;
    }

    const cacheKey = `${q}__${type}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setItems(cached);
      return;
    }

    const currentReqId = ++reqIdRef.current;
    setLoading(true);

    // debounce nhẹ để không spam API khi user gõ nhanh
    const t = setTimeout(() => {
      (async () => {
        try {
          const res = await searchAll({ q, type });
          // nếu có request mới hơn, bỏ kết quả cũ
          if (reqIdRef.current !== currentReqId) return;

          const list = Array.isArray(res?.items) ? res.items : [];

          // dedupe ổn định theo key
          const seen = new Set();
          const unique = [];
          for (const it of list) {
            const k = getItemKey(it);
            if (!seen.has(k)) {
              seen.add(k);
              unique.push(it);
            }
          }

          cacheRef.current.set(cacheKey, unique);
          setItems(unique);
        } catch (err) {
          if (reqIdRef.current !== currentReqId) return;
          console.error(err);
          setItems([]);
        } finally {
          if (reqIdRef.current === currentReqId) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      clearTimeout(t);
    };
  }, [q, type]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="mb-4 text-2xl font-semibold">Search</h1>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => onSubmitFilter(f.key)}
                  className={`px-3 py-1 rounded ${
                    type === f.key ? "bg-[#77bef0] text-white" : "bg-gray-100"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="mb-3 text-sm text-gray-500">
              Search results: {q}
            </div>
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
            {!loading && items.length === 0 && (
              <div className="text-sm text-gray-500">No results</div>
            )}

            <div className="space-y-6">
              {items.map((it) => {
                const itemKey = getItemKey(it);
                return (
                  <div
                    key={itemKey}
                    className="p-4 bg-white border border-gray-200 rounded"
                  >
                    {it._type === "vocab" ? (
                      <div>
                        <div
                          className="mb-1 text-3xl font-bold"
                          dangerouslySetInnerHTML={{
                            __html: highlight(it.word, q),
                          }}
                        />
                        <div className="mb-2 text-lg text-gray-600">
                          {it.furigana} • {it.meaning}
                        </div>
                        <div className="mb-2 text-sm text-gray-500">
                          JLPT: {it.jlpt_level}
                          {it.topic ? ` • Topic: ${it.topic.topic_name}` : ""}
                        </div>
                        {it.image_url && (
                          <img
                            src={it.image_url}
                            alt={it.word}
                            className="object-cover w-40 h-40 mb-2 rounded"
                            loading="lazy"
                          />
                        )}
                      </div>
                    ) : (
                      <div>
                        <div
                          className="mb-1 text-2xl font-bold"
                          dangerouslySetInnerHTML={{
                            __html: highlight(it.grammar_structure, q),
                          }}
                        />
                        <div className="mb-2 text-sm text-gray-500">
                          JLPT: {it.jlpt_level}
                        </div>
                        <div
                          className="mb-2 text-gray-800"
                          dangerouslySetInnerHTML={{
                            __html: highlight(it.explanation_viet || "", q),
                          }}
                        />
                        {it.example_jp && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-700">例文</div>
                            <div className="italic">{it.example_jp}</div>
                            {it.example_viet && (
                              <div className="text-sm text-gray-600">
                                {it.example_viet}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SearchPage;
