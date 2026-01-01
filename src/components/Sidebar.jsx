import { useState, useEffect } from "react";
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
import { api } from "../lib/api";

const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("");

  // build menu dynamically so we can insert admin links
  const baseMenu = [
    { icon: <FaHome />, label: "Trang chủ", path: "/home" },
    { icon: <FaBook />, label: "Từ vựng", path: "/vocab" },
    { icon: <FaPenNib />, label: "Ngữ pháp", path: "/grammar" },
    { icon: <FaEdit />, label: "Viết nhật ký", path: "/diary" },
    { icon: <FaClone />, label: "Flashcard", path: "/flashcard" },
    { icon: <FaHeadphones />, label: "Luyện nghe", path: "/listening" },
    { icon: <FaMicrophoneAlt />, label: "Luyện nói", path: "/speaking" },
    { icon: <FaRobot />, label: "Chatbot AI", path: "/chatbot" },
    { icon: <FaUser />, label: "Phòng học cá nhân", path: "/personal-study-room" },
    { icon: <FaRobot />, label: "Chatbot AI", path: "/chatbot" },  
  ];

  // detect current user to show admin links
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setCurrentUser(user);
      setIsAdmin(user?.role === "admin");
    } catch (e) {
      setCurrentUser(null);
      setIsAdmin(false);
    }

    // Also check via API to ensure role is up-to-date
    (async () => {
      try {
        const res = await api("/api/auth/me").catch(() => null);
        if (res?.user) {
          setCurrentUser(res.user);
          setIsAdmin(res.user.role === "admin");
          // Update localStorage
          localStorage.setItem("user", JSON.stringify(res.user));
        }
      } catch (err) {
        // Ignore errors
      }
    })();
  }, []);

  // Decide which menu to show:
  const adminMenu = [
    { icon: <FaHome />, label: "Trang chủ", path: "/admin" },
    { icon: <FaUserCog />, label: "Quản lý người dùng", path: "/admin/users" },
    { icon: <FaBook />, label: "Quản lý từ vựng", path: "/admin/vocab" },
    { icon: <FaPenNib />, label: "Quản lý ngữ pháp", path: "/admin/grammar" },
    { icon: <FaPenNib />, label: "Quản lý bài tập ngữ pháp", path: "/admin/grammar-exercises" },
  ];

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
  }, [location.pathname, isAdmin, isAdminArea]);

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
            <div className={styles.supportTitle}>SUPPORT</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li className={styles.menuItem} style={{ margin: "6px 8px" }} onClick={() => navigate("/settings")}>
                <FaCog />
                {isOpen && <span style={{ marginLeft: 8 }}>Setting</span>}
              </li>
              <li className={styles.menuItem} style={{ margin: "6px 8px" }} onClick={() => navigate("/help")}>
                <FaQuestionCircle />
                {isOpen && <span style={{ marginLeft: 8 }}>Help</span>}
              </li>
              <li className={styles.menuItem} style={{ margin: "6px 8px" }} onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/signin");
              }}>
                <FaSignOutAlt />
                {isOpen && <span style={{ marginLeft: 8 }}>Sign Out</span>}
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
