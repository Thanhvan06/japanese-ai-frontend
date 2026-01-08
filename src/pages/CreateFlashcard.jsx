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
  imageUrl: "",
  imageFile: null,
  showImageOptions: false,
  tempImageUrl: "",
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
        const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
        const mappedCards = (res.set.fccards || []).map(card => {
          let imageUrl = card.image_url || "";
          if (imageUrl && imageUrl.startsWith("/uploads/")) {
            imageUrl = `${BASE_URL}${imageUrl}`;
          }
          return createEmptyCard({
            cardId: card.card_id,
            vocab: card.side_jp,
            mean: card.side_viet,
            imagePreview: imageUrl,
            imageUrl: card.image_url || "",
            imageFile: null,
            showImageOptions: false
          });
        });
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

  const handleImageFileChange = (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const updated = [...flashcards];
      updated[index] = {
        ...updated[index],
        imagePreview: reader.result,
        imageFile: file,
        imageUrl: "",
        showImageOptions: false
      };
      setFlashcards(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (index, url) => {
    const updated = [...flashcards];
    updated[index] = {
      ...updated[index],
      imageUrl: url.trim(),
      imagePreview: url.trim() || "",
      imageFile: null,
      showImageOptions: false
    };
    setFlashcards(updated);
  };

  const toggleImageOptions = (index) => {
    const updated = [...flashcards];
    updated[index].showImageOptions = !updated[index].showImageOptions;
    setFlashcards(updated);
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
              imageFile: card.imageFile || null,
              imageUrl: card.imageUrl || ""
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
                <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  {card.imagePreview ? (
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <img
                        src={card.imagePreview}
                        alt="preview"
                        className={styles.preview}
                        onClick={() => toggleImageOptions(index)}
                        style={{ cursor: "pointer" }}
                      />
                      {card.showImageOptions && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          zIndex: 1000,
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          marginTop: "8px",
                          padding: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          minWidth: "280px"
                        }}>
                          <input
                            type="text"
                            placeholder="Dán URL ảnh"
                            value={card.tempImageUrl || ""}
                            onChange={(e) => {
                              const updated = [...flashcards];
                              updated[index].tempImageUrl = e.target.value;
                              setFlashcards(updated);
                            }}
                            className={styles.input}
                            style={{ width: "100%", margin: 0 }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && flashcards[index].tempImageUrl) {
                                handleImageUrlChange(index, flashcards[index].tempImageUrl);
                              }
                            }}
                          />
                          <input
                            id={`file-${index}`}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handleImageFileChange(index, e)}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`file-${index}`).click()}
                            style={{
                              padding: "8px 16px",
                              background: "#77bef0",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              width: "100%"
                            }}
                          >
                            Tải lên ghi chú
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <FiImage
                        className={styles.icon}
                        onClick={() => toggleImageOptions(index)}
                        style={{ cursor: "pointer" }}
                        title="Thêm ảnh"
                      />
                      {card.showImageOptions && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          zIndex: 1000,
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          marginTop: "8px",
                          padding: "12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          minWidth: "280px"
                        }}>
                          <input
                            type="text"
                            placeholder="Dán URL ảnh"
                            value={card.tempImageUrl || ""}
                            onChange={(e) => {
                              const updated = [...flashcards];
                              updated[index].tempImageUrl = e.target.value;
                              setFlashcards(updated);
                            }}
                            className={styles.input}
                            style={{ width: "100%", margin: 0 }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && flashcards[index].tempImageUrl) {
                                handleImageUrlChange(index, flashcards[index].tempImageUrl);
                              }
                            }}
                          />
                          <input
                            id={`file-${index}`}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handleImageFileChange(index, e)}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`file-${index}`).click()}
                            style={{
                              padding: "8px 16px",
                              background: "#77bef0",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              width: "100%"
                            }}
                          >
                            Tải lên ghi chú
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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