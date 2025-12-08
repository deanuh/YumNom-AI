import React, { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { ThemeContext } from "../ThemeProvider";

function Login() {
  const navigate = useNavigate();
	const { theme } = useContext(ThemeContext)

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState('');

  // Handles the entire Google Sign-In flow
  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSocialSignIn(result.user);
    } catch (error) {
      console.error("Google Sign-In error:", error);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  // Handles the entire Facebook Sign-In flow
  const handleFacebookSignIn = async () => {
    const auth = getAuth();
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSocialSignIn(result.user);
    } catch (error) {
      console.error("Facebook Sign-In error:", error);
      setError("Failed to sign in with Facebook. Please try again.");
    }
  };

  // Handles the entire Apple Sign-In flow
  const handleAppleSignIn = async () => {
    const auth = getAuth();
    const provider = new OAuthProvider('apple.com');
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSocialSignIn(result.user);
    } catch (error) {
      console.error("Apple Sign-In error:", error);
      setError("Failed to sign in with Apple. Please try again.");
    }
  };

  // A shared function to handle user creation for all social logins
  const handleSocialSignIn = async (user) => {
    const token = await user.getIdToken();
    const response = await fetch(`http://localhost:5001/users/${user.uid}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 404) {
      console.log("User does not exist, creating new user...");
      const nameParts = user.displayName ? user.displayName.split(' ') : ['New', 'User'];
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      await fetch('http://localhost:5001/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          username: user.email,
          email: user.email
        })
      });
    }
    navigate('/dashboard');
  };

  // Handles traditional email and password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const auth = getAuth(); 
    try {
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
              <Link to="/forgot-password" style={theme === 'light' ? { color: "#190352" } : { color: "#A58EFF" } }>Forgot Password?</Link>
            </div>
            <button type="submit" className="signin-button">Sign In</button>
          </form>
          <div className="divider"><p>Or sign in with</p></div>
          <div className="social-login">
            <button onClick={handleGoogleSignIn}>
              <img src="https://img.icons8.com/ios-filled/50/google-logo.png" alt="Google" />
            </button>
            <button onClick={handleFacebookSignIn}>
              <img src="https://img.icons8.com/ios-filled/50/facebook-new.png" alt="Facebook" />
            </button>
            <button onClick={handleAppleSignIn}>
              <img src="https://img.icons8.com/ios-filled/50/mac-os.png" alt="Apple" />
            </button>
          </div>
          <p className="signup-prompt">Don’t have an account? <Link to="/signup">Create One</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
