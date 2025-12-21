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
  FaUser,
} from "react-icons/fa";
import styles from "../styles/Sidebar.module.css";
import { useSidebar } from "../context/SidebarContext";

const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("");

  const menuItems = [
    { icon: <FaHome />, label: "Trang chủ", path: "/home" },
    { icon: <FaBook />, label: "Từ vựng", path: "/vocab" },
    { icon: <FaPenNib />, label: "Ngữ pháp", path: "/grammar" },
    { icon: <FaEdit />, label: "Viết nhật ký", path: "/diary" },
    { icon: <FaClone />, label: "Flashcard", path: "/flashcard" },
    { icon: <FaRobot />, label: "Chatbot AI", path: "/chatbot" },
    { icon: <FaUser />, label: "Phòng học cá nhân", path: "/personal-study-room" },
  ];

  useEffect(() => {
    const currentPath = location.pathname;
    const currentItem = menuItems.find(item => item.path === currentPath);
    if (currentItem) {
      setActive(currentItem.path);
    }
  }, [location.pathname]);

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
      <button className={styles.toggleBtn} onClick={toggleSidebar}>
        <FaBars />
      </button>

      <ul className={styles.menu}>
        {menuItems.map((item, i) => (
          <li
            key={i}
            className={`${styles.menuItem} ${
              active === item.path ? styles.active : ""
            }`}
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
  );
};

export default Sidebar;
