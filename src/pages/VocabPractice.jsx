import React, { useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/VocabPractice.module.css";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import { FiEdit2 } from "react-icons/fi";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { IoShuffle } from "react-icons/io5";

const FlashcardPractice = () => {
  const { id } = useParams();
  const data = [
    { id: 1, vocab: "勉強", romaji: "べんきょう", meaning: "học tập" },
    { id: 2, vocab: "勉強", romaji: "べんきょう", meaning: "học tập" },
    { id: 3, vocab: "勉強", romaji: "べんきょう", meaning: "học tập" },
    { id: 4, vocab: "勉強", romaji: "べんきょう", meaning: "học tập" },
  ];

  const [flashcards] = useState(data);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 

  const handleNext = () => {
    setFlipped(false);
    setCurrent((prev) => (prev + 1) % flashcards.length);
  };

  const handleRandom = () => {
    setFlipped(false);
    if (flashcards.length <= 1) return;
    let idx = current;
    while (idx === current) {
      idx = Math.floor(Math.random() * flashcards.length);
    }
    setCurrent(idx);
  };

  const handlePrev = () => {
    setFlipped(false);
    setCurrent((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const toggleFlip = () => setFlipped((f) => !f);

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.practiceContainer}>
          <div className={styles.flashcardArea}>
            {/* Flashcard with Flip Animation */}
            <div
              className={`${styles.flashcardBox} ${flipped ? styles.flipped : ""}`}
              onClick={toggleFlip}
              role="button"
              aria-pressed={flipped}
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleFlip()}
            >
              <div className={styles.flashInner}>
                <div className={styles.flashFront}>
                  <p className={styles.flashText}>{flashcards[current].vocab}</p>
                </div>
                <div className={styles.flashBack}>
                  <p className={styles.romaji}>{flashcards[current].romaji}</p>
                  <p className={styles.mean}>{flashcards[current].meaning}</p>
                </div>
              </div>
            </div>
            <div className={styles.cardControlsContainer}>
              <div className={styles.navigation}>
                <div className={styles.navLeft}>
                  <button className={styles.navBtn} onClick={handlePrev} aria-label="prev">
                    <FaArrowLeft />
                  </button>
                </div>

                <div className={styles.navCenter}>
                  <span className={styles.navCounter}>
                    {current + 1}/{flashcards.length}
                  </span>
                </div>

                <div className={styles.navRight}>
                  <button className={styles.navBtn} onClick={handleNext} aria-label="next">
                    <FaArrowRight />
                  </button>
                </div>
              </div>

              <div className={styles.cardControls}>
                <button
                  className={styles.controlBtn}
                  title="Shuffle"
                  onClick={handleRandom}
                >
                  <IoShuffle size={22} />
                </button>
                <button
                  className={styles.controlBtn}
                  title="Edit"
                  onClick={() => setIsEditing(true)}
                >
                  <FiEdit2 size={20} />
                </button>
              </div>
            </div>

            <div className={styles.meta}>
              <div className={styles.creator}>
                <div className={styles.avatar}></div>
                <div>
                  <p>Tạo bởi <b>Mai</b></p>
                  <span>2 ngày trước</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.vocabList}>
            <h3>
              Thuật ngữ trong học phần này <span>({flashcards.length})</span>
            </h3>
            {flashcards.map((v) => (
              <div key={v.id} className={styles.vocabItem}>
                <span className={styles.word}>{v.vocab}</span>
                <div className={styles.vocabDivider} />
                <div className={styles.vocabRightBlock}>
                  <div className={styles.hira}>{v.romaji}</div>
                  <div className={styles.mean}>{v.meaning}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FlashcardPractice;
