import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import styles from "../styles/EditProfile.module.css";

const EditProfile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [avatar, setAvatar] = useState(null);
  const [profile, setProfile] = useState({
    username: "seiun03",
    email: "vanntt.21it@vku.udn.vn",
    password: "************",
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    alert("Profile saved successfully!");
    console.log("Saved data:", profile);
  };

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
                {avatar ? (
                  <img src={avatar} alt="Avatar" className={styles.avatarImg} />
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

          <div className={styles.formGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={profile.username}
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
            />
            <hr />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={profile.password}
              onChange={handleChange}
              className={styles.input}
            />
            <hr />
          </div>

          <button className={styles.saveButton} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
