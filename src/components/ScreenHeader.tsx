import React from "react";

export const ScreenHeader: React.FC<{
  eyebrow?: string;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}> = ({ eyebrow, title, sub, action }) => (
  <header className="shead">
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <h1 className="display">{title}</h1>
      {action}
    </div>
    {sub && <p className="sub">{sub}</p>}
  </header>
);
