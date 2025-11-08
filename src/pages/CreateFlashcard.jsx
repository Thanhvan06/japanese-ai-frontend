import React, { useState } from "react";
import styles from "../styles/CreateFlashcard.module.css";
import { FaTrashAlt } from "react-icons/fa";
import { FiImage } from "react-icons/fi";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const CreateFlashcard = () => {
  const [flashcards, setFlashcards] = useState([
    { vocab: "", mean: "", image: null },
    { vocab: "", mean: "", image: null },
    { vocab: "", mean: "", image: null },
    { vocab: "", mean: "", image: null },
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

  const handleImageChange = (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const updated = [...flashcards];
    updated[index] = { ...updated[index], image: url };
    setFlashcards(updated);
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
                {/* hidden file input for image selection */}
                <input
                  id={`file-${index}`}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleImageChange(index, e)}
                />
                <FiImage
                  className={styles.icon}
                  onClick={() => document.getElementById(`file-${index}`).click()}
                  style={{ cursor: "pointer" }}
                />
                {card.image && (
                  <img
                    src={card.image}
                    alt="preview"
                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6, marginLeft: 8 }}
                  />
                )}
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