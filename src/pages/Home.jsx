import React, { useState } from "react";
import styles from "../styles/Home.module.css";

import flashcards from "../assets/flashcards.png";
import vocab from "../assets/vocab.png";
import diary from "../assets/diary.png";
import ai from "../assets/ai.png";
import grammar from "../assets/grammar.png"; 

const Home = () => {
  const features = [
    { title: "Study flashcards", image: flashcards, color: "#E3F2FD" },
    { title: "Vocabulary practice", image: vocab, color: "#FFF3E0" },
    { title: "Grammar practice", image: grammar, color: "#E8F5E9" },
    { title: "Writing a diary", image: diary, color: "#F3E5F5" },
    { title: "Study with AI", image: ai, color: "#E1F5FE" },
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
          <h1>Học tiếng Nhật với AI</h1>
          <p>
            Nền tảng học tiếng Nhật trực tuyến thông minh với sự hỗ trợ của AI, giúp bạn
            nắm vững từ vựng, ngữ pháp và cải thiện kỹ năng giao tiếp.
          </p>
          <div className={styles.heroButtons}>
            <button className={styles.primaryBtn}>Bắt đầu học ngay</button>
            <button className={styles.secondaryBtn}>Đăng nhập</button>
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src="/banner.png" alt="Banner" />
        </div>
      </section>

      <section className={styles.features}>
        <h2>Những tính năng nổi bật</h2>
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
        <p>Sẵn sàng bắt đầu hành trình học tiếng Nhật của bạn?</p>
        <button className={styles.signUpBtn}>Đăng ký miễn phí</button>
      </footer>
    </div>
  );
};

export default Home;
