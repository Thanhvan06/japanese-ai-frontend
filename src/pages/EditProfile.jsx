import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import styles from "../styles/EditProfile.module.css";
import { api } from "../lib/api";
import { listSets } from "../services/flashcardService";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const EditProfile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    oldPassword: "",
    newPassword: "",
  });
  const [studyPlan, setStudyPlan] = useState({
    start_date: "",
    end_date: "",
    target_level: "N5",
  });
  const [studyPlanData, setStudyPlanData] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [activeTab, setActiveTab] = useState("incomplete");
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch current user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await api("/api/auth/me");
        setProfile({
          displayName: data.user.display_name || "",
          email: data.user.email || "",
          oldPassword: "",
          newPassword: "",
        });
        // Set avatar preview if user has avatar
        if (data.user.avatar_url) {
          setAvatarPreview(`${BASE_URL}/${data.user.avatar_url}`);
        }
      } catch (err) {
        setMessage(err.message || "Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Fetch flashcard sets
    const fetchSets = async () => {
      try {
        setLoadingSets(true);
        const res = await listSets();
        setFlashcardSets(res.sets || []);
      } catch (err) {
        console.error("Error loading flashcard sets:", err);
      } finally {
        setLoadingSets(false);
      }
    };
    fetchSets();
    
    // Listen for flashcard completion events to refetch sets
    const handleFlashcardCompleted = () => {
      fetchSets();
    };
    
    window.addEventListener("flashcardSetCompleted", handleFlashcardCompleted);
    return () => {
      window.removeEventListener("flashcardSetCompleted", handleFlashcardCompleted);
    };
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để cập nhật profile");
      }

      const formData = new FormData();
      formData.append("displayName", profile.displayName);
      
      // Chỉ gửi password nếu cả oldPassword và newPassword đều có giá trị
      if (profile.oldPassword && profile.oldPassword.trim() !== "" && 
          profile.newPassword && profile.newPassword.trim() !== "") {
        formData.append("oldPassword", profile.oldPassword);
        formData.append("newPassword", profile.newPassword);
      }

      // Chỉ gửi file nếu có file mới được chọn
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const response = await fetch(`${BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      setMessage("Cập nhật profile thành công!");
      
      // Cập nhật avatar preview nếu có avatar mới
      if (data.user.avatar_url) {
        setAvatarPreview(`${BASE_URL}/${data.user.avatar_url}`);
      }
      
      // Reset password fields
      setProfile({ ...profile, oldPassword: "", newPassword: "" });
      setAvatarFile(null);
      
      // Trigger avatar refresh in Header by dispatching custom event
      window.dispatchEvent(new Event("profileUpdated"));
    } catch (err) {
      setMessage(err.message || "Có lỗi xảy ra khi cập nhật profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStudyPlan = async () => {
    if (!studyPlan.start_date || !studyPlan.end_date) {
      setMessage("Vui lòng nhập đầy đủ ngày bắt đầu và kết thúc");
      return;
    }
    setSavingPlan(true);
    setMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Bạn cần đăng nhập để tạo kế hoạch học tập");
      }
      const response = await fetch(`${BASE_URL}/api/profile/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(studyPlan),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Request failed: ${response.status}`);
      }
      const data = await response.json();
      setStudyPlanData(data);
      setMessage("Tạo kế hoạch học tập thành công!");
      
      // Refetch flashcard sets to show newly generated sets
      try {
        const res = await listSets();
        setFlashcardSets(res.sets || []);
      } catch (err) {
        console.error("Error refreshing flashcard sets:", err);
      }
    } catch (err) {
      setMessage(err.message || "Có lỗi xảy ra khi tạo kế hoạch học tập");
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.editProfileContainer}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={styles.mainContent}>
          <Header />
          <div className={styles.profileWrapper}>
            <p>Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editProfileContainer}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div className={styles.mainContent}>
        <Header />

        <div className={styles.profileWrapper}>
          <h2 className={styles.title}>Edit profile</h2>

          {/* Avatar Upload */}
          <div className={styles.avatarContainer}>
            <label htmlFor="avatarUpload" className={styles.avatarLabel}>
              <div className={styles.avatarPreview}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className={styles.avatarImg} />
                ) : (
                  <div className={styles.avatarPlaceholder}></div>
                )}
              </div>
            </label>
            <input
              type="file"
              id="avatarUpload"
              accept="image/*"
              onChange={handleAvatarChange}
              className={styles.avatarInput}
            />
          </div>

          {message && (
            <div className={styles.message} style={{ 
              color: message.includes("thành công") ? "green" : "red",
              marginBottom: "1rem",
              textAlign: "center"
            }}>
              {message}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              name="displayName"
              value={profile.displayName}
              onChange={handleChange}
              className={styles.input}
            />
            <hr />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className={styles.input}
              disabled
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            />
            <hr />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mật khẩu cũ</label>
            <input
              type="password"
              name="oldPassword"
              value={profile.oldPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nhập mật khẩu cũ để đổi mật khẩu"
            />
            <hr />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mật khẩu mới</label>
            <input
              type="password"
              name="newPassword"
              value={profile.newPassword}
              onChange={handleChange}
              className={styles.input}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            />
            <hr />
          </div>

          <button 
            className={styles.saveButton} 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "Save"}
          </button>

          {/* Study Plan Section */}
          <div className={styles.formGroup} style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #e0e0e0" }}>
            <h3 className={styles.label} style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Kế hoạch học tập</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Ngày bắt đầu</label>
              <input
                type="date"
                value={studyPlan.start_date}
                onChange={(e) => setStudyPlan({ ...studyPlan, start_date: e.target.value })}
                className={styles.input}
              />
              <hr />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ngày kết thúc</label>
              <input
                type="date"
                value={studyPlan.end_date}
                onChange={(e) => setStudyPlan({ ...studyPlan, end_date: e.target.value })}
                className={styles.input}
              />
              <hr />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Mục tiêu JLPT</label>
              <select
                value={studyPlan.target_level}
                onChange={(e) => setStudyPlan({ ...studyPlan, target_level: e.target.value })}
                className={styles.input}
              >
                <option value="N5">N5</option>
                <option value="N4">N4</option>
                <option value="N3">N3</option>
                <option value="N2">N2</option>
                <option value="N1">N1</option>
              </select>
              <hr />
            </div>

            <button 
              className={styles.saveButton} 
              onClick={handleCreateStudyPlan}
              disabled={savingPlan}
              style={{ marginTop: "1rem", marginLeft: "11.5rem" }}
            >
              {savingPlan ? "Đang tạo..." : "Tạo kế hoạch học tập"}
            </button>

            {studyPlanData && (
              <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
                <h4 style={{ marginBottom: "0.5rem", fontSize: "1rem", fontWeight: "600" }}>Kế hoạch đã tạo:</h4>
                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                  Từ {new Date(studyPlanData.plan.start_date).toLocaleDateString("vi-VN")} đến {new Date(studyPlanData.plan.end_date).toLocaleDateString("vi-VN")}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                  Mục tiêu: JLPT {studyPlanData.plan.target_level}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
                  Tổng từ vựng: {studyPlanData.plan.total_vocab || 0}
                </p>
                <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "1rem" }}>
                  Từ vựng mỗi ngày: {studyPlanData.plan.words_per_day || 0}
                </p>
                
                {/* Display auto-generated flashcard sets */}
                {studyPlanData.generated_sets && studyPlanData.generated_sets.length > 0 && (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #ddd" }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem", color: "#333" }}>
                      Đã tạo {studyPlanData.generated_sets.length} bộ thẻ học tự động:
                    </p>
                    <div style={{ maxHeight: "150px", overflowY: "auto" }}>
                      {studyPlanData.generated_sets.slice(0, 5).map((set) => (
                        <div key={set.set_id} style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.25rem", padding: "0.25rem 0" }}>
                          • {set.set_name} ({set.card_count} thẻ)
                        </div>
                      ))}
                      {studyPlanData.generated_sets.length > 5 && (
                        <p style={{ fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>
                          ... và {studyPlanData.generated_sets.length - 5} bộ thẻ khác
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {studyPlanData.items && studyPlanData.items.length > 0 && (
                  <div style={{ marginTop: "1rem", maxHeight: "200px", overflowY: "auto" }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>Chi tiết từng ngày:</p>
                    {studyPlanData.items.slice(0, 7).map((item, idx) => (
                      <div key={idx} style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.25rem" }}>
                        {new Date(item.study_date).toLocaleDateString("vi-VN")}: {item.required_vocab_count || 0} từ
                      </div>
                    ))}
                    {studyPlanData.items.length > 7 && (
                      <p style={{ fontSize: "0.8rem", color: "#999", fontStyle: "italic" }}>
                        ... và {studyPlanData.items.length - 7} ngày khác
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Flashcard Sets Section */}
          <div className={styles.formGroup} style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #e0e0e0" }}>
            <h3 className={styles.label} style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Bộ thẻ học</h3>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
              <button
                onClick={() => setActiveTab("incomplete")}
                style={{
                  padding: "8px 16px",
                  background: activeTab === "incomplete" ? "#77bef0" : "#e0e0e0",
                  color: activeTab === "incomplete" ? "#fff" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Chưa hoàn thành
              </button>
              <button
                onClick={() => setActiveTab("complete")}
                style={{
                  padding: "8px 16px",
                  background: activeTab === "complete" ? "#77bef0" : "#e0e0e0",
                  color: activeTab === "complete" ? "#fff" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Đã hoàn thành
              </button>
            </div>

            {loadingSets ? (
              <p style={{ color: "#666" }}>Đang tải...</p>
            ) : flashcardSets.length === 0 ? (
              <p style={{ color: "#666" }}>Chưa có bộ thẻ nào</p>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {flashcardSets
                  .filter((set) => {
                    // Filter by completion status from backend
                    const isCompleted = set.is_completed === true;
                    return activeTab === "complete" ? isCompleted : !isCompleted;
                  })
                  .map((set) => (
                    <div
                      key={set.set_id}
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        background: "#f5f5f5",
                        borderRadius: "8px",
                        cursor: "pointer"
                      }}
                      onClick={() => navigate(`/flashcard/vocab-practice/${set.set_id}`)}
                    >
                      <div style={{ fontWeight: "600", marginBottom: "4px" }}>{set.set_name}</div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {set.card_count || 0} thẻ
                      </div>
                    </div>
                  ))}
                {flashcardSets.filter((set) => {
                  const isCompleted = set.is_completed === true;
                  return activeTab === "complete" ? isCompleted : !isCompleted;
                }).length === 0 && (
                  <p style={{ color: "#666", textAlign: "center", padding: "2rem" }}>
                    {activeTab === "incomplete" ? "Tất cả bộ thẻ đã hoàn thành" : "Chưa có bộ thẻ đã hoàn thành"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
