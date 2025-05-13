import React from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/SignUp.css";

function SignUp() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // add registration logic here
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
        <input type="email"    placeholder="Email"    required />
        <input type="password" placeholder="Password" required />

        <button type="submit">Sign Up</button>

        <p className="returnToLogin-prompt">
          Have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default SignUp;
