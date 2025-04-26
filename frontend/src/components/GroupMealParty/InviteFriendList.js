import React, { useState } from "react";

function InviteFriendList({ friendsList, selectedFriends, setSelectedFriends }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleCheckboxChange = (username) => {
        setSelectedFriends((prev) =>
        prev.includes(username)
            ? prev.filter((f) => f !== username)
            : [...prev, username]
        );
  };

    return (
        <div className="invite-section">
        <label className="invite-label"><strong>Send Invite to...</strong></label>
        <div className="custom-dropdown">
            <div className="dropdown-header" onClick={handleToggle}>
            Friends
            <span className="arrow">{isOpen ? "▲" : "▼"}</span>
            </div>
            {isOpen && (
            <div className="dropdown-list">
                {friendsList.map(({ username }) => (
                <label key={username} className="dropdown-item">
                    <input
                    type="checkbox"
                    checked={selectedFriends.includes(username)}
                    onChange={() => handleCheckboxChange(username)}
                    />
                    {username}
                </label>
                ))}
            </div>
            )}
        </div>
        </div>
    );
}

export default InviteFriendList;
