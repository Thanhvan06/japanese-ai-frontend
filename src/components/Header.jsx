import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import styles from "../styles/Header.module.css";
import { api } from "../lib/api";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState("jp");
  const [userAvatar, setUserAvatar] = useState(null);

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
