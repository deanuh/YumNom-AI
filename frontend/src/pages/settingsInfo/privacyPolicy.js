// privacy policy - simple page of info
// function PrivacyPolicy() {
//     return <div><h3>Privacy Policy page</h3>
//     <p>All about privacy and how YumNom keeps ur data private</p></div>;
//   }
// export default PrivacyPolicy;
// src/pages/privacyPolicy.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/settings.css"; // keep the back-button style consistent

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <main className="privacy-container">
      {/* Back button */}
      <button className="Set-back-button" onClick={() => navigate("/settings")}>
        ← Back to Settings
      </button>

      <h1>YumNom Privacy Policy</h1>
      <p className="muted">
        Last updated: <strong>August 27, 2025</strong>
      </p>

      <h2>1. Overview</h2>
      <p>
        YumNom (“we,” “our,” or “us”) values your privacy. This Privacy Policy
        explains how we collect, use, and safeguard your information when you
        use our web application. By accessing or using YumNom, you agree to this
        policy.
      </p>

      <h2>2. Information We Collect</h2>
      <ul>
        <li>
          <strong>Location Data:</strong> Collected with your permission to
          provide nearby restaurant and dish recommendations.
        </li>
        <li>
          <strong>Preferences:</strong> Dietary restrictions, cuisine likes and
          dislikes, price ranges, and other personalization choices you provide.
        </li>
        <li>
          <strong>Usage Data:</strong> Information about how you interact with
          the Service (pages visited, searches made).
        </li>
        <li>
          <strong>Account Data:</strong> If you create an account, we collect
          your email, name, and password.
        </li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To deliver restaurant and meal recommendations tailored to you.</li>
        <li>To improve app functionality and user experience.</li>
        <li>To maintain account security and authentication.</li>
        <li>
          To comply with legal obligations or enforce our Terms of Service.
        </li>
      </ul>

      <h2>4. Sharing of Information</h2>
      <p>
        We do not sell your personal information. We may share limited data
        with:
      </p>
      <ul>
        <li>
          <strong>Service providers</strong> that support app functionality
          (e.g., hosting, analytics).
        </li>
        <li>
          <strong>Legal authorities</strong> if required by law or to protect
          rights and safety.
        </li>
      </ul>

      <h2>5. Your Choices</h2>
      <ul>
        <li>
          You can enable or disable location sharing at any time through your
          device or browser settings.
        </li>
        <li>
          You may update or delete your preferences and account information from
          the app settings.
        </li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>
        We retain your information only as long as necessary to provide the
        Service or as required by law. You can request deletion of your account
        data at any time.
      </p>

      <h2>7. Security</h2>
      <p>
        We implement reasonable technical and organizational safeguards to
        protect your information. However, no system is completely secure.
      </p>

      <h2>8. Children’s Privacy</h2>
      <p>
        YumNom is not intended for children under <strong> 18 years of age </strong>. We
        do not knowingly collect information from children.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Changes will be
        posted in the app, with the “Last updated” date adjusted. Continued use
        after changes means you accept the updated policy.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, contact us at:{" "}
        <strong>YumNom.AI@company.com</strong>
      </p>
    </main>
  );
}
