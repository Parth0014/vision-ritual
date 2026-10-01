import React from "react";
import type { LifeArea } from "../store/types";

/** Minimal geometric icon per life area. */
export const AreaIcon: React.FC<{ area: LifeArea; size?: number }> = ({
  area,
  size = 20,
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;
  switch (area) {
    case "career":
      return (
        <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
      );
    case "learning":
      return (
        <svg {...common}><path d="M4 19V6a2 2 0 0 1 2-2h13v13H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13" /></svg>
      );
    case "health":
      return (
        <svg {...common}><path d="M12 21C7 16.5 3 13 3 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 9 2.8c0 4.2-4 7.7-9 12.2Z" /></svg>
      );
    case "money":
      return (
        <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 7v10M9.5 9.5c0-1 1-1.8 2.5-1.8s2.5.8 2.5 1.8-1 1.6-2.5 2.2-2.5 1.2-2.5 2.2 1 1.8 2.5 1.8 2.5-.8 2.5-1.8" /></svg>
      );
    case "travel":
      return (
        <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c2.5 2.4 3.8 5 3.8 8S14.5 17.6 12 20c-2.5-2.4-3.8-5-3.8-8S9.5 6.4 12 4Z" /></svg>
      );
    case "relationships":
      return (
        <svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.6-3 2.8-4.6 5.5-4.6s4.9 1.6 5.5 4.6" /><circle cx="17" cy="9" r="2.4" /><path d="M15.5 14.6c2.3.3 4 1.7 4.5 4" /></svg>
      );
  }
};
