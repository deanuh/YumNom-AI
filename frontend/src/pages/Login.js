import React from "react";
import { useNavigate, Link } from "react-router-dom"; 
import "../styles/Login.css";

function Login() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>YUMNOM AI:</h1>
        <p>
          AI-powered dish
          <br />
          recommendation
          <br />
          made just for you
        </p>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Sign In</h2>

          <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />

            <div className="forgot-password">
              <p style={{ color: "#190352" }}>Forgot Password?</p>
            </div>

            <button type="submit" className="signin-button">
              Sign In
            </button>
          </form>

          <div className="divider">
            <p>Or sign in with</p>
          </div>

          <div className="social-login">
            <button>
              <img
                src="https://img.icons8.com/ios-filled/50/google-logo.png"
                alt="Google"
              />
            </button>
            <button>
              <img
                src="https://img.icons8.com/ios-filled/50/facebook-new.png"
                alt="Facebook"
              />
            </button>
            <button>
              <img
                src="https://img.icons8.com/ios-filled/50/mac-os.png"
                alt="Apple"
              />
            </button>
          </div>

          <p className="signup-prompt">
            Don’t have an account? <Link to="/signup">Create One</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
