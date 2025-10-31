// frontend/src/pages/ReportIssue.js
// Uses its own CSS class names (report-issue-*) so styles are isolated

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/settings.css"; // new dedicated CSS file



export default function ReportIssue() {
  const navigate = useNavigate();
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  // this is for the stars (make it like the dish rating system on AI rec)
  const [rating, setRating] = useState(0);   // 0–5
  const [hover, setHover] = useState(0); 
  

  function handleFileChange(e) {
    const files = e?.target?.files;
    if (!files || files.length === 0) {
      setFile(null);
      setPreview(null);
      return;
    }
    const selected = files[0];
    setFile(selected);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(selected);
    });
  }
  function handleDrop(e) {
    e.preventDefault();
    const dtFiles = e?.dataTransfer?.files;
    if (!dtFiles || dtFiles.length === 0) return;
    const selected = dtFiles[0];
    setFile(selected);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(selected);
    });
  }
  

  async function handleSubmit(e) {  // changed to just send out json file to backend
    e.preventDefault();
    setStatus({ state: "submitting", message: "Submitting…" });
  
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!fd.get("image") && file) {
      fd.append("image", file);}

      // ensure rating is included even though it's rendered as buttons
    if (!fd.get("rating")) {
      fd.append("rating", String(rating || ""));
    }
    const API_BASE = process.env.REACT_APP_BACKEND_URL;
  
    // simple honeypot
    if (fd.get("_hp")) {
      setStatus({ state: "error", message: "Submission blocked." });
      return;
    }
  
    // Convert to plain JSON
    const payload = Object.fromEntries(fd.entries());
    // Normalize numeric radios if present
    // if (payload.frequency) payload.frequency = Number(payload.frequency);
    // commented this out because it was not letting the frequency actually show on the email -- it was checking 
    // if it was a number first and returning the number value instead of the actual value  SLAY
    if (payload.rating) payload.rating = Number(payload.rating);
    payload.consent = payload.consent === "on";
  
    try {
      const res = await fetch(`${API_BASE}/api/report-issue`, {
        method: "POST",
        // headers: { "Content-Type": "application/json" },
        // body: JSON.stringify(payload),
        body: fd,
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      setStatus({ state: "success", message: "Thanks — your report was sent." });
      form.reset();
      setFile(null);
      setPreview(null);
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
                {["Never", "Sometimes", "Often", "Always"].map((index) => (
                  <label key={index} className="report-issue-radio">
                    <input type="radio" name="frequency" value={index} /> {index}
                  </label>
                ))}
              </div>
            </div>


            <div className="report-issue-field">
              <label className="report-issue-label">How would you rate your experience with YumNom so far?</label>

              {/* hidden input so FormData includes rating */}
              <input type="hidden" name="rating" value={rating || ""} />

              <div className="report-issue-stars" role="radiogroup" aria-label="Experience rating from 1 to 5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = (hover || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`report-issue-star ${filled ? "filled" : ""}`}
                      aria-checked={rating === star}
                      role="radio"
                      aria-label={`${star} star${star > 1 ? "s" : ""}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onFocus={() => setHover(star)}
                      onBlur={() => setHover(0)}
                    >
                      {/* using a single star glyph and coloring via CSS */}
                      ★
                    </button>
                  );
                })}
              </div>

              <div className="report-issue-stars-hint">
                {rating ? `${rating} / 5` : "Click a star"}
              </div>
            </div>

            </section>

          {/* Either form text OR image upload */}
          <section className="report-issue-section">
            <h2 className="report-issue-section-title">Upload photo if hard to explain!</h2>
            <p>Our team will see the image and act fast!</p>
{/* 
            <label>Small Description of Photo</label>
            <div></div>
            <textarea
              name="issue"
              required
              rows={3}
              placeholder="Describe what’s happening"
              className="report-issue-textarea"
            /> */}

            {/* Drag & drop box */}
            <div
              className="report-issue-dropbox"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}>
              <p>{file ? "Image selected:" : "Drag & drop or click to upload a screenshot (optional)"}</p>

              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                className="report-issue-file"
              />

              {preview && <img src={preview} alt="preview" className="report-issue-preview" />}
            </div>
          </section>


          <div className="report-issue-actions">
            <button type="button" className="report-issue-btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" className="report-issue-btn-primary" disabled={status.state === "submitting"}>
              {status.state === "submitting" ? "Sending…" : "Submit Report"}
            </button>
            {status.state === "success" && (
              <div className="report-issue-popup">
                <div className="report-issue-popup-content">
                  <h3>Report Sent</h3>
                  <p>Thanks for letting us know! We’ve received your report.</p>
                  <button onClick={() => setStatus({ state: "idle", message: "" })}>Close</button>
                </div>
              </div>
            )}

            {/* <span className={`report-issue-status ${status.state}`} aria-live="polite">{status.message}</span> */}
          </div>
        </form>
      </div>
    </div>
  );
}
