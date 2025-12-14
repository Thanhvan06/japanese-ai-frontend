import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import styles from "../styles/EditProfile.module.css";
import { api } from "../lib/api";

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
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
