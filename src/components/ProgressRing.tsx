import React from "react";

interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  track?: string;
  bar?: string;
  label?: string;
}

/** SVG progress ring used on tiles, dashboard and review. */
export const ProgressRing: React.FC<Props> = ({
  value,
  size = 44,
  stroke = 5,
  track = "rgba(255,255,255,0.35)",
  bar = "#ffffff",
  label,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span
      className="ring"
      role="img"
      aria-label={label ?? `${Math.round(pct)} percent complete`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bar}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </span>
  );
};
