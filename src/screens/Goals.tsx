import React, { useState } from "react";
import { useRitual } from "../store/RitualContext";
import { LIFE_AREAS, lifeAreaLabel, OBSTACLE_PROMPTS } from "../lib/content";
import { daysUntil } from "../lib/dates";
import { ProgressRing } from "../components/ProgressRing";
import { AreaIcon } from "../components/AreaIcon";
import { ScreenHeader } from "../components/ScreenHeader";
import type { Goal } from "../store/types";
import "./goals.css";

type WoopKey = "wish" | "outcome" | "obstacle" | "ifThenPlan";

const WOOP_FIELDS: readonly { key: WoopKey; label: string; explainer: string }[] = [
  { key: "wish", label: "Wish", explainer: "What do you want? Make it specific." },
  { key: "outcome", label: "Outcome", explainer: "Picture it already done — how does it feel?" },
  { key: "obstacle", label: "Obstacle", explainer: "What will get in the way? Name it honestly." },
  {
    key: "ifThenPlan",
    label: "If–then plan",
    explainer: "One concrete plan: If [situation], then I will [action].",
  },
];

const deadlineText = (deadline: string | null): string => {
  if (!deadline) return "No deadline";
  const n = daysUntil(deadline);
  if (n === 0) return "Due today";
  if (n === 1) return "1 day left";
  if (n > 1) return `${n} days left`;
  if (n === -1) return "Overdue by 1 day";
  return `Overdue by ${-n} days`;
};

const streakText = (days: number): string =>
  days > 0 ? `${days}-day streak` : "No streak yet";

