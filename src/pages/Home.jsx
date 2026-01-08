import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Home.module.css";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

import flashcards from "../assets/flashcards.png";
import vocab from "../assets/vocab2.png";
import diary from "../assets/diary2.png";
import ai from "../assets/ai.png";
import grammar from "../assets/grammar2.png"; 

const Home = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const features = [
    { title: t("home.studyFlashcards", language), image: flashcards, color: "#E3F2FD" },
    { title: t("home.vocabPractice", language), image: vocab, color: "#FFF3E0" },
    { title: t("home.grammarPractice", language), image: grammar, color: "#E8F5E9" },
    { title: t("home.writeDiary", language), image: diary, color: "#F3E5F5" },
    { title: t("home.studyAI", language), image: ai, color: "#E1F5FE" },
  ];

  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % features.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{t("home.title", language)}</h1>
          <p>
            {t("home.description", language)}
          </p>
          <div className={styles.heroButtons}>
            <button className={styles.primaryBtn} onClick={() => navigate('/signin')}>{t("home.startNow", language)}</button>
            <button className={styles.secondaryBtn} onClick={() => navigate('/signin')}>{t("home.signIn", language)}</button>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src="/banner.png" alt="Banner" />
        </div>
      </section>

      <section className={styles.features}>
        <h2>{t("home.features", language)}</h2>
        <div className={styles.sliderWrapper}>
          <button onClick={handlePrev} className={styles.arrowBtn}>
            &#8592;
          </button>
          <div className={styles.slider}>
            <div
              className={styles.sliderInner}
              style={{
                transform: `translateX(-${index * (100 / 4)}%)`,
              }}
            >
              {features.map((f, i) => (
                <div
                  className={styles.featureCard}
                  key={i}
                  style={{ backgroundColor: f.color }}
                >
                  <img src={f.image} alt={f.title} />
                  <h3>{f.title}</h3>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleNext} className={styles.arrowBtn}>
            &#8594;
          </button>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>{t("home.ready", language)}</p>
        <button className={styles.signUpBtn} onClick={() => navigate('/signin')}>{t("home.signUpFree", language)}</button>
      </footer>
    </div>
  );
};

export default Home;
