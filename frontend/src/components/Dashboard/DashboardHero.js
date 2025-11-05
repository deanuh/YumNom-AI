// src/components/Dashboard/DashboardHero.jsx
import React from "react";
import PropTypes from "prop-types";

const DashboardHero = ({
  title = "Start your personal food journey",
  subtitle = "AI-Powered Dish Recommendations Made Just for You.",
  ctaLabel = "GET STARTED",
  onCta,
  variant = "gradient",
  compact = false,
  rightSlot = null,
}) => {
  return (
    <section
      aria-labelledby="dash-hero-title"
      className={[
        "dashboard-hero",
        `hero-${variant}`,
        compact ? "hero-compact" : "",
      ].join(" ")}
      role="region"
    >
      <div className="hero-left">
        <h2 id="dash-hero-title">{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="hero-right">
        {rightSlot}
        <button type="button" className="hero-cta" onClick={onCta}>
          {ctaLabel}
        </button>
      </div>
    </section>
  );
};

DashboardHero.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  ctaLabel: PropTypes.string,
  onCta: PropTypes.func,
  variant: PropTypes.oneOf(["lavender", "gradient", "outline"]),
  compact: PropTypes.bool,
  rightSlot: PropTypes.node,
};

export default DashboardHero;
