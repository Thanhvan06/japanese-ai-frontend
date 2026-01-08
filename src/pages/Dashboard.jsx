import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import styles from "../styles/Dashboard.module.css";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

const Dashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const cards = [
    { title: t("dashboard.vocabulary", language), color: "white", path: "/vocab" },
    { title: t("dashboard.grammar", language), color: "white", path: "/grammar" },
    { title: t("dashboard.writeDiary", language), color: "white", path: "/diary" },
    { title: t("dashboard.flashcards", language), color: "white", path: "/flashcard" },
    { title: t("dashboard.personalRoom", language), color: "white", path: "/personal-study-room" },
  ];

  return (
    <div className={styles.dashboard}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
  
      <div className={styles.mainContent}>
        <Header />
  
        <div className={styles.content}>
          <h1 className={styles.title} style={{ color: '#4aa6e0' }}>
            {t("dashboard.welcome", language)}
          </h1>
          <p className={styles.subtitle} style={{ color: '#4aa6e0' }}>
            {t("dashboard.selectMode", language)}
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
