import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchAll } from "../services/search.service";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

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

const FILTERS = (lang) => [
  { key: "all", label: t("search.all", lang), icon: "🔍" },
  { key: "vocab", label: t("search.vocabulary", lang), icon: "📚" },
  { key: "grammar", label: t("search.grammar", lang), icon: "📖" },
];

const SearchPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const { language } = useLanguage();

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
    <div className="flex min-h-screen" style={{ backgroundColor: '#F0F8FF' }}>
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="mb-2 text-2xl font-bold" style={{ 
                background: 'linear-gradient(to right, #77BEF0, #A8D4F0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                {t("search.title", language)}
              </h1>
              <p className="text-gray-600">{t("search.subtitle", language)}</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {FILTERS(language).map((f) => (
                <button
                  key={f.key}
                  onClick={() => onSubmitFilter(f.key)}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                    type === f.key
                      ? "text-white shadow-lg scale-105"
                      : "bg-white text-gray-700 border-2 border-gray-200 hover:border-opacity-50"
                  }`}
                  style={type === f.key ? {
                    background: 'linear-gradient(to right, #77BEF0, #A8D4F0)',
                    boxShadow: '0 10px 25px rgba(119, 190, 240, 0.3)'
                  } : {
                    borderColor: '#E8F4FD'
                  }}
                  onMouseEnter={(e) => {
                    if (type !== f.key) {
                      e.currentTarget.style.borderColor = '#A8D4F0';
                      e.currentTarget.style.backgroundColor = '#E8F4FD';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (type !== f.key) {
                      e.currentTarget.style.borderColor = '#E8F4FD';
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>

            {/* Results Header */}
            {q && (
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {t("search.searching", language)}
                    </span>
                  ) : (
                    <span>
                      {t("search.foundResults", language, { count: items.length, query: q })}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 animate-pulse"
                  >
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && !q && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  {t("search.startSearching", language)}
                </h3>
                <p className="text-gray-500">
                  {t("search.startSearchingHint", language)}
                </p>
              </div>
            )}

            {!loading && q && items.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">😕</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                  {t("search.noResults", language)}
                </h3>
                <p className="text-gray-500">
                  {t("search.noResultsHint", language)}
                </p>
              </div>
            )}

            {/* Results */}
            <div className="space-y-4">
              {!loading &&
                items.map((it, index) => {
                  const itemKey = getItemKey(it);
                  return (
                    <div
                      key={itemKey}
                      className="p-6 bg-white rounded-xl shadow-sm transition-all duration-300 transform hover:-translate-y-1"
                      style={{
                        animation: `fadeIn 0.3s ease-out ${index * 0.1}s both`,
                        border: '1px solid #E8F4FD',
                        boxShadow: '0 1px 3px rgba(119, 190, 240, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(119, 190, 240, 0.2)';
                        e.currentTarget.style.borderColor = '#A8D4F0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(119, 190, 240, 0.1)';
                        e.currentTarget.style.borderColor = '#E8F4FD';
                      }}
                    >
                      {it._type === "vocab" ? (
                        <div className="flex gap-6">
                          {it.image_url && (
                            <div className="flex-shrink-0">
                              <img
                                src={it.image_url}
                                alt={it.word}
                                className="object-cover w-32 h-32 rounded-lg shadow-md"
                                loading="lazy"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className="text-4xl font-bold text-gray-800"
                                dangerouslySetInnerHTML={{
                                  __html: highlight(it.word, q),
                                }}
                              />
                              <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ 
                                color: '#77BEF0', 
                                backgroundColor: '#E8F4FD' 
                              }}>
                                {t("search.vocabularyLabel", language)}
                              </span>
                            </div>
                            <div className="mb-3 text-xl text-gray-700 font-medium">
                              {it.furigana && (
                                <span className="text-gray-500 mr-2">
                                  {it.furigana}
                                </span>
                              )}
                              <span>{it.meaning}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              {it.jlpt_level && (
                                <span className="flex items-center gap-1">
                                  <span className="text-yellow-500">⭐</span>
                                  JLPT {it.jlpt_level}
                                </span>
                              )}
                              {it.topic && (
                                <span className="flex items-center gap-1">
                                  <span>📁</span>
                                  {it.topic.topic_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div
                              className="text-2xl font-bold text-gray-800"
                              dangerouslySetInnerHTML={{
                                __html: highlight(it.grammar_structure, q),
                              }}
                            />
                            <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ 
                              color: '#77BEF0', 
                              backgroundColor: '#E8F4FD' 
                            }}>
                              {t("search.grammarLabel", language)}
                            </span>
                          </div>
                          {it.jlpt_level && (
                            <div className="mb-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-500">⭐</span>
                                JLPT {it.jlpt_level}
                              </span>
                            </div>
                          )}
                          <div
                            className="mb-4 text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: highlight(it.explanation_viet || "", q),
                            }}
                          />
                          {it.example_jp && (
                            <div className="mt-4 p-4 rounded-lg border-l-4" style={{
                              background: 'linear-gradient(to right, #E8F4FD, #F0F8FF)',
                              borderLeftColor: '#77BEF0'
                            }}>
                              <div className="text-sm font-semibold text-gray-700 mb-2">
                                {t("search.exampleSentence", language)}
                              </div>
                              <div className="text-lg italic text-gray-800 mb-2">
                                {it.example_jp}
                              </div>
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
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        mark {
          background: linear-gradient(120deg, #FFE5B4 0%, #FFD89B 100%);
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default SearchPage;
