import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/SignUp.css";
import { auth } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";

function SignUp() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Sign up successful:", userCredential.user);
      navigate("/login");

    } catch (firebaseError) {
      console.error("Firebase sign-up error:", firebaseError.message);

      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters long.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('Failed to create an account. Please try again.');
          break;
      }
    }
  };

  return (
    <div className="signupPage-container">
      <div className="signup-logo">YUMNOM&nbsp;AI</div>
      <form onSubmit={handleSubmit} className="signup-card">
        <h2>Sign Up</h2>
        {error && <p style={{color: 'red'}}>{error}</p>}
        <div className="info-rows">
          <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
        <button type="submit">Sign Up</button>
        <p className="returnToLogin-prompt">
          Have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default SignUp;