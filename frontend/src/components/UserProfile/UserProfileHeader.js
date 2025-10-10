// components/UserProfile/UserProfileHeader.js
import React, { useRef, useState } from "react";
import "../../styles/UserProfile.css";
import { uploadToCloudinary } from "../../lib/uploadCloudinary";

export default function UserProfileHeader({
  username,
  firstName,
  lastName,
  avatarUrl,
  onSave, // (partial) => Promise<void>
}) {
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username || "");
  const [pic, setPic] = useState(avatarUrl || "");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileRef = useRef(null);

  const displayFullName = `${firstName || "First"}, ${lastName || "Last"}`;
  const baseAvatar = pic || avatarUrl || "/default_avatar.png";
  // Optional: serve a nice square/round thumbnail from Cloudinary
  const displayAvatar = baseAvatar.includes("res.cloudinary.com")
    ? baseAvatar.replace("/upload/", "/upload/c_fill,w_160,h_160,g_face,r_max/")
    : baseAvatar;

  const openEdit = () => { setNewUsername(username || ""); setEditing(true); };
  const pickFile = () => fileRef.current?.click();

  // ---- Cloudinary upload ----
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // instant local preview
    const preview = URL.createObjectURL(file);
    setPic(preview);

    try {
      setSavingPhoto(true);

      // 1) upload to Cloudinary (goes to /avatars via your preset)
      const data = await uploadToCloudinary(file);
      const url = data.secure_url;

      // 2) save URL into Firestore via your existing API
      await onSave?.({ profile_picture: url });

      // 3) show the final URL
      setPic(url);
      console.log("Avatar uploaded:", data.public_id);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setPic(avatarUrl || "");
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleSave = async () => {
    const payload = {};
    if (newUsername && newUsername !== username) payload.username = newUsername.trim();
    if (Object.keys(payload).length) await onSave?.(payload);
    setEditing(false);
  };

  return (
    <div className="profile-card no-utils">
      <div className="profile-left">
        <div className="avatar-wrap ring">
          <img className="avatar" src={displayAvatar} alt="avatar" />
        </div>
        <div className="name-block">
          <div className="u-name">{username || "username"}</div>
          <div className="u-full">{displayFullName}</div>

          <button className="btn-secondary sm" onClick={pickFile} disabled={savingPhoto}>
            {savingPhoto ? "Uploading…" : "Change Photo"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onFileChange}
          />
        </div>
      </div>

      <div className="profile-right">
        {!editing ? (
          <button className="btn-primary pill" onClick={openEdit}>
            Edit Profile <img className="edit-ic" src="/edit_icon.png" alt="" />
          </button>
        ) : (
          <div className="edit-panel tight">
            <div className="panel-title">Edit Profile</div>
            <label className="row">
              <span>Current Username:</span>
              <input value={username || ""} disabled />
            </label>
            <label className="row">
              <span>Changed Username:</span>
              <input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="changed_user"
              />
            </label>
            <div className="actions">
              <button className="btn-secondary hollow" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
