import React from "react";

export type TabId = "today" | "board" | "goals" | "review";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "today",
    label: "Today",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" />
      </svg>
    ),
  },
  {
    id: "board",
    label: "Board",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    id: "goals",
    label: "Goals",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "review",
    label: "Review",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
      </svg>
    ),
  },
];

export const TabBar: React.FC<{
  active: TabId;
  onChange: (t: TabId) => void;
}> = ({ active, onChange }) => (
  <nav className="tabbar" aria-label="Primary">
    {TABS.map((t) => (
      <button
        key={t.id}
        type="button"
        className={`tabbar__btn${active === t.id ? " tabbar__btn--active" : ""}`}
        aria-current={active === t.id ? "page" : undefined}
        onClick={() => onChange(t.id)}
      >
        {t.icon}
        {t.label}
        <span className="tabbar__dot" aria-hidden="true" />
      </button>
    ))}
  </nav>
);
