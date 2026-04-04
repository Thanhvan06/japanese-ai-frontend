import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { api } from "../lib/api";
import styles from "../styles/Header.module.css";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../i18n/translations";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  // Treat tablet like mobile for header search UX.
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 1024px)").matches;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [studyOpen, setStudyOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // 🔍 Search state
  const [searchText, setSearchText] = useState("");

  // refs
  const dropdownRef = useRef(null);
  const studyRef = useRef(null);
  const langRef = useRef(null);
  const mobileSearchWrapperRef = useRef(null);

  const [studyInfo, setStudyInfo] = useState(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyError, setStudyError] = useState("");

  useEffect(() => {
    const fetchStudy = async () => {
      try {
        setStudyLoading(true);
        setStudyError("");
        // debug: fetch initial study progress
        // eslint-disable-next-line no-console
        console.log("[Study] Fetching initial progress");
        const data = await api("/api/study/progress");
        // eslint-disable-next-line no-console
        console.log("[Study] Initial progress", data);
        setStudyInfo(data);
      } catch (e) {
        setStudyError(e.message || t("header.studyLoadError", language));
      } finally {
        setStudyLoading(false);
      }
    };

    fetchStudy();
  }, []);

  useEffect(() => {
    let activeStart =
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
        ? Date.now()
        : null;

    const flushSession = async () => {
      if (activeStart == null) return;
      const now = Date.now();
      const diffMs = now - activeStart;
      activeStart = null;
      const minutes = Math.floor(diffMs / 60000);
      // eslint-disable-next-line no-console
      console.log("[Study] Flushing session", {
        diffMs,
        minutes,
      });
      if (minutes <= 0) return;
      try {
        const startDate = new Date(now - diffMs);
        const endDate = new Date(now);
        // eslint-disable-next-line no-console
        console.log("[Study] Sending session", {
          startedAt: startDate.toISOString(),
          endedAt: endDate.toISOString(),
          durationMinutes: minutes,
        });
        await api("/api/study/sessions", {
          method: "POST",
          body: JSON.stringify({
            startedAt: startDate.toISOString(),
            endedAt: endDate.toISOString(),
            durationMinutes: minutes,
            source: "app",
            activityType: "auto",
          }),
        });
        const updated = await api("/api/study/progress");
        // eslint-disable-next-line no-console
        console.log("[Study] Updated progress after flush", updated);
        setStudyInfo(updated);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[Study] Failed to log study session", e);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (activeStart == null) {
          activeStart = Date.now();
        }
      } else {
        void flushSession();
      }
    };

    const handleBeforeUnload = () => {
      void flushSession();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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
        !dropdownRef.current.contains(e.target) &&
        studyRef.current &&
        !studyRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
        setStudyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileSearchOpen) return;

    const handleClickOutside = (e) => {
      if (
        mobileSearchWrapperRef.current &&
        !mobileSearchWrapperRef.current.contains(e.target)
      ) {
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileSearchOpen]);

  return (
    <header
      className={`${styles.header} ${
        mobileSearchOpen ? styles.headerOverlay : ""
      }`}
      style={{ position: "relative" }}
    >
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

      {!location.pathname.startsWith("/admin") && !isMobile && (
        <div
          className={styles.searchContainer}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
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
      )}

      {/* RIGHT */}
      <div className={styles.rightSection}>
        {!location.pathname.startsWith("/admin") && isMobile && (
          <div
            ref={mobileSearchWrapperRef}
            className={styles.mobileSearchWrapper}
          >
            <button
              type="button"
              className={styles.mobileSearchToggle}
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Open search"
              title="Search"
            >
              <FaSearch />
            </button>

            {mobileSearchOpen && (
              <div className={styles.mobileSearchOverlay}>
                <form onSubmit={handleSearchSubmit}>
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
            )}
          </div>
        )}

        {/* Study progress circle */}
        <div
          className={styles.studyBadgeWrapper}
          ref={studyRef}
          onClick={() => setStudyOpen((v) => !v)}
        >
          <div
            className={styles.studyCircle}
            style={{
              background: (() => {
                if (!studyInfo || studyLoading) {
                  return "conic-gradient(#e0e0e0 0deg, #e0e0e0 360deg)";
                }
                const goal = studyInfo.dailyGoalMinutes || 1;
                const progress = Math.min(
                  1,
                  studyInfo.todayMinutes / goal
                );
                const deg = Math.round(progress * 360);
                return `conic-gradient(#1976d2 0deg, #1976d2 ${deg}deg, #e0e0e0 ${deg}deg 360deg)`;
              })(),
            }}
          >
            <div className={styles.studyCircleInner}>
              <span className={styles.studyCircleText}>
                {studyLoading || !studyInfo
                  ? "..."
                  : `${Math.min(
                      100,
                      Math.round(
                        (studyInfo.todayMinutes /
                          (studyInfo.dailyGoalMinutes || 1)) *
                          100
                      )
                    )}%`}
              </span>
            </div>
          </div>
          {studyOpen && (
            <div className={styles.studyDropdown}>
              {studyError && (
                <p className={styles.studyError}>{studyError}</p>
              )}
              {studyInfo && !studyError && (
                <>
                  <p>
                    Hôm nay:{" "}
                    <strong>{studyInfo.todayMinutes}</strong>/
                    <strong>{studyInfo.dailyGoalMinutes}</strong> phút
                  </p>
                  <p>
                    Streak hiện tại:{" "}
                    <strong>{studyInfo.currentStreak}</strong> ngày
                  </p>
                  <p>
                    Streak dài nhất:{" "}
                    <strong>{studyInfo.longestStreak}</strong> ngày
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Language */}
        <div className={styles.languageWrapper} ref={langRef}>
          <button
            className={styles.flagBtn}
            onClick={handleToggleContentLanguage}
            title={
              language === "vi"
                ? t("header.switchToEnglish", language)
                : t("header.switchToVietnamese", language)
            }
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
