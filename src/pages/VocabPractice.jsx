import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/VocabPractice.module.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
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

  const fetchStudyCards = useCallback(
    async (studyMode) => {
      try {
        setLoadingStudy(true);
        const res = await startStudy(setId, studyMode);
        setStudyCards(res.cards || []);
        setCurrent(0);
        setFlipped(false);
        setAnswers({});
        setStatus("");
      } catch (err) {
        setStatus(err.message || "Lỗi khi tải thẻ học");
        setStudyCards([]);
      } finally {
        setLoadingStudy(false);
      }
    },
    [setId]
  );

  useEffect(() => {
    fetchSetDetail();
  }, [fetchSetDetail]);

  useEffect(() => {
    fetchStudyCards(mode);
  }, [fetchStudyCards, mode]);

  const moveToNextCard = useCallback(() => {
    if (!studyCards.length) return;
    setFlipped(false);
    setCurrent((prev) => (prev + 1) % studyCards.length);
  }, [studyCards.length]);

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

  const processStudyResult = useCallback(async (correct) => {
    if (!currentCard) return;
    try {
      const res = await submitStudyAnswer(setId, currentCard.card_id, correct);
      setStudyCards((prev) =>
        prev.map((card) =>
          card.card_id === res.card_id ? { ...card, mastery_level: res.mastery_level } : card
        )
      );
      setStatus(correct ? "Đã đánh dấu thẻ là ĐÃ NHỚ" : "Đã đánh dấu thẻ là CHƯA NHỚ");
      // Tự động chuyển sang card tiếp theo sau khi đánh dấu
      setTimeout(() => {
        moveToNextCard();
      }, 300);
    } catch (err) {
      setStatus(err.message);
    }
  }, [currentCard, setId, moveToNextCard]);

  const handleRemembered = useCallback(() => processStudyResult(true), [processStudyResult]);
  const handleNotRemembered = useCallback(() => processStudyResult(false), [processStudyResult]);

  // Keyboard shortcuts: ArrowLeft -> Chưa nhớ, ArrowRight -> Đã nhớ
  useEffect(() => {
    const handleKey = (e) => {
      // Prevent interfering when typing in inputs
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
        // Allow flipping card when space/enter pressed
        if (e.key === " ") e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleNotRemembered, handleRemembered, handleFlip]);



  const vocabulary = useMemo(() => setInfo?.fccards || [], [setInfo]);

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
                  onClick={() => setMode("all")}
                >
                  Tất cả
                </button>
                <button
                  className={`${styles.filterTab} ${mode === "not-mastered" ? styles.active : ""}`}
                  onClick={() => setMode("not-mastered")}
                >
                  Chưa nhớ
                </button>
                <button
                  className={`${styles.filterTab} ${mode === "mastered" ? styles.active : ""}`}
                  onClick={() => setMode("mastered")}
                >
                  Đã nhớ
                </button>
              </div>
            </div>

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
                        <p className={styles.romaji}>{answers[currentCard.card_id].front}</p>
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
                {/* Inline style to ensure buttons are centered even if CSS module missing */}
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

            {status && <p className={styles.statusMessage}>{status}</p>}
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
