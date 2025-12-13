import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import styles from "../styles/Header.module.css";

const Header = () => {
  const navigate = useNavigate();

  // UI states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState("jp");

  // 🔍 Search state
  const [searchText, setSearchText] = useState("");

  // refs
  const langRef = useRef(null);
  const dropdownRef = useRef(null);

  // language select
  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    setLangOpen(false);
  };

  // logout
  const handleSignOut = () => {
    localStorage.removeItem("token");
    setDropdownOpen(false);
    navigate("/signin", { replace: true });
  };

  // 🔥 SEARCH: Enter → chuyển sang /search và HIỆN KẾT QUẢ NGAY
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}&type=all`);
  };

  // click outside → close dropdowns
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
    <header className={styles.header} style={{ position: "relative" }}>
      {/* LEFT: Logo */}
      <div className={styles.leftSection}>
        <div
          className={styles.logoWrapper}
          onClick={() => navigate("/home")}
          style={{ cursor: "pointer" }}
        >
          <img src="/logo.png" alt="ManaVi" className={styles.logoImg} />
        </div>
      </div>

      <div
        className={styles.searchContainer}
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(520px, 50vw)", 
          display: "flex",
          justifyContent: "center",
          pointerEvents: "auto",
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ width: "100%" }}>
          <input
            type="text"
            placeholder="Search..."
            className={styles.search}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "100%" }}
          />
        </form>
      </div>

      {/* RIGHT */}
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
              <button
                className={styles.langOption}
                onClick={() => handleSelectLanguage("jp")}
              >
                <img src="/flags/japan.png" alt="jp" />
                <span>日本語</span>
              </button>

              <button
                className={styles.langOption}
                onClick={() => handleSelectLanguage("en")}
              >
                <img src="/flags/uk.png" alt="en" />
                <span>English</span>
              </button>

              <button
                className={styles.langOption}
                onClick={() => handleSelectLanguage("vn")}
              >
                <img src="/flags/vietnam.png" alt="vn" />
                <span>Tiếng Việt</span>
              </button>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className={styles.avatarWrapper} ref={dropdownRef}>
          <FaUserCircle
            size={28}
            className={styles.avatar}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />

          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/edit-profile");
                }}
                className={styles.dropdownItem}
              >
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
