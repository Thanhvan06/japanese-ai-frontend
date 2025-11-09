import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import styles from "../styles/Header.module.css";
// import { logout } from "../lib/auth";

const Header = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState("jp");

  const langRef = useRef(null);
  const dropdownRef = useRef(null);

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setLangOpen(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");          
    setDropdownOpen(false);                    
    navigate("/signin", { replace: true });    
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        langRef.current &&
        !langRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setLangOpen(false);
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      {/* Left: logo */}
      <div className={styles.leftSection}>
        <div className={styles.logoWrapper} onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="ManaVi" className={styles.logoImg} />
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchContainer}>
        <input type="text" placeholder="Search..." className={styles.search} />
      </div>

      {/* Right */}
      <div className={styles.rightSection}>
        {/* Language */}
        <div className={styles.languageWrapper} ref={langRef}>
          <button
            className={styles.flagBtn}
            onClick={() => setLangOpen(!langOpen)}
          >
            <img
              src={
                language === "jp"
                  ? "/flags/japan.png"
                  : language === "en"
                  ? "/flags/uk.png"
                  : "/flags/vietnam.png"
              }
              alt={language}
              className={styles.flagIcon}
            />
          </button>

          {langOpen && (
            <div className={styles.langDropdown}>
              <button className={styles.langOption} onClick={() => handleSelectLanguage("jp")}>
                <img src="/flags/japan.png" alt="jp" />
                <span>日本語</span>
              </button>
              <button className={styles.langOption} onClick={() => handleSelectLanguage("en")}>
                <img src="/flags/uk.png" alt="en" />
                <span>English</span>
              </button>
              <button className={styles.langOption} onClick={() => handleSelectLanguage("vn")}>
                <img src="/flags/vietnam.png" alt="vn" />
                <span>Tiếng Việt</span>
              </button>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className={styles.avatarWrapper} ref={dropdownRef}>
          <FaUserCircle
            size={28}
            className={styles.avatar}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />
          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button onClick={() => { setDropdownOpen(false); navigate('/edit-profile'); }} className={styles.dropdownItem}>
                Edit Profile
              </button>
              <button onClick={handleSignOut} className={styles.dropdownItem}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
