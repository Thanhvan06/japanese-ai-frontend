import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { api } from "../lib/api";
import styles from "../styles/Header.module.css";

const Header = () => {
  const navigate = useNavigate();

  // UI states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState("jp");
  const [studyOpen, setStudyOpen] = useState(false);

  // 🔍 Search state
  const [searchText, setSearchText] = useState("");

  // refs
  const langRef = useRef(null);
  const dropdownRef = useRef(null);
  const studyRef = useRef(null);

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
        setStudyError(e.message || "Không tải được tiến độ học");
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
        !dropdownRef.current.contains(e.target) &&
        studyRef.current &&
        !studyRef.current.contains(e.target)
      ) {
        setLangOpen(false);
        setDropdownOpen(false);
        setStudyOpen(false);
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
