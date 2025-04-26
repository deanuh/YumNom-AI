import React from 'react';
import '../../styles/UserProfile.css';


const friends = [
    { name: 'banana_gato', file: 'ban_gato.png' },
    { name: 'lebron', file: 'lebron.png' },
    { name: 'apple', file: 'apple.png' },
    { name: 'hastume_miku', file: 'miku.png' },
    { name: 'cattt', file: 'gato.png' },
  ];
  
  const addFriend = [
    { name: 'Add Friend', file: 'add_pref_icon.png' },
  ];
const GroupSettings = () => {
  return (
    <div className="inline-section">
        <h4>Group Settings</h4>
    <div className="white-box">
          <div className="dietary-pill-container">
            {friends.map((item) => (
              <div className="dietary-pill-icon" key={item.name}>
                <img src={`/${item.file}`} alt={item.name} />
                <span>{item.name}</span>
              </div>
            ))}
            {addFriend.map((item) => (
                <div className="dietary-pill-icon" key={item.name}>
                    <img src={`/${item.file}`} alt={item.name} />
                    <span>{item.name}</span>
                </div>
                ))}
          </div>
        </div>
    </div>

  );
};
export default GroupSettings;
