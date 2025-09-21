// Allow User to request a password reset email
// Collects the user's email and sends a reset link using Firebase Auth
// On success, informs the user to check their inbox

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import '../styles/SignUp.css'; 

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form submission handler for sending a password reset email
  // Uses Firebase Auth to send the reset email to the provided address
  // On success, sets a success message
  // On failure, sets an error message to be displayed to the user
  // Updates UI with success or error feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    // Grabs the auth instance tied to our initialized Firebase app
    const auth = getAuth();
    try {
      // Sends a reset link to the User's email address
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Please check your inbox.');
    } catch (firebaseError) {
      console.error("Firebase password reset error:", firebaseError);
      setError('Failed to send password reset email. Please try again.');
    }
  };

  return (
    <div className="signupPage-container">
      <div className="signup-logo">YUMNOM&nbsp;AI</div>
      <form onSubmit={handleSubmit} className="signup-card">
        <h2>Forgot Password</h2>
        <p style={{marginBottom: '1.5rem'}}>Enter your email to receive a reset link.</p>
        
        {message && <p style={{color: 'green', fontWeight: 'bold'}}>{message}</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.value)}
          required
        />
        
        <button type="submit" style={{marginTop: '1rem'}}>Send Reset Link</button>

        <p className="returnToLogin-prompt">
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;