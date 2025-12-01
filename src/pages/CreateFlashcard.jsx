import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/CreateFlashcard.module.css";
import { FaTrashAlt } from "react-icons/fa";
import { FiImage } from "react-icons/fi";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import {
  listFolders,
  createSet,
  createCard,
  getSet,
  updateSet,
  updateCard,
  removeCard
} from "../services/flashcardService.js";

const createEmptyCard = (overrides = {}) => ({
  cardId: null,
  vocab: "",
  mean: "",
  imagePreview: "",
  imageData: "",
  ...overrides
});

const CreateFlashcard = () => {
  const navigate = useNavigate();
  const { setId } = useParams();
  const editingId = setId ? Number(setId) : null;

  const [title, setTitle] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [flashcards, setFlashcards] = useState([createEmptyCard()]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [initialCards, setInitialCards] = useState([]);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await listFolders();
      setFolders(res.folders || []);
    } catch (err) {
      setMessage(err.message);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (!editingId) return;
    const fetchSet = async () => {
      try {
        setLoading(true);
        const res = await getSet(editingId);
        setTitle(res.set.set_name);
        setSelectedFolder(
          res.set.folder_id ? String(res.set.folder_id) : ""
        );
        const mappedCards = (res.set.fccards || []).map(card =>
          createEmptyCard({
            cardId: card.card_id,
            vocab: card.side_jp,
            mean: card.side_viet,
            imagePreview: card.image_url || "",
            imageData: card.image_url || ""
          })
        );
        setFlashcards(mappedCards.length ? mappedCards : [createEmptyCard()]);
        setInitialCards(res.set.fccards || []);
      } catch (err) {
        setMessage(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSet();
  }, [editingId]);

  const handleChange = (index, field, value) => {
    const updated = [...flashcards];
    updated[index][field] = value;
    setFlashcards(updated);
  };

  const addFlashcard = () => setFlashcards([...flashcards, createEmptyCard()]);

  const deleteFlashcard = (index) => {
    setFlashcards(flashcards.filter((_, i) => i !== index));
  };

  const handleImageChange = async (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...flashcards];
      updated[index] = {
        ...updated[index],
        imagePreview: reader.result,
        imageData: reader.result
      };
      setFlashcards(updated);
    };
    reader.readAsDataURL(file);
  };

  const cardPayloads = useMemo(
    () =>
      flashcards
        .map(card => {
          const sideJp = card.vocab.trim();
          const sideViet = card.mean.trim();
          if (!sideJp || !sideViet) return null;
          return {
            cardId: card.cardId,
            payload: {
              sideJp,
              sideViet,
              imageUrl: card.imageData || ""
            }
          };
        })
        .filter(Boolean),
    [flashcards]
  );

  const handleSubmit = async () => {
    setMessage("");
    if (!title.trim()) {
      setMessage("Vui lòng nhập tiêu đề học phần");
      return;
    }

    if (!cardPayloads.length) {
      setMessage("Cần ít nhất 1 thẻ hợp lệ");
      return;
    }

    try {
      setLoading(true);
      const folderId = selectedFolder ? Number(selectedFolder) : null;

      if (editingId) {
        await updateSet(editingId, {
          setName: title.trim(),
          folderId
        });

        const incomingIds = new Set(
          cardPayloads.filter(card => card.cardId).map(card => card.cardId)
        );

        for (const card of cardPayloads) {
          if (card.cardId) {
            await updateCard(editingId, card.cardId, card.payload);
          } else {
            await createCard(editingId, card.payload);
          }
        }

        for (const card of initialCards) {
          if (!incomingIds.has(card.card_id)) {
            await removeCard(editingId, card.card_id);
          }
        }

        setMessage("Đã cập nhật học phần! Đang chuyển...");
        setTimeout(() => navigate(`/flashcard/vocab-practice/${editingId}`), 800);
      } else {
        const res = await createSet(title.trim(), folderId);
        for (const card of cardPayloads) {
          await createCard(res.set.set_id, card.payload);
        }
        setMessage("Tạo học phần thành công! Đang chuyển...");
        setTimeout(() => navigate(`/flashcard/vocab-practice/${res.set.set_id}`), 800);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <div className={styles.container}>
          <h1 className={styles.title}>
            {editingId ? "Chỉnh sửa học phần" : "Tạo thẻ flashcard mới"}
          </h1>
          <input
            className={styles.inputTitle}
            placeholder="Tiêu đề học phần"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            className={styles.select}
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
          >
            <option value="">Không thuộc thư mục</option>
            {folders.map(folder => (
              <option key={folder.folder_id} value={folder.folder_id}>
                {folder.folder_name}
              </option>
            ))}
          </select>

          {flashcards.map((card, index) => (
            <div key={index} className={styles.cardRow}>
              <span className={styles.number}>{index + 1}</span>
              <div className={styles.cardGroup}>
                <input
                  type="text"
                  placeholder="Tiếng Nhật"
                  value={card.vocab}
                  onChange={(e) => handleChange(index, "vocab", e.target.value)}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Tiếng Việt"
                  value={card.mean}
                  onChange={(e) => handleChange(index, "mean", e.target.value)}
                  className={styles.input}
                />
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
                {card.imagePreview && (
                  <img
                    src={card.imagePreview}
                    alt="preview"
                    className={styles.preview}
                  />
                )}
                <FaTrashAlt className={styles.trash} onClick={() => deleteFlashcard(index)} />
              </div>
            </div>
          ))}

          {message && <p className={styles.helper}>{message}</p>}

          <button className={styles.addButton} onClick={addFlashcard}>+</button>
          <button className={styles.createButton} disabled={loading} onClick={handleSubmit}>
            {loading ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo học phần"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateFlashcard;