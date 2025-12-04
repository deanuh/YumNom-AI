import React from "react";

export default function DashboardSection({ title, viewAllHref, children }) {
  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h3>{title}</h3>
        {viewAllHref && (
          <a className="view-all-btn" href={viewAllHref}>
            View all ❯
          </a>
        )}
      </div>
      {children}
    </div>
  );
}
