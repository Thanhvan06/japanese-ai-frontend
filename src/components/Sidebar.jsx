import { useState } from "react";
import {
  FaHome,
  FaBook,
  FaEdit,
  FaRobot,
  FaPenNib,
  FaClone,
  FaBars,
} from "react-icons/fa";
import styles from "../styles/Sidebar.module.css";
import { useSidebar } from "../context/SidebarContext";

const Sidebar = () => {
  const { isOpen, toggleSidebar } = useSidebar();
  const [active, setActive] = useState("Home");

  const menuItems = [
    { icon: <FaHome />, label: "Trang chủ" },
    { icon: <FaBook />, label: "Từ vựng" },
    { icon: <FaPenNib />, label: "Ngữ pháp" },
    { icon: <FaEdit />, label: "Viết nhật ký" },
    { icon: <FaClone />, label: "Tạo thẻ flashcard" },
    { icon: <FaRobot />, label: "Chatbot AI" },
  ];

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
              active === item.label ? styles.active : ""
            }`}
            onClick={() => setActive(item.label)}
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
