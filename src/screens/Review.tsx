import React from "react";
import { useRitual } from "../store/RitualContext";
import { lifeAreaLabel } from "../lib/content";
import { formatDate } from "../lib/dates";
import { ProgressRing } from "../components/ProgressRing";
import { ScreenHeader } from "../components/ScreenHeader";
import type { Goal, ReviewHit, ReviewItem } from "../store/types";
import "./review.css";

interface Draft {
  hit: ReviewHit | null;
  blocker: string;
  progress: number;
}

type Phase = "idle" | "reviewing" | "summary";

const HIT_OPTIONS: { value: ReviewHit; label: string }[] = [
  { value: "hit", label: "Hit it" },
  { value: "partly", label: "Partly" },
  { value: "missed", label: "Missed" },
];

export const Review: React.FC = () => {
  const { state, submitReview, resetBoard, startNewBoard, exportBackup, importBackup } =
    useRitual();
  const goals = state.goals;

  /* ---------- weekly review flow ---------- */
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [flowGoals, setFlowGoals] = React.useState<Goal[]>([]);
  const [step, setStep] = React.useState(0);
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({});
  const [saved, setSaved] = React.useState(false);

  const startReview = () => {
    if (goals.length === 0) return;
    const initial: Record<string, Draft> = {};
    goals.forEach((g) => {
      initial[g.id] = { hit: null, blocker: "", progress: g.progress };
    });
    setFlowGoals(goals);
    setDrafts(initial);
    setStep(0);
    setSaved(false);
    setPhase("reviewing");
  };

  const updateDraft = (goalId: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [goalId]: { ...prev[goalId], ...patch } }));
  };

  const current = phase === "reviewing" ? flowGoals[step] : undefined;
  const currentDraft = current ? drafts[current.id] : undefined;

  const reviewedItems: ReviewItem[] =
    phase === "summary"
      ? flowGoals
          .filter((g) => drafts[g.id]?.hit)
          .map((g) => ({
            goalId: g.id,
            hit: drafts[g.id].hit as ReviewHit,
            blocker: drafts[g.id].blocker.trim(),
            progress: drafts[g.id].progress,
          }))
      : [];

  const finishReview = () => {
    submitReview(reviewedItems);
    setPhase("idle");
    setFlowGoals([]);
    setDrafts({});
    setSaved(true);
  };

  /* ---------- history ---------- */
  const sortedHistory = React.useMemo(
    () => [...state.history].sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)),
    [state.history],
  );
  const [expandedBoard, setExpandedBoard] = React.useState<string | null>(null);

  const afterReset = goals.length === 0 && state.history.length > 0;

  /* ---------- backup ---------- */
  const [importMsg, setImportMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const doExport = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "vision-ritual-backup.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ok = importBackup(text);
      setImportMsg(
        ok
          ? { ok: true, text: "Backup restored — welcome back." }
          : { ok: false, text: "That file is not a valid Vision Ritual backup." },
      );
    } catch {
      setImportMsg({ ok: false, text: "Could not read that file. Try again." });
    }
    e.target.value = "";
  };

  const [confirmReset, setConfirmReset] = React.useState(false);
  const doReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    setConfirmReset(false);
    resetBoard();
  };

  return (
    <div className="screen rv">
      <ScreenHeader
        eyebrow="Ritual"
        title="Review"
        sub="Pause, look back, and begin again."
      />

      {/* ============ 1. WEEKLY REVIEW ============ */}
      <section className="rv-section" aria-labelledby="rv-weekly-heading">
        {phase === "idle" && (
          <div className="card rv-card">
            <p className="eyebrow" id="rv-weekly-heading">Weekly review</p>
            <p className="rv-last-reviewed">
              {state.lastReviewAt
                ? `Last reviewed ${formatDate(state.lastReviewAt)}`
                : "Not reviewed yet"}
            </p>
            {saved && <p className="rv-confirm">Review saved.</p>}
            {goals.length === 0 ? (
              <p className="sub">Add goals from a new board to review your week.</p>
            ) : (
              <button type="button" className="btn btn-primary rv-block-btn" onClick={startReview}>
                Start weekly review
              </button>
            )}
          </div>
        )}

        {phase === "reviewing" && current && currentDraft && (
          <div className="rv-flow">
            <p className="rv-step">
              Goal {step + 1} of {flowGoals.length}
            </p>
            <div className="card rv-goal-card">
              <div className="rv-goal-head">
                <div>
                  <p className="eyebrow rv-area">{lifeAreaLabel(current.lifeArea)}</p>
                  <h3 className="display rv-goal-title">{current.title}</h3>
                </div>
                <ProgressRing
                  value={currentDraft.progress}
                  size={56}
                  track="#e8dfcd"
                  bar="#221d15"
                  label={`${currentDraft.progress} percent complete`}
                />
              </div>

              {current.ifThenPlan && (
                <blockquote className="rv-plan">“{current.ifThenPlan}”</blockquote>
              )}

              <p className="field-label">Did you hit your if-then plan this week?</p>
              <div className="rv-hit-row" role="group" aria-label="Did you hit your if-then plan this week?">
                {HIT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn rv-hit-btn ${currentDraft.hit === opt.value ? "rv-hit-btn--on" : "btn-ghost"}`}
                    aria-pressed={currentDraft.hit === opt.value}
                    onClick={() => updateDraft(current.id, { hit: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <label className="field-label" htmlFor={`rv-blocker-${current.id}`}>
                What blocked you?
              </label>
              <input
                id={`rv-blocker-${current.id}`}
                type="text"
                className="input"
                placeholder="One line is enough"
                value={currentDraft.blocker}
                onChange={(e) => updateDraft(current.id, { blocker: e.target.value })}
              />

              <div className="rv-progress-row">
                <label className="field-label" htmlFor={`rv-progress-${current.id}`}>
                  Progress
                </label>
                <span className="rv-progress-val">{currentDraft.progress}%</span>
              </div>
              <input
                id={`rv-progress-${current.id}`}
                type="range"
                min={0}
                max={100}
                step={1}
                value={currentDraft.progress}
                onChange={(e) => updateDraft(current.id, { progress: Number(e.target.value) })}
                className="rv-slider"
                aria-valuetext={`${currentDraft.progress} percent`}
              />
            </div>

            <div className="rv-footer">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  updateDraft(current.id, { hit: null });
                  if (step < flowGoals.length - 1) setStep((s) => s + 1);
                  else setPhase("summary");
                }}
              >
                Skip
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!currentDraft.hit}
                onClick={() => {
                  if (step < flowGoals.length - 1) setStep((s) => s + 1);
                  else setPhase("summary");
                }}
              >
                {step === flowGoals.length - 1 ? "See summary" : "Next"}
              </button>
            </div>
          </div>
        )}

        {phase === "summary" && (
          <div className="card rv-card">
            <p className="eyebrow">Review summary</p>
            <h2 className="display rv-summary-title">Your week, at a glance</h2>
            {reviewedItems.length === 0 ? (
              <p className="sub">No goals were recorded — everything was skipped.</p>
            ) : (
              <ul className="rv-summary-list">
                {reviewedItems.map((item) => {
                  const goal = flowGoals.find((g) => g.id === item.goalId);
                  if (!goal) return null;
                  return (
                    <li key={item.goalId} className="rv-summary-row">
                      <span className="rv-summary-title-text">{goal.title}</span>
                      <span className="rv-summary-progress">{item.progress}%</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <button type="button" className="btn btn-primary rv-block-btn" onClick={finishReview}>
              Finish
            </button>
          </div>
        )}
      </section>

      {/* ============ 2. BOARD RESET ============ */}
      <section className="rv-section" aria-labelledby="rv-reset-heading">
        <div className="card rv-card">
          <p className="eyebrow" id="rv-reset-heading">Quarterly reset</p>
          <p className="sub">
            Archive this board into your history and start a fresh one. Achieved goals are
            remembered as “came true”.
          </p>
          {afterReset ? (
            <button type="button" className="btn btn-accent rv-block-btn" onClick={startNewBoard}>
              Begin a new board
            </button>
          ) : (
            <button type="button" className="btn btn-ghost rv-block-btn" onClick={doReset}>
              {confirmReset ? "Tap again to archive" : "Archive & start fresh"}
            </button>
          )}
        </div>
      </section>

      {/* ============ 3. HISTORY ============ */}
      <section className="rv-section" aria-labelledby="rv-history-heading">
        <p className="eyebrow rv-section-title" id="rv-history-heading">Past boards</p>
        {sortedHistory.length === 0 ? (
          <div className="card rv-card">
            <p className="sub">No past boards yet — your resets will live here.</p>
          </div>
        ) : (
          <ul className="rv-history-list">
            {sortedHistory.map((board) => {
              const expanded = expandedBoard === board.id;
              const goalCount = board.goals.length;
              return (
                <li key={board.id} className="card rv-card rv-history-item">
                  <button
                    type="button"
                    className="rv-history-toggle"
                    aria-expanded={expanded}
                    onClick={() => setExpandedBoard(expanded ? null : board.id)}
                  >
                    <span className="rv-history-dates">
                      {formatDate(board.createdAt)} → {formatDate(board.archivedAt)}
                    </span>
                    <span className="rv-history-meta">
                      {goalCount} {goalCount === 1 ? "goal" : "goals"} ·{" "}
                      <strong className="rv-came-true-count">{board.cameTrue} came true</strong>
                    </span>
                    <span className="rv-history-chevron" aria-hidden="true">
                      {expanded ? "–" : "+"}
                    </span>
                  </button>
                  {expanded && (
                    <ul className="rv-board-goals">
                      {board.goals.map((g) => (
                        <li
                          key={g.id}
                          className={`rv-board-goal ${g.achieved ? "" : "rv-board-goal--muted"}`}
                        >
                          <span>{g.title}</span>
                          {g.achieved && <span className="rv-badge">came true</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ============ 4. BACKUP ============ */}
      <section className="rv-section" aria-labelledby="rv-backup-heading">
        <div className="card rv-card">
          <p className="eyebrow" id="rv-backup-heading">Protect your progress</p>
          <div className="rv-backup-row">
            <button type="button" className="btn btn-ghost" onClick={doExport}>
              Export backup
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              Import backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="rv-file-hidden"
              aria-label="Import backup file"
              onChange={onImportFile}
            />
          </div>
          {importMsg && (
            <p className={`rv-import-msg ${importMsg.ok ? "rv-import-msg--ok" : "rv-import-msg--err"}`} role="status">
              {importMsg.text}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};
