import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/VocabPractice.module.css";
import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoShuffle, IoFolderOpenOutline } from "react-icons/io5";
import { FiEdit2 } from "react-icons/fi";
import {
  getSet,
  startStudy,
  getCardAnswer,
  submitStudyAnswer
} from "../services/flashcardService.js";

const FlashcardPractice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const setId = Number(id);

  const [setInfo, setSetInfo] = useState(null);
  const [studyCards, setStudyCards] = useState([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState({});
  const [mode, setMode] = useState("all");
  const [status, setStatus] = useState("");
  const [loadingStudy, setLoadingStudy] = useState(true);
  const [loadingSet, setLoadingSet] = useState(true);
  const [completionStats, setCompletionStats] = useState(null);
  const [showCompletionChart, setShowCompletionChart] = useState(false);
  const studiedCardsRef = useRef(new Set());
  const initialCardsRef = useRef(new Set());
  const chartTimeoutRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  const currentCard = studyCards[current] || null;

  const fetchSetDetail = useCallback(async () => {
    try {
      setLoadingSet(true);
      const res = await getSet(setId);
      setSetInfo(res.set);
    } catch (err) {
      setStatus(err.message || "Lỗi khi tải thông tin bộ thẻ");
    } finally {
      setLoadingSet(false);
    }
  }, [setId]);

  const filterCardsByMode = useCallback((cards, studyMode) => {
    if (studyMode === "all") {
      return cards;
    } else if (studyMode === "not-mastered") {
      return cards.filter(c => (c.mastery_level || 1) < 5);
    } else if (studyMode === "mastered") {
      return cards.filter(c => (c.mastery_level || 1) >= 5);
    }
    return cards;
  }, []);

  const fetchStudyCards = useCallback(
    async (studyMode, useLocalData = false, resetCompletion = true) => {
      try {
        setLoadingStudy(true);
        
        if (useLocalData && setInfo?.fccards) {
          const allCards = setInfo.fccards;
          const filtered = filterCardsByMode(allCards, studyMode);
          const studyCardsData = filtered.map(card => ({
            card_id: card.card_id,
            front: card.side_jp,
            image_url: card.image_url,
            mastery_level: card.mastery_level || 1
          }));
          setStudyCards(studyCardsData);
          setCurrent(0);
          setFlipped(false);
          setAnswers({});
          setStatus("");
          
          if (studyMode === "all") {
            initialCardsRef.current = new Set(studyCardsData.map(c => c.card_id));
            if (resetCompletion) {
              studiedCardsRef.current = new Set();
              setCompletionStats(null);
              setShowCompletionChart(false);
              if (chartTimeoutRef.current) {
                clearTimeout(chartTimeoutRef.current);
                chartTimeoutRef.current = null;
              }
              if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
                restartTimeoutRef.current = null;
              }
            }
          } else {
            setCompletionStats(null);
            setShowCompletionChart(false);
          }
        } else {
          const res = await startStudy(setId, studyMode);
          const cards = res.cards || [];
          setStudyCards(cards);
          setCurrent(0);
          setFlipped(false);
          setAnswers({});
          setStatus("");
          
          if (studyMode === "all") {
            initialCardsRef.current = new Set(cards.map(c => c.card_id));
            if (resetCompletion) {
              studiedCardsRef.current = new Set();
              setCompletionStats(null);
              setShowCompletionChart(false);
              if (chartTimeoutRef.current) {
                clearTimeout(chartTimeoutRef.current);
                chartTimeoutRef.current = null;
              }
              if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
                restartTimeoutRef.current = null;
              }
            }
          } else {
            setCompletionStats(null);
            setShowCompletionChart(false);
          }
        }
      } catch (err) {
        setStatus(err.message || "Lỗi khi tải thẻ học");
        setStudyCards([]);
      } finally {
        setLoadingStudy(false);
      }
    },
    [setId, filterCardsByMode, setInfo]
  );

  useEffect(() => {
    fetchSetDetail();
  }, [fetchSetDetail, setId]);

  useEffect(() => {
    const handleFocus = () => {
      fetchSetDetail();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchSetDetail]);

  useEffect(() => {
    if (setInfo?.fccards) {
      fetchStudyCards(mode, true);
    } else {
      fetchStudyCards(mode, false);
    }
  }, [mode, setInfo?.fccards, fetchStudyCards]);

  const moveToNextCard = useCallback(() => {
    if (!studyCards.length) return;
    setFlipped(false);
    const nextIndex = (current + 1) % studyCards.length;
    setCurrent(nextIndex);
  }, [studyCards.length, current]);

  useEffect(() => {
    setFlipped(false);
  }, [current]);

  const handleRandom = useCallback(() => {
    if (studyCards.length <= 1) return;
    let idx = current;
    while (idx === current) {
      idx = Math.floor(Math.random() * studyCards.length);
    }
    setFlipped(false);
    setCurrent(idx);
  }, [studyCards.length, current]);

  const handleFlip = useCallback(async () => {
    if (!currentCard) return;
    if (!flipped && !answers[currentCard.card_id]) {
      try {
        const res = await getCardAnswer(setId, currentCard.card_id);
        setAnswers((prev) => ({ ...prev, [currentCard.card_id]: res }));
      } catch (err) {
        setStatus(err.message || "Lỗi khi lấy đáp án");
        return;
      }
    }
    setFlipped((f) => !f);
  }, [currentCard, flipped, answers, setAnswers, setStatus, setId]);

  const handleRestart = useCallback(async () => {
    setShowCompletionChart(false);
    setCompletionStats(null);
    if (chartTimeoutRef.current) {
      clearTimeout(chartTimeoutRef.current);
      chartTimeoutRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    studiedCardsRef.current = new Set();
    await fetchSetDetail();
    setTimeout(async () => {
      const updatedSetInfo = await getSet(setId);
      if (updatedSetInfo?.set?.fccards) {
        fetchStudyCards("all", true, true);
      } else {
        fetchStudyCards("all", false, true);
      }
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId]);

  const processStudyResult = useCallback(async (correct) => {
    if (!currentCard) return;
    try {
      const res = await submitStudyAnswer(setId, currentCard.card_id, correct);

      const resCardId = String(res.card_id ?? res.cardId ?? currentCard.card_id);
      const newMastery = res.mastery_level ?? res.masteryLevel ?? (correct ? 1 : 0);

      if (mode === "all") {
        studiedCardsRef.current.add(currentCard.card_id);
        
        const updatedSetInfo = setInfo?.fccards ? setInfo.fccards.map((c) =>
          String(c.card_id) === resCardId ? { ...c, mastery_level: newMastery } : c
        ) : [];
        
        if (initialCardsRef.current.size > 0 && 
            studiedCardsRef.current.size >= initialCardsRef.current.size &&
            Array.from(initialCardsRef.current).every(id => studiedCardsRef.current.has(id))) {
          
          const allCards = updatedSetInfo.length > 0 ? updatedSetInfo : (setInfo?.fccards || []);
          const masteredCount = allCards.filter(c => (c.mastery_level || 1) >= 5).length;
          const notMasteredCount = allCards.length - masteredCount;
          const masteredPercent = allCards.length > 0 ? (masteredCount / allCards.length) * 100 : 0;
          
          setCompletionStats({
            mastered: masteredCount,
            notMastered: notMasteredCount,
            masteredPercent: masteredPercent,
            total: allCards.length
          });
          
          setShowCompletionChart(true);
          
          if (chartTimeoutRef.current) {
            clearTimeout(chartTimeoutRef.current);
          }
          chartTimeoutRef.current = setTimeout(() => {
            setShowCompletionChart(false);
          }, 30000);
          
          fetchSetDetail();
          
          setTimeout(() => {
            if (setInfo?.fccards) {
              fetchStudyCards("not-mastered", true, false);
              fetchStudyCards("mastered", true, false);
            }
          }, 500);
        }
      }

      setStudyCards((prev) => {
        const updated = prev.map((card) =>
          String(card.card_id) === resCardId ? { ...card, mastery_level: newMastery } : card
        );
        
        if (mode === "not-mastered" && newMastery >= 5) {
          const filtered = updated.filter(card => String(card.card_id) !== resCardId);
          if (current >= filtered.length && filtered.length > 0) {
            setCurrent(filtered.length - 1);
          } else if (filtered.length === 0) {
            setCurrent(0);
          }
          return filtered;
        } else if (mode === "mastered" && newMastery < 5) {
          const filtered = updated.filter(card => String(card.card_id) !== resCardId);
          if (current >= filtered.length && filtered.length > 0) {
            setCurrent(filtered.length - 1);
          } else if (filtered.length === 0) {
            setCurrent(0);
          }
          return filtered;
        }
        
        return updated;
      });

      setSetInfo((prev) => {
        if (!prev || !Array.isArray(prev.fccards)) return prev;
        return {
          ...prev,
          fccards: prev.fccards.map((c) =>
            String(c.card_id) === resCardId ? { ...c, mastery_level: newMastery } : c
          ),
        };
      });

      setStatus(correct ? "Đã đánh dấu thẻ là ĐÃ NHỚ" : "Đã đánh dấu thẻ là CHƯA NHỚ");

      setTimeout(() => {
        moveToNextCard();
      }, 300);
    } catch (err) {
      setStatus(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard, setId, moveToNextCard, mode, current, setInfo?.fccards]);

  const handleRemembered = useCallback(() => processStudyResult(true), [processStudyResult]);
  const handleNotRemembered = useCallback(() => processStudyResult(false), [processStudyResult]);

  useEffect(() => {
    const handleKey = (e) => {
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleNotRemembered();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleRemembered();
      }
      if (e.key === " " || e.key === "Enter") {
        if (e.key === " ") e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleNotRemembered, handleRemembered, handleFlip]);

  useEffect(() => {
    return () => {
      if (chartTimeoutRef.current) {
        clearTimeout(chartTimeoutRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  const vocabulary = useMemo(() => setInfo?.fccards || [], [setInfo]);

  const allCardsCount = useMemo(() => {
    return setInfo?.fccards?.length || 0;
  }, [setInfo]);

  const masteredCardsCount = useMemo(() => {
    return setInfo?.fccards?.filter(c => (c.mastery_level || 1) >= 5).length || 0;
  }, [setInfo]);

  const notMasteredCardsCount = useMemo(() => {
    return setInfo?.fccards?.filter(c => (c.mastery_level || 1) < 5).length || 0;
  }, [setInfo]);

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.practiceContainer}>
          <div className={styles.flashcardArea}>
            <div className={styles.cardHeader}>
              <div className={styles.headerInfo}>
                <div className={styles.folderRow}>
                  <IoFolderOpenOutline size={20} color="#77bef0" />
                  {setInfo?.fcfolders ? (
                    <button
                      className={styles.linkBtn}
                      onClick={() => navigate(`/flashcard/folders/${setInfo.fcfolders.folder_id}`)}
                    >
                      {setInfo.fcfolders.folder_name}
                    </button>
                  ) : (
                    <span className={styles.noFolder}>Chưa có thư mục</span>
                  )}
                </div>
                <h1 className={styles.setTitle}>{setInfo?.set_name || "Học phần"}</h1>
              </div>
              <div className={styles.filterTabs}>
                <button
                  className={`${styles.filterTab} ${mode === "all" ? styles.active : ""}`}
                  onClick={() => {
                    setMode("all");
                    setCompletionStats(null);
                    setShowCompletionChart(false);
                    if (chartTimeoutRef.current) {
                      clearTimeout(chartTimeoutRef.current);
                      chartTimeoutRef.current = null;
                    }
                  }}
                >
                  Tất cả ({allCardsCount})
                </button>
                <button
                  className={`${styles.filterTab} ${mode === "not-mastered" ? styles.active : ""}`}
                  onClick={() => {
                    setMode("not-mastered");
                    setCompletionStats(null);
                    setShowCompletionChart(false);
                    if (chartTimeoutRef.current) {
                      clearTimeout(chartTimeoutRef.current);
                      chartTimeoutRef.current = null;
                    }
                  }}
                >
                  Chưa nhớ ({notMasteredCardsCount})
                </button>
                <button
                  className={`${styles.filterTab} ${mode === "mastered" ? styles.active : ""}`}
                  onClick={() => {
                    setMode("mastered");
                    setCompletionStats(null);
                    setShowCompletionChart(false);
                    if (chartTimeoutRef.current) {
                      clearTimeout(chartTimeoutRef.current);
                      chartTimeoutRef.current = null;
                    }
                  }}
                >
                  Đã nhớ ({masteredCardsCount})
                </button>
              </div>
            </div>

            {!showCompletionChart && (
              <>
                <div
                  className={`${styles.flashcardBox} ${flipped ? styles.flipped : ""}`}
                  onClick={handleFlip}
                  role="button"
                  aria-pressed={flipped}
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleFlip()}
                >
                  <div className={styles.flashInner}>
                    <div className={styles.flashFront}>
                      <p className={styles.flashText}>
                        {loadingStudy ? "Đang tải..." : currentCard ? currentCard.front : "Chưa có thẻ nào"}
                      </p>
                    </div>
                    <div className={styles.flashBack}>
                      {currentCard && answers[currentCard.card_id] ? (
                        <div style={{ display: "flex", width: "100%", height: "100%", gap: "20px", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                            <p className={styles.mean}>{answers[currentCard.card_id].back}</p>
                          </div>
                          {(answers[currentCard.card_id].image_url || currentCard.image_url) && (() => {
                            const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
                            const imageSrc = answers[currentCard.card_id].image_url || currentCard.image_url;
                            const fullImageUrl = imageSrc && imageSrc.startsWith("/uploads/") 
                              ? `${BASE_URL}${imageSrc}` 
                              : imageSrc;
                            return (
                              <div style={{ flex: "0 0 auto", maxWidth: "40%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <img
                                  src={fullImageUrl}
                                  alt="Flashcard answer"
                                  className={styles.flashImage}
                                  style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain", borderRadius: "8px" }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <p className={styles.mean}>
                          {currentCard ? "Nhấp để xem đáp án" : "Thêm thẻ để bắt đầu học"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.cardControlsContainer}>
                  <div className={styles.navigation}>
                    <div
                      className={styles.navGroup}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 20,
                        width: "100%"
                      }}
                    >
                      <button
                        className={`${styles.navBtn} ${styles.learnAgain}`}
                        onClick={handleNotRemembered}
                        disabled={!currentCard}
                        aria-label="Chưa nhớ"
                      >
                        <FaArrowLeft />{" "}
                        <span style={{ marginLeft: 8, verticalAlign: "middle" }}>Chưa nhớ</span>
                      </button>

                      <span className={styles.navCounter}>
                        {studyCards.length ? current + 1 : 0}/{studyCards.length}
                      </span>

                      <button
                        className={`${styles.navBtn} ${styles.mastered}`}
                        onClick={handleRemembered}
                        disabled={!currentCard}
                        aria-label="Đã nhớ"
                      >
                        <span style={{ marginRight: 8, verticalAlign: "middle" }}>Đã nhớ</span>
                        <FaArrowRight />
                      </button>
                    </div>

                    <button className={styles.shuffleBtn} title="Shuffle" onClick={handleRandom}>
                      <IoShuffle size={20} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {status && !showCompletionChart && <p className={styles.statusMessage}>{status}</p>}
            
            {showCompletionChart && completionStats && mode === "all" && (
              <div style={{
                marginTop: "24px",
                padding: "20px",
                background: "#f6f7fb",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "24px",
                width: "100%",
                maxWidth: "640px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "24px", width: "100%" }}>
                  <div style={{ position: "relative", width: "80px", height: "80px" }}>
                    <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#e0e0e0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 36}`}
                        strokeDashoffset={`${2 * Math.PI * 36 * (1 - completionStats.masteredPercent / 100)}`}
                        strokeLinecap="round"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        fill="none"
                        stroke="#f44336"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 36 * (completionStats.masteredPercent / 100)}, ${2 * Math.PI * 36}`}
                        strokeLinecap="round"
                        style={{ transform: "rotate(0deg)", transformOrigin: "40px 40px" }}
                      />
                    </svg>
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#2e3856"
                    }}>
                      {Math.round(completionStats.masteredPercent)}%
                    </div>
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "#2e3856" }}>
                      Từ đã học được: <span style={{ color: "#4CAF50" }}>{completionStats.mastered}</span>
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "#2e3856" }}>
                      Từ chưa học được: <span style={{ color: "#f44336" }}>{completionStats.notMastered}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRestart}
                  style={{
                    padding: "12px 24px",
                    background: "#77bef0",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#6ba8d6"}
                  onMouseOut={(e) => e.target.style.background = "#77bef0"}
                >
                  Khởi động lại
                </button>
              </div>
            )}
          </div>

          <div className={styles.vocabList}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3>
                Thuật ngữ trong học phần này <span>({vocabulary.length})</span>
              </h3>
              <button
                onClick={() => navigate(`/flashcard/edit/${setId}`)}
                className={styles.editButton}
                title="Chỉnh sửa học phần"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <FiEdit2 size={20} color="#77bef0" />
              </button>
            </div>

            {loadingSet && <p>Đang tải danh sách thẻ...</p>}
            {!loadingSet &&
              vocabulary.map((card) => {
                const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
                const imageUrl = card.image_url && card.image_url.startsWith("/uploads/") 
                  ? `${BASE_URL}${card.image_url}` 
                  : card.image_url;
                return (
                  <div key={card.card_id} className={styles.vocabItem}>
                    <span className={styles.word}>{card.side_jp}</span>
                    <div className={styles.vocabDivider} />
                    <div className={styles.vocabRightBlock} style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "16px", width: "100%" }}>
                      <div className={styles.mean} style={{ flex: 1 }}>{card.side_viet}</div>
                      {imageUrl && (
                        <img 
                          src={imageUrl} 
                          alt="Thuật ngữ" 
                          className={styles.vocabImage}
                          style={{ maxWidth: "120px", maxHeight: "120px", objectFit: "contain", borderRadius: "8px", flexShrink: 0 }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}
                    </div>
                    <div className={styles.actionButtons}>
                      {/* Edit/Delete buttons intentionally hidden in study view */}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlashcardPractice;