/** Vision Ritual — goal-first data model. Standalone; no canvas, no editor. */

export type LifeArea =
  | "career"
  | "health"
  | "travel"
  | "relationships"
  | "learning"
  | "money";

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

export interface CheckInEntry {
  id: string;
  goalId: string;
  at: string; // ISO datetime
  note: string;
}

export interface GratitudeEntry {
  id: string;
  at: string; // ISO datetime
  text: string;
  goalId?: string;
}

export interface Goal {
  id: string;
  title: string;
  lifeArea: LifeArea;
  affirmation: string;
  /** WOOP fields */
  wish: string;
  outcome: string;
  obstacle: string;
  ifThenPlan: string;
  deadline: string | null; // yyyy-mm-dd
  milestones: Milestone[];
  /** 0–100 */
  progress: number;
  streakDays: number;
  lastCheckIn: string | null; // ISO datetime
  achieved: boolean;
  createdAt: string; // ISO datetime
}

/** What onboarding collects before a Goal exists. */
export interface GoalDraft {
  title: string;
  lifeArea: LifeArea;
  affirmation: string;
}

export type ReviewHit = "hit" | "partly" | "missed";

export interface ReviewItem {
  goalId: string;
  hit: ReviewHit;
  blocker: string;
  progress: number;
}

/** An archived board from a quarterly/yearly reset. */
export interface BoardSnapshot {
  id: string;
  createdAt: string; // when this board era started
  archivedAt: string; // when it was reset
  goals: Goal[];
  cameTrue: number; // goals achieved at archive time
}

export interface RitualState {
  onboarded: boolean;
  goals: Goal[];
  checkIns: CheckInEntry[];
  gratitude: GratitudeEntry[];
  history: BoardSnapshot[];
  lastReviewAt: string | null; // ISO datetime
}
