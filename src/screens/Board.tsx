import React from "react";
import { useRitual } from "../store/RitualContext";
import { lifeAreaMeta, lifeAreaLabel } from "../lib/content";
import { ProgressRing } from "../components/ProgressRing";
import { AreaIcon } from "../components/AreaIcon";
import { ScreenHeader } from "../components/ScreenHeader";
import type { Goal } from "../store/types";
import "./board.css";

const PLAN_PREVIEW_MAX = 90;

const truncate = (text: string, max = PLAN_PREVIEW_MAX): string => {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 40 ? cut.slice(0, lastSpace) : cut}\u2026`;
};

/** Collage variation by displayed position — zero manual layout required. */
const tileSpanClass = (index: number): string => {
  if (index % 5 === 0) return "tile--wide";
  if (index % 5 === 3) return "tile--tall";
  return "";
};

const GoalTile: React.FC<{
  goal: Goal;
  index: number;
  onOpenWallpaper: (goalId?: string) => void;
}> = ({ goal, index, onOpenWallpaper }) => {
  const meta = lifeAreaMeta(goal.lifeArea);
  const spanClass = tileSpanClass(index);
  const className = `tile${goal.achieved ? " tile--achieved" : ""}${spanClass ? ` ${spanClass}` : ""}`;
  const streak = goal.streakDays > 0 ? `${goal.streakDays}-day streak` : "No streak yet";
  const plan = goal.ifThenPlan.trim();
  const affirmation = goal.affirmation.trim();

  return (
    <button
      type="button"
      className={className}
      style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.colorDeep})` }}
      aria-label={`Open wallpaper for ${goal.title}`}
      onClick={() => onOpenWallpaper(goal.id)}
    >
      <span className="tile__area">
        <AreaIcon area={goal.lifeArea} size={16} />
        {lifeAreaLabel(goal.lifeArea)}
      </span>
      <span className="display tile__title">{goal.title}</span>
      {affirmation && <span className="tile__affirm">{affirmation}</span>}
      {plan && <span className="tile__plan">{truncate(plan)}</span>}
      <span className="tile__foot">
        <ProgressRing
          value={goal.progress}
          size={44}
          track="rgba(255,255,255,0.35)"
          bar="#ffffff"
          label={`${goal.title}: ${Math.round(goal.progress)} percent complete`}
        />
        <span className="tile__streak">{streak}</span>
      </span>
      {goal.achieved && (
        <span className="tile__stamp" aria-hidden="true">
          Achieved
        </span>
      )}
    </button>
  );
};

export const Board: React.FC<{ onOpenWallpaper: (goalId?: string) => void }> = ({ onOpenWallpaper }) => {
  const { state, startNewBoard } = useRitual();
  // Non-achieved first in creation order; achieved last.
  const ordered = [...state.goals].sort((a, b) => Number(a.achieved) - Number(b.achieved));

  return (
    <div className="screen">
      <ScreenHeader
        eyebrow="Your board"
        title="My 12-month board"
        sub="Generated from your goals — it comes alive as you act."
        action={
          <button type="button" className="btn btn-ghost" onClick={() => onOpenWallpaper()}>
            Wallpaper
          </button>
        }
      />
      {ordered.length === 0 ? (
        <div className="board-empty">
          <p className="eyebrow">A ritual begins</p>
          <h2 className="display board-empty__title">Your board is waiting</h2>
          <p className="sub">Set your goals and watch this space come alive.</p>
          <button type="button" className="btn btn-accent board-empty__btn" onClick={() => startNewBoard()}>
            Begin a new board
          </button>
        </div>
      ) : (
        <div className="board-grid">
          {ordered.map((goal, i) => (
            <GoalTile key={goal.id} goal={goal} index={i} onOpenWallpaper={onOpenWallpaper} />
          ))}
        </div>
      )}
    </div>
  );
};
