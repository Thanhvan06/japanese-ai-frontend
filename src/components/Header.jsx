import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import styles from "../styles/Header.module.css";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);

  // 🔍 Search state
  const [searchText, setSearchText] = useState("");

  // refs
  const dropdownRef = useRef(null);

  // Toggle between Vietnamese and English (for content translation)
  const handleToggleContentLanguage = () => {
    toggleLanguage();
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
  // Fetch user data to display avatar
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const data = await api("/api/auth/me");
        if (data.user.avatar_url) {
          setUserAvatar(`${BASE_URL}/${data.user.avatar_url}`);
        } else {
          setUserAvatar(null);
        }
      } catch {
        // Silently fail if not authenticated
        setUserAvatar(null);
      }
    };

    fetchUserData();
    
    // Refresh avatar when profile is updated
    const handleProfileUpdate = () => {
      fetchUserData();
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    
    // Refresh avatar when navigating back from edit-profile
    const handleFocus = () => {
      if (location.pathname !== "/edit-profile") {
        fetchUserData();
      }
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
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
            placeholder={t("header.searchPlaceholder", language)}
            className={styles.search}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: "100%" }}
          />
        </form>
      </div>

      {/* RIGHT */}
      <div className={styles.rightSection}>
        {/* Language Toggle */}
        <div className={styles.languageWrapper}>
          <button
            className={styles.flagBtn}
            onClick={handleToggleContentLanguage}
            title={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
          >
            <img
              src={language === "en" ? "/flags/uk.png" : "/flags/vietnam.png"}
              alt={language}
              className={styles.flagIcon}
            />
          </button>
        </div>

        {/* Avatar */}
        <div className={styles.avatarWrapper} ref={dropdownRef}>

          {userAvatar ? (
            <img
              src={userAvatar}
              alt="Avatar"
              className={styles.avatar}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                objectFit: "cover",
                cursor: "pointer",
              }}
            />
          ) : (
            <FaUserCircle
              size={28}
              className={styles.avatar}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            />
          )}
          {dropdownOpen && (
            <div className={styles.dropdown}>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate("/edit-profile");
                }}
                className={styles.dropdownItem}
              >
                {t("header.editProfile", language)}
              </button>

              <button onClick={handleSignOut} className={styles.dropdownItem}>
                {t("header.signOut", language)}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
