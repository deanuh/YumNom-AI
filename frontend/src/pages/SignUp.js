import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/SignUp.css";
import { auth } from "../firebase/firebaseConfig"
import { connectAuthEmulator, createUserWithEmailAndPassword } from "firebase/auth";
function SignUp() {
  const navigate = useNavigate();
	const [email, setEmail] = useState(null);
	const [password, setPassword] = useState(null);
  const handleSubmit = (e) => {
    e.preventDefault();

  //must run in terminal: firebase emulators:start --only auth --project (project id)
	connectAuthEmulator(auth, 'http://127.0.0.1:9099');
	createUserWithEmailAndPassword(auth, email, password)
	  .then((userCredential) => {
	    // Signed up 
	    const user = userCredential.user;
	    // ...
	  })
	  .catch((error) => {
	    const errorCode = error.code;
	    const errorMessage = error.message;
			console.log(errorCode + ": " + errorMessage);
	    // ..
	  });   // add registration logic here
    navigate("/login");
  };

  return (
    <div className="signupPage-container">
      <div className="signup-logo">YUMNOM&nbsp;AI</div>

      <form onSubmit={handleSubmit} className="signup-card">
        <h2>Sign Up</h2>

        <div className="info-rows">
          <input type="text" placeholder="Last Name" required />
          <input type="text" placeholder="First Name" required />
        </div>

        <input type="text"     placeholder="Username" required />
        <input type="email"    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"    required />
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
