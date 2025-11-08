import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "../styles/Dashboard.module.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const cards = [
    { title: "Vocabulary", color: "#E0F7FA", path: "/vocab" },
    { title: "Grammar", color: "#FFF3E0", path: "/grammar" },
    { title: "Write Diary", color: "#E8F5E9", path: "/diary" },
    { title: "Flashcards", color: "#F3E5F5", path: "/flashcard" },
  ];

  return (
    <div className={styles.dashboard}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className={styles.mainContent}>
        <Header />

        <div className={styles.content}>
          <h1 className={styles.title}>Chào mừng bạn đến với ManaVi</h1>
          <p className={styles.subtitle}>Chọn chế độ học tập</p>

          <div className={styles.cardContainer}>
            {cards.map((c, i) => (
              <div
                key={i}
                className={styles.studyCard}
                style={{ backgroundColor: c.color, cursor: 'pointer' }}
                onClick={() => navigate(c.path)}
              >
                <h3>{c.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