export const Goals: React.FC<{ onOpenWallpaper: (goalId?: string) => void }> = ({
  onOpenWallpaper,
}) => {
  const { state, startNewBoard } = useRitual();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    selectedId != null ? state.goals.find((g) => g.id === selectedId) ?? null : null;

  if (state.goals.length === 0) {
    return (
      <div className="screen">
        <ScreenHeader eyebrow="Your goals" title="Goals" />
        <div className="empty goals__empty">
          <p className="display">A fresh page</p>
          <p className="sub">
            Your goals live here. Begin a new board to name what this season is about.
          </p>
          <button
            type="button"
            className="btn btn-primary goals__empty-btn"
            onClick={startNewBoard}
          >
            Begin a new board
          </button>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="screen">
        <GoalDetail
          goal={selected}
          onBack={() => setSelectedId(null)}
          onOpenWallpaper={onOpenWallpaper}
        />
      </div>
    );
  }

  const grouped = LIFE_AREAS.map((area) => ({
    area,
    goals: state.goals.filter((g) => g.lifeArea === area.id),
  })).filter((g) => g.goals.length > 0);

  return (
    <div className="screen">
      <ScreenHeader
        eyebrow="Your goals"
        title="Goals"
        action={
          <button
            type="button"
            className="btn btn-ghost goals__wallpaper-btn"
            onClick={() => onOpenWallpaper()}
          >
            Wallpaper
          </button>
        }
      />
      {grouped.map(({ area, goals }) => (
        <section key={area.id} className="goals__group" aria-label={area.label}>
          <h2 className="goals__group-label">
            <span className="goals__group-icon" style={{ color: area.color }}>
              <AreaIcon area={area.id} size={16} />
            </span>
            {area.label}
          </h2>
          <div className="goals__rows">
            {goals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                className="goals__row"
                aria-label={`Open ${goal.title}`}
                onClick={() => setSelectedId(goal.id)}
              >
                <span className="goals__row-icon" style={{ color: goal.achieved ? "#8d8471" : "#b4552d" }}>
                  <AreaIcon area={goal.lifeArea} size={22} />
                </span>
                <span className="goals__row-main">
                  <span className="goals__row-title">{goal.title}</span>
                  <span className="goals__row-meta">
                    {lifeAreaLabel(goal.lifeArea)}
                    <span className="goals__dot" aria-hidden="true" />
                    {streakText(goal.streakDays)}
                    <span className="goals__dot" aria-hidden="true" />
                    {deadlineText(goal.deadline)}
                  </span>
                  {goal.achieved && <span className="goals__badge">Achieved</span>}
                </span>
                <ProgressRing
                  value={goal.progress}
                  size={40}
                  stroke={5}
                  track="#e8dfcd"
                  bar="#221d15"
                  label={`${Math.round(goal.progress)} percent complete`}
                />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const GoalDetail: React.FC<{
  goal: Goal;
  onBack: () => void;
  onOpenWallpaper: (goalId?: string) => void;
}> = ({ goal, onBack, onOpenWallpaper }) => {
  const { updateGoal, deleteGoal, toggleMilestone, addMilestone } = useRitual();
  const [newMilestone, setNewMilestone] = useState("");

  const setWoop = (field: WoopKey, value: string): void => {
    const patch: { [K in WoopKey]?: string } = { [field]: value };
    updateGoal(goal.id, patch);
  };

  const handleAddMilestone = (): void => {
    const label = newMilestone.trim();
    if (!label) return;
    addMilestone(goal.id, label);
    setNewMilestone("");
  };

  const handleDelete = (): void => {
    if (window.confirm("Delete this goal?")) {
      deleteGoal(goal.id);
      onBack();
    }
  };

  return (
    <div className="goals__detail">
      <button type="button" className="btn btn-ghost goals__back" onClick={onBack}>
        ← All goals
      </button>

      <input
        className="display goals__title-input"
        value={goal.title}
        aria-label="Goal title"
        onChange={(e) => updateGoal(goal.id, { title: e.target.value })}
      />

      <div className="goals__meta">
        <span className="goals__area-chip">
          <AreaIcon area={goal.lifeArea} size={14} />
          {lifeAreaLabel(goal.lifeArea)}
        </span>
        <label className="goals__deadline">
          <span className="field-label">Deadline</span>
          <input
            type="date"
            className="input goals__date-input"
            value={goal.deadline ?? ""}
            onChange={(e) => updateGoal(goal.id, { deadline: e.target.value || null })}
          />
        </label>
      </div>
      <p className="field-hint goals__countdown">{deadlineText(goal.deadline)}</p>

      {goal.affirmation.trim() !== "" && (
        <blockquote className="goals__quote">“{goal.affirmation}”</blockquote>
      )}

      <div className="card goals__woop">
        <p className="eyebrow">Your WOOP</p>
        {WOOP_FIELDS.map((f) => (
          <div key={f.key} className="goals__woop-field">
            <label className="field-label" htmlFor={`woop-${f.key}`}>
              {f.label}
            </label>
            <p className="field-hint goals__explainer">{f.explainer}</p>
            <textarea
              id={`woop-${f.key}`}
              className="textarea"
              value={goal[f.key]}
              onChange={(e) => setWoop(f.key, e.target.value)}
              rows={3}
            />
            {f.key === "obstacle" && (
              <div className="goals__chips">
                {OBSTACLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="goals__chip"
                    onClick={() => setWoop("obstacle", prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card goals__milestones">
        <p className="eyebrow">Milestones</p>
        {goal.milestones.length === 0 && (
          <p className="field-hint">Break it down into small steps worth celebrating.</p>
        )}
        <ul className="goals__milestone-list">
          {goal.milestones.map((m) => (
            <li key={m.id} className="goals__milestone">
              <input
                type="checkbox"
                id={`ms-${m.id}`}
                checked={m.done}
                onChange={() => toggleMilestone(goal.id, m.id)}
              />
              <label htmlFor={`ms-${m.id}`} className={m.done ? "goals__done" : undefined}>
                {m.label}
              </label>
            </li>
          ))}
        </ul>
        <div className="goals__add-row">
          <input
            className="input"
            value={newMilestone}
            placeholder="Add a small step…"
            aria-label="New milestone"
            onChange={(e) => setNewMilestone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddMilestone();
            }}
          />
          <button type="button" className="btn btn-ghost" onClick={handleAddMilestone}>
            Add
          </button>
        </div>
      </div>

      <div className="card goals__progress">
        <div className="goals__progress-head">
          <p className="eyebrow">Progress</p>
          <span className="goals__progress-value">{goal.progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={goal.progress}
          aria-label="Goal progress"
          className="goals__slider"
          onChange={(e) => updateGoal(goal.id, { progress: Number(e.target.value) })}
        />
      </div>

      <div className="goals__footer">
        <button
          type="button"
          className="btn btn-primary goals__footer-wide"
          onClick={() => onOpenWallpaper(goal.id)}
        >
          Set as wallpaper
        </button>
        {goal.achieved ? (
          <div className="goals__achieved-row">
            <span className="goals__badge goals__badge--big">Achieved ✓</span>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => updateGoal(goal.id, { achieved: false })}
            >
              Reopen goal
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-soft goals__footer-wide"
            onClick={() => updateGoal(goal.id, { achieved: true })}
          >
            Mark achieved
          </button>
        )}
        <button
          type="button"
          className="btn btn-ghost goals__danger"
          onClick={handleDelete}
        >
          Delete goal
        </button>
      </div>
    </div>
  );
};
