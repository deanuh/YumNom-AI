import React, { useEffect, useState, useRef } from "react";
import "../styles/GroupMealParty.css";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig"; 
import io from 'socket.io-client'; 

import HowItWorksInstructions from "../components/GroupMealParty/HowItWorksInstructions";
import InviteFriendList from "../components/GroupMealParty/InviteFriendList"; 
import { fetchMyFriends } from "../userapi/friendsApi"; 

// Helper for auth requests
async function fetchWithAuth(url, options = {}) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in.");
  
  const token = await user.getIdToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  };
  return fetch(url, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
}

function GroupMealParty() {
  const base_url = process.env.REACT_APP_BACKEND_URL;
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [inviteEmails, setInviteEmails] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [partyMembers, setPartyMembers] = useState({}); 
  
  // Friends List State
  const [friendsList, setFriendsList] = useState([]);
  const [selectedFriendNames, setSelectedFriendNames] = useState([]); 

  // 1. Authentication & Load Friends
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch friends list (now includes emails)
        fetchMyFriends()
            .then(data => {
                setFriendsList(Array.isArray(data) ? data : []);
            })
            .catch(err => console.error("Failed to load friends:", err));
      } else {
        setCurrentUser(null);
        setFriendsList([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Socket Connection Effect
  useEffect(() => {
    if (!currentUser) return;
    if (socketRef.current && socketRef.current.connected) return;

    const setupSocket = async () => {
        try {
            const token = await currentUser.getIdToken();
            console.log("Initializing socket for user:", currentUser.email);

            socketRef.current = io(process.env.REACT_APP_SOCKETIO_BACKEND_URL || "http://localhost:7001", {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnectionAttempts: 5,
            });

            socketRef.current.on("connect", () => {
                console.log("Socket Connected! ID:", socketRef.current.id);
                socketRef.current.emit("join_room");
            });

            socketRef.current.on("connect_error", (err) => {
                console.error("Socket Connection Error:", err.message);
                setError("Connection error. Retrying...");
            });

            socketRef.current.on("get_members", (members) => {
                console.log("Members:", members);
                setPartyMembers(members);
            });

            socketRef.current.on("joined_room", (newMember) => {
                console.log("Joined:", newMember);
                setPartyMembers(prev => ({
                    ...prev,
                    [newMember.userId]: {
                        username: newMember.username,
                        profile_picture: newMember.profile_picture
                    }
                }));
            });

            socketRef.current.on("navigate_to_voting", () => {
                console.log("Voting session started! Navigating...");
                navigate("/RealTimeVoting");
            });

        } catch (e) {
            console.error("Socket Init Failed:", e);
        }
    };

    setupSocket();

    return () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    };
  }, [currentUser, navigate]);


  // --- Actions ---

  const handleSendInvites = async () => {
    if (!currentUser) return setError("Please log in.");
    
    // 1. Get Manual Emails
    const manualEmails = inviteEmails.split(',').map(e => e.trim()).filter(e => e);

    // 2. Get Friend Emails
    // Find the friend object by username and extract their email
    const friendEmails = selectedFriendNames.map(name => {
        const friend = friendsList.find(f => f.username === name);
        if (friend && !friend.email) console.warn(`Friend ${name} has no email saved.`);
        return friend ? friend.email : null;
    }).filter(email => email); 

    // Combine lists
    const finalEmails = [...new Set([...manualEmails, ...friendEmails])];

    if (finalEmails.length === 0) return setError("Please select friends or enter emails.");
    
    setIsSubmitting(true);
    setError("");

    try {
      // Ensure Group Exists
      try {
          await fetchWithAuth(`${base_url}/groups`, { method: 'POST' });
      } catch (e) {
          console.log("Group likely already exists.");
      }

      const inviterName = currentUser.displayName || currentUser.email.split('@')[0];

      // Send Invites
      for (const email of finalEmails) {
        await fetchWithAuth(`${base_url}/api/invites/send`, {
          method: 'POST',
          body: {
            toEmail: email,
            inviterId: currentUser.uid,
            inviterName,
            inviterEmail: currentUser.email,
          }
        });
      }
      
      alert(`Invites sent to ${finalEmails.length} people! Wait for them to join.`);
      setInviteEmails(""); 
      setSelectedFriendNames([]); 
      setIsSubmitting(false);

    } catch (err) {
      console.error(err);
      setError("Failed to send invites.");
      setIsSubmitting(false);
    }
  };

  const handleStartVoting = () => {
    if (socketRef.current) {
        socketRef.current.emit("host_start_voting");
    }
  };

  return (
    <div className="group-meal-wrapper">
      <h2 className="title">!GROUP MEAL PARTY!</h2>

      <div className="party-grid">
        {/* LEFT SIDE: Invites & Lobby */}
        <div className="left-side">
          
          <div className="invite-emails-container">
            <h3>Invite Friends</h3>
            
            {/* Friends Dropdown */}
            <div style={{ marginBottom: '15px' }}>
                <InviteFriendList 
                    friendsList={friendsList}
                    selectedFriends={selectedFriendNames}
                    setSelectedFriends={setSelectedFriendNames}
                />
            </div>

            <p style={{fontSize: '0.9rem', color: '#666'}}>Or enter email addresses manually:</p>
            <textarea
              className="email-textarea"
              value={inviteEmails}
              onChange={(e) => setInviteEmails(e.target.value)}
              placeholder="friend1@example.com, friend2@example.com"
            />
            <button 
                className="invite-btn" 
                onClick={handleSendInvites} 
                disabled={isSubmitting}
                style={{marginTop: '10px', width: '100%'}}
            >
                {isSubmitting ? "Sending..." : "Send Invites"}
            </button>
          </div>

          {/* Lobby Section */}
          <div className="lobby-members" style={{marginTop: '2rem'}}>
            <h3>Lobby Members</h3>
            {Object.keys(partyMembers).length === 0 ? (
                <p>Waiting for connections...</p>
            ) : (
                <div className="members-grid">
                    {Object.values(partyMembers).map((m, i) => (
                        <div key={i} className="member-card">
                            <span>{m.username || "Guest"}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Instructions */}
        <div className="right-side">
          <HowItWorksInstructions />
        </div>
      </div>

      {error && <div className="group-meal-error">{error}</div>}

      {/* START BUTTON */}
      <div className="selected-restaurant-container" style={{textAlign:'center', marginTop:'3rem'}}>
          <p style={{marginBottom: '1rem', color: '#666'}}>
            Once everyone is in the lobby, press start to begin the nomination phase!
          </p>
          <button 
              className="start-voting-btn"
              onClick={handleStartVoting}
              style={{
                  padding: '15px 40px', 
                  fontSize: '1.2rem', 
                  backgroundColor: '#3a2b6a', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '30px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 15px rgba(58, 43, 106, 0.4)' 
              }}
          >
              Start Voting Session
          </button>
      </div>

    </div>
  );
}

export default GroupMealParty;