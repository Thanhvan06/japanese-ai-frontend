import { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "../styles/Dashboard.module.css";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const cards = [
    { title: "Vocabulary", color: "#E0F7FA" },
    { title: "Grammar", color: "#FFF3E0" },
    { title: "Write Diary", color: "#E8F5E9" },
    { title: "Flashcards", color: "#F3E5F5" },
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
                style={{ backgroundColor: c.color }}
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
