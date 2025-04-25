import React from 'react';
import '../../styles/UserProfile.css';

const UserProfileHeader = () => {
  return (
    <div className="profile-header">
      <div className="user-info">
      <img src="/ban_gato.png" alt="User Avatar" className="userpro-avatar" />
        <div>
          <h3 className="username">username</h3>
          <p className="user-fullname">First, Last Name</p>
        </div>
      </div>
      <button className="edit-button">
        Edit Profile <span role="img" aria-label="edit"></span>
        <img src="/edit_icon.png" alt="Edit" className="edit-img"/>
      </button>
    </div>
  );
};

export default UserProfileHeader;
