import React from "react";
import Sidebar from "../components/Sidebar";

const SidebarPreview = () => {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "3rem" }}>
        <h2>Sidebar Preview</h2>
        <p>This is a placeholder area to preview sidebar layout and spacing.</p>
      </div>
    </div>
  );
};

export default SidebarPreview;
