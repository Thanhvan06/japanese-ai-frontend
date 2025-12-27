import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/Flashcard.module.css";
import { FiPlus, FiEdit2 } from "react-icons/fi";
import { IoFolderOpenOutline } from "react-icons/io5";
import { PiCardsLight } from "react-icons/pi";
import { FaTrashAlt } from "react-icons/fa";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import {
  listFolders,
  createFolder,
  removeFolder,
  listSets,
  createSet,
  updateSet,
  removeSet
} from "../services/flashcardService.js";

const FlashcardLibrary = () => {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const numericFolderId = folderId ? Number(folderId) : null;

  const [showDropdown, setShowDropdown] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [activeTab, setActiveTab] = useState("hocphan");

  const [folders, setFolders] = useState([]);
  const [sets, setSets] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingSets, setLoadingSets] = useState(true);
  const [error, setError] = useState("");
  const [creatingSet, setCreatingSet] = useState(false);
  const [unassignedSets, setUnassignedSets] = useState([]);
  const [completionTab, setCompletionTab] = useState("all"); // "all" | "incomplete" | "complete"

  const currentFolder = useMemo(
    () => folders.find(f => f.folder_id === numericFolderId) || null,
    [folders, numericFolderId]
  );

  const fetchFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      const res = await listFolders();
      setFolders(res.folders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const fetchSets = useCallback(
    async (folderFilter) => {
      try {
        setLoadingSets(true);
        const res = await listSets(folderFilter);
        setSets(res.sets || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSets(false);
      }
    },
    []
  );

  const fetchUnassignedSets = useCallback(async () => {
    try {
      const res = await listSets();
      const orphanSets = (res.sets || []).filter(
        set => !set.folder_id && !set.fcfolders
      );
      setUnassignedSets(orphanSets);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchSets(numericFolderId);
    if (numericFolderId) {
      setActiveTab("hocphan");
      fetchUnassignedSets();
    } else {
      setUnassignedSets([]);
    }
  }, [fetchSets, numericFolderId, fetchUnassignedSets]);

  // Listen for flashcard completion events to refetch sets
  useEffect(() => {
    const handleFlashcardCompleted = () => {
      fetchSets(numericFolderId);
      if (numericFolderId) {
        fetchUnassignedSets();
      }
    };
    
    window.addEventListener("flashcardSetCompleted", handleFlashcardCompleted);
    return () => {
      window.removeEventListener("flashcardSetCompleted", handleFlashcardCompleted);
    };
  }, [fetchSets, numericFolderId, fetchUnassignedSets]);

  const handleAddClick = useCallback(() => {
    setShowDropdown(s => !s);
  }, []);

  const handleAddSection = useCallback(() => {
    navigate("/flashcard/newflashcard");
    setShowDropdown(false);
  }, [navigate]);

  const handleAddFolder = useCallback(() => {
    setShowFolderModal(true);
    setShowDropdown(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowFolderModal(false);
    setFolderTitle("");
  }, []);

  const handleSaveFolder = useCallback(async () => {
    if (!folderTitle.trim()) return;
    try {
      const res = await createFolder(folderTitle.trim());
      setFolders(prev => [res.folder, ...prev]);
      handleCloseModal();
    } catch (err) {
      setError(err.message);
    }
  }, [folderTitle, handleCloseModal]);

  const handleDeleteFolder = useCallback(
    async (folder) => {
      const confirm = window.confirm(`Xóa thư mục "${folder.folder_name}"?`);
      if (!confirm) return;
      try {
        await removeFolder(folder.folder_id);
        setFolders(prev => prev.filter(f => f.folder_id !== folder.folder_id));
        if (numericFolderId === folder.folder_id) {
          navigate("/flashcard");
        }
      } catch (err) {
        setError(err.message);
      }
    },
    [navigate, numericFolderId]
  );

  const handleCreateSetQuickly = useCallback(async () => {
    const name = window.prompt("Tên học phần mới");
    if (!name || !name.trim()) return;
    try {
      setCreatingSet(true);
      const res = await createSet(name.trim(), numericFolderId);
      const newSet = {
        ...res.set,
        card_count: 0,
        fcfolders: numericFolderId
          ? folders.find(f => f.folder_id === numericFolderId) || null
          : null
      };
      setSets(prev => [newSet, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingSet(false);
    }
  }, [numericFolderId, folders]);

  const handleDeleteSet = useCallback(
    async (set) => {
      const confirm = window.confirm(`Xóa học phần "${set.set_name}"?`);
      if (!confirm) return;
      try {
        await removeSet(set.set_id);
        setSets(prev => prev.filter(s => s.set_id !== set.set_id));
      } catch (err) {
        setError(err.message);
      }
    },
    []
  );

  const handleAttachSetToFolder = useCallback(
    async (set) => {
      if (!numericFolderId) return;
      try {
        await updateSet(set.set_id, { folderId: numericFolderId });
        const updatedSet = {
          ...set,
          folder_id: numericFolderId,
          fcfolders: currentFolder || null
        };
        setSets(prev => [updatedSet, ...prev]);
        setUnassignedSets(prev => prev.filter(s => s.set_id !== set.set_id));
      } catch (err) {
        setError(err.message);
      }
    },
    [numericFolderId, currentFolder]
  );

  const renderSetCard = useCallback(
    (set, { attachable } = {}) => (
      <div
        className={styles.card}
        key={set.set_id}
        role="button"
        tabIndex={0}
        onClick={() => !attachable && navigate(`/flashcard/vocab-practice/${set.set_id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !attachable) {
            navigate(`/flashcard/vocab-practice/${set.set_id}`);
          }
        }}
      >
        <div className={styles.cardThumb}>
          <div className={styles.folderBadge}>
            <PiCardsLight color="#fff" size={18} />
          </div>
          {set.fcfolders && (
            <span className={styles.cardFolderLabel}>{set.fcfolders.folder_name}</span>
          )}
        </div>
        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{set.set_name}</h3>
          <div className={styles.cardMeta}>
            <span>{set.card_count || 0} thuật ngữ</span>
          </div>
        </div>
        {attachable ? (
          <div className={styles.attachActions}>
            <button
              className={styles.attachBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleAttachSetToFolder(set);
              }}
            >
              Thêm vào thư mục
            </button>
          </div>
        ) : (
          <div className={styles.cardActions}>
            <button
              className={styles.iconButton}
              title="Chỉnh sửa học phần"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/flashcard/edit/${set.set_id}`);
              }}
            >
              <FiEdit2 size={16} />
            </button>
            <button
              className={`${styles.iconButton} ${styles.danger}`}
              title="Xóa học phần"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSet(set);
              }}
            >
              <FaTrashAlt size={15} />
            </button>
          </div>
        )}
      </div>
    ),
    [handleAttachSetToFolder, handleDeleteSet, navigate]
  );

  const filteredSets = useMemo(() => {
    if (completionTab === "all") {
      return sets;
    }
    return sets.filter(set => {
      const isCompleted = set.is_completed === true;
      return completionTab === "complete" ? isCompleted : !isCompleted;
    });
  }, [sets, completionTab]);

  const filteredUnassignedSets = useMemo(() => {
    if (completionTab === "all") {
      return unassignedSets;
    }
    return unassignedSets.filter(set => {
      const isCompleted = set.is_completed === true;
      return completionTab === "complete" ? isCompleted : !isCompleted;
    });
  }, [unassignedSets, completionTab]);

  const renderSetGrid = useMemo(() => {
    if (loadingSets) {
      return <p className={styles.statusText}>Đang tải học phần...</p>;
    }
    if (!sets.length) {
      return (
        <>
          <div className={styles.emptyState}>
            <p>{currentFolder ? "Thư mục này chưa có học phần" : "Bạn chưa tạo học phần nào"}</p>
            <button className={styles.secondaryBtn} onClick={handleAddSection}>
              Tạo học phần đầu tiên
            </button>
          </div>
          {currentFolder && filteredUnassignedSets.length > 0 && (
            <div className={styles.attachSection}>
              <h4 className={styles.attachTitle}>Chọn học phần chưa thuộc thư mục</h4>
              <div className={styles.cardGrid}>
                {filteredUnassignedSets.map(set => renderSetCard(set, { attachable: true }))}
              </div>
            </div>
          )}
        </>
      );
    }

    if (filteredSets.length === 0) {
      return (
        <div className={styles.emptyState}>
          <p>
            {completionTab === "complete" 
              ? "Chưa có học phần đã hoàn thành" 
              : "Tất cả học phần đã hoàn thành"}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.cardGrid}>
          {filteredSets.map(set => renderSetCard(set))}
        </div>
        {currentFolder && filteredUnassignedSets.length > 0 && (
          <div className={styles.attachSection}>
            <h4 className={styles.attachTitle}>Thêm học phần chưa có thư mục</h4>
            <div className={styles.cardGrid}>
              {filteredUnassignedSets.map(set => renderSetCard(set, { attachable: true }))}
            </div>
          </div>
        )}
      </>
    );
  }, [
    filteredSets,
    filteredUnassignedSets,
    sets,
    loadingSets,
    currentFolder,
    handleAddSection,
    renderSetCard,
    completionTab
  ]);

  const renderFolderList = useMemo(() => {
    if (loadingFolders) {
      return <p className={styles.statusText}>Đang tải thư mục...</p>;
    }

    if (!folders.length) {
      return (
        <div className={styles.emptyState}>
          <p>Bạn chưa có thư mục nào.</p>
          <button className={styles.secondaryBtn} onClick={handleAddFolder}>
            Thêm thư mục
          </button>
        </div>
      );
    }

    return (
      <div className={styles.listContainer}>
        {folders.map(f => (
          <div
            className={`${styles.listItem} ${numericFolderId === f.folder_id ? styles.activeFolder : ""}`}
            key={f.folder_id}
          >
            <div
              className={styles.listContent}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveTab("hocphan");
                navigate(`/flashcard/folders/${f.folder_id}`);
              }}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/flashcard/folders/${f.folder_id}`)}
            >
              <div className={styles.listIcon}>
                <IoFolderOpenOutline size={20} color="#fff" />
              </div>
              <div className={styles.listText}>
                <h3 className={styles.listTitle}>{f.folder_name}</h3>
                <p className={styles.listSubtitle}>{f.fcsets?.length || 0} học phần</p>
              </div>
            </div>
            <button
              className={`${styles.iconButton} ${styles.danger}`}
              title="Xóa thư mục"
              onClick={() => handleDeleteFolder(f)}
            >
              <FaTrashAlt size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  }, [folders, loadingFolders, handleAddFolder, navigate, numericFolderId, handleDeleteFolder]);

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />

        <div className={styles.libraryContainer}>
          <div className={styles.topBar}>
            <div>
              <h1 className={styles.libraryTitle}>Thư viện của bạn</h1>
              {currentFolder && (
                <div className={styles.filterPill}>
                  <span>Đang xem: {currentFolder.folder_name}</span>
                  <button onClick={() => navigate("/flashcard")}>Xóa lọc</button>
                </div>
              )}
            </div>

            <div className={styles.addSection}>
              <button
                className={styles.addBtn}
                onClick={handleAddClick}
                aria-haspopup="menu"
                aria-expanded={showDropdown}
                aria-label="Thêm học phần hoặc thư mục"
              >
                <FiPlus size={22} />
              </button>

              {showDropdown && (
                <div className={styles.dropdown} role="menu">
                  <button onClick={handleAddSection} className={styles.dropdownItem}>
                    <PiCardsLight /> <span>Học phần mới</span>
                  </button>
                  <button onClick={handleAddFolder} className={styles.dropdownItem}>
                    <IoFolderOpenOutline /> <span>Thư mục</span>
                  </button>
                  <button
                    onClick={handleCreateSetQuickly}
                    className={styles.dropdownItem}
                    disabled={creatingSet}
                  >
                    <PiCardsLight /> <span>Tạo nhanh học phần</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* Tabs */}
          <div className={styles.tabsWrap}>
            <div className={styles.tabs} role="tablist">
              <button
                className={`${styles.tabButton} ${activeTab === "hocphan" ? styles.active : ""}`}
                onClick={() => setActiveTab("hocphan")}
                role="tab"
                aria-selected={activeTab === "hocphan"}
              >
                Học phần
              </button>

              <button
                className={`${styles.tabButton} ${activeTab === "thumuc" ? styles.active : ""}`}
                onClick={() => setActiveTab("thumuc")}
                role="tab"
                aria-selected={activeTab === "thumuc"}
              >
                Thư mục
              </button>
            </div>

            {activeTab === "hocphan" && (
              <div style={{ marginBottom: "1rem", display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setCompletionTab("all")}
                  style={{
                    padding: "6px 12px",
                    background: completionTab === "all" ? "#77bef0" : "#e0e0e0",
                    color: completionTab === "all" ? "#fff" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem"
                  }}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setCompletionTab("incomplete")}
                  style={{
                    padding: "6px 12px",
                    background: completionTab === "incomplete" ? "#77bef0" : "#e0e0e0",
                    color: completionTab === "incomplete" ? "#fff" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem"
                  }}
                >
                  Chưa hoàn thành
                </button>
                <button
                  onClick={() => setCompletionTab("complete")}
                  style={{
                    padding: "6px 12px",
                    background: completionTab === "complete" ? "#77bef0" : "#e0e0e0",
                    color: completionTab === "complete" ? "#fff" : "#333",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.875rem"
                  }}
                >
                  Đã hoàn thành
                </button>
              </div>
            )}

            {activeTab === "hocphan" ? renderSetGrid : renderFolderList}
          </div>
        </div>
      </div>

      {/* Modal thêm thư mục */}
      {showFolderModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modal}>
            <h3>Thêm thư mục</h3>
            <input
              type="text"
              placeholder="Tên thư mục"
              value={folderTitle}
              onChange={(e) => setFolderTitle(e.target.value)}
              className={styles.input}
            />
            <div className={styles.modalButtons}>
              <button className={styles.createBtn} onClick={handleSaveFolder}>
                Thêm thư mục
              </button>
              <button className={styles.cancelBtn} onClick={handleCloseModal}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashcardLibrary;
