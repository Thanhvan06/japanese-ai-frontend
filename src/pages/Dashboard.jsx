import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "../styles/Dashboard.module.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const cards = [
    { title: "Vocabulary", color: "white", path: "/vocab" },
    { title: "Grammar", color: "white", path: "/grammar" },
    { title: "Write Diary", color: "white", path: "/diary" },
    { title: "Flashcards", color: "white", path: "/flashcard" },
    { title: "Personal Room", color: "white", path: "/personal-study-room" },
  ];

  return (
    <div className={styles.dashboard}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
  
      <div className={styles.mainContent}>
        <Header />
  
        <div className={styles.content}>
          <h1 className={styles.title} style={{ color: '#4aa6e0' }}>
            Chào mừng bạn đến với ManaVi
          </h1>
          <p className={styles.subtitle} style={{ color: '#4aa6e0' }}>
            Chọn chế độ học tập
          </p>
  
          <div className={styles.cardContainer}>
            {cards.map((c, i) => (
              <div
                key={i}
                className={styles.studyCard}
                style={{ 
                  backgroundColor: '#ffffff', 
                  border: '2px solid #4aa6e0', 
                  cursor: 'pointer',
                  padding: '20px',
                  borderRadius: '12px' 
                }}
                onClick={() => navigate(c.path)}
              >
                <h3
                  className="text-xl font-bold text-center"
                  style={{ color: '#4aa6e0' }} 
                >
                  {c.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
