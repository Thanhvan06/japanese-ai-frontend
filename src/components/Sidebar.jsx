import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaEdit,
  FaRobot,
  FaPenNib,
  FaClone,
  FaBars,
  FaHeadphones,
  FaMicrophoneAlt,
  FaUserCog,
  FaCog,
  FaQuestionCircle,
  FaSignOutAlt,
  FaUser,
} from "react-icons/fa";
import styles from "../styles/Sidebar.module.css";
import { useSidebar } from "../context/SidebarContext";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";
import { api } from "../lib/api";

const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [active, setActive] = useState("");

  // build menu dynamically so we can insert admin links
  const baseMenu = useMemo(() => [
    { icon: <FaHome />, label: t("sidebar.home", language), path: "/home" },
    { icon: <FaBook />, label: t("sidebar.vocabulary", language), path: "/vocab" },
    { icon: <FaPenNib />, label: t("sidebar.grammar", language), path: "/grammar" },
    { icon: <FaEdit />, label: t("sidebar.diary", language), path: "/diary" },
    { icon: <FaClone />, label: t("sidebar.flashcard", language), path: "/flashcard" },
    { icon: <FaUser />, label: t("sidebar.personalRoom", language), path: "/personal-study-room" },
    { icon: <FaHeadphones />, label: t("sidebar.listening", language), path: "/listening" },
    { icon: <FaMicrophoneAlt />, label: t("sidebar.speaking", language), path: "/speaking" },
    { icon: <FaRobot />, label: t("sidebar.chatbot", language), path: "/chatbot" },  
  ], [language]);

  // detect current user to show admin links
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setIsAdmin(user?.role === "admin");
    } catch {
      setIsAdmin(false);
    }

    // Also check via API to ensure role is up-to-date
    (async () => {
      try {
        const res = await api("/api/auth/me").catch(() => null);
        if (res?.user) {
          setIsAdmin(res.user.role === "admin");
          // Update localStorage
          localStorage.setItem("user", JSON.stringify(res.user));
        }
      } catch {
        // Ignore errors
      }
    })();
  }, []);

  // Decide which menu to show:
  const adminMenu = useMemo(() => [
    { icon: <FaHome />, label: t("sidebar.adminHome", language), path: "/admin" },
    { icon: <FaUserCog />, label: t("sidebar.adminUsers", language), path: "/admin/users" },
    { icon: <FaBook />, label: t("sidebar.adminVocab", language), path: "/admin/vocab" },
    { icon: <FaPenNib />, label: t("sidebar.adminGrammar", language), path: "/admin/grammar" },
    { icon: <FaPenNib />, label: t("sidebar.adminGrammarExercises", language), path: "/admin/grammar-exercises" },
  ], [language]);

  const isAdminArea = location.pathname.startsWith("/admin");
  
  // Show admin menu only if user is admin, otherwise show base menu
  // If already in admin area, show admin menu (AdminRoute will protect it)
  const menuItems = isAdminArea ? adminMenu : (isAdmin ? [...baseMenu, ...adminMenu] : baseMenu);

  useEffect(() => {
    const currentPath = location.pathname;
    const allMenuItems = isAdminArea ? adminMenu : (isAdmin ? [...baseMenu, ...adminMenu] : baseMenu);
    const currentItem = allMenuItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActive(currentItem.path);
    }
  }, [location.pathname, isAdmin, isAdminArea, adminMenu, baseMenu]);

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`} style={{ display: "flex", flexDirection: "column" }}>
      <button className={styles.toggleBtn} onClick={toggleSidebar}>
        <FaBars />
      </button>

      <div style={{ flex: "1 1 auto" }}>
        <ul className={styles.menu}>
          {menuItems.map((item, i) => (
            <li
              key={i}
              className={`${styles.menuItem} ${active === item.path ? styles.active : ""}`}
              onClick={() => {
                navigate(item.path);
                setActive(item.path);
              }}
            >
              {item.icon}
              {isOpen && <span>{item.label}</span>}
            </li>
          ))}
        </ul>
      </div>

      {isAdminArea && (
        <div style={{ marginTop: "auto", padding: "12px 8px" }}>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12 }}>
            <div className={styles.supportTitle}>{t("sidebar.support", language)}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li className={styles.menuItem} style={{ margin: "6px 8px" }} onClick={() => navigate("/settings")}>
                <FaCog />
                {isOpen && <span style={{ marginLeft: 8 }}>{t("sidebar.settings", language)}</span>}
              </li>
              <li className={styles.menuItem} style={{ margin: "6px 8px" }} onClick={() => navigate("/help")}>
                <FaQuestionCircle />
                {isOpen && <span style={{ marginLeft: 8 }}>{t("sidebar.help", language)}</span>}
              </li>
              <li className={styles.menuItem} style={{ margin: "6px 8px" }} onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/signin");
              }}>
                <FaSignOutAlt />
                {isOpen && <span style={{ marginLeft: 8 }}>{t("header.signOut", language)}</span>}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
