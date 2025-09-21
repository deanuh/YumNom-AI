import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import { auth } from "../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');

  // Form submission handler for email/password login
  // Calls Firebase auth to sign the user in with auth, email, and password
  // On success, navigates to the dashboard
  // on failiure, sets an error message to be displayed to the user
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Firebase Auth performs email/password log in and returns a Promise<UserCredential>
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (firebaseError) {
      console.error("Firebase login error:", firebaseError.message);
      
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>YUMNOM AI:</h1>
        <p>AI-powered dish<br />recommendation<br />made just for you</p>
      </div>
      <div className="login-right">
        <div className="login-card">
          <h2>Sign In</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleLogin}>
            <input 
              type="email" 
              placeholder="Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <div className="forgot-password">
              <Link to="/forgot-password" style={{ color: "#190352" }}>Forgot Password?</Link>
            </div>
            <button type="submit" className="signin-button">Sign In</button>
          </form>
          <div className="divider"><p>Or sign in with</p></div>
          <div className="social-login">
            <button><img src="https://img.icons8.com/ios-filled/50/google-logo.png" alt="Google" /></button>
            <button><img src="https://img.icons8.com/ios-filled/50/facebook-new.png" alt="Facebook" /></button>
            <button><img src="https://img.icons8.com/ios-filled/50/mac-os.png" alt="Apple" /></button>
          </div>
          <p className="signup-prompt">Don’t have an account? <Link to="/signup">Create One</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;