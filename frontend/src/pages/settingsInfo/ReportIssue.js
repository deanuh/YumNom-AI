// frontend/src/pages/ReportIssue.js
// Uses its own CSS class names (report-issue-*) so styles are isolated

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/settings.css"; // new dedicated CSS file


export default function ReportIssue() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ state: "idle", message: "" });

  async function handleSubmit(e) {  // changed to just send out json file to backend
    e.preventDefault();
    setStatus({ state: "submitting", message: "Submitting…" });
  
    const form = e.currentTarget;
    const fd = new FormData(form);
    const API_BASE = process.env.REACT_APP_BACKEND_URL;
  
    // simple honeypot
    if (fd.get("_hp")) {
      setStatus({ state: "error", message: "Submission blocked." });
      return;
    }
  
    // Convert to plain JSON
    const payload = Object.fromEntries(fd.entries());
    // Normalize numeric radios if present
    if (payload.frequency) payload.frequency = Number(payload.frequency);
    if (payload.rating) payload.rating = Number(payload.rating);
    payload.consent = payload.consent === "on";
  
    try {
      const res = await fetch(`${API_BASE}/api/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      setStatus({ state: "success", message: "Thanks — your report was sent." });
      form.reset();
    } catch (err) {
      setStatus({ state: "error", message: err.message || "Something went wrong." });
    }
  }
  

  return (
    <div className="report-issue-page">
      <div className="report-issue-header">
        <button className="report-issue-back" onClick={() => navigate(-1)}> ← Back to Settings </button>
        <h1 className="report-issue-title">Report an Issue</h1>
      </div>

      <div className="report-issue-body">
        <p className="report-issue-intro">
          Fill out this form to report any issues or concerns you run into while using YumNom.
        </p>

        <form className="report-issue-form" onSubmit={handleSubmit}>
          <section className="report-issue-section">
            <h2 className="report-issue-section-title">Contact</h2>

            <div className="report-issue-field">
              <label htmlFor="email" className="report-issue-label">Email *</label>
              <input id="email" name="email" type="email" required className="report-issue-input" placeholder="you@example.com" />
            </div>

            <div className="report-issue-field">
              <label htmlFor="name" className="report-issue-label">Last Name, First Name *</label>
              <input id="name" name="name" required className="report-issue-input" placeholder="Doe, Jane" />
            </div>
          </section>

          <section className="report-issue-section">
            <h2 className="report-issue-section-title">Issue</h2>

            <div className="report-issue-field">
              <label htmlFor="issue" className="report-issue-label">Issue Being Reported *</label>
              <textarea id="issue" name="issue" required rows={4} className="report-issue-textarea" placeholder="Describe the issue" />
            </div>

            <div className="report-issue-field">
              <label htmlFor="expected" className="report-issue-label">What did you expect to happen?</label>
              <textarea id="expected" name="expected" rows={3} className="report-issue-textarea" placeholder="Expected behavior" />
            </div>

            <div className="report-issue-field">
              <label htmlFor="actual" className="report-issue-label">What actually happened?</label>
              <textarea id="actual" name="actual" rows={3} className="report-issue-textarea" placeholder="Actual behavior" />
            </div>

            <div className="report-issue-field">
              <label className="report-issue-label">How often does this happen?</label>
              <div className="report-issue-scale">
                {["Never", "Sometimes", "Often", "Always"].map((option, index) => (
                  <label key={index} className="report-issue-radio">
                    <input type="radio" name="frequency" value={option} /> {option}
                  </label>
                ))}
              </div>
            </div>


            <div className="report-issue-field">
              <label className="report-issue-label">How would you rate your experience with YumNom so far?</label>
              <div className="report-issue-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <label key={star} className="report-issue-radio">
                    <input type="radio" name="rating" value={star} /> {"★".repeat(star)}
                  </label>
                ))}
              </div>
            </div>
          </section>


          <div className="report-issue-actions">
            <button type="button" className="report-issue-btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="report-issue-btn-primary" disabled={status.state === "submitting"}>
              {status.state === "submitting" ? "Sending…" : "Submit Report"}
            </button>
            <span className={`report-issue-status ${status.state}`} aria-live="polite">{status.message}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
