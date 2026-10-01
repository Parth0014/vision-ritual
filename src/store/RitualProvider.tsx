import React from "react";
import { RitualContext } from "./RitualContext";
import type {
  Goal,
  GoalDraft,
  ReviewItem,
  RitualState,
} from "./types";
import { newId } from "../lib/id";
import { isToday, isYesterday } from "../lib/dates";

const STORAGE_KEY = "vision-ritual.v1";

const emptyState = (): RitualState => ({
  onboarded: false,
  goals: [],
  checkIns: [],
  gratitude: [],
  history: [],
  lastReviewAt: null,
});

function loadState(): RitualState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<RitualState>;
    if (!parsed || !Array.isArray(parsed.goals)) return emptyState();
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

const clampProgress = (n: number): number =>
  Math.max(0, Math.min(100, Math.round(n)));

export const RitualProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = React.useState<RitualState>(loadState);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable — state still works in memory */
    }
  }, [state]);

  const value = React.useMemo(
    () => ({
      state,

      addGoals: (drafts: GoalDraft[]) => {
        const now = new Date().toISOString();
        const goals: Goal[] = drafts
          .filter((d) => d.title.trim().length > 0)
          .map((d) => ({
            id: newId(),
            title: d.title.trim(),
            lifeArea: d.lifeArea,
            affirmation: d.affirmation.trim(),
            wish: "",
            outcome: "",
            obstacle: "",
            ifThenPlan: "",
            deadline: null,
            milestones: [],
            progress: 0,
            streakDays: 0,
            lastCheckIn: null,
            achieved: false,
            createdAt: now,
          }));
        setState((s) => ({ ...s, onboarded: true, goals: [...s.goals, ...goals] }));
      },

      updateGoal: (id: string, patch: Partial<Goal>) => {
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) => {
            if (g.id !== id) return g;
            const next = { ...g, ...patch };
            if (patch.progress != null) {
              next.progress = clampProgress(patch.progress);
              next.achieved = next.progress >= 100;
            }
            if (patch.achieved === true) next.progress = 100;
            if (patch.achieved === false && g.achieved) next.progress = Math.min(g.progress, 99);
            return next;
          }),
        }));
      },

      deleteGoal: (id: string) => {
        setState((s) => ({
          ...s,
          goals: s.goals.filter((g) => g.id !== id),
          checkIns: s.checkIns.filter((c) => c.goalId !== id),
        }));
      },

      toggleMilestone: (goalId: string, milestoneId: string) => {
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            const milestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, done: !m.done } : m
            );
            // Milestones nudge progress: completion ratio blended lightly.
            const doneCount = milestones.filter((m) => m.done).length;
            const ratio = milestones.length
              ? Math.round((doneCount / milestones.length) * 100)
              : g.progress;
            const progress = clampProgress(Math.max(g.progress, Math.round(g.progress * 0.5 + ratio * 0.5)));
            return {
              ...g,
              milestones,
              progress,
              achieved: progress >= 100,
            };
          }),
        }));
      },

      addMilestone: (goalId: string, label: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) =>
            g.id === goalId
              ? { ...g, milestones: [...g.milestones, { id: newId(), label: trimmed, done: false }] }
              : g
          ),
        }));
      },

      checkIn: (goalId: string, note: string) => {
        const at = new Date().toISOString();
        setState((s) => ({
          ...s,
          goals: s.goals.map((g) => {
            if (g.id !== goalId) return g;
            if (isToday(g.lastCheckIn)) return g; // one check-in per day
            const streakDays = isYesterday(g.lastCheckIn) ? g.streakDays + 1 : 1;
            return { ...g, streakDays, lastCheckIn: at };
          }),
          checkIns: [
            ...s.checkIns,
            { id: newId(), goalId, at, note: note.trim() },
          ],
        }));
      },

      addGratitude: (text: string, goalId?: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;
        setState((s) => ({
          ...s,
          gratitude: [
            ...s.gratitude,
            { id: newId(), at: new Date().toISOString(), text: trimmed, goalId },
          ],
        }));
      },

      submitReview: (items: ReviewItem[]) => {
        const at = new Date().toISOString();
        setState((s) => {
          const byId = new Map(items.map((i) => [i.goalId, i]));
          return {
            ...s,
            lastReviewAt: at,
            goals: s.goals.map((g) => {
              const item = byId.get(g.id);
              if (!item) return g;
              const progress = clampProgress(item.progress);
              return { ...g, progress, achieved: progress >= 100 };
            }),
          };
        });
      },

      resetBoard: () => {
        setState((s) => {
          if (s.goals.length === 0) return s;
          const now = new Date().toISOString();
          const first = s.goals.reduce((a, b) => (a.createdAt < b.createdAt ? a : b));
          return {
            ...s,
            goals: [],
            checkIns: [],
            history: [
              ...s.history,
              {
                id: newId(),
                createdAt: first.createdAt,
                archivedAt: now,
                goals: s.goals,
                cameTrue: s.goals.filter((g) => g.achieved).length,
              },
            ],
          };
        });
      },

      startNewBoard: () => {
        setState((s) => ({ ...s, onboarded: false }));
      },

      exportBackup: () => JSON.stringify(state, null, 2),

      importBackup: (json: string) => {
        try {
          const parsed = JSON.parse(json) as Partial<RitualState>;
          if (!parsed || !Array.isArray(parsed.goals)) return false;
          setState({ ...emptyState(), ...parsed, onboarded: true });
          return true;
        } catch {
          return false;
        }
      },
    }),
    [state]
  );

  return (
    <RitualContext.Provider value={value}>{children}</RitualContext.Provider>
  );
};
