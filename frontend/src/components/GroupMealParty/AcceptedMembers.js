import React from "react";

function AcceptedMembers({ selectedFriends, friendsList }) {
  return (
  <div className="accepted-header">
    <h2>Accepted Party Members</h2>
    <div className="accepted-members-box">
      <div className="accepted-members">
        {selectedFriends.map((username) => {
          const friend = friendsList.find(f => f.username === username);
          return (
            <div className="avatar" key={username}>
              <img src={`/${friend?.image}`} alt={username} />
            </div>
          );
        })}
      </div>
    </div>
  </div> 
  );
}


export default AcceptedMembers;
