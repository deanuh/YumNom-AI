import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import "../styles/GroupMealParty.css";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig"; 
import io from 'socket.io-client'; 

import HowItWorksInstructions from "../components/GroupMealParty/HowItWorksInstructions";
import SearchRestaurant from "../components/GroupMealParty/SearchRestaurant";

// Helper function to make authenticated requests
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
  const location = useLocation(); // Hook to get current state
  const socketRef = useRef(null);

  const [inviteEmails, setInviteEmails] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [partyMembers, setPartyMembers] = useState({}); 
  const [isHost, setIsHost] = useState(false); 

  // Restaurant Search State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedRestaurant, setSelectedRestaurant] = useState(location.state?.selectedRestaurant || ""); // Init from nav state if exists
  const [restaurantObject, setRestaurantObject] = useState(null);
  const [restaurantOptions, setRestaurantOptions] = useState([]);

  // 1. Authentication Effect (Runs once)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Socket Connection Effect (Runs only when currentUser is set)
  useEffect(() => {
    if (!currentUser) return;

    // Prevent double connections
    if (socketRef.current && socketRef.current.connected) return;

    const setupSocket = async () => {
        try {
            const token = await currentUser.getIdToken();
            console.log("Initializing socket for user:", currentUser.email);

            socketRef.current = io(process.env.REACT_APP_SOCKETIO_BACKEND_URL || "http://localhost:7001", {
                auth: { token },
                transports: ['websocket', 'polling'], // Try both methods
                reconnectionAttempts: 5,
            });

            // --- Listeners ---
            socketRef.current.on("connect", () => {
                console.log("Socket Connected! ID:", socketRef.current.id);
                socketRef.current.emit("join_room");
            });

            socketRef.current.on("connect_error", (err) => {
                console.error("Socket Connection Error:", err.message);
            });

            socketRef.current.on("get_members", (members) => {
                console.log("Received Members List:", members);
                setPartyMembers(members);
            });

            socketRef.current.on("joined_room", (newMember) => {
                console.log("New Member Joined:", newMember);
                setPartyMembers(prev => ({
                    ...prev,
                    [newMember.userId]: {
                        username: newMember.username,
                        profile_picture: newMember.profile_picture
                    }
                }));
            });

            socketRef.current.on("navigate_to_voting", () => {
                console.log("🚀 Host started game! Navigating...");
                // Pass the restaurant choice if we have one
                navigate("/RealTimeVoting", { state: { selectedRestaurant } });
            });

        } catch (e) {
            console.error("Socket Init Failed:", e);
        }
    };

    setupSocket();

    // Cleanup on unmount
    return () => {
        if (socketRef.current) {
            console.log("Cleaning up socket...");
            socketRef.current.disconnect();
            socketRef.current = null;
        }
    };
  }, [currentUser, navigate]); // Removing selectedRestaurant dependency to prevent reconnects

  // --- Restaurant Search Logic ---
  const searchRestaurant = useCallback(async () => {
    const response = await axios.get(`${base_url}/restaurantFatSecret`, { params: { q: debouncedSearch } });
    return Array.isArray(response.data?.food_brands?.food_brand) ? response.data.food_brands.food_brand : [];
  }, [base_url, debouncedSearch]);

  const searchLogo = useCallback(async () => {
    const response = await axios.get(`${base_url}/logo`, { params: { q: selectedRestaurant } });
    return response.data;
  }, [base_url, selectedRestaurant]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 2000);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      if (debouncedSearch === "") setRestaurantOptions([]);
      else setRestaurantOptions(await searchRestaurant());
    })();
  }, [debouncedSearch, searchRestaurant]);

  useEffect(() => {
    if (selectedRestaurant) searchLogo().then(setRestaurantObject);
  }, [selectedRestaurant, searchLogo]);


  // --- Actions ---

  const handleSendInvites = async () => {
    if (!currentUser) return setError("Please log in.");
    if (!inviteEmails) return setError("Please enter emails.");
    
    setIsSubmitting(true);
    setError("");

    try {
      try {
          await fetchWithAuth(`${base_url}/groups`, { method: 'POST' });
          setIsHost(true); 
      } catch (e) {
          console.log("Group likely already exists or user is in one.");
          setIsHost(true); 
      }

      const emails = inviteEmails.split(',').map(e => e.trim()).filter(e => e);
      const inviterName = currentUser.displayName || currentUser.email.split('@')[0];

      for (const email of emails) {
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
      
      alert("Invites sent! Wait for your friends to appear in the lobby below.");
      setInviteEmails(""); 
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
        <div className="left-side">
          <div className="invite-emails-container">
            <h3>Invite Friends</h3>
            <p>Enter email addresses separated by commas.</p>
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

          <div className="lobby-members" style={{marginTop: '2rem'}}>
            <h3>Lobby Members</h3>
            {Object.keys(partyMembers).length === 0 ? (
                <p>Waiting for friends to join...</p>
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

        <div className="right-side">
          <HowItWorksInstructions />
        </div>
      </div>

      <SearchRestaurant
        restaurantOptions={restaurantOptions}
        search={search}
        setSearch={setSearch}
        setSelectedRestaurant={setSelectedRestaurant}
      />
      
      {error && <div className="group-meal-error">{error}</div>}

      {selectedRestaurant && (
          <div className="selected-restaurant-container" style={{textAlign:'center', marginTop:'2rem'}}>
              <h3>Selected: {selectedRestaurant}</h3>
              {restaurantObject && <img src={restaurantObject.logo_url} alt="Logo" style={{height: 100}}/>}
              
              <div style={{marginTop: '20px'}}>
                <button 
                    className="start-voting-btn"
                    onClick={handleStartVoting}
                    style={{
                        padding: '15px 30px', 
                        fontSize: '1.2rem', 
                        backgroundColor: '#6d4dc3', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '30px', 
                        cursor: 'pointer'
                    }}
                >
                    Start Voting Session
                </button>
              </div>
          </div>
      )}
    </div>
  );
}

export default GroupMealParty;