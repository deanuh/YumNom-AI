import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import '../styles/SignUp.css'; 

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const auth = getAuth();
    try {
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