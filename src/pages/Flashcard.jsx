import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "../styles/Flashcard.module.css";
import { FiPlus } from "react-icons/fi";
import { IoFolderOpenOutline } from "react-icons/io5";
import { PiCardsLight } from "react-icons/pi";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const FOLDERS = [
  {
    id: "tuvungN2",
    title: "Từ vựng N2",
    items: [
      { id: 1, title: "Từ vựng N2 - A", count: 78 },
      { id: 2, title: "Từ vựng N2 - B", count: 42 },
      { id: 3, title: "Từ vựng N2 - C", count: 96 },
    ],
  },
  {
    id: "tuvungN3",
    title: "Từ vựng N3",
    items: [{ id: 4, title: "Từ vựng N3 - A", count: 30 }],
  },
];

const FlashcardLibrary = () => {
  const navigate = useNavigate();
  const { folderName } = useParams(); 

  const [showDropdown, setShowDropdown] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [activeTab, setActiveTab] = useState("hocphan");

  const currentFolder = useMemo(
    () => FOLDERS.find((f) => f.id === folderName) || null,
    [folderName]
  );

  useEffect(() => {
    if (currentFolder) setActiveTab("thumuc");
  }, [currentFolder]);

  const handleAddClick = useCallback(() => {
    setShowDropdown((s) => !s);
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

  const handleSaveFolder = useCallback(() => {
    if (folderTitle.trim()) {
      alert(`Đã thêm thư mục: ${folderTitle}`);
      handleCloseModal();
    }
  }, [folderTitle, handleCloseModal]);

  const renderSectionList = useCallback(
    (sections) => (
      <div className={styles.listContainer}>
        {sections.map((s) => (
          <div
            className={styles.listItem}
            key={s.id}
            onClick={() => navigate(`/flashcard/vocab-practice/${s.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/flashcard/vocab-practice/${s.id}`)}
          >
            <div className={styles.listText}>
              <h3 className={styles.listTitle}>{s.title}</h3>
              <p className={styles.listSubtitle}>{s.count} thuật ngữ</p>
            </div>
          </div>
        ))}
      </div>
    ),
    [navigate]
  );

  const renderFolderList = useCallback(
    (folders) => (
      <div className={styles.listContainer}>
        {folders.map((f) => (
          <div
            className={styles.listItem}
            key={f.id}
            onClick={() => navigate(`/flashcard/folders/${f.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(`/flashcard/folders/${f.id}`)}
          >
            <div className={styles.listIcon}>
              <IoFolderOpenOutline size={20} color="#fff" />
            </div>
            <div className={styles.listText}>
              <h3 className={styles.listTitle}>{f.title}</h3>
              <p className={styles.listSubtitle}>{(f.items?.length || 0)} học phần</p>
            </div>
          </div>
        ))}
      </div>
    ),
    [navigate]
  );

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />

        <div className={styles.libraryContainer}>
          <div className={styles.topBar}>
            <h1 className={styles.libraryTitle}>Thư viện của bạn</h1>

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
                    <PiCardsLight /> <span>Học phần</span>
                  </button>
                  <button onClick={handleAddFolder} className={styles.dropdownItem}>
                    <IoFolderOpenOutline /> <span>Thư mục</span>
                  </button>
                </div>
              )}
            </div>
          </div>

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

            {currentFolder && (
              <div className={styles.folderBanner}>
                <h2 className={styles.folderTitle} >
                  {currentFolder.title}
                </h2>
              </div>
            )}

            {/* Nội dung theo tab / trạng thái */}
            <div className={styles.tabPanel}>
              {currentFolder
                ? renderSectionList(currentFolder.items || [])
                : activeTab === "hocphan"
                ? renderSectionList(
                    // fallback list demo khi không mở thư mục
                    (FOLDERS.find((f) => f.id === "tuvungN2")?.items || []).slice(0, 3)
                  )
                : renderFolderList(FOLDERS)}
            </div>
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
              placeholder="Title"
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
