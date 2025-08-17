// // this will be the display for the settings page
import React from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from  "../firebase/firebaseConfig";
import "../styles/settings.css";


function Settings() {
	const handleLogOut = () => {
		signOut(auth).then(() => {
		  // Sign-out successful.

		}).catch((error) => {
		  // An error happened.
			console.log(error);
		});
	}
  return (
    <div className="Set-settings-body">
      <div className="Set-settings-card">
        <h2 className="Set-settings-title">Settings & Activity</h2>

        <div className="Set-settings-section">
          <h3 className="Set-section-heading">General Settings</h3>
          <ul className="Set-settings-list">
            <li><Link to="/changePass">Change Password</Link></li>
            <li><Link to="/emailSettings">Email</Link></li>
            <li><Link to="/locationPref">Location Preferences</Link></li>
            <li><Link to="/notifications">Notifications</Link></li>
            <li><Link to="#">Display</Link></li>
          </ul>
        </div>

        <div className="Set-settings-section">
          <h3 className="Set-section-heading">Legal</h3>
          <ul className="Set-settings-list">
            <li><Link to="/terms">Terms</Link></li>
            <li><Link to="/privacyPolicy">Privacy Policy</Link></li>
          </ul>
        </div>

        <div className="Set-settings-section">
          <h3 className="Set-section-heading">Account</h3>
          <ul className="Set-settings-list">
            <li><Link to="/help">Help</Link></li>
            <li><Link to="#">Report Abuse</Link></li>
            <li><Link to="/deleteAccount">Delete Account</Link></li>
            <li><Link to="/login" onClick={handleLogOut}>Log out</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;



// function AIRec() {
//   const [showChat, setShowChat] = useState(false);

//   const toggleChat = () => {
//     setShowChat(prev => !prev);
//   };

//   return (
//     <div>
//       <button onClick={toggleChat} className="chat-toggle-button">
//         {showChat ? "Close Chat" : "Chat with NomBot"}
//       </button>

//       {showChat && (
//         <div className="chat-popup-container">
//           <ChatBot />
//         </div>
//       )}
//     </div>
//   );
// }

// export default AIRec;
