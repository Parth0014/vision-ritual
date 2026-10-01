import React from "react";
import { useRitual } from "../store/RitualContext";
import { lifeAreaLabel } from "../lib/content";
import { dayKey, dayKeyOf, isToday, formatDay } from "../lib/dates";
import { AreaIcon } from "../components/AreaIcon";
import { ScreenHeader } from "../components/ScreenHeader";
import type { Goal, GratitudeEntry } from "../store/types";
import "./today.css";

const plural = (n: number, one: string, many: string) =>
  n === 1 ? one : many;

const streakLabel = (goal: Goal): string =>
  goal.streakDays > 0
    ? `${goal.streakDays}-day ${plural(goal.streakDays, "streak", "streak")}`
    : "Start your streak today";

/** One goal's check-in: note + Done button, or a calm completed state. */
const GoalCheckInCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const { checkIn } = useRitual();
  const [note, setNote] = React.useState("");
  const done = isToday(goal.lastCheckIn);

  const submit = () => {
    if (note.trim().length === 0) return;
    checkIn(goal.id, note.trim());
    setNote("");
  };

  return (
    <section className="card today__goal" aria-label={goal.title}>
      <div className="today__goal-head">
        <span className="today__area-icon" aria-hidden="true">
          <AreaIcon area={goal.lifeArea} size={22} />
        </span>
        <div className="today__goal-meta">
          <h2 className="today__goal-title">{goal.title}</h2>
          <p className="today__goal-area">{lifeAreaLabel(goal.lifeArea)}</p>
        </div>
        <span
          className={`today__streak ${
            done ? "today__streak--done" : goal.streakDays > 0 ? "today__streak--active" : ""
          }`}
        >
          {streakLabel(goal)}
        </span>
      </div>

      {done ? (
        <p className="today__done-note">Done for today — see you tomorrow.</p>
      ) : (
        <>
          {goal.ifThenPlan.trim().length > 0 && (
            <p className="today__plan">
              <span className="today__plan-label">Your plan: </span>
              {goal.ifThenPlan}
            </p>
          )}
          <textarea
            className="textarea today__note"
            aria-label={`What did you do today toward "${goal.title}"?`}
            placeholder="What did you do today toward this tile?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <div className="today__actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={note.trim().length === 0}
              onClick={submit}
            >
              Done
            </button>
          </div>
        </>
      )}
    </section>
  );
};

/** Gratitude capture + today's entries. */
const GratitudeCard: React.FC = () => {
  const { state, addGratitude } = useRitual();
  const [text, setText] = React.useState("");
  const [goalId, setGoalId] = React.useState("");

  const todays = state.gratitude.filter(
    (e: GratitudeEntry) => dayKeyOf(e.at) === dayKey()
  );

  const save = () => {
    if (text.trim().length === 0) return;
    addGratitude(text.trim(), goalId === "" ? undefined : goalId);
    setText("");
    setGoalId("");
  };

  const entryGoal = (e: GratitudeEntry): Goal | undefined =>
    e.goalId ? state.goals.find((g) => g.id === e.goalId) : undefined;

  return (
    <section className="card today__gratitude" aria-label="Gratitude">
      <p className="eyebrow">Gratitude</p>
      <textarea
        className="textarea"
        aria-label="What are you grateful for today"
        placeholder="One thing you're grateful for today…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
      />
      <div className="today__gratitude-row">
        <select
          className="select today__gratitude-select"
          aria-label="Attach gratitude to"
          value={goalId}
          onChange={(e) => setGoalId(e.target.value)}
        >
          <option value="">Just today</option>
          {state.goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn-accent"
          disabled={text.trim().length === 0}
          onClick={save}
        >
          Save
        </button>
      </div>

      {todays.length > 0 && (
        <ul className="today__gratitude-list">
          {todays.map((e) => {
            const g = entryGoal(e);
            return (
              <li key={e.id} className="today__gratitude-item">
                <p className="today__gratitude-text">{e.text}</p>
                {g && (
                  <p className="today__gratitude-tag">
                    <AreaIcon area={g.lifeArea} size={14} /> {g.title}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export const Today: React.FC<{ onOpenGoals: () => void }> = ({ onOpenGoals }) => {
  const { state, startNewBoard } = useRitual();

  if (state.goals.length === 0) {
    return (
      <div className="screen today today--empty">
        <ScreenHeader
          eyebrow="Daily ritual"
          title={formatDay(new Date().toISOString())}
          sub="One small step per goal. That's the whole ritual."
        />
        <section className="card today__empty">
          <p className="eyebrow">No board yet</p>
          <p className="today__empty-text">
            Start a new board to set your goals — then this screen becomes your
            daily check-in.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={startNewBoard}
          >
            Begin a new board
          </button>
        </section>
      </div>
    );
  }

  const checkedIn = state.goals.filter((g) => isToday(g.lastCheckIn)).length;
  const totalStreak = state.goals.reduce((sum, g) => sum + g.streakDays, 0);
  const allDone = checkedIn === state.goals.length;

  return (
    <div className="screen today">
      <ScreenHeader
        eyebrow="Daily ritual"
        title={formatDay(new Date().toISOString())}
        sub="One small step per goal. That's the whole ritual."
      />

      <section className="card today__summary" aria-label="Today's progress">
        <div className="today__summary-main">
          <p className="today__summary-count">
            {checkedIn} of {state.goals.length}{" "}
            {plural(state.goals.length, "goal", "goals")} checked in
          </p>
          <p className="today__summary-streak">
            {totalStreak} combined {plural(totalStreak, "streak day", "streak days")}
          </p>
        </div>
        <div
          className="today__summary-bar"
          role="progressbar"
          aria-valuenow={checkedIn}
          aria-valuemin={0}
          aria-valuemax={state.goals.length}
          aria-label="Goals checked in today"
        >
          <span
            className="today__summary-fill"
            style={{
              width: `${
                state.goals.length === 0
                  ? 0
                  : (checkedIn / state.goals.length) * 100
              }%`,
            }}
          />
        </div>
        {allDone && (
          <p className="today__summary-done">
            Ritual complete. Enjoy the rest of your day.
          </p>
        )}
      </section>

      <div className="today__goals">
        {state.goals.map((goal) => (
          <GoalCheckInCard key={goal.id} goal={goal} />
        ))}
      </div>

      <GratitudeCard />

      <button
        type="button"
        className="btn btn-ghost today__goals-link"
        onClick={onOpenGoals}
      >
        Open goal details
      </button>
    </div>
  );
};
