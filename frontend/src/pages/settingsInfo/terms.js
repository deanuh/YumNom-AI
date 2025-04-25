// what entails having an account with YumNom 
// such as having location on and personal data such as preferences made available to us
// Terms.js
import "../../styles/settings.css";
import { Link } from "react-router-dom";

function Terms() {
    return <div className="settings-button-wrapper">
      <li><Link to="/settings">Back</Link></li>
      <div className="settings-card">
        <h3>Terms & Conditions</h3>
      <p>All about terms...</p></div>
      </div>;
  }
export default Terms;
  

  