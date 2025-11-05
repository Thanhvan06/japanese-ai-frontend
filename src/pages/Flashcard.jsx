import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Flashcard.module.css";
import { FiPlus } from "react-icons/fi";
import { IoFolderOpenOutline } from "react-icons/io5";
import { PiCardsLight } from "react-icons/pi";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const FlashcardLibrary = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderTitle, setFolderTitle] = useState("");
  const [activeTab, setActiveTab] = useState("hocphan"); 

  const handleAddClick = () => setShowDropdown(!showDropdown);

  const handleAddSection = () => {
    navigate("/newflashcard");
    setShowDropdown(false);
  };

  const handleAddFolder = () => {
    setShowFolderModal(true);
    setShowDropdown(false);
  };

  const handleCloseModal = () => {
    setShowFolderModal(false);
    setFolderTitle("");
  };

  const handleSaveFolder = () => {
    if (folderTitle.trim()) {
      alert(`Đã thêm thư mục: ${folderTitle}`);
      handleCloseModal();
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />

        <div className={styles.libraryContainer}>
          <div className={styles.topBar}>
            <h1 className={styles.libraryTitle}>Thư viện của bạn</h1>

            <div className={styles.addSection}>
              <button className={styles.addBtn} onClick={handleAddClick}>
                <FiPlus size={22} />
              </button>

              {showDropdown && (
                <div className={styles.dropdown}>
                  <div onClick={handleAddSection}>
                    <PiCardsLight /> <span>Học phần</span>
                  </div>
                  <div onClick={handleAddFolder}>
                    <IoFolderOpenOutline /> <span>Thư mục</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.tabsWrap}>
            <div className={styles.tabs} role="tablist">
              <button
                className={`${styles.tabButton} ${
                  activeTab === "hocphan" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("hocphan")}
                role="tab"
                aria-selected={activeTab === "hocphan"}
              >
                Học phần
              </button>
              <button
                className={`${styles.tabButton} ${
                  activeTab === "thumuc" ? styles.active : ""
                }`}
                onClick={() => setActiveTab("thumuc")}
                role="tab"
                aria-selected={activeTab === "thumuc"}
              >
                Thư mục
              </button>
            </div>

            <div className={styles.tabPanel}>
              {activeTab === "hocphan" && (
                <div className={styles.listContainer}>
                  {[
                    { id: 1, title: "Từ vựng N2", count: 78 },
                    { id: 2, title: "Từ vựng N2", count: 42 },
                    { id: 3, title: "Từ vựng N2", count: 96 },
                  ].map((s) => (
                    <div className={styles.listItem} key={s.id}>
                      <div className={styles.listText}>
                        <h3 className={styles.listTitle}>{s.title}</h3>
                        <p className={styles.listSubtitle}>{s.count} thuật ngữ</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "thumuc" && (
                <div className={styles.listContainer}>
                  {[
                    { id: 11, title: "Từ vựng N2", count: 120 },
                    { id: 12, title: "Từ vựng N2", count: 58 },
                  ].map((f) => (
                    <div className={styles.listItem} key={f.id}>
                      <div className={styles.listIcon}>
                        <IoFolderOpenOutline size={20} color="#fff" />
                      </div>
                      <div className={styles.listText}>
                        <h3 className={styles.listTitle}>{f.title}</h3>
                          <p className={styles.listSubtitle}>{f.items || 0} học phần</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showFolderModal && (
        <div className={styles.modalOverlay}>
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
