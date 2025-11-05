import React, { useState } from "react";
import styles from "../styles/CreateFlashcard.module.css";
import { FaTrashAlt } from "react-icons/fa";
import { FiImage } from "react-icons/fi";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const CreateFlashcard = () => {
  const [flashcards, setFlashcards] = useState([
    { vocab: "", mean: "" },
    { vocab: "", mean: "" },
    { vocab: "", mean: "" },
    { vocab: "", mean: "" },
  ]);

  const handleChange = (index, field, value) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  const addFlashcard = () => setFlashcards([...flashcards, { vocab: "", mean: "" }]);

  const deleteFlashcard = (index) => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.container}>
          <h1 className={styles.title}>Tạo thẻ flashcard mới</h1>
          <input className={styles.inputTitle} placeholder="Tiêu đề" />

          {flashcards.map((card, index) => (
            <div key={index} className={styles.cardRow}>
              <span className={styles.number}>{index + 1}</span>
              <div className={styles.cardGroup}>
                <input
                  type="text"
                  placeholder="Từ vựng"
                  value={card.vocab}
                  onChange={(e) => handleChange(index, "vocab", e.target.value)}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Nghĩa"
                  value={card.mean}
                  onChange={(e) => handleChange(index, "mean", e.target.value)}
                  className={styles.input}
                />
                <FiImage className={styles.icon} />
                <FaTrashAlt className={styles.trash} onClick={() => deleteFlashcard(index)} />
              </div>
            </div>
          ))}

          <button className={styles.addButton} onClick={addFlashcard}>+</button>
          <button className={styles.createButton}>Tạo</button>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashcard;