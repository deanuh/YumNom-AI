import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/SignUp.css";
import { auth } from "../firebase/firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createUser } from "../components/CreateUser.js";
import { ensureMe } from "../userapi/meApi";

function SignUp() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handles form submission for signing up a new user
  // Creates a new Firebase auth user with email/password credentials
  // Retrieves a Json web token (JWT) from the signed up user
  // Calls createUser to store additional user info in Firestore
  // On success, navigate to the login screen
  // On failure, sets an error message to be displayed to the user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Firebase Auth creates a new user with email & password, returns Promise<UserCredential>
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Sign up successful:", userCredential.user);
      // Get JWT from the newly created user
			const JWT = await userCredential.user.getIdToken();
      // Create user in Firestore with additional info
			await createUser(firstName, lastName, username, email, JWT);

      // Ensure /api/me/ensure exists and has full info
      await ensureMe({
        username: username,
        first_name: firstName,
        last_name: lastName,
        profile_picture: ""
      });
      navigate("/login");

    } catch (firebaseError) {
      console.error("Firebase sign-up error:", firebaseError.message);

      // Set user-friendly error messages based on Firebase error codes
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
