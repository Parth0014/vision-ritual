import React from "react";
import type { Goal, GoalDraft, ReviewItem } from "./types";

export interface RitualContextValue {
  state: import("./types").RitualState;
  /** Create goals from onboarding drafts; marks the user onboarded. */
  addGoals: (drafts: GoalDraft[]) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addMilestone: (goalId: string, label: string) => void;
  /** Daily check-in for one goal; updates streak + progress nudge. */
  checkIn: (goalId: string, note: string) => void;
  addGratitude: (text: string, goalId?: string) => void;
  /** Weekly review: applies per-goal progress updates. */
  submitReview: (items: ReviewItem[]) => void;
  /** Archive the current board into history and start fresh. */
  resetBoard: () => void;
  /** Re-open onboarding to begin a brand-new board. */
  startNewBoard: () => void;
  exportBackup: () => string;
  /** Returns true on success, false on invalid payload. */
  importBackup: (json: string) => boolean;
}

const RitualContext = React.createContext<RitualContextValue | null>(null);

export const useRitual = (): RitualContextValue => {
  const ctx = React.useContext(RitualContext);
  if (!ctx) throw new Error("useRitual must be used inside RitualProvider");
  return ctx;
};

export { RitualContext };
