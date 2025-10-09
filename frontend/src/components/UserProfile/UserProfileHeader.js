// components/UserProfile/UserProfileHeader.js
import React, { useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "../../styles/UserProfile.css";

export default function UserProfileHeader({
  username,
  firstName,
  lastName,
  avatarUrl,
  onSave,            // (partial) => Promise<updatedUser>
}) {
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username || "");
  const [pic, setPic] = useState(avatarUrl || "");
  const [savingPhoto, setSavingPhoto] = useState(false);
  const fileRef = useRef(null);

  const displayAvatar = pic || avatarUrl || "/default_avatar.png";
  const displayUsername = username || "username";
  const displayFullName = `${firstName || "First"}, ${lastName || "Last"} Name`;

  const openEdit = () => {
    setNewUsername(username || "");
    setEditing(true);
  };

  // Upload to Firebase Storage and persist URL to Firestore
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant preview
    const preview = URL.createObjectURL(file);
    setPic(preview);

    try {
      setSavingPhoto(true);
      const uid = getAuth().currentUser?.uid;
      if (!uid) throw new Error("Not signed in");

      const storage = getStorage();
      const fileRef = ref(storage, `avatars/${uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);

      setPic(url);
      // Persist to Firestore
      await onSave?.({ profile_picture: url });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      // Revert to previous avatar if needed
      setPic(avatarUrl || "");
    } finally {
      setSavingPhoto(false);
    }
  };

  const pickFile = () => fileRef.current?.click();

  const handleSave = async () => {
    const payload = {};
    if (newUsername && newUsername !== username) payload.username = newUsername.trim();
    // profile picture is saved immediately after upload; no need to send again
    if (Object.keys(payload).length) await onSave?.(payload);
    setEditing(false);
  };

  return (
    <div className="profile-card no-utils">
      {/* LEFT: avatar + info */}
      <div className="profile-left">
        <div className="avatar-wrap ring">
          <img className="avatar" src={displayAvatar} alt="avatar" />
        </div>
        <div className="name-block">
          <div className="u-name">{displayUsername}</div>
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

      {/* RIGHT: edit pill OR inline panel */}
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
