import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig"; 

function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying your invitation...');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (!token) {
          setStatus('Invalid invite link.');
          return;
        }
        if (!user) {
          // If not logged in, send to login and remember to return
          sessionStorage.setItem('postLoginRedirect', `/party/invite?token=${token}`);
          navigate('/login');
          return;
        }

        try {
          const idToken = await user.getIdToken();
          const base_url = process.env.REACT_APP_BACKEND_URL;
          
          const response = await fetch(`${base_url}/api/invites/verify`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ token })
          });

          const data = await response.json();
          if (!response.ok || !data.ok) {
            throw new Error(data.error || 'Failed to verify token.');
          }
          
          // SUCCESS: Redirect to the Lobby (GroupMealParty)
          navigate('/group-meal'); 
        } catch (err) {
          setStatus(`Error: ${err.message}`);
        }
      });
    };
    verifyToken();
  }, [token, navigate]);

  return (
    <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>Joining Party...</h2>
      <p>{status}</p>
    </div>
  );
}

export default AcceptInvite;