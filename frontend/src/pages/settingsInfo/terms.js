// what entails having an account with YumNom 
// such as having location on and personal data such as preferences made available to us
// Terms.js
// import "../../styles/settings.css";
// import { Link } from "react-router-dom";

// function Terms() {
//     return <div className="settings-button-wrapper">
//       <li><Link to="/settings">Back</Link></li>
//       <div className="settings-card">
//         <h3>Terms & Conditions</h3>
//       <p>All about terms...</p></div>
//       </div>;
//   }
// export default Terms;
  
// src/pages/terms.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/settings.css"; // keeps the back-button style you already added

export default function Terms() {
  const navigate = useNavigate();

  return (
    <main className="terms-container">
      {/* Top-left back button */}
      <button className="Set-back-button" onClick={() => navigate("/settings")}>
        ← Back to Settings
      </button>

      <h1>YumNom Terms of Service</h1>
      <p className="muted">
        Last updated: <strong>August 27, 2025</strong>
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using YumNom (“the Service”), you agree to these Terms of
        Service and our Privacy Notice. If you do not agree, do not use the Service.
      </p>

      <h2>2. Eligibility & Accounts</h2>
      <ul>
        <li>You must be at least <strong>18 years of age</strong> to use the Service.</li>
        <li>
          You are responsible for your account credentials and all activity conducted
          under your account.
        </li>
      </ul>

      <h2>3. Location Permissions & Use</h2>
      <p>
        YumNom provides nearby restaurant and dish recommendations. To enable these
        features, we request access to your device’s location.
      </p>
      <ul>
        <li>
          <strong>Collection.</strong> When permitted, we collect your approximate
          or precise location from the browser or device OS.
        </li>
        <li>
          <strong>Purpose.</strong> We use location to surface nearby restaurants,
          improve relevance, and enhance search results and maps.
        </li>
        <li>
          <strong>Control.</strong> You can enable/disable location in your device
          or browser settings at any time. Some features may not function without
          location.
        </li>
        <li>
          <strong>Frequency.</strong> Location may be requested on page load or on
          actions like “Use Current Location.”
        </li>
      </ul>

      <h2>4. Preferences & Personalization</h2>
      <p>
        You may provide dietary restrictions, cuisine likes/dislikes, price ranges,
        and other preferences. We use these inputs to tailor recommendations.
      </p>
      <p><strong>There may be some discrepancies when taking into account restrictions and any restaurant/dish search. Please ensure what you choose to eat is aligned with your dietary needs!</strong></p>

      <h2>5. Acceptable Use</h2>
      <ul>
        <li>No scraping, reverse engineering, or interfering with the Service.</li>
        <li>No unlawful, harassing, hateful, or infringing content or behavior.</li>
        <li>No attempts to access non-public features or data.</li>
        <li>
          Respect third-party restaurant content and intellectual property. Link
          sharing must follow applicable platform and copyright rules.
        </li>
      </ul>

      <h2>6. User Content</h2>
      <p>
        If the Service allows reviews, lists, or comments, you grant YumNom a
        non-exclusive, worldwide license to host and display that content for the
        Service’s operation. You are responsible for the content you submit.
      </p>
      <p><strong></strong></p>
      <h2>7. Third-Party Services & Restaurant Info</h2>
      <p>
        Restaurant data, menus, prices, and availability may come from third parties
        and can change without notice. We do not guarantee accuracy or availability.
      </p>

      <h2>8. Disclaimers</h2>
      <ul>
        <li>
          The Service is provided “as is” and “as available,” without warranties of
          any kind, express or implied.
        </li>
        <li>
          We do not guarantee uninterrupted operation or error-free results,
          including for location-based features.
        </li>
      </ul>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, YumNom and its affiliates will not
        be liable for indirect, incidental, special, consequential, or punitive
        damages, or any loss of data, revenue, or profits, arising from or related
        to your use of the Service.
      </p>

    
    </main>
  );
}

  